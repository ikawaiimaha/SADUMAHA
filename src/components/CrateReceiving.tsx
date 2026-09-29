import {useRef, useState} from 'react';
import {QrCode, ScanBarcode, PackageCheck, Scale} from 'lucide-react';
import {validDockInspection,type DockInspection} from '../data/installationOperations';
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
export function CrateReceiving({state,onRecord,onClearPhysicalAsset}:{state:CommissionState;onRecord:(action:CommissionAction)=>void;onClearPhysicalAsset?:(artistId:string,action:CommissionAction)=>void}){
 const [token,setToken]=useState(''),[photos,setPhotos]=useState<File[]>([]),[inspection,setInspection]=useState<Partial<DockInspection>>({}),[submitted,setSubmitted]=useState(false);
 const committing=useRef(false),c=state.contracts[0],expected=state.logistics?.reference??crateToken(state);
 const ready=Boolean(expected&&c&&['ARTIST_APPROVED','LOCKED'].includes(c.status)&&!state.logistics?.inspection&&!state.logistics?.closedAt&&state.installationStatus!=='ARCHIVED_CLOSED'&&state.installationStatus!=='EXECUTIVE_IMPOUND');
 const validId=Boolean(expected&&token.trim()===expected);
 const intact=inspection.condition==='INTACT'&&inspection.seal==='MATCH';
 const valid=ready&&validId&&validDockInspection(inspection as DockInspection)&&photos.length<=5&&photos.every(validDamagePhoto)&&(intact||photos.length>0);
 const field='block w-full rounded border ps-3 pe-3 py-2 bg-[#FFFDF7]';
 function submit(){
  if(!valid||committing.current||!c)return;committing.current=true;
  const action:CommissionAction=state.logistics?{type:'verify-arrival',actor:'LOGISTICS',token:token.trim(),inspection:inspection as DockInspection,photos,at:new Date().toISOString(),id:crypto.randomUUID()}:{type:'receive-crate',actor:'LOGISTICS',token:token.trim(),inspection:inspection as DockInspection,condition:intact?'INTACT':'DAMAGED',photos:intact?[]:photos,at:new Date().toISOString(),id:crypto.randomUUID()};
  if(intact&&onClearPhysicalAsset)onClearPhysicalAsset(c.artistId,action);else onRecord(action);
  setSubmitted(true);committing.current=false;
 }
 return <section className={panel}><h2 className="flex gap-2 text-xl"><PackageCheck aria-hidden="true"/>منصة استلام الأعمال / Loading Dock Receiving</h2><p>Session rehearsal. Scan the current packing-slip QR using a keyboard scanner or enter its complete ID.</p>{!expected&&<p>Awaiting an approved crate and packing-slip ID.</p>}<label className="block"><ScanBarcode aria-hidden="true"/>Scan Crate QR or Enter ID<input className={field} disabled={!ready} value={token} onChange={e=>setToken(e.target.value)} placeholder="Current packing-slip ID"/></label>{token&&!validId&&<p role="alert">Unknown or superseded crate ID.</p>}{validId&&ready&&<fieldset disabled={submitted} className="grid gap-3 sm:grid-cols-2"><legend className="flex gap-2"><Scale aria-hidden="true"/>Verified packed dimensions & gross weight / القياسات الفعلية</legend>{(['lengthCm','widthCm','heightCm','grossWeightKg'] as const).map(k=><label key={k}>{{lengthCm:'Length (cm) / الطول',widthCm:'Width (cm) / العرض',heightCm:'Height (cm) / الارتفاع',grossWeightKg:'Weight (kg) / الوزن'}[k]}<input className={field} type="number" min="0.01" max="100000" step="any" value={inspection[k]??''} onChange={e=>setInspection({...inspection,[k]:e.target.value===''?undefined:Number(e.target.value)})}/></label>)}<label>Exterior Seal Check / فحص الختم<select className={field} value={inspection.seal??''} onChange={e=>setInspection({...inspection,seal:e.target.value as DockInspection['seal']})}><option value="">Select inspected seal</option><option value="MATCH">Match / مطابق</option><option value="TAMPERED">Tampered / متلاعب به</option></select></label><label>Artwork Condition / حالة العمل<select className={field} value={inspection.condition??''} onChange={e=>setInspection({...inspection,condition:e.target.value as DockInspection['condition']})}><option value="">Select condition</option><option value="INTACT">Intact / سليم</option><option value="MINOR_DAMAGE">Minor Damage / ضرر طفيف</option><option value="SEVERE_DAMAGE">Severe Damage / ضرر جسيم</option></select></label>{!intact&&inspection.condition&&<label>Damage / tamper evidence (1–5 PNG/JPEG, max 10 MB each)<input className="block max-w-full" type="file" multiple accept=".png,.jpg,.jpeg" onChange={e=>setPhotos(Array.from(e.target.files??[]))}/></label>}<button className={button} disabled={!valid||submitted} onClick={submit}>{intact?'تسجيل الوصول واعتماد الحالة / Record Arrival & Clear Condition':'Record arrival on hold / تسجيل الوصول مع التحفظ'}</button></fieldset>}{state.logistics?.inspection&&<p role="status">Recorded: {state.logistics.inspection.lengthCm} × {state.logistics.inspection.widthCm} × {state.logistics.inspection.heightCm} cm · {state.logistics.inspection.grossWeightKg} kg · {state.logistics.inspection.seal} · {state.logistics.inspection.condition}</p>}<p>Only intact artwork with matching seals clears the delivery gate. Damage or tampering remains on hold. Completion retains its separate close-out requirements.</p></section>;
}
