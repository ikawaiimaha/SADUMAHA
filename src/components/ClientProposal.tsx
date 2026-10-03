import { useEffect, useRef, useState } from 'react';
import './ClientProposal.css';

const slides = [
  { title: 'Your next platform should finish the handoff, not merely display it.', body: 'An email can contain the correct information and still leave nobody responsible for acting on it.', points: ['Address confirmed', 'Pickup date valid', 'Packaging unresolved', 'Responsible officer unavailable'], foot: 'SADU is designed around the gap between receiving information and accepting responsibility.' },
  { title: 'Unresolved handoffs turn small omissions into production delays.', body: 'Missing packaging prevents collection. Someone must clarify the scope, cost and responsibility before the work can move.', points: ['Discover the omission', 'Reconstruct the conversation', 'Find an authorized owner', 'Confirm the resolution'], foot: 'Illustrative scenario. No financial loss or measured saving is asserted.' },
  { title: 'SADU makes the owner, evidence and next action explicit.', body: 'Next action: confirm packing arrangements. Owner: assigned Logistics officer. Blocker: packing completion evidence is missing.', points: ['What needs to happen', 'Who can act', 'Which evidence is missing', 'What the action will change'], foot: 'The operational screen helps someone finish a task, rather than interpret a wall of metrics.' },
  { title: 'The collection demonstration prevents missing preparations from appearing complete.', body: 'Confirm collection information, resolve packing requirements and record the required evidence before readiness changes.', points: ['Confirmed collection details', 'Valid pickup window', 'Packing checks and completion evidence', 'Accepted owner'], foot: 'Ready for collection is distinct from transport booked and physically collected.', demo: '#experience', label: 'Try collection readiness' },
  { title: 'A backup assignment becomes a handoff only when the new owner accepts it.', body: 'Record the primary officer’s absence, assign a backup with a reason, then let the backup accept responsibility.', points: ['Assignment is visible', 'Acceptance is explicit', 'Earlier decisions remain available', 'Saved synthetic steps can resume'], foot: 'This tab-based demonstration is not institutional authentication or production disaster recovery.', demo: '#experience', label: 'Try the ownership handoff' },
  { title: 'The print demonstration keeps release decisions attached to the approved revision.', body: 'A corrected proof passes through approval, supplier acknowledgment and printing before completion—or a recorded correction.', points: ['A defect holds internal progression', 'Supplier stop acknowledgment is separate', 'A replacement creates a new revision', 'The new revision needs renewed approval'], foot: 'An internal hold does not claim that the supplier’s physical press has stopped.', demo: '#print-release', label: 'Try print release' },
  { title: 'SADU deserves adoption only if it reduces work rather than duplicating it.', body: '“Why would we pay for another system that staff must update alongside everything else?” That is the right objection.', points: ['Agree the authoritative record', 'Name the manual activity being replaced', 'Measure total effort, including corrections', 'Stop or revise if duplication persists'], foot: 'A bounded pilot should test the benefit; it should not assume it.' },
  { title: 'Production deployment requires an explicit engineering and support commitment.', body: 'The prototype demonstrates workflow behavior. A production service needs authenticated authority, shared persistence, tested recovery and operational ownership.', points: ['Identity and server permissions', 'Database and protected document storage', 'Integration and failure handling', 'Monitoring, support and restore testing'], foot: 'These are scoped engineering responsibilities—not just connection keys.', demo: '#technical', label: 'Inspect the technical boundary' },
  { title: 'Approve one bounded validation phase before committing to a wider rollout.', body: 'Nominate an operational sponsor and an IT counterpart, and agree one workflow to validate.', points: ['An agreed responsibility and workflow map', 'A tested journey with exceptions and recovery', 'A comparison of effort and follow-ups', 'A costed production backlog and proceed/revise/stop decision'], foot: 'Before commissioning: agree the fee, duration, client effort, exclusions and acceptance criteria. No commercial figures have been assumed.', demo: '#next', label: 'Review the next step' },
];

export function ClientPresentation() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    titleRef.current?.focus({ preventScroll: true });
    titleRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [index]);
  return <section id="presentation" className="sadu-section sadu-client-presentation" aria-label="Client presentation">
    <div className="sadu-section-heading"><div><p className="sadu-eyebrow">THE CASE FOR SADU / العرض</p><h2>A focused case.<br/><em>Evidence before expansion.</em></h2></div><p>Nine slides. Three practical controls. One bounded decision. Explore a working example, then return here without losing your place.</p></div>
    <div className="sadu-deck-toolbar"><label>Choose a slide<select value={index} onChange={e => setIndex(Number(e.target.value))}>{slides.map((s, i) => <option key={s.title} value={i}>{i + 1}. {s.title}</option>)}</select></label><span>Client presentation · Synthetic examples</span></div>
    <article className="sadu-deck-slide" aria-live="polite" aria-atomic="true">
      <p className="sadu-eyebrow">SLIDE {index + 1} / {slides.length}</p><h3 ref={titleRef} tabIndex={-1}>{slide.title}</h3><p className="sadu-deck-lead">{slide.body}</p>
      <ul>{slide.points.map(point => <li key={point}>{point}</li>)}</ul><p className="sadu-deck-foot">{slide.foot}</p>
      {slide.demo && <a className="sadu-text-link" href={slide.demo}>{slide.label} →</a>}
    </article>
    <nav className="sadu-deck-controls" aria-label="Slide controls"><button disabled={index === 0} onClick={() => setIndex(i => i - 1)}>← Previous slide</button><span>{index + 1} of {slides.length}</span><button disabled={index === slides.length - 1} onClick={() => setIndex(i => i + 1)}>Next slide →</button></nav>
    <details className="sadu-readiness"><summary>The five questions this proposal must answer</summary><ol>
      <li><strong>Is the scope credible?</strong> Start with demonstrated handoffs rather than promise a complete institutional replacement.</li>
      <li><strong>What are we buying?</strong> Agree scope, fee, duration and acceptance criteria before commissioning.</li>
      <li><strong>Will this add work?</strong> Measure duplication and total staff effort during validation.</li>
      <li><strong>Who owns implementation and support?</strong> Name operational and technical owners.</li>
      <li><strong>Where is the business evidence?</strong> Distinguish a working simulation from measured institutional outcomes.</li>
    </ol></details>
  </section>;
}

export function TechnicalExplainer() {
  return <section id="technical" className="sadu-section sadu-technical" aria-label="Technical backend explainer">
    <div className="sadu-section-heading"><div><p className="sadu-eyebrow">UNDER THE SURFACE / البنية التقنية</p><h2>The controls matter.<br/><em>So do their boundaries.</em></h2></div><p>This describes the implemented local architecture and its limits. It is not a live connection or a production certification.</p></div>
    <div className="sadu-technical-grid">
      <article><small>01 · THIS PAGE</small><h3>The browser demonstrates decisions.</h3><p>React and TypeScript render the task views. Versioned synthetic checkpoints save submitted steps in session storage when available. The curatorial, collection and print examples remain separate.</p><p><strong>Boundary:</strong> simulated roles and browser storage do not enforce institutional access controls.</p></article>
      <article><small>02 · LOCAL SERVICE</small><h3>The collection backend validates commands.</h3><p>The isolated Node.js collection runtime checks simulated identity, allowed actions and expected record versions. Shared packing rules determine readiness in both the local service and the presentation.</p><p><strong>Boundary:</strong> this page’s examples do not submit to that local backend.</p></article>
      <article><small>03 · RECORD & RECOVERY</small><h3>A saved change preserves its history.</h3><p>The local backend uses single-process, file-backed persistence. Bounded retries handle transient replacement failures; persistent failures retain the previous state. Revision conflicts require review before retrying.</p><p><strong>Boundary:</strong> this is not a multi-instance transactional database or a tested institutional disaster-recovery service.</p></article>
    </div>
    <details className="sadu-readiness"><summary>Follow a command through the local backend</summary><ol className="sadu-command-path"><li><strong>Receive the requested action.</strong> Include the current record version and relevant evidence reference.</li><li><strong>Check authority and prerequisites.</strong> Reject wrong-owner, stale or premature actions.</li><li><strong>Compute the next state.</strong> Keep readiness, booking and receipt distinct; invalidate dependent checks when facts change.</li><li><strong>Persist the result and history.</strong> Return success only after the local write completes.</li><li><strong>Return the next task.</strong> Expose its owner and blocking reason.</li></ol></details>
    <details className="sadu-readiness"><summary>What must be funded and verified for production?</summary><p>Institutional authentication and server authorization; a shared transactional database; protected document storage; retention and access policies; provider-specific integrations; monitoring; backup and restore tests; deployment and support ownership.</p><p>Shipping, email, signing, payments and government integrations remain paused. Hashes support change detection against a trusted reference; they do not prove identity, consent or legal validity.</p></details>
    <a className="sadu-text-link" href="#presentation">Return to the client presentation ↑</a>
  </section>;
}
