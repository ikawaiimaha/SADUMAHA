import { useEffect, useRef, useState } from 'react';
import './ClientProposal.css';

const slides = [
  { title: 'A confirmed address does not make an artwork ready for collection.', body: 'The officer is on leave, the pickup date is unresolved and the work has no packing. Forwarding the address does not resolve any of those tasks.', points: ['One collection record', 'An unavailable owner', 'A date to validate', 'Packing to complete'], foot: 'This is the synthetic case demonstrated above, not a claim about a live shipment.', demo: '#experience', label: 'Return to the collection case' },
  { title: 'Each unresolved handoff leaves someone reconstructing what should happen next.', body: 'Before arranging transport, the team must establish responsibility, availability and packing readiness. SADU brings those open questions into the task itself.', points: ['Who takes over?', 'Is the gallery open?', 'Who resolves packing?', 'What confirms completion?'], foot: 'The stakes are additional coordination and possible delay. Their cost must be measured, not assumed.' },
  { title: 'SADU makes unresolved handoffs visible before they become production problems.', body: 'One record carries the next action, its owner, the reason it is blocked and the evidence needed to advance.', points: ['A specific next action', 'A named responsible owner', 'An explicit blocking reason', 'A recorded resolution'], foot: 'The following three controls are demonstrated in the same collection case.' },
  { title: 'The backup must accept responsibility before planning the pickup.', body: 'Assigning the backup does not complete the handoff. The example waits for acceptance before exposing the pickup task.', points: ['Absence recorded', 'Backup assigned with a reason', 'Acceptance recorded', 'Pickup task becomes available'], foot: 'Browser roles are simulated. Institutional identity and server permissions remain production work.' },
  { title: 'An invalid pickup date cannot quietly become the collection plan.', body: 'The gallery is closed from 10 to 15 October in this fixture. The example rejects 12 October and accepts 16 October within its availability window.', points: ['Availability recorded', 'Closure dates visible', 'Invalid date rejected', 'Valid plan recorded'], foot: 'A saved plan is not a transport booking. Fixed rehearsal dates are not a live shipping calendar.' },
  { title: 'A valid date still cannot clear missing packing.', body: 'A packing plan, technical review and cost approval remain separate from evidence that packing is complete. Only the completed checks make the case ready.', points: ['Packing task assigned', 'Technical review recorded', 'Cost approval recorded', 'Completion evidence recorded'], foot: 'These are synthetic references. They do not certify packing safety, authorize payment or prove physical collection.', demo: '#experience', label: 'Inspect or replay the collection case' },
  { title: 'Adoption is justified only if this replaces work instead of adding another reporting chore.', body: '“We already use email. Why should staff maintain another system?” A trial must identify which manual task SADU replaces and measure the total effort, including corrections.', points: ['Agree the authoritative record', 'Name the activity being replaced', 'Measure completion time and follow-ups', 'Revise or stop if duplication persists'], foot: 'The prototype demonstrates controls. It does not yet establish institutional savings.', demo: '#technical', label: 'Review what production still requires' },
  { title: 'Scope one collection-workflow trial before funding a wider rollout.', body: 'Nominate an operational owner and an IT counterpart. Agree the fee, duration, permitted data and acceptance criteria before commissioning.', points: ['A collection responsibility map', 'A tested handoff with exceptions and recovery', 'A comparison with current staff effort', 'Findings and a costed production backlog'], foot: 'The decision after validation is proceed, revise or stop. No fee, schedule or wider rollout is assumed.', demo: '#next', label: 'Review the proposed next step' },
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
    <div className="sadu-section-heading"><div><p className="sadu-eyebrow">THE CASE FOR SADU / العرض</p><h2>One collection case.<br/><em>One bounded proposal.</em></h2></div><p>Eight slides explain the collection controls you can test above, the strongest adoption objection and the proposed next step. The wider exhibition workflows are optional detail.</p></div>
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
