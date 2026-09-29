import {bilingualComplete,publicText,type CatalogArtwork} from '../data/catalogFreight';
import {formatLabelTitle} from '../data/labelFormatting';
/** Browser-shaped label proof. Approved museum typography/physical trim remains a separate sign-off. */
export async function catalogLabelsPdf(rows:CatalogArtwork[],manifest?:Map<string,{image:CanvasImageSource;location:string}>){
 if(!rows.length||rows.some(r=>!bilingualComplete(r)||typeof r.religious_text!=='boolean')||new Set(rows.map(r=>r.scenario_id)).size!==1)throw new Error('One complete approved exhibition required');
 if(manifest&&rows.some(r=>!manifest.has(r.id)))throw new Error('Missing visual evidence');
 const {jsPDF}=await import('jspdf');await document.fonts.ready;
 const pdf=new jsPDF({compress:true});const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
 let page=0,y=100,narrow=false;
 const reset=()=>{ctx.fillStyle='#FFFDF7';ctx.fillRect(0,0,1240,1754);ctx.fillStyle='#111817';y=100;};
 function flush(row:CatalogArtwork){if(page++)pdf.addPage();ctx.font='18px Inter, sans-serif';ctx.direction='ltr';ctx.textAlign='left';ctx.fillText(`PROOF · ${row.id} · ${row.translated_at??'Approval time unavailable'}`,60,1660);ctx.fillText('Confirm current approval, venue attribution and museum print specifications before production.',60,1700);pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,297);}
 function write(value:string,rtl:boolean,row:CatalogArtwork){const style=()=>{ctx.font=rtl?(narrow?'30px "Noto Naskh Arabic", serif':'40px "Noto Naskh Arabic", serif'):(narrow?'26px Inter, sans-serif':'34px Inter, sans-serif');ctx.direction=rtl?'rtl':'ltr';ctx.textAlign=rtl?'right':'left';};style();let line='';const draw=()=>{if(y>1540){flush(row);reset();style();}ctx.fillText(line,rtl?1180:(narrow?580:60),y);y+=60;line='';};for(const char of value){if(char==='\n'||ctx.measureText(line+char).width>(narrow?600:1080)){draw();if(char==='\n')continue;}line+=char;}if(line)draw();y+=35;}
 for(const r of rows){narrow=false;reset();const entry=manifest?.get(r.id);if(entry){ctx.font='26px Inter, sans-serif';ctx.fillText('INSTALLATION MANIFEST · '+r.id,60,y);y+=45;write('Artist-declared zone: '+entry.location,false,r);ctx.drawImage(entry.image,60,y,480,320);narrow=true;}for(const lang of ['ar','en'] as const){const t=publicText(r,lang)!;write(formatLabelTitle(t.title,r.religious_text!),lang==='ar',r);write(t.medium,lang==='ar',r);}write(`${r.height_cm} × ${r.width_cm} cm · ${r.production_year}`,false,r);flush(r);}
 return pdf.output('blob');
}
