import { useState } from 'react';
import { Download, Image, FileText, FolderDown } from 'lucide-react';
import type { BilateralContractStatus } from '../types/contractStage6';
export const canAccessPressKit = (status?: BilateralContractStatus) => status === 'ARTIST_APPROVED' || status === 'LOCKED';
const assets = [
 {id:'logo',ar:'الشعار الرسمي للملتقى',en:'Official Biennial Logo',file:'SCB_12th_Logo_Master_SAMPLE.svg',Icon:Image},
 {id:'brief',ar:'نبذة عن الملتقى',en:'Institutional Brief',file:'Sharjah_Calligraphy_Biennial_Overview_SAMPLE.pdf',Icon:FileText},
 {id:'theme',ar:'النص التقييمي لشعار الدورة — ميزان',en:'Curatorial Theme Text — Mizan',file:'Mizan_Curatorial_Theme_SAMPLE.txt',Icon:FileText},
] as const;
export function OfficialPressKit({status,isAr}:{status?:BilateralContractStatus;isAr:boolean}) {
 const [busy,setBusy]=useState<string|null>(null),[error,setError]=useState('');
 if(!canAccessPressKit(status))return null;
 const t=(ar:string,en:string)=>isAr?ar:en;
 async function download(asset:typeof assets[number]) {
  if(busy||!canAccessPressKit(status))return;
  setBusy(asset.id);setError('');
  try {
   let blob:Blob;
   if(asset.id==='logo')blob=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#F7F1E6"/><text x="600" y="330" text-anchor="middle" font-family="serif" font-size="100" fill="#8B261E">SADU</text><text x="600" y="450" text-anchor="middle" font-family="sans-serif" font-size="34">SAMPLE LOGO PLACEHOLDER</text><text x="600" y="520" text-anchor="middle" font-family="sans-serif" font-size="24">Not official branding. Rehearsal use only.</text></svg>'],{type:'image/svg+xml'});
   else if(asset.id==='brief') {
    const {jsPDF}=await import('jspdf');const pdf=new jsPDF();pdf.setFontSize(18);pdf.text('SADU - Sample Institutional Brief',20,25);pdf.setFontSize(12);pdf.text(pdf.splitTextToSize('REHEARSAL ONLY - Not an approved institutional publication. This sample introduces the Sharjah Calligraphy Biennial as a platform for calligraphy and contemporary artistic practice. Replace this file with the Editorial/PR-approved overview before external distribution.',170),20,45);blob=pdf.output('blob');
   } else blob=new Blob(['SAMPLE / نص تجريبي — غير معتمد للنشر\nMizan / ميزان\n\nBalance offers a rehearsal theme for exploring the relationship between letter, space and rhythm.\nيطرح الميزان إطاراً تجريبياً لاستكشاف العلاقة بين الحرف والفراغ والإيقاع.\n\nThis is placeholder prose, not the published institutional theme.'],{type:'text/plain;charset=utf-8'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=asset.file;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch{setError(t('تعذر إعداد الملف التجريبي. حاول مرة أخرى.','Could not prepare the sample file. Please retry.'));}finally{setBusy(null);}
 }
 return <section className="my-6 space-y-4 rounded-xl border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start" aria-labelledby="official-press-kit-title">
 <h2 id="official-press-kit-title" className="flex items-center gap-2 text-xl font-semibold"><FolderDown aria-hidden="true" className="size-6 shrink-0"/>الحقيبة الإعلامية والهوية البصرية / Official Brand &amp; Press Kit</h2>
 <p className="text-sm text-[#736357]">{t('حقيبة تجريبية — ملفات نموذجية غير معتمدة للاستخدام الخارجي. لم تربط هذه التنزيلات بمكتبة التحرير والعلاقات العامة بعد.','Demo kit — sample files, not approved for external use. Downloads are not yet connected to the Editorial/PR asset library.')}</p>
 <div className="grid gap-4 md:grid-cols-3">{assets.map(asset=><article key={asset.id} className="flex flex-col gap-3 rounded-lg border border-[#D9CEBA] bg-white ps-4 pe-4 py-4"><asset.Icon aria-hidden="true" className="size-6 text-[#8B261E]"/><h3 className="font-semibold">{asset[isAr?'ar':'en']}</h3><bdi className="break-all text-xs text-[#736357]">{asset.file}</bdi><button type="button" disabled={busy!==null} onClick={()=>void download(asset)} className="mt-auto inline-flex items-center justify-center gap-2 rounded border border-[#8B261E] ps-3 pe-3 py-2 text-[#8B261E] disabled:cursor-not-allowed disabled:opacity-50"><Download aria-hidden="true" className="size-4"/>{busy===asset.id?t('جارٍ الإعداد…','Preparing…'):t('تنزيل نموذج','Download sample')}</button></article>)}</div>
 <p className="text-sm leading-relaxed">{t('هذه المواد مخصصة لملفاتكم الفنية الرسمية ومنشوراتكم وبياناتكم الصحفية. يرجى الالتزام بدليل الهوية البصرية لدائرة الثقافة بالشارقة عند إعادة إنتاج الشعار.','These assets are provided for your official portfolios, publications, and press releases. Please adhere to the Sharjah Department of Culture\'s visual guidelines when reproducing the logo.')}</p>
 {error&&<p role="alert" className="text-red-800">{error}</p>}
 </section>;
}
