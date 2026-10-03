import { useState } from 'react';
import { I18nProvider } from '../context/I18nContext';
import { LivingRecordProvider, useLivingRecord } from '../context/LivingRecordContext';
import type { DemoActor } from '../data/livingRecord';
import { PublishingCase } from './PublishingCase';

function PrintDesk() {
  const [actor, setActor] = useState<DemoActor>('COORDINATOR');
  const { state, dispatch } = useLivingRecord();
  return <div className="sadu-print-desk">
    <div className="sadu-demo-toolbar"><label>Simulated desk <select aria-label="Print demonstration desk" value={actor} onChange={e => setActor(e.target.value as DemoActor)}><option value="COORDINATOR">Coordinator / المنسقة</option><option value="PUBLISHING_MANAGER">Publishing manager / مدير النشر</option><option value="CHAIRMAN">Chairman / رئيس الدائرة</option></select></label><button onClick={() => { dispatch({ type: 'RESET' }); setActor('COORDINATOR'); }}>Reset print demonstration</button></div>
    <PublishingCase actor={actor}/>
    <details className="sadu-demo-history"><summary>Recorded handoffs ({state.events.length})</summary><ol>{state.events.map(e => <li key={e.id}>{e.reference} · {e.actor} · {new Date(e.at).toLocaleTimeString()}</li>)}</ol></details>
  </div>;
}
export default function PitchPrintDemo() {
  return <section id="print-release" className="sadu-experience"><div className="sadu-section-heading"><div><p className="sadu-eyebrow">PRINT RELEASE / إذن الطباعة</p><h2>The right revision.<br/><em>Through the final copy.</em></h2></div><p>Correct the proof, approve its revision, record the supplier’s acknowledgment, then track printing to completion—or reopen the correction loop.</p></div><details><summary>Try the print-release demonstration</summary><I18nProvider initialLang="en"><LivingRecordProvider checkpointKey="sadu:pitch:print:v2"><PrintDesk/></LivingRecordProvider></I18nProvider></details></section>;
}
