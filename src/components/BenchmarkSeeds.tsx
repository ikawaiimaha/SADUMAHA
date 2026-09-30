import { useState } from "react";
import type { Ledger } from "../lib/spatialLedger";
import type { CurationCommand } from "../lib/curatorialBoard";

export default function BenchmarkSeeds({
  ledger,
  role,
  run,
}: {
  ledger: Ledger;
  role: string;
  run: (command: Omit<CurationCommand, "expected">) => boolean;
}) {
  const [name, setName] = useState("");
  const [rationale, setRationale] = useState("");
  const [seed, setSeed] = useState("");
  const [gallery, setGallery] = useState("");
  const [area, setArea] = useState("");
  const [budget, setBudget] = useState("");
  const field =
    "mt-2 block w-full rounded-lg border border-[#8C8173] bg-white p-3 text-sm";
  const button =
    "rounded-lg bg-[#8B261E] px-4 py-2.5 text-sm font-semibold text-white";
  const pending =
    ledger.curation?.benchmarks?.filter(
      (x) =>
        !x.assigned ||
        ledger.curation?.nominations.some(
          (n) => n.id === x.id && n.status === "RETURNED",
        ),
    ) ?? [];
  if (
    !["Committee", "General_Exhibition_Coordinator"].includes(role) ||
    (ledger.curation?.phase ?? "DRAFT") !== "DRAFT"
  )
    return null;
  return (
    <details className="rounded-xl border border-[#DED5C4] bg-[#FFFDF9] p-5">
      <summary className="cursor-pointer font-semibold">
        Committee benchmarks · restricted stream
      </summary>
      <p className="mt-3 text-sm text-[#655D50]">
        Benchmarks guide the exhibition; open briefs must describe the execution
        standard without naming restricted artists. Sandbox role switching is a
        demonstration, not a confidentiality boundary.
      </p>
      {role === "Committee" ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              run({
                action: "CURATE_SEED",
                id: crypto.randomUUID(),
                name,
                fit: rationale,
              })
            ) {
              setName("");
              setRationale("");
            }
          }}
        >
          <label className="block text-sm">
            Benchmark artist name
            <input
              required
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Execution standard and thematic rationale
            <textarea
              required
              minLength={10}
              className={field}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
          </label>
          <button className={button}>
            Send benchmark to General Coordinator
          </button>
          <p className="text-xs">
            Requires an approved theme and no issued briefs. Receipt is
            recorded; the restricted dossier is held by the General Coordinator
            until the combined board review.
          </p>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          {ledger.curation?.benchmarks?.map((x) => (
            <article key={x.id}>
              <strong>{x.name}</strong>
              <p className="text-sm">{x.rationale}</p>
              <p className="text-xs text-[#655D50]">
                {x.assigned
                  ? "Reserved for the combined Defense Board"
                  : "Awaiting spatial allocation"}
              </p>
            </article>
          ))}
          {!pending.length ? (
            <p className="text-sm">No benchmarks awaiting allocation.</p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  run({
                    action: "CURATE_ASSIGN_SEED",
                    id: seed,
                    galleryId: gallery,
                    areaM2: Number(area),
                    costMinor: Math.round(Number(budget) * 100),
                  })
                ) {
                  setSeed("");
                  setArea("");
                  setBudget("");
                }
              }}
            >
              <label className="block text-sm">
                Benchmark
                <select
                  required
                  className={field}
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                >
                  <option value="">Choose a benchmark</option>
                  {pending.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Premier gallery
                <select
                  required
                  className={field}
                  value={gallery}
                  onChange={(e) => setGallery(e.target.value)}
                >
                  <option value="">Choose an authorized gallery</option>
                  {ledger.galleries
                    .filter(
                      (g) =>
                        g.active &&
                        ledger.venues.some(
                          (v) => v.id === g.venueId && v.active,
                        ),
                    )
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  Reserved footprint (m²)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    className={field}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  Budget reservation (AED)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    className={field}
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </label>
              </div>
              <button className={button}>Reserve benchmark space</button>
            </form>
          )}
        </div>
      )}
    </details>
  );
}
