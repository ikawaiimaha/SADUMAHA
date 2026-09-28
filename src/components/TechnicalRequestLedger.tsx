import { FabricationLedger } from './DeliverableRouting';
import { activeSpatialClaim, VENUE_SPACES, type SpatialClaim } from '../data/spatialClaims';
import { useState } from 'react';
import { Cpu, Hammer, Settings } from 'lucide-react';
import { useSessionDraft } from '../context/SessionDrafts';
import { addTechnicalRequest, requiresVenueApproval, equipmentOptions, mountingOptions, type TechnicalRequest } from '../data/executionBridges';
export function TechnicalRequestLedger({artistId, artistName, isAr, blocked = false}: {artistId: string; artistName: string; isAr: boolean; blocked?: boolean}) {
  const [claims] = useSessionDraft<SpatialClaim[]>('spatial-claims:biennial-2026', []);
  const claim = activeSpatialClaim(claims, artistId);
  const [rows, setRows] = useSessionDraft<TechnicalRequest[]>(`technical-requests:${artistId}`, []);
  const [equipment, setEquipment] = useState<string>(equipmentOptions[0]);
  const [mounting, setMounting] = useState<string>(mountingOptions[0]);
  const [phase, setPhase] = useState<'PROTOTYPING'|'FINAL_INSTALLATION'>('FINAL_INSTALLATION');
  const t = (ar: string, en: string) => isAr ? ar : en;
  const venueBlocked = requiresVenueApproval(equipment, mounting) && !claim;
  const duplicate = rows.some(row => row.equipment === equipment && row.mounting === mounting && row.phase === phase);
  return <section className="space-y-4 rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start">
    <h2 className="text-xl font-semibold">{t('طلب فني جديد', 'New Technical Request')}</h2><p>{artistName}</p>
    <p className="text-sm text-[#736357]">{claim ? `${VENUE_SPACES.find(space => space.id === claim.spaceId)?.[isAr ? 'ar' : 'en']} · ${claim.curator}` : t('يلزم حجز قاعة قبل طلب تعديلات الموقع.', 'Claim a room in the Spatial Ledger before requesting venue modifications.')}</p>
    {venueBlocked && <p role="status" className="text-amber-900">{t('الطلب مقفل: لم تحجز المنسقة مساحة لهذا الفنان.', 'Request locked: the Coordinator has not claimed a space for this artist.')}</p>}
    <form className="space-y-3" onSubmit={event => {event.preventDefault(); setRows(previous => addTechnicalRequest(previous, {id: crypto.randomUUID(), equipment, mounting, phase, at: new Date().toISOString()}, claims, artistId));}}>
      <label className="block">{t('المعدات المطلوبة', 'Equipment Required')}<select className="mt-1 block w-full rounded border bg-white ps-3 pe-3 py-2" value={equipment} onChange={e => setEquipment(e.target.value)}>{equipmentOptions.map((option, index) => <option key={option} value={option}>{isAr ? ['أجهزة عرض مرئي', 'تجهيزات الإضاءة', 'قاعدة عرض'][index] : option}</option>)}</select></label>
      <label className="block">{t('طريقة التثبيت / الإنشاء', 'Mounting/Structural Method')}<select className="mt-1 block w-full rounded border bg-white ps-3 pe-3 py-2" value={mounting} onChange={e => setMounting(e.target.value)}>{mountingOptions.map((option, index) => <option key={option} value={option}>{isAr ? ['قائم بذاته على الأرض', 'تثبيت سقفي', 'مرساة جدارية'][index] : option}</option>)}</select></label>
      <fieldset className="space-y-2"><legend className="font-semibold">{t('مرحلة الاستخدام','Deployment Phase')}</legend>{(['PROTOTYPING','FINAL_INSTALLATION'] as const).map(value=><label key={value} className="flex items-center gap-2"><input type="radio" name={`deployment-phase-${artistId}`} checked={phase===value} onChange={()=>setPhase(value)}/>{value==='PROTOTYPING'?t('مرحلة التجربة والاختبار','Prototyping & Testing'):t('التركيب النهائي للعرض','Final Exhibition Installation')}</label>)}</fieldset>
      <button disabled={duplicate || venueBlocked} className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed">{duplicate ? t('تم تسجيل هذا الطلب', 'Request already recorded') : t('تسجيل المسارين', 'Record both routes')}</button>
    </form>
    <h3 className="font-semibold">{t('مسارات الاختصاص وسجل التنفيذ', 'Specialist Workstreams & Execution Ledger')}</h3>
    {!rows.length && <p>{t('لا توجد طلبات مسجلة.', 'No requests recorded.')}</p>}
    {rows.map(row => <div key={row.id} className="grid gap-3 sm:grid-cols-2">
      <p className={`flex items-center gap-2 rounded ps-3 pe-3 py-2 sm:col-span-2 ${row.phase==='PROTOTYPING'?'bg-amber-100 text-amber-900':'bg-stone-100 text-stone-800'}`}><Settings aria-hidden="true" className="size-4"/>{row.phase==='PROTOTYPING'?t('مرحلة التجربة والاختبار — إعادة المعدات للمخزون قبل الافتتاح','Prototyping & Testing — return equipment to inventory before opening'):t('التركيب النهائي للعرض','Final Exhibition Installation')}</p>
      <article className="space-y-2 rounded border bg-white ps-4 pe-4 py-4"><Cpu aria-hidden="true" className="size-5"/><h4 className="font-semibold">Equipment Supply: {row.equipment}</h4><p>{t('الجهة المسؤولة: القسم الفني والمرئي', 'Routed To: Technical & AV Department')}</p><p className="break-all text-amber-800">PENDING_INVENTORY_CHECK</p></article>
      {requiresVenueApproval(row.equipment, row.mounting) && <article className="space-y-2 rounded border border-amber-300 bg-white ps-4 pe-4 py-4"><Hammer aria-hidden="true" className="size-5"/><h4 className="font-semibold">Structural Modification: {row.mounting}</h4><p>Routed To: {row.venueClaim?.curator ?? 'Unassigned'} · {row.venueClaim?.spaceId}</p><p className="break-all text-amber-800">PENDING_VENUE_APPROVAL</p></article>}
    </div>)}
    <FabricationLedger artistId={artistId} artistName={artistName} isAr={isAr} actor="TECHNICAL" blocked={blocked}/>
  </section>;
}
