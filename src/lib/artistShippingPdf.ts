import { latestPreDispatch } from "./preTransit";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { Work } from "./artistCare";
import { shippingReadiness } from "./artistFreight";
export async function artistShippingPdf(work: Work): Promise<ArrayBuffer> {
  const reason = shippingReadiness(work);
  if (reason) throw Object.assign(new Error(reason), { status: 409 });
  // The prototype label uses ASCII identifiers; bilingual descriptive metadata stays in the linked JSON record.
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(work.id))
    throw new Error("Unsupported artwork identifier for the crate label.");
  const pdf = new jsPDF();
  pdf.setFontSize(22);
  pdf.text("SADU | Crate identification", 18, 25);
  pdf.setFontSize(10);
  pdf.text("LOCAL PROTOTYPE - NOT SHIPPING OR CUSTOMS AUTHORIZATION", 18, 36);
  pdf.text(`Artwork: ${work.id}`, 18, 52);
  pdf.text(`Revision: ${work.revision}`, 18, 62);
  pdf.text(
    `Packages: ${work.freight!.packageCount} | Gross weight: ${work.freight!.grossWeightKg} kg`,
    18,
    72,
  );
  pdf.text("Attach the reviewed shipment instructions separately.", 18, 82);
  const qr = await QRCode.toDataURL(work.id, { width: 500, margin: 4 });
  pdf.addImage(qr, "PNG", 50, 95, 110, 110);
  const report = latestPreDispatch(work)!;
  pdf.setFontSize(8);
  pdf.text("Pre-dispatch report SHA-256:", 18, 230);
  pdf.text(pdf.splitTextToSize(report.hash, 170), 18, 238);
  pdf.text(
    "Hashes verify recorded file integrity, not physical condition or legal liability.",
    18,
    264,
  );
  return pdf.output("arraybuffer");
}
