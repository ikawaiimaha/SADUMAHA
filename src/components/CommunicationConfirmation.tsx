import { useState } from 'react';
import { createCommunicationReview, communicationTransition, type CommunicationCommand } from '../data/communicationReview';
import { NextActionCard } from './NextActionCard';

export function CommunicationConfirmation({ onApply }: { onApply: (date: string, source: string) => void }) {
  const [record, setRecord] = useState(createCommunicationReview);
  const [error, setError] = useState('');
  function act(type: CommunicationCommand['type'], data: Partial<CommunicationCommand> = {}) {
    try {
      const next = communicationTransition(record, { type, actor: 'Assigned Logistics', version: record.version, at: new Date().toISOString(), ...data });
      if (type === 'APPLY') onApply(next.correction!.date, next.correction!.reference);
      setRecord(next); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Update not saved. Your entries remain available.'); }
  }
  return <section className="sadu-communication" aria-label="Communication confirmation">
    <NextActionCard title={record.step === 'applied' ? 'Date clarification completed' : 'Resolve the date in a source message'} owner="Assigned Logistics" blocker={record.step === 'applied' ? 'The confirmed October date is applied; the original December request remains below.' : 'The source says 3 December, outside the October collection window. No date is changed automatically.'} evidence={{ source: record.original.reference, sender: record.original.sender, receivedAt: 'Synthetic fixture; no real message received', revision: `Message review v${record.version}`, recordedBy: 'Assigned Logistics · simulation', confirmation: record.checkedTranscript ? 'Prepared transcript checked against synthetic source text; no audio verification claimed' : 'Transcript unverified' }}/>
    <blockquote>{record.original.text}</blockquote><p>Prepared voice-note transcript: {record.original.transcript}</p><p className="lr-small">No audio is attached. This rehearsal compares prepared text only; real voice verification requires the original audio.</p>
    {record.step === 'captured' && (!record.checkedTranscript ? <button onClick={() => act('CHECK_TRANSCRIPT')}>Record synthetic transcript check</button> : <button onClick={() => act('LINK', { reference: 'DEMO-001' })}>Link evidence to DEMO-001</button>)}
    {record.step === 'linked' && <button onClick={() => act('CLARIFY')}>Open clarification task · no message sent</button>}
    {record.step === 'clarification' && <form onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); act('PROPOSE', { reference: String(f.get('reference')), date: String(f.get('date')) }); }}><label htmlFor="correction-response">Correction response reference</label><input id="correction-response" name="reference" required maxLength={160} placeholder="SYNTHETIC-REPLY-02"/><label htmlFor="corrected-pickup">Date explicitly confirmed in response</label><input id="corrected-pickup" name="date" type="date" required defaultValue="2026-10-16"/><button>Record proposed correction</button></form>}
    {record.step === 'proposed' && <><p>Proposed: {record.correction?.date} · response {record.correction?.reference}. Original December request remains unchanged.</p><button onClick={() => act('CONFIRM')}>Confirm correction as assigned Logistics</button></>}
    {record.step === 'confirmed' && <button onClick={() => act('APPLY')}>Apply confirmed date to collection</button>}
    {record.step === 'applied' && <p role="status">Confirmed date applied for this session. This is a pickup plan, not a transport booking.</p>}
    <p role="alert">{error}</p>
    <details><summary>Message and confirmation history</summary><ol>{record.history.map((e, i) => <li key={i}>{e.action} · {e.reference} · {e.actor} · {e.at}</li>)}</ol></details>
  </section>;
}
