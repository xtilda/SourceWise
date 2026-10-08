import { distanceKm, sampleRoutes, type Stop } from '@/lib/routes';
export type Venue = { id:string; name:string; area:string; lat:number; lng:number; mapsUrl:string };
// Coordinates verified through the map links on IKSV's official venues page.
export const venues: Venue[] = [
 {id:'atlas',name:'Atlas 1948',area:'Beyoğlu',lat:41.0341798,lng:28.9792539,mapsUrl:'https://maps.app.goo.gl/D7G52pi59wAwTbvU6'},
 {id:'citys',name:"CineWAM City's Nişantaşı",area:'Nişantaşı',lat:41.0511273,lng:28.9928352,mapsUrl:'https://maps.app.goo.gl/zSxivVc5URegWhzh8'},
 {id:'kadikoy',name:'Kadıköy Sineması',area:'Kadıköy',lat:40.988386,lng:29.028793,mapsUrl:'https://maps.app.goo.gl/SQvhhtXacHQdZemB8'},
 {id:'paribu',name:'Paribu Art',area:'Kadıköy',lat:40.9912557,lng:29.0364171,mapsUrl:'https://maps.app.goo.gl/PSso8xfW4rxBYHJp6'},
{"id": "akm", "name": "AKM Tiyatro Salonu", "mapsUrl": "https://maps.app.goo.gl/4fqyba8tYi27ovAs8", "lat": 41.037046, "lng": 28.9884457, "area": "Beyoğlu"},{"id": "alan", "name": "Alan Kadıköy", "mapsUrl": "https://maps.app.goo.gl/1tbrbRXG47Wkj6Az7", "lat": 41.0053547, "lng": 29.0369892, "area": "Kadıköy"},{"id": "arter", "name": "Arter", "mapsUrl": "https://maps.app.goo.gl/uHJax47vPmo3aBhs5", "lat": 41.0407461, "lng": 28.9786765, "area": "Beyoğlu"},{"id": "doubletree", "name": "DoubleTree by Hilton Kadıköy", "mapsUrl": "https://maps.app.goo.gl/bMBLBAsaU7x9N9dd6", "lat": 40.988424, "lng": 29.0210756, "area": "Kadıköy"},{"id": "salon", "name": "Fiba Salon İKSV", "mapsUrl": "https://maps.app.goo.gl/Mtwx74pLvS6VcuSo8", "lat": 41.0284025, "lng": 28.9719222, "area": "Beyoğlu"},{"id": "harbiye", "name": "İBB Şehir Tiyatroları Harbiye Muhsin Ertuğrul Sahnesi", "mapsUrl": "https://maps.app.goo.gl/xUFCjiGJ88ZMSzZY8", "lat": 41.0466181, "lng": 28.98885, "area": "Şişli"},{"id": "altkat", "name": "İKSV Alt Kat", "mapsUrl": "https://maps.app.goo.gl/mSKBc8DpFtmscysz9", "lat": 41.028417, "lng": 28.9719568, "area": "Beyoğlu"},{"id": "imc", "name": "İstanbul Manifaturacılar Çarşısı (İMÇ)", "mapsUrl": "https://maps.app.goo.gl/Dy2ndFuxyiPtv2QV6", "lat": 41.0172455, "lng": 28.9571771, "area": "Fatih"},{"id": "saintjoseph", "name": "İstanbul Özel Saint-Joseph Fransız Lisesi", "mapsUrl": "https://maps.app.goo.gl/dCRZEYyxofh5tJP1A", "lat": 40.9830379, "lng": 29.0286761, "area": "Kadıköy"},{"id": "komunite", "name": "Komünite", "mapsUrl": "https://maps.app.goo.gl/9xvUxWWHupd6tQAV9", "lat": 40.9927524, "lng": 29.0358859, "area": "Kadıköy"},{"id": "gencer", "name": "Leyla Gencer Opera ve Sanat Merkezi", "mapsUrl": "https://maps.app.goo.gl/SozeFmdNzMMtqFgy8", "lat": 40.9940699, "lng": 28.8771901, "area": "Bakırköy"},{"id": "panayia", "name": "Panayia Rum Kilisesi", "mapsUrl": "https://maps.app.goo.gl/k8iWj2412eEyCLpC7", "lat": 41.122628, "lng": 29.0705429, "area": "Sarıyer"},{"id": "phebus", "name": "Phebus Müzayede Evi", "mapsUrl": "https://maps.app.goo.gl/fmnLHfmoQPtspVSp9", "lat": 41.0292792, "lng": 28.9736053, "area": "Beyoğlu"},{"id": "tesak", "name": "Tarih Edebiyat Sanat Kütüphanesi (TESAK)", "mapsUrl": "https://maps.app.goo.gl/UvvhqXVit9fikGc68", "lat": 40.9906409, "lng": 29.0221695, "area": "Kadıköy"},{"id": "yeldegirmeni", "name": "Yeldeğirmeni Sanat", "mapsUrl": "https://maps.app.goo.gl/4MXCDpQtXHaZQo6u9", "lat": 40.9963144, "lng": 29.0278449, "area": "Kadıköy"},{"id": "zorlu", "name": "Zorlu PSM", "mapsUrl": "https://maps.app.goo.gl/i5KB7FF43iJQsWdK7", "lat": 41.0666909, "lng": 29.0162415, "area": "Beşiktaş"},{"id": "gazhane", "name": "Müze Gazhane", "area": "Kadıköy", "lat": 40.9961818, "lng": 29.0426306, "mapsUrl": "https://goo.gl/maps/2J1VZD29BoLoJLV6A"},{"id": "kitapci", "name": "İstanbul Kitapçısı Kadıköy Şubesi", "area": "Kadıköy", "lat": 40.99282, "lng": 29.0229801, "mapsUrl": "https://goo.gl/maps/ouDw11EgNF6FDyYN7"}
];
export const categories = ['Film','Tiyatro','Konser','Sergi','Söyleşi','Atölye','Diğer'] as const;
export type Category = typeof categories[number];
export type CultureEvent = {id:string; title:string; director:string; startsAt:string; endsAt?:string; timeKnown?:boolean; venueId:string; venueName?:string; sourceUrl:string; ticketUrl:string|null; category:Category; festival:string; sourceId?:string; free?:boolean};
export type SourceStatus={id:string;name:string;url:string;checkedAt:string|null;stale:boolean;error:string|null;count:number;scope:string};
export type EventFeed = {events:CultureEvent[]; checkedAt:string|null; stale:boolean; error:string|null;sources?:SourceStatus[]};
export const localDate = (date:Date) => new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const timeLabel = (date:string) => new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'}).format(new Date(date));
export const dateLabel = (date:string) => new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',day:'numeric',month:'long',weekday:'short'}).format(new Date(date));
export function venueFor(event:CultureEvent):Venue|undefined{return venues.find(v=>v.id===event.venueId);}
export function activeOn(event:CultureEvent,date:string){return event.startsAt.slice(0,10)<=date&&(event.endsAt?.slice(0,10)??event.startsAt.slice(0,10))>=date;}
export function isUpcoming(event:CultureEvent,now=Date.now()){return Date.parse(event.endsAt??event.startsAt)+(event.timeKnown===false&&!event.endsAt?86400000:0)>now;}
export const themes=[{id:'mixed',name:'Şehir & kültür',categories:[]},{id:'cinema',name:'Sinema günü',categories:['Film']},{id:'stage',name:'Sahne & müzik',categories:['Tiyatro','Konser']},{id:'literature',name:'Edebiyat molası',categories:['Söyleşi','Atölye']},{id:'history',name:'Tarihin izinde',categories:['Sergi']}] as const;
export type Landmark=Stop&{themes:string[];tip:string};
const details:Record<string,{name:string;themes:string[];tip:string}>={
 g2:{name:'SALT Galata çevresi',themes:['history','literature','cinema'],tip:'Bankalar Caddesi’ndeki tarihi yapıya dışarıdan bak. Sergi veya okuma salonuna girmek istersen güncel saatleri resmî siteden kontrol et.'},
 ms3:{name:'Moda İskelesi çevresi',themes:['history','mixed','literature'],tip:'Tarihi iskeleyi kıyıdan izle; açık hava molası için denize bakan yürüyüş yolunu kullan.'},
 f3:{name:'Nakkaş Haydar Sokak',themes:['history','cinema'],tip:'Renkli cepheleri sokaktan gözlemle. Konut girişlerine girmeden, sakin bir yürüyüşle keşfet.'},
 b3:{name:'Balat sokakları',themes:['history','literature','mixed'],tip:'Mahallenin sokak dokusuna ve küçük mimari ayrıntılarına dışarıdan bak; yokuşlar için rahat ayakkabı seç.'},
 b2:{name:'Fener ara sokakları',themes:['history','cinema'],tip:'Haliç’ten içeri doğru kısa bir sokak keşfi yap. Yokuşlu bölümde tempoyu ve yürüyüş süresini hesaba kat.'},
 y1:{name:'Yıldız Parkı alt girişi',themes:['mixed','history'],tip:'Parkın girişinde kısa bir yeşil mola ver. Parka devam etmek istersen güncel erişim saatini kontrol et.'},
 y2:{name:'Yıldız Parkı patikaları',themes:['literature','mixed'],tip:'Ağaçlı yolda kısa bir yürüyüş yap. Erişim saatini önceden kontrol et; kapalı köşk ziyaretleri bu molaya dahil değil.'},
 y3:{name:'Yıldız Parkı seyir noktası',themes:['mixed','history'],tip:'Parkın üst kısmında manzaraya bir mola ayır. Yokuşu ve güncel park erişimini göz önünde bulundur.'},
 k3:{name:'İstanbul Modern çevresi',themes:['cinema','history'],tip:'Müzenin mimarisini dışarıdan gör. İçerideki sergiler için bilet ve ziyaret saatini ayrıca resmî siteden kontrol et.'},
 ke1:{name:'Karaköy İskelesi çevresi',themes:['mixed','cinema'],tip:'Vapur hareketine kısa bir kıyı molası ver. İskeleye ulaşım ve vapur bileti plana dahil değil.'},

 g1:{name:'Galata Kulesi Meydanı',themes:['history','cinema'],tip:'Gösterime giderken Galata Kulesi çevresindeki sokak dokusuna kısa bir mola ayır. Öneri meydan içindir; kule ziyareti dahil değil.'},
 g3:{name:'Kamondo Merdivenleri',themes:['history','literature'],tip:'Galata ile Karaköy arasında kıvrılan merdivenlere uğra; mimari detaylara bakmak için kısa bir açık hava durağı.'},
 k2:{name:'Karaköy sokakları',themes:['cinema','literature'],tip:'Ana caddeden ayrılıp ara sokaklarda kısa bir yürüyüş yap. Bir sonraki etkinliğe yetişmek için bu molayı kısa tut.'},
 k4:{name:'Tophane sahili',themes:['stage','mixed'],tip:'Etkinlikten önce su kenarında bir nefes al; sahil molası şehir içindeki kültür gününe iyi eşlik eder.'},
 m1:{name:'Kadıköy iskelesi',themes:['mixed','literature'],tip:'Vapur hareketini izlemek için kısa bir sahil molası. Planın başlangıcı burasıysa ulaşım süreni ayrıca hesapla.'},
 m2:{name:'Süreyya Operası cephesi',themes:['history','stage','cinema'],tip:'Bahariye üzerindeki opera binasının cephesine uğramayı unutma. Bu öneri dışarıdan bakmak içindir; içeri giriş veya temsil bileti dahil değil.'},
 ms1:{name:'Moda Parkı',themes:['literature','mixed'],tip:'Bir sayfa okumak veya etkinlik üzerine düşünmek için açık havada kısa bir mola.'},
 m3:{name:'Moda sahili',themes:['stage','mixed'],tip:'Deniz kenarında kısa bir yürüyüşle günün temposunu yavaşlat.'},
 b1:{name:'Fener sahili',themes:['history','mixed'],tip:'Haliç boyunca kısa bir açık hava durağı ekle.'},
 f2:{name:'Fener Rum Lisesi çevresi',themes:['history'],tip:'Kırmızı tuğlalı binayı sokaktan gör. Okulun içine giriş bu plana dahil değil.'},
 bp1:{name:'Beşiktaş iskelesi',themes:['stage','mixed'],tip:'Etkinlik öncesinde kıyıdaki hareketi izlemek için kısa bir mola.'},
 bp2:{name:'Çırağan sahili',themes:['history','mixed'],tip:'Boğaz kıyısında dışarıdan bir mimari ve sahil molası.'},
};
export const landmarks:Landmark[]=Object.entries(details).flatMap(([id,detail])=>{const stop=sampleRoutes.flatMap(r=>r.stops).find(s=>s.id===id);return stop?[{...stop,...detail,stayMinutes:15}]:[];});
export function nearbyLandmarks(event:CultureEvent,theme:string,maxKm=2){const venue=venueFor(event);if(!venue)return [];return landmarks.map(stop=>({stop,km:distanceKm(stop,venue),match:stop.themes.includes(theme)})).filter(s=>s.km<=maxKm&&((venue.area==='Kadıköy')===/^m/.test(s.stop.id))).sort((a,b)=>Number(b.match)-Number(a.match)||a.km-b.km);}
export const sameShore=(a:Venue,b:Venue)=>(a.area==='Kadıköy')===(b.area==='Kadıköy');
export const walkMinutes=(a:{lat:number;lng:number},b:{lat:number;lng:number})=>Math.ceil(distanceKm(a,b)*1.5/4*60);
export type PlanStep = {stop:Stop; arrival:string; walkMinutes:number};
export function planBefore(event:CultureEvent,available:number,theme='mixed'):{steps:PlanStep[];departure:string;arrival:string;venue:Venue}|null{
 const venue=venueFor(event);if(!venue||event.timeKnown===false)return null;
 const candidates=nearbyLandmarks(event,theme,1.5);let selected:Landmark[]=[];
 for(const {stop} of candidates){if(selected.length>=2)break;const trial=[stop,...selected];let total=15;for(let i=0;i<trial.length;i++)total+=15+walkMinutes(trial[i],trial[i+1]??venue);if(total<=available)selected=trial;}
 const target=Date.parse(event.startsAt)-15*60000;let total=0;for(let i=0;i<selected.length;i++)total+=15+walkMinutes(selected[i],selected[i+1]??venue);
 let current=target-total*60000;const departure=new Date(current).toISOString();const steps=selected.map((stop,i)=>{const arrival=new Date(current).toISOString();const minutes=walkMinutes(stop,selected[i+1]??venue);current+=(15+minutes)*60000;return {stop,arrival,walkMinutes:minutes};});
 return {steps,departure,arrival:new Date(target).toISOString(),venue};
}
