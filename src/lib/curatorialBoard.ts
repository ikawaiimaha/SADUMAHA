import type { Ledger, LedgerActor } from "./spatialLedger";

export const curationReasons = [
  "Scale or dimensions incompatible",
  "Budget exceeds brief",
  "Does not fit thematic brief",
  "Evidence insufficient",
  "Availability or delivery concern",
];
export type BriefSlot = {
  id: string;
  galleryId: string;
  brief: string;
  areaM2: number;
  budgetMinor: number;
  assignedTo: string;
  selectedId: string | null;
};
export type ProposalRevision = {
  number: number;
  artistId: string;
  fit: string;
  evidence: string;
  areaM2: number;
  costMinor: number;
  response: string;
  authorId: string;
  at: string;
};
export type Nomination = {
  id: string;
  slotId: string;
  authorId: string;
  status:
    | "SUBMITTED"
    | "RETURNED"
    | "SHORTLISTED"
    | "COMMITTEE_APPROVED"
    | "ENDORSED";
  revisions: ProposalRevision[];
  feedback: {
    role: string;
    reason: string;
    note: string;
    revision: number;
    at: string;
  }[];
};
export type DefenseSnapshot = {
  id: string;
  at: string;
  state: "LOCKED" | "ENDORSED" | "SUPERSEDED";
  rows: { slot: BriefSlot; proposalId: string; revision: ProposalRevision }[];
};
export type Curation = {
  phase: "DRAFT" | "COMMITTEE_REVIEW" | "DIRECTOR_REVIEW" | "ENDORSED";
  slots: BriefSlot[];
  nominations: Nomination[];
  snapshots: DefenseSnapshot[];
};
export type CurationCommand = {
  action:
    | "CURATE_CREATE_SLOTS"
    | "CURATE_PROPOSE"
    | "CURATE_SHORTLIST"
    | "CURATE_RETURN"
    | "CURATE_LOCK"
    | "CURATE_COMMITTEE_APPROVE"
    | "CURATE_ENDORSE"
    | "CURATE_MOVE_SLOT";
  expected: number;
  id?: string;
  slotId?: string;
  galleryId?: string;
  brief?: string;
  quantity?: number;
  areaM2?: number;
  budgetMinor?: number;
  coordinatorId?: string;
  artistId?: string;
  fit?: string;
  evidence?: string;
  costMinor?: number;
  response?: string;
  reason?: string;
  note?: string;
  revision?: number;
};
export const emptyCuration = (): Curation => ({
  phase: "DRAFT",
  slots: [],
  nominations: [],
  snapshots: [],
});
const fail = (message: string, status = 409): never => {
  throw Object.assign(new Error(message), { status });
};
const text = (s: unknown, min = 1) =>
  typeof s === "string" && s.trim().length >= min && s.length <= 3000;
export function activeGallery(s: Ledger, id: string) {
  const g = s.galleries.find((x) => x.id === id);
  return g && g.active && s.venues.some((v) => v.id === g.venueId && v.active)
    ? g
    : null;
}
export function slotReservations(s: Ledger, galleryId: string) {
  const slots = (s.curation?.slots ?? []).filter(
    (x) => x.galleryId === galleryId,
  );
  return { works: slots.length, m2: slots.reduce((n, x) => n + x.areaM2, 0) };
}
export function isBoardAllocated(s: Ledger, artworkId: string) {
  return !!s.curation?.slots.some((slot) => {
    const n = s.curation!.nominations.find((n) => n.id === slot.selectedId);
    return (
      n?.revisions.at(-1)?.artistId === artworkId &&
      s.artworks.some(
        (a) =>
          a.id === artworkId &&
          a.galleryId === slot.galleryId &&
          a.state === "APPROVED",
      )
    );
  });
}
function checkPlan(s: Ledger) {
  const b = s.curation!;
  for (const g of s.galleries) {
    const slots = b.slots.filter((x) => x.galleryId === g.id);
    if (!slots.length) continue;
    if (!activeGallery(s, g.id))
      fail(`${g.name} is unavailable. Move the affected brief slots first.`);
    const external = s.artworks.filter(
      (a) =>
        a.galleryId === g.id &&
        a.state === "APPROVED" &&
        !isBoardAllocated(s, a.id),
    );
    if (
      external.length + slots.length > g.maxWorks ||
      external.reduce((n, a) => n + a.areaM2, 0) +
        slots.reduce((n, x) => n + x.areaM2, 0) >
        g.usableM2
    )
      fail(`${g.name} cannot accommodate the reserved slots.`);
  }
  const nominated = new Set(
    b.slots.map(
      (slot) =>
        b.nominations.find((n) => n.id === slot.selectedId)?.revisions.at(-1)
          ?.artistId,
    ),
  );
  const commitments = s.artworks
    .filter((a) => !nominated.has(a.id))
    .reduce((n, a) => n + Math.max(a.contractMinor, a.paidMinor), 0);
  if (
    commitments +
      b.slots.reduce((n, x) => {
        const artistId = b.nominations
          .find((p) => p.id === x.selectedId)
          ?.revisions.at(-1)?.artistId;
        const a = s.artworks.find((a) => a.id === artistId);
        return (
          n + Math.max(x.budgetMinor, a?.contractMinor ?? 0, a?.paidMinor ?? 0)
        );
      }, 0) >
    s.block.budgetMinor
  )
    fail("Brief reservations exceed the edition budget.");
}
function reopen(b: Curation) {
  b.phase = "DRAFT";
  const current = b.snapshots.at(-1);
  if (current?.state === "LOCKED") current.state = "SUPERSEDED";
}
export function invalidateWithdrawnBrief(
  s: Ledger,
  artworkId: string,
  at: string,
) {
  const b = s.curation;
  if (!b) return;
  for (const slot of b.slots) {
    const n = b.nominations.find((n) => n.id === slot.selectedId);
    if (n?.revisions.at(-1)?.artistId !== artworkId) continue;
    n.status = "RETURNED";
    n.feedback.push({
      role: "System",
      reason: "Participation withdrawn",
      note: "The dossier was withdrawn. Submit another proposal for this slot.",
      revision: n.revisions.at(-1)!.number,
      at,
    });
    slot.selectedId = null;
    reopen(b);
  }
}
export function invalidateClosedBriefs(s: Ledger, at: string) {
  if (!s.curation) return;
  const b = s.curation;
  for (const slot of b.slots) {
    if (activeGallery(s, slot.galleryId)) continue;
    if (slot.selectedId) {
      const n = b.nominations.find((x) => x.id === slot.selectedId)!;
      n.status = "RETURNED";
      n.feedback.push({
        role: "System",
        reason: "Venue unavailable",
        note: "The selected location closed. Move this slot and resubmit for review.",
        revision: n.revisions.at(-1)!.number,
        at,
      });
      slot.selectedId = null;
    }
    reopen(b);
  }
}
export function applyCuration(
  s: Ledger,
  actor: LedgerActor,
  c: CurationCommand,
  at: string,
) {
  const b = (s.curation ??= emptyCuration());
  const requireRole = (role: string) => {
    if (actor.role !== role)
      fail("This decision belongs to another role.", 403);
  };
  if (s.block.state !== "ACTIVE")
    fail("Authorize the spatial block before issuing a curatorial brief.");
  if (b.phase === "ENDORSED")
    fail(
      "The endorsed roster is locked. A venue exception must be resolved through a new review.",
    );
  const slot = b.slots.find((x) => x.id === c.slotId);
  const nomination = b.nominations.find((x) => x.id === c.id);
  const revision = nomination?.revisions.at(-1);
  const editable = () => {
    if (b.phase !== "DRAFT")
      fail("The Defense Board is in review. Draft changes are locked.");
  };
  switch (c.action) {
    case "CURATE_CREATE_SLOTS": {
      requireRole("General_Exhibition_Coordinator");
      editable();
      if (
        !text(c.id) ||
        b.slots.some((x) => x.id.startsWith(c.id! + ":")) ||
        !text(c.brief, 10) ||
        !Number.isInteger(c.quantity) ||
        c.quantity! < 1 ||
        c.quantity! > 20 ||
        !Number.isFinite(c.areaM2) ||
        c.areaM2! <= 0 ||
        !Number.isSafeInteger(c.budgetMinor) ||
        c.budgetMinor! <= 0 ||
        !s.staff.some((x) => x.id === c.coordinatorId) ||
        !activeGallery(s, c.galleryId!)
      )
        fail(
          "Complete a unique brief, active gallery, assigned coordinator, positive area and budget, and 1–20 slots.",
          422,
        );
      for (let i = 0; i < c.quantity!; i++)
        b.slots.push({
          id: `${c.id}:${i + 1}`,
          galleryId: c.galleryId!,
          brief: c.brief!.trim(),
          areaM2: c.areaM2!,
          budgetMinor: c.budgetMinor!,
          assignedTo: c.coordinatorId!,
          selectedId: null,
        });
      checkPlan(s);
      break;
    }
    case "CURATE_PROPOSE": {
      requireRole("Exhibition_Coordinator");
      editable();
      if (!slot || slot.assignedTo !== actor.id)
        fail("This brief is assigned to another coordinator.", 403);
      if (!activeGallery(s, slot.galleryId))
        fail("The Coordinator must relocate this slot first.");
      if (
        !text(c.id) ||
        !s.artworks.some((a) => a.id === c.artistId) ||
        !text(c.fit, 10) ||
        !text(c.evidence, 5) ||
        !Number.isFinite(c.areaM2) ||
        c.areaM2! <= 0 ||
        c.areaM2! > slot.areaM2 ||
        !Number.isSafeInteger(c.costMinor) ||
        c.costMinor! < 0 ||
        c.costMinor! > slot.budgetMinor
      )
        fail(
          "Provide an artist, thematic rationale, evidence reference, and dimensions/budget within the brief.",
          422,
        );
      if (
        s.artworks.some(
          (a) =>
            a.id === c.artistId &&
            (a.state === "APPROVED" || a.state === "WITHDRAWN"),
        )
      )
        fail(
          "This artist already has an allocation or withdrawal. Resolve that dossier first.",
        );
      if (
        b.nominations.some(
          (n) =>
            n.id !== c.id &&
            n.status !== "RETURNED" &&
            n.revisions.at(-1)!.artistId === c.artistId,
        )
      )
        fail("This artist already has an active proposal.");
      if (
        nomination &&
        (nomination.authorId !== actor.id ||
          nomination.slotId !== slot.id ||
          nomination.status !== "RETURNED" ||
          c.revision !== revision?.number ||
          !text(c.response, 10))
      )
        fail(
          "Only the original proposer can resubmit a returned revision with a specific response.",
        );
      const next: ProposalRevision = {
        number: (revision?.number ?? 0) + 1,
        artistId: c.artistId!,
        fit: c.fit!.trim(),
        evidence: c.evidence!.trim(),
        areaM2: c.areaM2!,
        costMinor: c.costMinor!,
        response: c.response?.trim() || "",
        authorId: actor.id,
        at,
      };
      if (nomination) {
        nomination.revisions.push(next);
        nomination.status = "SUBMITTED";
      } else
        b.nominations.push({
          id: c.id!,
          slotId: slot.id,
          authorId: actor.id,
          status: "SUBMITTED",
          revisions: [next],
          feedback: [],
        });
      break;
    }
    case "CURATE_SHORTLIST": {
      requireRole("General_Exhibition_Coordinator");
      editable();
      if (
        !nomination ||
        nomination.status !== "SUBMITTED" ||
        c.revision !== revision?.number
      )
        fail("Review the current submitted revision.");
      const target = b.slots.find((x) => x.id === nomination.slotId)!;
      if (target.selectedId)
        fail(
          "This slot already has a shortlisted proposal. Return that proposal with reasons first.",
        );
      if (!activeGallery(s, target.galleryId))
        fail("The slot location is unavailable.");
      target.selectedId = nomination.id;
      nomination.status = "SHORTLISTED";
      checkPlan(s);
      break;
    }
    case "CURATE_RETURN": {
      if (!nomination || c.revision !== revision?.number)
        fail("The proposal revision changed.");
      if (actor.role === "General_Exhibition_Coordinator") {
        editable();
        if (!["SUBMITTED", "SHORTLISTED"].includes(nomination.status))
          fail("This proposal is not awaiting Coordinator review.");
      } else {
        requireRole("Committee");
        if (
          b.phase !== "COMMITTEE_REVIEW" ||
          !["SHORTLISTED", "COMMITTEE_APPROVED"].includes(nomination.status)
        )
          fail("This proposal is not on the Committee board.");
      }
      if (!curationReasons.includes(c.reason!) || !text(c.note, 10))
        fail(
          "Select a reason and provide a specific note (at least 10 characters).",
          422,
        );
      nomination.feedback.push({
        role: actor.role,
        reason: c.reason!,
        note: c.note!.trim(),
        revision: revision!.number,
        at,
      });
      nomination.status = "RETURNED";
      b.slots.find((x) => x.id === nomination.slotId)!.selectedId = null;
      reopen(b);
      break;
    }
    case "CURATE_LOCK": {
      requireRole("General_Exhibition_Coordinator");
      editable();
      checkPlan(s);
      if (
        !text(c.id) ||
        b.snapshots.some((x) => x.id === c.id) ||
        !b.slots.length ||
        b.slots.some((x) => !x.selectedId)
      )
        fail("Fill every brief slot before locking the board.");
      b.snapshots.push({
        id: c.id!,
        at,
        state: "LOCKED",
        rows: b.slots.map((x) => ({
          slot: structuredClone(x),
          proposalId: x.selectedId!,
          revision: structuredClone(
            b.nominations.find((n) => n.id === x.selectedId)!.revisions.at(-1)!,
          ),
        })),
      });
      b.phase = "COMMITTEE_REVIEW";
      break;
    }
    case "CURATE_COMMITTEE_APPROVE": {
      requireRole("Committee");
      if (
        b.phase !== "COMMITTEE_REVIEW" ||
        !nomination ||
        nomination.status !== "SHORTLISTED" ||
        c.revision !== revision?.number
      )
        fail("Review the current locked proposal.");
      checkPlan(s);
      nomination.status = "COMMITTEE_APPROVED";
      if (
        b.slots.every((x) =>
          ["COMMITTEE_APPROVED", "ENDORSED"].includes(
            b.nominations.find((n) => n.id === x.selectedId)!.status,
          ),
        )
      )
        b.phase = "DIRECTOR_REVIEW";
      break;
    }
    case "CURATE_ENDORSE": {
      requireRole("Director");
      if (b.phase !== "DIRECTOR_REVIEW")
        fail("Committee approval is required for every selected proposal.");
      checkPlan(s);
      for (const row of b.snapshots.at(-1)!.rows) {
        const n = b.nominations.find((x) => x.id === row.proposalId)!;
        if (
          !["COMMITTEE_APPROVED", "ENDORSED"].includes(n.status) ||
          n.revisions.at(-1)!.number !== row.revision.number
        )
          fail("The board revision changed.");
        const a = s.artworks.find((x) => x.id === row.revision.artistId)!;
        if (n.status === "ENDORSED") continue;
        if (a.state === "APPROVED" || a.state === "WITHDRAWN")
          fail("An artwork allocation changed during board review.");
        a.galleryId = row.slot.galleryId;
        a.areaM2 = row.revision.areaM2;
        a.state = "APPROVED";
        a.coordinatorId = row.slot.assignedTo;
        a.assignmentVersion++;
        a.technicalVersion = null;
        a.authorizedVersion = null;
        n.status = "ENDORSED";
      }
      b.phase = "ENDORSED";
      b.snapshots.at(-1)!.state = "ENDORSED";
      break;
    }
    case "CURATE_MOVE_SLOT": {
      requireRole("General_Exhibition_Coordinator");
      editable();
      if (
        !slot ||
        activeGallery(s, slot.galleryId) ||
        !activeGallery(s, c.galleryId!) ||
        !text(c.note, 10)
      )
        fail(
          "Select an unavailable slot, an active replacement gallery and a reason.",
        );
      slot.galleryId = c.galleryId!;
      checkPlan(s);
      break;
    }
    default:
      fail("Unknown curatorial action.", 422);
  }
}
