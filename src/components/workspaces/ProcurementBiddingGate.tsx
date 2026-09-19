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

  // Fictional bids using scenario assumptions
  const bids = [
    {
      id: 'BID-01',
      vendor: isAr ? 'مورد تجريبي أ' : 'Sample supplier A',
      isRegistered: true,
      amount: '45,000',
      technicalStatus: 'approved',
    },
    {
      id: 'BID-02',
      vendor: isAr ? 'مورد تجريبي ب' : 'Sample supplier B',
      isRegistered: true,
      amount: '48,500',
      technicalStatus: 'approved',
    },
    {
      id: 'BID-03',
      vendor: isAr ? 'مورد تجريبي ج' : 'Sample supplier C',
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
      <div className="p-4 rounded-md bg-rose-50 border-s-4 border-rose-700 flex items-start gap-3 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-rose-900 block text-sm mb-1">
            {isAr ? 'سيناريو مشتريات مقترح — يتطلب التحقق من السياسة:' : 'Proposed procurement scenario — policy validation required:'}
          </span>
          <p className="text-xs text-rose-800 leading-relaxed">
            {isAr 
              ? 'يفترض هذا السيناريو الافتراضي ثلاثة عروض مسجلة ومراجعة فنية قبل محاكاة الأمر. لم تُتحقق الحدود والاستثناءات وصلاحية الاعتماد الفعلية. لا يُنشأ أمر أو التزام.'
              : 'This fictional scenario assumes three registered quotations and a technical review before a simulated order. Actual thresholds, exceptions and approval authority are unverified. No order or commitment is created.'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Step 1: RFQ Generation */}
        <div className={`p-5 rounded-lg border-2 transition-all ${rfqStatus === 'generated' ? 'bg-sadu-sage-light/30 border-sadu-sage/50' : 'bg-sadu-linen border-sadu-gold'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rfqStatus === 'generated' ? 'bg-sadu-sage text-white' : 'bg-sadu-ink text-white'}`}>1</div>
            <h3 className="font-bold text-sadu-charcoal text-sm">{isAr ? 'حالة طلب عرض سعر تجريبي' : 'Sample RFQ state'}</h3>
          </div>
          
          <p className="text-xs text-sadu-muted mb-4 leading-relaxed">
            {isAr 
              ? "تستخدم المعاينة مواصفات تجريبية ثابتة. لا تسترجع نطاقاً موثقاً ولا تحمي من التلاعب."
              : "This preview uses fixed sample specifications. It does not retrieve a verified scope or protect against tampering."}
          </p>

          {rfqStatus === 'idle' ? (
            <button 
              onClick={handleGenerateRFQ}
              className="w-full py-2.5 px-4 bg-sadu-ink text-white text-xs font-bold rounded-md hover:bg-sadu-ink-dark transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'محاكاة إعداد طلب عرض السعر' : 'Simulate RFQ preparation'}</span>
            </button>
          ) : (
            <div className="p-3 bg-white rounded border border-sadu-sage/40 flex items-center justify-between text-xs">
              <span className="font-bold text-sadu-sage flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تمت محاكاة الحالة · لم يُنشأ مستند' : 'RFQ state simulated · no document created'}</span>
              </span>
              <span className="font-mono text-sadu-muted">DEMO-RFQ-089</span>
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
              {isAr ? 'السيناريو: ٣ عروض مسجلة' : 'Scenario: 3 registered quotations'}
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
              {isAr ? "مراجعة أمر تجريبي · دون التزام" : "Sample order review · no commitment"}
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
              <span>{isAr ? "أمر تجريبي · DEMO-LPO-992" : "Sample order · DEMO-LPO-992"}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? "محاكاة إنشاء أمر شراء" : "Simulate order generation"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
