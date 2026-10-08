import { requestSignal } from './request-budget';
import { venues, type CultureEvent } from './model';
type Screening = { dateString:string; place:string; ticketUrl?:string };
type Film = { articleId:number; headline:string; director?:string; alias:string; programs:Screening[] };
const origin='https://filmekimi.iksv.org';
export const sourceUrl=origin+'/tr/program';
const safeUrl=(value:string|undefined,host:string) => {try{const u=new URL(value??'');return u.protocol==='https:'&&(u.hostname===host||u.hostname.endsWith('.'+host))?u.href:null;}catch{return null;}};
export function normalizeFilms(films:Film[]):CultureEvent[]{
 const events=new Map<string,CultureEvent>();
 for(const film of films){
  if(!Number.isInteger(film.articleId)||!film.headline||!Array.isArray(film.programs))continue;
  for(const session of film.programs){
   const name=session.place?.replace(/\s+/g,' ').trim();
   const venue=name?.startsWith('Atlas 1948')?venues[0]:name?.startsWith('Cinewam')||name?.startsWith('CineWAM')?venues[1]:name?.startsWith('Kadıköy Sineması')?venues[2]:name==='Paribu Art (P)'?venues[3]:undefined;
   if(!venue)continue;
   const m=session.dateString?.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4}) (\d{1,2}):(\d{2}):\d{2}$/);if(!m)continue;
   const startsAt=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}T${m[4].padStart(2,'0')}:${m[5]}:00+03:00`;
   if(!Number.isFinite(Date.parse(startsAt))||Number(m[4])>23||Number(m[5])>59)continue;
   const id=`filmekimi-${film.articleId}-${venue.id}-${startsAt}`;
   events.set(id,{id,title:film.headline.slice(0,240),director:(film.director??'').slice(0,200),startsAt,venueId:venue.id,sourceUrl:safeUrl(film.alias.startsWith('https:')?film.alias:'https://'+film.alias,'filmekimi.iksv.org')??sourceUrl,ticketUrl:safeUrl(session.ticketUrl,'passo.com.tr'),category:'Film',festival:'Filmekimi',sourceId:'filmekimi',timeKnown:true});
  }
 }
 return [...events.values()].sort((a,b)=>a.startsAt.localeCompare(b.startsAt)||a.id.localeCompare(b.id));
}
async function read(url:string,init?:RequestInit){const r=await fetch(url,{...init,signal:requestSignal(12000)});if(!r.ok)throw new Error('Source unavailable');return r;}
export async function fetchFilmekimi():Promise<CultureEvent[]>{
 const page=await (await read(sourceUrl)).text();
 const program=page.match(/var programFilmEkimi\s*=\s*["'](\d+)["']/)?.[1];
 if(!program)throw new Error('Program format changed');
 const films:Film[]=[];
 for(let currentPage=0;currentPage<10;currentPage++){
  const body=new URLSearchParams({plugin:'events',programFilmEkimi:program,itemCount:'100',currentPage:String(currentPage),lang:'tr',getall:'false',sortby:'orderno'});
  const result=await (await read(origin+'/plugins/iksv/plugins.ashx',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},body:body.toString()})).json() as {status:boolean;data:Film[];pageCount:number};
  if(!result.status||!Array.isArray(result.data)||!Number.isInteger(result.pageCount)||result.pageCount>10)throw new Error('Incomplete program');
  films.push(...result.data);
  if(currentPage+1>=result.pageCount)break;
 }
 const events=normalizeFilms(films);
 if(!events.length)throw new Error('No verified Istanbul screenings');
 return events;
}
