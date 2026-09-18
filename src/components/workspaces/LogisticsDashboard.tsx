import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { RfqGeneratorModal } from '../common/RfqGeneratorModal';
import { 
  Truck, 
  MessageSquare, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';

export const LogisticsDashboard: React.FC = () => {
  const { isAr, formatNumber } = useI18n();

  // Direct Artist Messaging State (bypassing coordinator)
  const [messages, setMessages] = useState([
    {
      id: 'LMSG-01',
      sender: isAr ? 'مكتب الشحن واللوجستيات (هازنكامب / إدارة الثقافة)' : 'Logistics Desk (Fine Art Movement)',
      recipient: isAr ? 'يوسف نبهان (الفنان)' : 'Youssef Nabhan (Artist)',
      timestamp: 'Today, 09:30 AM',
      contentEn: 'Dear Youssef, regarding Artwork #2 (Kufic Horizon), could you please provide the final commercial packing invoice and confirm the exterior crate dimensions for customs clearance?',
      contentAr: 'الأستاذ يوسف المحترم، بخصوص العمل الثاني (أفق كوفي)، نرجو تزويدنا بالفاتورة التجارية المبدئية للشحن وتأكيد الأبعاد الخارجية لصندوق الشحن للتخليص الجمركي؟',
      isFromDesk: true,
    },
    {
      id: 'LMSG-02',
      sender: isAr ? 'يوسف نبهان (الفنان)' : 'Youssef Nabhan (Artist)',
      recipient: isAr ? 'مكتب الشحن واللوجستيات' : 'Logistics Desk',
      timestamp: 'Today, 11:15 AM',
      contentEn: 'Hello team, the outer crate dimensions are 180 × 100 × 60 cm, total gross weight with crating is 114 kg. Packing slip and invoice attached.',
      contentAr: 'أهلاً بكم، المقاسات الخارجية للصندوق بعد التبطين هي 180 × 100 × 60 سم، والوزن القائم مع الصندوق 114 كجم. المرفق يتضمن الفاتورة وقائمة التعبئة.',
      isFromDesk: false,
    }
  ]);

  const [newMessageText, setNewMessageText] = useState('');
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [rfqSuccessToast, setRfqSuccessToast] = useState<string | null>(null);

  const handleSendMessage = () => {
    if (!newMessageText.trim()) return;
    const newMsg = {
      id: `LMSG-${Date.now()}`,
      sender: isAr ? 'مكتب الشحن واللوجستيات' : 'Logistics Desk',
      recipient: isAr ? 'يوسف نبهان (الفنان)' : 'Youssef Nabhan (Artist)',
      timestamp: isAr ? 'الآن' : 'Just now',
      contentEn: newMessageText,
      contentAr: newMessageText,
      isFromDesk: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setNewMessageText('');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {rfqSuccessToast && (
        <div className="fixed top-20 right-6 rtl:right-auto rtl:left-6 z-50 bg-sadu-brick text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-200" />
          <span>{rfqSuccessToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4" />
              <span>{isAr ? 'مكتب الشحن والحركة واللوجستيات الفنية' : 'International Freight & Movement Desk'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'إدارة الشحن الدولي ومعاينة الشحنات' : 'Fine Art Logistics & Freight Movement'}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? 'تواصل مباشر مع الفنان لاستلام فواتير الشحن ومقاسات الصناديق دون إشغال المنسق، وإنشاء طلبات عروض الأسعار (RFQ) آلياً من النطاق المجمد.'
                : 'Direct artist messaging for crating specs, intake condition telemetry, and automated RFQ generation from frozen scope.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRfqModal(true)}
              className="px-4 py-2 rounded-md bg-sadu-brick hover:bg-sadu-brick-dark text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'إنشاء وثيقة استدراج عروض (RFQ)' : 'Generate Shipping RFQ'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Artist Secure Messaging (Bypassing Coordinator) */}
        <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sadu-gold/50 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sadu-brick" />
              <h2 className="text-base font-editorial font-bold text-sadu-charcoal">
                {isAr ? 'قناة التواصل المباشر مع الفنان (Direct Movement Channel)' : 'Direct Artist Movement Messaging'}
              </h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sadu-sand text-sadu-charcoal">
              {isAr ? 'قناة مستقلة بدون وسيط' : 'Anti-Bypass Channel'}
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  msg.isFromDesk 
                    ? 'bg-sadu-linen/80 border-sadu-gold ml-6 rtl:ml-0 rtl:mr-6' 
                    : 'bg-white border-sadu-gold/70 mr-6 rtl:mr-0 rtl:ml-6'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-sadu-charcoal">
                  <span>{msg.sender}</span>
                  <span className="text-sadu-muted font-normal text-[10px]">{msg.timestamp}</span>
                </div>
                <p className="text-sadu-charcoal leading-relaxed">
                  {isAr ? msg.contentAr : msg.contentEn}
                </p>
              </div>
            ))}
          </div>

          {/* New message input */}
          <div className="pt-2 border-t border-sadu-gold/40 flex items-center gap-2">
            <input 
              type="text"
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder={isAr ? 'اكتب رسالة إلى الفنان بخصوص أبعاد الصناديق أو الشحن...' : 'Request packing slip, weight or dimensions...'}
              className="flex-1 text-xs p-2.5 rounded border border-sadu-gold bg-white"
            />
            <button
              onClick={handleSendMessage}
              className="p-2.5 bg-sadu-brick hover:bg-sadu-brick-dark text-white rounded text-xs font-bold cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Frozen Scope Telemetry & Shipping RFQ Engine */}
        <div className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-sadu-gold/50 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-sadu-brick" />
              <h2 className="text-base font-editorial font-bold text-sadu-charcoal">
                {isAr ? 'بيانات الشحن المجمدة وطلبات عروض الأسعار' : 'Frozen Scope Shipping Telemetry'}
              </h2>
            </div>
            <span className="text-xs font-mono text-sadu-muted">
              v1.2 FROZEN
            </span>
          </div>

          <div className="p-4 rounded-lg bg-sadu-linen/50 border border-sadu-gold space-y-3 text-xs">
            <div className="font-bold text-sadu-charcoal">
              {isAr ? 'شحنة العمل الفني: أفق كوفي (SCB-2026-YN-02)' : 'Consignment: Kufic Horizon (SCB-2026-YN-02)'}
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 bg-white rounded border border-sadu-gold/50">
                <span className="text-sadu-muted block">{isAr ? 'المقاس الصافي:' : 'Net Artwork:'}</span>
                <span className="font-bold text-sadu-charcoal">165 × 85 × 45 cm</span>
              </div>
              <div className="p-2 bg-white rounded border border-sadu-gold/50">
                <span className="text-sadu-muted block">{isAr ? 'مقاس الصندوق الخارجي:' : 'Gross Crate:'}</span>
                <span className="font-bold text-sadu-brick">180 × 100 × 60 cm</span>
              </div>
              <div className="p-2 bg-white rounded border border-sadu-gold/50">
                <span className="text-sadu-muted block">{isAr ? 'الوزن الصافي / القائم:' : 'Net / Gross Weight:'}</span>
                <span className="font-bold text-sadu-charcoal">84 kg / 114 kg</span>
              </div>
              <div className="p-2 bg-white rounded border border-sadu-gold/50">
                <span className="text-sadu-muted block">{isAr ? 'التحكم البيئي المطلوبة:' : 'Climate Control:'}</span>
                <span className="font-bold text-emerald-800">20°C ± 2°C / RH 50%</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowRfqModal(true)}
                className="w-full py-2 rounded bg-sadu-sand hover:bg-sadu-sand-dark border border-sadu-gold font-bold text-sadu-charcoal flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-sadu-brick" />
                <span>{isAr ? 'استخراج استدراج عروض رسمي لشركات الشحن' : 'Issue RFQ to Freight Forwarders'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RFQ Generator Modal */}
      <RfqGeneratorModal
        isOpen={showRfqModal}
        onClose={() => setShowRfqModal(false)}
        defaultPackageCategory="shipping"
      />
    </div>
  );
};
