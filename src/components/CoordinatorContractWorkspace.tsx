import { useMockupText } from '../i18n/useMockupText';
import React, { useState, useEffect } from 'react';
import type { BilateralContract } from '../types/contractStage6';
import { validParticipationScope, type ParticipationCategory } from '../data/soloInvitation2026';
import { SoloInvitationPreview } from './SoloInvitationPreview';
import { AgreementMilestones } from './CommissionSummary';
import { 
  FileSignature, 
  Send, 
  DollarSign, 
  Truck, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';

export type ArtistCategory = 'EMERGING' | 'ESTABLISHED';

export interface VettedArtist {
  id: string;
  name_ar: string;
  name_en: string;
  nationality: string;
  medium: string;
  category: ArtistCategory;
  prCleared?: boolean;
  technicalCleared?: boolean;
  status: string; 
}

export interface ContractFormState {
  participationCategory: ParticipationCategory;
  artworkCount: number;
  venue: string;
  venueClearanceReference: string;
  productionGrant: number;
  shippingMethod: string;
  advancePercentage: number;
  interimPercentage: number;
  finalPercentage: number;
  specialConditions: string;
}

export interface CoordinatorContractWorkspaceProps {
  isAr?: boolean;
  artists: VettedArtist[];
  contracts?: BilateralContract[];
  onDispatchContract: (artistId: string, contractData: ContractFormState) => void;
}

export function CoordinatorContractWorkspace({ 
  isAr = true, 
  artists = [],
  contracts = [],
  onDispatchContract 
}: CoordinatorContractWorkspaceProps) {
  const tr = useMockupText(isAr);
  
  // Filter incoming global state
  const pendingArtists = artists.filter(a => a.status === 'DIRECTOR_APPROVED');
  const dispatchedArtists = artists.filter(a => a.status === 'CONTRACT_PENDING_SIGNATURE');

  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<ContractFormState>({
    participationCategory: 'SINGLE_WORK',
    artworkCount: 1,
    venue: '',
    venueClearanceReference: '',
    productionGrant: 45000,
    shippingMethod: 'Fine Art Dedicated Freight (Climate Controlled)',
    advancePercentage: 30,
    interimPercentage: 40,
    finalPercentage: 30,
    specialConditions: ''
  });

  // Auto-select the first pending artist if none is selected
  useEffect(() => {
    if (!selectedArtistId && pendingArtists.length > 0) {
      setSelectedArtistId(pendingArtists[0].id);
    } else if (pendingArtists.length === 0) {
      setSelectedArtistId(null);
    }
  }, [pendingArtists, selectedArtistId]);

  const selectedArtist = artists.find(a => a.id === selectedArtistId);

  const existingAgreement = contracts.find(c => c.artistId === selectedArtistId);
  useEffect(() => {
    if (existingAgreement?.status !== 'CONTRACT_DISPUTED') return;
    setForm({ participationCategory: existingAgreement.participationCategory ?? 'SINGLE_WORK', artworkCount: existingAgreement.artworkCount ?? 1, productionGrant: existingAgreement.productionCost, shippingMethod: existingAgreement.shippingTerms,
      advancePercentage: existingAgreement.tranches.advancePercentage, interimPercentage: existingAgreement.tranches.deliveryPercentage,
      finalPercentage: existingAgreement.tranches.installationPercentage, specialConditions: existingAgreement.specialConditions || '',
      venue: existingAgreement.venue || '', venueClearanceReference: existingAgreement.venueClearanceReference || '' });
    setDispatchedSuccess(null);
  }, [selectedArtistId, existingAgreement?.status]);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistId || !isTrancheValid || !venueReady || !validParticipationScope(form)) return;

    
    // 1. Pass the data UP to App.tsx instead of handling it locally
    onDispatchContract(selectedArtistId, form);

    // 2. Show success message
    setDispatchedSuccess(selectedArtistId);
  };

  const dispatchedArtist = artists.find(a => a.id === dispatchedSuccess);

  const venueReady = ['DEPARTMENT', 'HOUSE_OF_WISDOM', 'SHARJAH_ART_MUSEUM'].includes(form.venue) && (form.venue === 'DEPARTMENT' || Boolean(form.venueClearanceReference.trim()));
  const totalPercentage = form.advancePercentage + form.interimPercentage + form.finalPercentage;
  const isTrancheValid = Math.abs(totalPercentage - 100) < 0.000001 && Number.isFinite(form.productionGrant) && form.productionGrant > 0 && [form.advancePercentage, form.interimPercentage, form.finalPercentage].every(n => Number.isFinite(n) && n > 0 && n <= 100);

  return (
    <div className="w-full space-y-6 text-start">
      {/* Header Banner */}
      <div className="bg-[#FAF7F2] border border-[#D9CEBA] rounded-lg p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-[#8B261E] text-white">
                {isAr ? 'المرحلة 6' : 'Stage 6'}
              </span>
              <span className="text-xs uppercase tracking-wider text-[#736357]">
                {isAr ? 'مكتب التنسيق العام — المنسقة' : 'General Coordination Desk'}
              </span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#2A2624] mt-1">
              {isAr ? 'صياغة العقود الثنائية وإبرام الاتفاقيات' : 'Bilateral Contracting & Deal Terms'}
            </h1>
            <p className="text-xs text-[#594F47] mt-1 max-w-2xl">
              {isAr ? 'استقبال ملفات الفنانين المعتمدين نهائياً من مدير الملتقى وتحديد مخصصات الإنتاج وشروط الشحن وإعداد اتفاقية خيالية للعرض فقط.' : 'Ingest vetted candidates approved by the Biennial Director, set production tranches, and prepare a fictional agreement for this demo.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#EDE4D3] border border-[#C5B79F] px-4 py-2 rounded text-center">
              <span className="block text-xs text-[#736357]">{isAr ? 'بانتظار التعاقد' : 'Pending Deals'}</span>
              <span className="text-lg font-bold text-[#8B261E]">{pendingArtists.length}</span>
            </div>
            <div className="bg-[#EDE4D3] border border-[#C5B79F] px-4 py-2 rounded text-center">
              <span className="block text-xs text-[#736357]">{isAr ? 'تم الإرسال' : 'Dispatched'}</span>
              <span className="text-lg font-bold text-[#2A2624]">{dispatchedArtists.length}</span>
            </div>
          </div>
        </div>
      </div>

      {dispatchedSuccess && (
        <div className="bg-[#EBF3ED] border border-[#9DC4A7] text-[#1E4A28] px-4 py-3 rounded-lg flex items-center gap-3 text-sm mb-6">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2D6A3E]" />
          <span>{isAr
            ? `تم إصدار الاتفاقية الثنائية للفنان (${dispatchedArtist?.name_ar ?? ''}) بنجاح. جاهزة لمحاكاة قبول الفنان؛ لم تُرسل أي مراسلات خارجية.`
            : `Bilateral agreement generated & dispatched for ${dispatchedArtist?.name_en ?? ''}. Ready for simulated artist acceptance; nothing was sent externally.`}</span>
        </div>
      )}

      {contracts.map(contract => <AgreementMilestones key={contract.id} contract={contract} isAr={isAr} />)}

      {/* Main Grid: Queue on one side, Terms Editor on the other */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approved Artist Queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#FAF7F2] border border-[#D9CEBA] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-[#2A2624] mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#8B261E]" />
              {isAr ? 'قائمة الفنانين المعتمدين (المرحلة 5)' : 'Approved Candidates (Stage 5)'}
            </h2>

            {pendingArtists.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#736357]">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                {isAr ? 'لا يوجد فنانون بانتظار العقود حالياً.' : 'No approved dossiers awaiting contracts.'}
              </div>
            ) : (
              <div className="space-y-2">
                {pendingArtists.map(artist => {
                  const isSelected = artist.id === selectedArtistId;
                  return (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => setSelectedArtistId(artist.id)}
                      className={`w-full p-3 rounded-md border transition-all text-start cursor-pointer ${
                        isSelected
                          ? 'border-[#8B261E] bg-[#F4EDE2] shadow-sm'
                          : 'border-[#E0D5C1] bg-white hover:bg-[#F9F5EF]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#2A2624]">
                          {isAr ? artist.name_ar : artist.name_en}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                          artist.category === 'EMERGING'
                            ? 'bg-[#E1EAF2] text-[#1E4263]'
                            : 'bg-[#EFE8D6] text-[#6E4B17]'
                        }`}>
                          {tr(artist.category)}
                        </span>
                      </div>
                      <div className="text-xs text-[#736357] mt-1">
                        {tr(artist.nationality)} · {tr(artist.medium)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recently Dispatched Queue */}
          <div className="bg-[#FAF7F2] border border-[#D9CEBA] rounded-lg p-4">
            <h2 className="text-xs font-semibold text-[#736357] uppercase tracking-wider mb-2">
              {isAr ? 'الاتفاقيات المرسلة للتوقيع' : 'Agreements Pending Signature'}
            </h2>
            {dispatchedArtists.length === 0 ? (
              <div className="text-xs text-[#8C7E72] italic py-2">
                {isAr ? 'لم يتم إرسال عقود بعد في هذه الجلسة.' : 'No dispatched agreements yet.'}
              </div>
            ) : (
              <div className="divide-y divide-[#E0D5C1] text-xs">
                {dispatchedArtists.map(a => (
                  <div key={a.id} className="py-2 flex items-center justify-between">
                    <span className="text-[#2A2624] font-medium">{isAr ? a.name_ar : a.name_en}</span>
                    <span className="text-[10px] text-[#8B261E] bg-[#F5E6E4] px-1.5 py-0.5 rounded font-mono"> {tr("CONTRACT_PENDING")} </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contract Terms Editor */}
        <div className="lg:col-span-8">
          {selectedArtist ? (
            <form onSubmit={handleDispatch} className="bg-[#FAF7F2] border border-[#D9CEBA] rounded-lg p-6 space-y-6">
              <div className="space-y-3 text-start">
                <label className="block">{isAr ? 'فئة المشاركة' : 'Participation category'}
                  <select value={form.participationCategory} onChange={e => setForm({ ...form, participationCategory: e.target.value as ParticipationCategory, artworkCount: e.target.value === 'SOLO_EXHIBITION' ? 15 : 1 })} className="block w-full rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-3 pe-3 py-2">
                    <option value="SINGLE_WORK">{isAr ? 'عمل منفرد' : 'Single work'}</option>
                    <option value="SOLO_EXHIBITION">{isAr ? 'معرض شخصي (15–20 عملاً)' : 'Solo exhibition (15–20 works)'}</option>
                  </select>
                </label>
                {form.participationCategory === 'SOLO_EXHIBITION' && <>
                  <label className="block">{isAr ? 'عدد الأعمال المشاركة' : 'Number of artworks'}
                    <input type="number" min={15} max={20} step={1} required value={Number.isNaN(form.artworkCount) ? '' : form.artworkCount} onChange={e => setForm({ ...form, artworkCount: e.target.valueAsNumber })} aria-invalid={!validParticipationScope(form)} className="block w-full rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-3 pe-3 py-2" />
                  </label>
                  {!validParticipationScope(form) && <p role="alert" className="text-sm text-[#8B261E]">{isAr ? 'أدخل عدداً صحيحاً من 15 إلى 20.' : 'Enter a whole number from 15 to 20.'}</p>}
                  <SoloInvitationPreview artistName={isAr ? selectedArtist.name_ar : selectedArtist.name_en} artworkCount={form.artworkCount} />
                </>}
              </div>
              <div className="border-b border-[#D9CEBA] pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#2A2624]">
                    {isAr ? `تحديد بنود الاتفاقية: ${selectedArtist.name_ar}` : `Draft Deal Terms: ${selectedArtist.name_en}`}
                  </h3>
                  <p className="text-xs text-[#736357]">
                    {tr(selectedArtist.nationality)} · {tr(selectedArtist.medium)}
                  </p>
                </div>
                <FileSignature className="w-6 h-6 text-[#8B261E]" />
              </div>

              {/* Terms Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="deal-grant" className="block text-xs font-semibold text-[#4A423D] mb-1">
                    {isAr ? 'منحة الإنتاج المعتمدة (درهم)' : 'Approved Production Grant (AED)'}
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute start-3 top-2.5 text-[#736357]" />
                    <input
                      type="number"
                      id="deal-grant"
                      value={form.productionGrant}
                      onChange={e => setForm({ ...form, productionGrant: Number(e.target.value) })}
                      className="w-full ps-9 pe-3 py-2 bg-white border border-[#D9CEBA] rounded text-sm text-[#2A2624] focus:outline-none focus:border-[#8B261E]"
                      required
                      min={0.01} step="any"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="deal-shipping" className="block text-xs font-semibold text-[#4A423D] mb-1">
                    {isAr ? 'آلية الشحن والتسليم اللوجستي' : 'Shipping & Logistics Method'}
                  </label>
                  <div className="relative">
                    <Truck className="w-4 h-4 absolute start-3 top-2.5 text-[#736357]" />
                    <input
                      type="text"
                      id="deal-shipping"
                      value={tr(form.shippingMethod)}
                      onChange={e => setForm({ ...form, shippingMethod: e.target.value })}
                      className="w-full ps-9 pe-3 py-2 bg-white border border-[#D9CEBA] rounded text-sm text-[#2A2624] focus:outline-none focus:border-[#8B261E]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Tranche Allocation */}
              <div className="bg-[#F4EDE2] border border-[#D9CEBA] rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2A2624] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#8B261E]" />
                    {isAr ? 'هيكلة الدفعات المالية (٪)' : 'Payment Tranche Milestones (%)'}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isTrancheValid ? 'text-[#2D6A3E]' : 'text-[#8B261E]'}`}>
                    {totalPercentage}% / 100%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="deal-advance" className="block text-[11px] text-[#736357] mb-1">
                      {isAr ? 'الدفعة 1: مقدماً' : 'Tranche 1: Advance'}
                    </label>
                    <input
                      type="number"
                      id="deal-advance"
                      value={form.advancePercentage}
                      onChange={e => setForm({ ...form, advancePercentage: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-white border border-[#D9CEBA] rounded text-xs text-center font-mono"
                      min={0.01} step="any"
                      max={100}
                    />
                  </div>
                  <div>
                    <label htmlFor="deal-delivery" className="block text-[11px] text-[#736357] mb-1">
                      {isAr ? 'الدفعة 2: وصول الشحنة' : 'Tranche 2: Delivery'}
                    </label>
                    <input
                      type="number"
                      id="deal-delivery"
                      value={form.interimPercentage}
                      onChange={e => setForm({ ...form, interimPercentage: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-white border border-[#D9CEBA] rounded text-xs text-center font-mono"
                      min={0.01} step="any"
                      max={100}
                    />
                  </div>
                  <div>
                    <label htmlFor="deal-post-opening" className="block text-[11px] text-[#736357] mb-1">
                      {isAr ? 'الدفعة 3: الإكمال والإعادة' : 'Tranche 3: Completion & Return'}
                    </label>
                    <input
                      type="number"
                      id="deal-post-opening"
                      value={form.finalPercentage}
                      onChange={e => setForm({ ...form, finalPercentage: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-white border border-[#D9CEBA] rounded text-xs text-center font-mono"
                      min={0.01} step="any"
                      max={100}
                    />
                  </div>
                </div>

                {!isTrancheValid && (
                  <p className="text-[11px] text-[#8B261E] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {isAr ? 'مجموع نسب الدفعات يجب أن يساوي 100%' : 'Total tranche percentage must equal exactly 100%'}
                  </p>
                )}
              </div>

              {/* Special Conditions */}
              <div>
                <label htmlFor="deal-special-conditions" className="block text-xs font-semibold text-[#4A423D] mb-1">
                  {isAr ? 'شروط خاصة أو متطلبات صيانة وتقييم' : 'Special Terms & Institutional Caveats'}
                </label>
                <textarea
                  id="deal-special-conditions"
                      value={form.specialConditions}
                  onChange={e => setForm({ ...form, specialConditions: e.target.value })}
                  placeholder={isAr ? 'مثال: يتعهد الفنان بإرسال دليل التركيب قبل 30 يوماً من موعد الشحن...' : 'e.g., Artist to submit detailed assembly manual...'}
                  rows={3}
                  className="w-full p-2.5 bg-white border border-[#D9CEBA] rounded text-sm text-[#2A2624] focus:outline-none focus:border-[#8B261E]"
                />
              </div>

              <section className="rounded border border-[#D9CEBA] bg-[#F7F1E6] ps-4 pe-4 py-4 space-y-3">
                <label className="block">{isAr ? 'مكان العرض والجهة المسؤولة' : 'Venue and responsible entity'}
                  <select value={form.venue} onChange={e => setForm({...form, venue: e.target.value, venueClearanceReference: ''})} className="block w-full border ps-3 pe-3 py-2">
                    <option value="">{isAr ? 'اختر المكان' : 'Select venue'}</option><option value="DEPARTMENT">{isAr ? 'موقع تابع للدائرة' : 'Department venue'}</option><option value="HOUSE_OF_WISDOM">House of Wisdom · Shurooq</option><option value="SHARJAH_ART_MUSEUM">Sharjah Art Museum · Sharjah Museums Authority</option>
                  </select>
                </label>
                {form.venue && form.venue !== 'DEPARTMENT' && <label className="block">{isAr ? 'مرجع موافقة الجهة الخارجية — خيالي' : 'External venue clearance reference — fictional'}<input value={form.venueClearanceReference} onChange={e => setForm({...form, venueClearanceReference: e.target.value})} className="block w-full border ps-3 pe-3 py-2" /></label>}
                <p>{isAr ? 'لا يمكن إنشاء الاتفاقية لموقع خارجي قبل تسجيل مرجع الموافقة التجريبية.' : 'External venues require a recorded rehearsal clearance before agreement generation.'}</p>
              </section>
              {existingAgreement?.status === 'CONTRACT_DISPUTED' && <div className="rounded border border-[#8B261E] ps-4 pe-4 py-3"><h3>{isAr ? 'طلب تعديل الفنان' : 'Artist amendment request'}</h3><p>{existingAgreement.auditTrail.at(-1)?.artistJustification}</p></div>}
              {/* Action Gate Button */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#D9CEBA]">
                <button
                  type="submit"
                  disabled={!isTrancheValid || !venueReady || !validParticipationScope(form)}
                  className="px-5 py-2.5 bg-[#8B261E] hover:bg-[#721F18] text-white text-xs font-semibold rounded-md shadow flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 rtl:rotate-180" />
                  {isAr ? 'إنشاء الاتفاقية التجريبية' : 'Generate Demo Agreement'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#FAF7F2] border border-[#D9CEBA] rounded-lg p-12 text-center text-xs text-[#736357]">
              {isAr ? 'اختر فناناً من القائمة المعتمدة للبدء بصياغة بنود العقد.' : 'Select an approved candidate to initiate agreement formulation.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoordinatorContractWorkspace;
