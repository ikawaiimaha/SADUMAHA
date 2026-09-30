import { randomUUID } from 'node:crypto';
import { archivalSnapshot, generateArchivalPdf, sha256, snapshotHash } from './archival-pdf.mjs';
import { ReviewError } from './review-store.mjs';
const fail=(status,message)=>{throw new ReviewError(status,message);};
export function archivalRecordService({repository,readObject,generate=generateArchivalPdf}) {
  const authorize=(state,actor,id,write=false)=>{
    const a=state.artworks.find(a=>a.id===id);
    if(!a||!actor||a.exhibitionId!==actor.exhibitionId||!(write?['Director']:['Director','General_Exhibition_Coordinator']).includes(actor.role))fail(403,'Archive access is restricted to the assigned Director and General Exhibition Coordinator.');
    return a;
  };
  return {
    close(actor,command){return repository.transaction(async state=>{
      const a=authorize(state,actor,command.artworkId,true);
      const existing=(state.archivalRecords??[]).find(row=>row.artworkId===a.id);
      if(existing)return {id:existing.id,state:'ARCHIVED_CLOSED',snapshotHash:existing.snapshotHash};
      const r=state.revisions.find(r=>r.id===a.currentRevisionId);
      if(!r||r.versionHash!==command.versionHash)fail(409,'Refresh the current revision before closure.');
      // This adapter joins the single-dossier pilot's agreement and ledger. Never borrow another dossier's rows.
      if(state.artworks.length!==1||!state.agreement?.accepted||state.agreement.revisionId!==r.id||r.state!=='PUBLISHED'||a.physicalStatus!=='RETURN_FREIGHT_CLEARED'||state.returnClearance?.revisionId!==r.id||state.conditionClearance?.revisionId!==r.id||[0,1,2].some(n=>state.payments?.filter(p=>p.tranche===n&&p.amountMinor===state.agreement.tranches[n]).length!==1))fail(409,'Archive requires the current accepted agreement, publication, reconciled return and all three Finance clearances.');
      const at=new Date().toISOString();
      state.decisions.push({id:randomUUID(),actorId:actor.id,targetId:a.id,versionHash:r.versionHash,action:'ARCHIVED_CLOSED',at});
      const snapshot=archivalSnapshot(state,a,r,at);
      const bytes=await generate(snapshot,await readObject(r.media.objectId));
      const record={id:randomUUID(),artworkId:a.id,revisionId:r.id,closedAt:at,closedBy:actor.id,snapshot,snapshotHash:snapshotHash(snapshot),pdfHash:sha256(bytes),pdfBase64:bytes.toString('base64')};
      (state.archivalRecords??=[]).push(record);a.lifecycleStatus='ARCHIVED_CLOSED';a.archivedAt=at;
      return {id:record.id,state:a.lifecycleStatus,snapshotHash:record.snapshotHash};
    });},
    download(actor,id){const state=repository.read();const a=authorize(state,actor,id);const row=(state.archivalRecords??[]).find(row=>row.artworkId===id);
      if(a.lifecycleStatus!=='ARCHIVED_CLOSED'||!row)fail(409,'The dossier must be archived before export.');
      const bytes=Buffer.from(row.pdfBase64,'base64');
      if(sha256(bytes)!==row.pdfHash||snapshotHash(row.snapshot)!==row.snapshotHash)fail(409,'Archive integrity verification failed.');
      return {bytes,pdfHash:row.pdfHash};
    }
  };
}
