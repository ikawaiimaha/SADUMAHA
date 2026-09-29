import {pilotSupabase as client} from '../lib/pilotSupabase';
import type {CatalogArtwork} from '../data/catalogFreight';
import type {SpatialZone} from '../data/exhibitionScenario';

/** Bounded private image download; never use unrelated files or public object URLs. */
async function thumbnail(path:string,signal:AbortSignal){
 if(!client)throw new Error('Sign in required');
 if(!/\.png$/i.test(path))throw new Error('A PNG preview is required; TIFF/video preview generation is not configured.');
 const signed=await client.storage.from('logistics-secure').createSignedUrl(path,60);
 if(signed.error||!signed.data)throw new Error('Private image unavailable');
 const response=await fetch(signed.data.signedUrl,{signal,cache:'no-store'});
 if(!response.ok||!response.body)throw new Error('Private image unavailable');
 const reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>20*1024*1024)throw new Error('Image exceeds 20 MiB preview limit');parts.push(value);}}finally{await reader.cancel();}
 const blob=new Blob(parts as BlobPart[],{type:'image/png'});const header=new Uint8Array(await blob.slice(0,8).arrayBuffer());
 if(![137,80,78,71,13,10,26,10].every((b,i)=>header[i]===b))throw new Error('Image format mismatch');
 const bitmap=await createImageBitmap(blob,{resizeWidth:480,resizeQuality:'high'});
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=320;const ctx=canvas.getContext('2d');if(!ctx){bitmap.close();throw new Error('Preview unavailable');}
 ctx.fillStyle='#F7F1E6';ctx.fillRect(0,0,480,320);const ratio=Math.min(480/bitmap.width,320/bitmap.height);ctx.drawImage(bitmap,(480-bitmap.width*ratio)/2,(320-bitmap.height*ratio)/2,bitmap.width*ratio,bitmap.height*ratio);bitmap.close();return canvas;
}
export async function installationManifest(rows:CatalogArtwork[],signal:AbortSignal){
 if(!client||!rows.length||rows.length>100)throw new Error('No approved artworks');
 const result=await client.from('sadu_exhibition_scenarios').select('artwork_checklist,status').eq('id',rows[0].scenario_id).single();
 if(result.error||result.data?.status!=='SUBMITTED')throw new Error('Submitted scenario required');
 const zones=result.data.artwork_checklist as SpatialZone[],entries=new Map<string,{image:CanvasImageSource;location:string}>();
 for(const row of rows){if(signal.aborted)throw new Error('Cancelled');const zone=zones.find(z=>z.id===row.zone_id);if(!zone?.name)throw new Error('Recorded zone missing');entries.set(row.id,{image:await thumbnail(row.media_object_name,signal),location:zone.name});}
 const fresh=await client.from('sadu_artwork_checklist').select('*').eq('scenario_id',rows[0].scenario_id);
 const fingerprint=(items:CatalogArtwork[])=>JSON.stringify([...items].sort((a,b)=>a.id.localeCompare(b.id)).map(r=>[r.id,r.zone_id,r.media_object_name,r.source,r.translation_ar,r.translation_en??null,r.translation_status,r.translated_at,r.religious_text,r.height_cm,r.width_cm,r.production_year]));
 if(signal.aborted||fresh.error||fingerprint(fresh.data??[])!==fingerprint(rows))throw new Error('Approved evidence changed');
 const {catalogLabelsPdf}=await import('./catalogLabelsPdf');return catalogLabelsPdf(rows,entries);
}
