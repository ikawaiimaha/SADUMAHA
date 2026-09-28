export type SpatialZone={id:string;name:string;artworkCount:number;medium:string;displaySpecifications:string;printRequired:boolean;avRequired:boolean;darkRoom:boolean};
export type ScenarioMedia={object_name:string;scenario_id:string;zone_id:string;category:'PRINT'|'AV';file_name:string};
export const completeZone=(z:SpatialZone)=>Boolean(z.id&&z.name.trim()&&z.name.length<=150&&Number.isInteger(z.artworkCount)&&z.artworkCount>0&&z.artworkCount<=100&&z.medium.trim()&&z.medium.length<=250&&z.displaySpecifications.trim()&&z.displaySpecifications.length<=4000&&(z.printRequired||z.avRequired));
export const completeScenario=(zones:SpatialZone[],uploaded:ScenarioMedia[])=>zones.length>0&&zones.length<=30&&new Set(zones.map(z=>z.id)).size===zones.length&&zones.every(z=>completeZone(z)&&(!z.printRequired||uploaded.some(f=>f.zone_id===z.id&&f.category==='PRINT'))&&(!z.avRequired||uploaded.some(f=>f.zone_id===z.id&&f.category==='AV')));
export async function mediaContentType(file:File,category:'PRINT'|'AV'):Promise<string|null>{
 if(!file.size||file.size>50*1024*1024)return null;
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
 if(category==='PRINT'){
  if(/\.png$/i.test(file.name)&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b))return 'image/png';
  if(/\.tiff?$/i.test(file.name)&&((bytes[0]===73&&bytes[1]===73&&bytes[2]===42&&bytes[3]===0)||(bytes[0]===77&&bytes[1]===77&&bytes[2]===0&&bytes[3]===42)))return 'image/tiff';
 }else if(/\.(mp4|mov)$/i.test(file.name)&&String.fromCharCode(...bytes.slice(4,8))==='ftyp')return /\.mov$/i.test(file.name)?'video/quicktime':'video/mp4';
 return null;
}
