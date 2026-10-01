import { preTransitHold } from "./preTransit";
import type { ArtistCare, Work } from "./artistCare";

export function returnReadiness(
  s: ArtistCare,
  w: Work,
  now = Date.now(),
): string | null {
  if (w.returnAt) return "Return transit is already recorded.";
  if (!w.condition) return "Logistics must record arrival first.";
  if (
    !s.settings ||
    !Number.isFinite(Date.parse(s.settings.closesAt)) ||
    now < Date.parse(s.settings.closesAt)
  )
    return "Return opens after the exhibition closes.";
  if (w.condition.damage && !w.condition.repaired)
    return "Complete the artist-authorized repair first.";
  const report = w.conditionHistory?.find(
    (r) =>
      r.stage === "DEINSTALLATION" &&
      r.revision === w.revision &&
      (r.freightRevision ?? 0) === (w.freightRevision ?? 0),
  );
  if (!report) return "Record the de-installation condition checkpoint first.";
  if (report.damage)
    return "De-installation damage requires a reviewed resolution before return.";
  return null;
}

export function careNextStep(s: ArtistCare, w: Work, now = Date.now()) {
  const hold = preTransitHold(w);
  if (hold && !w.condition)
    return { owner: "Coordinator / Artist / Logistics", text: hold };
  if (w.state === "RETURNED")
    return {
      owner: "Artist",
      text: "Revise the proposal using the review notes.",
    };
  if (w.state === "GC_CONSULTATION")
    return {
      owner: "Assigned Coordinator",
      text: "Respond to the guidance request and release the draft.",
    };
  if (w.state === "SUBMITTED")
    return {
      owner: w.committeeReviewed ? "Director" : "Committee",
      text: w.committeeReviewed
        ? "Review the recommendation and proposed budget."
        : "Review the proposal and the artist’s thematic response.",
    };
  if (w.state !== "APPROVED")
    return {
      owner: "Artist",
      text: "Complete the proposal before submitting.",
    };
  if (w.returnAt)
    return {
      owner: "Editorial / Director",
      text: "Review cleared assets in Return & Legacy Vault.",
    };
  if (w.condition?.damage && !w.condition.repaired)
    return {
      owner:
        w.condition.protocol &&
        w.condition.protocol !== w.condition.approvedProtocol
          ? "Artist"
          : "Technical",
      text: "Resolve the condition hold in Arrival, condition & repair consent.",
    };
  if (!w.condition)
    return {
      owner: "Artist / Logistics",
      text: w.freight
        ? "Check pre-dispatch evidence and crate-label readiness in Freight, customs & condition checkpoints."
        : "Complete collection details in Freight, customs & condition checkpoints.",
    };
  if (!w.nextMaintenance)
    return {
      owner: "Technical",
      text: "Confirm installation and start the care schedule in Arrival, condition & repair consent.",
    };
  if (s.settings && now >= Date.parse(s.settings.closesAt))
    return {
      owner: "Logistics",
      text:
        returnReadiness(s, w, now) ??
        "Record return transit in Return & Legacy Vault.",
    };
  return {
    owner: "Technical",
    text:
      now >= Date.parse(w.nextMaintenance)
        ? "Complete the due task in Material aftercare."
        : "Follow the approved schedule in Material aftercare.",
  };
}
