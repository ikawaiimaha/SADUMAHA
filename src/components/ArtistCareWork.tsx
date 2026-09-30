import { useState } from "react";
import {
  type Work,
  type CareCommand,
  type ArtistCare,
  legacyAvailable,
  type MediaRef,
} from "../lib/artistCare";
import {
  careCard,
  careInput,
  careButton,
  MediaUpload,
  LocalMedia,
  ScaleAnchor,
} from "./ArtistSubmission";
export default function ArtistCareWork({
  work: w,
  role,
  state,
  run,
  onRevise,
}: {
  work: Work;
  role: string;
  state: ArtistCare;
  run: (c: Omit<CareCommand, "expected">) => Promise<boolean>;
  onRevise: () => void;
}) {
  const [locationError, setLocationError] = useState("");
  const [note, setNote] = useState(""),
    [proof, setProof] = useState<MediaRef>(),
    [damage, setDamage] = useState(false),
    [kind, setKind] = useState("Installation photograph"),
    [rows, setRows] = useState([
      { label: "Initial construction", amount: 0 },
      { label: "Fabrication complete", amount: 0 },
      { label: "Final finish", amount: 0 },
    ]);
  const act = (action: string, data?: unknown) =>
    run({ action, workId: w.id, data });
  const artist = ["Artist", "Artist_Portal"].includes(role),
    coord = role === "General_Exhibition_Coordinator",
    tech = role === "Technical",
    logistics = ["Logistics", "Logistics_Officer"].includes(role);
  return (
    <article className={careCard}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-2xl">{w.title}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs ${w.route === "COMMISSION" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"}`}
        >
          {w.route === "COMMISSION" ? "COMMISSION" : "EXISTING WORK"} ·{" "}
          {w.state.toLowerCase()}
        </span>
      </div>
      <p className="text-sm">
        Revision {w.revision} · {w.width} × {w.height} × {w.depth} cm ·{" "}
        {w.route === "COMMISSION"
          ? `Proposed production: AED ${w.budget.reduce((n, x) => n + x.minor, 0) / 100}`
          : `Declared insurance value: AED ${w.insuranceMinor / 100}`}
      </p>
      {w.thematicDefense ? <section className="space-y-3 border-s-2 border-[#DED5C4] ps-4" aria-label="Artist thematic defense"><h4 className="font-serif text-xl">Artist’s thematic defense</h4><p className="text-xs text-[#655D50]">{w.thematicDefense.theme?.title.en} · approved theme revision {w.thematicDefense.themeRevision}</p>{w.thematicDefense.conceptual && <div><h5 className="text-sm font-semibold">Connection to the theme</h5><p className="whitespace-pre-wrap">{w.thematicDefense.conceptual}</p></div>}{w.thematicDefense.material && <div><h5 className="text-sm font-semibold">Material and technique</h5><p className="whitespace-pre-wrap">{w.thematicDefense.material}</p></div>}</section> : <p className="text-sm leading-6">{w.rationale}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(w.media)
          .filter(([k]) => k !== "voice")
          .map(([key, file]) => (
            <figure key={key}>
              <LocalMedia file={file} />
              <figcaption className="text-xs capitalize mt-2">{key}</figcaption>
            </figure>
          ))}
      </div>
      {w.media.voice && <LocalMedia file={w.media.voice} />}
      <details>
        <summary className="text-sm cursor-pointer">
          Scale, care instructions and revision history
        </summary>
        <ScaleAnchor width={w.width} height={w.height} />
        <p className="text-sm mt-3">
          {w.maintenance} · every {w.intervalDays} days
        </p>
        {w.previous?.map((p) => (
          <p key={p.revision} className="text-sm mt-2">
            Revision {p.revision}: {p.title} · {p.feedback}
          </p>
        ))}
      </details>
      {w.state === "SUBMITTED" && (
        <div className="flex flex-wrap gap-3">
          {role === "Committee" && !w.committeeReviewed && (
            <button
              className={careButton}
              onClick={() => void act("RECOMMEND_WORK")}
            >
              Recommend this revision to Director
            </button>
          )}
          {w.committeeReviewed && (
            <p className="text-sm">
              Committee review recorded for this revision.
            </p>
          )}
          {role === "Director" && (
            <button
              disabled={!w.committeeReviewed}
              className={careButton}
              onClick={() => void act("APPROVE_WORK")}
            >
              Approve proposal & reserve budget
            </button>
          )}
          {role === "Director" && !w.committeeReviewed && (
            <p className="text-sm">
              Waiting for Committee review of this artwork revision.
            </p>
          )}
          {(coord || role === "Exhibition_Coordinator") && (
            <div className="w-full">
              <label className="text-sm">
                Revision reason
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={careInput}
                />
              </label>
              <button
                className={`${careButton} mt-3`}
                disabled={note.trim().length < 10}
                onClick={() => void act("RETURN_WORK", { note })}
              >
                Request a revision
              </button>
            </div>
          )}
        </div>
      )}
      {artist && w.state === "RETURNED" && (
        <>
          <p className="text-sm">Review note: {w.feedback}</p>
          <button className={careButton} onClick={onRevise}>
            Revise this artwork
          </button>
        </>
      )}
      {w.state === "APPROVED" && (
        <>
          {w.route === "COMMISSION" && (
            <details>
              <summary className="cursor-pointer font-semibold">
                Production milestones & Finance review
              </summary>
              <p className="my-3 text-sm">
                Verified progress enables Finance review. Contract, Technical
                and Finance approval remain separate. All payment recording here
                is simulated.
              </p>
              {artist && !w.milestones.length && (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act("MILESTONES", {
                      rows: rows.map((r) => ({
                        label: r.label,
                        minor: Math.round(r.amount * 100),
                      })),
                    });
                  }}
                >
                  {rows.map((r, index) => (
                    <div key={index} className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm">
                        Milestone {index + 1}
                        <input
                          className={careInput}
                          required
                          value={r.label}
                          onChange={(e) =>
                            setRows((old) =>
                              old.map((x, k) =>
                                k === index
                                  ? { ...x, label: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="text-sm">
                        Amount {index + 1} (AED)
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          className={careInput}
                          required
                          value={r.amount || ""}
                          onChange={(e) =>
                            setRows((old) =>
                              old.map((x, k) =>
                                k === index
                                  ? { ...x, amount: Number(e.target.value) }
                                  : x,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={rows.length === 4}
                    className="underline text-sm"
                    onClick={() =>
                      setRows((old) => [
                        ...old,
                        { label: "Additional milestone", amount: 0 },
                      ])
                    }
                  >
                    Add fourth milestone
                  </button>
                  <button className={`${careButton} ms-3`}>
                    Save milestone plan
                  </button>
                </form>
              )}
              {w.milestones.map((m) => (
                <section
                  key={m.id}
                  className="border-t border-[#DED5C4] py-4 space-y-3"
                >
                  <strong>
                    {m.label} · AED {m.minor / 100}
                  </strong>
                  <p className="text-sm">
                    {m.paid
                      ? "Simulated payment recorded"
                      : m.verified
                        ? "Progress verified · awaiting Finance"
                        : m.proof
                          ? "Proof submitted · awaiting Coordinator"
                          : "Awaiting studio evidence"}
                  </p>
                  {m.proof && <LocalMedia file={m.proof} />}{" "}
                  {artist && !m.verified && (
                    <MediaUpload
                      image
                      label={`Progress photograph: ${m.label}`}
                      onFile={(file) =>
                        void act("MILESTONE_PROOF", { id: m.id, file })
                      }
                    />
                  )}{" "}
                  {coord && m.proof && !m.verified && (
                    <button
                      className={careButton}
                      onClick={() => void act("VERIFY_PROGRESS", { id: m.id })}
                    >
                      Verify physical progress
                    </button>
                  )}
                  {role === "Finance" && m.verified && !m.paid && (
                    <button
                      className={careButton}
                      onClick={() => void act("RECORD_PAYMENT", { id: m.id })}
                    >
                      Record simulated disbursement
                    </button>
                  )}
                </section>
              ))}
            </details>
          )}
          <details>
            <summary className="cursor-pointer font-semibold">
              Arrival, condition & repair consent
            </summary>
            <div className="mt-4 space-y-4">
              {!w.condition && logistics && (
                <>
                  <MediaUpload
                    image
                    label="Arrival condition photograph"
                    onFile={setProof}
                  />
                  <label className="block text-sm">
                    Condition observations
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className={careInput}
                    />
                  </label>
                  <label className="flex gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={damage}
                      onChange={(e) => setDamage(e.target.checked)}
                    />
                    Transit damage observed
                  </label>
                  <button
                    disabled={!proof}
                    className={careButton}
                    onClick={() => {
                      if (!navigator.geolocation) {
                        setLocationError("Location is unavailable.");
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (p) => {
                          setLocationError("");
                          void act("RECEIVE", {
                            file: proof,
                            note,
                            damage,
                            location: {
                              latitude: p.coords.latitude,
                              longitude: p.coords.longitude,
                              accuracy: p.coords.accuracy,
                              timestamp: p.timestamp,
                            },
                          });
                        },
                        () =>
                          setLocationError(
                            "Location permission and a position within the museum boundary are required.",
                          ),
                        {
                          enableHighAccuracy: true,
                          maximumAge: 0,
                          timeout: 10000,
                        },
                      );
                    }}
                  >
                    Record crate opening & condition
                  </button>
                  {locationError && <p role="alert">{locationError}</p>}
                </>
              )}
              {w.condition && (
                <>
                  <p className="text-sm">
                    {w.condition.damage
                      ? "Damage reported · installation held until authorized repair is complete"
                      : "Received · no damage reported"}
                  </p>
                  <p>{w.condition.note}</p>
                  <LocalMedia file={w.condition.photo} />
                  {w.condition.protocol && (
                    <p className="border-s-2 border-[#8B261E] ps-3">
                      Proposed repair: {w.condition.protocol}
                    </p>
                  )}
                  {tech && w.condition.damage && !w.condition.repaired && (
                    <>
                      <label className="block text-sm">
                        Exact repair protocol
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className={careInput}
                        />
                      </label>
                      <button
                        className={careButton}
                        onClick={() =>
                          void act("REPAIR_PLAN", { protocol: note })
                        }
                      >
                        Submit repair protocol to artist
                      </button>
                    </>
                  )}
                  {artist &&
                    w.condition.protocol &&
                    !w.condition.repaired &&
                    w.condition.approvedProtocol !== w.condition.protocol && (
                      <button
                        className={careButton}
                        onClick={() => void act("APPROVE_REPAIR")}
                      >
                        Approve this repair protocol
                      </button>
                    )}
                  {tech &&
                    w.condition.approvedProtocol === w.condition.protocol &&
                    w.condition.protocol &&
                    !w.condition.repaired && (
                      <button
                        className={careButton}
                        onClick={() => void act("COMPLETE_REPAIR")}
                      >
                        Record approved repair completed
                      </button>
                    )}
                  {tech && !w.nextMaintenance && (
                    <button
                      className={careButton}
                      onClick={() => void act("INSTALL")}
                    >
                      Record installation & schedule care
                    </button>
                  )}
                </>
              )}
              {!w.condition && !logistics && (
                <p className="text-sm">
                  Waiting for Logistics to record receipt.
                </p>
              )}
            </div>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold">
              Material aftercare
            </summary>
            <p className="mt-3 text-sm">{w.maintenance}</p>
            <p className="my-3 text-sm">
              {w.returnAt
                ? "Care schedule ended: return transit recorded."
                : w.nextMaintenance
                  ? `Next care task: ${new Date(w.nextMaintenance).toLocaleString()}`
                  : "Care begins after installation."}
            </p>
            {tech && w.nextMaintenance && !w.returnAt && (
              <>
                <label className="block text-sm">
                  Care completion note
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={careInput}
                  />
                </label>
                <button
                  className={`${careButton} mt-3`}
                  onClick={() => void act("MAINTAIN", { note })}
                >
                  Record due maintenance
                </button>
              </>
            )}
            {w.maintenanceLog.map((m, index) => (
              <p key={index} className="text-sm mt-2">
                {m.at}: {m.note}
              </p>
            ))}
          </details>
          <details>
            <summary className="cursor-pointer font-semibold">
              Return & Legacy Vault
            </summary>
            <div className="mt-4 space-y-4">
              <p className="text-sm">
                Cleared assets become available 48 hours after exhibition close,
                once return transit is recorded.
              </p>
              {logistics && !w.returnAt && (
                <button
                  className={careButton}
                  onClick={() => void act("RETURN_TRANSIT")}
                >
                  Record return transit
                </button>
              )}
              {role === "Editorial" && (
                <>
                  <label className="block text-sm">
                    Legacy asset category
                    <select
                      className={careInput}
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                    >
                      {[
                        "Installation photograph",
                        "Bilingual catalogue",
                        "Participation record",
                      ].map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </label>
                  <MediaUpload
                    label="Institutional archive file"
                    onFile={(file) => void act("LEGACY_ASSET", { kind, file })}
                  />
                </>
              )}
              {w.legacy
                .filter(
                  (a) => !artist || (a.cleared && legacyAvailable(state, w)),
                )
                .map((a) => (
                  <div key={a.id}>
                    <p className="text-sm">
                      {a.kind} ·{" "}
                      {a.cleared
                        ? "Cleared"
                        : "Awaiting institutional clearance"}
                    </p>
                    {(!artist || legacyAvailable(state, w)) && (
                      <LocalMedia file={a.file} />
                    )}{" "}
                    {role === "Director" && !a.cleared && (
                      <button
                        className={`${careButton} mt-2`}
                        onClick={() => void act("CLEAR_LEGACY", { id: a.id })}
                      >
                        Clear asset for artist release
                      </button>
                    )}
                  </div>
                ))}
              {artist && !legacyAvailable(state, w) && (
                <p className="text-sm">Your Legacy Vault is not open yet.</p>
              )}
            </div>
          </details>
        </>
      )}
    </article>
  );
}
