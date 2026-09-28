export interface PressFile { id: string; file: File; uploadedAt: string }
export interface MasterProfile { id: string; name: string; nationality: string; medium: string; editions: string[]; bioAr: string; bioEn: string; affiliations: string; press: PressFile[]; updatedAt?: string }
export const validPressFile = (file: File) => /\.pdf$/i.test(file.name) && (!file.type || file.type === 'application/pdf') && file.size > 0 && file.size <= 20 * 1024 * 1024;
export function filterProfiles(profiles: MasterProfile[], query: string, medium: string, nationality: string, edition: string) {
 const term=query.trim().toLocaleLowerCase();
 return profiles.filter(p=>(!term||[p.name,p.bioAr,p.bioEn,p.affiliations].join(' ').toLocaleLowerCase().includes(term))&&(!medium||p.medium===medium)&&(!nationality||p.nationality===nationality)&&(!edition||p.editions.includes(edition)));
}
const DB_NAME='sadu-master-directory-v1';
function openDirectory(): Promise<IDBDatabase> {
 return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>request.result.createObjectStore('profiles',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
}
export async function readProfiles(): Promise<MasterProfile[]> {
 const db=await openDirectory();return new Promise((resolve,reject)=>{const tx=db.transaction('profiles','readonly'),request=tx.objectStore('profiles').getAll();tx.oncomplete=()=>{db.close();resolve(request.result);};tx.onerror=()=>{db.close();reject(tx.error);};});
}
export async function writeProfile(profile: MasterProfile, onlyIfMissing=false): Promise<void> {
 const db=await openDirectory();return new Promise((resolve,reject)=>{const tx=db.transaction('profiles','readwrite'),store=tx.objectStore('profiles');if(onlyIfMissing){const request=store.get(profile.id);request.onsuccess=()=>{if(!request.result)store.put(profile);};}else store.put(profile);tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>{db.close();reject(tx.error??new Error('Storage write aborted'));};tx.onerror=()=>{db.close();reject(tx.error);};});
}
