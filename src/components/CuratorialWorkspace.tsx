import { useState } from "react";
import { useSandbox } from "./SandboxProvider";
import {
  activeGallery,
  curationReasons,
  emptyCuration,
  type CurationCommand,
} from "../lib/curatorialBoard";
import type { Ledger } from "../lib/spatialLedger";

const input =
  "mt-2 block w-full rounded-lg border border-[#8C8173] bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-[#8B261E]";
const primary =
  "rounded-lg bg-[#8B261E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B261E]";
const secondary =
  "rounded-lg border border-[#DED5C4] px-4 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-[#8B261E]";
const money = (n: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(n / 100);
export default function CuratorialWorkspace({
  ledger,
  mode,
  run,
}: {
  ledger: Ledger;
  mode: "brief" | "board";
  run: (c: Omit<CurationCommand, "expected">, actorId?: string) => boolean;
}) {
  const { role } = useSandbox();
  const board = ledger.curation ?? emptyCuration();
  const [staff, setStaff] = useState(ledger.staff[0].id);
  const [gallery, setGallery] = useState("");
  const [brief, setBrief] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [artist, setArtist] = useState(ledger.artworks[0].id);
  const [fit, setFit] = useState("");
  const [evidence, setEvidence] = useState("");
  const [cost, setCost] = useState("");
  const [proposalArea, setProposalArea] = useState("");
  const [response, setResponse] = useState("");
  const [returnNotes, setReturnNotes] = useState<
    Record<string, { reason: string; note: string }>
  >({});
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [moveGallery, setMoveGallery] = useState("");
  const [moveReason, setMoveReason] = useState("");
  const coordinator = role === "General_Exhibition_Coordinator";
  const editable = board.phase === "DRAFT";
  const slots =
    role === "Exhibition_Coordinator"
      ? board.slots.filter((s) => s.assignedTo === staff)
      : board.slots;
  const slot = slots.find((s) => s.id === selectedSlot) ?? slots[0];
  const nominations = board.nominations.filter((n) => n.slotId === slot?.id);
  const revising = board.nominations.find((n) => n.id === revisionId);
  const selected = board.slots.flatMap((s) => {
    const n = board.nominations.find((n) => n.id === s.selectedId);
    return n ? [{ slot: s, n, revision: n.revisions.at(-1)! }] : [];
  });
  const total = selected.reduce((sum, x) => sum + x.revision.costMinor, 0);
  const owner =
    board.phase === "ENDORSED"
      ? "Roster endorsed · proceed to Technical review and contracting"
      : board.phase === "DIRECTOR_REVIEW"
        ? "Director · endorse the exact Committee-approved board"
        : board.phase === "COMMITTEE_REVIEW"
          ? "Committee · approve or return each selected proposal"
          : coordinator
            ? "Issue briefs, review submissions, then lock the complete shortlist"
            : "Assigned coordinators · research and submit against the brief";
  const feedback = (id: string) =>
    returnNotes[id] ?? { reason: curationReasons[0], note: "" };
  return (
    <section aria-label="Curatorial brief and defense" className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-[#8B261E]">
          Phase 2 · Curatorial planning
        </p>
        <h1 className="mt-2 text-3xl font-serif">
          {mode === "board"
            ? "Committee Defense Board"
            : "The curatorial brief"}
        </h1>
        <p className="mt-2 text-sm text-[#655D50]">
          {mode === "board"
            ? "One selected proposal per reserved slot, with its rationale, evidence and cost."
            : "Start with the venue’s needs. Give each proposal a clear place, purpose and accountable review."}
        </p>
      </div>
      <p className="border-s-2 border-[#8B261E] ps-4 text-sm">
        <strong>{owner}</strong>
      </p>
      {ledger.block.state !== "ACTIVE" && (
        <p role="status" className="text-sm text-[#8B261E]">
          The Director must authorize the spatial block in Allocations before a
          brief can be issued.
        </p>
      )}
      {mode === "brief" && (
        <>
          {coordinator && editable && (
            <details
              className="rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5"
              open={!board.slots.length}
            >
              <summary className="cursor-pointer font-semibold">
                Issue a slot brief
              </summary>
              <form
                className="mt-5 grid gap-4 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const saved = run({
                    action: "CURATE_CREATE_SLOTS",
                    id: crypto.randomUUID(),
                    galleryId: gallery,
                    brief,
                    quantity: Number(quantity),
                    areaM2: Number(area),
                    budgetMinor: Math.round(Number(budget) * 100),
                    coordinatorId: staff,
                  });
                  if (saved) {
                    setBrief("");
                    setGallery("");
                    setArea("");
                    setBudget("");
                  }
                }}
              >
                <label className="text-sm">
                  Gallery
                  <select
                    required
                    className={input}
                    value={gallery}
                    onChange={(e) => setGallery(e.target.value)}
                  >
                    <option value="">Choose an authorized gallery</option>
                    {ledger.galleries
                      .filter((g) => activeGallery(ledger, g.id))
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-sm">
                  Responsible coordinator
                  <select
                    className={input}
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                  >
                    {ledger.staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.languages}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm md:col-span-2">
                  Brief &amp; selection criteria
                  <textarea
                    required
                    minLength={10}
                    maxLength={3000}
                    rows={3}
                    className={input}
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="For example: classical Thuluth works that explain continuity of practice; existing loans preferred."
                  />
                </label>
                <label className="text-sm">
                  Number of slots
                  <input
                    required
                    type="number"
                    min="1"
                    max="20"
                    className={input}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Maximum usable footprint per slot (m²)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={input}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  Budget ceiling per slot (AED)
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    className={input}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </label>
                <div className="self-end">
                  <button
                    className={primary}
                    disabled={ledger.block.state !== "ACTIVE"}
                  >
                    Issue brief &amp; reserve capacity
                  </button>
                </div>
                <p className="text-xs text-[#655D50] md:col-span-2">
                  The assigned coordinator sees this brief on their desk. No
                  email is sent. Slots reserve capacity; competing proposals do
                  not count as extra allocations.
                </p>
              </form>
            </details>
          )}
          {role === "Exhibition_Coordinator" && (
            <label className="block max-w-md text-sm">
              Simulated coordinator account
              <select
                className={input}
                value={staff}
                onChange={(e) => {
                  setStaff(e.target.value);
                  setSelectedSlot("");
                  setRevisionId(null);
                }}
              >
                {ledger.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!slots.length && (
            <p className="rounded-xl border border-[#DED5C4] p-5 text-sm">
              No slot briefs are assigned here yet. The General Coordinator
              issues them after venue authorization.
            </p>
          )}
          {slots.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
              <nav aria-label="Curatorial slots" className="space-y-2">
                {slots.map((s, i) => (
                  <button
                    key={s.id}
                    className={`w-full rounded-lg border p-3 text-start text-sm ${s.id === slot?.id ? "border-[#8B261E] bg-[#FFFDF9]" : "border-transparent"}`}
                    aria-pressed={s.id === slot?.id}
                    onClick={() => {
                      setSelectedSlot(s.id);
                      setRevisionId(null);
                    }}
                  >
                    <strong className="block">
                      {ledger.galleries.find((g) => g.id === s.galleryId)?.name}{" "}
                      · Slot {i + 1}
                    </strong>
                    <span className="mt-2 block text-[#655D50]">
                      {!activeGallery(ledger, s.galleryId)
                        ? "Needs a new location"
                        : s.selectedId
                          ? "Shortlist selected"
                          : "Seeking proposals"}
                    </span>
                  </button>
                ))}
              </nav>
              <div className="min-w-0 space-y-5">
                {slot && (
                  <article className="rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5">
                    <h2 className="font-serif text-xl">The brief</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                      {slot.brief}
                    </p>
                    <p className="mt-3 text-sm text-[#655D50]">
                      Up to {slot.areaM2} m² · {money(slot.budgetMinor)} ·{" "}
                      {ledger.staff.find((s) => s.id === slot.assignedTo)?.name}
                    </p>
                    {coordinator &&
                      !activeGallery(ledger, slot.galleryId) &&
                      editable && (
                        <div className="mt-4 space-y-3">
                          <label className="block text-sm">
                            Replacement gallery
                            <select
                              className={input}
                              value={moveGallery}
                              onChange={(e) => setMoveGallery(e.target.value)}
                            >
                              <option value="">Choose active gallery</option>
                              {ledger.galleries
                                .filter((g) => activeGallery(ledger, g.id))
                                .map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.name}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <label className="block text-sm">
                            Relocation reason
                            <textarea
                              className={input}
                              value={moveReason}
                              onChange={(e) => setMoveReason(e.target.value)}
                            />
                          </label>
                          <button
                            className={primary}
                            disabled={
                              !moveGallery || moveReason.trim().length < 10
                            }
                            onClick={() =>
                              run({
                                action: "CURATE_MOVE_SLOT",
                                slotId: slot.id,
                                galleryId: moveGallery,
                                note: moveReason,
                              })
                            }
                          >
                            Relocate brief slot
                          </button>
                        </div>
                      )}
                  </article>
                )}
                {role === "Exhibition_Coordinator" && editable && slot && (
                  <details
                    className="rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5"
                    open={!!revisionId || !nominations.length}
                  >
                    <summary className="cursor-pointer font-semibold">
                      {revisionId
                        ? "Revise returned proposal"
                        : "Submit an artist proposal"}
                    </summary>
                    <form
                      className="mt-4 space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(
                          {
                            action: "CURATE_PROPOSE",
                            id: revisionId ?? crypto.randomUUID(),
                            slotId: slot.id,
                            artistId: artist,
                            fit,
                            evidence,
                            costMinor: Math.round(Number(cost) * 100),
                            areaM2: Number(proposalArea),
                            response,
                            revision: revising?.revisions.at(-1)?.number,
                          },
                          staff,
                        );
                      }}
                    >
                      <label className="block text-sm">
                        Artist / artwork dossier
                        <select
                          className={input}
                          value={artist}
                          onChange={(e) => setArtist(e.target.value)}
                        >
                          {ledger.artworks.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm">
                        Why this proposal meets the brief
                        <textarea
                          required
                          minLength={10}
                          maxLength={3000}
                          rows={3}
                          className={input}
                          value={fit}
                          onChange={(e) => setFit(e.target.value)}
                        />
                      </label>
                      <label className="block text-sm">
                        Research evidence or source reference
                        <textarea
                          required
                          minLength={5}
                          maxLength={3000}
                          className={input}
                          rows={2}
                          value={evidence}
                          onChange={(e) => setEvidence(e.target.value)}
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm">
                          Proposed footprint (m²)
                          <input
                            required
                            type="number"
                            min="0.01"
                            max={slot.areaM2}
                            step="0.01"
                            className={input}
                            value={proposalArea}
                            onChange={(e) => setProposalArea(e.target.value)}
                          />
                        </label>
                        <label className="text-sm">
                          Estimated cost (AED)
                          <input
                            required
                            type="number"
                            min="0"
                            max={slot.budgetMinor / 100}
                            step="0.01"
                            className={input}
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                          />
                        </label>
                      </div>
                      {revisionId && (
                        <label className="block text-sm">
                          Response to the review notes
                          <textarea
                            required
                            minLength={10}
                            rows={3}
                            className={input}
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                          />
                        </label>
                      )}
                      <button className={primary}>
                        {revisionId
                          ? "Submit a new revision"
                          : "Submit for Coordinator review"}
                      </button>
                    </form>
                  </details>
                )}
                {nominations.map((n) => {
                  const r = n.revisions.at(-1)!;
                  const note = feedback(n.id);
                  return (
                    <article
                      key={n.id}
                      className="rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5"
                    >
                      <div className="flex flex-wrap justify-between gap-3">
                        <h3 className="font-serif text-xl">
                          {
                            ledger.artworks.find((a) => a.id === r.artistId)
                              ?.name
                          }
                        </h3>
                        <span className="text-xs text-[#655D50]">
                          {n.status.replaceAll("_", " ")} · revision {r.number}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">
                        {r.fit}
                      </p>
                      <p className="mt-2 text-sm">
                        {r.areaM2} m² · {money(r.costMinor)}
                      </p>
                      <details className="mt-3">
                        <summary className="text-sm cursor-pointer">
                          Research, feedback &amp; revision history
                        </summary>
                        <p className="mt-3 text-sm whitespace-pre-wrap">
                          {r.evidence}
                        </p>
                        {n.feedback.map((f, i) => (
                          <p
                            key={i}
                            className="mt-3 border-s-2 border-[#8B261E] ps-3 text-sm"
                          >
                            {f.role.replaceAll("_", " ")} · {f.reason} ·
                            revision {f.revision}
                            <br />
                            {f.note}
                          </p>
                        ))}
                        {n.revisions.map((v) => (
                          <p key={v.number} className="mt-3 text-sm">
                            Revision {v.number} · {v.fit}
                            {v.response ? ` — Response: ${v.response}` : ""}
                          </p>
                        ))}
                      </details>
                      {coordinator &&
                        editable &&
                        ["SUBMITTED", "SHORTLISTED"].includes(n.status) && (
                          <div className="mt-4 space-y-3">
                            {n.status === "SUBMITTED" && (
                              <button
                                className={primary}
                                onClick={() =>
                                  run({
                                    action: "CURATE_SHORTLIST",
                                    id: n.id,
                                    revision: r.number,
                                  })
                                }
                              >
                                Select for shortlist
                              </button>
                            )}
                            <details>
                              <summary className="cursor-pointer text-sm">
                                Return with reasons
                              </summary>
                              <label className="block text-sm mt-3">
                                Reason
                                <select
                                  className={input}
                                  value={note.reason}
                                  onChange={(e) =>
                                    setReturnNotes((old) => ({
                                      ...old,
                                      [n.id]: {
                                        ...note,
                                        reason: e.target.value,
                                      },
                                    }))
                                  }
                                >
                                  {curationReasons.map((x) => (
                                    <option key={x}>{x}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="block text-sm mt-3">
                                Specific review note
                                <textarea
                                  className={input}
                                  value={note.note}
                                  onChange={(e) =>
                                    setReturnNotes((old) => ({
                                      ...old,
                                      [n.id]: { ...note, note: e.target.value },
                                    }))
                                  }
                                />
                              </label>
                              <button
                                className={`${secondary} mt-3`}
                                disabled={note.note.trim().length < 10}
                                onClick={() =>
                                  run({
                                    action: "CURATE_RETURN",
                                    id: n.id,
                                    revision: r.number,
                                    ...note,
                                  })
                                }
                              >
                                Return proposal
                              </button>
                            </details>
                          </div>
                        )}
                      {role === "Exhibition_Coordinator" &&
                        n.authorId === staff &&
                        n.status === "RETURNED" &&
                        editable && (
                          <button
                            className={`${secondary} mt-4`}
                            onClick={() => {
                              setRevisionId(n.id);
                              setArtist(r.artistId);
                              setFit(r.fit);
                              setEvidence(r.evidence);
                              setProposalArea(String(r.areaM2));
                              setCost(String(r.costMinor / 100));
                              setResponse("");
                            }}
                          >
                            Prepare a revision
                          </button>
                        )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
      {mode === "board" && (
        <>
          <div className="flex flex-wrap justify-between gap-4 rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5">
            <div>
              <strong>
                {selected.length} / {board.slots.length} slots selected
              </strong>
              <p className="mt-2 text-sm">
                Proposed: {money(total)} · Brief ceilings:{" "}
                {money(board.slots.reduce((n, s) => n + s.budgetMinor, 0))}
              </p>
            </div>
            {coordinator && editable && (
              <button
                className={primary}
                disabled={
                  !selected.length || selected.length !== board.slots.length
                }
                onClick={() =>
                  run({ action: "CURATE_LOCK", id: crypto.randomUUID() })
                }
              >
                Lock shortlist for Committee
              </button>
            )}
            {role === "Director" && board.phase === "DIRECTOR_REVIEW" && (
              <button
                className={primary}
                onClick={() => run({ action: "CURATE_ENDORSE" })}
              >
                Endorse &amp; lock roster
              </button>
            )}
          </div>
          {!selected.length && (
            <p className="text-sm text-[#655D50]">
              Shortlisted proposals appear here automatically. No presentation
              needs to be rebuilt.
            </p>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            {selected.map(({ slot: s, n, revision: r }) => {
              const note = feedback(n.id);
              return (
                <article
                  key={s.id}
                  className="rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5"
                >
                  <p className="text-sm text-[#8B261E]">
                    {ledger.galleries.find((g) => g.id === s.galleryId)?.name} ·{" "}
                    {n.status.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-3 text-2xl font-serif">
                    {ledger.artworks.find((a) => a.id === r.artistId)?.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 whitespace-pre-wrap">
                    {r.fit}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-[#655D50]">Space</dt>
                      <dd>
                        {r.areaM2} / {s.areaM2} m²
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#655D50]">Cost / ceiling</dt>
                      <dd>
                        {money(r.costMinor)} / {money(s.budgetMinor)}
                      </dd>
                    </div>
                  </dl>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm">
                      Brief &amp; supporting evidence
                    </summary>
                    <p className="mt-3 text-sm whitespace-pre-wrap">
                      {s.brief}
                    </p>
                    <p className="mt-3 text-sm whitespace-pre-wrap">
                      {r.evidence}
                    </p>
                    {r.response && (
                      <p className="mt-3 text-sm">
                        Review response: {r.response}
                      </p>
                    )}
                  </details>
                  {role === "Committee" &&
                    board.phase === "COMMITTEE_REVIEW" &&
                    ["SHORTLISTED", "COMMITTEE_APPROVED"].includes(
                      n.status,
                    ) && (
                      <div className="mt-5 space-y-3">
                        {n.status === "SHORTLISTED" && (
                          <button
                            className={primary}
                            onClick={() =>
                              run({
                                action: "CURATE_COMMITTEE_APPROVE",
                                id: n.id,
                                revision: r.number,
                              })
                            }
                          >
                            Approve this proposal
                          </button>
                        )}
                        <details>
                          <summary className="cursor-pointer text-sm">
                            Object to this proposal
                          </summary>
                          <label className="block text-sm mt-3">
                            Committee reason
                            <select
                              className={input}
                              value={note.reason}
                              onChange={(e) =>
                                setReturnNotes((old) => ({
                                  ...old,
                                  [n.id]: { ...note, reason: e.target.value },
                                }))
                              }
                            >
                              {curationReasons.map((x) => (
                                <option key={x}>{x}</option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-sm mt-3">
                            Committee review note
                            <textarea
                              className={input}
                              value={note.note}
                              onChange={(e) =>
                                setReturnNotes((old) => ({
                                  ...old,
                                  [n.id]: { ...note, note: e.target.value },
                                }))
                              }
                            />
                          </label>
                          <button
                            className={`${secondary} mt-3`}
                            disabled={note.note.trim().length < 10}
                            onClick={() =>
                              run({
                                action: "CURATE_RETURN",
                                id: n.id,
                                revision: r.number,
                                ...note,
                              })
                            }
                          >
                            Return this slot for revision
                          </button>
                        </details>
                      </div>
                    )}
                </article>
              );
            })}
          </div>
          <details className="border-t border-[#DED5C4] pt-4">
            <summary className="cursor-pointer text-sm">
              Retained Defense Board snapshots ({board.snapshots.length})
            </summary>
            {board.snapshots.map((snapshot, i) => (
              <article key={snapshot.id} className="mt-4 text-sm">
                <h3 className="font-semibold">
                  Board {i + 1} · {snapshot.state} ·{" "}
                  {new Date(snapshot.at).toLocaleString("en-GB")}
                </h3>
                <ul className="mt-2 space-y-2">
                  {snapshot.rows.map((row) => (
                    <li key={row.slot.id}>
                      {
                        ledger.artworks.find(
                          (a) => a.id === row.revision.artistId,
                        )?.name
                      }{" "}
                      ·{" "}
                      {
                        ledger.galleries.find(
                          (g) => g.id === row.slot.galleryId,
                        )?.name
                      }{" "}
                      · revision {row.revision.number} ·{" "}
                      {money(row.revision.costMinor)}
                      <p>{row.revision.fit}</p>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </details>
        </>
      )}
      <p className="text-xs text-[#655D50]">
        Required reasons provide an accountable record; their fairness and
        quality still require human oversight. Footprint checks do not replace
        Technical clearance.
      </p>
    </section>
  );
}
