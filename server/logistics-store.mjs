import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ReviewError } from './review-store.mjs';
export const PHYSICAL_STATUSES = Object.freeze(['Pending_Shipment', 'In_Transit', 'Customs_Clearance', 'On_Site_Sharjah', 'Installed']);
const fail = (status, message) => { throw new ReviewError(status, message); };
const required = (v, max = 180) => typeof v === 'string' && v.trim().length > 0 && v.length <= max && /^[\x20-\x7e]+$/.test(v);
function authorize(actor) {
  if (!actor || actor.exhibitionId !== 'demo-exhibition' || !['Artist', 'General_Exhibition_Coordinator'].includes(actor.role) || (actor.role === 'Artist' && actor.artistId !== 'demo-kufic-horizon')) fail(403, 'Only the assigned artist and Coordinator can access this shipment.');
}
export function shippingManifest(record) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22); pdf.text('SADU | Shipping Manifest', 18, 23);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.text('FICTIONAL LOCAL REHEARSAL - NOT A CUSTOMS OR SHIPPING AUTHORIZATION', 18, 33);
  let y = 48;
  const rows = [['Artist', record.artist_name], ['Artwork', record.title], ['Artwork Record ID', record.id], ['Approved revision', String(record.approved_revision)], ['Collection point', record.logistics.origin], ['Delivery point', record.logistics.destination], ['Carrier / reference', record.logistics.carrier], ['Package', `1 of 1 - ${record.logistics.gross_weight_kg} kg gross`], ['Handling', record.logistics.handling]];
  for (const [label, value] of rows) {
    pdf.setFont('helvetica', 'bold'); pdf.text(label, 18, y);
    pdf.setFont('helvetica', 'normal'); const lines = pdf.splitTextToSize(value, 120);
    pdf.text(lines, 70, y); y += Math.max(9, lines.length * 4.5 + 4);
  }
  const qr = QRCode.create(record.id, { errorCorrectionLevel: 'M' });
  const size = 76, x = 67, top = 173, unit = size / (qr.modules.size + 8);
  pdf.setFillColor(0, 0, 0);
  for (let r = 0; r < qr.modules.size; r++) for (let c = 0; c < qr.modules.size; c++) if (qr.modules.get(r, c)) pdf.rect(x + (c + 4) * unit, top + (r + 4) * unit, unit, unit, 'F');
  pdf.setFontSize(10); pdf.text(record.id, 105, 259, { align: 'center' });
  pdf.text('Scan on the Coordinator crate-tracking screen, or type this ID.', 105, 267, { align: 'center' });
  pdf.setFontSize(9); pdf.text('Receipt does not confirm condition, customs clearance, installation safety or payment.', 18, 282);
  return Buffer.from(pdf.output('arraybuffer'));
}
export async function openLogisticsStore(file, reviewFor) {
  await mkdir(dirname(file), { recursive: true });
  let state;
  try { state = JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; state = { format: 1, version: 0, artwork_records: [], events: [] }; }
  if (state.format !== 1 || !Array.isArray(state.artwork_records)) throw new Error('Unsupported logistics store.');
  let queue = Promise.resolve();
  const read = actor => { authorize(actor); return structuredClone(state); };
  return {
    read,
    manifest(actor, id) {
      authorize(actor); const record = state.artwork_records.find(r => r.id === id);
      if (!record) fail(404, 'Unknown artwork ID.');
      const revision = reviewFor(actor).revisions.at(-1);
      if (revision?.status !== 'Publication_Approved' || revision.number !== record.approved_revision) fail(409, 'The artwork revision changed. Update its shipment record after approval before printing.');
      return shippingManifest(record);
    },
    act(actor, command) {
      const result = queue.then(async () => {
        authorize(actor);
        if (!command || command.version !== state.version) fail(409, 'Shipment changed. Reload before recording.');
        const next = structuredClone(state); let record;
        if (command.action === 'save') {
          if (actor.role !== 'Artist') fail(403, 'Only the artist supplies shipment details.');
          const revision = reviewFor(actor).revisions.at(-1);
          if (revision?.status !== 'Publication_Approved' || !revision.content.label) fail(409, 'A Director-approved artwork with label metadata is required.');
          const details = command.logistics;
          if (!details || !['origin','destination','carrier','handling'].every(k => required(details[k], 150)) || typeof details.gross_weight_kg !== 'number' || !Number.isFinite(details.gross_weight_kg) || details.gross_weight_kg <= 0 || details.gross_weight_kg > 100000) fail(422, 'Provide collection, delivery, carrier/reference, handling and positive gross package weight. Use basic Latin text, maximum 150 characters per field.');
          record = next.artwork_records[0];
          if (record && record.physical_status !== 'Pending_Shipment') fail(409, 'Shipment details are frozen after movement begins.');
          record = { id: record?.id ?? randomUUID(), artist_id: 'demo-kufic-horizon', exhibition_id: 'demo-exhibition', artist_name: revision.content.label.artistName, title: revision.content.title, approved_revision: revision.number, physical_status: 'Pending_Shipment', logistics: Object.fromEntries(['origin','destination','carrier','handling','gross_weight_kg'].map(k => [k, typeof details[k] === 'string' ? details[k].trim() : details[k]])) };
          next.artwork_records = [record];
        } else {
          if (actor.role !== 'General_Exhibition_Coordinator') fail(403, 'Only the assigned Coordinator can record physical movement.');
          if (typeof command.artwork_id !== 'string') fail(422, 'Scan or enter an artwork ID.');
          record = next.artwork_records.find(r => r.id === command.artwork_id.trim());
          if (!record) fail(404, 'Unknown artwork ID. No status was changed.');
          const target = command.action === 'arrive' ? 'On_Site_Sharjah' : command.action === 'status' ? command.physical_status : null;
          if (!target || !PHYSICAL_STATUSES.includes(target)) fail(422, 'Unknown physical status.');
          if (!required(command.note, 300)) fail(422, 'Record the observation and location (maximum 300 basic Latin characters).');
          if (record.physical_status === target) return read(actor); // Repeated scans do not duplicate receipt events.
          const allowed = { Pending_Shipment: ['In_Transit','On_Site_Sharjah'], In_Transit: ['Customs_Clearance','On_Site_Sharjah'], Customs_Clearance: ['On_Site_Sharjah'], On_Site_Sharjah: ['Installed'], Installed: [] };
          if (!allowed[record.physical_status].includes(target)) fail(409, 'This movement would skip a required arrival or regress an existing status.');
          const previous = record.physical_status; record.physical_status = target;
          next.events.push({ id: randomUUID(), artwork_id: record.id, from: previous, to: target, note: command.note.trim(), actor_id: actor.id, at: new Date().toISOString() });
        }
        if (command.action === 'save') next.events.push({ id: randomUUID(), artwork_id: record.id, action: 'Shipment_Details_Saved', actor_id: actor.id, at: new Date().toISOString(), previous: state.artwork_records[0] ?? null });
        next.version++;
        const temp = `${file}.${randomUUID()}.tmp`; await writeFile(temp, JSON.stringify(next, null, 2), { mode: 0o600 }); await rename(temp, file); state = next; return read(actor);
      });
      queue = result.catch(() => {}); return result;
    },
  };
}
