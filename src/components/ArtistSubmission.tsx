import { ArtistCraftFields, emptyCraft } from "./ArtistCraftFields";
import type { ArtistCraft } from "../lib/artistCraft";
import type { ThemeAnchor } from "../lib/artistCare";
import { useEffect, useRef, useState } from "react";
import type { MediaRef, Route, Work } from "../lib/artistCare";
import { saveArtistMedia, loadArtistMedia } from "../lib/artistMedia";
export const careInput =
  "mt-2 block w-full rounded-lg border border-[#8C8173] bg-white p-3 text-sm focus-visible:outline-2 focus-visible:outline-[#8B261E]";
export const careButton =
  "rounded-lg bg-[#8B261E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40";
export const careCard =
  "rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5 space-y-4";
export function MediaUpload({
  label,
  onFile,
  image = false,
}: {
  label: string;
  onFile: (f: MediaRef) => void;
  image?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <label className="block text-sm">
      {label}
      <input
        type="file"
        disabled={busy}
        accept={image ? "image/jpeg,image/png,image/webp" : undefined}
        className={careInput}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            const ref = await saveArtistMedia(f);
            onFile(ref);
            setMessage(`${f.name} saved locally`);
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      <span role="status" className="block mt-1 text-xs text-[#655D50]">
        {busy ? "Checking and saving file…" : message}
      </span>
    </label>
  );
}
export function LocalMedia({ file }: { file: MediaRef }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let disposed = false,
      u = "";
    void loadArtistMedia(file.id)
      .then((blob) => {
        u = URL.createObjectURL(blob);
        if (!disposed) setUrl(u);
        else URL.revokeObjectURL(u);
      })
      .catch((e) => {
        if (!disposed) setError(e.message);
      });
    return () => {
      disposed = true;
      if (u) URL.revokeObjectURL(u);
    };
  }, [file.id]);
  return (
    <div>
      {error ? (
        <p role="alert">{error}</p>
      ) : url ? (
        <>
          {file.type.startsWith("image/") ? (
            <img
              src={url}
              alt={file.name}
              className="w-full max-h-96 object-contain rounded-lg bg-[#F7F1E6]"
            />
          ) : file.type.startsWith("audio/") ? (
            <audio controls src={url} aria-label="Artist Studio Voice" />
          ) : null}
          <a className="text-sm underline" href={url} download={file.name}>
            Download {file.name}
          </a>
        </>
      ) : (
        <span>Loading local file…</span>
      )}
    </div>
  );
}
export function ScaleAnchor({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const scale = 210 / Math.max(200, height || 0, width || 0);
  return (
    <figure className="rounded-lg bg-[#F7F1E6] p-4">
      <svg
        role="img"
        aria-label={`Artwork ${width} by ${height} centimetres beside a 170 centimetre reference person`}
        viewBox="0 0 340 260"
        className="w-full max-w-md"
      >
        <line x1="15" x2="330" y1="235" y2="235" stroke="#8C8173" />
        <g
          transform={`translate(45 ${235 - 170 * scale}) scale(${scale})`}
          fill="#655D50"
        >
          <circle cx="0" cy="12" r="12" />
          <path d="M-12 30H12L20 95H10L9 170H-1L-5 108L-9 170H-19L-15 95H-23Z" />
        </g>
        <rect
          x="100"
          y={235 - (height || 0) * scale}
          width={(width || 0) * scale}
          height={(height || 0) * scale}
          fill="#DED5C4"
          stroke="#8B261E"
        />
        <text x="15" y="254" fontSize="11">
          170 cm reference
        </text>
      </svg>
      <figcaption className="text-xs">
        Scale reference only. Installation clearance, depth, floor load and
        circulation require Technical review.
      </figcaption>
    </figure>
  );
}
function StudioVoice({ onFile }: { onFile: (f: MediaRef) => void }) {
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recording, setRecording] = useState(false),
    [message, setMessage] = useState("");
  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    if (timer.current) clearTimeout(timer.current);
    setRecording(false);
  };
  useEffect(
    () => () => {
      if (recorder.current) recorder.current.onstop = null;
      stream.current?.getTracks().forEach((t) => t.stop());
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="underline text-sm"
        onClick={async () => {
          if (recording) {
            stop();
            return;
          }
          try {
            if (!navigator.mediaDevices || typeof MediaRecorder === "undefined")
              throw new Error(
                "Recording unavailable; upload an audio file instead.",
              );
            const tracks = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            stream.current = tracks;
            const r = new MediaRecorder(tracks);
            recorder.current = r;
            const chunks: BlobPart[] = [];
            const start = Date.now();
            r.ondataavailable = (e) => {
              if (e.data.size) chunks.push(e.data);
            };
            r.onstop = async () => {
              try {
                const file = new File(chunks, "studio-voice.webm", {
                  type: r.mimeType,
                });
                const ref = await saveRecordedVoice(
                  file,
                  Math.min(60, (Date.now() - start) / 1000),
                );
                onFile(ref);
                setMessage("Studio Voice saved locally.");
              } catch (e) {
                setMessage((e as Error).message);
              }
            };
            r.start();
            setRecording(true);
            timer.current = setTimeout(stop, 59000);
          } catch (e) {
            stop();
            setMessage((e as Error).message);
          }
        }}
      >
        {recording
          ? "Stop recording"
          : "Record Studio Voice · up to 60 seconds"}
      </button>
      <p role="status" className="text-xs">
        {recording
          ? "Recording—microphone stops automatically before 60 seconds."
          : message}
      </p>
      <MediaUpload label="Or upload a short audio pitch" onFile={onFile} />
    </div>
  );
}
async function saveRecordedVoice(file: File, duration: number) {
  // WebM recordings can omit container duration. Add a measured duration after recording.
  const { digest } = await import("../lib/artistCare");
  const ref: MediaRef = {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type,
    bytes: file.size,
    hash: await digest(await file.arrayBuffer()),
    duration,
  };
  if (!file.size || file.size > 20 * 1024 * 1024)
    throw new Error("Recording size is invalid.");
  await new Promise<void>((resolve, reject) => {
    const r = indexedDB.open("sadu-artist-care-media", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onerror = () => reject(r.error);
    r.onsuccess = () => {
      const db = r.result,
        tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, ref.id);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
  return ref;
}
export default function ArtistSubmission({
  allowed,
  theme,
  onSubmit,
  onGuidance,
  returned,
}: {
  allowed: boolean;
  theme?: ThemeAnchor;
  onSubmit: (w: Work, revision?: number) => Promise<boolean>;
  onGuidance: (w: Work, note: string, revision?: number) => Promise<boolean>;
  returned?: Work;
}) {
  const [craft, setCraft] = useState<ArtistCraft | undefined>(returned?.craft);
  const [guidanceQuestion, setGuidanceQuestion] = useState("");
  const [route, setRoute] = useState<Route | undefined>(returned?.route),
    [briefed, setBriefed] = useState(!!returned),
    [title, setTitle] = useState(returned?.title ?? ""),
    [rationale, setRationale] = useState(
      returned?.thematicDefense?.conceptual ?? returned?.rationale ?? "",
    );
  const [material, setMaterial] = useState(
    returned?.thematicDefense?.material ?? "",
  );
  const [ackRevision, setAckRevision] = useState<number>();
  const [width, setWidth] = useState(returned?.width ?? 0),
    [height, setHeight] = useState(returned?.height ?? 0),
    [depth, setDepth] = useState(returned?.depth ?? 0),
    [weight, setWeight] = useState(returned?.weight ?? 0),
    [year, setYear] = useState(returned?.year ?? new Date().getFullYear()),
    [insurance, setInsurance] = useState((returned?.insuranceMinor ?? 0) / 100),
    [packing, setPacking] = useState(returned?.packing ?? "");
  const [materials, setMaterials] = useState(
      (returned?.budget[0]?.minor ?? 0) / 100,
    ),
    [fabrication, setFabrication] = useState(
      (returned?.budget[1]?.minor ?? 0) / 100,
    ),
    [labor, setLabor] = useState((returned?.budget[2]?.minor ?? 0) / 100),
    [files, setFiles] = useState<Record<string, MediaRef>>(
      returned?.media ?? {},
    ),
    [care, setCare] = useState(returned?.maintenance ?? ""),
    [days, setDays] = useState(returned?.intervalDays ?? 7),
    [checks, setChecks] = useState<string[]>([]),
    [busy, setBusy] = useState(false);
  const number = (label: string, v: number, set: (v: number) => void) => (
    <label className="block text-sm">
      {label}
      <input
        type="number"
        min="0"
        step="any"
        required
        value={v || ""}
        onChange={(e) => set(Number(e.target.value))}
        className={careInput}
      />
    </label>
  );
  if (!route)
    return (
      <div className={careCard}>
        <h3 className="font-serif text-2xl">What would you like to share?</h3>
        <div className="flex flex-wrap gap-3">
          <button className={careButton} onClick={() => setRoute("EXISTING")}>
            Submit existing work
          </button>
          <button
            disabled={!allowed}
            className={careButton}
            onClick={() => setRoute("COMMISSION")}
          >
            Propose a new commission
          </button>
        </div>
        {!allowed && (
          <p className="text-sm">
            Commissions are not enabled for this edition.
          </p>
        )}
      </div>
    );
  if (!briefed)
    return (
      <section className={careCard} aria-label="Before you begin">
        <h3 className="font-serif text-2xl">Before you begin</h3>
        <ol className="list-decimal ps-5 space-y-3 text-sm">
          <li>
            {route === "COMMISSION"
              ? "A proposal is not a funding commitment. Itemize production costs for review."
              : "Declare your work’s condition, value and packing needs. Shipping and insurance coverage must be confirmed in your agreement."}
          </li>
          <li>
            Dates, travel support, customs treatment and return arrangements
            require written confirmation. No automatic exemption or
            reimbursement is promised here.
          </li>
          <li>
            Your proposal may be returned with reasons. On-site alterations
            require a separate approval of the specific work order.
          </li>
        </ol>
        <button className={careButton} onClick={() => setBriefed(true)}>
          Acknowledge & begin proposal
        </button>
        <button
          className="text-sm underline ms-4"
          onClick={() => setRoute(undefined)}
        >
          Change submission type
        </button>
      </section>
    );
  return (
    <form
      className={careCard}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const requesting =
            (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
            "guidance";
          const submit = requesting
            ? (w: Work, revision?: number) =>
                onGuidance(w, guidanceQuestion, revision)
            : onSubmit;
          await submit(
            {
              id: returned?.id ?? crypto.randomUUID(),
              title,
              route,
              width,
              height,
              depth,
              weight,
              year,
              rationale,
              craft,
              thematicDefense: {
                conceptual: rationale,
                material,
                acknowledged: ackRevision === theme?.revision,
                themeRevision: theme?.revision ?? -1,
              },
              packing,
              insuranceMinor: Math.round(insurance * 100),
              budget: [
                { label: "Materials", minor: Math.round(materials * 100) },
                { label: "Fabrication", minor: Math.round(fabrication * 100) },
                { label: "Labor", minor: Math.round(labor * 100) },
              ],
              media: files,
              maintenance: care,
              intervalDays: days,
              consent: checks,
              state: "SUBMITTED",
              revision: 0,
              milestones: [],
              maintenanceLog: [],
              legacy: [],
            },
            returned?.revision,
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h3 className="font-serif text-2xl">
        {route === "COMMISSION"
          ? "Commission blueprint"
          : "Existing artwork dossier"}
      </h3>
      {returned?.feedback && (
        <p className="border-s-2 border-[#8B261E] ps-3">
          Revision requested: {returned.feedback}
        </p>
      )}
      <label className="block text-sm">
        Artwork title
        <input
          required
          className={careInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        {number("Width (cm)", width, setWidth)}
        {number("Height (cm)", height, setHeight)}
        {number("Depth (cm)", depth, setDepth)}
      </div>
      <ScaleAnchor width={width} height={height} />
      <section
        className="space-y-4 border-y border-[#DED5C4] py-6"
        aria-label="Thematic defense"
      >
        <div>
          <p className="text-xs uppercase tracking-widest text-[#8B261E]">
            Your connection to the exhibition
          </p>
          <h4 className="mt-2 font-serif text-xl">Thematic bridge</h4>
          <p className="mt-2 text-sm text-[#655D50]">
            Share your intent in your own words. Answer both prompts, or use
            Studio Voice below.
          </p>
        </div>
        {theme ? (
          <>
            <details className="rounded-lg bg-[#F7F1E6] p-4" open>
              <summary className="cursor-pointer font-medium">
                Approved theme · {theme.title.en} · revision {theme.revision}
              </summary>
              <div className="mt-4 grid gap-6 md:grid-cols-2 text-sm leading-7">
                <div lang="en" dir="ltr">
                  <h5 className="font-semibold">{theme.title.en}</h5>
                  <p className="whitespace-pre-wrap">
                    {theme.essay.introduction.en}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap">
                    {theme.essay.context.en}
                  </p>
                </div>
                <div lang="ar" dir="rtl" className="text-start">
                  <h5 className="font-semibold">{theme.title.ar}</h5>
                  <p className="whitespace-pre-wrap">
                    {theme.essay.introduction.ar}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap">
                    {theme.essay.context.ar}
                  </p>
                </div>
              </div>
            </details>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                required
                checked={ackRevision === theme.revision}
                onChange={(e) =>
                  setAckRevision(e.target.checked ? theme.revision : undefined)
                }
              />
              I have reviewed this approved theme for my proposal.
            </label>
          </>
        ) : (
          <p role="status" className="text-sm text-[#8B261E]">
            The bilingual theme is awaiting final approval. You can prepare your
            proposal; submission opens once the approved essay is available.
          </p>
        )}
        <label className="block text-sm">
          Which specific element of the official theme does this artwork respond
          to, and how?
          <textarea
            required={!files.voice}
            minLength={files.voice ? undefined : 20}
            maxLength={4000}
            rows={3}
            className={careInput}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          How does your choice of material or technique elevate the core message
          of this exhibition?
          <textarea
            required={!files.voice}
            minLength={files.voice ? undefined : 20}
            maxLength={4000}
            rows={3}
            className={careInput}
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
          />
        </label>
        <details>
          <summary className="cursor-pointer text-sm">
            Studio Voice · optional personal pitch
          </summary>
          <p className="mt-3 text-sm">
            Prefer speaking? Record up to 60 seconds explaining how this work
            responds to the theme and how its materials support that idea.
          </p>
          <div className="mt-3">
            <StudioVoice
              onFile={(f) => setFiles((old) => ({ ...old, voice: f }))}
            />
            {files.voice && <LocalMedia file={files.voice} />}
          </div>
        </details>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        {(route === "COMMISSION"
          ? ["sketch", "material", "mockup"]
          : ["master", "angle", "texture"]
        ).map((k) => (
          <div key={k}>
            <MediaUpload
              image
              label={
                {
                  sketch: "Concept sketch",
                  material: "Material reference",
                  mockup: "Spatial mockup",
                  master: "Master photograph · 2000 px minimum",
                  angle: "Depth / angle photograph",
                  texture: "Macro / texture photograph",
                }[k]!
              }
              onFile={(f) => setFiles((old) => ({ ...old, [k]: f }))}
            />
            {files[k] && (
              <p className="text-xs mt-2">Attached: {files[k].name}</p>
            )}
          </div>
        ))}
      </div>
      {route === "COMMISSION" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {number("Materials (AED)", materials, setMaterials)}
          {number("Fabrication (AED)", fabrication, setFabrication)}
          {number("Labor (AED)", labor, setLabor)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {number("Weight (kg)", weight, setWeight)}
            {number("Year", year, setYear)}
            {number("Declared insurance value (AED)", insurance, setInsurance)}
          </div>
          <details className="text-sm">
            <summary>What valuation evidence is needed?</summary>
            <p className="mt-2">
              Record a supportable value. The insurer’s evidence threshold,
              coverage and excess must be confirmed for this edition; uploading
              a value does not bind insurance.
            </p>
          </details>
          <label className="block text-sm">
            Packing and handling specifications
            <textarea
              required
              minLength={10}
              className={careInput}
              value={packing}
              onChange={(e) => setPacking(e.target.value)}
            />
          </label>
        </>
      )}
      <details className="border-y border-[#DED5C4] py-4">
        <summary className="cursor-pointer font-medium">
          Craft & cultural context
        </summary>
        <div className="mt-4">
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!craft}
              onChange={(e) =>
                setCraft(
                  e.target.checked ? { ...emptyCraft, anchors: [] } : undefined,
                )
              }
            />
            Include artist-defined context with this proposal
          </label>
          {craft && (
            <div className="mt-4">
              <ArtistCraftFields value={craft} onChange={setCraft} />
            </div>
          )}
        </div>
      </details>
      <details className="border-b border-[#DED5C4] pb-4">
        <summary className="cursor-pointer font-medium">
          Need curatorial guidance before submitting?
        </summary>
        <p className="mt-3 text-sm">
          Send an unfinished draft to your assigned coordinator. Editing pauses
          until they release it. Advice is recorded and is not a compliance
          clearance. This browser demonstration is not a secure place for
          sensitive information.
        </p>
        <label className="block text-sm mt-3">
          Your guidance question
          <textarea
            className={careInput}
            maxLength={4000}
            value={guidanceQuestion}
            onChange={(e) => setGuidanceQuestion(e.target.value)}
          />
        </label>
        <button
          className={`${careButton} mt-3`}
          type="submit"
          value="guidance"
          formNoValidate
          disabled={
            busy ||
            title.trim().length === 0 ||
            guidanceQuestion.trim().length < 10
          }
        >
          Request curatorial guidance
        </button>
      </details>
      <label className="block text-sm">
        Maintenance and conservation instructions
        <textarea
          required
          minLength={10}
          className={careInput}
          value={care}
          onChange={(e) => setCare(e.target.value)}
        />
      </label>
      {number("Care interval (days)", days, setDays)}
      <details className="text-sm">
        <summary>Materials, power and specialist equipment</summary>
        <p className="mt-2">
          Declare unusual materials and handling hazards. Ask Technical to
          confirm venue power, equipment, rigging and any customs or
          environmental clearance before fabrication or shipment.
        </p>
      </details>
      {(
        [
          [
            "proposal-review",
            "I understand this is a proposal for review, not an acceptance or funding commitment.",
          ],
          [
            "alterations",
            "I understand that any physical alteration needs a separate, specific work order for my approval.",
          ],
        ] as const
      ).map(([id, label]) => (
        <label key={id} className="flex gap-3 text-sm">
          <input
            type="checkbox"
            checked={checks.includes(id)}
            onChange={(e) =>
              setChecks((old) =>
                e.target.checked ? [...old, id] : old.filter((k) => k !== id),
              )
            }
          />
          {label}
        </label>
      ))}
      <p className="text-xs text-[#655D50]">
        These acknowledgements record understanding; they do not replace the
        final agreement or a verified signature.
      </p>
      <button
        disabled={
          busy ||
          checks.length !== 2 ||
          !theme ||
          ackRevision !== theme.revision
        }
        className={careButton}
      >
        {busy ? "Saving…" : "Submit artwork for review"}
      </button>
    </form>
  );
}
