export type MediumTag='OTHER'|'SCULPTURE'|'3D_INSTALLATION';
export interface TechnicalRider {file:File;headerChecked:boolean;uploadedAt:string}
export function requiresTechnicalRider(medium:string,tag?:MediumTag){return tag==='SCULPTURE'||tag==='3D_INSTALLATION'||/\bsculptures?\b|\b3\s*[- ]?d\s+installations?\b|نحت|منحوت|تركيب.{0,15}ثلاثي/i.test(medium.normalize('NFKC'));}
export function validTechnicalRider(r?:TechnicalRider){return Boolean(r&&r.headerChecked&&r.file&&/\.pdf$/i.test(r.file.name)&&['application/pdf',''].includes(r.file.type)&&r.file.size>0&&r.file.size<=20*1024*1024&&Number.isFinite(Date.parse(r.uploadedAt)));}
export async function readTechnicalRider(file:File):Promise<TechnicalRider|null>{
 if(!/\.pdf$/i.test(file.name)||!['application/pdf',''].includes(file.type)||file.size===0||file.size>20*1024*1024)return null;
 if(await file.slice(0,5).text()!=='%PDF-')return null;
 return {file,headerChecked:true,uploadedAt:new Date().toISOString()};
}
