import type { MediaRef } from "./artistCare";
export type ArtistCraft = {
  lineage: number;
  lineageRationale: string;
  anchors: string[];
  substrate: string;
  pigment: string;
  method: string;
  comparison?: { final: MediaRef; grid: MediaRef };
};
export const conceptualAnchors = [
  "Urban Identity",
  "Spiritual Topography",
  "Geometry & Infinity",
  "Displacement",
];
export function validateCraft(value: ArtistCraft): ArtistCraft {
  if (
    !value ||
    !Number.isInteger(value.lineage) ||
    value.lineage < 0 ||
    value.lineage > 100
  )
    throw new Error("Choose a lineage position from 0 to 100.");
  const note = value.lineageRationale;
  if (
    typeof note !== "string" ||
    !note.trim() ||
    note.trim().split(/\s+/u).length > 50 ||
    note.length > 1000
  )
    throw new Error("Explain your lineage position in 1–50 words.");
  for (const key of ["substrate", "pigment", "method"] as const)
    if (
      typeof value[key] !== "string" ||
      !value[key].trim() ||
      value[key].length > 300
    )
      throw new Error(
        "Describe substrate, pigment and tool / method (up to 300 characters each).",
      );
  if (
    !Array.isArray(value.anchors) ||
    value.anchors.length > 6 ||
    value.anchors.some(
      (x) => typeof x !== "string" || !x.trim() || x.length > 80,
    ) ||
    new Set(value.anchors).size !== value.anchors.length
  )
    throw new Error(
      "Choose up to six distinct conceptual anchors, each up to 80 characters.",
    );
  const pair = value.comparison;
  if (
    pair &&
    (!pair.final ||
      !pair.grid ||
      ![pair.final, pair.grid].every(
        (x) =>
          x.type?.startsWith("image/") &&
          Number.isInteger(x.width) &&
          Number.isInteger(x.height) &&
          x.width! > 0 &&
          x.height! > 0 &&
          x.bytes > 0 &&
          /^[a-f0-9]{64}$/i.test(x.hash) &&
          !!x.id,
      ) ||
      pair.final.width !== pair.grid.width ||
      pair.final.height !== pair.grid.height)
  )
    throw new Error(
      "Upload both final artwork and structural grid with identical pixel dimensions.",
    );
  return {
    lineage: value.lineage,
    lineageRationale: note,
    anchors: [...value.anchors],
    substrate: value.substrate,
    pigment: value.pigment,
    method: value.method,
    ...(pair ? { comparison: structuredClone(pair) } : {}),
  };
}
