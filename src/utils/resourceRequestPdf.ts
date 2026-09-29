import {responseDue,type ResourceTicket} from '../data/interAgencyResources';
/** Rehearsal request, never an agency confirmation or authorized letterhead. */
export async function buildResourceRequest(ticket:ResourceTicket,isAr=false):Promise<Blob>{
 const {jsPDF}=await import('jspdf');await document.fonts.ready;
 const pdf=new jsPDF({compress:true});
 const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
 const tr=(ar:string,en:string)=>isAr?ar:en;
 const rows=[tr('سدو — طلب مورد بين الجهات','SADU — INTER-AGENCY RESOURCE REQUEST'),
  tr('نموذج تدريبي / غير مرسل / ليس تأكيد حجز','REHEARSAL / NOT DISPATCHED / NOT A BOOKING'),
  `${tr('مرجع الطلب','Request reference')}: ${ticket.id}`,
  `${tr('الجهة','Agency')}: ${ticket.agency}`,
  `${tr('ملف الفنان','Artist dossier')}: ${ticket.artistId}`,
  `${tr('المورد','Resource')}: ${ticket.resource}`,
  `${tr('تاريخ التسجيل UTC','Recorded UTC')}: ${ticket.requestedAt}`,
  `${tr('الموعد المطلوب UTC','Required UTC')}: ${ticket.requiredAt}`,
  `${tr('مهلة الرد UTC','Response deadline UTC')}: ${new Date(responseDue(ticket)).toISOString()}`,
  tr('يرجى تأكيد التوفر وموعد التسليم أو تسجيل الرفض بمرجع رسمي.','Please confirm availability and delivery time, or provide a referenced denial.'),
  tr('بعد 48 ساعة دون رد، يمكن تقديم طلب استئجار بديل لموافقة المالية.','After 48 hours without a response, an alternative rental may be requested for Finance approval.'),
  tr('هذا السجل تجريبي ولا يجيز إنفاقاً أو يشكل مراسلة رسمية.','This prototype record authorizes no expenditure and is not official correspondence.')];
 let y=95;const reset=()=>{ctx.fillStyle='#F7F1E6';ctx.fillRect(0,0,1240,1754);ctx.fillStyle='#111817';ctx.font='28px sans-serif';ctx.direction=isAr?'rtl':'ltr';ctx.textAlign=isAr?'right':'left';};
 const flush=()=>pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,210,297);reset();
 for(const row of rows){let line='';for(const character of row){if(ctx.measureText(line+character).width>1060){ctx.fillText(line,isAr?1150:90,y);y+=44;line='';if(y>1620){flush();pdf.addPage();reset();y=95;}}line+=character;}ctx.fillText(line,isAr?1150:90,y);y+=78;if(y>1620){flush();pdf.addPage();reset();y=95;}}
 flush();return pdf.output('blob');
}
export async function downloadResourceRequest(ticket:ResourceTicket,isAr=false){
 const blob=await buildResourceRequest(ticket,isAr),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`SADU-resource-${ticket.id}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
