import { useState } from 'react';
import type { NominatedArtistDossier } from './ArtistNominationForm';
import { invitationEligible, matchesInvitation, type ArchiveAction, type InvitationVersion } from '../data/invitationArchive';

export function InvitationArchive({ rows, dossiers, actor, coordinatorId, isAr, onAction }: {
  rows: InvitationVersion[]; dossiers: NominatedArtistDossier[]; actor: string; coordinatorId: string; isAr: boolean; onAction: (a: ArchiveAction) => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [bodyAr, setBodyAr] = useState('يسرنا دعوتكم للمشاركة في المعرض المقترح. تفاصيل المشاركة والمواعيد تخضع للمراجعة والاعتماد المستقل. هذه مسودة تدريبية غير مرسلة.');
  const [bodyEn, setBodyEn] = useState('We invite you to participate in the proposed exhibition. Participation details and dates remain subject to separate review and approval. This is an unsent rehearsal draft.');
  const [notice, setNotice] = useState('');
  const t = (ar: string, en: string) => isAr ? ar : en;
  const canRecord = actor === 'COORDINATOR';
  const visible = rows.filter(r => actor !== 'COORDINATOR' || dossiers.some(d => d.id === r.artistId && d.assignedCoordinatorId === coordinatorId));
  const eligible = dossiers.filter(d => invitationEligible(d) && d.assignedCoordinatorId === coordinatorId);
  return <section dir={isAr ? 'rtl' : 'ltr'} className="mx-auto my-6 max-w-5xl rounded-xl border border-[#D9CEBA] bg-[#F7F1E6] ps-6 pe-6 py-6 text-start space-y-4">
    <h2 className="text-xl font-semibold">{t('أرشيف خطابات الدعوة — محاكاة', 'Invitation letter archive — rehearsal')}</h2>
    <p>{t('سجل مشترك لهذه الجلسة، يُفقد عند تحديث الصفحة. منفصل عن دعوة دخول البوابة. لا إرسال خارجي أو توقيع رسمي؛ اختيار مساحة العمل ليس تفويض وصول فعلياً.', 'Shared session record, lost on refresh. Separate from the portal invitation. No external dispatch or official signature; workspace selection is not real access authorization.')}</p>
    <label className="block">{t('بحث بالاسم أو رقم الفنان أو العمل', 'Search by artist name, ID or artwork')}<input value={query} onChange={e => setQuery(e.target.value)} className="block w-full border rounded ps-3 pe-3 py-2" /></label>
    {canRecord && <details><summary className="cursor-pointer">{t('إعداد مسودة أو إصدار جديد', 'Prepare draft or new version')}</summary>
      <form className="space-y-3 py-3" onSubmit={e => { e.preventDefault(); onAction({ type: 'draft', artistId: selected, bodyAr, bodyEn }); }}>
        <label className="block">{t('ملف الفنان المعتمد والمكلّف به المنسق', 'Approved artist assigned to this Coordinator')}<select required value={selected} onChange={e => setSelected(e.target.value)} className="block w-full border p-2"><option value="">{t('اختر الفنان', 'Select artist')}</option>{eligible.map(d => <option key={d.id} value={d.id}>{d.artistName} · {d.id}</option>)}</select></label>
        <label className="block">{t('نص الدعوة بالعربية', 'Arabic invitation text')}<textarea required dir="rtl" maxLength={3000} value={bodyAr} onChange={e => setBodyAr(e.target.value)} className="block w-full border p-2" /></label>
        <label className="block">{t('نص الدعوة بالإنجليزية', 'English invitation text')}<textarea required dir="ltr" maxLength={3000} value={bodyEn} onChange={e => setBodyEn(e.target.value)} className="block w-full border p-2" /></label>
        <p>{t('اعتماد المشاركة لا يعتمد الخطاب. كل تعديل ينشئ إصداراً مستقلاً ويحفظ السابق.', 'Participation approval does not approve the letter. Each edit creates a separate version and retains history.')}</p>
        <button disabled={!eligible.some(d => d.id === selected) || !bodyAr.trim() || !bodyEn.trim()} className="border rounded ps-4 pe-4 py-2 disabled:opacity-40">{t('حفظ مسودة جديدة', 'Save new draft')}</button>
      </form>
    </details>}
    <p role="status">{notice}</p>
    {!visible.length && <p>{t('لا توجد خطابات محفوظة. يُعدّ المنسق المكلّف المسودة من ملف معتمد؛ لا تُنشأ نسخة معتمدة تلقائياً.', 'No saved letters. The assigned Coordinator prepares a draft from an approved dossier; an approved copy is never created automatically.')}</p>}
    {!!visible.length && !visible.some(r => matchesInvitation(r, query)) && <p>{t('لا نتائج. جرّب رقم الفنان أو جزءاً من الاسم؛ لا يُصحح النظام الأسماء تلقائياً.', 'No results. Try the artist ID or part of the name; names are not silently corrected.')}</p>}
    {visible.filter(r => matchesInvitation(r, query)).slice().reverse().map(row => {
      const current = rows.filter(r => r.artistId === row.artistId).at(-1)?.id === row.id;
      const eligibleNow = dossiers.some(d => d.id === row.artistId && invitationEligible(d));
      return <article key={row.id} className="rounded border bg-white ps-4 pe-4 py-4 space-y-3">
        <h3 className="font-semibold"><bdi>{row.artistName}</bdi> · {t('الإصدار', 'Version')} {row.version}</h3>
        <p><bdi>{row.artistId}</bdi> · <bdi>{row.createdAt}</bdi></p>
        <p>{!eligibleNow ? t('الملف لم يعد مؤهلاً — نسخة تاريخية فقط', 'Dossier no longer eligible — historical copy only') : !current ? t('إصدار سابق — محفوظ للتتبع', 'Previous version — retained for history') : row.approval ? t('اعتماد مسجل — محاكاة فقط', 'Approval recorded — rehearsal only') : t('مسودة — غير معتمدة', 'Draft — not approved')}</p>
        <p className="whitespace-pre-wrap">{isAr ? row.bodyAr : row.bodyEn}</p>
        {row.approval && <p>{t('المعتمد / مرجع التفويض / دليل الاعتماد', 'Approver / delegation reference / approval evidence')}: <bdi>{row.approval.approver} · {row.approval.delegation} · {row.approval.evidence} · {row.approval.at}</bdi></p>}
        <button className="border rounded ps-4 pe-4 py-2" onClick={async () => { try { const { downloadInvitation } = await import('../utils/invitationLetterPdf'); await downloadInvitation(row, isAr, !current || !eligibleNow); setNotice(t('تم إعداد النسخة التدريبية للتنزيل.', 'Rehearsal download prepared.')); } catch { setNotice(t('تعذر إنشاء PDF. أعد المحاولة.', 'PDF generation failed. Please retry.')); } }}>{t('تنزيل نسخة تدريبية PDF', 'Download rehearsal PDF')}</button>
        {canRecord && current && eligibleNow && !row.approval && <ApprovalRecord key={row.id} isAr={isAr} onRecord={a => onAction({ ...a, type: 'record-approval', id: row.id })} />}
      </article>;
    })}
  </section>;
}

function ApprovalRecord({ isAr, onRecord }: { isAr: boolean; onRecord: (a: { approver: string; delegation: string; evidence: string; reviewed: boolean }) => void }) {
  const [approver, setApprover] = useState(''); const [delegation, setDelegation] = useState(''); const [evidence, setEvidence] = useState(''); const [reviewed, setReviewed] = useState(false);
  return <details><summary className="cursor-pointer">{isAr ? 'تسجيل دليل اعتماد — محاكاة' : 'Record approval evidence — rehearsal'}</summary><form className="space-y-3 py-3" onSubmit={e => { e.preventDefault(); onRecord({ approver, delegation, evidence, reviewed }); }}>
    <p>{isAr ? 'المنسق يسجل الدليل ولا يمنح نفسه صلاحية اعتماد. استخدم مراجع خيالية فقط؛ لا ترفع توقيعات أو بيانات خاصة.' : 'The Coordinator records evidence and does not grant themselves approval authority. Use fictional references only; do not upload signatures or private data.'}</p>
    {[[isAr ? 'اسم المعتمد الخيالي' : 'Fictional approver', approver, setApprover], [isAr ? 'مرجع التفويض ونطاقه' : 'Delegation reference and scope', delegation, setDelegation], [isAr ? 'مرجع دليل اعتماد هذا الإصدار' : 'Approval evidence for this version', evidence, setEvidence]].map(([label, value, setter]) => <label key={label as string} className="block">{label as string}<input required maxLength={200} value={value as string} onChange={e => (setter as (s: string) => void)(e.target.value)} className="block w-full border p-2" /></label>)}
    <label className="block"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} /> {isAr ? 'راجعت تطابق الدليل مع هذا الإصدار ونطاق التفويض في السيناريو.' : 'I reviewed evidence matching this version and delegation scope in the scenario.'}</label>
    <button disabled={!reviewed || !approver.trim() || !delegation.trim() || !evidence.trim()} className="border rounded ps-4 pe-4 py-2 disabled:opacity-40">{isAr ? 'تسجيل الاعتماد التجريبي' : 'Record rehearsal approval'}</button>
  </form></details>;
}
