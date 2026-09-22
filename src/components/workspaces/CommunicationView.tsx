import React, { useState } from 'react';
import { Language, MessageRecord, RoleKey, WorkspaceTab } from '../../types';
import { INITIAL_MESSAGES } from '../../data/mockData';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Clock, 
  CornerDownLeft,
  Lock,
  PlusCircle
} from 'lucide-react';

export interface InstitutionalTemplate {
  id: string;
  labelEn: string;
  labelAr: string;
  contentEn: string;
  contentAr: string;
}

export const INSTITUTIONAL_TEMPLATES: InstitutionalTemplate[] = [
  {
    id: 'tpl-01',
    labelEn: 'Permission Request for Artwork Modification',
    labelAr: 'طلب تصريح بتعديل العمل الفني',
    contentEn: "Sample draft — not sent.\n\nPlease review the proposed artwork treatment and supporting conservation assessment. The responsible team and applicable decision authority must be confirmed before work proceeds.",
    contentAr: "مسودة تجريبية — لم تُرسل.\n\nيرجى مراجعة معالجة العمل الفني المقترحة وتقييم الحفظ الداعم. يلزم تحديد الفريق المسؤول والصلاحية المنطبقة قبل التنفيذ.",
  },
  {
    id: 'tpl-02',
    labelEn: 'Technical Clarification Request',
    labelAr: 'طلب استيضاحات هندسية وفنية',
    contentEn: 'Subject: Technical Clarifications Required for Artwork Installation\n\nDear Artist,\n\nIn preparation for gallery installation at Sharjah Art Museum, our engineering team requires immediate clarification regarding mounting anchor specs, required floor point-load tolerances (kg/m²), and electrical lumen limits for your designated gallery space.',
    contentAr: 'الموضوع: استيضاحات هندسية لازمة لتثبيت العمل الفني\n\nالفنان العزيز،\n\nاستعداداً لتركيب الأعمال بمتحف الشارقة للفنون، يرجى تزويد الفريق الفني فوراً بمواصفات صفائح التثبيت، قدرة تحمل الأرضيات (كجم/م²)، وحدود شدة الإضاءة المطلوبة لقاعتكم.',
  },
  {
    id: 'tpl-03',
    labelEn: 'Approval Request for Fabrication',
    labelAr: 'طلب اعتماد التصنيع والإنتاج',
    contentEn: "Sample draft — not sent.\n\nPlease review the proposed fabrication specifications and material samples. Confirm the applicable approval route and authorized scope before production.",
    contentAr: "مسودة تجريبية — لم تُرسل.\n\nيرجى مراجعة مواصفات التصنيع وعينات المواد المقترحة. يلزم تأكيد مسار الاعتماد والنطاق المصرح به قبل الإنتاج.",
  },
  {
    id: 'tpl-04',
    labelEn: 'Request for Installation Guidelines',
    labelAr: 'طلب إرشادات التثبيت والتركيب',
    contentEn: 'Subject: Request for Installation Guidelines\n\nDear Artist,\n\nTo ensure flawless presentation during the official opening, please provide comprehensive step-by-step assembly diagrams, unpacking safety protocols, and designated spatial offsets for your Biennial artwork.',
    contentAr: 'الموضوع: طلب الدليل الإرشادي لتركيب وتثبيت العمل الفني\n\nالأستاذ الفنان المحترم،\n\nحرصاً على العرض الأمثل لعملكم في الافتتاح الرسمي، يرجى موافاتنا بمخطط التركيب خطوة بخطوة، وإجراءات السلامة لفض الصناديق، والمسافات الفراغية المعتمدة للعمل.',
  },
  {
    id: 'tpl-05',
    labelEn: 'Request for Final Technical Files',
    labelAr: 'طلب الملفات الفنية النهائية',
    contentEn: 'Subject: Request for Final Technical Files\n\nDear Artist,\n\nPlease transmit the master uncompressed media playback files (Apple ProRes 422HQ / Master DCP), projection schematics, and high-resolution raw imagery required for the official Exhibition Catalogue print run.',
    contentAr: 'الموضوع: طلب استلام الملفات الفنية الرقمية النهائية\n\nالأستاذ الفنان المحترم،\n\nيرجى إرسال النسخ الرئيسية غير المضغوطة لملفات العرض (ProRes 422HQ / DCP)، ومخطط العرض الضوئي، والصور عالية الدقة المخصصة لطباعة كتالوج المعرض الرسمي.',
  },
  {
    id: 'tpl-06',
    labelEn: 'External Transport Request',
    labelAr: 'طلب دعم النقل والترحيل الخارجي',
    contentEn: "Sample draft — not sent.\n\nPlease propose transport and customs arrangements for the listed artworks. Insurance coverage, exclusions and responsibility must be checked against the relevant policy and agreement.",
    contentAr: "مسودة تجريبية — لم تُرسل.\n\nيرجى اقتراح ترتيبات نقل الأعمال الفنية والتخليص الجمركي. يلزم التحقق من التغطية التأمينية والاستثناءات والمسؤوليات وفق الوثيقة والاتفاق المنطبقين.",
  },
  {
    id: 'tpl-07',
    labelEn: 'Equipment Request to External Partner',
    labelAr: 'طلب استعارة أجهزة وتجهيزات تقنية',
    contentEn: "Sample draft — not sent.\n\nPlease advise on availability and proposed loan terms for the required projection and audio equipment. Any institutional agreement and authorization remain subject to confirmation.",
    contentAr: "مسودة تجريبية — لم تُرسل.\n\nيرجى الإفادة بتوفر أجهزة العرض والصوت المطلوبة وشروط إعارتها المقترحة. يلزم تأكيد أي اتفاق مؤسسي أو صلاحية ذات صلة.",
  },
  {
    id: 'tpl-08',
    labelEn: 'Written Confirmation Requested',
    labelAr: 'طلب تأكيد خطي رسمي (بديل نموذج الموافقة)',
    contentEn: "Sample draft — not sent.\n\nPlease confirm the packing and condition-inspection arrangements applicable to this artwork. Use the approved agreement to establish any framing requirements and inspection period; this template sets no universal policy.",
    contentAr: "مسودة تجريبية — لم تُرسل.\n\nيرجى تأكيد ترتيبات التعبئة وفحص الحالة المنطبقة على العمل. تُحدد متطلبات الإطار ومدة الفحص من الاتفاق المعتمد؛ لا يقرر هذا النموذج سياسة عامة.",
  },
];

export interface CommunicationViewProps {
  lang?: Language;
  currentRole?: RoleKey;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const CommunicationView: React.FC<CommunicationViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();

  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const currentRole = props.currentRole ?? workspace.currentRole;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  const [messages, setMessages] = useState<MessageRecord[]>(INITIAL_MESSAGES);
  const [draftContent, setDraftContent] = useState('');
  const [withAttachment, setWithAttachment] = useState(false);
  const [taskLinkedToast, setTaskLinkedToast] = useState<string | null>(null);

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const tpl = INSTITUTIONAL_TEMPLATES.find(t => t.id === selectedId);
    if (tpl) {
      setDraftContent((isAr ? 'مسودة تجريبية · لم تُرسل\n\n' : 'Sample draft · not transmitted\n\n') + (isAr ? tpl.contentAr : tpl.contentEn));
    }
    // Reset selector back to default
    e.target.value = '';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftContent.trim()) return;

    const newMessage: MessageRecord = {
      id: `msg-${Date.now()}`,
      senderNameEn: currentRole === 'ARTIST' ? 'Youssef Nabhan (Artist)' : 'Maha (Coordinator)',
      senderNameAr: currentRole === 'ARTIST' ? 'يوسف نبهان (الفنان)' : 'مها (المنسق)',
      senderRole: currentRole === 'ARTIST' ? 'ARTIST' : 'COORDINATOR',
      recipientRole: currentRole === 'ARTIST' ? 'COORDINATOR' : 'ARTIST',
      timestamp: isAr ? 'الآن' : 'Just now',
      contentEn: draftContent,
      contentAr: draftContent,
      hasAttachment: withAttachment,
      attachmentName: withAttachment ? (isAr ? `Engineering_Floor_Load_Clearance.pdf (${i18n.formatNumber(1.2)} ميجابايت)` : 'Engineering_Floor_Load_Clearance.pdf (1.2 MB)') : undefined,
    };

    setMessages([...messages, newMessage]);
    setDraftContent('');
    setWithAttachment(false);
  };

  const handleConvertMessageToTask = (msgId: string) => {
    setTaskLinkedToast(
      isAr 
        ? "معاينة متابعة تجريبية فقط؛ لم تُنشأ مهمة في مساحة أخرى."
        : "Sample follow-up preview only; no task was created in another workspace."
    );
    setTimeout(() => setTaskLinkedToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {taskLinkedToast && (
        <div className="p-3.5 bg-sadu-sage-light border border-sadu-sage rounded-md text-sadu-ink text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sadu-sage" />
            <span>{taskLinkedToast}</span>
          </div>
          <button type="button" aria-label={isAr ? 'إغلاق' : 'Close'} onClick={() => setTaskLinkedToast(null)} className="text-sadu-muted hover:text-sadu-charcoal">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <MessageSquare className="w-4 h-4" />
              <span>{isAr ? "مساحة رسائل تجريبية · لا إرسال فعلي" : "Sample message workspace · not transmitted"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? "محادثة تجريبية بين فنان ومنسق" : "Sample artist–coordinator conversation"}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? "مسودات ورسائل تجريبية داخل هذا المتصفح فقط. لا تُرسل ولا تُحفظ في سجل مؤسسي دائم."
                : "Draft messages remain in this browser only. Nothing is transmitted or stored in a durable institutional record."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded bg-sadu-sand border border-sadu-gold text-xs font-mono font-bold text-sadu-ink">
              THREAD-SCB-2026-YN
            </span>
          </div>
        </div>

        {/* Evidence vs Authority Rule Box */}
        <div className="mt-4 p-3.5 bg-sadu-paper border-s-4 border-sadu-ink text-xs leading-relaxed">
          <span className="font-bold text-sadu-ink block mb-0.5">
            {isAr ? 'قانون الحوكمة (الأدلة مقابل سلطة القرار):' : 'Governance Principle (Evidence vs Decision Authority):'}
          </span>
          {isAr
            ? "لا تغير الرسالة التجريبية نطاقاً معتمداً ولا تفوض دفعاً. يتطلب أي تغيير فعلي أدلته ومراجعته المفوضة؛ ولا تُستنتج صلاحية توقيع لشخص بعينه."
            : "A sample message does not change approved scope or authorize payment. Any real change would require its own evidence and applicable delegated review; no named signatory is inferred."}
        </div>
      </div>

      {/* Message Stream */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-3 text-xs text-sadu-muted">
          <span className="font-semibold text-sadu-charcoal">
            {isAr ? `المراسلات المسجلة في ملف المشاركة (${i18n.formatNumber(messages.length)} رسالة):` : `Recorded Communications in Assignment Dossier (${messages.length}):`}
          </span>
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-sadu-sage" />
            {isAr ? "مثال في الجلسة · دون تشفير" : "Session sample · no encryption"}
          </span>
        </div>

        <div className="space-y-4">
          {messages.map(msg => {
            const isMe = msg.senderRole === currentRole;
            return (
              <div
                key={msg.id}
                className={`p-4 rounded-md border transition-all ${
                  isMe
                    ? 'bg-sadu-sand border-sadu-gold me-6'
                    : 'bg-sadu-paper border-sadu-gold ms-6'
                }`}
              >
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-bold text-sadu-charcoal">
                    {isAr ? msg.senderNameAr : msg.senderNameEn}
                  </span>
                  <span className="text-sadu-muted text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {msg.timestamp}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-sadu-charcoal leading-relaxed">
                  {isAr ? msg.contentAr : msg.contentEn}
                </p>

                {msg.hasAttachment && (
                  <div className="mt-3 p-2.5 bg-sadu-linen rounded border border-sadu-gold text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sadu-ink font-medium">
                      <Paperclip className="w-4 h-4 text-sadu-brick" />
                      <span>{msg.attachmentName}</span>
                    </div>
                    <span className="text-[10px] text-sadu-sage font-semibold">
                      ✓ {isAr ? 'مرجع مرفق تجريبي — لم تُفحص السلامة الرقمية' : 'Sample attachment reference — integrity not checked'}
                    </span>
                  </div>
                )}

                {/* Convert to Task Action for Coordinators */}
                {currentRole === 'COORDINATOR' && (
                  <div className="mt-3 pt-2 border-t border-sadu-gold/40 flex justify-end">
                    <button
                      onClick={() => handleConvertMessageToTask(msg.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-sadu-brick hover:bg-sadu-sand rounded border border-sadu-brick/30 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تحويل المراسلة إلى مهمة بغرفة التحكم' : 'Convert to Linked Task in Control Room'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Message Composer */}
        <form onSubmit={handleSendMessage} className="mt-6 pt-4 border-t border-sadu-gold space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-sadu-muted">
            <span className="font-semibold text-sadu-charcoal">
              {isAr ? 'كتابة رسالة مؤسسية رسمية:' : 'Compose Attributable Institutional Message:'}
            </span>

            <div className="flex items-center gap-3">
              <select
                id="select-institutional-template"
                defaultValue=""
                onChange={handleTemplateSelect}
                className="text-xs bg-sadu-sand border border-sadu-gold text-sadu-charcoal focus:border-sadu-brick rounded-md px-2.5 py-1 cursor-pointer outline-hidden transition-colors"
                title={isAr ? 'إدراج نموذج مراسلة تجريبي' : 'Insert sample correspondence template'}
              >
                <option value="" disabled>
                  {isAr ? 'إدراج نموذج سريع...' : 'Quick Insert Template...'}
                </option>
                {INSTITUTIONAL_TEMPLATES.map(tpl => (
                  <option key={tpl.id} value={tpl.id}>
                    {isAr ? tpl.labelAr : tpl.labelEn}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-sadu-ink">
                <input
                  type="checkbox"
                  checked={withAttachment}
                  onChange={e => setWithAttachment(e.target.checked)}
                  className="rounded text-sadu-brick focus:ring-0"
                />
                <Paperclip className="w-3.5 h-3.5" />
                <span>{isAr ? "إضافة تسمية مرفق تجريبي (دون رفع)" : "Include sample attachment label (no upload)"}</span>
              </label>
            </div>
          </div>

          <textarea
            value={draftContent}
            onChange={e => setDraftContent(e.target.value)}
            rows={3}
            placeholder={
              isAr
                ? "اكتب رسالة تجريبية (لا تُرسل؛ مؤقتة في هذه المعاينة)"
                : "Write a sample message (not transmitted; temporary in this view)"
            }
            className="w-full p-3 text-xs sm:text-sm bg-sadu-linen border border-sadu-gold rounded-md focus:border-sadu-brick focus:outline-hidden text-sadu-charcoal"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-sadu-muted">
              {isAr ? 'المرسل: ' : 'Sender: '}
              <strong>
                {currentRole === 'ARTIST' ? (isAr ? 'يوسف نبهان' : 'Youssef Nabhan') : (isAr ? 'مها (المنسق)' : 'Maha (Coordinator)')}
              </strong>
            </span>

            <button
              type="submit"
              disabled={!draftContent.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-sadu-brick hover:bg-sadu-brick-dark disabled:opacity-40 rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{isAr ? "إضافة رسالة تجريبية · لا إرسال" : "Add sample message · not sent"}</span>
              <Send className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
