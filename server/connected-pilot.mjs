import { archivalRecordService } from './archival-record.mjs';
import express from 'express';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { LocalAuthProvider } from '../src/governance/localAdapters.ts';
import { createPrelaunchGate } from './prelaunch-gate.mjs';
import { emptyEcosystem, openEcosystemRepository, createEcosystemControllers } from './unified-ecosystem.mjs';
import { unifiedRouter } from './unified-router.mjs';
import { arrivalPolicy } from '../src/logistics/geofence.mjs';
import { shippingManifest } from './logistics-store.mjs';

export const PILOT_ARTWORK = '901bb523-c68b-4db8-b605-e4841d715c2f';
export const PILOT_ROLES = ['Artist','Editorial','General_Exhibition_Coordinator','Museum_Operations','Director','PR','Technical','Logistics','Finance'];
export const PILOT_ACCOUNTS = PILOT_ROLES.map(role => ({ id: `pilot-${role}`, role, exhibitionId:'connected-pilot', name: role.replaceAll('_',' ') }));
export function pilotSeed() {
  const s = emptyEcosystem();
  s.artworks.push({ id:PILOT_ARTWORK, exhibitionId:'connected-pilot', artistActorId:'pilot-Artist', physicalStatus:'Pending_Shipment', lifecycleStatus:'INVITED' });
  s.walls.push({ id:'pilot-wall', exhibitionId:'connected-pilot', max_width_cm:600,max_height_cm:300, climateCapability:{lux:40,min_temp_c:18,max_temp_c:22,min_humidity_pct:35,max_humidity_pct:45} });
  s.dictionary.push({id:'pilot-calligraphy',exhibitionId:'connected-pilot',english:'calligraphy',arabic:'خط',version:1,approvedBy:'pilot-Editorial',approvedAt:'2026-09-30T00:00:00Z'});
  s.budgets=[{exhibitionId:'connected-pilot',ceiling:6000000}]; s.budgetRows=[{id:'pilot-grant',exhibitionId:'connected-pilot',artworkId:PILOT_ARTWORK,amount:4500000,paid:0,released:0}];
  s.payments=[]; s.followups=[]; return s;
}
export async function createConnectedPilot({ directory=resolve('.local/connected-pilot'), origin='http://127.0.0.1:3025', gate=createPrelaunchGate(), simulatedLocation=false }={}) {
  await mkdir(join(directory,'objects'),{recursive:true});
  const repository=await openEcosystemRepository(join(directory,'state.json'),pilotSeed());
  const storage={openStaging:async()=>{const objectId=randomUUID();return {objectId,stream:createWriteStream(join(directory,'objects',objectId),{flags:'wx',mode:0o600})};}};
  const controllers=createEcosystemControllers({repository,storage,endpointOrigin:origin,dockPolicy:arrivalPolicy()});
  const auth=new LocalAuthProvider(PILOT_ACCOUNTS); const app=express(); app.disable('x-powered-by');
  app.use((req,res,next)=>{if(!/^(localhost|127\.0\.0\.1):\d+$/.test(req.get('host')??''))return res.status(403).json({error:'Local pilot only.'});next();});
  app.use(gate);
  app.use('/api',(req,res,next)=>{res.set('Cache-Control','private, no-store');if(req.method!=='GET'&&req.get('origin')!==`${req.protocol}://${req.get('host')}`)return res.status(403).json({error:'Same-origin requests required.'});next();});
  app.use(express.json({limit:'32kb'}));
  const actorFor=req=>auth.authenticate((req.headers.cookie??'').split(';').map(v=>v.trim()).find(v=>v.startsWith('sadu_connected='))?.slice(15)??'');
  app.get('/api/review/session',async(req,res)=>res.json({mode:'connected-local-pilot',accounts:PILOT_ACCOUNTS,actor:await actorFor(req),simulatedLocation}));
  app.post('/api/review/session',async(req,res,next)=>{try{const actor=PILOT_ACCOUNTS.find(a=>a.id===req.body?.accountId);if(!actor)return res.status(403).json({error:'Unknown pilot account.'});res.cookie('sadu_connected',await auth.selectAccount(actor.id),{httpOnly:true,sameSite:'strict',path:'/api',maxAge:8*3600000});res.json({actor});}catch(e){next(e);}});
  app.use('/api',async(req,res,next)=>{res.locals.actor=await actorFor(req);if(!res.locals.actor)return res.status(401).json({error:'Select a local pilot account.'});next();});
  const current=()=>{const s=repository.read();const a=s.artworks[0];return {s,a,r:s.revisions.find(r=>r.id===a.currentRevisionId)};};
  const requireRole=(actor,roles)=>{if(actor.exhibitionId!=='connected-pilot'||!roles.includes(actor.role))throw Object.assign(new Error('This role cannot perform this action.'),{status:403});};
  const recordEvent=(s,actor,r,action)=>s.decisions.push({id:randomUUID(),actorId:actor.id,targetId:PILOT_ARTWORK,versionHash:r?.versionHash??'',action,at:new Date().toISOString()});
  app.get('/api/review/pilot', (req,res)=>{const {s,a,r}=current();const actor=res.locals.actor;const visible=r && (actor.role!=='Director'||r.approvals.coordinator||r.state==='PUBLISHED');const safe=visible?{...r,media:{file_hash:r.media.file_hash,byte_length:r.media.byte_length}}:null;res.json({version:s.version,agreement:s.agreement??null,conditionClearance:s.conditionClearance??null,artwork:a,revision:safe,wall:s.walls[0],placement:s.placements.find(p=>p.revisionId===r?.id),decisions:s.decisions,payments:s.payments,requests:s.requests,returnClearance:s.returnClearance??null,twins:s.twins.map(t=>({id:t.id,uri:t.uri,revisionId:t.revisionId})),pins:(s.conditionPins??[]).filter(p=>p.revisionId===r?.id).map(p=>({id:p.id,x_pct:p.x_pct,y_pct:p.y_pct,description:p.description})),simulatedLocation,role:actor.role});});
  app.post('/api/review/pilot/action',async(req,res,next)=>{try{
    const body=req.body??{};const actor=res.locals.actor;
    await repository.transaction(s=>{if(body.version!==s.version)throw Object.assign(new Error('Dossier changed. Refresh and retry.'),{status:409});const a=s.artworks[0],r=s.revisions.find(r=>r.id===a.currentRevisionId);if(a.lifecycleStatus==='ARCHIVED_CLOSED')throw Object.assign(new Error('Archived dossiers are read-only.'),{status:409});if(!r)throw Object.assign(new Error('Submit the artwork first.'),{status:409});
      const need=(condition,message)=>{if(!condition)throw Object.assign(new Error(message),{status:409});};
      switch(body.action){
        case 'agreement':requireRole(actor,['General_Exhibition_Coordinator']);need(!s.agreement,'Agreement already recorded.');s.agreement={amountMinor:4500000,tranches:[1350000,1800000,1350000],revisionId:r.id,accepted:false};break;
        case 'accept':requireRole(actor,['Artist']);need(s.agreement?.revisionId===r.id,'Current agreement is required.');s.agreement.accepted=true;a.lifecycleStatus='CONTRACT_EXECUTED';break;
        case 'pr':requireRole(actor,['PR']);need(body.checked===true,'Confirm reviewed sample identity/travel evidence.');r.approvals.pr={hash:r.versionHash,actorId:actor.id};break;
        case 'technical':requireRole(actor,['Technical']);need(body.checked===true&&s.placements.some(p=>p.revisionId===r.id),'Confirm technical evidence after placement.');r.approvals.technical={hash:r.versionHash,actorId:actor.id};break;
        case 'condition-clear':requireRole(actor,['Logistics']);need(body.checked===true&&a.physicalStatus==='On_Site_Sharjah','Receipt and condition review are required.');s.conditionClearance={revisionId:r.id,actorId:actor.id};break;
        case 'return':requireRole(actor,['Logistics']);need(body.checked===true&&s.conditionClearance?.revisionId===r.id&&s.payments.some(p=>p.tranche===1),'Delivery payment and reconciled condition are required.');a.physicalStatus='RETURN_FREIGHT_CLEARED';s.returnClearance={revisionId:r.id,actorId:actor.id,at:new Date().toISOString()};break;
        case 'pay':{requireRole(actor,['Finance']);const n=body.tranche;need(!['WITHDRAWN','REJECTED'].includes(a.lifecycleStatus),'Withdrawn or rejected participation requires Finance reconciliation.');need([0,1,2].includes(n),'Unknown tranche.');need(s.agreement?.accepted&&s.agreement.revisionId===r.id,'Accepted current agreement required.');need(r.approvals.pr?.hash===r.versionHash&&r.approvals.technical?.hash===r.versionHash,'Current PR and Technical evidence required.');need(!s.payments.some(p=>p.tranche===n),'Tranche already recorded.');need(n===0||s.payments.some(p=>p.tranche===n-1),'Prior tranche required.');need(n!==1||s.conditionClearance?.revisionId===r.id,'Receipt and condition clearance required.');need(n!==2||s.returnClearance?.revisionId===r.id,'Safe return and condition reconciliation required.');s.payments.push({tranche:n,amountMinor:s.agreement.tranches[n],actorId:actor.id,at:new Date().toISOString()});s.budgetRows[0].paid+=s.agreement.tranches[n];break;}
        default:throw Object.assign(new Error('Unknown pilot action.'),{status:422});
      } recordEvent(s,actor,r,`PILOT_${body.action.toUpperCase()}`);
    });res.json({ok:true});
  }catch(e){next(e);}});
  // File bytes are streamed directly; metadata is bounded and separate from the bytes hashed.
  app.use(['/api/review/ecosystem/submission','/api/review/ecosystem/condition'],(req,res,next)=>{if(req.method!=='POST')return next();try{const header=req.get('x-sadu-metadata')??'';if(header.length>16000)throw new Error();req.body=JSON.parse(decodeURIComponent(header));if(req.path.endsWith('/submission')&&repository.read().agreement?.accepted)return res.status(409).json({error:'Accepted pilot agreements require a reviewed amendment; direct resubmission is locked.'});req.fileStream=req;next();}catch{return res.status(422).json({error:'Valid bounded upload metadata is required.'});}});
  app.post('/api/review/pilot/simulated-arrival',async(req,res,next)=>{try{if(!simulatedLocation)return res.status(403).json({error:'Synthetic location is disabled.'});await controllers.receiveCrate(res.locals.actor,{...req.body,location:{latitude:25.36143,longitude:55.38702,accuracy:1,timestamp:Date.now()}});await repository.transaction(s=>recordEvent(s,res.locals.actor,s.revisions.at(-1),'SYNTHETIC_LOCATION_TEST'));res.json({ok:true});}catch(e){next(e);}});
  const archival=archivalRecordService({repository,readObject:id=>readFile(join(directory,'objects',id))});
  app.post('/api/review/ecosystem/archive-close',async(req,res,next)=>{try{res.json(await archival.close(res.locals.actor,req.body));}catch(e){next(e);}});
  app.get('/api/review/ecosystem/archive/:artworkId.pdf',(req,res,next)=>{try{const record=archival.download(res.locals.actor,req.params.artworkId);res.set({'X-Content-Type-Options':'nosniff','X-Content-SHA256':record.pdfHash,'Content-Disposition':'attachment; filename="SADU-Master-Archival-Record.pdf"'}).type('pdf').send(record.bytes);}catch(e){next(e);}});
  app.use('/api/review/ecosystem',unifiedRouter(controllers));
  app.get('/api/review/pilot/media',async(req,res,next)=>{try{const {r}=current();if(!r)return res.sendStatus(404);const bytes=await readFile(join(directory,'objects',r.media.objectId));if(createHash('sha256').update(bytes).digest('hex')!==r.media.file_hash)throw new Error('File integrity check failed.');res.set('X-Content-Type-Options','nosniff').type('image/png').send(bytes);}catch(e){next(e);}});
  app.get('/api/review/pilot/label.pdf',(req,res)=>{const {s,r}=current();const twin=s.twins.find(t=>t.revisionId===r?.id);const label=s.labels.find(l=>l.twinId===twin?.id);if(!label)return res.status(404).json({error:'Publish the current revision first.'});res.type('pdf').send(Buffer.from(label.pdfBase64,'base64'));});
  app.get('/api/review/pilot/manifest.pdf',(req,res)=>{const {a,r}=current();if(!r||r.state!=='PUBLISHED')return res.status(409).json({error:'Publish the current artwork first.'});res.type('pdf').send(shippingManifest({id:a.id,title:r.title.en,artist_name:r.artistName.en,approved_revision:r.sequence,logistics:{origin:'Fictional studio',destination:'Fictional museum dock',carrier:'PILOT ONLY',handling:'Sample handling instructions',gross_weight_kg:100}}));});
  const spatialView=()=>{const {s,r}=current();return {version:s.version,wall_space:{...s.walls[0],artist_id:'pilot-Artist'},artwork_records:r?[{id:PILOT_ARTWORK,title:r.title.en,width_cm:r.width_cm,height_cm:r.height_cm,revision:r.sequence}]:[],placements:s.placements.map(p=>({artwork_id:p.artworkId,x_cm:p.x_cm,y_cm:p.y_cm}))};};
  app.get('/api/review/spatial',(_req,res)=>res.json(spatialView()));
  app.post('/api/review/spatial',async(req,res,next)=>{try{const {s,r}=current();if(req.body.version!==s.version)throw Object.assign(new Error('Refresh the spatial plan.'),{status:409});const p=req.body.placements?.[0];if(req.body.action!=='save_layout'||req.body.placements?.length!==1||p.artwork_id!==PILOT_ARTWORK)throw Object.assign(new Error('Use the fixed pilot wall and one artwork placement.'),{status:422});await controllers.placeArtwork(res.locals.actor,{artworkId:PILOT_ARTWORK,versionHash:r?.versionHash,wallId:'pilot-wall',x_cm:p.x_cm,y_cm:p.y_cm});res.json(spatialView());}catch(e){next(e);}});
  app.use('/api',(_req,res)=>res.status(404).json({error:'Unknown pilot endpoint.'}));
  app.use(express.static(resolve('dist-rehearsal'),{cacheControl:false}));app.get('*',(_req,res)=>res.sendFile(resolve('dist-rehearsal/index.html')));
  app.use((error,_req,res,_next)=>res.status(error.status??500).json({error:error.status?error.message:'Local pilot operation failed; no success is assumed.'}));
  return {app,repository,controllers};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const {app}=await createConnectedPilot({simulatedLocation:process.env.SADU_PILOT_SIMULATED_LOCATION==='true'});app.listen(3025,'127.0.0.1',()=>console.log('Connected local pilot: http://127.0.0.1:3025/review'));
}
