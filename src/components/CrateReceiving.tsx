import {useId, useState} from 'react';
import {QrCode, PackageOpen} from 'lucide-react';
import {NativeModal} from './common/NativeModal';
import type {CommissionState} from '../types';
import type {CommissionAction} from '../data/commissionScenario';
import {crateToken} from '../data/logisticsExpansion';
import {validDamagePhoto} from '../data/conditionReporting';
const panel='rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 text-start space-y-3';
const button='rounded bg-[#8B261E] text-white ps-4 pe-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed';
export function CratePackingSlip({state}:{state:CommissionState}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const c=state.contracts[0],token=crateToken(state),origin=c?state.freightOrigins?.[`${c.id}:1`]:undefined;
 if(!token||!c)return null;
 const ready=['ARTIST_APPROVED','LOCKED'].includes(c.status)&&origin?.revision===state.agreementRevision;
 async function download(){
  if(!ready||!c.crate||!origin||!token||busy)return;
  setBusy(true);setError('');
  try{
   const [{jsPDF},QR]=await Promise.all([import('jspdf'),import('qrcode')]);
   const qr=await QR.toDataURL(token,{errorCorrectionLevel:'M',width:400});
   const pdf=new jsPDF();
   pdf.setFontSize(18);pdf.text('SADU - Crate Packing Slip',20,24);
   pdf.setFontSize(11);pdf.text('REHEARSAL - fictional session record - not a carrier document',20,34);
   pdf.text(`Agreement revision: ${state.agreementRevision}`,20,46);
   pdf.text(pdf.splitTextToSize(`Crate: ${c.crate.reference}`,170),20,56);
   pdf.text(`${c.crate.lengthCm} x ${c.crate.widthCm} x ${c.crate.heightCm} cm / ${c.crate.grossWeightKg} kg gross`,20,70);
   // QR is intentionally free of personally identifying information.
   pdf.addImage(qr,'PNG',20,82,65,65);
   pdf.setFontSize(9);pdf.text(pdf.splitTextToSize(token,170),20,158);
   pdf.text('Scan or enter this complete ID at the Logistics receiving desk.',20,180);
   pdf.text('Origin is held in the linked artist record; verify it before collection.',20,190);
   pdf.save(`SADU-crate-r${state.agreementRevision}.pdf`);
  }catch{setError('Packing slip could not be generated. Retry.');}finally{setBusy(false);}
 }
 return <section className={panel}><h2 className="flex gap-2 text-xl"><QrCode aria-hidden="true"/>Crate Packing Slip / بطاقة الصندوق</h2><p>One approved crate in this single-work rehearsal. QR links to this agreement revision.</p><p className="break-all"><bdi>{token}</bdi></p><button type="button" className={button} disabled={!ready||busy} onClick={()=>void download()}>{busy?'Generating…':'Download packing slip PDF + QR'}</button>{!ready&&<p>Save the artwork’s current physical location under the accepted agreement first.</p>}<p role="status">{error}</p></section>;
}
export function CrateReceiving({state,onRecord}:{state:CommissionState;onRecord:(action:CommissionAction)=>void}){
 const [open,setOpen]=useState(false),[token,setToken]=useState(''),[condition,setCondition]=useState<''|'INTACT'|'DAMAGED'>(''),[photos,setPhotos]=useState<File[]>([]);
 const heading=useId(),c=state.contracts[0],expected=crateToken(state);
 const ready=Boolean(expected&&c&&['ARTIST_APPROVED','LOCKED'].includes(c.status)&&!state.logistics&&state.installationStatus!=='ARCHIVED_CLOSED'&&state.installationStatus!=='EXECUTIVE_IMPOUND');
 const valid=ready&&token.trim()===expected&&condition&&photos.length<=5&&photos.every(validDamagePhoto)&&(condition!=='DAMAGED'||photos.length>0);
 if(!expected)return null;
 return <section className={panel}><h2 className="flex gap-2 text-xl"><PackageOpen aria-hidden="true"/>Crate Receiving & Condition Report / استلام وفحص الصندوق</h2><p>Scan using a keyboard scanner or enter the complete packing-slip ID. Receipt and inspection are recorded together.</p><button type="button" className={button} disabled={!ready} onClick={()=>setOpen(true)}>Receive approved crate</button>{state.logistics&&<p role="status">Receipt recorded · {state.logistics.reference}</p>}<NativeModal isOpen={open} onClose={()=>setOpen(false)} labelledBy={heading} className="max-w-lg bg-[#F7F1E6] ps-5 pe-5 py-5 space-y-4"><h2 id={heading}>Verify crate & condition</h2><button type="button" data-modal-close onClick={()=>setOpen(false)}>Close</button><label className="block">Scanned QR / complete crate ID<input className="block w-full rounded border ps-3 pe-3 py-2" value={token} onChange={e=>setToken(e.target.value)}/></label>{token&&token.trim()!==expected&&<p role="alert">Unknown or superseded crate ID. Check the current packing slip.</p>}<label className="block">Condition<select className="block w-full rounded border ps-3 pe-3 py-2" value={condition} onChange={e=>setCondition(e.target.value as typeof condition)}><option value="">Select inspected condition</option><option value="INTACT">Intact / سليم</option><option value="DAMAGED">Damaged / متضرر</option></select></label>{condition==='DAMAGED'&&<label className="block">Damage evidence — 1–5 PNG/JPEG files, up to 10 MB each<input className="block max-w-full" type="file" multiple accept=".png,.jpg,.jpeg" onChange={e=>setPhotos(Array.from(e.target.files??[]))}/></label>}<button type="button" className={button} disabled={!valid} onClick={()=>{if(!valid||!condition)return;onRecord({type:'receive-crate',actor:'LOGISTICS',token:token.trim(),condition,photos:condition==='DAMAGED'?photos:[],at:new Date().toISOString(),id:crypto.randomUUID()});setOpen(false);}}>Record session receipt & inspection</button><p>Intact inspection enables delivery-tranche eligibility only. Completion still requires close-out.</p></NativeModal></section>;
}
