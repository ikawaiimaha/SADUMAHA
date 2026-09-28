import { useState } from 'react';
import { Map, Lock, Unlock, Layout } from 'lucide-react';
import { useSessionDraft } from '../context/SessionDrafts';
import { claimSpace, VENUE_SPACES, type SpatialClaim } from '../data/spatialClaims';
import type { NominatedArtistDossier } from './ArtistNominationForm';

export function SharedSpatialLedger({isAr, coordinatorId, dossiers = []}: {isAr: boolean; coordinatorId?: string; dossiers?: NominatedArtistDossier[]}) {
  const [claims, setClaims] = useSessionDraft<SpatialClaim[]>('spatial-claims:biennial-2026', []);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const t = (ar: string, en: string) => isAr ? ar : en;
  const eligible = dossiers.filter(d => d.status === 'APPROVED' && d.assignedCoordinatorId === coordinatorId && d.medium.trim() && !d.amendments?.some(a => a.status === 'PENDING'));
  const warning = t('حجزت هذه المساحة منسقة أخرى. تواصل معها مباشرة للتفاوض على تبديل.', 'This space has been claimed by another coordinator. Contact them directly to negotiate a swap.');
  return <section className="my-5 space-y-4 rounded-lg border border-[#D9CEBA] border-s-4 border-s-[#8B261E] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start text-[#1A1817]">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Map aria-hidden="true" className="size-5"/>{t('سجل توزيع القاعات والمساحات', 'Shared Venue & Spatial Ledger')}</h2>
    <p className="text-sm text-[#736357]">{t('حجوزات محاكاة مشتركة داخل الجلسة لدورة 2026؛ لا مزامنة بين المستخدمين ولا تصريح من جهة الموقع. تُفقد عند تحديث الصفحة.', 'Shared rehearsal claims within this 2026 session; no multi-user synchronization or venue authorization. Refresh clears the claims.')}</p>
    {coordinatorId && !eligible.length && <p>{t('لا توجد ملفات أعمال معتمدة ومؤهلة لهذه المنسقة.', 'No eligible approved artwork dossiers assigned to this coordinator.')}</p>}
    <div className="grid gap-4 lg:grid-cols-3">
      {VENUE_SPACES.map(space => {
        const claim = claims.find(c => c.spaceId === space.id);
        const Icon = claim ? Lock : Unlock;
        const artistId = selected[space.id] ?? '';
        const other = claim && claim.coordinatorId !== coordinatorId;
        return <article key={space.id} className={`space-y-3 rounded border ps-4 pe-4 py-4 ${claim ? 'border-[#D9CEBA] bg-stone-100' : 'border-[#D9CEBA] bg-white'}`}>
          <h3 className="flex items-start gap-2 font-semibold"><Layout aria-hidden="true" className="mt-1 size-4 shrink-0"/>{space[isAr ? 'ar' : 'en']}</h3>
          <p role="status" className="flex items-center gap-2 text-sm"><Icon aria-hidden="true" className="size-4"/>{claim ? 'CLAIMED' : 'AVAILABLE'}</p>
          {claim ? <>
            <dl className="space-y-2 break-words">
              <div><dt className="text-sm text-[#736357]">{t('الفنان المخصص', 'Assigned Artist')}</dt><dd>{claim.artistName}</dd></div>
              <div><dt className="text-sm text-[#736357]">{t('الوسيط / النوع', 'Medium/Type')}</dt><dd>{claim.medium}</dd></div>
              <div><dt className="text-sm text-[#736357]">{t('محجوز بواسطة المنسقة', 'Locked by Coordinator')}</dt><dd>{claim.coordinatorName}</dd></div>
            </dl>
            <p className="text-xs"><time dateTime={claim.claimedAt}>{new Date(claim.claimedAt).toLocaleString(isAr ? 'ar-AE' : 'en-AE')}</time></p>
            <p tabIndex={0} title={other ? warning : t('هذه المساحة محجوزة لملفك ولا يمكن استبدالها هنا.', 'This space is locked to your dossier and cannot be reassigned here.')} className="rounded bg-amber-50 ps-3 pe-3 py-2 text-sm text-amber-900">{other ? warning : t('حجزك مثبت لهذه الجلسة.', 'Your claim is locked for this session.')}</p>
          </> : coordinatorId ? <>
            <label className="block text-sm">{t('الفنان المعتمد', 'Approved artist')}<select value={eligible.some(d=>d.id===artistId) ? artistId : ''} onChange={e=>setSelected(previous=>({...previous,[space.id]:e.target.value}))} className="mt-2 block w-full rounded border ps-3 pe-3 py-2"><option value="">{t('اختر الفنان', 'Select artist')}</option>{eligible.map(d=><option key={d.id} value={d.id}>{d.artistName} · {d.medium}</option>)}</select></label>
            <button type="button" disabled={!eligible.some(d=>d.id===artistId)} className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={()=>setClaims(previous=>claimSpace(previous,{spaceId:space.id,artistId,coordinatorId,actor:'COORDINATOR',at:new Date().toISOString()},dossiers))}>{t('حجز المساحة', 'Claim Space')}</button>
          </> : <p className="text-sm">{t('متاح للحجز من مكتب المنسقة المكلّفة.', 'Available to claim from the assigned Coordinator desk.')}</p>}
        </article>;
      })}
    </div>
  </section>;
}
