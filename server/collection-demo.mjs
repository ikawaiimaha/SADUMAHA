import express from 'express';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalAuthProvider } from '../src/governance/localAdapters.ts';
import { openEcosystemRepository } from './unified-ecosystem.mjs';
import { createCollectionService, collectionTasks } from './pilot-collection.mjs';

export const DEMO_ARTWORK='collection-demo-artwork';
export const DEMO_ACCOUNTS=[
  {id:'pilot-Logistics',role:'Logistics',name:'Logistics A — primary'},
  {id:'demo-backup',role:'Logistics',name:'Logistics B — backup'},
  {id:'demo-technical',role:'Technical',name:'Technical — packing review'},
  {id:'demo-finance',role:'Finance',name:'Finance — cost review'},
  {id:'demo-coordinator',role:'General_Exhibition_Coordinator',name:'General Exhibition Coordinator'},
].map(a=>({...a,exhibitionId:'collection-demo'}));
export async function createCollectionDemo(directory) {
  if(!directory)throw new Error('An isolated fixture directory is required.');
  const seed={format:1,version:0,collectionWorkflowEnabled:true,artworks:[{id:DEMO_ARTWORK,exhibitionId:'collection-demo',physicalStatus:'Pending_Shipment',lifecycleStatus:'INVITED'}],decisions:[],payments:[]};
  const repository=await openEcosystemRepository(join(directory,'state.json'),seed);
  if(repository.read().artworks?.[0]?.exhibitionId!=='collection-demo')throw new Error('This is not a collection-demo fixture.');
  const service=createCollectionService(repository,DEMO_ACCOUNTS),auth=new LocalAuthProvider(DEMO_ACCOUNTS),app=express();
  app.disable('x-powered-by');
  app.use((req,res,next)=>{
    if(!/^(127\.0\.0\.1|localhost):\d+$/.test(req.get('host')??''))return res.status(403).json({error:'Loopback demonstration only.'});
    res.set('Cache-Control','no-store');
    res.set('Content-Security-Policy',"default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'none'");next();
  });
  app.use('/api',(req,res,next)=>{
    const session=req.path==='/review/session';
    const collection=req.path===`/review/pilot/collection/${DEMO_ARTWORK}`;
    const summary=req.path==='/review/pilot'&&req.method==='GET';
    if(!((session||collection)&&['GET','POST'].includes(req.method))&&!summary)return res.status(403).json({error:'Only collection actions are available in this isolated demonstration.'});
    if(req.method!=='GET'&&req.get('origin')!==`http://${req.get('host')}`)return res.status(403).json({error:'Same-origin requests required.'});
    next();
  });
  app.use(express.json({limit:'32kb'}));
  const actorFor=req=>auth.authenticate((req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('sadu_collection_demo='))?.slice('sadu_collection_demo='.length)??'');
  app.get('/api/review/session',async(req,res)=>res.json({mode:'collection-demo',accounts:DEMO_ACCOUNTS,actor:await actorFor(req)}));
  app.post('/api/review/session',async(req,res,next)=>{try{
    const actor=DEMO_ACCOUNTS.find(a=>a.id===req.body.accountId);
    if(!actor)return res.status(403).json({error:'Choose a collection-demo account.'});
    res.cookie('sadu_collection_demo',await auth.selectAccount(actor.id),{httpOnly:true,sameSite:'strict',path:'/api',maxAge:8*3600000});res.json({actor});
  }catch(e){next(e);}});
  app.use('/api',async(req,res,next)=>{res.locals.actor=await actorFor(req);if(!res.locals.actor)return res.status(401).json({error:'Choose a demonstration account.'});next();});
  app.get('/api/review/pilot',(req,res)=>res.json({artwork:{id:DEMO_ARTWORK,title:'Gallery collection — synthetic example'},nextActions:collectionTasks(repository.read(),res.locals.actor),collection:service.read(res.locals.actor,DEMO_ARTWORK)}));
  app.get(`/api/review/pilot/collection/${DEMO_ARTWORK}`,(req,res)=>res.json(service.read(res.locals.actor,DEMO_ARTWORK)));
  app.post(`/api/review/pilot/collection/${DEMO_ARTWORK}`,async(req,res,next)=>{try{await service.mutate(res.locals.actor,{...req.body,artworkId:DEMO_ARTWORK});res.json({saved:true});}catch(e){next(e);}});
  app.use('/api',(_req,res)=>res.status(403).json({error:'Unavailable in this demonstration.'}));
  app.use((e,_req,res,_next)=>res.status(e.status??500).json({error:e.status?e.message:'Local operation failed.'}));
  return {app,repository};
}

export async function attachCollectionDemoUi(app,directory) {
  const {build}=await import('vite');
  const react=(await import('@vitejs/plugin-react')).default;
  const tailwind=(await import('@tailwindcss/vite')).default;
  const output=join(directory,'ui');
  await build({configFile:false,publicDir:false,envDir:directory,envPrefix:'SADU_DEMO_PUBLIC_',plugins:[react(),tailwind()],build:{outDir:output,emptyOutDir:false,rollupOptions:{input:resolve('collection-demo.html')}}});
  app.use(express.static(output));
  app.get(['/', '/connected-pilot'],(_req,res)=>res.sendFile(join(output,'collection-demo.html')));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=resolve('.local/collection-demo-runs');await mkdir(root,{recursive:true});
  const resume=process.argv[2];
  if(resume&&!/^run-[A-Za-z0-9]+$/.test(resume))throw new Error('Resume using a printed run name only.');
  const directory=resume?join(root,resume):await mkdtemp(join(root,'run-'));
  const {app}=await createCollectionDemo(directory);
  await attachCollectionDemoUi(app,directory);
  app.listen(3036,'127.0.0.1',()=>console.log(`Collection demo: http://127.0.0.1:3036/connected-pilot\nRun preserved at: ${directory}`));
}
