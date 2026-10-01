import { preTransitHold, latestPreDispatch } from "./preTransit";
import type { ArtistCare, CareInvitation, MediaRef, Work } from "./artistCare";
export type FreightDetails = {
  originCountry: string;
  pickupCountry: string;
  pickupCity: string;
  pickupAddress: string;
  latitude: number;
  longitude: number;
  readyFrom: string;
  readyUntil: string;
  handling: "STANDARD_ART" | "CLIMATE_CONTROLLED" | "SPECIALIST";
  medium: string;
  customsValueMinor: number;
  currency: string;
  grossWeightKg: number;
  packageCount: number;
  regime:
    | "UNCONFIRMED"
    | "TEMPORARY_IMPORT"
    | "ATA_CARNET"
    | "PERMANENT_IMPORT_REVIEW";
  carnetReference?: string;
  reexportBy?: string;
};
export type ConditionStage = "PRE_DISPATCH" | "ARRIVAL" | "DEINSTALLATION";
export type ConditionSnapshot = {
  freightRevision?: number;
  id: string;
  stage: ConditionStage;
  revision: number;
  actorId: string;
  at: string;
  note: string;
  damage: boolean;
  photos: MediaRef[];
  previousHash: string | null;
  hash: string;
  acknowledgement: boolean;
};
const fail = (message: string) => {
  throw Object.assign(new Error(message), { status: 422 });
};
export function validateFreight(d: FreightDetails): FreightDetails {
  if (
    !d ||
    ![
      "originCountry",
      "pickupCountry",
      "pickupCity",
      "pickupAddress",
      "medium",
    ].every(
      (k) => typeof d[k] === "string" && d[k].trim() && d[k].length <= 500,
    )
  )
    fail("Complete origin, pickup address and reviewed medium description.");
  if (
    !/^[A-Z]{2}$/.test(d.originCountry) ||
    !/^[A-Z]{2}$/.test(d.pickupCountry)
  )
    fail("Use two-letter country codes for origin and pickup.");
  if (
    ![d.latitude, d.longitude].every(Number.isFinite) ||
    Math.abs(d.latitude) > 90 ||
    Math.abs(d.longitude) > 180
  )
    fail("Enter valid pickup coordinates.");
  const date = (v: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v;
  if (!date(d.readyFrom) || !date(d.readyUntil) || d.readyUntil < d.readyFrom)
    fail("Enter a valid collection window.");
  if (
    !Number.isSafeInteger(d.customsValueMinor) ||
    d.customsValueMinor <= 0 ||
    !/^[A-Z]{3}$/.test(d.currency) ||
    !Number.isFinite(d.grossWeightKg) ||
    d.grossWeightKg <= 0 ||
    !Number.isInteger(d.packageCount) ||
    d.packageCount < 1
  )
    fail(
      "Provide customs value, currency, positive gross weight and package count.",
    );
  if (
    !["STANDARD_ART", "CLIMATE_CONTROLLED", "SPECIALIST"].includes(
      d.handling,
    ) ||
    ![
      "UNCONFIRMED",
      "TEMPORARY_IMPORT",
      "ATA_CARNET",
      "PERMANENT_IMPORT_REVIEW",
    ].includes(d.regime)
  )
    fail("Choose a supported handling and customs review state.");
  if (
    d.regime === "ATA_CARNET" &&
    (!d.carnetReference?.trim() ||
      !d.reexportBy ||
      !date(d.reexportBy) ||
      d.reexportBy < d.readyUntil)
  )
    fail(
      "Record the Carnet reference and a re-export deadline after the collection window.",
    );
  return Object.fromEntries(
    [
      "originCountry",
      "pickupCountry",
      "pickupCity",
      "pickupAddress",
      "latitude",
      "longitude",
      "readyFrom",
      "readyUntil",
      "handling",
      "medium",
      "customsValueMinor",
      "currency",
      "grossWeightKg",
      "packageCount",
      "regime",
      "carnetReference",
      "reexportBy",
    ].map((k) => [k, d[k]]),
  ) as FreightDetails;
}
export function customsExport(invitation: CareInvitation, w: Work) {
  if (w.state !== "APPROVED" || !w.freight)
    fail("Approved artwork and completed freight details are required.");
  const hold = preTransitHold(w);
  if (hold) throw Object.assign(new Error(hold), { status: 409 });
  const f = validateFreight(w.freight);
  return {
    schemaVersion: 1,
    status: "DRAFT_FOR_BROKER_REVIEW",
    artworkId: w.id,
    revision: w.revision,
    artist: invitation.name,
    title: w.title,
    dimensionsCm: { width: w.width, height: w.height, depth: w.depth },
    netWeightKg: w.weight || null,
    medium: f.medium,
    countryOfOrigin: f.originCountry,
    declaredInsuranceValue: { amountMinor: w.insuranceMinor, currency: "AED" },
    customsValue: { amountMinor: f.customsValueMinor, currency: f.currency },
    pickup: {
      country: f.pickupCountry,
      city: f.pickupCity,
      address: f.pickupAddress,
    },
    destination: invitation.venue,
    packages: f.packageCount,
    grossWeightKg: f.grossWeightKg,
    proposedRegime: f.regime,
    carnetReference: f.carnetReference ?? null,
    reexportBy: f.reexportBy ?? null,
    missingForBroker: [
      ...(!w.weight ? ["Verified net artwork weight"] : []),
      "HS classification",
      "Exporter / importer registration",
      "Customs valuation basis",
      "Permit and port requirements",
      "Broker approval",
    ],
    notice:
      "Draft data only. Not a customs declaration, Carnet application, tax exemption or clearance. Insurance value is not substituted for customs value.",
  };
}
export function shippingReadiness(w: Work): string | null {
  if (w.state !== "APPROVED") return "Director approval is required.";
  const hold = preTransitHold(w);
  if (hold) return hold;
  if (!w.freight) return "Complete the freight and customs draft first.";
  try {
    validateFreight(w.freight);
  } catch (e) {
    return (e as Error).message;
  }
  if (w.freight.regime === "PERMANENT_IMPORT_REVIEW")
    return "Acquisition / permanent import requires broker review before shipping documents are regenerated.";
  const report = latestPreDispatch(w);
  if (!report)
    return "Record the current revision’s pre-dispatch condition photographs and acknowledgement first.";

  return null;
}
function distance(a: FreightDetails, b: FreightDetails) {
  const r = Math.PI / 180,
    dlat = (b.latitude - a.latitude) * r,
    dlon = (b.longitude - a.longitude) * r;
  const v =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.latitude * r) *
      Math.cos(b.latitude * r) *
      Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(Math.max(0, 1 - v)));
}
export function consolidationCandidates(state: ArtistCare) {
  const rows = state.invitations
    .flatMap((i) =>
      i.works
        .filter(
          (w) =>
            w.state === "APPROVED" &&
            w.freight &&
            !preTransitHold(w) &&
            !w.condition &&
            !w.returnAt &&
            w.freight.regime !== "PERMANENT_IMPORT_REVIEW",
        )
        .map((w) => ({ invitation: i, work: w })),
    )
    .sort((a, b) => a.work.id.localeCompare(b.work.id));
  const groups: (typeof rows)[] = [];
  for (const row of rows) {
    const f = row.work.freight!;
    if (f.handling === "SPECIALIST") continue;
    const group = groups.find(
      (g) =>
        g.every(
          (x) =>
            x.invitation.venue === row.invitation.venue &&
            x.work.freight!.pickupCountry === f.pickupCountry &&
            x.work.freight!.handling === f.handling &&
            x.work.freight!.regime === f.regime &&
            distance(x.work.freight!, f) <= 150,
        ) &&
        Math.max(
          Date.parse(f.readyFrom),
          ...g.map((x) => Date.parse(x.work.freight!.readyFrom)),
        ) <=
          Math.min(
            Date.parse(f.readyUntil),
            ...g.map((x) => Date.parse(x.work.freight!.readyUntil)),
          ),
    );
    if (group) group.push(row);
    else groups.push([row]);
  }
  return groups
    .filter((g) => g.length > 1)
    .map((g) => ({
      workIds: g.map((x) => x.work.id),
      cities: [...new Set(g.map((x) => x.work.freight!.pickupCity))],
      destination: g[0].invitation.venue,
      handling: g[0].work.freight!.handling,
      collectionFrom: g
        .map((x) => x.work.freight!.readyFrom)
        .sort()
        .at(-1)!,
      collectionUntil: g.map((x) => x.work.freight!.readyUntil).sort()[0],
      grossWeightKg: g.reduce((n, x) => n + x.work.freight!.grossWeightKg, 0),
      status: "CANDIDATE_REQUIRES_CARRIER_QUOTE",
      savingsPercent: null,
    }));
}
