import { useEffect, useState } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import { type ArtistCraft, conceptualAnchors } from "../lib/artistCraft";
import { loadArtistMedia } from "../lib/artistMedia";
import { careInput, MediaUpload } from "./ArtistSubmission";
export const emptyCraft: ArtistCraft = {
  lineage: 50,
  lineageRationale: "",
  anchors: [],
  substrate: "",
  pigment: "",
  method: "",
};
export function ArtistCraftFields({
  value,
  onChange,
}: {
  value: ArtistCraft;
  onChange: (v: ArtistCraft) => void;
}) {
  const [custom, setCustom] = useState("");
  const change = (patch: Partial<ArtistCraft>) =>
    onChange({ ...value, ...patch });
  const words = value.lineageRationale
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#655D50]">
        Describe your own practice. These details are context, not a quality
        score or an automatic selection rule.
      </p>
      <label className="block text-sm">
        Lineage position · {value.lineage}
        <input
          className="mt-3 w-full accent-[#8B261E]"
          type="range"
          min="0"
          max="100"
          step="1"
          value={value.lineage}
          onChange={(e) => change({ lineage: Number(e.target.value) })}
        />
      </label>
      <div className="flex justify-between gap-4 text-xs">
        <span>0 · Classical tradition</span>
        <span>100 · Experimental practice</span>
      </div>
      <label className="block text-sm">
        How does this placement honor or challenge traditional boundaries?
        <textarea
          className={careInput}
          rows={2}
          maxLength={1000}
          value={value.lineageRationale}
          onChange={(e) => change({ lineageRationale: e.target.value })}
        />
      </label>
      <p className={words > 50 ? "text-sm text-red-800" : "text-xs"}>
        {words} / 50 words
      </p>
      <fieldset>
        <legend className="text-sm font-medium">
          Conceptual anchors · choose up to six
        </legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {Array.from(new Set([...conceptualAnchors, ...value.anchors])).map(
            (tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 rounded-full border border-[#DED5C4] px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={value.anchors.includes(tag)}
                  disabled={
                    !value.anchors.includes(tag) && value.anchors.length >= 6
                  }
                  onChange={(e) =>
                    change({
                      anchors: e.target.checked
                        ? [...value.anchors, tag]
                        : value.anchors.filter((x) => x !== tag),
                    })
                  }
                />
                {tag}
              </label>
            ),
          )}
        </div>
        <label className="block mt-3 text-sm">
          Your own anchor
          <input
            className={careInput}
            value={custom}
            maxLength={80}
            onChange={(e) => setCustom(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="mt-2 text-sm underline"
          disabled={!custom.trim() || value.anchors.length >= 6}
          onClick={() => {
            change({
              anchors: Array.from(new Set([...value.anchors, custom.trim()])),
            });
            setCustom("");
          }}
        >
          Add anchor
        </button>
      </fieldset>
      <div className="grid gap-4 md:grid-cols-3">
        {(
          [
            ["substrate", "Substrate / support"],
            ["pigment", "Pigment / surface material"],
            ["method", "Tool / method"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm">
            {label}
            <input
              className={careInput}
              maxLength={300}
              value={value[key]}
              onChange={(e) => change({ [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-[#655D50]">
        Use the material response above to explain why these choices matter.
        Your wording stays attributed to you.
      </p>
      <details>
        <summary className="cursor-pointer text-sm">
          Structural comparison · optional paired images
        </summary>
        <p className="mt-3 text-sm">
          Upload a final view and its aligned structural grid with identical
          pixel dimensions. Equal dimensions do not guarantee alignment; check
          your preview. No grid is required for work that does not use one.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {(["final", "grid"] as const).map((key) => (
            <div key={key}>
              <MediaUpload
                image
                label={
                  key === "final"
                    ? "Final artwork comparison image"
                    : "Structural grid / Tashir image"
                }
                onFile={(file) =>
                  change({
                    comparison: {
                      ...value.comparison,
                      [key]: file,
                    } as ArtistCraft["comparison"],
                  })
                }
              />
              {value.comparison?.[key] && (
                <p className="text-xs">{value.comparison[key].name}</p>
              )}
            </div>
          ))}
        </div>
        {value.comparison && (
          <>
            <button
              type="button"
              className="mt-3 text-sm underline"
              onClick={() => change({ comparison: undefined })}
            >
              Remove comparison from proposal
            </button>
            <CraftComparison craft={value} />
          </>
        )}
      </details>
    </div>
  );
}
export function CraftComparison({ craft }: { craft: ArtistCraft }) {
  const pair = craft.comparison;
  const [urls, setUrls] = useState<string[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    const created: string[] = [];
    setUrls([]);
    setError("");
    if (pair?.final && pair?.grid)
      void Promise.all([
        loadArtistMedia(pair.final.id),
        loadArtistMedia(pair.grid.id),
      ])
        .then((blobs) => {
          if (disposed) return;
          created.push(...blobs.map((b) => URL.createObjectURL(b)));
          setUrls(created);
        })
        .catch(() => {
          if (!disposed)
            setError("Comparison images are unavailable on this device.");
        });
    return () => {
      disposed = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [pair?.final?.id, pair?.grid?.id]);
  if (!pair) return null;
  if (
    !pair.final ||
    !pair.grid ||
    pair.final.width !== pair.grid.width ||
    pair.final.height !== pair.grid.height
  )
    return (
      <p role="status" className="mt-3 text-sm text-[#8B261E]">
        Both images must have identical pixel dimensions before submission.
      </p>
    );
  return (
    <figure className="mt-4 space-y-2">
      {error ? (
        <p role="status">{error}</p>
      ) : urls.length === 2 ? (
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src={urls[0]}
              alt="Artist's final artwork"
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              src={urls[1]}
              alt="Artist's structural grid"
            />
          }
        />
      ) : (
        <p>Loading comparison…</p>
      )}
      <figcaption className="text-xs">
        Final artwork / structural grid · drag the divider or use its keyboard
        controls. Artist-provided study, not automated geometric verification.
      </figcaption>
    </figure>
  );
}
