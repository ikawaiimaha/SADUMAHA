import { randomUUID } from 'node:crypto';
import { jsPDF } from 'jspdf';
import { readFileSync } from 'node:fs';
import { sha256 } from './archival-pdf.mjs';
import { ReviewError } from './review-store.mjs';
const fail=(status,message)=>{throw new ReviewError(status,message);};
export const OWNERSHIP_STATES=['TEMPORARY_LOAN','SDC_OWNED','SOVEREIGN_COLLECTION'];
export const DESTINATIONS=['SDC Main Storage','Sharjah Art Museum','H.H. Sovereign Private Collection'];
export const isRestricted=a=>a.ownership_state==='SOVEREIGN_COLLECTION'||a.acquisition?.buyer==='SOVEREIGN_COLLECTION';
export function requireRecordAccess(actor,a){if(isRestricted(a)&&!['Director','General_Exhibition_Coordinator'].includes(actor?.role))fail(403,'Record access is restricted.');}
/** Institution-configurable convention, not a vendor certification. Call within a locked transaction. */
export function nextAccessionNumber(state,year,edition){
  if(!Number.isInteger(year)||year<1900||year>9999||!Number.isInteger(edition)||edition<1||edition>999)fail(422,'A valid accession year and edition are required.');
  const prefix=`${year}.${edition}.`;const occupied=new Set(state.artworks.map(a=>a.accession_number).filter(Boolean));
  const key=`${year}.${edition}`;let n=(state.accessionCounters??={})[key]??0;
  for(const value of occupied){if(value.startsWith(prefix)&&/^\d+$/.test(value.slice(prefix.length)))n=Math.max(n,Number(value.slice(prefix.length)));}
  do{n++;if(!Number.isSafeInteger(n))fail(409,'Accession sequence exhausted.');}while(occupied.has(prefix+String(n).padStart(6,'0')));
  state.accessionCounters[key]=n;return prefix+String(n).padStart(6,'0');
}
export function acquisitionPdf(record,title='Transfer of Title'){
  const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});let y=24;
  pdf.addFileToVFS('Amiri.ttf',readFileSync(new URL('./fonts/Amiri-Regular.ttf',import.meta.url)).toString('base64'));pdf.addFont('Amiri.ttf','Amiri','normal');
  const line=(value,ar=false)=>{pdf.setFont(ar?'Amiri':'helvetica','normal');pdf.setFontSize(ar?13:11);for(const t of pdf.splitTextToSize(String(value),170)){if(y>263){pdf.addPage();y=24;}pdf.text(t,ar?192:18,y,ar?{align:'right'}:{});y+=8;}};
  line(`SADU / ${title}`);line('FICTIONAL PILOT / DRAFT - NOT A LEGALLY EXECUTED TRANSFER');
  line(`Artwork ID: ${record.artworkId}`);line(record.artistName.en);line(record.artistName.ar,true);line(record.title.en);line(record.title.ar,true);
  line(`Dimensions: ${record.height_cm} x ${record.width_cm} cm / ${record.year}`);
  line(`Proposed buyer: ${record.buyer}`);line(`Agreed purchase price: AED ${(record.purchaseMinor/100).toFixed(2)}`);
  line(`Agreement reference: ${record.priceAgreementRef}`);
  if(record.destination)line(`Permanent destination: ${record.destination}`);
  if(record.accession_number)line(`Accession: ${record.accession_number}`);
  line('Identifies the object and proposed consideration for institutional legal review.');
  line('No copyright transfer, payment, shipping booking or legal signature is inferred.');
  line(`Revision SHA-256: ${record.versionHash}`);
  return Buffer.from(pdf.output('arraybuffer'));
}
export function acquisitionService({repository,signatureProvider,render=acquisitionPdf}){
  const get=(state,actor,id,roles)=>{const a=state.artworks.find(a=>a.id===id);if(!a||!actor||a.exhibitionId!==actor.exhibitionId||!roles.includes(actor.role)||(actor.role==='Artist'&&a.artistActorId!==actor.id))fail(403,'Acquisition action is not assigned to this account.');return a;};
  const event=(s,a,actor,action)=>s.decisions.push({id:randomUUID(),targetId:a.id,actorId:actor.id,action,versionHash:a.acquisition.versionHash,at:new Date().toISOString()});
  return {
    initiate(actor,c){return repository.transaction(s=>{const a=get(s,actor,c.artworkId,['Director']);requireRecordAccess(actor,a);
      if(a.lifecycleStatus==='ARCHIVED_CLOSED'||a.physicalStatus==='RETURN_FREIGHT_CLEARED')fail(409,'Closed or returned dossiers cannot enter acquisition.');
      if(a.acquisition)fail(409,'An acquisition already exists.');
      const r=s.revisions.find(r=>r.id===a.currentRevisionId);
      if(!r||r.versionHash!==c.versionHash||r.state!=='PUBLISHED'||!r.description)fail(409,'Current verified publication is required.');
      if(!['SDC_OWNED','SOVEREIGN_COLLECTION'].includes(c.buyer)||!Number.isSafeInteger(c.purchaseMinor)||c.purchaseMinor<=0||typeof c.priceAgreementRef!=='string'||!c.priceAgreementRef.trim()||c.priceAgreementRef.length>200)fail(422,'Select a buyer and supply an agreed price and evidence reference.');
      const record={id:randomUUID(),artworkId:a.id,revisionId:r.id,versionHash:r.versionHash,artistName:r.artistName,title:r.title,height_cm:r.height_cm,width_cm:r.width_cm,year:r.year,buyer:c.buyer,purchaseMinor:c.purchaseMinor,priceAgreementRef:c.priceAgreementRef.trim(),state:'AWAITING_ARTIST_SIGNATURE',simulation:true};
      const bytes=render(record);record.documentHash=sha256(bytes);record.pdfBase64=bytes.toString('base64');
      a.acquisition=record;a.returnManifestState='VOID';a.ownership_state??='TEMPORARY_LOAN';a.accession_number??=null;
      event(s,a,actor,'INITIATE_ACQUISITION');return {state:record.state,documentHash:record.documentHash};
    });},
    // Dedicated signature envelope: never returns the dossier, locations, ledger or audit history.
    envelope(actor){const s=repository.read();const a=s.artworks.find(a=>a.artistActorId===actor?.id&&a.exhibitionId===actor.exhibitionId);if(actor?.role!=='Artist'||!a?.acquisition)fail(404,'No signing envelope.');const q=a.acquisition;return {artworkId:a.id,state:q.receipt?'SIMULATED_ARTIST_ACCEPTED':'AWAITING_ARTIST_SIGNATURE',documentHash:q.documentHash,simulation:true};},
    signatureDocument(actor,id){const s=repository.read(),a=get(s,actor,id,['Artist']);const q=a.acquisition;if(!q)fail(404,'No signing envelope.');const bytes=Buffer.from(q.pdfBase64,'base64');if(sha256(bytes)!==q.documentHash)fail(409,'Document integrity failed.');return bytes;},
    sign(actor,c){return repository.transaction(async s=>{const a=get(s,actor,c.artworkId,['Artist']);const q=a.acquisition;
      if(a.lifecycleStatus==='ARCHIVED_CLOSED'||!q||q.documentHash!==c.documentHash||q.state!=='AWAITING_ARTIST_SIGNATURE'||c.confirm!==true)fail(409,'Review and confirm the current title document.');
      const receipt=await signatureProvider.request(actor,{entityId:q.id,versionHash:q.documentHash});
      if(receipt.entityId!==q.id||receipt.versionHash!==q.documentHash||receipt.actorId!==actor.id||receipt.status!=='SIMULATED_NOT_SIGNED'||receipt.legallySigned!==false)fail(409,'Unexpected local signature receipt.');
      q.receipt=receipt;q.state='SIMULATED_ARTIST_ACCEPTED';event(s,a,actor,'TITLE_ACCEPTANCE_SIMULATED');return {state:q.state,legallySigned:false};
    });},
    approve(actor,c){return repository.transaction(s=>{const a=get(s,actor,c.artworkId,['Director']);const q=a.acquisition;
      if(!q||q.state!=='SIMULATED_ARTIST_ACCEPTED'||q.documentHash!==c.documentHash||a.lifecycleStatus==='ARCHIVED_CLOSED')fail(409,'Current artist acceptance is required.');
      a.accession_number=nextAccessionNumber(s,c.year,c.edition);a.ownership_state=q.buyer;q.state='ACQUIRED_SIMULATED';event(s,a,actor,'ACQUISITION_APPROVED_SIMULATED');return {accession_number:a.accession_number,ownership_state:a.ownership_state};
    });},
    route(actor,c){return repository.transaction(s=>{const a=get(s,actor,c.artworkId,['Logistics','Director','General_Exhibition_Coordinator']);requireRecordAccess(actor,a);const q=a.acquisition;
      if(!q||!['ACQUIRED_SIMULATED','TRANSFER_ROUTED'].includes(q.state)||q.documentHash!==c.documentHash||a.lifecycleStatus==='ARCHIVED_CLOSED')fail(409,'Approve acquisition before permanent routing.');
      if(!DESTINATIONS.includes(c.destination)||(q.buyer==='SOVEREIGN_COLLECTION')!==(c.destination===DESTINATIONS[2]))fail(422,'Destination must match the approved legal buyer.');
      const bytes=render({...q,destination:c.destination,accession_number:a.accession_number},'Permanent Transfer Manifest');
      q.destination=c.destination;q.manifestBase64=bytes.toString('base64');q.manifestHash=sha256(bytes);q.state='TRANSFER_ROUTED';event(s,a,actor,'PERMANENT_TRANSFER_ROUTED');return {state:q.state};
    });},
    document(actor,id,kind){const s=repository.read(),a=get(s,actor,id,kind==='title'?['Artist','Director','General_Exhibition_Coordinator']:['Logistics','Director','General_Exhibition_Coordinator']);requireRecordAccess(actor,a);const q=a.acquisition;
      const encoded=kind==='title'?q?.pdfBase64:q?.manifestBase64,hash=kind==='title'?q?.documentHash:q?.manifestHash;if(!encoded)fail(409,'Document is not ready.');const bytes=Buffer.from(encoded,'base64');if(sha256(bytes)!==hash)fail(409,'Document integrity failed.');return bytes;}
  };
}
