import {venueFor,type CultureEvent} from './model';
import type {TimelineItem} from './planner';
const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const stamp=(s:string)=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
function download(lines:string[],name:string){
 const folded=lines.map(line=>{let result='',length=0;for(const ch of line){const bytes=new TextEncoder().encode(ch).length;if(length+bytes>73){result+='\r\n ';length=1;}result+=ch;length+=bytes;}return result;});
 const url=URL.createObjectURL(new Blob([folded.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function exportEvents(events:CultureEvent[]){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//City Curator//Istanbul//TR'];
 for(const event of events){if(event.timeKnown===false)continue;lines.push('BEGIN:VEVENT',`UID:${encodeURIComponent(event.id)}@city-curator`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(event.startsAt)}`,`SUMMARY:${escape(event.title)}`,`LOCATION:${escape(event.venueName??venueFor(event)?.name??'İstanbul')}`,`URL:${event.sourceUrl}`,'END:VEVENT');}
 lines.push('END:VCALENDAR');download(lines,'istanbul-etkinlikleri.ics');
}
export function exportTimeline(items:TimelineItem[]){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//City Curator//Istanbul Plan//TR'];
 for(const item of items)lines.push('BEGIN:VEVENT',`UID:${encodeURIComponent(item.id+'-'+item.start)}@city-curator`,`DTSTAMP:${stamp(new Date().toISOString())}`,`DTSTART:${stamp(item.start)}`,`DTEND:${stamp(item.end)}`,`SUMMARY:${escape(item.name)}`,`DESCRIPTION:${escape(item.kind==='event'?'City Curator: süre plan için ayırdığın süredir; resmî bitiş saati değildir. '+(item.sourceUrl??''):item.tip??'')}`,'END:VEVENT');
 lines.push('END:VCALENDAR');download(lines,'istanbul-gun-planim.ics');
}
