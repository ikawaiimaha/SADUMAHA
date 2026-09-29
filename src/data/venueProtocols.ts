export type WorkActivity='INSTALLATION'|'WELDING'|'CARPENTRY';
export type WorkLocation='INSIDE_HALL'|'OUTSIDE_HALL';
export function venueWorkBlock(venueId:string|undefined,activity:WorkActivity,location:WorkLocation){
 if(!['INSTALLATION','WELDING','CARPENTRY'].includes(activity)||!['INSIDE_HALL','OUTSIDE_HALL'].includes(location))return 'Declare a valid activity and work location.';
 if(activity!=='INSTALLATION'&&!venueId)return 'Claim a venue before planning fabrication work.';
 return venueId==='SHARJAH_ART_MUSEUM'&&location==='INSIDE_HALL'&&['WELDING','CARPENTRY'].includes(activity)?'Rule 5 Violation: Welding and carpentry must be performed outside the exhibition halls.':null;
}
export function workerNames(text:string){return [...new Set(text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean))];}
export function validWorkers(names:string[]){return names.length>0&&names.length<=100&&names.every(n=>n.length>=2&&n.length<=150);}
