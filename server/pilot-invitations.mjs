import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { requireRecordAccess } from './acquisition.mjs';

export const disciplines = ['SCULPTURE','MIXED_MEDIA','CLASSICAL_INK','VIDEO_DIGITAL'];
export const participationRoutes = ['EXISTING_WORK','COMMISSION'];
const hash = text => createHash('sha256').update(text).digest('hex');
const fail = (status,message) => {throw Object.assign(new Error(message),{status});};
const text = (v,max=1000) => typeof v==='string'&&v.trim().length>0&&v.length<=max;
const disciplineLabels={SCULPTURE:{en:'Sculpture',ar:'النحت'},MIXED_MEDIA:{en:'Mixed media',ar:'وسائط مختلطة'},CLASSICAL_INK:{en:'Classical ink',ar:'الخط التقليدي بالحبر'},VIDEO_DIGITAL:{en:'Video / digital media',ar:'الفيديو والوسائط الرقمية'}};
const staff = ['Director','General_Exhibition_Coordinator','Exhibition_Coordinator'];

export function invitationInputs(s) {
  const artwork=s.artworks[0], ledger=s.spatialLedger, publication=s.themePublications?.at(-1);
  const allocation=ledger?.artworks.find(a=>a.id===artwork?.id);
  const roster=ledger?.curation?.snapshots.at(-1);
  const row=roster?.rows.find(r=>r.revision.artistId===artwork?.id);
  const gallery=ledger?.galleries.find(g=>g.id===allocation?.galleryId);
  const venue=ledger?.venues.find(v=>v.id===gallery?.venueId);
  const template=s.artistCare?.template,settings=s.artistCare?.settings;
  const blockers=[];
  if(!publication||hash(JSON.stringify(publication.snapshot))!==publication.hash)blockers.push('A valid Chairman-authorized theme snapshot is required.');
  const templateBody=template?{...template}:null;if(templateBody)delete templateBody.hash;
  if(!template?.hash||hash(JSON.stringify(templateBody))!==template.hash)blockers.push('Editorial, Finance and Director must approve the invitation template.');
  if(ledger?.curation?.phase!=='ENDORSED'||roster?.state!=='ENDORSED'||!row)blockers.push('The artist must be on the current Director-endorsed roster.');
  if(allocation?.state!=='APPROVED'||!gallery?.active||!venue?.active||row?.slot.galleryId!==gallery?.id)blockers.push('An active, approved venue allocation is required.');
  if(!Number.isFinite(Date.parse(settings?.deadline))||Date.parse(settings?.deadline)<=Date.now())blockers.push('A future submission deadline is required.');
  return {artwork,publication,allocation,roster,row,gallery,template,settings,blockers};
}

export function createPilotInvitations(repository) {
  const scope=(s,actor,roles)=>{
    const a=s.artworks[0];
    if(!actor||actor.exhibitionId!==a?.exhibitionId||!roles.includes(actor.role)||(actor.role==='Artist'&&actor.id!==a.artistActorId))fail(403,'Invitation access denied.');
    requireRecordAccess(actor,a);
    if(actor.role==='Exhibition_Coordinator'&&invitationInputs(s).row?.slot.assignedTo!==actor.id)fail(403,'This artist is assigned to another coordinator.');
    return a;
  };
  const latest=s=>s.portalInvitations?.at(-1);
  const isCurrent=(s,i)=>{
    const p=invitationInputs(s);
    return !p.blockers.length&&p.publication.id===i.themePublicationId&&p.template.hash===i.templateHash&&p.roster.id===i.rosterId&&p.allocation.assignmentVersion===i.assignmentVersion&&s.invitationBrief?.id===i.briefId&&p.settings.deadline===i.deadline&&(!i.routes.includes('COMMISSION')||p.settings.commissionAllowed===true);
  };
  const event=(s,actor,action,targetId)=>{(s.decisions??=[]).push({id:randomUUID(),actorId:actor.id,targetId,action,at:new Date().toISOString()});};
  return {
    read(actor) {
      const s=repository.read();scope(s,actor,[...staff,'Artist','PR']);
      const p=invitationInputs(s),i=latest(s),identity=s.artistIdentityDeclarations?.at(-1);
      return {version:s.version,disciplines,participationRoutes,brief:s.invitationBrief??null,blockers:actor.role==='Artist'?[]:p.blockers,
        invitation:i?{id:i.id,en:i.en,ar:i.ar,welcome:i.welcome,tentativeName:i.tentativeName,discipline:i.discipline,routes:i.routes,redeemed:!!i.redeemedAt,current:isCurrent(s,i),submissionRoute:i.submissionRoute??null,themePublicationId:i.themePublicationId,themeHash:i.themeHash,templateHash:i.templateHash}:null,
        identity:['Artist','PR'].includes(actor.role)?identity??null:identity?{status:identity.status}:null};
    },
    mutate(actor,command) {
      return repository.transaction(s=>{
        scope(s,actor,[...staff,'Artist','PR']);
        if(command.version!==s.version)fail(409,'The shared record changed. Reload before retrying.');
        const p=invitationInputs(s),i=latest(s);
        const role=roles=>scope(s,actor,roles);
        const current=()=>{if(!i||!isCurrent(s,i))fail(409,'Invitation dependencies changed; the coordinator must prepare a new preview.');};
        switch(command.action){
          case 'SET_BRIEF':
            role(['General_Exhibition_Coordinator']);
            if(!disciplines.includes(command.discipline)||!Array.isArray(command.routes)||!command.routes.length||command.routes.some(r=>!participationRoutes.includes(r)))fail(422,'Choose a discipline and permitted participation routes.');
            if(command.routes.includes('COMMISSION')&&!p.settings?.commissionAllowed)fail(409,'This edition does not authorize commission proposals.');
            if(p.blockers.length)fail(409,p.blockers.join(' '));
            if(p.artwork.currentRevisionId||s.agreement)fail(409,'A submitted artwork or agreement requires a reviewed brief amendment.');
            (s.invitationBriefHistory??=[]).push(s.invitationBrief={id:randomUUID(),discipline:command.discipline,routes:[...new Set(command.routes)],actorId:actor.id,at:new Date().toISOString()});break;
          case 'PREVIEW': {
            role(['General_Exhibition_Coordinator','Exhibition_Coordinator']);
            if(p.blockers.length)fail(409,p.blockers.join(' '));
            if(p.artwork.currentRevisionId||s.agreement)fail(409,'An existing submission requires a reviewed invitation amendment.');
            if(!s.invitationBrief||!text(command.welcome,2000))fail(422,'A Coordinator-approved discipline brief and welcome note are required.');
            const selected=p.publication.snapshot.proposals[p.publication.snapshot.selected];
            const fill=(body,language)=>body.replaceAll('[Artist_Name]',p.allocation.name).replaceAll('[Exhibition_Theme]',selected[language]).replaceAll('[Assigned_Venue]',p.gallery.name).replaceAll('[Logistics_Deadlines]',p.settings.deadline).replaceAll('[Target_Discipline]',disciplineLabels[s.invitationBrief.discipline][language]);
            const invitation={id:randomUUID(),artistId:p.artwork.artistActorId,tentativeName:p.allocation.name,themePublicationId:p.publication.id,themeHash:p.publication.hash,themeSnapshot:structuredClone(p.publication.snapshot),templateHash:p.template.hash,deadline:p.settings.deadline,rosterId:p.roster.id,assignmentVersion:p.allocation.assignmentVersion,briefId:s.invitationBrief.id,discipline:s.invitationBrief.discipline,routes:[...s.invitationBrief.routes],en:fill(p.template.en,'en'),ar:fill(p.template.ar,'ar'),welcome:command.welcome.trim(),actorId:actor.id,at:new Date().toISOString()};
            if(!p.template.en.includes('[Target_Discipline]')||!p.template.ar.includes('[Target_Discipline]'))fail(409,'Editorial must add [Target_Discipline] to both template languages and obtain fresh template approval.');
            if(/\[[A-Za-z_]+\]/.test(invitation.en+invitation.ar))fail(409,'The approved template contains unsupported placeholders.');
            (s.portalInvitations??=[]).push(invitation);break;
          }
          case 'ISSUE_LOCAL_LINK': {
            role(['General_Exhibition_Coordinator','Exhibition_Coordinator']);current();
            if(i.redeemedAt)fail(409,'This invitation has already been opened.');
            const token=randomBytes(32).toString('base64url');i.tokenHash=hash(token);i.expiresAt=new Date(Date.now()+24*3600000).toISOString();
            event(s,actor,'LOCAL_INVITATION_LINK_PREPARED',i.id);
            return {token,invitationId:i.id,expiresAt:i.expiresAt,delivery:'LOCAL_ONLY_NOT_SENT'};
          }
          case 'REDEEM': {
            role(['Artist']);current();
            if(i.id!==command.invitationId||i.redeemedAt||!i.tokenHash||Date.parse(i.expiresAt)<=Date.now()||typeof command.token!=='string'||command.token.length>200||!timingSafeEqual(Buffer.from(hash(command.token)),Buffer.from(i.tokenHash)))fail(403,'This invitation link is invalid, expired or already used.');
            i.redeemedAt=new Date().toISOString();break;
          }
          case 'DECLARE_IDENTITY':
            role(['Artist']);current();
            if(!i.redeemedAt||!text(command.legalName,200)||!text(command.displayNameEn,200)||!text(command.displayNameAr,200))fail(422,'Open the invitation and complete legal and bilingual display names.');
            if(s.agreement?.accepted)fail(409,'An accepted agreement requires a reviewed identity amendment.');
            (s.artistIdentityDeclarations??=[]).push({id:randomUUID(),invitationId:i.id,legalName:command.legalName.trim(),displayName:{en:command.displayNameEn.trim(),ar:command.displayNameAr.trim()},actorId:actor.id,status:'SELF_DECLARED',at:new Date().toISOString()});break;
          case 'VERIFY_IDENTITY': {
            role(['PR']);current();const identity=s.artistIdentityDeclarations?.at(-1);
            if(!identity||identity.invitationId!==i.id||identity.status!=='SELF_DECLARED'||!text(command.evidenceReference,300))fail(422,'Review the current declaration and supply an evidence reference.');
            // Preserve the declaration; verification is a successor record.
            s.artistIdentityDeclarations.push({...identity,id:randomUUID(),parentId:identity.id,status:'VERIFIED_LOCAL',verifiedBy:actor.id,evidenceReference:command.evidenceReference.trim(),at:new Date().toISOString()});break;
          }
          case 'CHOOSE_ROUTE':
            role(['Artist']);current();
            if(!i.redeemedAt||s.artistIdentityDeclarations?.at(-1)?.invitationId!==i.id)fail(409,'Declare your identity before selecting a route.');
            if(!i.routes.includes(command.route))fail(422,'This route is not permitted by the approved brief.');
            if(p.artwork.currentRevisionId)fail(409,'An existing submission requires a reviewed change of route.');
            i.submissionRoute=command.route;break;
          default:fail(422,'Unknown invitation action.');
        }
        event(s,actor,`INVITATION_${command.action}`,i?.id??p.artwork.id);
        return {ok:true};
      });
    }
  };
}

export function validateInvitationSubmission(s,actor,command) {
  if(!s.portalInvitations?.length){if(s.invitationBrief)fail(409,'Prepare and open the invitation before submitting against this brief.');return;}
  const view=createPilotInvitations({read:()=>s}).read(actor),i=view.invitation;
  if(!i?.current||!i.redeemed||!i.submissionRoute||!view.identity)fail(409,'Open the current invitation, declare your identity and choose an allowed route first.');
  if(command.targetDiscipline!==i.discipline||command.participationRoute!==i.submissionRoute)fail(422,'Submission must follow the Coordinator-approved discipline and chosen route.');
  if(command.artistName?.en!==view.identity.displayName.en||command.artistName?.ar!==view.identity.displayName.ar)fail(422,'Use the declared bilingual display names.');
  if(i.discipline==='VIDEO_DIGITAL'&&(!(command.screenWidthCm>0)||!(command.screenHeightCm>0)||!Number.isFinite(command.screenWidthCm)||!Number.isFinite(command.screenHeightCm)||!text(command.avRequirements)))fail(422,'Video submissions require screen dimensions and audiovisual requirements.');
  if(i.submissionRoute==='COMMISSION'){
    if(!Array.isArray(command.productionBudgetLines)||!command.productionBudgetLines.length||command.productionBudgetLines.length>50||command.productionBudgetLines.some(x=>!text(x.description,200)||!Number.isSafeInteger(x.amountMinor)||x.amountMinor<=0)||!Number.isSafeInteger(command.productionBudgetLines.reduce((sum,x)=>sum+x.amountMinor,0)))fail(422,'Commission proposals require itemized positive budget amounts in minor currency units.');
  }else if(!Number.isFinite(command.existingWorkWeightKg)||command.existingWorkWeightKg<=0||!text(command.packing))fail(422,'Existing works require weight and packing specifications.');
}
