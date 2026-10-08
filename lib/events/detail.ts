import { database } from '@/db/postgres';
import {text,urlSafe} from './adapters';
import type {CultureEvent} from './model';
export type EventMedia={imageUrl:string|null;summary:string|null;checkedAt:string|null;unavailable:boolean};
const hosts=['iksv.org','fibasaloniksv.com','kultur.istanbul','kultursanat.istanbul','passo.com.tr'];
const empty:EventMedia={imageUrl:null,summary:null,checkedAt:null,unavailable:false};
export function parseEventMedia(html:string,sourceUrl:string):Pick<EventMedia,'imageUrl'|'summary'> {
 const attrs=(tag:string)=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map(m=>[m[1].toLowerCase(),m[3]]));
 const meta=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0]));
 const contentImage=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>attrs(m[0]).src).find(src=>src&&/^\/?i\/content\//.test(src));
 const raw=contentImage??meta.find(m=>m.property==='og:image')?.content;
 let imageUrl:string|null=null;
 if(raw)try {const u=new URL(raw.replace(/&amp;/g,'&'),sourceUrl);if(u.pathname!=='/'&&/\.(jpe?g|png|webp)(?:$)/i.test(u.pathname)&&!/(logo|sponsor|tracking)/i.test(u.pathname))imageUrl=urlSafe(u.href,hosts);}catch{}
 const rawSummary=meta.find(m=>m.property==='og:description')?.content;
 const summary=rawSummary?text(rawSummary).split(' ').slice(0,24).join(' ').slice(0,240):null;
 return {imageUrl,summary};
}
async function readOfficial(url:string){
 let current=urlSafe(url,hosts);if(!current)throw new Error('Unsupported source');
 for(let i=0;i<3;i++){
  const r:Response=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(8000)});
  if(r.status>=300&&r.status<400){const target:string|null=r.headers.get('location');current=target?urlSafe(new URL(target,current).href,hosts):null;if(!current)throw new Error('Unsupported redirect');continue;}
  if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw new Error('Source unavailable');
  const html=await r.text();if(html.length>3_000_000)throw new Error('Source too large');return {html,url:current};
 }
 throw new Error('Too many redirects');
}
export async function getEventMedia(event:CultureEvent):Promise<EventMedia>{
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(event.sourceUrl));
 const id='detail:'+Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
 const db=database();if(!db)return {...empty,unavailable:true};
 await db.prepare('INSERT OR IGNORE INTO event_feeds(id) VALUES (?)').bind(id).run();
 const row=await db.prepare('SELECT payload,checked_at,retry_after FROM event_feeds WHERE id=?').bind(id).first<{payload:string;checked_at:string|null;retry_after:number}>();
 let previous=empty;try{const payload=JSON.parse(row?.payload??'null');if(payload&&!Array.isArray(payload))previous=payload;}catch{}
 const now=Date.now();if(row?.checked_at&&now-Date.parse(row.checked_at)<6*3600000||Number(row?.retry_after)>now)return previous;
 const lock=await db.prepare('UPDATE event_feeds SET retry_after=? WHERE id=? AND retry_after<?').bind(now+30000,id,now).run();if(!lock.meta.changes)return previous;
 try{
  const source=await readOfficial(event.sourceUrl);const media={...parseEventMedia(source.html,source.url),checkedAt:new Date().toISOString(),unavailable:false};
  // Validate that the selected content URL serves an image, without proxying its bytes.
  if(media.imageUrl){try{const r=await fetch(media.imageUrl,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(5000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))media.imageUrl=null;}catch{media.imageUrl=null;}}
  await db.prepare('UPDATE event_feeds SET payload=?,checked_at=?,retry_after=0,error=NULL WHERE id=?').bind(JSON.stringify(media),media.checkedAt,id).run();return media;
 }catch{
  const media={...previous,unavailable:true};await db.prepare('UPDATE event_feeds SET payload=?,retry_after=? WHERE id=?').bind(JSON.stringify(media),now+30*60000,id).run();return media;
 }
}
