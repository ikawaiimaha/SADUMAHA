/** Server-only domain middleware. Call with fresh repository records, never browser assertions. */
export type Role='ADMIN'|'COORDINATOR'|'PR_OFFICER'|'LOGISTICS_OFFICER'|'EXTERNAL_VENDOR'|'ARTIST'|'EDITORIAL'|'DIRECTOR'|'FINANCE';
export class GateError extends Error{constructor(public code:string){super(code);}}
function requireGate(ok:unknown,code:string):asserts ok {if(!ok)throw new GateError(code);}
export type Actor={userId:string;role:Role;programId:string;active:boolean};
export type Scope={programId:string;artistUserId:string;coordinatorId:string;vendorUserId?:string};
export function authorize(actor:Actor,scope:Scope,allowed:Role[]){
 requireGate(actor.active&&actor.programId===scope.programId&&allowed.includes(actor.role),'FORBIDDEN');
 if(actor.role==='ARTIST')requireGate(actor.userId===scope.artistUserId,'NOT_OWNER');
 if(actor.role==='COORDINATOR')requireGate(actor.userId===scope.coordinatorId,'NOT_ASSIGNED');
 if(actor.role==='EXTERNAL_VENDOR')requireGate(actor.userId===scope.vendorUserId,'NOT_ASSIGNED');
}
export function validISODate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;}
export function addCalendarMonths(date:string,months:number){requireGate(validISODate(date)&&Number.isInteger(months)&&months>=1&&months<=24,'INVALID_DATE_POLICY');const [y,m,d]=date.split('-').map(Number);const first=new Date(Date.UTC(y,m-1+months,1));const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();first.setUTCDate(Math.min(d,last));return first.toISOString().slice(0,10);}
export type ImmigrationPolicy={version:string;approvedReference:string;active:boolean;validFrom:string;validUntil:string;passportMonths:number;nationalIdCountries:string[]};
export function immigrationGate(input:{arrival:string;passportExpiry:string;nationality:string;nationalIdVerified:boolean},policy:ImmigrationPolicy,today:string){
 requireGate(policy.active&&Boolean(policy.version&&policy.approvedReference)&&validISODate(today)&&validISODate(policy.validFrom)&&validISODate(policy.validUntil)&&today>=policy.validFrom&&today<=policy.validUntil,'IMMIGRATION_POLICY_NOT_APPROVED');
 requireGate(validISODate(input.arrival)&&input.arrival>=today&&validISODate(input.passportExpiry),'INVALID_TRAVEL_DATES');
 requireGate(input.passportExpiry>=addCalendarMonths(input.arrival,policy.passportMonths),'PASSPORT_VALIDITY_TOO_SHORT');
 requireGate(/^[A-Z]{2}$/.test(input.nationality),'INVALID_COUNTRY');
 requireGate(!policy.nationalIdCountries.includes(input.nationality)||input.nationalIdVerified,'NATIONAL_ID_REQUIRED');
}
type TextPair={ar:string;en:string};
export type ArtworkEvidence={id:string;revision:number;title:TextPair;materials:TextPair;concept:TextPair;height:number;width:number;depth:number;year:number;insuranceValue:number;insuranceCurrency:string;textualDeclarationComplete:boolean;image:{artworkId:string;revision:number;storageVerified:boolean;scanClean:boolean;widthPx:number;heightPx:number;sha256:string}|null;editorialRevision?:number};
const bilingual=(v:TextPair)=>Boolean(v&&typeof v.ar==='string'&&v.ar.trim()&&typeof v.en==='string'&&v.en.trim());
export function assetGate(artworks:ArtworkEvidence[],expectedCount:number,minImagePixels:number,readyForPrint=false){
 requireGate(Number.isInteger(expectedCount)&&expectedCount>0&&Number.isInteger(minImagePixels)&&minImagePixels>0,'APPROVED_SCOPE_REQUIRED');
 requireGate(artworks.length===expectedCount&&new Set(artworks.map(a=>a.id)).size===artworks.length,'PENDING_ASSET');
 for(const a of artworks){requireGate(a.id&&Number.isInteger(a.revision)&&a.revision>0&&bilingual(a.title)&&bilingual(a.materials)&&bilingual(a.concept)&&[a.height,a.width,a.depth].every(n=>Number.isFinite(n)&&n>0)&&Number.isInteger(a.year)&&a.year>=1000&&a.year<=new Date().getUTCFullYear()&&Number.isFinite(a.insuranceValue)&&a.insuranceValue>=0&&['AED','USD','EUR'].includes(a.insuranceCurrency)&&a.textualDeclarationComplete,'INCOMPLETE_ARTWORK');
  const i=a.image;requireGate(i&&i.artworkId===a.id&&i.revision===a.revision&&i.storageVerified&&i.scanClean&&i.widthPx>=minImagePixels&&i.heightPx>=minImagePixels&&/^[a-f0-9]{64}$/.test(i.sha256),'IMAGE_EVIDENCE_REQUIRED');
  if(readyForPrint)requireGate(a.editorialRevision===a.revision,'EDITORIAL_APPROVAL_REQUIRED');
 }
}
export function labelTitle(title:string,religiousText:boolean){return religiousText?`(${title})`:title;}
export function vendorProjection(actor:Actor,scope:Scope,crate:{id:string;length:number;width:number;height:number;weight:number;pickupAddress:Record<string,string>;insuranceValue:number;insuranceCurrency:string}){
 authorize(actor,scope,['EXTERNAL_VENDOR']);return {referenceId:crate.id,dimensions:{length:crate.length,width:crate.width,height:crate.height},weight:crate.weight,pickupAddress:{...crate.pickupAddress},insuranceValue:crate.insuranceValue,insuranceCurrency:crate.insuranceCurrency};
}
export function shippingSLADue(readyAt:string,status:string,now:string){return status==='READY_FOR_SHIPPING'&&Number.isFinite(Date.parse(readyAt))&&Number.isFinite(Date.parse(now))&&Date.parse(now)-Date.parse(readyAt)>=48*3600000;}
export function visaRejectionGate(actor:Actor,scope:Scope,authorityReference:string,templates:{language:string;approvedAt:string|null;legalReference:string|null}[],requiredLanguages:string[]){
 authorize(actor,scope,['PR_OFFICER']);requireGate(authorityReference.trim().length>=3,'AUTHORITY_REFERENCE_REQUIRED');requireGate(requiredLanguages.length>0&&requiredLanguages.every(l=>templates.some(t=>t.language===l&&t.approvedAt&&Number.isFinite(Date.parse(t.approvedAt))&&t.legalReference?.trim())),'LEGAL_TEMPLATE_REQUIRED');
}
/** Authenticate outside the body; lock/read fresh scope, validate and commit inside one transaction.
 * Production adapter must implement membership lookup, row locking, idempotency and rollback.
 */
export function governanceMiddleware<Request,Tx,Result>(deps:{authenticate:(request:Request)=>Promise<Actor>;transaction:<T>(fn:(tx:Tx)=>Promise<T>)=>Promise<T>;loadScope:(tx:Tx,request:Request)=>Promise<Scope>;roles:Role[];execute:(tx:Tx,request:Request,actor:Actor,scope:Scope)=>Promise<Result>}){
 return async(request:Request)=>{const actor=await deps.authenticate(request);return deps.transaction(async tx=>{const scope=await deps.loadScope(tx,request);authorize(actor,scope,deps.roles);return deps.execute(tx,request,actor,scope);});};
}
