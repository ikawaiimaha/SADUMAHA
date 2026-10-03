import { useState } from 'react';

const backups = ['Logistics B', 'Logistics C'];
export function pickupError(date: string): string {
  if (!/^2026-10-(0[1-9]|[12]\d|3[01])$/.test(date)) return 'Choose a date from 1–31 October 2026.';
  if (date >= '2026-10-10' && date <= '2026-10-15') return 'The gallery is closed 10–15 October, inclusive. Choose another date.';
  return '';
}

/** Presentation-only state. No operational API, identity or persistent dossier is changed. */
export default function PitchCollectionDemo() {
  const [stage, setStage] = useState(0);
  const [backup, setBackup] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('2026-10-12');
  const [error, setError] = useState('');
  const [history, setHistory] = useState(['Logistics A confirmed collection revision 1 against synthetic source DEMO-001.']);
  const owner = stage >= 2 ? backup : 'Logistics A';
  function reset() {
    setStage(0); setBackup(''); setReason(''); setDate('2026-10-12'); setError('');
    setHistory(['Logistics A confirmed collection revision 1 against synthetic source DEMO-001.']);
  }
  return <section id="experience" className="sadu-experience">
    <div className="sadu-section-heading"><div><p className="sadu-eyebrow">03 / TRY ONE CONNECTED JOURNEY</p><h2>Keep the collection moving.<br/><em>Keep responsibility clear.</em></h2></div><p>One prepared synthetic record. You play the Coordinator, then the backup Logistics officer. Changes last until reset or refresh; no live services are connected.</p></div>
    <div className="sadu-demo-toolbar"><ol aria-label="Collection demonstration progress">{['Confirmed collection', 'Owner unavailable', 'Backup assigned', 'Pickup planned'].map((label, i) => <li key={label} aria-current={stage === i ? 'step' : undefined} className={stage >= i ? 'is-current' : ''}>{i + 1}. {label}</li>)}</ol><button type="button" onClick={reset}>Reset demonstration</button></div>
    <div className="sadu-live-example">
      <div className="sadu-example-context"><small>DEMO-001 · SYNTHETIC COLLECTION</small><h3>Study in Blue</h3><p>Artist: Demo Artist 01<br/>Collection: 12 Example Lane, Paris, France<br/>Source: prepared synthetic collection sheet<br/>Revision 1 · Collection details confirmed<br/>Availability: 1–31 October 2026<br/>Closed: 10–15 October · Europe/Paris</p><p className="sadu-boundary">Fixed rehearsal dates, not a live shipping calendar.</p>
        <div className="sadu-next-action" aria-live="polite"><small>CURRENT TASK OWNER</small><strong>{owner}{stage === 1 ? ' · unavailable' : ''}</strong><p>{stage >= 2 ? 'Logistics A is read-only in this demonstration.' : 'Collection information is confirmed; pickup is not yet planned.'}</p></div>
      </div>
      <div className="sadu-example-result">
        <p className={`sadu-example-status ${stage === 3 ? 'is-resolved' : ''}`}>{stage === 0 ? 'CONFIRMED RECORD' : stage === 1 ? 'HANDOFF REQUIRED' : stage === 2 ? 'PICKUP NOT YET PLANNED' : 'SYNTHETIC PLAN SAVED'}</p>
        <h3>{['Introduce an interruption', 'Assign a named backup', 'Choose a pickup date', 'Collection plan ready'][stage]}</h3>
        <p className="sadu-result-copy">{['You are the General Exhibition Coordinator / المنسقة. The assigned officer becomes unavailable before pickup is planned.', 'The task stays visible while the Coordinator assigns responsibility. A backup and reason are required.', `You now play ${backup}. Choose a date inside the collection window and outside the closure. Try 12 October to see the block.`, `${backup} owns the collection task. Pickup is planned for ${date} (Europe/Paris). No freight has been booked.`][stage]}</p>
        {stage === 0 && <button className="sadu-cta" onClick={() => { setStage(1); setHistory(h => [...h, 'Coordinator recorded Logistics A as unavailable. Pickup planning paused.']); }}>Mark owner unavailable</button>}
        {stage === 1 && <form onSubmit={e => { e.preventDefault(); if (!backups.includes(backup) || !reason.trim()) { setError('Choose a backup and record the handover reason.'); return; } setError(''); setStage(2); setHistory(h => [...h, `Coordinator assigned ${backup}: ${reason.trim()}. Collection revision 1 preserved.`]); }}>
          <label htmlFor="pitch-backup">Backup Logistics officer</label><select id="pitch-backup" value={backup} onChange={e => setBackup(e.target.value)} required><option value="">Choose a backup</option>{backups.map(name => <option key={name}>{name}</option>)}</select>
          <label htmlFor="pitch-reason">Reason for the handoff</label><input id="pitch-reason" value={reason} onChange={e => setReason(e.target.value)} required maxLength={160} placeholder="e.g. Primary officer on leave"/>
          <button className="sadu-cta" type="submit">Assign backup & continue</button>
        </form>}
        {stage === 2 && <form noValidate onSubmit={e => { e.preventDefault(); const selectedDate = String(new FormData(e.currentTarget).get('pickupDate') ?? ''); const issue = pickupError(selectedDate); setError(issue); if (issue) return; setDate(selectedDate); setStage(3); setHistory(h => [...h, `${backup} planned pickup for ${selectedDate}, Europe/Paris. No booking or payment issued.`]); }}>
          <label htmlFor="pitch-date">Pickup date · Europe/Paris</label><input id="pitch-date" name="pickupDate" type="date" min="2026-10-01" max="2026-10-31" value={date} aria-describedby="pitch-date-help pitch-error" aria-invalid={Boolean(error)} onChange={e => { setDate(e.target.value); setError(''); }}/><p id="pitch-date-help">Available 1–31 October. Closed 10–15 October.</p>
          <button className="sadu-cta" type="submit">Validate & save pickup plan</button>
        </form>}
        <p id="pitch-error" role="alert" className="sadu-demo-error">{error}</p>
        <p role="status" className="sadu-demo-feedback">{stage === 2 ? `Handoff complete. ${backup} can now plan pickup.` : stage === 3 ? 'Complete: confirmed collection → recorded absence → attributed handoff → valid pickup plan.' : ''}</p>
      </div>
    </div>
    <div className="sadu-demo-history"><h3>What this record remembers</h3><ol>{history.map((entry, i) => <li key={i}>{entry}</li>)}</ol></div>
    <p className="sadu-example-foot">Browser-only simulation · Reset clears this example only · No booking, message, payment or institutional approval is issued.</p>
  </section>;
}
