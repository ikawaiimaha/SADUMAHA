// Only exhibition draft text and upload identifiers; never credentials or identity documents.
export function readRecovery<T>(key:string):T|null {
 try {const item=JSON.parse(localStorage.getItem(key)||'null');return item && Number.isFinite(item.at) && Date.now()>=item.at && Date.now()-item.at<24*60*60*1000 ? item.value as T : null;}catch{return null;}
}
export function saveRecovery(key:string,value:unknown):boolean {
 try {localStorage.setItem(key,JSON.stringify({at:Date.now(),value}));return true;}catch{return false;}
}
export function clearRecovery(key:string){try{localStorage.removeItem(key);}catch{/* Private browsing may deny storage. */}}
export const recoveryKey=(project:string,user:string,scope:string)=>JSON.stringify(['sadu-media-v1',project,user,scope]);

export function validZoneDraft(value:unknown):value is import('../data/exhibitionScenario').SpatialZone[]{
 return Array.isArray(value)&&value.length<=30&&new Set(value.map(z=>z?.id)).size===value.length&&value.every(z=>z&&typeof z.id==='string'&&z.id.length>0&&['name','medium','displaySpecifications'].every(k=>typeof z[k]==='string'&&z[k].length<=4000)&&(z.requires_spatial_planning===undefined||typeof z.requires_spatial_planning==='boolean')&&Number.isFinite(z.artworkCount)&&['printRequired','avRequired','darkRoom'].every(k=>typeof z[k]==='boolean'));
}
