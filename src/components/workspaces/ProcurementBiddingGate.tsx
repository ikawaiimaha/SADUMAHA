import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  DollarSign, 
  Building2, 
  Lock, 
  FileSignature, 
  Send 
} from 'lucide-react';

export const ProcurementBiddingGate: React.FC<{ lang?: 'en' | 'ar' }> = ({ lang = 'en' }) => {
  const isAr = lang === 'ar';

  const [rfqStatus, setRfqStatus] = useState<'idle' | 'generated'>('idle');
  const [lpoStatus, setLpoStatus] = useState<'locked' | 'issued'>('locked');
  const [selectedBid, setSelectedBid] = useState<string | null>(null);

  // Simulated vendor bids based on government requirements
  const bids = [
    {
      id: 'BID-01',
      vendor: isAr ? 'مطبعة الشارقة المعتمدة' : 'Sharjah Official Press',
      isRegistered: true,
      amount: '45,000',
      technicalStatus: 'approved',
    },
    {
      id: 'BID-02',
      vendor: isAr ? 'المدار للطباعة والنشر' : 'Al Madar Graphics',
      isRegistered: true,
      amount: '48,500',
      technicalStatus: 'approved',
    },
    {
      id: 'BID-03',
      vendor: isAr ? 'مطابع الخليج' : 'Gulf Printworks',
      isRegistered: false,
      amount: '42,000',
      technicalStatus: 'rejected', // Rejected by technical due to paper quality
    }
  ];

  // Scenario rule only; not a statement of Sharjah procurement law.
  const registeredBidCount = bids.filter(bid => bid.isRegistered).length;
  const canIssueLpo = rfqStatus === 'generated' && registeredBidCount >= 3 && bids.some(bid => bid.id === selectedBid && bid.isRegistered && bid.technicalStatus === 'approved');

  const handleGenerateRFQ = () => {
    setRfqStatus('generated');
  };

  const handleIssueLPO = () => {
    if (canIssueLpo) {
      setLpoStatus('issued');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Strict Compliance Warning */}
      <div className="p-4 rounded-md bg-rose-50 border-l-4 rtl:border-l-0 rtl:border-r-4 border-rose-700 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-rose-900 block text-sm mb-1">
            {isAr ? 'سيناريو مشتريات مقترح — يتطلب التحقق من السياسة:' : 'Proposed procurement scenario — policy validation required:'}
          </span>
          <p className="text-xs text-rose-800 leading-relaxed">
            {isAr 
              ? 'يُحظر قطعياً إصدار أي أمر شراء محلي (LPO) أو تكليف أي مورد بالعمل بناءً على اتفاق شفهي. يجب توليد طلب عرض سعر (RFQ) رسمي مستمد من النطاق المعتمد (v1.2)، وتوفير ٣ عروض أسعار تنافسية من موردين معتمدين قبل الترسية.' 
              : 'Verbal commitments are strictly prohibited. No Local Purchase Order (LPO) may be issued without an official RFQ derived from the Frozen Scope (v1.2) and a minimum of 3 competitive bids from registered suppliers.'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Step 1: RFQ Generation */}
        <div className={`p-5 rounded-lg border-2 transition-all ${rfqStatus === 'generated' ? 'bg-sadu-sage-light/30 border-sadu-sage/50' : 'bg-sadu-linen border-sadu-gold'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rfqStatus === 'generated' ? 'bg-sadu-sage text-white' : 'bg-sadu-ink text-white'}`}>1</div>
            <h3 className="font-bold text-sadu-charcoal text-sm">{isAr ? 'طلب عرض السعر (RFQ)' : 'Official RFQ Generation'}</h3>
          </div>
          
          <p className="text-xs text-sadu-muted mb-4 leading-relaxed">
            {isAr 
              ? 'سحب المواصفات الهندسية والمقاسات مباشرة من سجل النطاق المعتمد (v1.2) لضمان دقة التسعير ومنع التلاعب.' 
              : 'Pull exact dimensions, materials, and quantities directly from Approved Scope (v1.2) to prevent specification tampering.'}
          </p>

          {rfqStatus === 'idle' ? (
            <button 
              onClick={handleGenerateRFQ}
              className="w-full py-2.5 px-4 bg-sadu-ink text-white text-xs font-bold rounded-md hover:bg-sadu-ink-dark transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'توليد وثيقة عرض السعر الرسمية' : 'Generate Official RFQ'}</span>
            </button>
          ) : (
            <div className="p-3 bg-white rounded border border-sadu-sage/40 flex items-center justify-between text-xs">
              <span className="font-bold text-sadu-sage flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تم توليد الوثيقة' : 'RFQ Generated'}</span>
              </span>
              <span className="font-mono text-sadu-muted">RFQ-2026-089</span>
            </div>
          )}
        </div>

        {/* Step 2: Competitive Bidding */}
        <div className={`p-5 rounded-lg border-2 lg:col-span-2 transition-all ${rfqStatus === 'idle' ? 'opacity-50 pointer-events-none bg-sadu-sand/40 border-sadu-gold/40' : 'bg-sadu-linen border-sadu-gold'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedBid ? 'bg-sadu-sage text-white' : 'bg-sadu-ink text-white'}`}>2</div>
              <h3 className="font-bold text-sadu-charcoal text-sm">{isAr ? 'عروض الأسعار والترسية المبدئية' : 'Competitive Bids & Technical Award'}</h3>
            </div>
            <span className="text-[10px] font-bold text-sadu-brick bg-sadu-sand px-2 py-0.5 rounded border border-sadu-gold">
              {isAr ? 'مطلوب ٣ عروض كحد أدنى' : 'Min. 3 Bids Required'}
            </span>
          </div>

          <div className="space-y-2">
            {bids.map((bid) => (
              <div 
                key={bid.id} 
                onClick={() => {
                  if (rfqStatus === 'generated' && bid.isRegistered && bid.technicalStatus === 'approved') setSelectedBid(bid.id);
                }}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border text-xs transition-all ${
                  bid.technicalStatus === 'rejected' ? 'bg-sadu-sand/40 border-sadu-gold/50 opacity-60 cursor-not-allowed' :
                  selectedBid === bid.id ? 'bg-sadu-brick-light/40 border-sadu-brick ring-1 ring-sadu-brick cursor-pointer' : 
                  'bg-white border-sadu-gold hover:border-sadu-brick cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    selectedBid === bid.id ? 'border-sadu-brick bg-sadu-brick text-white' : 'border-sadu-muted'
                  }`}>
                    {selectedBid === bid.id && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-bold text-sadu-charcoal block">{bid.vendor}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${bid.isRegistered ? 'bg-sadu-sage/20 text-sadu-ink' : 'bg-rose-100 text-rose-800'}`}>
                        {bid.isRegistered ? (isAr ? 'مورد معتمد' : 'Registered Supplier') : (isAr ? 'غير مسجل' : 'Unregistered')}
                      </span>
                      <span className="text-[9px] text-sadu-muted">
                        {bid.technicalStatus === 'approved' ? (isAr ? '✓ اجتاز الفحص الفني' : '✓ Tech Passed') : (isAr ? '✕ رُفض فنياً' : '✕ Tech Rejected')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="font-mono font-bold text-sadu-charcoal text-sm text-start sm:text-end rtl:sm:text-start ms-7 sm:ms-0">
                  AED {bid.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3: LPO Generation Block */}
      <div className={`p-6 rounded-lg border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        lpoStatus === 'issued' ? 'bg-sadu-sage-light/30 border-sadu-sage' : 
        selectedBid ? 'bg-sadu-linen border-sadu-brick shadow-md' : 
        'bg-sadu-sand/40 border-sadu-gold/40'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold ${lpoStatus === 'issued' ? 'bg-sadu-sage' : selectedBid ? 'bg-sadu-brick' : 'bg-sadu-muted'}`}>
            3
          </div>
          <div>
            <h3 className={`font-editorial font-bold text-lg ${lpoStatus === 'issued' ? 'text-sadu-ink' : 'text-sadu-charcoal'}`}>
              {isAr ? 'الاعتماد المالي وإصدار أمر الشراء (LPO)' : 'Financial Sign-off & LPO Generation'}
            </h3>
            <p className="text-xs text-sadu-muted mt-1 max-w-lg">
              {lpoStatus === 'issued' 
                ? (isAr ? 'اكتملت محاكاة أمر الشراء؛ لم تُحجز ميزانية ولم يُرسل أمر.' : 'LPO simulation complete. No budget committed or order sent.')
                : (isAr ? 'المثال متوقف: عرضان فقط من أصل ثلاثة صادران عن موردين مسجلين. يلزم أيضاً طلب عرض سعر واختيار مجتاز للفحص الفني.' : 'Demo blocked: only 2 of 3 sample bids are from registered suppliers. A technically accepted selection and RFQ are also required.')}
            </p>
          </div>
        </div>

        <button
          onClick={handleIssueLPO}
          disabled={!canIssueLpo || lpoStatus === 'issued'}
          className={`px-6 py-3 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 ${
            lpoStatus === 'issued' ? 'bg-sadu-sand text-sadu-ink border border-sadu-gold cursor-default' :
            selectedBid ? 'bg-sadu-brick text-white hover:bg-sadu-brick-dark cursor-pointer' :
            'bg-sadu-gold/40 text-white cursor-not-allowed'
          }`}
        >
          {lpoStatus === 'issued' ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'LPO-2026-992 صادر' : 'LPO Issued (LPO-2026-992)'}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'اعتماد وإصدار LPO' : 'Authorize & Generate LPO'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
