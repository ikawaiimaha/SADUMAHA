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
    /exhibition closure/,
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
