import { useSessionDraft } from '../context/SessionDrafts';
import { ESCALATION_DEPARTMENTS } from '../utils/chairmanOversight';
import type { EscalationInput, EscalationRecord } from '../types/chairman';

interface Props { actor: string; isAr: boolean; records: EscalationRecord[]; onSubmit: (input: EscalationInput) => void }
export function EscalationSubmission({ actor, isAr, records, onSubmit }: Props) {
  const [draft, setDraft] = useSessionDraft(`escalation-draft:${actor}`, { id: '', reason: '', supportingEvidenceRef: '', requestedDecision: '' });
  const mine = records.filter(row => row.originatingDepartment === ESCALATION_DEPARTMENTS[actor]);
  const submitted = mine.some(row => row.id === draft.id);
  const duplicate = mine.some(row => row.status === 'PENDING_EXECUTIVE_ACTION' && row.reason === draft.reason.trim() && row.supportingEvidenceRef === draft.supportingEvidenceRef.trim() && row.requestedDecision === draft.requestedDecision.trim());
  const valid = Boolean(draft.reason.trim() && draft.supportingEvidenceRef.trim() && draft.requestedDecision.trim());
  return <section className="mx-auto my-6 max-w-5xl rounded-xl border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start">
    <h2 className="text-xl font-semibold">{isAr ? 'إحالة إلى رئيس الدائرة' : 'Escalate to the Chairman'}</h2>
    <p className="my-2">{isAr ? 'تسجيل إحالة تجريبية موثقة. لا تمنح الإحالة تصريحاً فنياً أو مالياً.' : 'Record an evidenced session escalation. Submission grants no technical or financial clearance.'}</p>
    <details><summary className="cursor-pointer">{isAr ? 'إعداد إحالة ومراجعة الردود' : 'Prepare escalation and review responses'}</summary>
      <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); if (!valid || submitted || duplicate) return; const input = {...draft, id: crypto.randomUUID()}; setDraft(input); onSubmit(input); }}>
        {(['reason','supportingEvidenceRef','requestedDecision'] as const).map((field,i) => <label key={field} className="block">{(isAr ? ['سبب التصعيد','مرجع الأدلة (مرجع تجريبي، ليس رفع ملف)','القرار المطلوب'] : ['Reason for escalation','Evidence reference (session reference, not a file upload)','Requested decision'])[i]}<textarea required disabled={submitted} value={draft[field]} onChange={e => setDraft(previous => ({...previous,[field]:e.target.value}))} className="mt-1 block w-full rounded border bg-white ps-3 pe-3 py-2 text-start disabled:opacity-60" /></label>)}
        <button type="submit" disabled={!valid || submitted || duplicate} className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">{isAr ? 'تسجيل الإحالة' : 'Record escalation'}</button>
        {submitted && <p role="status">{isAr ? 'تم تسجيل الإحالة في سجل رئيس الدائرة.' : 'Escalation recorded in the Chairman’s docket.'}</p>}
        {duplicate && !submitted && <p role="status">{isAr ? 'توجد إحالة معلقة مطابقة.' : 'An identical pending escalation already exists.'}</p>}
        {submitted && <button type="button" className="ms-3 rounded border ps-4 pe-4 py-2" onClick={() => setDraft({id:'', reason:'', supportingEvidenceRef:'', requestedDecision:''})}>{isAr ? 'إعداد إحالة أخرى' : 'Prepare another escalation'}</button>}
      </form>
      <ul className="mt-4 space-y-3">{mine.map(row => <li key={row.id} className="rounded border bg-white ps-3 pe-3 py-3"><p>{row.reason}</p><p>{row.executiveDisposition === 'DEFERRED' ? (isAr ? 'مؤجلة — بانتظار قرار نهائي' : 'Deferred — awaiting final decision') : row.status === 'PENDING_EXECUTIVE_ACTION' ? (isAr ? 'بانتظار رئيس الدائرة' : 'Pending Chairman decision') : row.executiveDisposition === 'APPROVED' ? (isAr ? 'تم تسجيل الموافقة' : 'Approval recorded') : (isAr ? 'تم تسجيل الرفض' : 'Rejection recorded')}</p><time>{row.decidedAt ?? row.submittedAt}</time></li>)}</ul>
    </details>
  </section>;
}
