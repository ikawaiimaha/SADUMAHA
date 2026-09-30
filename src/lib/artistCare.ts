import { arrivalPolicy, checkArrivalLocation } from "../logistics/geofence.mjs";
import type { Ledger, LedgerActor } from "./spatialLedger";

export type MediaRef = {
  id: string;
  name: string;
  type: string;
  bytes: number;
  hash: string;
  width?: number;
  height?: number;
  duration?: number;
};
export type Route = "EXISTING" | "COMMISSION";
export type Work = {
  id: string;
  title: string;
  route: Route;
  width: number;
  height: number;
  depth: number;
  weight: number;
  year: number;
  rationale: string;
  packing: string;
  insuranceMinor: number;
  budget: { label: string; minor: number }[];
  media: Record<string, MediaRef>;
  maintenance: string;
  intervalDays: number;
  consent: string[];
  state: "SUBMITTED" | "APPROVED" | "RETURNED";
  committeeReviewed?: boolean;
  revision: number;
  feedback?: string;
  previous?: Work[];
  milestones: {
    id: string;
    label: string;
    minor: number;
    proof?: MediaRef;
    verified?: boolean;
    paid?: boolean;
  }[];
  condition?: {
    id: string;
    damage: boolean;
    note: string;
    photo: MediaRef;
    protocol?: string;
    approvedProtocol?: string;
    repaired?: boolean;
  };
  nextMaintenance?: string;
  maintenanceLog: { at: string; note: string }[];
  returnAt?: string;
  legacy: { id: string; kind: string; file: MediaRef; cleared: boolean }[];
};
export type CareInvitation = {
  id: string;
  artistId: string;
  name: string;
  coordinatorId: string;
  templateHash: string;
  en: string;
  ar: string;
  venue: string;
  rosterId: string;
  welcome: string;
  state: "PREPARED" | "DISPATCHED" | "ACCEPTED";
  tokenHash?: string;
  expiresAt?: string;
  artistActorId: string;
  works: Work[];
};
export type ArtistCare = {
  format: 1;
  version: number;
  settings?: {
    theme: string;
    deadline: string;
    closesAt: string;
    commissionAllowed: boolean;
  };
  template?: {
    en: string;
    ar: string;
    version: number;
    reviews: string[];
    policyReference?: string;
    hash?: string;
  };
  templateHistory: NonNullable<ArtistCare["template"]>[];
  invitations: CareInvitation[];
  audit: { actor: string; action: string; target: string; at: string }[];
};
export const emptyArtistCare = (): ArtistCare => ({
  format: 1,
  version: 0,
  templateHistory: [],
  invitations: [],
  audit: [],
});
export type CareCommand = {
  action: string;
  expected: number;
  invitationId?: string;
  workId?: string;
  data?: any;
};
export async function digest(value: string | ArrayBuffer) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
  )
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
const reject = (message: string, status = 409): never => {
  throw Object.assign(new Error(message), { status });
};
const text = (x: unknown, min = 1): x is string =>
  typeof x === "string" && x.trim().length >= min && x.length <= 6000;
const positive = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x) && x > 0;
const money = (x: unknown): x is number =>
  Number.isSafeInteger(x) && Number(x) > 0;
function media(x: MediaRef | undefined, image = false) {
  return (
    x &&
    text(x.id) &&
    /^[a-f0-9]{64}$/.test(x.hash) &&
    positive(x.bytes) &&
    x.bytes <= 20 * 1024 * 1024 &&
    (!image ||
      (["image/jpeg", "image/png", "image/webp"].includes(x.type) &&
        positive(x.width) &&
        positive(x.height)))
  );
}
const total = (w: Work) => w.budget.reduce((n, x) => n + x.minor, 0);
export function legacyAvailable(s: ArtistCare, w: Work, now = Date.now()) {
  return (
    !!s.settings &&
    !!w.returnAt &&
    now >= Date.parse(s.settings.closesAt) + 48 * 3600000 &&
    now >= Date.parse(w.returnAt)
  );
}
function currentRoster(ledger: Ledger, i: CareInvitation) {
  return (
    ledger.curation?.phase === "ENDORSED" &&
    ledger.curation.snapshots.at(-1)?.id === i.rosterId &&
    ledger.artworks.some((a) => a.id === i.artistId && a.state === "APPROVED")
  );
}
export async function prepareInvitations(
  source: ArtistCare,
  ledger: Ledger,
): Promise<ArtistCare> {
  const s = structuredClone(source),
    t = s.template,
    settings = s.settings,
    b = ledger.curation;
  if (!t?.hash || !settings || b?.phase !== "ENDORSED") return s;
  const snapshot = b.snapshots.at(-1)!;
  for (const row of snapshot.rows) {
    // Restricted benchmarks remain on the Coordinator's desk, not the research stream.
    if (
      s.invitations.some(
        (i) =>
          i.artistId === row.revision.artistId && i.rosterId === snapshot.id,
      )
    )
      continue;
    const artist = ledger.artworks.find((a) => a.id === row.revision.artistId)!;
    const venue = ledger.galleries.find(
      (g) => g.id === row.slot.galleryId,
    )!.name;
    const fill = (body: string) =>
      body
        .replaceAll("[Artist_Name]", artist.name)
        .replaceAll("[Exhibition_Theme]", settings.theme)
        .replaceAll("[Assigned_Venue]", venue)
        .replaceAll("[Logistics_Deadlines]", settings.deadline);
    s.invitations.push({
      id: crypto.randomUUID(),
      artistId: artist.id,
      name: artist.name,
      coordinatorId: row.slot.assignedTo,
      templateHash: t.hash,
      en: fill(t.en),
      ar: fill(t.ar),
      venue,
      rosterId: snapshot.id,
      welcome: "",
      state: "PREPARED",
      artistActorId: `artist:${artist.id}`,
      works: [],
    });
  }
  return s;
}
export function projectArtistCare(
  source: ArtistCare,
  actor: LedgerActor,
  ledger: Ledger,
): ArtistCare {
  const s = structuredClone(source);
  const restricted = new Set(
    ledger.curation?.benchmarks?.map((x) => x.id) ?? [],
  );
  const manager = ["Director", "General_Exhibition_Coordinator"].includes(
    actor.role,
  );
  s.invitations = s.invitations
    .filter(
      (i) =>
        !restricted.has(i.artistId) ||
        manager ||
        (["Artist", "Artist_Portal"].includes(actor.role) &&
          i.artistActorId === actor.id) ||
        (actor.role === "Committee" && ledger.curation?.phase === "ENDORSED"),
    )
    .filter(
      (i) =>
        manager ||
        (["Artist", "Artist_Portal"].includes(actor.role)
          ? i.artistActorId === actor.id
          : actor.role === "Exhibition_Coordinator"
            ? i.coordinatorId === actor.id
            : [
                "Technical",
                "Logistics",
                "Logistics_Officer",
                "Finance",
                "Editorial",
                "Committee",
              ].includes(actor.role)),
    );
  for (const i of s.invitations) {
    delete i.tokenHash;
    if (["Artist", "Artist_Portal"].includes(actor.role))
      for (const w of i.works)
        w.legacy = w.legacy.filter((a) => a.cleared && legacyAvailable(s, w));
  }
  if (!manager) s.audit = [];
  return s;
}
export async function applyArtistCare(
  source: ArtistCare,
  actor: LedgerActor,
  c: CareCommand,
  ledger: Ledger,
  now = new Date().toISOString(),
): Promise<{ state: ArtistCare; token?: string }> {
  if (actor.exhibitionId !== ledger.exhibitionId)
    reject("Edition access denied.", 403);
  if (source.version !== c.expected)
    reject("The artist journey changed. Refresh before retrying.");
  let s = structuredClone(source);
  const d = c.data ?? {};
  let token: string | undefined;
  const role = (...roles: string[]) => {
    if (!roles.includes(actor.role))
      reject("This action belongs to another desk.", 403);
  };
  const i = s.invitations.find((x) => x.id === c.invitationId);
  const w = i?.works.find((x) => x.id === c.workId);
  const own = () => {
    role("Artist", "Artist_Portal");
    if (!i || i.artistActorId !== actor.id)
      reject("This invitation belongs to another artist.", 403);
  };
  const desk = () => {
    role("Exhibition_Coordinator", "General_Exhibition_Coordinator");
    if (
      !i ||
      (actor.role === "Exhibition_Coordinator" && i.coordinatorId !== actor.id)
    )
      reject("This dossier is assigned to another coordinator.", 403);
  };
  if (
    i &&
    ledger.curation?.benchmarks?.some((b) => b.id === i.artistId) &&
    !["Director", "General_Exhibition_Coordinator"].includes(actor.role) &&
    !(
      ["Artist", "Artist_Portal"].includes(actor.role) &&
      i.artistActorId === actor.id
    ) &&
    !(actor.role === "Committee" && ledger.curation?.phase === "ENDORSED")
  )
    reject("This dossier is restricted.", 403);
  switch (c.action) {
    case "SET_BRIEF":
      role("General_Exhibition_Coordinator");
      if (s.invitations.length)
        reject(
          "Issued brief snapshots are locked. Start a new edition to change dates.",
        );
      if (
        !text(d.theme) ||
        !Number.isFinite(Date.parse(d.deadline)) ||
        !Number.isFinite(Date.parse(d.closesAt)) ||
        Date.parse(d.deadline) >= Date.parse(d.closesAt)
      )
        reject(
          "Provide a theme, submission deadline and later exhibition close.",
          422,
        );
      s.settings = {
        theme: d.theme,
        deadline: d.deadline,
        closesAt: d.closesAt,
        commissionAllowed: d.commissionAllowed === true,
      };
      break;
    case "DRAFT_TEMPLATE":
      role("Editorial");
      if (!text(d.en, 20) || !text(d.ar, 20) || !/[\u0600-\u06ff]/.test(d.ar))
        reject("Both English and Arabic master texts are required.", 422);
      for (const key of [
        "[Artist_Name]",
        "[Exhibition_Theme]",
        "[Assigned_Venue]",
        "[Logistics_Deadlines]",
      ])
        if (!d.en.includes(key) || !d.ar.includes(key))
          reject(`Both templates need ${key}.`, 422);
      if (s.template) s.templateHistory.push(s.template);
      s.template = {
        en: d.en,
        ar: d.ar,
        version: (s.template?.version ?? 0) + 1,
        reviews: ["Editorial"],
      };
      break;
    case "REVIEW_TEMPLATE":
      role("Finance");
      if (!s.template || s.template.hash)
        reject("Review an unlocked template first.");
      if (!text(d.note, 10)) reject("Record the policy-review reference.", 422);
      s.template.policyReference = d.note.trim();
      if (!s.template.reviews.includes("Finance"))
        s.template.reviews.push("Finance");
      break;
    case "LOCK_TEMPLATE":
      role("Director");
      if (!s.template || !s.template.reviews.includes("Finance"))
        reject("Editorial and Finance/policy review are required.");
      if (s.template.hash) reject("This template is already locked.");
      s.template.hash = await digest(JSON.stringify(s.template));
      break;
    case "PREPARE":
      role("Director", "General_Exhibition_Coordinator");
      if (
        !s.template?.hash ||
        !s.settings ||
        ledger.curation?.phase !== "ENDORSED"
      )
        reject(
          "Lock a bilingual template, configure the brief and endorse the roster first.",
        );
      break;
    case "WELCOME":
      desk();
      if (i!.state !== "PREPARED" || !text(d.note))
        reject("Add a welcome note to a prepared invitation.");
      i!.welcome = d.note.trim();
      break;
    case "DISPATCH":
      desk();
      if (i!.state !== "PREPARED" || !currentRoster(ledger, i!))
        reject(
          "Dispatch requires a prepared invitation on the current endorsed roster.",
        );
      if (!text(i!.welcome)) reject("Add the curatorial welcome note first.");
      token = crypto.randomUUID() + crypto.randomUUID();
      i!.tokenHash = await digest(token);
      i!.expiresAt = new Date(Date.parse(now) + 7 * 86400000).toISOString();
      i!.state = "DISPATCHED";
      break;
    case "ACCEPT":
      own();
      if (
        i!.state !== "DISPATCHED" ||
        !i!.tokenHash ||
        !text(d.token) ||
        (await digest(d.token)) !== i!.tokenHash ||
        Date.parse(now) >= Date.parse(i!.expiresAt!)
      )
        reject("This invitation link is invalid, expired or already used.");
      if (!currentRoster(ledger, i!))
        reject(
          "The roster changed; ask the Coordinator to reissue the invitation.",
        );
      i!.state = "ACCEPTED";
      delete i!.tokenHash;
      break;
    case "SUBMIT_WORK": {
      own();
      if (
        i!.state !== "ACCEPTED" ||
        !currentRoster(ledger, i!) ||
        !s.settings ||
        Date.parse(now) >= Date.parse(s.settings.deadline)
      )
        reject("Submission is not open for this invitation.");
      const x = d.work as Work;
      if (
        !x ||
        !text(x.id) ||
        !text(x.title) ||
        !["EXISTING", "COMMISSION"].includes(x.route) ||
        !positive(x.width) ||
        !positive(x.height) ||
        !positive(x.depth) ||
        !text(x.rationale, 20) ||
        !text(x.maintenance, 10) ||
        !positive(x.intervalDays) ||
        x.intervalDays > 365
      )
        reject(
          "Complete title, dimensions, rationale and maintenance instructions.",
          422,
        );
      if (
        !Array.isArray(x.consent) ||
        !["proposal-review", "alterations"].every((k) => x.consent.includes(k))
      )
        reject(
          "Acknowledge proposal review and the separate alteration-approval process.",
          422,
        );
      if (x.route === "COMMISSION") {
        if (!s.settings.commissionAllowed)
          reject("This edition is not accepting commission proposals.");
        if (
          !Array.isArray(x.budget) ||
          !x.budget.length ||
          x.budget.some((b) => !text(b.label) || !money(b.minor)) ||
          !["sketch", "material", "mockup"].every((k) =>
            media(x.media?.[k], true),
          )
        )
          reject(
            "Provide the blueprint images and an itemized positive production budget.",
            422,
          );
      } else if (
        !positive(x.weight) ||
        !Number.isInteger(x.year) ||
        x.year < 1000 ||
        x.year > new Date(now).getUTCFullYear() ||
        !text(x.packing, 10) ||
        !money(x.insuranceMinor) ||
        !["master", "angle", "texture"].every((k) =>
          media(x.media?.[k], true),
        ) ||
        Math.max(x.media.master.width ?? 0, x.media.master.height ?? 0) < 2000
      )
        reject(
          "Provide all three photographs, a master image at least 2000 pixels on its long edge, weight, year, packing and insurance value.",
          422,
        );
      if (
        x.media.voice &&
        (!media(x.media.voice) ||
          !x.media.voice.type.startsWith("audio/") ||
          !positive(x.media.voice.duration) ||
          x.media.voice.duration > 60)
      )
        reject(
          "Studio Voice must be an audio recording of at most 60 seconds.",
          422,
        );
      const old = i!.works.find((a) => a.id === x.id);
      if (old && (old.state !== "RETURNED" || d.revision !== old.revision))
        reject("Only a returned current revision may be resubmitted.");
      const clean: Work = {
        id: x.id,
        title: x.title,
        route: x.route,
        width: x.width,
        height: x.height,
        depth: x.depth,
        weight: x.weight,
        year: x.year,
        rationale: x.rationale,
        packing: x.packing,
        insuranceMinor: x.insuranceMinor,
        budget: x.route === "COMMISSION" ? x.budget : [],
        media: x.media,
        maintenance: x.maintenance,
        intervalDays: x.intervalDays,
        consent: [...x.consent],
        revision: (old?.revision ?? 0) + 1,
        state: "SUBMITTED",
        previous: old
          ? [...(old.previous ?? []), { ...old, previous: undefined }]
          : [],
        milestones: [],
        maintenanceLog: [],
        legacy: [],
      };
      if (old) i!.works[i!.works.indexOf(old)] = clean;
      else i!.works.push(clean);
      break;
    }
    case "RETURN_WORK":
      desk();
      if (!w || w.state !== "SUBMITTED" || !text(d.note, 10))
        reject("Return a submitted work with specific revision notes.");
      w.state = "RETURNED";
      w.feedback = d.note;
      break;
    case "RECOMMEND_WORK":
      role("Committee");
      if (!w || w.state !== "SUBMITTED" || !currentRoster(ledger, i!))
        reject("Review a submitted work on the current roster.");
      w.committeeReviewed = true;
      break;
    case "APPROVE_WORK": {
      role("Director");
      if (!w || w.state !== "SUBMITTED" || !currentRoster(ledger, i!))
        reject("Review a submitted work on the current roster.");
      if (!w.committeeReviewed)
        reject("Committee review of this artwork revision is required.");
      const row = ledger
        .curation!.snapshots.at(-1)!
        .rows.find((r) => r.revision.artistId === i!.artistId)!;
      const already = i!.works
        .filter((a) => a.state === "APPROVED")
        .reduce((n, a) => n + (a.route === "COMMISSION" ? total(a) : 0), 0);
      if (w.route === "COMMISSION" && already + total(w) > row.slot.budgetMinor)
        reject(
          "Commission totals exceed this artist’s reserved budget. Revise the proposal or reauthorize the spatial budget.",
        );
      if (
        i!.works
          .filter((a) => a.state === "APPROVED")
          .reduce((n, a) => n + (a.width * a.height) / 10000, 0) +
          (w.width * w.height) / 10000 >
        row.slot.areaM2
      )
        reject(
          "Combined bounding areas exceed the reserved footprint. Technical review is still required.",
        );
      w.state = "APPROVED";
      break;
    }
    case "MILESTONES":
      own();
      if (
        !w ||
        w.route !== "COMMISSION" ||
        w.state !== "APPROVED" ||
        w.milestones.some((m) => m.verified || m.paid)
      )
        reject("An approved commission with no verified payments is required.");
      if (
        !Array.isArray(d.rows) ||
        d.rows.length < 3 ||
        d.rows.length > 4 ||
        d.rows.some((r: any) => !text(r.label) || !money(r.minor)) ||
        d.rows.reduce((n: number, r: any) => n + r.minor, 0) !== total(w)
      )
        reject(
          "Define 3–4 milestones whose amounts exactly equal the approved budget.",
        );
      w.milestones = d.rows.map((r: any) => ({
        id: crypto.randomUUID(),
        label: r.label,
        minor: r.minor,
      }));
      break;
    case "MILESTONE_PROOF":
      own();
      {
        const m = w?.milestones.find((m) => m.id === d.id);
        if (!m || m.verified || !media(d.file, true))
          reject("Upload an image for an unverified milestone.");
        m.proof = d.file;
      }
      break;
    case "VERIFY_PROGRESS":
      role("General_Exhibition_Coordinator");
      {
        const m = w?.milestones.find((m) => m.id === d.id);
        if (!m?.proof || m.verified)
          reject("An unverified milestone needs studio evidence.");
        m.verified = true;
      }
      break;
    case "RECORD_PAYMENT":
      role("Finance");
      {
        const m = w?.milestones.find((m) => m.id === d.id),
          a = ledger.artworks.find((a) => a.id === i?.artistId);
        if (
          !m?.verified ||
          m.paid ||
          !a ||
          a.state !== "APPROVED" ||
          a.technicalVersion !== a.assignmentVersion ||
          a.authorizedVersion !== a.assignmentVersion ||
          !a.contractMinor ||
          a.contractMinor < total(w!) ||
          a.paidMinor +
            s.invitations
              .filter((x) => x.artistId === i?.artistId)
              .flatMap((x) => x.works)
              .flatMap((x) => x.milestones)
              .filter((x) => x.paid)
              .reduce((n, x) => n + x.minor, 0) +
            m.minor >
            a.contractMinor
        )
          reject(
            "Finance requires verified progress, an active allocation and current Technical/contract authorization.",
          );
        m.paid = true;
      }
      break;
    case "RECEIVE":
      role("Logistics", "Logistics_Officer");
      if (!i || !currentRoster(ledger, i))
        reject(
          "Receipt requires the current endorsed roster and an active location.",
        );
      {
        const location = checkArrivalLocation(
          arrivalPolicy(),
          d.location,
          Date.parse(now),
        );
        if (!location.allowed) reject(location.reason);
      }
      if (
        !w ||
        w.state !== "APPROVED" ||
        w.condition ||
        !media(d.file, true) ||
        !text(d.note, 10)
      )
        reject(
          "Record a photographed condition report for an approved, unreceived work.",
        );
      w.condition = {
        id: crypto.randomUUID(),
        damage: d.damage === true,
        note: d.note,
        photo: d.file,
      };
      break;
    case "REPAIR_PLAN":
      role("Technical");
      if (
        !w?.condition?.damage ||
        w.condition.repaired ||
        !text(d.protocol, 10)
      )
        reject("A damaged work and specific repair protocol are required.");
      w.condition.protocol = d.protocol;
      delete w.condition.approvedProtocol;
      break;
    case "APPROVE_REPAIR":
      own();
      if (!w?.condition?.protocol || w.condition.repaired)
        reject("Read the proposed repair protocol first.");
      w.condition.approvedProtocol = w.condition.protocol;
      break;
    case "COMPLETE_REPAIR":
      role("Technical");
      if (
        !w?.condition?.protocol ||
        w.condition.approvedProtocol !== w.condition.protocol ||
        w.condition.repaired
      )
        reject("The artist must approve this exact repair protocol first.");
      w.condition.repaired = true;
      break;
    case "INSTALL":
      role("Technical");
      if (
        !w?.condition ||
        w.nextMaintenance ||
        w.returnAt ||
        (w.condition.damage && !w.condition.repaired)
      )
        reject("Receipt and any artist-authorized repair must be complete.");
      w.nextMaintenance = new Date(
        Date.parse(now) + w.intervalDays * 86400000,
      ).toISOString();
      break;
    case "MAINTAIN":
      role("Technical");
      if (
        !w?.nextMaintenance ||
        w.returnAt ||
        Date.parse(now) < Date.parse(w.nextMaintenance) ||
        !text(d.note, 5)
      )
        reject("A due maintenance task and completion note are required.");
      w.maintenanceLog.push({ at: now, note: d.note });
      w.nextMaintenance = new Date(
        Date.parse(now) + w.intervalDays * 86400000,
      ).toISOString();
      break;
    case "RETURN_TRANSIT":
      role("Logistics", "Logistics_Officer");
      if (
        !w?.condition ||
        w.returnAt ||
        !s.settings ||
        Date.parse(now) < Date.parse(s.settings.closesAt) ||
        (w.condition.damage && !w.condition.repaired)
      )
        reject(
          "Return transit requires exhibition closure and resolved condition issues.",
        );
      w.returnAt = now;
      break;
    case "LEGACY_ASSET":
      role("Editorial");
      if (
        !w ||
        !media(d.file) ||
        ![
          "Installation photograph",
          "Bilingual catalogue",
          "Participation record",
        ].includes(d.kind)
      )
        reject("Choose a supported legacy asset and upload its file.");
      w.legacy.push({
        id: crypto.randomUUID(),
        kind: d.kind,
        file: d.file,
        cleared: false,
      });
      break;
    case "CLEAR_LEGACY":
      role("Director");
      {
        const asset = w?.legacy.find((a) => a.id === d.id);
        if (!asset || asset.cleared)
          reject("Select an uncleared institutional asset.");
        asset.cleared = true;
      }
      break;
    default:
      reject("Unknown artist-care action.", 422);
  }
  s = await prepareInvitations(s, ledger);
  s.version++;
  s.audit.push({
    actor: actor.id,
    action: c.action,
    target: w?.id ?? i?.id ?? ledger.exhibitionId,
    at: now,
  });
  return { state: s, token };
}
