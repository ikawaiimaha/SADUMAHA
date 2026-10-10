import type { TreatmentView } from '../lib/treatment';
import { treatmentDomains } from '../lib/treatment';
import { accountLabel, type Language } from '../lib/operationalWorkspace';

type Account = { id: string; name: string; role: string };
/** Last matching item without mutating the array (Array.findLast is outside the ES2022 library). */
const lastMatch = <T,>(items: readonly T[], test: (item: T) => boolean): T | undefined => {
  for (let i = items.length - 1; i >= 0; i -= 1) if (test(items[i])) return items[i];
  return undefined;
};
/** Read-only record shown beside the permitted action. It explains state; it never grants anything. */
export default function TreatmentSummary({ treatment, accounts, language, open }: { treatment: TreatmentView; accounts: Account[]; language: Language; open: boolean }) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const cur = treatment.current;
  const who = (id: string | null | undefined) => { const a = accounts.find(x => x.id === id); return a ? accountLabel(a, language) : id ?? '—'; };
  const auth = cur ? lastMatch(treatment.authorizations, a => a.revision === cur.revision) : undefined;
  const trial = cur ? lastMatch(treatment.trials, x => x.revision === cur.revision && !x.supersededAt) : undefined;
  const stamp = (at: string) => new Date(at).toLocaleString(language === 'ar' ? 'ar-AE' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const done = treatment.completions.at(-1);
  return <>
    {done && <p className="work-spec" data-state="done">{t(`اكتملت المعالجة: ${done.lettersTreated} حرفاً`, `Treatment completed: ${done.lettersTreated} letters`)}</p>}
  <details className="work-spec" open={open}>
    <summary>{t('سجل المعالجة المشروطة', 'Conditional treatment record')}{cur && ` · ${t('الإصدار', 'revision')} ${cur.revision}`}</summary>
    <p className="work-synthetic" role="note">{t('سيناريو تجريبي: لورا / منير فاطمي. بيانات اصطناعية، ولا اتصال خارجي.', 'Synthetic scenario: Laura / Mounir Fatmi. Invented data; no external contact.')}</p>
    {!cur ? <p>{t('لم يُسجَّل إصدار للمعالجة بعد.', 'No treatment revision is recorded yet.')}</p> : <>
      <dl>
        <div><dt>{t('العمل', 'Work')}</dt><dd dir="auto">{cur.workTitle}</dd></div>
        <div><dt>{t('المعالجة المحددة', 'Exact treatment')}</dt><dd dir="auto">{cur.method}</dd></div>
        <div><dt>{t('مرجع المصدر', 'Source reference')}</dt><dd><bdi>{cur.sourceRef}</bdi></dd></div>
        <div><dt>{t('صاحب القرار المسمّى', 'Named decision-maker')}</dt><dd dir="auto">{cur.decisionMaker.name} · {cur.decisionMaker.capacity}{cur.decisionMaker.accountId && ` · ${who(cur.decisionMaker.accountId)}`}</dd></div>
      </dl>
      <h4>{t('الشروط', 'Conditions')}</h4>
      <ul className="work-conditions">{cur.conditions.map(c => {
        const check = lastMatch(treatment.checks, x => x.domain === c.domain);
        return <li key={c.id}><strong>{treatmentDomains[c.domain][language]}</strong> <span dir="auto">{c.text}</span> <span data-state={check ? 'done' : 'open'}>{check ? t('مستوفى', 'Cleared') : t('غير مستوفى', 'Not cleared')}</span></li>;
      })}</ul>
      <p data-state={auth ? 'done' : 'open'}>{auth
        ? auth.mode === 'EXTERNAL_PERMISSION'
          ? t(`إذن خارجي مُسجَّل (لم يُتخذ القرار داخل النظام) · ${auth.grantor} · ${stamp(auth.at)}`, `Recorded external permission (the decision was not made in SADU) · ${auth.grantor} · ${stamp(auth.at)}`)
          : t(`اعتماد داخل النظام · ${auth.approver} · ${stamp(auth.at)}`, `Approved in SADU · ${auth.approver} · ${stamp(auth.at)}`)
        : t('لا تفويض لهذا الإصدار بعد.', 'No authorization for this revision yet.')}</p>
      <p data-state={trial?.decision?.decision === 'APPROVE' ? 'done' : 'open'}>{!trial ? t('لا صورة عيّنة حالية.', 'No current trial photograph.') : trial.decision ? (trial.decision.decision === 'APPROVE' ? t('وافق الفنان على الصورة الحالية.', 'The artist approved the current photograph.') : t('طلب الفنان تغييرات.', 'The artist requested changes.')) : t('بانتظار مراجعة الفنان.', 'Awaiting artist review.')}</p>
      {treatment.batch.blockers.length > 0 && <details><summary>{t('ما يمنع المعالجة الكاملة', 'What blocks batch treatment')} ({treatment.batch.blockers.length})</summary><ul>{treatment.batch.blockers.map(b => <li key={b}>{b.split(' / ')[language === 'ar' ? 0 : 1] ?? b}</li>)}</ul></details>}
      {treatment.batch.allowed && <p data-state="done">{t('المعالجة الكاملة مسموحة بحسب السجل الحالي.', 'Batch treatment is allowed by the current record.')}</p>}
      {treatment.revisions.length > 1 && <details><summary>{t('الإصدارات السابقة', 'Earlier revisions')} ({treatment.revisions.length - 1})</summary><ol className="work-history">{treatment.revisions.slice(0, -1).map(r => <li key={r.revision}><bdi>{t('الإصدار', 'Revision')} {r.revision} · {stamp(r.at)}</bdi><p dir="auto">{r.method}</p></li>)}</ol></details>}
    </>}
  </details></>;
}
