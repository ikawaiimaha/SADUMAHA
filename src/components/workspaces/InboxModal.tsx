import React, { useMemo, useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { X, Mail, MailOpen, Send, Paperclip } from 'lucide-react';

export interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialThreadId?: string;
}

interface InboxMessage {
  fromEn: string;
  fromAr: string;
  bodyEn: string;
  bodyAr: string;
  timestamp: string;
}

interface InboxThread {
  id: string;
  subjectEn: string;
  subjectAr: string;
  previewEn: string;
  previewAr: string;
  timestamp: string;
  unread: boolean;
  messages: InboxMessage[];
}

const THREADS: InboxThread[] = [
  {
    id: 'youssef-cv',
    subjectEn: 'Youssef Nabhan — CV Attachment',
    subjectAr: 'يوسف نبهان — مرفق السيرة الذاتية',
    previewEn: 'Please find the updated CV and portfolio attached for the committee review.',
    previewAr: 'يرجى الاطلاع على السيرة الذاتية والمعرض المحدّث المرفق لمراجعة اللجنة.',
    timestamp: 'Today, 09:12',
    unread: true,
    messages: [
      { fromEn: 'Youssef Nabhan', fromAr: 'يوسف نبهان', bodyEn: 'Please find the updated CV and portfolio attached for the committee review.', bodyAr: 'يرجى الاطلاع على السيرة الذاتية والمعرض المحدّث المرفق لمراجعة اللجنة.', timestamp: 'Today, 09:12' },
    ],
  },
  {
    id: 'noura-customs',
    subjectEn: 'Noura Al-Mazrouei — Customs Clearance Question',
    subjectAr: 'نورة المزروعي — استفسار عن التخليص الجمركي',
    previewEn: 'Do we have an update on the bronze sculpture customs clearance timeline?',
    previewAr: 'هل هناك تحديث حول الجدول الزمني للتخليص الجمركي للمنحوتة البرونزية؟',
    timestamp: 'Yesterday, 16:40',
    unread: false,
    messages: [
      { fromEn: 'Noura Al-Mazrouei', fromAr: 'نورة المزروعي', bodyEn: 'Do we have an update on the bronze sculpture customs clearance timeline?', bodyAr: 'هل هناك تحديث حول الجدول الزمني للتخليص الجمركي للمنحوتة البرونزية؟', timestamp: 'Yesterday, 16:40' },
    ],
  },
  {
    id: 'finance-milestone',
    subjectEn: 'Finance Department — Milestone 2 Payment Query',
    subjectAr: 'قسم المالية — استفسار عن الدفعة الثانية',
    previewEn: 'The artist bank details for milestone 2 still require verification.',
    previewAr: 'لا تزال تفاصيل الحساب البنكي للفنان الخاصة بالدفعة الثانية بحاجة إلى تحقق.',
    timestamp: 'Mon, 11:05',
    unread: false,
    messages: [
      { fromEn: 'Finance Department', fromAr: 'قسم المالية', bodyEn: 'The artist bank details for milestone 2 still require verification.', bodyAr: 'لا تزال تفاصيل الحساب البنكي للفنان الخاصة بالدفعة الثانية بحاجة إلى تحقق.', timestamp: 'Mon, 11:05' },
    ],
  },
  {
    id: 'pe-visa',
    subjectEn: 'PR & Protocol — Visa Document Confirmation',
    subjectAr: 'العلاقات العامة والمراسم — تأكيد وثائق التأشيرة',
    previewEn: 'Visa clearance has been confirmed; flight booking token issued.',
    previewAr: 'تم تأكيد الموافقة على التأشيرة؛ تم إصدار رمز حجز الطيران.',
    timestamp: 'Mon, 08:22',
    unread: false,
    messages: [
      { fromEn: 'PR & Protocol', fromAr: 'العلاقات العامة والمراسم', bodyEn: 'Visa clearance has been confirmed; flight booking token issued.', bodyAr: 'تم تأكيد الموافقة على التأشيرة؛ تم إصدار رمز حجز الطيران.', timestamp: 'Mon, 08:22' },
    ],
  },
];

export const InboxModal: React.FC<InboxModalProps> = ({ isOpen, onClose, initialThreadId }) => {
  const i18n = useI18n();
  const isAr = i18n.lang === 'ar';
  const [readThreadIds, setReadThreadIds] = useState<Set<string>>(new Set());
  const [activeThreadId, setActiveThreadId] = useState<string>(initialThreadId ?? THREADS[0].id);
  const [reply, setReply] = useState('');

  const activeThread = useMemo(
    () => THREADS.find(thread => thread.id === activeThreadId) ?? THREADS[0],
    [activeThreadId]
  );

  if (!isOpen) return null;

  const selectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setReadThreadIds(previous => new Set(previous).add(threadId));
    setReply('');
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={isAr ? 'صندوق الوارد' : 'Inbox'} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-sadu-gold bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-sadu-gold/50 bg-sadu-linen px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-sadu-charcoal"><Mail className="h-4 w-4 text-sadu-brick" />{isAr ? 'صندوق وارد الفنانين' : 'Artist Inbox'}</div>
          <button type="button" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'} className="flex cursor-pointer items-center justify-center rounded-full p-1.5 text-sadu-muted hover:bg-sadu-sand hover:text-sadu-charcoal"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="w-full max-w-xs shrink-0 overflow-y-auto border-e border-sadu-gold/40 bg-sadu-paper">
            {THREADS.map(thread => {
              const isUnread = thread.unread && !readThreadIds.has(thread.id);
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => selectThread(thread.id)}
                  className={`flex w-full cursor-pointer flex-col gap-1 border-b border-sadu-gold/30 px-4 py-3 text-start transition-colors ${isActive ? 'bg-white' : 'hover:bg-white/60'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`flex items-center gap-1.5 text-xs ${isUnread ? 'font-bold text-sadu-charcoal' : 'font-semibold text-sadu-muted'}`}>
                      {isUnread ? <Mail className="h-3.5 w-3.5 text-sadu-brick" /> : <MailOpen className="h-3.5 w-3.5" />}
                      {isAr ? thread.subjectAr : thread.subjectEn}
                    </span>
                    {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-sadu-brick" />}
                  </div>
                  <p className={`truncate text-[11px] ${isUnread ? 'text-sadu-charcoal' : 'text-sadu-muted'}`}>{isAr ? thread.previewAr : thread.previewEn}</p>
                  <span className="text-[10px] font-mono text-sadu-muted">{thread.timestamp}</span>
                </button>
              );
            })}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-sadu-gold/40 px-6 py-4">
              <h2 className="text-sm font-bold text-sadu-charcoal">{isAr ? activeThread.subjectAr : activeThread.subjectEn}</h2>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {activeThread.messages.map((message, index) => (
                <div key={index} className="max-w-lg rounded-lg border border-sadu-gold/40 bg-sadu-linen p-4">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-mono text-sadu-muted">
                    <span className="font-bold text-sadu-charcoal">{isAr ? message.fromAr : message.fromEn}</span>
                    <span>{message.timestamp}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-sadu-charcoal">{isAr ? message.bodyAr : message.bodyEn}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-sadu-gold/40 p-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={event => setReply(event.target.value)}
                  rows={2}
                  placeholder={isAr ? 'اكتب ردك هنا...' : 'Type your reply...'}
                  className="min-h-16 flex-1 resize-none rounded-md border border-sadu-gold/50 bg-white px-3 py-2 text-xs text-sadu-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-sadu-brick"
                />
                <button type="button" className="flex cursor-pointer items-center justify-center rounded-md border border-sadu-gold bg-white p-2.5 text-sadu-muted hover:bg-sadu-sand" aria-label={isAr ? 'إرفاق ملف' : 'Attach file'}><Paperclip className="h-4 w-4" /></button>
                <button type="button" disabled={!reply.trim()} className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-sadu-brick px-4 py-2.5 text-xs font-bold text-white hover:bg-sadu-brick-dark disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-3.5 w-3.5" />{isAr ? 'إرسال' : 'Send'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
