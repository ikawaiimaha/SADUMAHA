import {currentPublication,type ArtworkRoster} from '../data/artworkRoster';

/** Browser-shaped Arabic/English proof. This export is a revision snapshot, never a live document. */
export async function publicationLabelsPdf(roster:ArtworkRoster):Promise<Blob>{
 const revision=currentPublication(roster);
 if(!revision)throw new Error('Current Editorial approval required');
 const {jsPDF}=await import('jspdf');
 await document.fonts.ready;
 const pdf=new jsPDF({compress:true});
 const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
 let first=true,y=80;
 const reset=()=>{ctx.fillStyle='#FFFDF7';ctx.fillRect(0,0,1240,1754);ctx.fillStyle='#111817';y=80;};
 const flush=()=>{if(!first)pdf.addPage();first=false;ctx.font='20px sans-serif';ctx.direction='ltr';ctx.textAlign='left';ctx.fillText(`REHEARSAL PROOF · ${roster.artistId} · revision ${revision.revision} · verify current approval before printing`,60,1700);pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,297);};
 function text(value:string,rtl=false){ctx.font='30px sans-serif';ctx.direction=rtl?'rtl':'ltr';ctx.textAlign=rtl?'right':'left';let line='';for(const character of value){if(character==='\n'||ctx.measureText(line+character).width>1080){draw(line);line='';if(character==='\n')continue;}line+=character;}draw(line);y+=25;function draw(value:string){if(y>1600){flush();reset();ctx.font='30px sans-serif';ctx.direction=rtl?'rtl':'ltr';ctx.textAlign=rtl?'right':'left';}ctx.fillText(value,rtl?1180:60,y);y+=48;}}
 for(const item of revision.items){reset();text(revision.exhibitionTitleAr??'',true);text(revision.exhibitionTitleEn??'');text(item.titleAr,true);text(item.titleEn);text(`${item.year} · ${item.medium} · ${item.height} × ${item.width} × ${item.depth} cm`);text(item.descriptionAr??'',true);text(item.descriptionEn??'');flush();}
 return pdf.output('blob');
}
