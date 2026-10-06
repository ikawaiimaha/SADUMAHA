import type { DraftComparison as Comparison, WorkspaceDraft } from '../lib/workspaceDraft';
import { roleLabels, taskTitles, localized, type Language, type WorkspaceTask } from '../lib/operationalWorkspace';

type Props = {
  comparison: Comparison | null; draft: WorkspaceDraft; version: number; language: Language;
  tasks: WorkspaceTask[]; label: (key: string) => string; display: (key: string, value: string) => string;
  references: Record<string, string>;
};

export default function DraftComparison({comparison, draft, version, language, tasks, label, display, references}: Props) {
  const t = (ar:string,en:string) => language === 'ar' ? ar : en;
  const pending = tasks.filter(task => task.kind === draft.kind && task.status !== 'complete');
  const changed = [...(comparison?.changes ?? [])].sort((a,b)=>Number(Object.hasOwn(draft.fields,b.key))-Number(Object.hasOwn(draft.fields,a.key)));
  const row = (change: Comparison['changes'][number]) => <li key={change.key} className="work-change">
    <strong>{label(change.key)}</strong>
    <dl>
      <div><dt>{t('عند بدء المسودة','When draft started')}</dt><dd dir="auto">{display(change.key,change.before)}</dd></div>
      <div><dt>{t('السجل الحالي','Shared record now')}</dt><dd dir="auto">{display(change.key,change.current)}</dd></div>
      {Object.hasOwn(draft.fields,change.key) && <div className="work-change-proposal"><dt>{t('إدخالك غير المعتمد','Your unsubmitted input')}</dt><dd dir="auto">{display(change.key,draft.fields[change.key])}</dd></div>}
    </dl>
  </li>;
  const taskRow = (task: WorkspaceTask) => <li key={task.id}>
    <strong>{taskTitles[task.key]?.[language] ?? task.title[language]}</strong>
    <p>{task.ownerId ? references[task.ownerId] ?? t('مسؤول معيّن','Assigned owner') : t('المنسقة تعيّن مسؤولاً','Coordinator assigns an owner')}
      {' · '}{roleLabels[task.ownerRole]?.[language] ?? task.ownerRole}</p>
    <p>{task.renewal?.status === 'ASSIGNED' || task.acceptance ? t('بانتظار قبول المسؤول','Awaiting owner acceptance') : localized(task.blocker || t('مراجعة الدليل وتسجيل الإجراء','Review evidence and record the action'),language)}</p>
    {task.dueAt && <p className={task.overdue?'work-overdue':''}>{task.overdue?t('متأخر · ','Overdue · '):''}{new Date(task.dueAt).toLocaleString(language === 'ar' ? 'ar-AE' : 'en-GB')}</p>}
  </li>;
  return <section className="work-comparison" aria-label={t('ما الذي تغيّر؟','What changed?')}>
    <h4>{t('ما الذي تغيّر؟','What changed?')}</h4>
    {!comparison || comparison.currentVersion !== version ? <p role="status">{t('جارٍ تحديث المقارنة. لا تحفظ قبل مراجعة السجل الحالي.','Refreshing comparison. Review the current record before saving.')}</p> :
      !comparison.baselineAvailable ? <p>{t('لا توجد نسخة مرجعية لهذه المسودة القديمة. لا يمكن تحديد القيم التي تغيّرت؛ راجع إدخالك والسجل الحالي.','This older draft has no saved reference. Changed values cannot be established; inspect your input and the current record.')}</p> :
      changed.length ? <><ul className="work-changes">{changed.slice(0,1).map(row)}</ul>{changed.length>1&&<details><summary>{t('بقية التغييرات','More changes')} ({changed.length-1})</summary><ul className="work-changes">{changed.slice(1).map(row)}</ul></details>}</> :
        <p>{t('لم تتغيّر الحقول المقارنة في هذا المسار. قد تكون هناك تحديثات أخرى؛ تظل الصلاحيات والعوائق الحالية سارية.','No compared fields changed in this workflow. Other updates may exist; current permissions and holds still apply.')}</p>}
    {!!pending.length && <div className="work-renewal-summary"><p className="work-next-owner"><strong>{t('التالي: ','Next: ')}{pending[0].title[language]}</strong><br/>{pending[0].ownerId ? references[pending[0].ownerId] ?? t('مسؤول معيّن','Assigned owner') : t('المنسقة تعيّن مسؤولاً وموعداً','Coordinator assigns an owner and deadline')}</p><details><summary>{t('من يتولى المراجعات المتبقية؟','Who handles the remaining reviews?')} ({pending.length})</summary><ul>{pending.map(taskRow)}</ul></details></div>}
    <p className="work-hint">{t('للمراجعة فقط؛ لا تُنقل القيم أو الاعتمادات تلقائياً.','Reference only; values and approvals are never carried forward automatically.')}</p>
  </section>;
}
