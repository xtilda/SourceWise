export type DraftSettings={date:string;title:string;landmarkIds:string[];before:number;maxKm:number;originId:string;startClock:string;endClock:string;placement:'before'|'after'|'both';editing:string|null};
export function restoreDraftSettings(value:unknown,date:string):DraftSettings|null{
 if(!value||typeof value!=='object')return null;const v=value as Partial<DraftSettings>;
 if(v.date!==date)return null;
 const clock=(s:unknown,fallback:string)=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?s:fallback;
 return {date,title:typeof v.title==='string'?v.title.slice(0,100):'',landmarkIds:Array.isArray(v.landmarkIds)?v.landmarkIds.filter((s):s is string=>typeof s==='string').slice(0,30):[],before:[30,60,120].includes(Number(v.before))?Number(v.before):60,maxKm:[1,3,5].includes(Number(v.maxKm))?Number(v.maxKm):3,originId:typeof v.originId==='string'?v.originId:'',startClock:clock(v.startClock,''),endClock:clock(v.endClock,'23:00'),placement:v.placement==='before'||v.placement==='after'?v.placement:'both',editing:typeof v.editing==='string'?v.editing:null};
}
