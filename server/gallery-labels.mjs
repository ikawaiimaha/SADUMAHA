import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { createHash } from 'node:crypto';
import { isDimension } from '../src/spatial/geometry.mjs';

export const DEFAULT_CMS_BASE_URL = 'https://sdc.gov.ae/en/biennial2026/artist/';
export function dynamicTestProfileUrl(artistId, baseUrl = DEFAULT_CMS_BASE_URL) {
  if (typeof artistId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(artistId)) throw new Error('Artist ID must be a stable URL-safe identifier.');
  const base = canonicalProfileUrl(baseUrl);
  return canonicalProfileUrl(`${base.endsWith('/') ? base : `${base}/`}${encodeURIComponent(artistId)}`);
}

export function canonicalProfileUrl(value) {
  if (typeof value !== 'string' || value.length > 256) throw new Error('Use a profile URL of at most 256 characters.');
  let url; try { url = new URL(value); } catch { throw new Error('Enter an absolute HTTPS SDC profile URL.'); }
  if (url.protocol !== 'https:' || !['sdc.gov.ae', 'www.sdc.gov.ae'].includes(url.hostname) || url.port || url.username || url.password || url.search || url.hash || url.pathname === '/') throw new Error('Use an exact HTTPS profile page on sdc.gov.ae or www.sdc.gov.ae, without credentials, query parameters or fragments.');
  return url.href;
}
const printable = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max && /^[\x20-\x7e]+$/.test(value);
export function validateLabelContent(content) {
  const label = content?.label;
  if (!printable(content?.title, 200) || !printable(label?.artistName, 120)) throw new Error('This English label template requires an artist name and title in printable basic Latin characters (120/200 characters maximum).');
  if (!isDimension(label.width_cm) || !isDimension(label.height_cm)) throw new Error('Positive label width and height in centimetres are required.');
  if (!Number.isInteger(label.year) || label.year < 1000 || label.year > 9999) throw new Error('A four-digit artwork year is required.');
  if (label.profileUrl) canonicalProfileUrl(label.profileUrl);
}
export function labelSnapshot({ artistId, revision, approvalId, content, profileVerification, labelOptions = {} }) {
  validateLabelContent(content);
  const requested = content.label.profileUrl ? canonicalProfileUrl(content.label.profileUrl) : null;
  const verified = requested && profileVerification?.url === requested && profileVerification?.actorRole === 'General_Exhibition_Coordinator' && profileVerification?.note?.trim();
  const testUrl = !verified && labelOptions.testMode === true ? dynamicTestProfileUrl(artistId, labelOptions.baseUrl) : null;
  return { id: `label-${approvalId}`, artistId, revision, approvalId, artistName: content.label.artistName.trim(), title: content.title.trim(),
    width_cm: content.label.width_cm, height_cm: content.label.height_cm, year: content.label.year,
    qrUrl: verified ? requested : testUrl, status: verified ? 'Ready' : testUrl ? 'Test_Ready' : 'Draft_No_QR', templateVersion: 1 };
}
function renderPage(pdf, label) {
  pdf.setTextColor(139, 38, 30); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text('SADU', 10, 12);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.text(label.status === 'Test_Ready' ? 'TEST URL - NOT LIVE-VERIFIED' : 'FICTIONAL REHEARSAL - NOT FOR EXHIBITION USE', 140, 12, { align: 'right' });
  pdf.setDrawColor(217, 206, 186); pdf.line(10, 16, 140, 16); pdf.setTextColor(32, 32, 32);
  pdf.setFontSize(12); const artist = pdf.splitTextToSize(label.artistName, 84);
  if (artist.length > 2) throw new Error('Artist name exceeds the two-line label area. Use the approved display name.');
  pdf.text(artist, 10, 25);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16);
  let title = pdf.splitTextToSize(label.title, 84);
  if (title.length > 3) { pdf.setFontSize(12); title = pdf.splitTextToSize(label.title, 84); }
  if (title.length > 3) throw new Error('Artwork title exceeds the three-line label area. Shorten the approved label title before approval.');
  pdf.text(title, 10, 41, { lineHeightFactor: 1.25 });
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text(`${label.height_cm} x ${label.width_cm} cm (H x W)`, 10, 67);
  pdf.text(String(label.year), 10, 75);
  const x = 104, y = 32, size = 36;
  if (label.qrUrl) {
    const qr = QRCode.create(label.qrUrl, { errorCorrectionLevel: 'M' });
    const unit = size / (qr.modules.size + 8); // Four-module quiet zone on every edge.
    pdf.setFillColor(255, 255, 255); pdf.rect(x, y, size, size, 'F'); pdf.setFillColor(0, 0, 0);
    for (let row = 0; row < qr.modules.size; row++) for (let col = 0; col < qr.modules.size; col++) {
      if (qr.modules.get(row, col)) pdf.rect(x + (col + 4) * unit, y + (row + 4) * unit, unit, unit, 'F');
    }
    pdf.link(x, y, size, size, { url: label.qrUrl }); pdf.setFontSize(8); pdf.text(label.status === 'Test_Ready' ? 'Test profile URL' : 'Artist profile', x + size / 2, 74, { align: 'center' });
  } else {
    pdf.setDrawColor(160, 160, 160); pdf.rect(x, y, size, size); pdf.setFontSize(8);
    pdf.text(['QR pending', 'Profile verification', 'not recorded'], x + size / 2, y + 14, { align: 'center', lineHeightFactor: 1.5 });
    pdf.setTextColor(139, 38, 30); pdf.setFontSize(9); pdf.text('DRAFT - QR NOT VERIFIED', 10, 85);
  }
  pdf.setTextColor(90, 90, 90); pdf.setFontSize(6.5);
  pdf.text(`Revision ${label.revision} | Label ${label.id} | Template ${label.templateVersion}`, 10, 94);
}
export function renderLabelBatch(labels) {
  if (!Array.isArray(labels) || !labels.length || labels.length > 100) throw new Error('A batch requires 1-100 labels.');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [150, 100], compress: true, precision: 5 });
  pdf.setProperties({ title: 'SADU fictional gallery labels', subject: '150 x 100 mm; print at actual size; fictional rehearsal' });
  labels.forEach((label, index) => { if (index) pdf.addPage([150, 100], 'landscape'); renderPage(pdf, label); });
  return Buffer.from(pdf.output('arraybuffer'));
}
export async function generateLabelArtifact(input) {
  const snapshot = labelSnapshot(input); const bytes = renderLabelBatch([snapshot]);
  return { ...snapshot, snapshot, pdfBase64: bytes.toString('base64'), sha256: createHash('sha256').update(bytes).digest('hex'), byteLength: bytes.length };
}
