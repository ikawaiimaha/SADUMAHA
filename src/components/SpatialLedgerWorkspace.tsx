import ArtistCareWorkspace from "./ArtistCareWorkspace";
import { projectCuratorialLedger } from "../lib/curatorialAccess";
import CuratorialWorkspace from "./CuratorialWorkspace";
import { useRef, useState } from "react";
import { useSandbox } from "./SandboxProvider";
import {
  alternatives,
  applyLedger,
  capacity,
  downstreamBlock,
  ledgerSeed,
  spaceActive,
  type Ledger,
  type LedgerCommand,
} from "../lib/spatialLedger";

const KEY = "sadu-spatial-ledger-v1";
const input =
  "mt-2 block w-full rounded-lg border border-[#8C8173] bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-[#8B261E]";
const button =
  "rounded-lg bg-[#8B261E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B261E]";
const secondary =
  "rounded-lg border border-[#DED5C4] px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-[#8B261E]";
const money = (n: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(n / 100);
export default function SpatialLedgerWorkspace({
  themeApprovalId,
}: {
  themeApprovalId: string | null;
}) {
  const { role } = useSandbox();
  const [view, setView] = useState<"allocations" | "brief" | "board" | "care">(
    "allocations",
  );
  const [initial] = useState(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return { state: ledgerSeed(), events: [], error: "" };
      const saved = JSON.parse(raw);
      if (
        saved.format !== 1 ||
        !Array.isArray(saved.events) ||
        saved.events.length > 1000
      )
        throw new Error();
      let state = ledgerSeed();
      for (const e of saved.events)
        state = applyLedger(state, e.actor, e.command, e.themeApprovalId, e.at);
      return { state, events: saved.events, error: "" };
    } catch {
      return {
        state: ledgerSeed(),
        events: [],
        error:
          "The saved spatial journal could not be read. Actions are locked to preserve it.",
      };
    }
  });
  const [fullLedger, setLedger] = useState<Ledger>(initial.state);
  const ledger = projectCuratorialLedger(fullLedger, role);
  const latest = useRef(initial);
  const [selected, setSelected] = useState(ledger.artworks[0].id);
  const [gallery, setGallery] = useState("");
  const [reason, setReason] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [staff, setStaff] = useState(ledger.staff[0].id);
  const [amount, setAmount] = useState("");
  const [closeId, setCloseId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initial.error);
  const a =
    ledger.artworks.find((x) => x.id === selected) ?? ledger.artworks[0];
  const boardManaged = ledger.curation?.snapshots.some(
    (snapshot) =>
      snapshot.state === "ENDORSED" &&
      snapshot.rows.some((row) => row.revision.artistId === a.id),
  );
  const options = alternatives(ledger, a);
  const block = downstreamBlock(ledger, a);
  const coordinator = role === "General_Exhibition_Coordinator";
  const manage = coordinator || role === "Director";
  const nextStep =
    ledger.block.state !== "ACTIVE"
      ? "Director · authorize the spatial block after theme approval"
      : a.state === "LOCATION_ORPHANED"
        ? boardManaged
          ? "Master Administration · relocate the curatorial brief and obtain renewed review"
          : "Master Administration · reserve a replacement location or record withdrawal"
        : a.state === "WITHDRAWN"
          ? "Finance · reconcile any existing commitments outside this simulation"
          : a.state === "UNASSIGNED"
            ? ledger.curation?.slots.length
              ? "Open Curatorial brief to submit or review a proposal"
              : "Preparatory Committee · approve and reserve a gallery"
            : !a.coordinatorId
              ? "Master Administration · assign a coordinator"
              : a.technicalVersion !== a.assignmentVersion
                ? "Technical · review the current location"
                : !a.contractMinor
                  ? "Exhibition Coordinator · prepare the assigned contract terms"
                  : a.authorizedVersion !== a.assignmentVersion
                    ? "Master Administration · review and authorize the contract budget"
                    : !a.paidMinor
                      ? "Finance · review the simulated advance"
                      : "Advance recorded · subsequent tranches remain in the original agreement workflow";
  const orphaned = ledger.artworks.filter(
    (x) => x.state === "LOCATION_ORPHANED",
  );
  const affected = ledger.artworks.filter(
    (x) =>
      x.state === "APPROVED" &&
      (x.galleryId === closeId ||
        ledger.galleries.some(
          (g) => g.id === x.galleryId && g.venueId === closeId,
        )),
  );
  const act = (
    action: LedgerCommand["action"],
    fields: Partial<LedgerCommand> = {},
    proposerId?: string,
  ) => {
    try {
      if (initial.error) throw new Error(initial.error);
      if (latest.current.events.length >= 1000)
        throw new Error("This session journal is full. Start another tab.");
      const actor = {
        id:
          role === "Exhibition_Coordinator"
            ? (proposerId ?? staff)
            : `sandbox-${role}`,
        role,
        exhibitionId: "sandbox",
      };
      const command = {
        targetId: a.id,
        galleryId: gallery,
        reason,
        coordinatorId: staff,
        amountMinor: Math.round(Number(amount) * 100),
        ...fields,
        action,
        expected: latest.current.state.version,
      };
      const at = new Date().toISOString();
      const next = applyLedger(
        latest.current.state,
        actor,
        command,
        themeApprovalId,
        at,
      );
      const events = [
        ...latest.current.events,
        { actor, command, themeApprovalId, at },
      ];
      sessionStorage.setItem(KEY, JSON.stringify({ format: 1, events }));
      latest.current = { state: next, events, error: "" };
      setLedger(next);
      setError("");
      const confirmations: Record<string, string> = {
        CURATE_CREATE_SLOTS:
          "Brief issued. Capacity reserved for the assigned coordinator.",
        CURATE_PROPOSE: "Proposal submitted for Coordinator review.",
        CURATE_SHORTLIST: "Proposal selected for the shortlist.",
        CURATE_RETURN: "Proposal returned with the recorded reason and notes.",
        CURATE_LOCK: "Shortlist locked for Committee review.",
        CURATE_COMMITTEE_APPROVE:
          "Committee approval recorded for this revision.",
        CURATE_ENDORSE:
          "Roster endorsed. Continue to Technical review and contracting.",
        CURATE_MOVE_SLOT:
          "Brief relocated. The proposal requires renewed review.",
      };
      setMessage(confirmations[action] ?? "Changes saved.");
      setReason("");
      setClosureReason("");
      setWithdrawalReason("");
      if (action === "CLOSE_SPACE" || action === "CLOSE_VENUE") setCloseId("");
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to save. Your inputs remain here.",
      );
      return false;
    }
  };
  return (
    <>
      <nav
        aria-label="Spatial planning sections"
        className="mb-6 flex flex-wrap gap-2"
      >
        {(
          [
            ["allocations", "Allocations"],
            ["brief", "Curatorial brief"],
            ["board", "Defense board"],
            ["care", "Invitations & artist care"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={view === id}
            className={view === id ? button : secondary}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div hidden={view !== "care"}>
        <ArtistCareWorkspace ledger={fullLedger} />
      </div>
      <div hidden={view === "allocations" || view === "care"}>
        <CuratorialWorkspace
          ledger={ledger}
          mode={view === "board" ? "board" : "brief"}
          run={(command, actorId) => act(command.action, command, actorId)}
        />
        {error && (
          <p role="alert" className="mt-4 text-sm text-[#8B261E]">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        )}
      </div>
      <section
        hidden={view !== "allocations"}
        className="space-y-6"
        aria-label="Venue allocation"
      >
        <div>
          <p className="text-sm uppercase tracking-widest text-[#8B261E]">
            Exhibition planning
          </p>
          <h1 className="mt-2 text-3xl font-serif">Spaces &amp; allocations</h1>
          <p className="mt-2 text-sm text-[#655D50]">
            Reserve capacity with each Committee decision. Resolve location
            changes before contracts or funds move forward.
          </p>
        </div>
        {ledger.block.state === "DRAFT" && (
          <div className="border-s-2 border-[#8B261E] ps-4 text-sm">
            <strong>
              {themeApprovalId
                ? "Ready for Director venue authorization"
                : "Waiting for Chairman theme approval"}
            </strong>
            <p className="my-2">
              Sample block: three galleries · {money(ledger.block.budgetMinor)}{" "}
              ceiling. These are demonstration capacities, not surveyed venue
              specifications.
            </p>
            {role === "Director" && (
              <button
                className={button}
                disabled={!themeApprovalId}
                onClick={() => act("AUTHORIZE_BLOCK")}
              >
                Authorize sample spatial block
              </button>
            )}
          </div>
        )}
        {orphaned.length > 0 && (
          <section
            role="alert"
            className="rounded-xl border border-[#8B261E] bg-[#FFF3ED] p-5"
          >
            <h2 className="font-semibold text-[#8B261E]">
              {orphaned.length}{" "}
              {orphaned.length === 1 ? "record needs" : "records need"} a new
              location
            </h2>
            <p className="mt-2 text-sm">
              New contract actions and payment releases are blocked. Previous
              approvals, contracts and payments remain in the history.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {orphaned.map((x) => (
                <button
                  key={x.id}
                  className={secondary}
                  onClick={() => {
                    setSelected(x.id);
                    setGallery("");
                  }}
                >
                  {x.name}
                </button>
              ))}
            </div>
          </section>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {ledger.galleries.map((g) => {
            const room = capacity(ledger, g.id)!;
            const active = spaceActive(ledger, g.id);
            return (
              <article
                key={g.id}
                className="rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5"
              >
                <p className="text-xs text-[#655D50]">
                  {ledger.venues.find((v) => v.id === g.venueId)?.name}
                </p>
                <h2 className="mt-2 font-serif text-xl">{g.name}</h2>
                <p className="mt-3 font-semibold">
                  {active
                    ? `${room.works} of ${g.maxWorks} artwork slots available`
                    : "Unavailable"}
                </p>
                <p className="mt-1 text-sm">
                  {active
                    ? `${room.m2} / ${g.usableM2} m² unreserved`
                    : `${g.usableM2} m² configured · closed`}
                </p>
                <div
                  role="progressbar"
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EDE5D8]"
                  aria-label={`${g.name} occupied slots`}
                  aria-valuemin={0}
                  aria-valuemax={g.maxWorks}
                  aria-valuenow={g.maxWorks - room.works}
                >
                  <div
                    className="h-full bg-[#8B261E]"
                    style={{
                      width: `${(100 * (g.maxWorks - room.works)) / g.maxWorks}%`,
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside>
            <h2 className="text-xs uppercase tracking-widest text-[#655D50]">
              Artwork allocations
            </h2>
            <nav className="mt-3 space-y-2" aria-label="Allocation records">
              {ledger.artworks.map((x) => (
                <button
                  key={x.id}
                  aria-pressed={a.id === x.id}
                  onClick={() => {
                    setSelected(x.id);
                    setGallery("");
                    setMessage("");
                    setError(initial.error);
                  }}
                  className={`w-full rounded-lg border p-3 text-start text-sm ${a.id === x.id ? "border-[#8B261E] bg-[#FFFDF9]" : "border-transparent"}`}
                >
                  <span className="block font-semibold">{x.name}</span>
                  <span className="block mt-1 text-[#655D50]">
                    {
                      {
                        UNASSIGNED: "Awaiting allocation",
                        APPROVED: "Allocated",
                        LOCATION_ORPHANED: "Needs a new location",
                        WITHDRAWN: "Withdrawn",
                      }[x.state]
                    }
                  </span>
                </button>
              ))}
            </nav>
          </aside>
          <article className="min-w-0 rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5 md:p-7 space-y-5">
            <div>
              <h2 className="font-serif text-2xl">{a.name}</h2>
              <p className="mt-2 text-sm">
                Planning footprint: {a.areaM2} m² ·{" "}
                {ledger.galleries.find((g) => g.id === a.galleryId)?.name ||
                  "No gallery assigned"}
              </p>
              <p className="mt-2 text-xs text-[#655D50]">
                Footprint includes circulation allowance in this example. Wall
                fit, access, floor load and conservation remain separate
                Technical checks.
              </p>
            </div>
            {((role === "Committee" &&
              a.state === "UNASSIGNED" &&
              !ledger.curation?.slots.length) ||
              (coordinator &&
                a.state === "LOCATION_ORPHANED" &&
                !boardManaged)) && (
              <div className="space-y-3">
                <label className="block text-sm">
                  Available galleries
                  <select
                    className={input}
                    value={gallery}
                    onChange={(e) => setGallery(e.target.value)}
                  >
                    <option value="">Choose a capacity-checked location</option>
                    {options.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} · {capacity(ledger, g.id, a.id)!.m2 - a.areaM2}{" "}
                        m² remaining after reservation
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-xs text-[#655D50]">
                  Options are ordered by the smallest sufficient remaining area.
                  This is a capacity calculation, not an automatic curatorial
                  recommendation.
                </p>
                {!options.length && (
                  <p className="text-sm">
                    No active gallery can accommodate this footprint. Review the
                    authorized venue plan or record a withdrawal.
                  </p>
                )}
                {coordinator && (
                  <label className="block text-sm">
                    Reassignment reason
                    <textarea
                      className={input}
                      rows={2}
                      maxLength={500}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                )}
                <button
                  className={button}
                  disabled={
                    !gallery ||
                    ledger.block.state !== "ACTIVE" ||
                    (coordinator && !reason.trim())
                  }
                  onClick={() => act(coordinator ? "REASSIGN" : "APPROVE")}
                >
                  {coordinator
                    ? "Reserve replacement location"
                    : "Approve & reserve gallery"}
                </button>
              </div>
            )}
            <p className="rounded-lg bg-[#F7F1E6] p-3 text-sm">
              <strong>Next step:</strong> {nextStep}
            </p>
            {block && (
              <p className="border-s-2 border-[#8B261E] ps-3 text-sm">
                Contract and finance hold: {block}
              </p>
            )}
            {role === "Technical" && (
              <button
                className={button}
                disabled={
                  a.state !== "APPROVED" ||
                  !spaceActive(ledger, a.galleryId) ||
                  a.technicalVersion === a.assignmentVersion
                }
                onClick={() => act("TECHNICAL")}
              >
                Record sample location clearance
              </button>
            )}
            {coordinator && (
              <div className="space-y-3">
                <label className="block text-sm">
                  Assign coordinator
                  <select
                    className={input}
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                  >
                    {ledger.staff.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name} · {x.languages} ·{" "}
                        {
                          ledger.artworks.filter(
                            (r) =>
                              r.coordinatorId === x.id &&
                              r.state !== "WITHDRAWN",
                          ).length
                        }{" "}
                        active records
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={`${secondary} me-3`}
                  onClick={() => act("DELEGATE")}
                >
                  Save responsibility
                </button>
                {a.contractMinor > 0 && (
                  <button
                    className={button}
                    disabled={
                      !!block || a.authorizedVersion === a.assignmentVersion
                    }
                    onClick={() => act("AUTHORIZE_CONTRACT")}
                  >
                    Authorize contract budget
                  </button>
                )}
              </div>
            )}
            {role === "Exhibition_Coordinator" && (
              <div className="space-y-3">
                <label className="block text-sm">
                  Simulated coordinator account
                  <select
                    className={input}
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                  >
                    {ledger.staff.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Draft contract value (AED)
                  <input
                    className={input}
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
                <button
                  className={button}
                  disabled={!!block || a.coordinatorId !== staff || !amount}
                  onClick={() => act("DRAFT_CONTRACT")}
                >
                  Save sample contract terms
                </button>
                <p className="text-xs text-[#655D50]">
                  Only the assigned coordinator can draft. This records terms;
                  it does not create or sign a legal contract.
                </p>
              </div>
            )}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#655D50]">Assigned coordinator</dt>
                <dd>
                  {ledger.staff.find((x) => x.id === a.coordinatorId)?.name ||
                    "Not assigned"}
                </dd>
              </div>
              <div>
                <dt className="text-[#655D50]">Technical clearance</dt>
                <dd>
                  {a.technicalVersion === a.assignmentVersion
                    ? "Current"
                    : "Required for this location"}
                </dd>
              </div>
              <div>
                <dt className="text-[#655D50]">
                  Contract value / recorded advance
                </dt>
                <dd>
                  {money(a.contractMinor)} / {money(a.paidMinor)}
                </dd>
              </div>
              <div>
                <dt className="text-[#655D50]">
                  Coordinator budget authorization
                </dt>
                <dd>
                  {a.authorizedVersion === a.assignmentVersion
                    ? "Current"
                    : "Required"}
                </dd>
              </div>
            </dl>
            {role === "Finance" && (
              <>
                <button
                  className={button}
                  disabled={
                    !!block ||
                    a.authorizedVersion !== a.assignmentVersion ||
                    !a.contractMinor ||
                    a.paidMinor > 0
                  }
                  onClick={() => act("RELEASE")}
                >
                  Record simulated advance (30%)
                </button>
                <p className="text-xs text-[#655D50]">
                  Local demonstration only. Actual payments retain their
                  agreement, identity, technical and Finance checks.
                </p>
              </>
            )}
            {coordinator && a.state === "LOCATION_ORPHANED" && (
              <details>
                <summary className="cursor-pointer text-sm">
                  Withdraw instead of relocating
                </summary>
                <p className="mt-3 text-sm">
                  Existing financial commitments remain for reconciliation.
                </p>
                <label className="block text-sm mt-3">
                  Withdrawal reason
                  <textarea
                    className={input}
                    value={withdrawalReason}
                    onChange={(e) => setWithdrawalReason(e.target.value)}
                    maxLength={500}
                  />
                </label>
                <button
                  className={`${secondary} mt-3`}
                  disabled={!withdrawalReason.trim()}
                  onClick={() => act("WITHDRAW", { reason: withdrawalReason })}
                >
                  Record withdrawal
                </button>
              </details>
            )}
          </article>
        </div>
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
        {manage && (
          <details className="border-t border-[#DED5C4] pt-5">
            <summary className="cursor-pointer text-sm font-semibold">
              Venue changes &amp; impact preview
            </summary>
            <div className="mt-4 max-w-xl space-y-3">
              <label className="block text-sm">
                Close a gallery or venue
                <select
                  className={input}
                  value={closeId}
                  onChange={(e) => setCloseId(e.target.value)}
                >
                  <option value="">Choose a location</option>
                  {ledger.venues
                    .filter((v) => v.active)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} · entire venue
                      </option>
                    ))}
                  {ledger.galleries
                    .filter((g) => spaceActive(ledger, g.id))
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </label>
              <p className="text-sm">
                Impact: {affected.length} approved records will need
                reassignment. Contract and payment holds apply immediately.
              </p>
              {affected.map((x) => (
                <p key={x.id} className="text-sm">
                  {x.name} · {money(x.paidMinor)} already recorded
                </p>
              ))}
              <label className="block text-sm">
                Closure reason
                <textarea
                  className={input}
                  value={closureReason}
                  maxLength={500}
                  onChange={(e) => setClosureReason(e.target.value)}
                />
              </label>
              <button
                className={button}
                disabled={!closeId || !closureReason.trim()}
                onClick={() =>
                  act(
                    ledger.venues.some((v) => v.id === closeId)
                      ? "CLOSE_VENUE"
                      : "CLOSE_SPACE",
                    { targetId: closeId, reason: closureReason },
                  )
                }
              >
                Close location &amp; apply holds
              </button>
            </div>
          </details>
        )}
        <details className="border-t border-[#DED5C4] pt-5">
          <summary className="cursor-pointer text-sm">
            Budget &amp; decision history
          </summary>
          <p className="my-3 text-sm">
            {money(
              ledger.artworks.reduce(
                (n, x) => n + Math.max(x.contractMinor, x.paidMinor),
                0,
              ),
            )}{" "}
            reserved of {money(ledger.block.budgetMinor)}. Withdrawal does not
            erase commitments.
          </p>
          <ol className="space-y-2 text-sm">
            {ledger.decisions.map((d) => (
              <li key={d.version}>
                {d.version}. {d.action.replaceAll("_", " ")} · {d.actorId} ·{" "}
                {new Date(d.at).toLocaleString("en-GB")}
                {d.reason ? ` · ${d.reason}` : ""}
              </li>
            ))}
          </ol>
        </details>
        <p className="text-xs text-[#655D50]">
          Sample capacities and footprints · Browser-local sandbox · No
          bookings, signatures or payments sent
        </p>
      </section>
    </>
  );
}
