import { jsPDF } from 'jspdf';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const snapshotHash = value => sha256(JSON.stringify(value));

/** Fixed allowlist: never include raw communications, passport or banking payloads. */
export function archivalSnapshot(state, artwork, revision, closedAt) {
  const agreement = state.agreement;
  return {
    format: 1, dossierId: artwork.id, exhibitionId: artwork.exhibitionId, closedAt,
    artwork: { revisionId: revision.id, versionHash: revision.versionHash, artistName: revision.artistName,
      title: revision.title, description: revision.description, width_cm: revision.width_cm,
      height_cm: revision.height_cm, year: revision.year, file_hash: revision.media.file_hash },
    contract: { revisionId: agreement.revisionId, amountMinor: agreement.amountMinor,
      tranches: agreement.tranches, accepted: agreement.accepted },
    decisions: state.decisions.filter(d => d.targetId === artwork.id).map(d => ({ id:d.id,actorId:d.actorId,at:d.at,action:d.action,versionHash:d.versionHash })),
    conditionReports: (state.conditionPins ?? []).filter(p => p.artworkId === artwork.id).map(p => ({ id:p.id,revisionId:p.revisionId,referenceImageHash:p.referenceImageHash,x_pct:p.x_pct,y_pct:p.y_pct,description:p.description,photoHash:p.photo.file_hash,actorId:p.actorId,at:p.at })),
    returnClearance: { revisionId:state.returnClearance.revisionId,actorId:state.returnClearance.actorId,at:state.returnClearance.at },
    payments: state.payments.map(p => ({ tranche:p.tranche,amountMinor:p.amountMinor,actorId:p.actorId,at:p.at })),
  };
}

export function generateArchivalPdf(snapshot, referenceImage) {
  if (sha256(referenceImage) !== snapshot.artwork.file_hash) throw new Error('Archive reference image hash mismatch.');
  const pdf = new jsPDF({ unit:'mm',format:'a4',compress:true });
  pdf.addFileToVFS('Amiri.ttf',readFileSync(new URL('./fonts/Amiri-Regular.ttf',import.meta.url)).toString('base64'));
  pdf.addFont('Amiri.ttf','Amiri','normal');
  const recordHash = snapshotHash(snapshot); let y=25;
  const page = title => { if (y!==25) pdf.addPage(); y=25; pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text(title,18,y); y+=14; };
  const line = (value,arabic=false) => {
    pdf.setFont(arabic?'Amiri':'helvetica','normal');pdf.setFontSize(arabic?13:10);
    const lines=pdf.splitTextToSize(String(value??'Not recorded'),174);
    for(const text of lines){if(y>254){pdf.addPage();y=25;}pdf.text(text,arabic?192:18,y,arabic?{align:'right'}:{});y+=7;}
  };
  page('1. Executive summary');
  line('SADU / Master archival record / Local fictional pilot');
  line(`Dossier: ${snapshot.dossierId}`);line(`Closed: ${snapshot.closedAt}`);
  line(snapshot.artwork.artistName.en);line(snapshot.artwork.artistName.ar,true);
  line(snapshot.artwork.title.en);line(snapshot.artwork.title.ar,true);
  line(snapshot.artwork.description.en);line(snapshot.artwork.description.ar,true);
  line(`${snapshot.artwork.height_cm} x ${snapshot.artwork.width_cm} cm (H x W) / ${snapshot.artwork.year}`);
  line(`Agreement: AED ${(snapshot.contract.amountMinor/100).toFixed(2)} / Accepted: ${snapshot.contract.accepted}`);
  line(`Agreement revision: ${snapshot.contract.revisionId}`);
  line('Simulated agreement acceptance; not a legal signature.');
  page('2. Immutable audit trail');
  line('Frozen operational metadata at closure; not a digitally signed audit certification.');
  for(const d of snapshot.decisions){if(y>229){pdf.addPage();y=25;}line(`${d.at} | ${d.actorId}`);line(d.action);line(`Revision hash: ${d.versionHash}`);}
  page('3. Logistics and condition');
  for(const d of snapshot.decisions.filter(d=>['ARRIVAL_RECORDED','SYNTHETIC_LOCATION_TEST'].includes(d.action)))line(`${d.action}: ${d.at} / ${d.actorId}`);
  line(`Return reconciled: ${snapshot.returnClearance.at} / ${snapshot.returnClearance.actorId}`);
  line('Visual provenance map: numbered observations on the archived reference image.');
  if(y>155){pdf.addPage();y=25;}
  const imageY=y, properties=pdf.getImageProperties(referenceImage), scale=Math.min(174/properties.width,90/properties.height);
  const imageW=properties.width*scale,imageH=properties.height*scale;pdf.addImage(referenceImage,'PNG',18,imageY,imageW,imageH);
  const current=snapshot.conditionReports.filter(p=>p.referenceImageHash===snapshot.artwork.file_hash);
  current.forEach((p,i)=>{const x=18+imageW*p.x_pct/100,py=imageY+imageH*p.y_pct/100;pdf.setFillColor(139,38,30);pdf.circle(x,py,3,'F');pdf.setFont('helvetica');pdf.setFontSize(8);pdf.setTextColor(255);pdf.text(String(i+1),x,py+1,{align:'center'});pdf.setTextColor(0);});y+=100;
  if(!current.length)line('No condition observations recorded on this reference; this is not a no-damage certification.');
  snapshot.conditionReports.forEach(p=>{line(`${p.at} / ${p.actorId} / ${p.x_pct}%, ${p.y_pct}%`);line(p.description);line(`Reference: ${p.referenceImageHash}`);line(`Evidence photo: ${p.photoHash}`);});
  page('4. Financial ledger');
  line('Recorded sample clearances only. No bank transaction is certified.');
  snapshot.payments.forEach(p=>{line(`Tranche ${p.tranche+1}: AED ${(p.amountMinor/100).toFixed(2)}`);line(`${p.at} / ${p.actorId}`);});
  line(`Total recorded: AED ${(snapshot.payments.reduce((sum,p)=>sum+p.amountMinor,0)/100).toFixed(2)}`);
  const pages=pdf.getNumberOfPages();
  for(let n=1;n<=pages;n++){pdf.setPage(n);pdf.setFont('helvetica','normal');pdf.setFontSize(7);pdf.setTextColor(70);pdf.text(`Source SHA-256: ${snapshot.artwork.file_hash}`,18,272);pdf.text(`Record SHA-256: ${recordHash}`,18,277);pdf.text(`SADU | ${snapshot.dossierId} | ${n} / ${pages}`,18,282);pdf.text('Compare with the stored record. A printed hash is not a digital signature.',18,287);}
  return Buffer.from(pdf.output('arraybuffer'));
}
