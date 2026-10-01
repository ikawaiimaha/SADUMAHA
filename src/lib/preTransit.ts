import type { Work } from "./artistCare";
export type TransitDecision = {
  id: string;
  action:
    "REPAIR" | "AS_IS" | "CANCEL" | "RELEASE_REPAIR" | "PACKING_CONFIRMED";
  reportHash: string;
  damageHash: string;
  revision: number;
  freightRevision: number;
  actorId: string;
  at: string;
  note: string;
  insuranceReference?: string;
  packing?: string;
};
export const latestPreDispatch = (w: Work) =>
  [...(w.conditionHistory ?? [])]
    .reverse()
    .find(
      (r) =>
        r.stage === "PRE_DISPATCH" &&
        r.revision === w.revision &&
        (r.freightRevision ?? 0) === (w.freightRevision ?? 0),
    );
export const lastDamage = (w: Work) =>
  [...(w.conditionHistory ?? [])]
    .reverse()
    .find((r) => r.stage === "PRE_DISPATCH" && r.damage);
export function transitDecision(w: Work) {
  const damage = lastDamage(w);
  return [...(w.transitDecisions ?? [])]
    .reverse()
    .find(
      (d) =>
        d.damageHash === damage?.hash &&
        d.revision === w.revision &&
        d.freightRevision === (w.freightRevision ?? 0),
    );
}
export function preTransitHold(w: Work): string | null {
  if (w.transitDecisions?.some((d) => d.action === "CANCEL"))
    return "Pre-transit hold: shipment cancelled. Any substitute needs a separate approved proposal.";
  const damage = lastDamage(w);
  if (!damage) return null;
  const decision = transitDecision(w),
    report = latestPreDispatch(w);
  if (
    decision?.action === "RELEASE_REPAIR" &&
    report &&
    !report.damage &&
    decision.reportHash === report.hash
  )
    return null;
  if (
    decision?.action === "PACKING_CONFIRMED" &&
    report &&
    decision.reportHash === report.hash
  )
    return null;
  if (decision?.action === "REPAIR")
    return "Pre-transit hold: studio repair requires a new condition report and Coordinator review.";
  if (decision?.action === "AS_IS")
    return "Pre-transit hold: Logistics must confirm the approved protective packing.";
  return "Pre-transit hold: pre-dispatch damage requires Coordinator triage.";
}
