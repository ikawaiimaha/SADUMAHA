export interface DigitalAsset { id: string; file: File; at: string }
export interface PrototypeTicket { id: string; title: string; photos: File[]; status: 'PENDING_ARTIST_APPROVAL' | 'ARTIST_APPROVED' | 'ARTIST_REJECTED'; requestedAt: string; decidedAt?: string }
export const validMaster = (file: File) => /\.(mov|mp4|m2v)$/i.test(file.name) && file.size > 0 && file.size <= 2 * 1024 ** 3;
export const validTestPhoto = (file: File) => /\.(png|jpe?g)$/i.test(file.name) && ['image/png','image/jpeg'].includes(file.type) && file.size > 0 && file.size <= 10 * 1024 ** 2;
export function ingestMaster(rows: DigitalAsset[], item: DigitalAsset, actor: string): DigitalAsset[] {
 if(actor !== 'ARTIST' || rows.length >= 5 || !validMaster(item.file) || !Number.isFinite(Date.parse(item.at)) || rows.some(r=>r.id===item.id || r.file.name===item.file.name && r.file.size===item.file.size && r.file.lastModified===item.file.lastModified)) return rows;
 return [...rows,item];
}
export function requestPrototype(rows: PrototypeTicket[], item: PrototypeTicket, actor: string): PrototypeTicket[] {
 if(actor!=='TECHNICAL' || !item.title.trim() || !item.photos.length || item.photos.length>5 || !item.photos.every(validTestPhoto) || item.status!=='PENDING_ARTIST_APPROVAL' || item.decidedAt || !Number.isFinite(Date.parse(item.requestedAt)) || rows.some(r=>r.id===item.id || r.status==='PENDING_ARTIST_APPROVAL' && r.title.trim()===item.title.trim())) return rows;
 return [...rows,{...item,title:item.title.trim()}];
}
export function decidePrototype(rows: PrototypeTicket[], id: string, approve: boolean, actor: string, at: string): PrototypeTicket[] {
 if(actor!=='ARTIST' || !Number.isFinite(Date.parse(at)) || !rows.some(r=>r.id===id && r.status==='PENDING_ARTIST_APPROVAL' && Date.parse(at)>=Date.parse(r.requestedAt))) return rows;
 return rows.map(r=>r.id===id ? {...r,status:approve?'ARTIST_APPROVED':'ARTIST_REJECTED',decidedAt:at}:r);
}
