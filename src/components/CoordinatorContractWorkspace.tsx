import React, { useState } from 'react';
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
  status: 'DIRECTOR_APPROVED' | 'CONTRACT_PENDING_SIGNATURE';
}

export interface ContractFormState {
  productionGrant: number;
  shippingMethod: string;
  advancePercentage: number;
  interimPercentage: number;
  finalPercentage: number;
  specialConditions: string;
}

const INITIAL_APPROVED_ARTISTS: VettedArtist[] = [
  {
    id: 'art-001',
    name_ar: 'يوسف نبيل',
    name_en: 'Youssef Nabil',
    nationality: 'Egypt / France',
    medium: 'Hand-coloured Gelatin Silver Print',
    category: 'ESTABLISHED',
    status: 'DIRECTOR_APPROVED'
  },
  {
    id: 'art-002',
    name_ar: 'نورة المزروعي',
    name_en: 'Noura Al Mazrouei',
    nationality: 'United Arab Emirates',
    medium: 'Bronze Casting & Calligraphic Sculpture',
    category: 'EMERGING',
    status: 'DIRECTOR_APPROVED'
  }
];

export function CoordinatorContractWorkspace({ isAr = true }: { isAr?: boolean }) {
  const [artists, setArtists] = useState<VettedArtist[]>(INITIAL_APPROVED_ARTISTS);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(
    INITIAL_APPROVED_ARTISTS[0]?.id ?? null
  );

  const [form, setForm] = useState<ContractFormState>({
    productionGrant: 45000,
    shippingMethod: 'Fine Art Dedicated Freight (Climate Controlled)',
    advancePercentage: 40,
    interimPercentage: 30,
    finalPercentage: 30,
    specialConditions: ''
  });

  const [dispatchedSuccess, setDispatchedSuccess] = useState<string | null>(null);

  const pendingArtists = artists.filter(a => a.status === 'DIRECTOR_APPROVED');
  const dispatchedArtists = artists.filter(a => a.status === 'CONTRACT_PENDING_SIGNATURE');
  const selectedArtist = artists.find(a => a.id === selectedArtistId);

  const handleSelectArtist = (artistId: string) => {
    setSelectedArtistId(artistId);
    const artist = artists.find(a => a.id === artistId);
    if (artist) {
      const isLocal = artist.nationality.toLowerCase().includes('emirates') || artist.nationality.toLowerCase().includes('uae');
      setForm({
        productionGrant: artist.category === 'ESTABLISHED' ? 65000 : 35000,
        shippingMethod: isLocal
          ? (isAr ? 'النقل المباشر للأعمال الفنية (متحف الشارقة للخط)' : 'Local Fine Art Transit (Sharjah Art Museum)')
          : (isAr ? 'شحن فني متخصص مع تحكم بالمناخ (Fine Art Freight)' : 'Fine Art Dedicated Freight (Climate Controlled)'),
        advancePercentage: 40,
        interimPercentage: 30,
        finalPercentage: 30,
        specialConditions: artist.category === 'ESTABLISHED'
          ? (isAr ? 'يتطلب العمل صندوقاً متحفياً مخصصاً مع ضبط حراري ورطوبة دقيقة.' : 'Artist requires dedicated museum crating & humidity control.')
          : (isAr ? 'يتطلب التركيب إشرافاً فنياً مباشراً في ساحة الخط.' : 'Installation requires on-site technical assistance at Calligraphy Square.')
      });
    }
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistId) return;

    setArtists(prev =>
      prev.map(a =>
        a.id === selectedArtistId
          ? { ...a, status: 'CONTRACT_PENDING_SIGNATURE' }
          : a
      )
    );

    const targetArtist = artists.find(a => a.id === selectedArtistId);
    setDispatchedSuccess(
      isAr 
        ? `تم إصدار الاتفاقية الثنائية للفنان (${targetArtist?.name_ar}) بنجاح وتحويل حالته إلى CONTRACT_PENDING_SIGNATURE`
        : `Bilateral agreement generated & dispatched for ${targetArtist?.name_en}. Status updated to CONTRACT_PENDING_SIGNATURE.`
    );

    const remaining = pendingArtists.filter(a => a.id !== selectedArtistId);
    if (remaining.length > 0) {
      handleSelectArtist(remaining[0].id);
    } else {
      setSelectedArtistId(null);
    }
  };

  const totalPercentage = form.advancePercentage + form.interimPercentage + form.finalPercentage;
  const isTrancheValid = totalPercentage === 100;

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
              {isAr 
                ? 'استقبال ملفات الفنانين المعتمدين نهائياً من مدير الملتقى وتحديد مخصصات الإنتاج وشروط الشحن وإصدار العقد القانوني الملزم.'
                : 'Ingest vetted candidates approved by the Biennial Director, set production tranches, and dispatch legal agreements.'}
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
        <div className="bg-[#EBF3ED] border border-[#9DC4A7] text-[#1E4A28] px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2D6A3E]" />
          <span>{dispatchedSuccess}</span>
        </div>
      )}

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
                      onClick={() => handleSelectArtist(artist.id)}
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
                          {artist.category}
                        </span>
                      </div>
                      <div className="text-xs text-[#736357] mt-1">
                        {artist.nationality} · {artist.medium}
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
                    <span className="text-[10px] text-[#8B261E] bg-[#F5E6E4] px-1.5 py-0.5 rounded font-mono">
                      CONTRACT_PENDING_SIGNATURE
                    </span>
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
              <div className="border-b border-[#D9CEBA] pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#2A2624]">
                    {isAr ? `تحديد بنود الاتفاقية: ${selectedArtist.name_ar}` : `Draft Deal Terms: ${selectedArtist.name_en}`}
                  </h3>
                  <p className="text-xs text-[#736357]">
                    {selectedArtist.nationality} · {selectedArtist.medium}
                  </p>
                </div>
                <FileSignature className="w-6 h-6 text-[#8B261E]" />
              </div>

              {/* Terms Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                    {isAr ? 'منحة الإنتاج المعتمدة (AED)' : 'Approved Production Grant (AED)'}
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute start-3 top-2.5 text-[#736357]" />
                    <input
                      type="number"
                      value={form.productionGrant}
                      onChange={e => setForm({ ...form, productionGrant: Number(e.target.value) })}
                      className="w-full ps-9 pe-3 py-2 bg-white border border-[#D9CEBA] rounded text-sm text-[#2A2624] focus:outline-none focus:border-[#8B261E]"
                      required
                      min={0}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                    {isAr ? 'آلية الشحن والتسليم اللوجستي' : 'Shipping & Logistics Method'}
                  </label>
                  <div className="relative">
                    <Truck className="w-4 h-4 absolute start-3 top-2.5 text-[#736357]" />
                    <input
                      type="text"
                      value={form.shippingMethod}
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
                    {isAr ? 'هيكلة الدفعات المالية (Tranches)' : 'Payment Tranche Milestones (%)'}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isTrancheValid ? 'text-[#2D6A3E]' : 'text-[#8B261E]'}`}>
                    {totalPercentage}% / 100%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#736357] mb-1">
                      {isAr ? 'الدفعة 1: مقدماً' : 'Tranche 1: Advance'}
                    </label>
                    <input
                      type="number"
                      value={form.advancePercentage}
                      onChange={e => setForm({ ...form, advancePercentage: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-white border border-[#D9CEBA] rounded text-xs text-center font-mono"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#736357] mb-1">
                      {isAr ? 'الدفعة 2: وصول الشحنة' : 'Tranche 2: Delivery'}
                    </label>
                    <input
                      type="number"
                      value={form.interimPercentage}
                      onChange={e => setForm({ ...form, interimPercentage: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-white border border-[#D9CEBA] rounded text-xs text-center font-mono"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#736357] mb-1">
                      {isAr ? 'الدفعة 3: بعد الافتتاح' : 'Tranche 3: Post-Opening'}
                    </label>
                    <input
                      type="number"
                      value={form.finalPercentage}
                      onChange={e => setForm({ ...form, finalPercentage: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-white border border-[#D9CEBA] rounded text-xs text-center font-mono"
                      min={0}
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
                <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                  {isAr ? 'شروط خاصة أو متطلبات صيانة وتقييم' : 'Special Terms & Institutional Caveats'}
                </label>
                <textarea
                  value={form.specialConditions}
                  onChange={e => setForm({ ...form, specialConditions: e.target.value })}
                  placeholder={isAr ? 'مثال: يتعهد الفنان بإرسال دليل التركيب قبل 30 يوماً من موعد الشحن...' : 'e.g., Artist to submit detailed assembly manual...'}
                  rows={3}
                  className="w-full p-2.5 bg-white border border-[#D9CEBA] rounded text-sm text-[#2A2624] focus:outline-none focus:border-[#8B261E]"
                />
              </div>

              {/* Action Gate Button */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#D9CEBA]">
                <button
                  type="submit"
                  disabled={!isTrancheValid}
                  className="px-5 py-2.5 bg-[#8B261E] hover:bg-[#721F18] text-white text-xs font-semibold rounded-md shadow flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 rtl:rotate-180" />
                  {isAr ? 'توليد وإرسال الاتفاقية الثنائية' : 'Generate & Dispatch Bilateral Agreement'}
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
