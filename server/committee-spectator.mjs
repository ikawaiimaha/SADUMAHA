import { createHash } from 'node:crypto';
import { isRestricted } from './acquisition.mjs';
export const SPECTATOR_ROLE='PREPARATORY_COMMITTEE_SPECTATOR';
const deny=()=>{throw Object.assign(new Error('Committee spectator access is required.'),{status:403});};
const authorize=(state,actor)=>{if(actor?.role!==SPECTATOR_ROLE||!state.artworks.some(a=>a.exhibitionId===actor.exhibitionId))deny();};

/** Allowlisted projection of the active board. No separate demo candidates or copies. */
export function spectatorView(state,actor) {
  authorize(state,actor);
  const ledger=state.spatialLedger;
  if(ledger&&ledger.exhibitionId!==actor.exhibitionId)deny();
  const board=ledger?.curation;
  const snapshot=board?.snapshots.at(-1);
  const rows=board?.phase==='COMMITTEE_REVIEW'&&snapshot?.state==='LOCKED'?snapshot.rows:[];
  const candidates=[];
  for(const row of rows){
    const nomination=board.nominations.find(n=>n.id===row.proposalId);
    // SHORTLISTED on the locked Committee board is this model's pending-review state.
    if(nomination?.status!=='SHORTLISTED'||row.slot.restricted||nomination.revisions.at(-1)?.number!==row.revision.number)continue;
    const artwork=state.artworks.find(a=>a.id===row.revision.artistId&&a.exhibitionId===actor.exhibitionId);
    if(!artwork||isRestricted(artwork)||['WITHDRAWN','REJECTED','ARCHIVED_CLOSED'].includes(artwork.lifecycleStatus))continue;
    const allocation=ledger.artworks.find(a=>a.id===artwork.id);
    const gallery=ledger.galleries.find(g=>g.id===row.slot.galleryId);
    const venue=ledger.venues.find(v=>v.id===gallery?.venueId);
    if(!allocation||allocation.galleryId!==gallery?.id||!gallery?.active||!venue?.active||allocation?.state==='LOCATION_ORPHANED'||allocation?.state==='WITHDRAWN')continue;
    const revision=state.revisions.find(r=>r.id===artwork.currentRevisionId);
    candidates.push({id:artwork.id,status:'PENDING_COMMITTEE_REVIEW',revisionId:revision?.id??null,
      artistName:{en:revision?.artistName?.en??allocation?.name??'Name not recorded',ar:revision?.artistName?.ar??''},
      nationality:revision?.nationality??null,medium:typeof revision?.medium==='string'?revision.medium:revision?.invitationSubmission?.targetDiscipline?.replaceAll('_',' ')??null,
      statement:revision?.concept_text??row.revision.fit??'',allocation:`${venue.name??''} · ${gallery.name}`,
      imageUrl:revision?.media?.objectId?`/api/review/committee-spectator/media/${encodeURIComponent(artwork.id)}/${encodeURIComponent(revision.id)}`:null});
  }
  const theme=state.themeWorkflow;
  return {themeRevision:theme?.revision??null,themePhase:theme?.phase??null,proposals:(theme?.proposals??[]).map(p=>({en:p.en,ar:p.ar,meaning:p.definition??p.meaning??null,justification:p.rationale??''})),candidates};
}

export function committeeSpectatorService(repository,readObject){
  return {
    read:actor=>spectatorView(repository.read(),actor),
    async media(actor,artworkId,revisionId){
      const before=repository.read();
      const candidate=spectatorView(before,actor).candidates.find(c=>c.id===artworkId&&c.revisionId===revisionId);
      if(!candidate?.imageUrl)throw Object.assign(new Error('This candidate is no longer available for Committee review.'),{status:404});
      const revision=before.revisions.find(r=>r.id===revisionId);
      const bytes=await readObject(revision.media.objectId);
      if(createHash('sha256').update(bytes).digest('hex')!==revision.media.file_hash)throw Object.assign(new Error('Artwork image integrity check failed.'),{status:409});
      if(!spectatorView(repository.read(),actor).candidates.some(c=>c.id===artworkId&&c.revisionId===revisionId))throw Object.assign(new Error('Committee review changed. Reload the gallery.'),{status:409});
      return bytes;
    }
  };
}
