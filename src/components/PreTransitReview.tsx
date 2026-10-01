import { useRef, useState } from "react";
import type { Work, CareCommand } from "../lib/artistCare";
import {
  latestPreDispatch,
  preTransitHold,
  transitDecision,
  lastDamage,
} from "../lib/preTransit";
import { careButton, careInput, LocalMedia } from "./ArtistSubmission";
export default function PreTransitReview({
  work,
  role,
  run,
}: {
  work: Work;
  role: string;
  run: (c: Omit<CareCommand, "expected">) => Promise<boolean>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failure, setFailure] = useState("");
  const [path, setPath] = useState("REPAIR"),
    [note, setNote] = useState(""),
    [reference, setReference] = useState(""),
    [packing, setPacking] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false);
  const hold = preTransitHold(work),
    decision = transitDecision(work),
    report = latestPreDispatch(work),
    damage = lastDamage(work);
  if (!damage) return null;
  const coordinator = role === "General_Exhibition_Coordinator",
    logistics = ["Logistics", "Logistics_Officer"].includes(role);
  const cancelled = work.transitDecisions?.some((d) => d.action === "CANCEL");
  const save = async (action: string) => {
    if (busy) return;
    setBusy(true);
    setFailure("");
    try {
      if (
        await run({
          action,
          workId: work.id,
          data: {
            path,
            note,
            insuranceReference: reference,
            packing,
            confirmed,
          },
        })
      ) {
        dialog.current?.close();
        setNote("");
        setConfirmed(false);
      } else {
        setFailure(
          "Resolution was not saved. Check the required fields; close this review to read the workspace error and refresh the current record.",
        );
      }
    } finally {
      setBusy(false);
    }
  };
  return (
    <section
      aria-label="Pre-transit review"
      className="rounded-lg border border-[#8B261E] p-4 space-y-3"
    >
      <h4 className="font-semibold">
        {hold ? "Pre-transit hold" : "Pre-transit review completed"}
      </h4>
      <p className="text-sm">
        {hold ??
          "The recorded review requirements are complete for this revision. Insurance coverage still depends on the policy and approved documents."}
      </p>
      <p className="text-sm">Original damage: {damage.note}</p>
      {damage.photos.map((photo) => (
        <LocalMedia key={photo.id} file={photo} />
      ))}
      {decision?.packing && (
        <p className="text-sm">Required packing: {decision.packing}</p>
      )}
      {coordinator && !cancelled && !work.condition && (
        <button
          type="button"
          className={careButton}
          onClick={() => dialog.current?.showModal()}
        >
          Review resolution options
        </button>
      )}
      {logistics && decision?.action === "AS_IS" && !work.condition && (
        <div className="space-y-3">
          <label className="block text-sm">
            Packing completion evidence / reference
            <textarea
              className={careInput}
              value={note}
              maxLength={4000}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            I confirm the recorded protective packing instructions have been
            completed.
          </label>
          <button
            type="button"
            className={careButton}
            disabled={busy || !confirmed || note.trim().length < 10}
            onClick={() => void save("CONFIRM_TRANSIT_PACKING")}
          >
            Confirm protective packing
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        aria-label="Resolve pre-transit hold"
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(94vw,38rem)] overflow-auto rounded-xl bg-[#F7F1E6] p-6 text-[#111817] backdrop:bg-black/30"
      >
        <h3 className="font-serif text-2xl">Resolve pre-transit hold</h3>
        <p className="my-3 text-sm">
          Record the conservation and insurance review. This simulation does not
          issue a legal waiver, change coverage or void a contract.
        </p>
        {failure && (
          <p role="alert" className="text-sm text-[#8B261E]">
            {failure}
          </p>
        )}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void save("TRANSIT_RESOLUTION");
          }}
        >
          <label className="block text-sm">
            Resolution
            <select
              className={careInput}
              value={path}
              onChange={(e) => setPath(e.target.value)}
            >
              <option value="REPAIR">Authorize studio repair</option>
              <option value="AS_IS">
                Accept as-is · require protective packing
              </option>
              <option value="CANCEL">
                Cancel shipment / request substitute
              </option>
              {decision?.action === "REPAIR" &&
                report &&
                !report.damage &&
                report.hash !== decision.reportHash && (
                  <option value="RELEASE_REPAIR">
                    Approve the new post-repair condition report
                  </option>
                )}
            </select>
          </label>
          <label className="block text-sm">
            Review reason / repair instructions
            <textarea
              required
              minLength={10}
              maxLength={4000}
              className={careInput}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {path === "AS_IS" && (
            <>
              <label className="block text-sm">
                Approved insurance / legal acknowledgement reference
                <input
                  required
                  minLength={5}
                  maxLength={500}
                  className={careInput}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Protective packing instructions
                <textarea
                  required
                  minLength={10}
                  maxLength={4000}
                  className={careInput}
                  value={packing}
                  onChange={(e) => setPacking(e.target.value)}
                />
              </label>
              <p className="text-sm">
                Logistics must confirm these instructions before the hold is
                released.
              </p>
            </>
          )}
          {path === "CANCEL" && (
            <p className="text-sm">
              Stops this shipment permanently in the prototype. Contract
              cancellation needs separate institutional handling. Submit any
              replacement as a new proposal.
            </p>
          )}
          <div className="flex gap-3">
            <button className={careButton} disabled={busy}>
              Record resolution
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => dialog.current?.close()}
            >
              Close
            </button>
          </div>
        </form>
      </dialog>
      {decision && ["AS_IS", "PACKING_CONFIRMED"].includes(decision.action) && (
        <button
          type="button"
          className="text-sm underline"
          onClick={() => {
            const content = [
              "SADU — DRAFT RISK ACKNOWLEDGEMENT",
              "LOCAL SIMULATION — NOT AN EXECUTED LIABILITY WAIVER",
              "Coverage and legal effect require the institution’s approved documents.",
              "",
              "Artwork: " + work.id,
              "Artwork revision: " + decision.revision,
              "Freight revision: " + decision.freightRevision,
              "Original condition report SHA-256: " + decision.damageHash,
              "Reviewed report SHA-256: " + decision.reportHash,
              "Recorded by: " + decision.actorId,
              "Recorded at: " + decision.at,
              "Insurance/legal review reference: " +
                decision.insuranceReference,
              "Protective packing: " + decision.packing,
              "Review note: " + decision.note,
            ].join("\n");
            const url = URL.createObjectURL(
              new Blob([content], { type: "text/plain;charset=utf-8" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = "SADU-risk-acknowledgement-DRAFT.txt";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          Download risk acknowledgement draft
        </button>
      )}
      {!!work.transitDecisions?.length && (
        <details>
          <summary className="cursor-pointer text-sm">
            Resolution history
          </summary>
          {work.transitDecisions.map((d) => (
            <p key={d.id} className="mt-2 text-sm">
              {d.action.replaceAll("_", " ")} · {d.actorId} ·{" "}
              {new Date(d.at).toLocaleString()} — {d.note}
            </p>
          ))}
        </details>
      )}
    </section>
  );
}
