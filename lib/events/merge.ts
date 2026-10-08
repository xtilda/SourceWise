import {venueFor,type CultureEvent} from './model';
const normalize=(s:string)=>s.toLocaleLowerCase('tr-TR').replace(/[’'“”".,]/g,'').replace(/\s+/g,' ').trim();
export function deduplicateEvents(events:CultureEvent[]){
 const seenTickets=new Set<string>(),seenSessions=new Set<string>();const result:CultureEvent[]=[];
 for(const event of events){
  let ticket='';if(event.ticketUrl)try{const u=new URL(event.ticketUrl);ticket=u.hostname+u.pathname+'|'+event.startsAt;}catch{}
  const place=venueFor(event)?.id??normalize(event.venueName??event.venueId).replace(/\s*-?\s*istanbul$/,'').trim();
  const session=normalize(event.title)+'|'+place+'|'+event.startsAt;
  if((ticket&&seenTickets.has(ticket))||seenSessions.has(session))continue;
  if(ticket)seenTickets.add(ticket);seenSessions.add(session);result.push(event);
 }
 return result.sort((a,b)=>a.startsAt.localeCompare(b.startsAt)||a.title.localeCompare(b.title,'tr'));
}
