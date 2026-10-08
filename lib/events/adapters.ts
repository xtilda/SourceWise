import { requestSignal } from './request-budget';
import { venues, localDate, type CultureEvent, type Category } from './model';
export const text=(html:string)=>html.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#0?39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g,' ').trim();
const norm=(s:string)=>text(s).toLocaleLowerCase('tr-TR').replace(/[’']/g,'').replace(/\s+/g,' ');
export function findVenue(name:string){const n=norm(name);return venues.find(v=>norm(v.name)===n)||venues.find(v=>n.length>12&&norm(v.name).endsWith(n))||venues.find(v=>n.includes(norm(v.name))&&norm(v.name).length>5)||(/bakırköy.*gencer/.test(n)?venues.find(v=>v.id==='gencer'):n==='arter karbon'?venues.find(v=>v.id==='arter'):n==='tesak'?venues.find(v=>v.id==='tesak'):n==='atölye 5554 (imç)'?venues.find(v=>v.id==='imc'):n==='yeniköy panayia kilisesi'?venues.find(v=>v.id==='panayia'):undefined);}
export function urlSafe(value:string|undefined,hosts:string[]){try{const u=new URL((value??'').replace(/&amp;/g,'&'));return u.protocol==='https:'&&hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))?u.href:null;}catch{return null;}}
export function timestamp(year:string,month:string,day:string,hour='00',minute='00'){
 const y=Number(year),m=Number(month),d=Number(day),h=Number(hour),min=Number(minute);
 if(y<2020||y>2100||m<1||m>12||d<1||d>31||h>23||min>59)return null;
 const test=new Date(Date.UTC(y,m-1,d));if(test.getUTCMonth()!==m-1||test.getUTCDate()!==d)return null;
 return `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}T${hour.padStart(2,'0')}:${minute.padStart(2,'0')}:00+03:00`;
}
export function parseLocalDate(value:string){const m=value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4}) (\d{1,2}):(\d{2}):\d{2}$/);return m?timestamp(m[3],m[2],m[1],m[4],m[5]):null;}
const months=['oca','şub','mar','nis','may','haz','tem','ağu','eyl','eki','kas','ara'];const english=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
export function dateFromText(value:string){const m=text(value).match(/(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(20\d{2})(?:\s+\D*?(\d{1,2}):(\d{2}))?/);if(!m)return null;let month=months.findIndex(x=>m[2].toLocaleLowerCase('tr-TR').startsWith(x));if(month<0)month=english.findIndex(x=>m[2].toLowerCase().startsWith(x));return month<0?null:{startsAt:timestamp(m[3],String(month+1),m[1],m[4],m[5]),timeKnown:!!m[4]};}
export function categoryFor(label:string):Category{const n=norm(label);if(/söyleşi|okur|okuma|edebiyat|sohbet/.test(n))return 'Söyleşi';if(/atölye|eğitim/.test(n))return 'Atölye';if(/sergi|fotoğraf|photography|sanat rotası|müze/.test(n))return 'Sergi';if(/film|sinema/.test(n))return 'Film';if(/tiyatro|dans|ballet|bale|theatre/.test(n))return 'Tiyatro';if(/konser|caz|jazz|müzik|muzik|concert|festival/.test(n))return 'Konser';return 'Diğer';}
function key(value:string){let h=2166136261;for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function eventBase(name:string,venueName:string,sourceId:string,startsAt:string){const venue=findVenue(venueName);return {id:`${sourceId}-${key(name+'|'+venueName+'|'+startsAt)}`,title:text(name).slice(0,240),director:'',startsAt,venueId:venue?.id??'unknown-'+key(venueName),venueName:text(venueName),sourceId};}
const inClass=(block:string,name:string)=>{const r=new RegExp(`class="[^"\\n]*\\b${name}\\b[^"\\n]*"[^>]*>([\\s\\S]*?)<\\/(?:div|span|h3)>`);return text(block.match(r)?.[1]??'');};
export function parsePasso(html:string):CultureEvent[]{
 if(!html.includes('r-event-item'))throw new Error('Passo page format unavailable');
 const result:CultureEvent[]=[];
 for(const m of html.matchAll(/<a\b([^>]*class="[^"]*r-event-item[^>]*?)>([\s\S]*?)<\/a>/g)){
  const href=m[1].match(/href="([^"]+)"/)?.[1];if(!href||/boxing|futbol|basketbol|voleybol|rmo-box/i.test(href))continue;
  const b=m[2],title=inClass(b,'r-title'),location=inClass(b,'r-location'),date=inClass(b,'r-date');const parsed=dateFromText(date);
  if(!title||!parsed?.startsAt||!parsed.timeKnown||!location||location.includes('|')||!(/istanbul|İstanbul|Harbiye|Volkswagen Arena|Babylon|Zorlu|Ataköy/i.test(location)))continue;
  const path=href.replace(/^\/en\/event\//,'/tr/etkinlik/');const sourceUrl=urlSafe('https://www.passo.com.tr'+path,['passo.com.tr']);if(!sourceUrl)continue;
  result.push({...eventBase(title,location,'passo',parsed.startsAt),sourceUrl,ticketUrl:sourceUrl,category:categoryFor(path+' '+title),festival:'Passo',timeKnown:true});
 }
 return result;
}
export function parseKultur(html:string):CultureEvent[]{
 if(html&&!html.includes('wpem-event-box-col'))throw new Error('Kultur page format changed');
 const result:CultureEvent[]=[];
 for(const b of html.split('<div class="wpem-event-box-col').slice(1)){
  const name=inClass(b,'wpem-heading-text'),venue=inClass(b,'wpem-event-location-text'),date=inClass(b,'wpem-event-date-time-text');
  const m=date.match(/(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);if(!m||!name||!venue)continue;
  const startsAt=timestamp(m[3],m[2],m[1],m[4],m[5]);if(!startsAt)continue;
  const end=date.match(/-\s+(\d{2})-(\d{2})-(\d{4})/);const endsAt=end?timestamp(end[3],end[2],end[1],'23','59'):undefined;
  const sourceUrl=urlSafe(b.match(/href="(https:\/\/kultur.istanbul\/etkinlik\/[^"]+)"/)?.[1],['kultur.istanbul']);if(!sourceUrl)continue;
  // Generic season banners are not individual cultural events.
  if(/Harbiye Açık Hava etkinlikleri|Koltuk Senin/i.test(name))continue;
  result.push({...eventBase(name,venue,'kultur',startsAt),endsAt:endsAt??undefined,sourceUrl,ticketUrl:null,category:categoryFor(inClass(b,'wpem-event-type')+' '+name),festival:'İBB · Kültür İstanbul',timeKnown:!!m[4],free:/event-type-ucretsiz/.test(b)});
 }
 return result;
}
export function parseIbb(html:string):CultureEvent[]{
 if(!/Toplam|Etkinlik bulunamadı/.test(html))throw new Error('IBB page format changed');
 const result:CultureEvent[]=[];
 for(const b of html.split('<div class="item2">').slice(1)){
  const title=inClass(b,'title'),desc=text(b.match(/<p class="desc">([\s\S]*?)<\/p>/)?.[1]??'');
  const venue=text(b.match(/<strong><a[^>]*>([\s\S]*?)<\/a>/)?.[1]??'');const date=dateFromText(desc);const sourceUrl=urlSafe(b.match(/href="([^"]*\/etkinliklerimiz\/\d+[^"\s]*)"/)?.[1],['kultursanat.istanbul']);
  if(!title||!venue||!date?.startsAt||!sourceUrl)continue;
  result.push({...eventBase(title,venue,'ibb',date.startsAt),sourceUrl,ticketUrl:null,category:categoryFor(inClass(b,'cat')),festival:'İBB Kültür Sanat',timeKnown:date.timeKnown,free:false});
 }
 return result;
}
export async function read(url:string,init?:RequestInit){const r=await fetch(url,{...init,signal:requestSignal(15000)});if(!r.ok)throw new Error('Source unavailable');return r;}
export async function fetchPasso(){return parsePasso(await (await read('https://ssrprod.passo.com.tr/tr')).text());}
export async function fetchKultur(){
 const events:CultureEvent[]=[];
 for(let page=1;page<=5;page++){
  const body=new URLSearchParams({per_page:'100',orderby:'event_start_date',order:'DESC',page:String(page),show_pagination:'true'});
  const d=await (await read('https://kultur.istanbul/em-ajax/get_listings/',{method:'POST',body:body.toString(),headers:{'Content-Type':'application/x-www-form-urlencoded'}})).json() as {html:string;max_num_pages:number;found_events:boolean};
  if(typeof d.html!=='string'||Number(d.max_num_pages)>5)throw new Error('Incomplete Kultur feed');
  events.push(...parseKultur(d.html));if(page>=Number(d.max_num_pages)||!d.found_events)break;
 }
 return events;
}
export async function fetchIbb(){
 const now=new Date(),end=new Date(now.getTime()+90*86400000);const events:CultureEvent[]=[];
 for(let page=1;page<=10;page++){
  const url='https://kultursanat.istanbul/etkinliklerimiz/ara?'+new URLSearchParams({start_date:localDate(now),end_date:localDate(end),page:String(page)});
  const html=await (await read(url)).text();events.push(...parseIbb(html));
  const pages=Number(html.match(/Toplam\s+(\d+)\s+sayfadan/)?.[1]??1);if(pages>10)throw new Error('Incomplete IBB feed');if(page>=pages)break;
 }
 return events;
}
export async function fetchIksv(kind:'theatre'|'salon'){
 const origin=kind==='theatre'?'https://tiyatro.iksv.org':'https://www.fibasaloniksv.com',pageUrl=origin+(kind==='theatre'?'/tr/etkinlikler':'/tr');
 const page=await (await read(pageUrl)).text();const param=kind==='theatre'?'programTiyatro':'programSalon';
 // Turkish branch is after the English branch on these official pages.
 const ids=[...page.matchAll(new RegExp(`var ${param}\\s*=\\s*["'](\\d+)["']`,'g'))];const program=ids.at(-1)?.[1];if(!program)throw new Error('Program unavailable');
 const result:CultureEvent[]=[];
 for(let currentPage=0;currentPage<10;currentPage++){
  const body=new URLSearchParams({plugin:'events',[param]:program,itemCount:'100',currentPage:String(currentPage),lang:'tr',getall:'false',...(kind==='theatre'?{activity:'false',paralel:'false'}:{getnew:'true'})});
  const data=await (await read(origin+(kind==='theatre'?'/plugins/iksv/plugins2.ashx':'/plugins/iksv/plugins.ashx'),{method:'POST',body:body.toString(),headers:{'Content-Type':'application/x-www-form-urlencoded'}})).json() as {status:boolean;pageCount:number;data:{articleId:number;headline:string;alias:string;category:string;tags:string;eventTag?:string;section?:string;programs:{dateString:string;endDate?:string;place:string;ticketUrl:string}[]}[]};
  if(!data.status||!Array.isArray(data.data)||!Number.isInteger(data.pageCount)||data.pageCount>10)throw new Error('Incomplete IKSV program');
  for(const item of data.data){
   if(!item.headline||!Array.isArray(item.programs))continue;
   const sourceUrl=urlSafe('https://'+item.alias.replace(/^https?:\/\//,''),['iksv.org','fibasaloniksv.com']);if(!sourceUrl)continue;
   for(const session of item.programs){const startsAt=parseLocalDate(session.dateString);if(!startsAt||!session.place)continue;
    // These programme pages only list Istanbul venues; generic walking tours remain ungeocoded.
    const venue=findVenue(session.place);const category=kind==='theatre'?(/Söyleşi/.test(item.eventTag??'')?'Söyleşi':/Ustalık|Atölye/.test(item.eventTag??'')?'Atölye':'Tiyatro'):categoryFor((item.section??'')+' '+item.headline);
    result.push({...eventBase(item.headline,session.place,kind,startsAt),id:`iksv-${item.articleId}-${venue?.id??norm(session.place)}-${startsAt}`,sourceUrl,ticketUrl:urlSafe(session.ticketUrl,['passo.com.tr']),category,festival:kind==='theatre'?'İKSV · Tiyatro Festivali':'İKSV · Fiba Salon',timeKnown:true,free:/ücretsiz/i.test(item.tags??'')});
   }
  }
  if(currentPage+1>=data.pageCount)break;
 }
 return result;
}
