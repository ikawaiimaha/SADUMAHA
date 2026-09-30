import type { Ledger } from "./spatialLedger";

/** Server response projection; the browser simulator also uses it for visible role views. */
export function projectCuratorialLedger(source: Ledger, role: string): Ledger {
  const s = structuredClone(source);
  const b = s.curation;
  if (!b?.benchmarks?.length) return s;
  const full =
    role === "General_Exhibition_Coordinator" ||
    ((role === "Committee" || role === "Director") && b.phase !== "DRAFT");
  if (full) return s;
  const ids = new Set(b.benchmarks.map((x) => x.id));
  const slots = new Set(b.slots.filter((x) => x.restricted).map((x) => x.id));
  // Expose remaining capacity, never restricted identities or their allocation details.
  for (const g of s.galleries) {
    const reserved = b.slots.filter(
      (x) => x.restricted && x.galleryId === g.id,
    );
    g.maxWorks -= reserved.length;
    g.usableM2 -= reserved.reduce((n, x) => n + x.areaM2, 0);
  }
  s.block.budgetMinor -= b.slots
    .filter((x) => x.restricted)
    .reduce((n, x) => n + x.budgetMinor, 0);
  b.benchmarks = [];
  b.slots = b.slots.filter((x) => !x.restricted);
  b.nominations = b.nominations.filter((x) => !slots.has(x.slotId));
  // Prior boards may contain previously allocated restricted identities.
  b.snapshots = [];
  s.artworks = s.artworks.filter((x) => !ids.has(x.id));
  s.decisions = [];
  return s;
}
