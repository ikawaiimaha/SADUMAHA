import { useId, useRef, useState } from 'react';
import { MAX_REGISTER_BYTES, parseHandoffRegister, handoffsForPhase, type HandoffPhase, type HandoffRegister, type RegisterText } from '../data/handoffRegister';
import './LocalHandoffRegister.css';

type Props = { phase: HandoffPhase; isAr?: boolean };
// Enabled in development/local rehearsal only, with a second hostname boundary.
export default function LocalHandoffRegister(props: Props) {
  if (typeof window === 'undefined' || !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) return null;
  return <RegisterPanel {...props}/>;
}

// Selected JSON stays in component memory, never in a checkpoint.
function RegisterPanel({ phase, isAr = false }: Props) {
  const [register, setRegister] = useState<HandoffRegister | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const request = useRef(0);
  const inputId = useId();
  const t = (ar: string, en: string) => isAr ? ar : en;
  const label = (value: RegisterText) => value[isAr ? 'ar' : 'en'];
  const entries = register ? showAll ? register.entries : handoffsForPhase(register, phase) : [];
  const ackLabels = {
    REPORTED_UNVERIFIED: t('مذكور في الملخص — غير متحقق', 'Reported in summary — unverified'),
    CONDITIONAL_REPORTED: t('رد مشروط مذكور — غير متحقق', 'Conditional response reported — unverified'),
    NOT_ESTABLISHED: t('لم يثبت التأكيد', 'Acknowledgment not established'),
  };
  function unload() { request.current++; setRegister(null); setError(false); setBusy(false); setShowAll(false); }
  async function load(file?: File) {
    if (!file) return;
    const ticket = ++request.current;
    setBusy(true); setError(false); setRegister(null); setShowAll(false);
    try {
      if (file.size > MAX_REGISTER_BYTES) throw new Error('File too large');
      const next = parseHandoffRegister(await file.text());
      if (request.current === ticket) setRegister(next);
    } catch { if (request.current === ticket) setError(true); }
    finally { if (request.current === ticket) setBusy(false); }
  }
  return <details className="sadu-local-register" data-private dir={isAr ? 'rtl' : 'ltr'}>
    <summary>{t('مصادر الحالة — للمراجعة المحلية', 'Case sources — local review')}</summary>
    <p>{t('السجل مرجع فقط. لا يؤكد مهمة ولا يمنح موافقة. تبقى أحداث العرض وبياناته تجريبية.', 'The register is reference material only. It cannot acknowledge tasks or grant approvals. Demonstration events and data remain synthetic.')}</p>
    <label htmlFor={inputId}>{t('فتح ملف سجل الإحالات المحلي (JSON)', 'Open a local handoff register (JSON)')}</label>
    <input id={inputId} type="file" accept=".json,application/json" onChange={e => { void load(e.target.files?.[0]); e.target.value = ''; }}/>
    <p className="register-note">{t('قراءة داخل المتصفح فقط، دون رفع الملف أو حفظه في تخزين المتصفح. يُزال من العرض عند التحديث. إعادة المثال لا تعدّل السجل الأصلي.', 'Read in browser memory only; no upload or browser storage. Refresh removes it from view. Resetting the demo does not change the source register.')}</p>
    <div role="status">{busy ? t('جارٍ قراءة الملف…', 'Reading file…') : register ? `${register.caseName} · ${t('إصدار', 'revision')} ${register.revision}` : ''}</div>
    {(register || busy) && <button type="button" onClick={unload}>{t('إزالة السجل من العرض', 'Remove register from view')}</button>}
    {error && <p role="alert">{t('تعذّرت قراءة السجل. اختاري ملف JSON صالحاً لا يتجاوز ٥١٢ كيلوبايت. لم تتغير خطوات العرض.', 'Could not read the register. Choose a valid register JSON up to 512 KiB. Demonstration steps have not changed.')}</p>}
    {register && <>
      <button type="button" aria-pressed={showAll} onClick={() => setShowAll(value => !value)}>{showAll ? t('عرض إحالات الخطوة الحالية فقط', 'Show current-step handoffs only') : t('عرض السجل الكامل', 'Show the full register')}</button>
      <h2>{showAll ? t('السجل الكامل', 'Full register') : t('الإحالات المرتبطة بهذه الخطوة', 'Handoffs related to this step')}</h2>
      {!entries.length && <p>{t('لا توجد إحالة لهذه الخطوة. لا نفترض وجود مصدر أو موافقة.', 'No mapped handoff for this step. No source or approval is inferred.')}</p>}
      {entries.map(entry => <article key={entry.id}>
        <h3><bdi>{entry.id}</bdi> · {label(entry.title)}</h3>
        <p className="register-status">{ackLabels[entry.acknowledgment.status]}</p>
        <dl>
          <div><dt>{t('العمل المعني', 'Affected work')}</dt><dd>{entry.affectedWorks.map(w => <bdi key={w}>{w}<br/></bdi>)}</dd></div>
          <div><dt>{t('الإجراء المطلوب', 'Requested action')}</dt><dd>{label(entry.requestedAction)}</dd></div>
          <div><dt>{t('المسؤول', 'Owner')}</dt><dd>{label(entry.owner.role)}<br/>{label(entry.owner.assignment)}</dd></div>
          <div><dt>{t('الشروط', 'Conditions')}</dt><dd><ul>{entry.conditions.map((c, i) => <li key={i}>{label(c)}</li>)}</ul></dd></div>
          <div><dt>{t('التأكيد', 'Acknowledgment')}</dt><dd>{label(entry.acknowledgment.detail)}</dd></div>
          <div><dt>{t('الأدلة غير المحسومة', 'Unresolved evidence')}</dt><dd><ul>{entry.unresolvedEvidence.map((c, i) => <li key={i}>{label(c)}</li>)}</ul></dd></div>
        </dl>
        <p className="register-note">{label(entry.demoBoundary)}</p>
        {entry.sourceRefs.map((ref, i) => {
          const source = register.sources.find(s => s.id === ref.sourceId)!;
          return <details key={`${ref.sourceId}-${i}`}><summary>{t('عرض مقتطف المصدر', 'Read source extract')} · <bdi>{ref.sourceId} / {ref.locator}</bdi></summary>
            <p><bdi>{ref.subject}</bdi></p><blockquote dir="auto">{ref.excerpt}</blockquote>
            <p>{label(source.limitation)}</p><p><bdi>{source.title}</bdi><br/><code dir="ltr">{source.localPath}</code></p>
            <p>SHA-256: <code dir="ltr">{source.sha256}</code></p>
          </details>;
        })}
      </article>)}
      <details><summary>{t('فهرس السجل الكامل', 'Full register index')} ({register.entries.length})</summary><ul>{register.entries.map(e => <li key={e.id}><bdi>{e.id}</bdi> · {label(e.title)} — {e.demoPhase ? t('مرتبط بمثال تجريبي', 'Linked to a synthetic example') : t('مسار آخر؛ لا يُنفذ في هذا العرض', 'Other workstream; not executed in this demo')}</li>)}</ul></details>
    </>}
  </details>;
}
