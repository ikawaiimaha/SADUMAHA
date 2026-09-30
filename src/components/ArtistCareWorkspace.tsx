import { consolidationCandidates } from "../lib/artistFreight";
import type { ThemeState } from "../lib/themeWorkflow";
import { useEffect, useRef, useState } from "react";
import { useSandbox } from "./SandboxProvider";
import {
  applyArtistCare,
  approvedTheme,
  emptyArtistCare,
  prepareInvitations,
  projectArtistCare,
  type ArtistCare,
  type CareCommand,
  type Work,
} from "../lib/artistCare";
import type { Ledger } from "../lib/spatialLedger";
import ArtistSubmission, {
  careCard,
  careInput,
  careButton,
} from "./ArtistSubmission";
import ArtistCareWork from "./ArtistCareWork";
const KEY = "sadu-artist-care-v1";
const DEFAULT_EN =
  "Dear [Artist_Name], you are invited to propose work for [Exhibition_Theme] at [Assigned_Venue]. Please submit by [Logistics_Deadlines]. Existing artworks and, where enabled in the edition brief, new commission proposals are welcome. Participation, funding, insurance, transport and travel remain subject to the approved agreement.";
const DEFAULT_AR =
  "السيد/السيدة [Artist_Name]، ندعوكم لتقديم مقترح للمشاركة في [Exhibition_Theme] في [Assigned_Venue] قبل [Logistics_Deadlines]. نرحب بالأعمال القائمة ومقترحات التكليف الجديدة إذا سمحت خطة الدورة بذلك. تخضع المشاركة والتمويل والتأمين والنقل والسفر للاتفاقية المعتمدة.";
const briefing = [
  [
    "Funding",
    "Commission proposals need an approved itemized budget and agreed milestones. Progress verification sends a task to Finance; it does not release funds.",
  ],
  [
    "Shipping & insurance",
    "Coverage, crating, customs responsibilities, valuation evidence and return windows must be specified in the approved agreement. No automatic tax exemption or full insurance coverage is promised.",
  ],
  [
    "Travel & visas",
    "Flights, accommodation, assistant support and visa arrangements require written confirmation from Protocol. Artwork participation and travel permission are separate decisions.",
  ],
  [
    "Materials & power",
    "Declare unusual materials, electrical loads, equipment and installation requirements. Technical and Logistics must confirm venue compatibility and import requirements before shipment.",
  ],
  [
    "Publication & rights",
    "Catalogue dates, proof-review windows, courtesy credits and image-use rights need edition-specific approval. The Legacy Vault releases only institutionally cleared assets.",
  ],
  [
    "Changes & consent",
    "An acknowledgement is not a legal signature. Repairs require approval of the exact protocol. Revised repair instructions invalidate earlier approval.",
  ],
];
export default function ArtistCareWorkspace({
  ledger,
  theme: approvedThemeState,
}: {
  ledger: Ledger;
  theme?: ThemeState;
}) {
  const { role } = useSandbox();
  const briefingDialog = useRef<HTMLDialogElement>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [initial] = useState(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return { state: emptyArtistCare(), error: "" };
      const state = JSON.parse(raw);
      if (
        state.format !== 1 ||
        !Array.isArray(state.invitations) ||
        !Array.isArray(state.audit) ||
        !Number.isInteger(state.version)
      )
        throw new Error();
      return { state: state as ArtistCare, error: "" };
    } catch {
      return {
        state: emptyArtistCare(),
        error:
          "Saved artist-care data could not be read. Actions are locked to preserve it.",
      };
    }
  });
  const [state, setState] = useState(initial.state),
    latest = useRef(initial.state),
    busyRef = useRef(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(initial.error),
    [message, setMessage] = useState("");
  const [selected, setSelected] = useState(""),
    [account, setAccount] = useState(ledger.staff[0]?.id ?? ""),
    [token, setToken] = useState(""),
    [dispatchToken, setDispatchToken] = useState(""),
    [welcome, setWelcome] = useState(""),
    [adding, setAdding] = useState(false),
    [revision, setRevision] = useState<Work>(),
    [search, setSearch] = useState("");
  const [theme, setTheme] = useState(state.settings?.theme ?? ""),
    [deadline, setDeadline] = useState(state.settings?.deadline ?? ""),
    [close, setClose] = useState(state.settings?.closesAt ?? ""),
    [commissions, setCommissions] = useState(
      state.settings?.commissionAllowed ?? false,
    ),
    [en, setEn] = useState(state.template?.en ?? DEFAULT_EN),
    [ar, setAr] = useState(state.template?.ar ?? DEFAULT_AR),
    [reference, setReference] = useState("");
  const [lineageBand, setLineageBand] = useState("all");
  const [anchorQuery, setAnchorQuery] = useState("");
  const artist = ["Artist_Portal", "Artist"].includes(role),
    restricted = new Set(ledger.curation?.benchmarks?.map((x) => x.id) ?? []);
  const available = state.invitations
    .filter(
      (i) =>
        !restricted.has(i.artistId) ||
        artist ||
        (role === "Committee" && ledger.curation?.phase === "ENDORSED") ||
        ["Director", "General_Exhibition_Coordinator"].includes(role),
    )
    .filter(
      (i) => role !== "Exhibition_Coordinator" || i.coordinatorId === account,
    );
  const chosen = available.find((i) => i.id === selected) ?? available[0];
  useEffect(() => {
    if (chosen && chosen.id !== selected) setSelected(chosen.id);
  }, [chosen?.id, selected]);
  const actor = {
    id: artist
      ? (chosen?.artistActorId ?? "unassigned-artist")
      : role === "Exhibition_Coordinator"
        ? account
        : `sandbox-${role}`,
    role,
    exhibitionId: ledger.exhibitionId,
  };
  const visible = projectArtistCare(state, actor, ledger),
    invitation = visible.invitations.find((i) => i.id === chosen?.id);
  const persist = (next: ArtistCare) => {
    sessionStorage.setItem(KEY, JSON.stringify(next));
    latest.current = next;
    setState(next);
  };
  // Prepare immutable invitation snapshots automatically when both the roster and template are ready.
  useEffect(() => {
    let cancelled = false;
    if (initial.error || busyRef.current) return;
    const before = latest.current;
    void prepareInvitations(before, ledger).then((next) => {
      if (cancelled || busyRef.current || latest.current !== before) return;
      if (next.invitations.length !== before.invitations.length) {
        next.version++;
        try {
          persist(next);
        } catch {
          setError(
            "The browser could not save generated invitations. Use Prepare invitations to retry.",
          );
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ledger.version, state.template?.hash, state.settings, initial.error]);
  const run = async (command: Omit<CareCommand, "expected">) => {
    if (initial.error || busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await applyArtistCare(
        latest.current,
        actor,
        {
          ...command,
          invitationId: command.invitationId ?? invitation?.id,
          expected: latest.current.version,
        },
        ledger,
        undefined,
        approvedThemeState,
      );
      persist(result.state);
      if (result.token) setDispatchToken(result.token);
      setMessage(
        command.action === "DISPATCH"
          ? "Invitation staged in the local outbox. No email was sent."
          : "Saved to this local journey.",
      );
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  useEffect(() => {
    setLineageBand("all");
    setAnchorQuery("");
    setAdding(false);
    setRevision(undefined);
    setError(initial.error);
    setMessage("");
  }, [selected, role, initial.error]);
  const freightGroups = consolidationCandidates(visible);
  const filteredWorks = invitation
    ? invitation.works.filter(
        (w) =>
          artist ||
          ((lineageBand === "all" ||
            (w.craft &&
              (lineageBand === "classical"
                ? w.craft.lineage <= 30
                : lineageBand === "middle"
                  ? w.craft.lineage > 30 && w.craft.lineage < 70
                  : w.craft.lineage >= 70))) &&
            (!anchorQuery.trim() ||
              w.craft?.anchors.some((a) =>
                a
                  .toLocaleLowerCase()
                  .includes(anchorQuery.trim().toLocaleLowerCase()),
              ))),
      )
    : [];
  return (
    <section aria-label="Invitations and artist care" className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-widest text-[#8B261E]">
          Phase 3 · Invitation to legacy
        </p>
        <h1 className="mt-2 text-3xl font-serif">
          {artist ? "Your artist workspace" : "Invitations & artist care"}
        </h1>
        <p className="mt-2 text-sm text-[#655D50]">
          One brief, individual artwork records, and a traceable handoff at
          every stage. Local simulation; messages, signatures and payments
          remain paused.
        </p>
      </header>
      {error && (
        <p role="alert" className="text-sm text-[#8B261E]">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {state.settings && (
        <p className="border-s-2 border-[#8B261E] ps-4 text-sm">
          {Date.parse(state.settings.deadline) > now
            ? `${Math.ceil((Date.parse(state.settings.deadline) - now) / 3600000)} hours until submission closes`
            : "Submission deadline passed · new uploads are locked"}
        </p>
      )}
      {[
        "General_Exhibition_Coordinator",
        "Logistics",
        "Logistics_Officer",
      ].includes(role) && (
        <details className="border-y border-[#DED5C4] py-4">
          <summary className="cursor-pointer font-medium">
            Freight consolidation candidates
          </summary>
          <p className="text-sm mt-3">
            Nearby pickups within 150 km, compatible handling and customs route,
            a shared destination and overlapping collection dates. Carrier
            routing and packing compatibility still need review. No savings
            assumed.
          </p>
          {freightGroups.length ? (
            freightGroups.map((g) => (
              <article
                key={g.workIds.join(":")}
                className="mt-3 rounded-lg bg-[#FFFDF9] p-4 text-sm"
              >
                <strong>
                  {g.workIds.length} artworks · {g.cities.join(" / ")}
                </strong>
                <p>
                  {g.destination} · {g.grossWeightKg} kg gross ·{" "}
                  {g.collectionFrom} to {g.collectionUntil}
                </p>
                <p>
                  Request comparable carrier quotes before selecting a route.
                </p>
              </article>
            ))
          ) : (
            <p className="mt-3 text-sm">
              No compatible groups yet. Record collection locations and windows
              on approved artworks.
            </p>
          )}
        </details>
      )}
      {invitation && (
        <div className="text-sm text-[#655D50]">
          {invitation.works.filter((w) => w.state === "SUBMITTED").length}{" "}
          awaiting review ·{" "}
          {invitation.works.filter((w) => w.state === "RETURNED").length}{" "}
          awaiting revision ·{" "}
          {invitation.works.filter((w) => w.state === "GC_CONSULTATION").length}{" "}
          in guidance ·{" "}
          {
            invitation.works.filter(
              (w) => w.condition?.damage && !w.condition.repaired,
            ).length
          }{" "}
          condition holds ·{" "}
          {
            invitation.works.filter(
              (w) =>
                w.nextMaintenance &&
                !w.returnAt &&
                Date.parse(w.nextMaintenance) <= now,
            ).length
          }{" "}
          care tasks due
        </div>
      )}
      {[
        "Editorial",
        "Finance",
        "Director",
        "General_Exhibition_Coordinator",
      ].includes(role) && (
        <details className={careCard}>
          <summary className="font-semibold cursor-pointer">
            Edition brief & approved invitation template
          </summary>
          {role === "General_Exhibition_Coordinator" &&
            !state.invitations.length && (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run({
                    action: "SET_BRIEF",
                    data: {
                      approvedThemeState,
                      deadline,
                      closesAt: close,
                      commissionAllowed: commissions,
                    },
                  });
                }}
              >
                <label className="block text-sm">
                  Approved theme label
                  <input
                    required
                    className={careInput}
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    Submission deadline (with timezone)
                    <input
                      required
                      placeholder="2026-10-15T17:00:00+04:00"
                      className={careInput}
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    Exhibition closes (with timezone)
                    <input
                      required
                      placeholder="2026-12-15T17:00:00+04:00"
                      className={careInput}
                      value={close}
                      onChange={(e) => setClose(e.target.value)}
                    />
                  </label>
                </div>
                <label className="flex gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={commissions}
                    onChange={(e) => setCommissions(e.target.checked)}
                  />
                  This edition accepts commission proposals
                </label>
                <button disabled={busy} className={careButton}>
                  Save edition brief
                </button>
              </form>
            )}
          {role === "Editorial" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void run({ action: "DRAFT_TEMPLATE", data: { en, ar } });
              }}
            >
              <p className="text-sm">
                Draft demonstration text. Institutional policy and bilingual
                review are required before any real use. Saving starts a new
                revision and resets approval.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm">
                  English master text
                  <textarea
                    rows={8}
                    required
                    className={careInput}
                    value={en}
                    onChange={(e) => setEn(e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Arabic master text
                  <textarea
                    rows={8}
                    required
                    lang="ar"
                    dir="rtl"
                    className={careInput}
                    value={ar}
                    onChange={(e) => setAr(e.target.value)}
                  />
                </label>
              </div>
              <button disabled={busy} className={careButton}>
                Save template revision
              </button>
            </form>
          )}
          {state.template && (
            <>
              <p className="text-sm">
                Template revision {state.template.version} ·{" "}
                {state.template.hash ? "Locked" : "Awaiting approval"} ·
                Reviewed by: {state.template.reviews.join(", ")}
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <p className="text-sm whitespace-pre-wrap">
                  {state.template.en}
                </p>
                <p lang="ar" dir="rtl" className="text-sm whitespace-pre-wrap">
                  {state.template.ar}
                </p>
              </div>
              {state.template.hash && (
                <p className="text-xs break-all">
                  SHA-256: {state.template.hash}
                </p>
              )}
            </>
          )}
          {role === "Finance" && state.template && !state.template.hash && (
            <>
              <label className="block text-sm">
                Policy / legal review reference
                <input
                  className={careInput}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </label>
              <button
                disabled={busy}
                className={careButton}
                onClick={() =>
                  void run({
                    action: "REVIEW_TEMPLATE",
                    data: { note: reference },
                  })
                }
              >
                Record template policy review
              </button>
            </>
          )}
          {role === "Director" && state.template && !state.template.hash && (
            <button
              disabled={busy}
              className={careButton}
              onClick={() => void run({ action: "LOCK_TEMPLATE" })}
            >
              Approve & lock bilingual template
            </button>
          )}
          {["Director", "General_Exhibition_Coordinator"].includes(role) && (
            <button
              disabled={busy}
              className={careButton}
              onClick={() => void run({ action: "PREPARE" })}
            >
              Prepare invitations from endorsed roster
            </button>
          )}
        </details>
      )}
      {role === "Exhibition_Coordinator" && (
        <label className="block text-sm">
          Simulated coordinator account
          <select
            className={careInput}
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          >
            {ledger.staff.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {available.length > 0 && (
        <label className="block text-sm">
          {artist ? "Simulated artist account" : "Artist invitation"}
          <select
            value={chosen?.id ?? ""}
            className={careInput}
            onChange={(e) => {
              setSelected(e.target.value);
              setAdding(false);
              setRevision(undefined);
              setToken("");
              setWelcome("");
              setDispatchToken("");
            }}
          >
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {!invitation ? (
        <p className={careCard}>
          Invitations appear after the Director endorses the roster and locks
          the reviewed template. Start with the edition brief and template
          above.
        </p>
      ) : (
        <>
          <article className={careCard}>
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="text-2xl font-serif">{invitation.name}</h2>
              <span className="text-xs uppercase tracking-wide">
                {invitation.state}
              </span>
            </div>
            <p className="text-sm">
              {invitation.venue} · Submission deadline:{" "}
              {state.settings &&
                new Date(state.settings.deadline).toLocaleString("en-GB", {
                  timeZone: "Asia/Dubai",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
              GST
            </p>
            {invitation.welcome && (
              <p className="text-sm leading-6">{invitation.welcome}</p>
            )}
            <details>
              <summary className="text-sm cursor-pointer">
                Read the official bilingual invitation
              </summary>
              <div className="mt-3 grid gap-5 md:grid-cols-2">
                <p className="text-sm whitespace-pre-wrap">{invitation.en}</p>
                <p lang="ar" dir="rtl" className="text-sm whitespace-pre-wrap">
                  {invitation.ar}
                </p>
              </div>
            </details>
            {[
              "General_Exhibition_Coordinator",
              "Exhibition_Coordinator",
            ].includes(role) &&
              invitation.state === "PREPARED" && (
                <>
                  <label className="block text-sm">
                    Curatorial welcome note
                    <textarea
                      className={careInput}
                      value={welcome}
                      onChange={(e) => setWelcome(e.target.value)}
                    />
                  </label>
                  <p className="text-xs">
                    Keep the welcome personal; do not add funding, insurance or
                    legal promises.
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      disabled={busy}
                      className={careButton}
                      onClick={() =>
                        void run({ action: "WELCOME", data: { note: welcome } })
                      }
                    >
                      Save welcome note
                    </button>
                    <button
                      disabled={busy}
                      className={careButton}
                      onClick={() => void run({ action: "DISPATCH" })}
                    >
                      Stage invitation in local outbox
                    </button>
                  </div>
                </>
              )}
            {dispatchToken &&
              [
                "General_Exhibition_Coordinator",
                "Exhibition_Coordinator",
              ].includes(role) && (
                <div className="space-y-2">
                  <label className="text-sm">
                    One-use local invitation code
                    <input
                      readOnly
                      className={`${careInput} font-mono`}
                      data-private
                      value={dispatchToken}
                    />
                  </label>
                  <p className="text-xs">
                    Copy this code before switching to the simulated Artist
                    account. It expires after seven days. No public portal link
                    or email is activated.
                  </p>
                </div>
              )}
            {artist && invitation.state === "DISPATCHED" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run({ action: "ACCEPT", data: { token } });
                }}
              >
                <label className="text-sm">
                  Invitation code
                  <input
                    required
                    className={careInput}
                    data-private
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </label>
                <button disabled={busy} className={`${careButton} mt-3`}>
                  Accept invitation & enter workspace
                </button>
              </form>
            )}
          </article>
          {artist && invitation.state === "ACCEPTED" && !adding && (
            <button
              className={careButton}
              onClick={() => {
                setRevision(undefined);
                setAdding(true);
              }}
            >
              + Add submission
            </button>
          )}
          {artist && adding && (
            <ArtistSubmission
              theme={approvedTheme(approvedThemeState)}
              key={revision?.id ?? "new"}
              returned={revision}
              allowed={state.settings?.commissionAllowed ?? false}
              onGuidance={async (work, note, rev) => {
                const saved = await run({
                  action: "REQUEST_GUIDANCE",
                  data: { work, note, revision: rev },
                });
                if (saved) {
                  setAdding(false);
                  setRevision(undefined);
                }
                return saved;
              }}
              onSubmit={async (work, rev) => {
                const saved = await run({
                  action: "SUBMIT_WORK",
                  data: { work, revision: rev },
                });
                if (saved) {
                  setAdding(false);
                  setRevision(undefined);
                }
                return saved;
              }}
            />
          )}
          {!artist && (
            <details className="border-y border-[#DED5C4] py-3">
              <summary className="cursor-pointer text-sm">
                Filter artwork context in this dossier
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  Artist-defined lineage
                  <select
                    className={careInput}
                    value={lineageBand}
                    onChange={(e) => setLineageBand(e.target.value)}
                  >
                    <option value="all">
                      All positions, including unspecified
                    </option>
                    <option value="classical">0–30 · Classical emphasis</option>
                    <option value="middle">31–69 · Mixed approaches</option>
                    <option value="experimental">
                      70–100 · Experimental emphasis
                    </option>
                  </select>
                </label>
                <label className="text-sm">
                  Conceptual anchor
                  <input
                    className={careInput}
                    value={anchorQuery}
                    onChange={(e) => setAnchorQuery(e.target.value)}
                    placeholder="Search artist-selected anchors"
                  />
                </label>
              </div>
              {(lineageBand !== "all" || anchorQuery) && (
                <button
                  type="button"
                  className="mt-3 text-sm underline"
                  onClick={() => {
                    setLineageBand("all");
                    setAnchorQuery("");
                  }}
                >
                  Clear artwork filters
                </button>
              )}
            </details>
          )}
          <div className="space-y-5">
            {!filteredWorks.length && (
              <p className="text-sm text-[#655D50]">
                No artworks match this view. Clear the filters or wait for an
                artist submission.
              </p>
            )}
            {filteredWorks.map((w) => (
              <ArtistCareWork
                key={`${role}:${invitation.id}:${w.id}:${w.revision}`}
                work={w}
                invitation={invitation}
                shippingActive={
                  ledger.curation?.phase === "ENDORSED" &&
                  ledger.curation.snapshots.at(-1)?.id ===
                    invitation.rosterId &&
                  ledger.artworks.some(
                    (a) =>
                      a.id === invitation.artistId && a.state === "APPROVED",
                  )
                }
                role={role}
                state={state}
                run={run}
                onRevise={() => {
                  setRevision(w);
                  setAdding(true);
                }}
              />
            ))}
          </div>
        </>
      )}
      <button
        type="button"
        className="fixed bottom-5 end-5 z-20 rounded-full border border-[#8C8173] bg-[#FFFDF9] px-4 py-3 text-sm shadow-sm focus-visible:outline-2 focus-visible:outline-[#8B261E]"
        onClick={() => briefingDialog.current?.showModal()}
      >
        Exhibition briefing
      </button>
      <dialog
        ref={briefingDialog}
        aria-labelledby="care-briefing-heading"
        className="fixed inset-y-0 start-auto end-0 m-0 h-dvh max-h-dvh w-full max-w-md border-s border-[#DED5C4] bg-[#F7F1E6] p-6 text-[#111817] backdrop:bg-black/25"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="care-briefing-heading" className="font-serif text-2xl">
            Exhibition briefing
          </h2>
          <button
            type="button"
            className="rounded-lg border border-[#8C8173] px-3 py-2 text-sm"
            onClick={() => briefingDialog.current?.close()}
          >
            Close briefing
          </button>
        </div>
        <label className="block text-sm mt-3">
          Search briefing
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={careInput}
          />
        </label>
        <div className="mt-4 space-y-3">
          {briefing
            .filter(([q, a]) =>
              (q + " " + a).toLowerCase().includes(search.toLowerCase()),
            )
            .map(([q, a]) => (
              <details key={q}>
                <summary className="cursor-pointer text-sm">{q}</summary>
                <p className="mt-2 text-sm leading-6 text-[#655D50]">{a}</p>
              </details>
            ))}
        </div>
      </dialog>
    </section>
  );
}
