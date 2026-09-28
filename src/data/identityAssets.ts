export interface IdentityAsset {
  id: string; groupId: string; version: number; file: File; digest: string; attachedAt: string;
  reviewedAt?: string; approvedAt?: string; removed?: boolean;
}
export const ASSET_LIMIT = 20;
export const ASSET_BYTES = 10 * 1024 * 1024;
const formats: Record<string,string> = {svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',pdf:'application/pdf'};
export function assetFileError(file: Pick<File,'name'|'type'|'size'>): 'format'|'size'|null {
  const mime=formats[file.name.split('.').pop()?.toLowerCase() ?? ''];
  if(!mime || (file.type && file.type!==mime)) return 'format';
  return file.size<=0 || file.size>ASSET_BYTES ? 'size' : null;
}
export type AssetAction =
 | {type:'attach';asset:IdentityAsset;replaceId?:string}
 | {type:'review'|'approve'|'remove'|'restore';id:string;at:string};
export function updateIdentityAssets(rows:IdentityAsset[],action:AssetAction,unlocked:boolean):IdentityAsset[] {
  if(!unlocked) return rows;
  if(action.type==='attach') {
    const a=action.asset,previous=rows.find(r=>r.id===action.replaceId);
    if(rows.length>=ASSET_LIMIT||assetFileError(a.file)||!a.id||!a.digest||!Number.isFinite(Date.parse(a.attachedAt))||a.reviewedAt||a.approvedAt||a.removed||rows.some(r=>r.id===a.id||r.digest===a.digest))return rows;
    if(action.replaceId && (!previous||previous.removed))return rows;
    const groupId=previous?.groupId??a.id;
    const version=Math.max(0,...rows.filter(r=>r.groupId===groupId).map(r=>r.version))+1;
    return [...rows,{...a,groupId,version}];
  }
  const row=rows.find(r=>r.id===action.id);
  if(!row||!Number.isFinite(Date.parse(action.at)))return rows;
  if(action.type==='restore')return row.removed?rows.map(r=>r.id===row.id?{...r,removed:false}:r):rows;
  if(row.removed)return rows;
  if(action.type==='remove')return row.approvedAt?rows:rows.map(r=>r.id===row.id?{...r,removed:true}:r);
  if(action.type==='review')return row.reviewedAt?rows:rows.map(r=>r.id===row.id?{...r,reviewedAt:action.at}:r);
  if(!row.reviewedAt||row.approvedAt||rows.some(r=>r.groupId===row.groupId&&r.version>row.version&&r.approvedAt))return rows;
  return rows.map(r=>r.id===row.id?{...r,approvedAt:action.at}:r);
}
