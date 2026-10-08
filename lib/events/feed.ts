import { withSourceBudget } from './request-budget';
import {deduplicateEvents} from './merge';
import { database } from '@/db/postgres';
import { fetchFilmekimi } from './source';
import { fetchIksv,fetchIbb,fetchKultur,fetchPasso,findVenue } from './adapters';
import { isUpcoming, type CultureEvent, type EventFeed, type SourceStatus } from './model';
type Row={payload:string;checked_at:string|null;retry_after:number;error:string|null};
const sources=[
 {id:'filmekimi',name:'Filmekimi',url:'https://filmekimi.iksv.org/tr/program',fetch:fetchFilmekimi,scope:'İstanbul seansları'},
 {id:'theatre',name:'İKSV · Tiyatro',url:'https://tiyatro.iksv.org/tr/etkinlikler',fetch:()=>fetchIksv('theatre'),scope:'Festival programı'},
 {id:'salon',name:'İKSV · Fiba Salon',url:'https://www.fibasaloniksv.com/tr',fetch:()=>fetchIksv('salon'),scope:'Salon programı'},
 {id:'kultur',name:'İBB · Kültür İstanbul',url:'https://kultur.istanbul/etkinlikler/',fetch:fetchKultur,scope:'Resmî etkinlik takvimi'},
 {id:'ibb',name:'İBB Kültür Sanat',url:'https://kultursanat.istanbul/etkinliklerimiz',fetch:fetchIbb,scope:'Önümüzdeki 90 gün'},
 {id:'passo',name:'Passo',url:'https://www.passo.com.tr/tr',fetch:fetchPasso,scope:'Öne çıkan tarihli İstanbul etkinlikleri'},
];
async function loadSource(source:typeof sources[number]):Promise<{events:CultureEvent[];status:SourceStatus}>{
 const db=database();if(!db)throw new Error('DATABASE_URL is not configured');
 await db.prepare('INSERT OR IGNORE INTO event_feeds(id) VALUES (?)').bind(source.id).run();
 let row=await db.prepare('SELECT * FROM event_feeds WHERE id=?').bind(source.id).first<Row>();const now=Date.now();
 if((!row?.checked_at||now-Date.parse(row.checked_at)>6*3600000)&&(row?.retry_after??0)<now){
  const lock=await db.prepare('UPDATE event_feeds SET retry_after=? WHERE id=? AND retry_after<?').bind(now+180000,source.id,now).run();
  if(lock.meta.changes){try{
   const events=await withSourceBudget(source.fetch);
   await db.prepare('UPDATE event_feeds SET payload=?, checked_at=?, retry_after=0, error=NULL WHERE id=?').bind(JSON.stringify(events),new Date().toISOString(),source.id).run();
  }catch{
   await db.prepare('UPDATE event_feeds SET retry_after=?,error=? WHERE id=?').bind(Date.now()+30*60000,'Kaynak şu anda yenilenemedi.',source.id).run();
  }
  row=await db.prepare('SELECT * FROM event_feeds WHERE id=?').bind(source.id).first<Row>();}
 }
 const events=(JSON.parse(row?.payload??'[]') as CultureEvent[]).filter(e=>isUpcoming(e)).map(e=>({...e,sourceId:e.sourceId??source.id,venueId:(e.venueName?findVenue(e.venueName)?.id:undefined)??e.venueId}));
 return {events,status:{id:source.id,name:source.name,url:source.url,scope:source.scope,checkedAt:row?.checked_at??null,stale:!row?.checked_at||Date.now()-Date.parse(row.checked_at)>6*3600000,error:row?.error??null,count:events.length}};
}
export async function getEventFeed():Promise<EventFeed>{
 const results=await Promise.allSettled(sources.map(loadSource));const events:CultureEvent[]=[];const status:SourceStatus[]=[];
 results.forEach((r,i)=>{if(r.status==='fulfilled'){events.push(...r.value.events);status.push(r.value.status);}else{const s=sources[i];status.push({id:s.id,name:s.name,url:s.url,scope:s.scope,checkedAt:null,stale:true,error:'Kaynak yüklenemedi.',count:0});}});
 const checked=status.map(s=>s.checkedAt).filter((s):s is string=>!!s).sort();
 return {events:deduplicateEvents(events),sources:status,checkedAt:checked[0]??null,stale:status.some(s=>s.stale),error:!database()?'Etkinlik programı şu anda hazır değil. Şehir rotalarıyla keşfe devam edebilirsin.':status.every(s=>s.error)?'Etkinlik kaynakları şu anda yüklenemedi. Resmî kaynak bağlantılarından programı kontrol edebilirsin.':null};
}
