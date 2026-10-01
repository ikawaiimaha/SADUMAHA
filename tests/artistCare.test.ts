import { preTransitHold, latestPreDispatch } from "../src/lib/preTransit";
import { careNextStep, returnReadiness } from "../src/lib/artistCareExperience";
import {
  customsExport,
  consolidationCandidates,
  shippingReadiness,
  validateFreight,
  type FreightDetails,
} from "../src/lib/artistFreight";
import { artistShippingPdf } from "../src/lib/artistShippingPdf";
import express from "express";
import { spatialLedgerRouter } from "../server/spatial-ledger.mjs";
import { validateCraft, type ArtistCraft } from "../src/lib/artistCraft";
import type { ThemeState } from "../src/lib/themeWorkflow";
import test from "node:test";
import assert from "node:assert/strict";
import { createArtistCareService } from "../server/artist-care.mjs";
import {
  applyLedger,
  ledgerSeed,
  type LedgerCommand,
} from "../src/lib/spatialLedger";
import { projectCuratorialLedger } from "../src/lib/curatorialAccess";
import {
  applyArtistCare,
  emptyArtistCare,
  legacyAvailable,
  projectArtistCare,
  type Work,
  type CareCommand,
} from "../src/lib/artistCare";

const theme: ThemeState = {
  revision: 7,
  phase: "Published",
  proposals: [],
  notes: [],
  snapshots: [],
  events: [{ action: "SELECT" }, { action: "PUBLISH" }] as ThemeState["events"],
  published: {
    revision: 6,
    selected: 0,
    proposals: [
      {
        en: "Shared practice",
        ar: "ممارسة مشتركة",
        rationale: "",
        feasibility: "",
        translation: "",
      },
    ],
    essay: {
      introduction: { en: "Approved introduction", ar: "مقدمة معتمدة" },
      context: { en: "Approved context", ar: "سياق معتمد" },
      checkedEn: true,
      checkedAr: true,
    },
  },
};
const at = "2026-09-30T10:00:00Z";

test("backend care responses are artist-scoped and unverified media ingestion is disabled", async () => {
  const j = await journey();
  let stored = { spatialLedger: j.ledger, artistCare: j.s, artworks: [] };
  const repository = {
    read: () => structuredClone(stored),
    transaction: async (work: any) => {
      const next = structuredClone(stored);
      const result = await work(next);
      stored = next;
      return result;
    },
  };
  const service = createArtistCareService(repository);
  assert.equal(
    service.read({ id: "unassigned", role: "Artist", exhibitionId: "sandbox" })
      .invitations.length,
    0,
  );
  assert.throws(
    () =>
      service.read({
        id: "Director",
        role: "Director",
        exhibitionId: "another-edition",
      }),
    /scope denied/,
  );
  await assert.rejects(
    () =>
      service.mutate(
        { id: "Director", role: "Director", exhibitionId: "sandbox" },
        {
          action: "LEGACY_ASSET",
          expected: j.s.version,
          data: { file: image },
        },
      ),
    /Verified media storage is not connected/,
  );
  assert.equal(stored.artistCare.version, j.s.version);
});
function roster() {
  let s = ledgerSeed();
  const act = (role: string, c: Omit<LedgerCommand, "expected">, id = role) => {
    s = applyLedger(
      s,
      { id, role, exhibitionId: "sandbox" },
      { ...c, expected: s.version },
      "theme-selection-1",
      at,
    );
  };
  act("Director", { action: "AUTHORIZE_BLOCK" });
  act("General_Exhibition_Coordinator", {
    action: "CURATE_CREATE_SLOTS",
    id: "brief",
    galleryId: "gallery-a",
    quantity: 1,
    areaM2: 10,
    budgetMinor: 100000,
    coordinatorId: "coordinator-a",
    brief: "A synthetic contemporary calligraphy brief.",
  });
  act(
    "Exhibition_Coordinator",
    {
      action: "CURATE_PROPOSE",
      id: "proposal",
      slotId: "brief:1",
      artistId: s.artworks[0].id,
      areaM2: 8,
      costMinor: 90000,
      fit: "Fits the synthetic curatorial standard.",
      evidence: "Synthetic research dossier",
    },
    "coordinator-a",
  );
  act("General_Exhibition_Coordinator", {
    action: "CURATE_SHORTLIST",
    id: "proposal",
    revision: 1,
  });
  act("General_Exhibition_Coordinator", { action: "CURATE_LOCK", id: "board" });
  act("Committee", {
    action: "CURATE_COMMITTEE_APPROVE",
    id: "proposal",
    revision: 1,
  });
  act("Director", { action: "CURATE_ENDORSE" });
  return s;
}
const image = {
  id: "image",
  name: "Synthetic image",
  type: "image/png",
  bytes: 1000,
  hash: "a".repeat(64),
  width: 2400,
  height: 1600,
};
const work = (): Work => ({
  id: "work",
  title: "Synthetic commission",
  route: "COMMISSION",
  width: 100,
  height: 100,
  depth: 10,
  weight: 1,
  year: 2026,
  rationale: "A synthetic proposal about shared artistic practice.",
  thematicDefense: {
    conceptual: "Shared practice connects this artwork to the theme.",
    material: "Bronze expresses the continuity of shared practice.",
    damage: false,
    acknowledged: true,
    themeRevision: 6,
  },
  packing: "Protect all surfaces.",
  insuranceMinor: 100000,
  budget: [
    { label: "Materials", minor: 30000 },
    { label: "Fabrication", minor: 30000 },
    { label: "Labor", minor: 30000 },
  ],
  media: { sketch: image, material: image, mockup: image },
  maintenance: "Dry brush only; no solvents.",
  intervalDays: 7,
  consent: ["proposal-review", "alterations"],
  state: "SUBMITTED",
  revision: 0,
  milestones: [],
  maintenanceLog: [],
  legacy: [],
});
async function journey() {
  const ledger = roster();
  let state = emptyArtistCare();
  let token = "";
  const act = async (
    role: string,
    action: string,
    data?: any,
    workId?: string,
    time = at,
    id?: string,
  ) => {
    const inv = state.invitations[0];
    const actor = {
      role,
      id:
        id ??
        (role === "Artist_Portal"
          ? inv?.artistActorId
          : role === "Exhibition_Coordinator"
            ? "coordinator-a"
            : role),
      exhibitionId: "sandbox",
    };
    const result = await applyArtistCare(
      state,
      actor,
      { action, data, workId, invitationId: inv?.id, expected: state.version },
      ledger,
      time,
      theme,
    );
    state = result.state;
    if (result.token) token = result.token;
  };
  await act("General_Exhibition_Coordinator", "SET_BRIEF", {
    theme: "Shared practice",
    deadline: "2026-10-10T10:00:00Z",
    closesAt: "2026-10-20T10:00:00Z",
    commissionAllowed: true,
  });
  await act("Editorial", "DRAFT_TEMPLATE", {
    en: "Dear [Artist_Name], welcome to [Exhibition_Theme] at [Assigned_Venue], deadline [Logistics_Deadlines].",
    ar: "دعوة [Artist_Name] للمشاركة في [Exhibition_Theme] في [Assigned_Venue] قبل [Logistics_Deadlines].",
  });
  await act("Finance", "REVIEW_TEMPLATE", {
    note: "Synthetic policy review reference",
  });
  await act("Director", "LOCK_TEMPLATE");
  return {
    ledger,
    get s() {
      return state;
    },
    get token() {
      return token;
    },
    act,
  };
}

test("benchmark seeds are projected out of research responses, histories and allocations", () => {
  let s = ledgerSeed();
  const act = (role: string, c: Omit<LedgerCommand, "expected">) => {
    s = applyLedger(
      s,
      { role, id: role, exhibitionId: "sandbox" },
      { ...c, expected: s.version },
      "theme-selection-1",
      at,
    );
  };
  act("Committee", {
    action: "CURATE_SEED",
    id: "secret-seed",
    name: "Restricted synthetic artist",
    fit: "A benchmark for precise contemporary execution.",
  });
  assert.equal(
    projectCuratorialLedger(s, "Committee").curation!.benchmarks!.length,
    0,
  );
  act("Director", { action: "AUTHORIZE_BLOCK" });
  assert.throws(
    () =>
      act("General_Exhibition_Coordinator", {
        action: "CURATE_CREATE_SLOTS",
        id: "open",
        brief: "Public brief for independent research",
        galleryId: "gallery-a",
        quantity: 1,
        areaM2: 5,
        budgetMinor: 10000,
        coordinatorId: "coordinator-a",
      }),
    /Allocate Committee/,
  );
  act("General_Exhibition_Coordinator", {
    action: "CURATE_ASSIGN_SEED",
    id: "secret-seed",
    galleryId: "gallery-a",
    areaM2: 8,
    costMinor: 50000,
  });
  assert.throws(
    () =>
      act("General_Exhibition_Coordinator", {
        action: "CURATE_RETURN",
        id: "secret-seed",
        revision: 1,
        reason: "Evidence insufficient",
        note: "A prohibited veto attempt",
      }),
    /cannot be vetoed/,
  );
  const research = JSON.stringify(
    projectCuratorialLedger(s, "Exhibition_Coordinator"),
  );
  assert.ok(!research.includes("secret-seed"));
  assert.ok(!research.includes("Restricted synthetic artist"));
  assert.equal(
    projectCuratorialLedger(s, "Exhibition_Coordinator").galleries[0].maxWorks,
    1,
  );
  act("General_Exhibition_Coordinator", {
    action: "CURATE_LOCK",
    id: "combined",
  });
  assert.equal(
    projectCuratorialLedger(s, "Director").curation!.benchmarks!.length,
    1,
  );
  act("Committee", {
    action: "CURATE_COMMITTEE_APPROVE",
    id: "secret-seed",
    revision: 1,
  });
  act("Director", { action: "CURATE_ENDORSE" });
  act("Director", {
    action: "CLOSE_SPACE",
    targetId: "gallery-a",
    reason: "Venue unavailable",
  });
  act("General_Exhibition_Coordinator", {
    action: "CURATE_ASSIGN_SEED",
    id: "secret-seed",
    galleryId: "gallery-b",
    areaM2: 8,
    costMinor: 50000,
  });
  assert.equal(s.curation!.nominations[0].revisions.length, 2);
});

test("approved template auto-prepares a snapshot; codes are hashed, one-use and artist-bound", async () => {
  const j = await journey();
  assert.equal(j.s.invitations.length, 1);
  assert.equal(j.s.template!.hash!.length, 64);
  const original = j.s.invitations[0].en;
  await j.act("Exhibition_Coordinator", "WELCOME", {
    note: "Welcome to this synthetic demonstration.",
  });
  await j.act("Exhibition_Coordinator", "DISPATCH");
  assert.ok(j.token);
  assert.ok(!JSON.stringify(j.s).includes(j.token));
  await assert.rejects(
    () =>
      j.act(
        "Artist_Portal",
        "ACCEPT",
        { token: j.token },
        undefined,
        at,
        "another-artist",
      ),
    /another artist/,
  );
  await j.act("Artist_Portal", "ACCEPT", { token: j.token });
  await assert.rejects(
    () => j.act("Artist_Portal", "ACCEPT", { token: j.token }),
    /already used/,
  );
  await j.act("Editorial", "DRAFT_TEMPLATE", {
    en: "Revised [Artist_Name] [Exhibition_Theme] [Assigned_Venue] [Logistics_Deadlines]",
    ar: "نص جديد [Artist_Name] [Exhibition_Theme] [Assigned_Venue] [Logistics_Deadlines]",
  });
  assert.equal(j.s.invitations[0].en, original);
  assert.equal(j.s.template!.hash, undefined);
});
test("submission revisions, financial separation, repair approval and timed legacy release", async () => {
  const j = await journey();
  await j.act("Exhibition_Coordinator", "WELCOME", {
    note: "Welcome to the fictional journey.",
  });
  await j.act("Exhibition_Coordinator", "DISPATCH");
  await j.act("Artist_Portal", "ACCEPT", { token: j.token });
  await assert.rejects(
    () =>
      j.act("Artist_Portal", "SUBMIT_WORK", {
        work: { ...work(), consent: [] },
      }),
    /Acknowledge/,
  );
  await j.act("Artist_Portal", "SUBMIT_WORK", { work: work() });
  await j.act(
    "General_Exhibition_Coordinator",
    "RETURN_WORK",
    { note: "Please refine the fabrication explanation." },
    "work",
  );
  await j.act("Artist_Portal", "SUBMIT_WORK", { work: work(), revision: 1 });
  assert.equal(j.s.invitations[0].works[0].revision, 2);
  assert.equal(j.s.invitations[0].works[0].previous!.length, 1);
  await assert.rejects(
    () => j.act("Director", "APPROVE_WORK", {}, "work"),
    /Committee review/,
  );
  await j.act("Committee", "RECOMMEND_WORK", {}, "work");
  await j.act("Director", "APPROVE_WORK", {}, "work");
  await j.act(
    "Artist_Portal",
    "MILESTONES",
    {
      rows: [
        { label: "Armature", minor: 30000 },
        { label: "Cast", minor: 30000 },
        { label: "Patina", minor: 30000 },
      ],
    },
    "work",
  );
  const milestone = j.s.invitations[0].works[0].milestones[0].id;
  await j.act(
    "Artist_Portal",
    "MILESTONE_PROOF",
    { id: milestone, file: image },
    "work",
  );
  await j.act(
    "General_Exhibition_Coordinator",
    "VERIFY_PROGRESS",
    { id: milestone },
    "work",
  );
  await assert.rejects(
    () =>
      j.act(
        "General_Exhibition_Coordinator",
        "RECORD_PAYMENT",
        { id: milestone },
        "work",
      ),
    /another desk/,
  );
  await assert.rejects(
    () => j.act("Finance", "RECORD_PAYMENT", { id: milestone }, "work"),
    /Finance requires/,
  );
  const a = j.ledger.artworks[0];
  a.technicalVersion = a.assignmentVersion;
  a.authorizedVersion = a.assignmentVersion;
  a.contractMinor = 90000;
  await j.act("Finance", "RECORD_PAYMENT", { id: milestone }, "work");
  await assert.rejects(
    () => j.act("Finance", "RECORD_PAYMENT", { id: milestone }, "work"),
    /Finance requires/,
  );
  await assert.rejects(
    () =>
      j.act(
        "Logistics_Officer",
        "RECEIVE",
        { file: image, note: "Damage found at receipt", damage: true },
        "work",
      ),
    /location/i,
  );
  await j.act(
    "Logistics_Officer",
    "RECEIVE",
    {
      file: image,
      note: "Damage found at receipt",
      damage: true,
      location: {
        latitude: 25.36143,
        longitude: 55.38702,
        accuracy: 5,
        timestamp: Date.parse(at),
      },
    },
    "work",
  );
  await assert.rejects(
    () => j.act("Technical", "INSTALL", {}, "work"),
    /repair/,
  );
  await j.act(
    "Technical",
    "REPAIR_PLAN",
    { protocol: "Use the approved dry mechanical repair method." },
    "work",
  );
  await j.act("Artist_Portal", "APPROVE_REPAIR", {}, "work");
  await j.act(
    "Technical",
    "REPAIR_PLAN",
    { protocol: "Use a revised mechanical repair method." },
    "work",
  );
  await assert.rejects(
    () => j.act("Technical", "COMPLETE_REPAIR", {}, "work"),
    /exact repair/,
  );
  await j.act("Artist_Portal", "APPROVE_REPAIR", {}, "work");
  await j.act("Technical", "COMPLETE_REPAIR", {}, "work");
  await j.act("Technical", "INSTALL", {}, "work");
  await assert.rejects(
    () =>
      j.act("Technical", "MAINTAIN", { note: "Dusted with dry brush" }, "work"),
    /due maintenance/,
  );
  await j.act(
    "Technical",
    "MAINTAIN",
    { note: "Dusted with dry brush" },
    "work",
    "2026-10-08T10:00:00Z",
  );
  await j.act(
    "Editorial",
    "LEGACY_ASSET",
    { file: image, kind: "Installation photograph" },
    "work",
  );
  const asset = j.s.invitations[0].works[0].legacy[0].id;
  await j.act("Director", "CLEAR_LEGACY", { id: asset }, "work");
  await assert.rejects(
    () => j.act("Logistics_Officer", "RETURN_TRANSIT", {}, "work"),
    /exhibition closes/,
  );
  await j.act(
    "Logistics_Officer",
    "DEINSTALL_CONDITION",
    {
      photos: [image],
      note: "Condition checked after de-installation.",
      damage: false,
    },
    "work",
    "2026-10-21T10:00:00Z",
  );
  await j.act(
    "Logistics_Officer",
    "RETURN_TRANSIT",
    {},
    "work",
    "2026-10-21T10:00:00Z",
  );
  assert.equal(
    legacyAvailable(
      j.s,
      j.s.invitations[0].works[0],
      Date.parse("2026-10-21T10:00:00Z"),
    ),
    false,
  );
  assert.equal(
    legacyAvailable(
      j.s,
      j.s.invitations[0].works[0],
      Date.parse("2026-10-22T10:00:00Z"),
    ),
    true,
  );
});
test("budget, stale commands and artist response projection fail closed", async () => {
  const j = await journey();
  await j.act("Exhibition_Coordinator", "WELCOME", {
    note: "Welcome to the synthetic journey.",
  });
  await j.act("Exhibition_Coordinator", "DISPATCH");
  await j.act("Artist_Portal", "ACCEPT", { token: j.token });
  await j.act("Artist_Portal", "SUBMIT_WORK", {
    work: { ...work(), budget: [{ label: "Materials", minor: 200000 }] },
  });
  await j.act("Committee", "RECOMMEND_WORK", {}, "work");
  await assert.rejects(
    () => j.act("Director", "APPROVE_WORK", {}, "work"),
    /reserved budget/,
  );
  await assert.rejects(
    () =>
      applyArtistCare(
        j.s,
        { id: "Director", role: "Director", exhibitionId: "sandbox" },
        { action: "PREPARE", expected: 0 },
        j.ledger,
      ),
    /Refresh/,
  );
  assert.equal(
    projectArtistCare(
      j.s,
      { id: "wrong", role: "Artist_Portal", exhibitionId: "sandbox" },
      j.ledger,
    ).invitations.length,
    0,
  );
});

test("benchmark artists receive only their own invitation envelope, never the planning record", async () => {
  const j = await journey(),
    i = j.s.invitations[0];
  j.ledger.curation!.benchmarks = [
    {
      id: i.artistId,
      name: i.name,
      rationale: "Restricted Committee reasoning",
      themeId: "theme-selection-1",
      assigned: true,
    },
  ];
  const own = {
    id: i.artistActorId,
    role: "Artist_Portal",
    exhibitionId: "sandbox",
  };
  assert.equal(projectArtistCare(j.s, own, j.ledger).invitations.length, 1);
  assert.ok(
    !JSON.stringify(projectArtistCare(j.s, own, j.ledger)).includes(
      "Restricted Committee reasoning",
    ),
  );
  assert.equal(
    projectCuratorialLedger(j.ledger, "Artist_Portal").artworks.some(
      (a) => a.id === i.artistId,
    ),
    false,
  );
  assert.equal(
    projectArtistCare(
      j.s,
      {
        id: "coordinator-a",
        role: "Exhibition_Coordinator",
        exhibitionId: "sandbox",
      },
      j.ledger,
    ).invitations.length,
    0,
  );
  await j.act("General_Exhibition_Coordinator", "WELCOME", {
    note: "A private welcome for the synthetic benchmark artist.",
  });
  await j.act("General_Exhibition_Coordinator", "DISPATCH");
  await j.act("Artist_Portal", "ACCEPT", { token: j.token });
  assert.equal(j.s.invitations[0].state, "ACCEPTED");
});

test("thematic defense rejects unpublished/stale themes and snapshots exact approved text", async () => {
  const j = await journey();
  await j.act("Exhibition_Coordinator", "WELCOME", {
    note: "Welcome to this synthetic exhibition proposal.",
  });
  await j.act("Exhibition_Coordinator", "DISPATCH");
  await j.act("Artist_Portal", "ACCEPT", { token: j.token });
  const invitation = j.s.invitations[0];
  const actor = {
    id: invitation.artistActorId,
    role: "Artist_Portal",
    exhibitionId: "sandbox",
  };
  const command = {
    action: "SUBMIT_WORK",
    expected: j.s.version,
    invitationId: invitation.id,
    data: { work: work() },
  };
  await assert.rejects(
    () => applyArtistCare(j.s, actor, command, j.ledger, at),
    /approved bilingual theme/,
  );
  const stale = work();
  stale.thematicDefense!.themeRevision = 0;
  await assert.rejects(
    () =>
      applyArtistCare(
        j.s,
        actor,
        { ...command, data: { work: stale } },
        j.ledger,
        at,
        theme,
      ),
    /acknowledge/,
  );
  const empty = work();
  empty.thematicDefense!.material = "";
  await assert.rejects(
    () =>
      applyArtistCare(
        j.s,
        actor,
        { ...command, data: { work: empty } },
        j.ledger,
        at,
        theme,
      ),
    /both thematic prompts/,
  );
  const approved = structuredClone(theme);
  const result = await applyArtistCare(
    j.s,
    actor,
    command,
    j.ledger,
    at,
    approved,
  );
  approved.published!.essay.introduction.en = "Later edit";
  assert.equal(
    result.state.invitations[0].works[0].thematicDefense!.theme!.essay
      .introduction.en,
    "Approved introduction",
  );
  assert.equal(
    result.state.invitations[0].works[0].thematicDefense!.conceptual,
    work().thematicDefense!.conceptual,
  );
  const spoken = work();
  spoken.thematicDefense!.conceptual = "";
  spoken.thematicDefense!.material = "";
  spoken.media.voice = { ...image, type: "audio/webm", duration: 60 };
  const audioResult = await applyArtistCare(
    j.s,
    actor,
    { ...command, data: { work: spoken } },
    j.ledger,
    at,
    theme,
  );
  assert.equal(
    audioResult.state.invitations[0].works[0].media.voice.duration,
    60,
  );
});

const craft: ArtistCraft = {
  lineage: 75,
  lineageRationale:
    "I extend proportioned forms through contemporary repetition.",
  anchors: ["Geometry & Infinity", "Shared learning"],
  substrate: "Ahar paper",
  pigment: "Soot ink and gold leaf",
  method: "Qalam",
  comparison: { final: image, grid: { ...image, id: "grid" } },
};
test("craft context validates bounded artist-defined data and equal pixel dimensions", () => {
  assert.equal(validateCraft(craft).lineage, 75);
  assert.throws(() => validateCraft({ ...craft, lineage: 101 }), /0 to 100/);
  assert.throws(() => validateCraft({ ...craft, lineage: 0.5 }), /0 to 100/);
  assert.throws(
    () => validateCraft({ ...craft, lineageRationale: "word ".repeat(51) }),
    /50 words/,
  );
  assert.throws(
    () =>
      validateCraft({
        ...craft,
        comparison: { final: image, grid: { ...image, width: 1 } },
      }),
    /identical pixel/,
  );
  assert.throws(
    () => validateCraft({ ...craft, anchors: ["a", "a"] }),
    /distinct/,
  );
  assert.throws(() => validateCraft({ ...craft, method: "" }), /substrate/);
});
test("consultation locks drafts, scopes messages, releases to artist and redacts submitted history", async () => {
  const j = await journey();
  await j.act("Exhibition_Coordinator", "WELCOME", {
    note: "Welcome to this synthetic exhibition.",
  });
  await j.act("Exhibition_Coordinator", "DISPATCH");
  await j.act("Artist_Portal", "ACCEPT", { token: j.token });
  const draft = { ...work(), craft };
  await j.act("Artist_Portal", "REQUEST_GUIDANCE", {
    work: draft,
    note: "Private synthetic question for the assigned coordinator.",
  });
  const id = draft.id;
  assert.equal(j.s.invitations[0].works[0].state, "GC_CONSULTATION");
  for (const role of [
    "Director",
    "Committee",
    "Finance",
    "General_Exhibition_Coordinator",
    "Technical",
  ]) {
    const projected = projectArtistCare(
      j.s,
      { id: role, role, exhibitionId: "sandbox" },
      j.ledger,
    );
    assert.ok(
      !JSON.stringify(projected).includes("Private synthetic question"),
    );
    assert.equal(projected.invitations[0].works.length, 0);
  }
  await assert.rejects(
    () => j.act("Artist_Portal", "SUBMIT_WORK", { work: draft, revision: 1 }),
    /returned current revision/,
  );
  await assert.rejects(
    () =>
      j.act(
        "Artist_Portal",
        "RELEASE_DRAFT",
        { note: "I release my own draft" },
        id,
      ),
    /Only the assigned/,
  );
  await assert.rejects(
    () =>
      j.act(
        "Exhibition_Coordinator",
        "GUIDANCE_MESSAGE",
        { note: "Unauthorized reply attempt" },
        id,
        at,
        "other-coordinator",
      ),
    /assigned coordinator/,
  );
  await j.act(
    "Exhibition_Coordinator",
    "GUIDANCE_MESSAGE",
    { note: "Explain the material relationship more clearly." },
    id,
  );
  await j.act(
    "Exhibition_Coordinator",
    "RELEASE_DRAFT",
    { note: "Please revise your material explanation and submit." },
    id,
  );
  await j.act("Artist_Portal", "SUBMIT_WORK", { work: draft, revision: 1 });
  const committee = projectArtistCare(
    j.s,
    { id: "Committee", role: "Committee", exhibitionId: "sandbox" },
    j.ledger,
  );
  assert.equal(
    committee.invitations[0].works[0].craft!.substrate,
    "Ahar paper",
  );
  assert.ok(!JSON.stringify(committee).includes("Private synthetic question"));
  assert.ok(
    !JSON.stringify(committee).includes("Explain the material relationship"),
  );
  assert.equal(committee.invitations[0].works[0].consultation, undefined);
  assert.equal(j.s.invitations[0].works[0].consultation!.messages.length, 3);
});

const freight: FreightDetails = {
  originCountry: "FR",
  pickupCountry: "DE",
  pickupCity: "Berlin",
  pickupAddress: "Synthetic collection address",
  latitude: 52.52,
  longitude: 13.405,
  readyFrom: "2026-10-01",
  readyUntil: "2026-10-05",
  handling: "CLIMATE_CONTROLLED",
  medium: "Bronze",
  customsValueMinor: 100000,
  currency: "EUR",
  grossWeightKg: 110,
  packageCount: 1,
  regime: "TEMPORARY_IMPORT",
};
async function freightJourney() {
  const j = await journey();
  await j.act("Exhibition_Coordinator", "WELCOME", {
    note: "Welcome to the synthetic freight test.",
  });
  await j.act("Exhibition_Coordinator", "DISPATCH");
  await j.act("Artist_Portal", "ACCEPT", { token: j.token });
  await j.act("Artist_Portal", "SUBMIT_WORK", { work: work() });
  await j.act("Committee", "RECOMMEND_WORK", {}, "work");
  await j.act("Director", "APPROVE_WORK", {}, "work");
  return j;
}
test("customs export separates valuation and origin; checkpoint gates PDF and locks evidence", async () => {
  const j = await freightJourney();
  const w = () => j.s.invitations[0].works[0];
  await j.act("Artist_Portal", "SAVE_FREIGHT", { freight }, "work");
  await assert.rejects(
    () =>
      j.act(
        "Artist_Portal",
        "PRE_DISPATCH_CONDITION",
        {
          photos: [image],
          note: "Missing explicit damage answer",
          acknowledged: true,
        },
        "work",
      ),
    /explicitly/,
  );
  const payload = customsExport(j.s.invitations[0], w());
  assert.equal(payload.countryOfOrigin, "FR");
  assert.equal(payload.pickup.country, "DE");
  assert.equal(payload.customsValue.currency, "EUR");
  assert.equal(payload.declaredInsuranceValue.currency, "AED");
  await assert.rejects(() => artistShippingPdf(w()), /pre-dispatch/);
  await assert.rejects(
    () =>
      j.act(
        "Artist_Portal",
        "PRE_DISPATCH_CONDITION",
        {
          photos: [image],
          note: "Ready for dispatch report",
          acknowledged: false,
        },
        "work",
      ),
    /Acknowledge/,
  );
  await assert.rejects(
    () =>
      j.act(
        "Finance",
        "PRE_DISPATCH_CONDITION",
        {
          photos: [image],
          note: "Ready for dispatch report",
          damage: false,
          acknowledged: true,
        },
        "work",
      ),
    /another desk/,
  );
  await j.act(
    "Artist_Portal",
    "PRE_DISPATCH_CONDITION",
    {
      photos: [image],
      note: "Ready for dispatch report",
      damage: false,
      acknowledged: true,
    },
    "work",
  );
  assert.equal(shippingReadiness(w()), null);
  assert.equal(
    Buffer.from(await artistShippingPdf(w()))
      .subarray(0, 5)
      .toString(),
    "%PDF-",
  );
  assert.equal(w().conditionHistory![0].hash.length, 64);
  assert.equal(w().conditionHistory![0].previousHash, null);
  await assert.rejects(
    () =>
      j.act(
        "Artist_Portal",
        "PRE_DISPATCH_CONDITION",
        {
          photos: [image],
          note: "Overwrite the same report",
          damage: false,
          acknowledged: true,
        },
        "work",
      ),
    /checkpoint is locked/,
  );
  await j.act(
    "Artist_Portal",
    "SAVE_FREIGHT",
    { freight: { ...freight, packageCount: 2 } },
    "work",
  );
  assert.match(shippingReadiness(w())!, /pre-dispatch/);
  assert.equal(w().conditionHistory!.length, 1);
  await j.act(
    "Artist_Portal",
    "PRE_DISPATCH_CONDITION",
    {
      photos: [image],
      note: "Rechecked after repacking into two crates.",
      damage: false,
      acknowledged: true,
    },
    "work",
  );
  assert.equal(
    w().conditionHistory![1].previousHash,
    w().conditionHistory![0].hash,
  );
  const stale = structuredClone(w());
  stale.revision++;
  assert.match(shippingReadiness(stale)!, /pre-dispatch/);
  const damage = structuredClone(w());
  damage.conditionHistory!.at(-1)!.damage = true;
  assert.match(shippingReadiness(damage)!, /damage/);
  assert.throws(
    () => validateFreight({ ...freight, regime: "ATA_CARNET" }),
    /Carnet reference/,
  );
});
test("consolidation requires nearby compatible pickups and does not invent savings", async () => {
  const j = await freightJourney();
  const s = structuredClone(j.s),
    i = s.invitations[0];
  const base = { ...i.works[0], freight };
  i.works = [
    base,
    {
      ...structuredClone(base),
      id: "near",
      freight: {
        ...freight,
        pickupCity: "Potsdam",
        latitude: 52.4,
        longitude: 13.05,
      },
    },
    {
      ...structuredClone(base),
      id: "far",
      freight: {
        ...freight,
        pickupCity: "Paris",
        latitude: 48.85,
        longitude: 2.35,
      },
    },
    {
      ...structuredClone(base),
      id: "late",
      freight: {
        ...freight,
        readyFrom: "2026-11-01",
        readyUntil: "2026-11-02",
      },
    },
    {
      ...structuredClone(base),
      id: "special",
      freight: { ...freight, handling: "SPECIALIST" },
    },
  ];
  const groups = consolidationCandidates(s);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].workIds.length, 2);
  assert.equal(groups[0].savingsPercent, null);
  assert.equal(groups[0].grossWeightKg, 220);
});
test("customs JSON HTTP endpoint checks actor scope and exposes only an explicit export", async (t) => {
  const j = await freightJourney();
  await j.act("Artist_Portal", "SAVE_FREIGHT", { freight }, "work");
  const stored = { artistCare: j.s, spatialLedger: j.ledger, artworks: [] };
  const care = createArtistCareService({ read: () => structuredClone(stored) });
  const app = express();
  let actor = {
    id: j.s.invitations[0].artistActorId,
    role: "Artist_Portal",
    exhibitionId: "sandbox",
  };
  app.use((req, res, next) => {
    res.locals.actor = actor;
    next();
  });
  app.use(spatialLedgerRouter({ care }));
  app.use((e, req, res, next) =>
    res.status(e.status ?? 500).json({ error: e.message }),
  );
  const server = await new Promise<any>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const root = `http://127.0.0.1:${server.address().port}/care/${j.s.invitations[0].id}/work`;
  const result = await fetch(root + "/export-to-customs");
  assert.equal(result.status, 200);
  assert.equal((await result.json()).status, "DRAFT_FOR_BROKER_REVIEW");
  assert.equal((await fetch(root + "/shipping-label.pdf")).status, 409);
  actor = { ...actor, id: "another-artist" };
  assert.equal((await fetch(root + "/export-to-customs")).status, 404);
  actor = { ...actor, role: "Finance" };
  assert.equal(
    (await fetch(root + "/export-to-customs?role=Director")).status,
    403,
  );
});

test("unchanged freight saves preserve the checkpoint; next steps identify responsibility", async () => {
  const j = await freightJourney();
  await j.act("Artist_Portal", "SAVE_FREIGHT", { freight }, "work");
  const before = j.s.invitations[0].works[0].freightRevision;
  await j.act("Artist_Portal", "SAVE_FREIGHT", { freight }, "work");
  const w = j.s.invitations[0].works[0];
  assert.equal(w.freightRevision, before);
  assert.equal(careNextStep(j.s, w).owner, "Artist / Logistics");
  assert.match(returnReadiness(j.s, w)!, /arrival/);
  w.state = "SUBMITTED";
  w.committeeReviewed = false;
  assert.equal(careNextStep(j.s, w).owner, "Committee");
  w.committeeReviewed = true;
  assert.equal(careNextStep(j.s, w).owner, "Director");
  w.state = "RETURNED";
  assert.equal(careNextStep(j.s, w).owner, "Artist");
});

async function damagedTransitJourney() {
  const j = await freightJourney();
  await j.act("Artist_Portal", "SAVE_FREIGHT", { freight }, "work");
  await j.act(
    "Artist_Portal",
    "PRE_DISPATCH_CONDITION",
    {
      photos: [image],
      note: "Structural weakness observed before studio packing.",
      acknowledged: true,
      damage: true,
    },
    "work",
  );
  return j;
}
test("pre-transit hold blocks customs, labels and freight grouping without a resolution", async () => {
  const j = await damagedTransitJourney(),
    w = () => j.s.invitations[0].works[0];
  assert.match(preTransitHold(w())!, /triage/);
  assert.throws(() => customsExport(j.s.invitations[0], w()), /hold/);
  await assert.rejects(() => artistShippingPdf(w()), /hold/);
  await assert.rejects(
    () =>
      j.act(
        "Artist_Portal",
        "TRANSIT_RESOLUTION",
        { path: "AS_IS", note: "Approve my own damaged artwork." },
        "work",
      ),
    /another desk/,
  );
  await j.act(
    "Artist_Portal",
    "SAVE_FREIGHT",
    { freight: { ...freight, packageCount: 2 } },
    "work",
  );
  await j.act(
    "Artist_Portal",
    "PRE_DISPATCH_CONDITION",
    {
      photos: [image],
      note: "New packing does not erase the previous damage.",
      acknowledged: true,
      damage: false,
    },
    "work",
  );
  assert.match(preTransitHold(w())!, /triage/);
});
test("repair needs new evidence and explicit Coordinator release; original evidence survives", async () => {
  const j = await damagedTransitJourney(),
    w = () => j.s.invitations[0].works[0];
  const original = structuredClone(w().conditionHistory![0]);
  await j.act(
    "General_Exhibition_Coordinator",
    "TRANSIT_RESOLUTION",
    {
      path: "REPAIR",
      note: "Studio repair authorized after specialist review.",
    },
    "work",
  );
  await assert.rejects(
    () =>
      j.act(
        "General_Exhibition_Coordinator",
        "TRANSIT_RESOLUTION",
        {
          path: "RELEASE_REPAIR",
          note: "Cannot release without updated evidence.",
        },
        "work",
      ),
    /new damage-free/,
  );
  await j.act(
    "Artist_Portal",
    "PRE_DISPATCH_CONDITION",
    {
      photos: [{ ...image, id: "repair-photo", hash: "b".repeat(64) }],
      note: "Studio repair completed and condition rechecked.",
      acknowledged: true,
      damage: false,
    },
    "work",
  );
  assert.match(preTransitHold(w())!, /Coordinator review/);
  await j.act(
    "General_Exhibition_Coordinator",
    "TRANSIT_RESOLUTION",
    {
      path: "RELEASE_REPAIR",
      note: "Reviewed new photographs and specialist assessment.",
    },
    "work",
  );
  assert.equal(preTransitHold(w()), null);
  assert.equal(shippingReadiness(w()), null);
  assert.deepEqual(w().conditionHistory![0], original);
  assert.equal(latestPreDispatch(w())!.previousHash, original.hash);
});
test("as-is acceptance needs reference and separate packing confirmation; cancellation persists", async () => {
  const j = await damagedTransitJourney(),
    w = () => j.s.invitations[0].works[0];
  await assert.rejects(
    () =>
      j.act(
        "General_Exhibition_Coordinator",
        "TRANSIT_RESOLUTION",
        { path: "AS_IS", note: "Minor damage acceptable for the display." },
        "work",
      ),
    /insurance/,
  );
  await j.act(
    "General_Exhibition_Coordinator",
    "TRANSIT_RESOLUTION",
    {
      path: "AS_IS",
      note: "Minor frame scratch reviewed by specialist.",
      insuranceReference: "SYNTHETIC-REVIEW-001",
      packing: "Use reviewed cavity supports away from the weak edge.",
    },
    "work",
  );
  assert.match(preTransitHold(w())!, /Logistics/);
  await assert.rejects(
    () =>
      j.act(
        "General_Exhibition_Coordinator",
        "CONFIRM_TRANSIT_PACKING",
        { confirmed: true, note: "Cannot confirm my own packing instruction." },
        "work",
      ),
    /another desk/,
  );
  await j.act(
    "Logistics_Officer",
    "CONFIRM_TRANSIT_PACKING",
    {
      confirmed: true,
      note: "Cavity supports installed per reviewed packing plan.",
    },
    "work",
  );
  assert.equal(shippingReadiness(w()), null);
  assert.equal(
    customsExport(j.s.invitations[0], w()).status,
    "DRAFT_FOR_BROKER_REVIEW",
  );
  await j.act(
    "Artist_Portal",
    "SAVE_FREIGHT",
    { freight: { ...freight, packageCount: 2 } },
    "work",
  );
  assert.match(preTransitHold(w())!, /triage/);
  await j.act(
    "Artist_Portal",
    "PRE_DISPATCH_CONDITION",
    {
      photos: [image],
      note: "Updated packing report still records the frame scratch.",
      acknowledged: true,
      damage: true,
    },
    "work",
  );
  await j.act(
    "General_Exhibition_Coordinator",
    "TRANSIT_RESOLUTION",
    {
      path: "CANCEL",
      note: "Cancel this shipment and request a separate substitute proposal.",
    },
    "work",
  );
  assert.match(preTransitHold(w())!, /cancelled/);
  await assert.rejects(
    () =>
      j.act(
        "Artist_Portal",
        "PRE_DISPATCH_CONDITION",
        {
          photos: [image],
          note: "Attempt to bypass shipment cancellation.",
          acknowledged: true,
          damage: false,
        },
        "work",
      ),
    /cancelled/,
  );
});
