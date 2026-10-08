import {distanceKm,type Stop} from '@/lib/routes';
import {landmarks,venues,venueFor,walkMinutes,activeOn,sameShore,type CultureEvent} from './model';
export type PlannedEvent={event:CultureEvent;start:string;duration:number};
export type PlanWindow={originId:string;start:string;end:string;placement:'before'|'after'|'both'};
export type DayPlan={id:string;title:string;theme:string;date:string;events:PlannedEvent[];landmarkIds:string[];beforeMinutes?:number;maxKm?:number;window?:PlanWindow;createdAt:string};
export type TimelineItem={id:string;kind:'origin'|'event'|'landmark';name:string;start:string;end:string;stop:Stop|null;sourceUrl?:string;tip?:string;walkAfter?:number;idleAfter?:number};
export const startPoints=[...venues.map(v=>({id:'venue:'+v.id,name:v.name,area:v.area,lat:v.lat,lng:v.lng,asia:v.area==='Kadıköy'})),...landmarks.map(s=>({id:'landmark:'+s.id,name:s.name,area:/^m/.test(s.id)?'Kadıköy':'Avrupa yakası',lat:s.lat,lng:s.lng,asia:/^m/.test(s.id)}))];
export function validateSelection(items:PlannedEvent[],maxKm:number,window?:PlanWindow){
 const sorted=[...items].sort((a,b)=>a.start.localeCompare(b.start));const errors:string[]=[];
 if(!sorted.length)return ['Planına en az bir etkinlik ekle.'];
 if(sorted.length>6)errors.push('Bir günlük plana en fazla 6 etkinlik eklenebilir.');
 const date=sorted[0].start.slice(0,10);
 for(const item of sorted){
  if(!Number.isFinite(Date.parse(item.start))||!Number.isInteger(item.duration)||item.duration<15||item.duration>480){errors.push(`${item.event.title}: geçerli saat ve süre seç.`);continue;}
  if(item.start.slice(0,10)!==date)errors.push('Etkinliklerin aynı İstanbul gününde olması gerekiyor.');
  if(!activeOn(item.event,item.start.slice(0,10)))errors.push(`${item.event.title}: tarih resmî etkinlik aralığının dışında.`);
  if(item.event.timeKnown!==false&&Date.parse(item.start)!==Date.parse(item.event.startsAt))errors.push(`${item.event.title}: resmî başlangıç saatini kullan.`);
  if(Date.parse(item.start)<=Date.now())errors.push(`${item.event.title}: bu başlangıç saati geçmiş.`);
  if(!venueFor(item.event))errors.push(`${item.event.title}: mekân koordinatı henüz doğrulanmadığı için otomatik rota kurulamıyor.`);
 }
 for(let i=1;i<sorted.length;i++){
  const previous=sorted[i-1],next=sorted[i],a=venueFor(previous.event),b=venueFor(next.event);if(!a||!b)continue;
  if(!sameShore(a,b)){errors.push(`${a.name} ile ${b.name} farklı yakalarda. Yaya rotası için aynı yakadan etkinlik seç.`);continue;}
  if(distanceKm(a,b)>maxKm)errors.push(`${a.name} ile ${b.name} seçtiğin ${maxKm} km yakınlık sınırının dışında.`);
  if(Date.parse(previous.start)+previous.duration*60000+(walkMinutes(a,b)+15)*60000>Date.parse(next.start))errors.push(`${previous.event.title} sonrası ${next.event.title} için yürüyüş ve 15 dk varış payı sığmıyor.`);
 }
 if(window){
  const origin=startPoints.find(p=>p.id===window.originId),first=venueFor(sorted[0].event),last=sorted.at(-1)!;
  if(!origin)errors.push('Başlangıç noktanı seç.');
  if(!Number.isFinite(Date.parse(window.start))||!Number.isFinite(Date.parse(window.end))||window.start.slice(0,10)!==date||window.end.slice(0,10)!==date||Date.parse(window.end)<=Date.parse(window.start))errors.push('Başlangıç ve bitiş saatlerini aynı gün içinde sıralı seç.');
  if(Date.parse(window.start)<=Date.now())errors.push('Yola çıkış saatin geçmiş; başlangıç saatini güncelle.');
  if(origin&&first){
   if(origin.asia!==(first.area==='Kadıköy'))errors.push('Başlangıç ve ilk etkinlik farklı yakalarda. Yaya rotası için aynı yakadan başlangıç seç.');
   if(distanceKm(origin,first)>maxKm)errors.push('Başlangıç noktan ilk etkinliğin yakınlık sınırı dışında. Başlangıcı veya sınırı değiştir.');
   if(Date.parse(window.start)+(walkMinutes(origin,first)+15)*60000>Date.parse(sorted[0].start))errors.push('Başlangıçtan ilk etkinliğe yürüyüş ve 15 dk erken varış payı sığmıyor. Daha erken yola çık.');
  }
  if(Date.parse(last.start)+last.duration*60000>Date.parse(window.end))errors.push('Son etkinlik için ayırdığın süre günün bitiş saatini aşıyor.');
 }
 return [...new Set(errors)];
}
export function buildTimeline(events:PlannedEvent[],landmarkIds:string[],beforeMinutes:number,window?:PlanWindow,maxKm=3){
 const sorted=[...events].sort((a,b)=>a.start.localeCompare(b.start));const timeline:TimelineItem[]=[];let pending=landmarkIds.flatMap(id=>{const s=landmarks.find(p=>p.id===id);return s?[s]:[]});
 const origin=window?startPoints.find(p=>p.id===window.originId):undefined;
 if(origin&&Number.isFinite(Date.parse(window!.start)))timeline.push({id:'origin',kind:'origin',name:origin.name,start:window!.start,end:window!.start,stop:{...origin,position:0,note:''},tip:'Seçtiğin başlangıç noktası ve yola çıkış saati.'});
 function insert(earliest:number,deadline:number,from:{lat:number;lng:number}|null,to:{lat:number;lng:number}|null,asia:boolean,limit:number){
  let cursor=earliest,current=from,count=0;
  while(count<limit){
   const candidates=pending.filter(s=>(/^m/.test(s.id)===asia)&&(!current||distanceKm(s,current)<=maxKm)&&(!to||distanceKm(s,to)<=maxKm)).sort((a,b)=>current?distanceKm(a,current)-distanceKm(b,current):0);
   const stop=candidates.find(s=>cursor+((current?walkMinutes(current,s):0)+15+(to?walkMinutes(s,to):0))*60000<=deadline);
   if(!stop)break;cursor+=(current?walkMinutes(current,stop):0)*60000;
   timeline.push({id:stop.id,kind:'landmark',name:stop.name,start:new Date(cursor).toISOString(),end:new Date(cursor+15*60000).toISOString(),stop,tip:stop.tip});cursor+=15*60000;current=stop;count++;pending=pending.filter(s=>s.id!==stop.id);
  }
 }
 for(let i=0;i<sorted.length;i++){
  const item=sorted[i],venue=venueFor(item.event);if(!venue||!Number.isFinite(Date.parse(item.start))||!Number.isFinite(item.duration))continue;
  const previous=sorted[i-1],previousVenue=previous?venueFor(previous.event):null;
  const earliest=previous?Date.parse(previous.start)+previous.duration*60000:window?Date.parse(window.start):Date.parse(item.start)-beforeMinutes*60000;
  if(!window||window.placement==='both'||(i===0&&window.placement==='before'))insert(earliest,Date.parse(item.start)-15*60000,i===0?origin??null:previousVenue??null,venue,venue.area==='Kadıköy',i===0?4:2);
  timeline.push({id:item.event.id,kind:'event',name:item.event.title,start:item.start,end:new Date(Date.parse(item.start)+item.duration*60000).toISOString(),stop:{id:venue.id,position:timeline.length,name:venue.name,note:'',lat:venue.lat,lng:venue.lng},sourceUrl:item.event.sourceUrl});
 }
 if(window&&window.placement!=='before'&&sorted.length){const last=sorted.at(-1)!,venue=venueFor(last.event);if(venue)insert(Date.parse(last.start)+last.duration*60000,Date.parse(window.end),venue,null,venue.area==='Kadıköy',4);}
 for(let i=0;i<timeline.length-1;i++){const a=timeline[i].stop,b=timeline[i+1].stop;if(a&&b){timeline[i].walkAfter=walkMinutes(a,b);const idle=Math.floor((Date.parse(timeline[i+1].start)-Date.parse(timeline[i].end))/60000)-timeline[i].walkAfter!-(timeline[i+1].kind==='event'?15:0);if(idle>0)timeline[i].idleAfter=idle;}}
 return {timeline,omitted:pending.map(s=>s.name)};
}
export function suggestEvents(feed:CultureEvent[],selected:PlannedEvent[],theme:string,maxKm:number,window:PlanWindow){
 const preferred:Record<string,string[]>={cinema:['Film'],stage:['Tiyatro','Konser'],literature:['Söyleşi','Atölye'],history:['Sergi']};
 const sorted=[...selected].sort((a,b)=>a.start.localeCompare(b.start));if(!sorted.length)return [];
 const first=sorted[0],last=sorted.at(-1)!;const date=first.start.slice(0,10);
 return feed.flatMap(event=>{
  if(selected.some(s=>s.event.id===event.id)||!venueFor(event)||!activeOn(event,date))return [];
  const duration=event.category==='Film'?120:90;
  const candidates=event.timeKnown===false?Array.from({length:48},(_,i)=>date+'T'+String(Math.floor(i/2)).padStart(2,'0')+':'+(i%2?'30':'00')+':00+03:00'):[event.startsAt];
  const start=candidates.find(start=>!validateSelection([...selected,{event,start,duration}],maxKm,window).length);
  if(!start)return [];const slot=Date.parse(start)<Date.parse(first.start)?'before':Date.parse(start)>=Date.parse(last.start)+last.duration*60000?'after':'between';
  if(window.placement==='before'&&slot!=='before'||window.placement==='after'&&slot!=='after')return [];
  const venue=venueFor(event)!;const km=Math.min(...selected.map(s=>distanceKm(venue,venueFor(s.event)!)));
  if(km>maxKm)return [];
  return [{event,start,duration,slot,km,match:(preferred[theme]??[]).includes(event.category)}];
 }).sort((a,b)=>Number(b.match)-Number(a.match)||a.start.localeCompare(b.start));
}
