import type { ReactNode } from 'react';
import './NextActionCard.css';
export interface ActionEvidence {
  source: string; sender: string; receivedAt: string; revision: string; recordedBy: string; confirmation: string;
}
export function NextActionCard({ title, owner, blocker, evidence, children, isAr = false }: { title: string; owner: string; blocker: string; evidence?: ActionEvidence; children?: ReactNode; isAr?: boolean }) {
  return <section className="sadu-task-card" aria-label={isAr ? 'الخطوة التالية' : 'Next action'}>
    <div role="status"><small>{isAr ? 'الخطوة التالية' : 'NEXT ACTION'}</small><h3>{title}</h3><p><strong>{isAr ? 'المسؤول: ' : 'Owner: '}</strong>{owner}</p><p>{blocker}</p></div>
    {children}
    {evidence && <details><summary>{isAr ? 'الدليل المرتبط بهذه المهمة' : 'Evidence for this action'}</summary><dl>{[
      [isAr ? 'المصدر' : 'Source', evidence.source], [isAr ? 'المرسل / المتحدث' : 'Sender / speaker', evidence.sender],
      [isAr ? 'وقت الاستلام' : 'Received', evidence.receivedAt], [isAr ? 'الإصدار المرتبط' : 'Relevant revision', evidence.revision],
      [isAr ? 'سجله' : 'Recorded by', evidence.recordedBy], [isAr ? 'حالة التأكيد' : 'Confirmation', evidence.confirmation],
    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details>}
  </section>;
}
