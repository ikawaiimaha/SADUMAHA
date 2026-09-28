import {Upload} from 'tus-js-client';
import {pilotSupabase as client,pilotSupabaseUrl} from './pilotSupabase';
export const MEDIA_LIMIT=2*1024*1024*1024;
export function tusEndpoint(base:string){const url=new URL(base);if(url.hostname.endsWith('.supabase.co')&&!url.hostname.endsWith('.storage.supabase.co'))url.hostname=url.hostname.replace('.supabase.co','.storage.supabase.co');url.pathname='/storage/v1/upload/resumable';url.search='';url.hash='';return url.href;}
export function createMediaTransfer(file:File,path:string,type:string,userId:string,onProgress:(percent:number)=>void,dependencies={client,url:pilotSupabaseUrl,UploadClass:Upload}){
 const {client:storageClient,url,UploadClass}=dependencies;
 if(!storageClient||!url)throw new Error('Storage is not configured.');
 let rejectAttempt:((e:Error)=>void)|undefined,resolveAttempt:(()=>void)|undefined,cancelled=false;
 const transfer=new UploadClass(file,{
  endpoint:tusEndpoint(url),chunkSize:6*1024*1024,retryDelays:[0,3000,5000,10000,20000],
  uploadDataDuringCreation:true,storeFingerprintForResuming:false,removeFingerprintOnSuccess:true,
  metadata:{bucketName:'logistics-secure',objectName:path,contentType:type,cacheControl:'3600'},
  onBeforeRequest:async request=>{const {data,error}=await storageClient.auth.getSession();if(cancelled||error||!data.session||data.session.user.id!==userId)throw new Error('Session changed. Sign in again before retrying.');request.setHeader('authorization',`Bearer ${data.session.access_token}`);request.setHeader('x-upsert','false');},
  onProgress:(sent,total)=>onProgress(total?Math.min(99,Math.floor(sent/total*100)):0),
  onError:()=>rejectAttempt?.(new Error('Upload interrupted. Check your connection, storage limit and sign-in, then resume.')),
  onSuccess:()=>resolveAttempt?.()
 });
 return {start:()=>new Promise<void>((resolve,reject)=>{if(cancelled){reject(new Error('Upload cancelled'));return;}resolveAttempt=resolve;rejectAttempt=reject;transfer.start();}),cancel:()=>{cancelled=true;void transfer.abort();rejectAttempt?.(new Error('Upload stopped. Select the file again to restart.'));}};
}
