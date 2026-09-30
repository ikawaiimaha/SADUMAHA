import { useState } from "react";
import type {
  CareCommand,
  CareInvitation,
  MediaRef,
  Work,
} from "../lib/artistCare";
import {
  customsExport,
  shippingReadiness,
  type FreightDetails,
} from "../lib/artistFreight";
import {
  careButton,
  careInput,
  LocalMedia,
  MediaUpload,
} from "./ArtistSubmission";
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function ArtistFreightPanel({
  work: w,
  invitation,
  role,
  run,
  active,
  closesAt,
}: {
  work: Work;
  invitation: CareInvitation;
  role: string;
  active: boolean;
  closesAt?: string;
  run: (c: Omit<CareCommand, "expected">) => Promise<boolean>;
}) {
  const artist = ["Artist", "Artist_Portal"].includes(role),
    logistics = ["Logistics", "Logistics_Officer"].includes(role),
    allowed = artist || logistics || role === "General_Exhibition_Coordinator";
  const [freight, setFreight] = useState<FreightDetails>(
    w.freight ?? {
      originCountry: "",
      pickupCountry: "",
      pickupCity: "",
      pickupAddress: "",
      latitude: NaN,
      longitude: NaN,
      readyFrom: "",
      readyUntil: "",
      handling: "CLIMATE_CONTROLLED",
      medium: w.craft
        ? `${w.craft.pigment} on ${w.craft.substrate}; ${w.craft.method}`
        : "",
      customsValueMinor: 0,
      currency: "AED",
      grossWeightKg: 0,
      packageCount: 1,
      regime: "UNCONFIRMED",
    },
  );
  const [amending, setAmending] = useState(false);
  const [photos, setPhotos] = useState<MediaRef[]>([]),
    [note, setNote] = useState(""),
    [damage, setDamage] = useState(false),
    [ack, setAck] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const reports = w.conditionHistory ?? [],
    pre = reports.find(
      (r) =>
        r.stage === "PRE_DISPATCH" &&
        r.revision === w.revision &&
        (r.freightRevision ?? 0) === (w.freightRevision ?? 0),
    ),
    removal = reports.find(
      (r) => r.stage === "DEINSTALLATION" && r.revision === w.revision,
    );
  const removalOpen =
    !!w.nextMaintenance && !!closesAt && Date.now() >= Date.parse(closesAt);
  const reason = active
    ? shippingReadiness(w)
    : "An active allocation and current endorsed roster are required.";
  const operation = async (f: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await f();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const field = (key: keyof FreightDetails, label: string, type = "text") => (
    <label className="text-sm">
      {label}
      <input
        required
        className={careInput}
        type={type}
        step={type === "number" ? "any" : undefined}
        value={
          typeof freight[key] === "number" && !Number.isFinite(freight[key])
            ? ""
            : (freight[key] ?? "")
        }
        onChange={(e) =>
          setFreight({
            ...freight,
            [key]:
              type === "number"
                ? e.target.value === ""
                  ? NaN
                  : Number(e.target.value)
                : e.target.value,
          })
        }
      />
    </label>
  );
  if (w.state !== "APPROVED") return null;
  return (
    <details className="border-t border-[#DED5C4] pt-4">
      <summary className="cursor-pointer font-semibold">
        Freight, customs & condition checkpoints
      </summary>
      <div className="mt-4 space-y-5">
        <p className="text-sm text-[#655D50]">
          Prepare a broker-reviewed draft. Customs value, taxes, permits and
          Carnet eligibility require confirmation; no automatic clearance or
          insurance waiver is issued.
        </p>
        {allowed && !w.condition && (!pre || amending) && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void operation(async () => {
                if (
                  await run({
                    action: "SAVE_FREIGHT",
                    workId: w.id,
                    data: { freight },
                  })
                )
                  setAmending(false);
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {field("originCountry", "Country of origin · two-letter code")}
              {field("pickupCountry", "Pickup country · two-letter code")}
              {field("pickupCity", "Pickup city")}
              {field("pickupAddress", "Collection address")}
              {field("latitude", "Pickup latitude", "number")}
              {field("longitude", "Pickup longitude", "number")}
              {field("readyFrom", "Collection window starts", "date")}
              {field("readyUntil", "Collection window ends", "date")}
              {field("grossWeightKg", "Gross packed weight (kg)", "number")}
              {field("packageCount", "Number of packages", "number")}
              {field("medium", "Reviewed medium description")}
              {field("currency", "Customs value currency · three-letter code")}
              <label className="text-sm">
                Declared customs value
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={careInput}
                  value={freight.customsValueMinor / 100 || ""}
                  onChange={(e) =>
                    setFreight({
                      ...freight,
                      customsValueMinor: Math.round(
                        Number(e.target.value) * 100,
                      ),
                    })
                  }
                />
              </label>
              <label className="text-sm">
                Handling
                <select
                  className={careInput}
                  value={freight.handling}
                  onChange={(e) =>
                    setFreight({
                      ...freight,
                      handling: e.target.value as FreightDetails["handling"],
                    })
                  }
                >
                  <option value="STANDARD_ART">
                    Standard fine-art handling
                  </option>
                  <option value="CLIMATE_CONTROLLED">Climate controlled</option>
                  <option value="SPECIALIST">
                    Specialist · manual planning
                  </option>
                </select>
              </label>
              <label className="text-sm">
                Proposed customs route
                <select
                  className={careInput}
                  value={freight.regime}
                  onChange={(e) =>
                    setFreight({
                      ...freight,
                      regime: e.target.value as FreightDetails["regime"],
                    })
                  }
                >
                  <option value="UNCONFIRMED">Awaiting broker advice</option>
                  <option value="TEMPORARY_IMPORT">
                    Temporary import review
                  </option>
                  <option value="ATA_CARNET">
                    ATA Carnet reference recorded
                  </option>
                  <option value="PERMANENT_IMPORT_REVIEW">
                    Permanent import / acquisition review
                  </option>
                </select>
              </label>
              {freight.regime === "ATA_CARNET" && (
                <>
                  {field("carnetReference", "Carnet reference")}
                  {field("reexportBy", "Re-export deadline", "date")}
                </>
              )}
            </div>
            <button className={careButton} disabled={busy}>
              Save freight draft
            </button>
          </form>
        )}
        {allowed && pre && !w.condition && (
          <button
            type="button"
            className="text-sm underline"
            onClick={() => setAmending(true)}
          >
            Amend freight details · requires a new pre-dispatch checkpoint
          </button>
        )}
        {w.freight && (
          <p className="text-sm">
            {w.freight.pickupCity}, {w.freight.pickupCountry} →{" "}
            {invitation.venue} · {w.freight.packageCount} packages ·{" "}
            {w.freight.grossWeightKg} kg gross
          </p>
        )}
        {(allowed || role === "Director") && (
          <div className="flex flex-wrap gap-3">
            <button
              disabled={busy || !w.freight}
              className={careButton}
              onClick={() =>
                void operation(async () =>
                  download(
                    new Blob(
                      [JSON.stringify(customsExport(invitation, w), null, 2)],
                      { type: "application/json" },
                    ),
                    "SADU-customs-draft.json",
                  ),
                )
              }
            >
              Export customs draft JSON
            </button>
            <button
              disabled={busy || !!reason}
              className={careButton}
              onClick={() =>
                void operation(async () => {
                  const { artistShippingPdf } =
                    await import("../lib/artistShippingPdf");
                  download(
                    new Blob([await artistShippingPdf(w)], {
                      type: "application/pdf",
                    }),
                    "SADU-crate-label.pdf",
                  );
                })
              }
            >
              Download crate label
            </button>
          </div>
        )}
        {reason && (
          <p className="text-sm text-[#8B261E]">Crate label: {reason}</p>
        )}
        {((artist && !pre && !w.condition) ||
          (logistics && w.condition && !removal && !w.returnAt)) && (
          <div className="rounded-lg bg-[#F7F1E6] p-4 space-y-3">
            {logistics && !removalOpen && (
              <p className="text-sm">
                De-installation evidence opens after installation and exhibition
                closure.
              </p>
            )}
            <h4 className="font-medium">
              {artist
                ? "Pre-dispatch condition record"
                : "De-installation condition record"}
            </h4>
            <MediaUpload
              image
              label="Add condition photograph · 2000 px minimum"
              onFile={(f) =>
                setPhotos((old) =>
                  old.some((x) => x.hash === f.hash)
                    ? old
                    : [...old, f].slice(0, 8),
                )
              }
            />
            <p className="text-xs">{photos.length} / 8 photographs added</p>
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span>{photo.name}</span>
                <button
                  type="button"
                  className="underline"
                  onClick={() =>
                    setPhotos((old) => old.filter((p) => p.id !== photo.id))
                  }
                >
                  Remove photograph
                </button>
              </div>
            ))}
            <label className="block text-sm">
              Condition observations
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
                checked={damage}
                onChange={(e) => setDamage(e.target.checked)}
              />
              Damage or discrepancy observed
            </label>
            {artist && (
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                />
                I confirm these photographs and observations describe the work
                as prepared for dispatch. This is a recorded acknowledgement,
                not a legal waiver or verified signature.
              </label>
            )}
            <button
              disabled={
                busy ||
                (logistics && !removalOpen) ||
                !photos.length ||
                note.trim().length < 10 ||
                (artist && (!ack || !w.freight))
              }
              className={careButton}
              onClick={() =>
                void operation(async () => {
                  if (
                    await run({
                      action: artist
                        ? "PRE_DISPATCH_CONDITION"
                        : "DEINSTALL_CONDITION",
                      workId: w.id,
                      data: { photos, note, damage, acknowledged: ack },
                    })
                  ) {
                    setPhotos([]);
                    setNote("");
                    setAck(false);
                  }
                })
              }
            >
              Lock condition checkpoint
            </button>
          </div>
        )}
        {!!reports.length && (
          <div className="grid gap-4 md:grid-cols-3">
            {(["PRE_DISPATCH", "ARRIVAL", "DEINSTALLATION"] as const).map(
              (stage) => {
                const r = reports.find(
                  (x) =>
                    x.stage === stage &&
                    x.revision === w.revision &&
                    (x.freightRevision ?? 0) === (w.freightRevision ?? 0),
                );
                return (
                  <section
                    key={stage}
                    className="min-w-0 rounded-lg border border-[#DED5C4] p-3"
                  >
                    <h4 className="text-sm font-semibold">
                      {stage.replaceAll("_", " ")}
                    </h4>
                    {r ? (
                      <>
                        <p className="text-xs mt-2">
                          {new Date(r.at).toLocaleString()} · {r.actorId}
                        </p>
                        <p className="text-sm my-2">{r.note}</p>
                        {r.photos.map((photo) => (
                          <LocalMedia key={photo.id} file={photo} />
                        ))}
                        <details className="mt-2 text-xs">
                          <summary>Record integrity</summary>
                          <code className="break-all">{r.hash}</code>
                          <p>
                            Revision {r.revision}. Hashes verify recorded bytes,
                            not capture time or liability.
                          </p>
                        </details>
                      </>
                    ) : (
                      <p className="text-sm mt-2">Not recorded</p>
                    )}
                  </section>
                );
              },
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-[#8B261E]">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
