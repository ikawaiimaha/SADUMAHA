import {
  applyCuration,
  invalidateClosedBriefs,
  invalidateWithdrawnBrief,
  slotReservations,
  isBoardAllocated,
  type Curation,
  type CurationCommand,
} from "./curatorialBoard";
export type LedgerActor = { id: string; role: string; exhibitionId: string };
export type Venue = { id: string; name: string; active: boolean };
export type Gallery = {
  id: string;
  venueId: string;
  name: string;
  active: boolean;
  maxWorks: number;
  usableM2: number;
};
export type Allocation = {
  id: string;
  name: string;
  areaM2: number;
  galleryId: string | null;
  state: "UNASSIGNED" | "APPROVED" | "LOCATION_ORPHANED" | "WITHDRAWN";
  assignmentVersion: number;
  technicalVersion: number | null;
  coordinatorId: string | null;
  contractMinor: number;
  authorizedVersion: number | null;
  paidMinor: number;
};
export type Ledger = {
  curation?: Curation;
  version: number;
  exhibitionId: string;
  block: {
    state: "DRAFT" | "ACTIVE";
    themeApprovalId: string | null;
    budgetMinor: number;
  };
  venues: Venue[];
  galleries: Gallery[];
  artworks: Allocation[];
  staff: { id: string; name: string; languages: string }[];
  decisions: {
    actorId: string;
    action: string;
    targetId: string;
    at: string;
    reason: string;
    version: number;
  }[];
};
export type LedgerCommand = {
  action:
    | "AUTHORIZE_BLOCK"
    | "APPROVE"
    | "REASSIGN"
    | "WITHDRAW"
    | "CLOSE_SPACE"
    | "CLOSE_VENUE"
    | "DELEGATE"
    | "TECHNICAL"
    | "DRAFT_CONTRACT"
    | "AUTHORIZE_CONTRACT"
    | "RELEASE"
    | CurationCommand["action"];
  expected: number;
  targetId?: string;
  galleryId?: string;
  coordinatorId?: string;
  amountMinor?: number;
  reason?: string;
} & Omit<Partial<CurationCommand>, "action" | "expected">;
export const ledgerSeed = (exhibitionId = "sandbox"): Ledger => ({
  version: 0,
  exhibitionId,
  block: { state: "DRAFT", themeApprovalId: null, budgetMinor: 15000000 },
  venues: [
    { id: "museum", name: "Museum · sample venue", active: true },
    { id: "square", name: "Square · sample venue", active: true },
  ],
  galleries: [
    {
      id: "gallery-a",
      venueId: "museum",
      name: "Gallery A",
      active: true,
      maxWorks: 2,
      usableM2: 30,
    },
    {
      id: "gallery-b",
      venueId: "museum",
      name: "Gallery B",
      active: true,
      maxWorks: 2,
      usableM2: 20,
    },
    {
      id: "square-a",
      venueId: "square",
      name: "Courtyard",
      active: true,
      maxWorks: 2,
      usableM2: 40,
    },
  ],
  artworks: [
    { id: "case-mounir-fatmi", name: "Mounir Fatmi · case study", areaM2: 12 },
    { id: "case-murat-kurt", name: "Murat Kurt · case study", areaM2: 8 },
    {
      id: "case-khaled-al-saai",
      name: "Khaled Al-Saai · case study",
      areaM2: 18,
    },
  ].map((a) => ({
    ...a,
    galleryId: null,
    state: "UNASSIGNED",
    assignmentVersion: 0,
    technicalVersion: null,
    coordinatorId: null,
    contractMinor: 0,
    authorizedVersion: null,
    paidMinor: 0,
  })),
  staff: [
    {
      id: "coordinator-a",
      name: "Coordinator A · sample account",
      languages: "Arabic / English",
    },
    {
      id: "coordinator-b",
      name: "Coordinator B · sample account",
      languages: "English / French",
    },
  ],
  decisions: [],
});
const fail = (message: string, status = 409): never => {
  throw Object.assign(new Error(message), { status });
};
export function spaceActive(s: Ledger, id: string | null) {
  const g = s.galleries.find((x) => x.id === id);
  return (
    !!g && g.active && s.venues.some((v) => v.id === g.venueId && v.active)
  );
}
export function capacity(s: Ledger, id: string, excluding?: string) {
  const g = s.galleries.find((x) => x.id === id);
  if (!g) return null;
  const rows = s.artworks.filter(
    (a) =>
      a.galleryId === id &&
      a.id !== excluding &&
      a.state === "APPROVED" &&
      !isBoardAllocated(s, a.id),
  );
  return {
    works: g.maxWorks - rows.length - slotReservations(s, id).works,
    m2:
      Math.round(
        (g.usableM2 -
          rows.reduce((n, a) => n + a.areaM2, 0) -
          slotReservations(s, id).m2) *
          100,
      ) / 100,
  };
}
export function alternatives(s: Ledger, a: Allocation) {
  return s.galleries
    .filter(
      (g) =>
        spaceActive(s, g.id) &&
        capacity(s, g.id, a.id)!.works >= 1 &&
        capacity(s, g.id, a.id)!.m2 >= a.areaM2,
    )
    .sort((x, y) => capacity(s, x.id, a.id)!.m2 - capacity(s, y.id, a.id)!.m2);
}
export function downstreamBlock(s: Ledger, a: Allocation) {
  if (s.block.state !== "ACTIVE")
    return "Director must authorize the spatial block.";
  if (a.state !== "APPROVED" || !spaceActive(s, a.galleryId))
    return "A valid approved gallery assignment is required.";
  if (a.technicalVersion !== a.assignmentVersion)
    return "Technical must clear the current location.";
  return "";
}
export function applyLedger(
  state: Ledger,
  actor: LedgerActor,
  c: LedgerCommand,
  themeApprovalId: string | null,
  at = new Date().toISOString(),
): Ledger {
  if (actor.exhibitionId !== state.exhibitionId)
    fail("This edition is outside your access.", 403);
  if (c.expected !== state.version)
    fail("The ledger changed. Refresh before retrying.");
  const s = structuredClone(state);
  const requireRole = (...roles: string[]) => {
    if (!roles.includes(actor.role))
      fail("This action belongs to another role.", 403);
  };
  const reason = () => {
    if (
      typeof c.reason !== "string" ||
      !c.reason.trim() ||
      c.reason.length > 500
    )
      fail("Record a short operational reason (maximum 500 characters).", 422);
  };
  const restrictedIds = new Set(s.curation?.benchmarks?.map((x) => x.id) ?? []);
  if (
    restrictedIds.has(c.targetId ?? "") &&
    actor.role !== "General_Exhibition_Coordinator"
  )
    fail("This record is restricted.", 403);
  const a = s.artworks.find((x) => x.id === c.targetId);
  const invalidate = (row: Allocation) => {
    row.assignmentVersion++;
    row.technicalVersion = null;
    row.authorizedVersion = null;
  };
  if (c.action.startsWith("CURATE_")) {
    applyCuration(s, actor, c as CurationCommand, at, themeApprovalId);
    s.version++;
    s.decisions.push({
      actorId: actor.id,
      action: c.action,
      targetId: c.id || c.slotId || s.exhibitionId,
      at,
      reason: c.note || c.reason || "",
      version: s.version,
    });
    return s;
  }
  if (c.action === "AUTHORIZE_BLOCK") {
    requireRole("Director");
    if (s.block.state === "ACTIVE") fail("The block is already authorized.");
    if (!themeApprovalId)
      fail("Chairman theme approval is required before venue authorization.");
    s.block.state = "ACTIVE";
    s.block.themeApprovalId = themeApprovalId;
  } else if (c.action === "CLOSE_SPACE" || c.action === "CLOSE_VENUE") {
    requireRole("Director", "General_Exhibition_Coordinator");
    reason();
    const target =
      c.action === "CLOSE_SPACE"
        ? s.galleries.find((g) => g.id === c.targetId)
        : s.venues.find((v) => v.id === c.targetId);
    if (!target || !target.active)
      fail("The venue or space is already closed or does not exist.");
    target.active = false;
    for (const row of s.artworks)
      if (row.state === "APPROVED" && !spaceActive(s, row.galleryId)) {
        row.state = "LOCATION_ORPHANED";
        invalidate(row);
      }
  } else {
    if (!a) fail("Artwork not found.", 404);
    if (c.action === "APPROVE" || c.action === "REASSIGN") {
      if (c.action === "APPROVE" && s.curation?.slots.length)
        fail("Use the Curatorial brief and Defense Board for this edition.");
      if (
        c.action === "REASSIGN" &&
        s.curation?.snapshots.some(
          (snapshot) =>
            snapshot.state === "ENDORSED" &&
            snapshot.rows.some((row) => row.revision.artistId === a.id),
        )
      )
        fail(
          "Relocate the brief slot and obtain a new Defense Board endorsement.",
        );
      requireRole(
        c.action === "APPROVE" ? "Committee" : "General_Exhibition_Coordinator",
      );
      if (s.block.state !== "ACTIVE")
        fail("Director must authorize the spatial block.");
      if (c.action === "APPROVE" && a.state !== "UNASSIGNED")
        fail("This record already has a Committee decision.");
      if (c.action === "REASSIGN") {
        reason();
        if (a.state !== "LOCATION_ORPHANED")
          fail("Only records needing a location can be reassigned.");
      }
      const gallery = s.galleries.find((g) => g.id === c.galleryId);
      if (!gallery || !spaceActive(s, gallery.id))
        fail("Select an active gallery in this edition.");
      const room = capacity(s, gallery.id, a.id)!;
      if (room.works < 1 || room.m2 < a.areaM2)
        fail("This gallery has insufficient capacity.");
      if (!Number.isFinite(a.areaM2) || a.areaM2 <= 0)
        fail("A reviewed footprint is required.");
      a.galleryId = gallery.id;
      a.state = "APPROVED";
      invalidate(a);
    } else if (c.action === "WITHDRAW") {
      requireRole("General_Exhibition_Coordinator");
      reason();
      if (a.state === "WITHDRAWN") fail("Already withdrawn.");
      a.state = "WITHDRAWN";
      invalidate(a);
      invalidateWithdrawnBrief(s, a.id, at);
    } else if (c.action === "DELEGATE") {
      requireRole("General_Exhibition_Coordinator");
      if (!s.staff.some((x) => x.id === c.coordinatorId))
        fail("Choose a registered coordinator.");
      if (a.state === "WITHDRAWN")
        fail("Withdrawn records cannot be delegated.");
      a.coordinatorId = c.coordinatorId!;
    } else if (c.action === "TECHNICAL") {
      requireRole("Technical");
      if (a.state !== "APPROVED" || !spaceActive(s, a.galleryId))
        fail("Assign a valid gallery first.");
      a.technicalVersion = a.assignmentVersion;
    } else if (c.action === "DRAFT_CONTRACT") {
      const boardSelection = s.curation?.slots.find(
        (slot) =>
          s
            .curation!.nominations.find((n) => n.id === slot.selectedId)
            ?.revisions.at(-1)?.artistId === a.id,
      );
      if (
        boardSelection &&
        c.amountMinor! >
          s
            .curation!.nominations.find(
              (n) => n.id === boardSelection.selectedId,
            )!
            .revisions.at(-1)!.costMinor
      )
        fail(
          "Contract terms exceed the endorsed proposal estimate. A reviewed budget amendment is required.",
        );
      requireRole("Exhibition_Coordinator");
      if (a.coordinatorId !== actor.id)
        fail("This dossier is assigned to another coordinator.", 403);
      const block = downstreamBlock(s, a);
      if (block) fail(block);
      if (
        !Number.isSafeInteger(c.amountMinor) ||
        c.amountMinor! <= 0 ||
        c.amountMinor! < a.paidMinor
      )
        fail(
          "Use a positive contract amount, no lower than payments already recorded.",
          422,
        );
      const total = s.artworks.reduce(
        (n, x) =>
          n +
          (x.id === a.id
            ? c.amountMinor!
            : Math.max(x.contractMinor, x.paidMinor)),
        0,
      );
      if (total > s.block.budgetMinor)
        fail("This draft exceeds the authorized edition budget.");
      a.contractMinor = c.amountMinor!;
      a.authorizedVersion = null;
    } else if (c.action === "AUTHORIZE_CONTRACT") {
      requireRole("General_Exhibition_Coordinator");
      const block = downstreamBlock(s, a);
      if (block) fail(block);
      if (!a.contractMinor)
        fail("An assigned coordinator must prepare the contract first.");
      a.authorizedVersion = a.assignmentVersion;
    } else if (c.action === "RELEASE") {
      requireRole("Finance");
      const block = downstreamBlock(s, a);
      if (block) fail(block);
      if (a.authorizedVersion !== a.assignmentVersion)
        fail("Coordinator authorization is missing or stale.");
      if (a.paidMinor > 0) fail("The advance has already been recorded.");
      a.paidMinor = Math.ceil(a.contractMinor * 0.3);
    } else fail("Unknown ledger action.", 422);
  }
  if (c.action === "CLOSE_SPACE" || c.action === "CLOSE_VENUE")
    invalidateClosedBriefs(s, at);
  s.version++;
  s.decisions.push({
    actorId: actor.id,
    action: c.action,
    targetId: c.targetId || s.exhibitionId,
    at,
    reason: c.reason?.trim() || "",
    version: s.version,
  });
  return s;
}
