import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { readProfiles, writeProfile, type MasterProfile } from '../data/masterDirectory';
const Context=createContext<{profiles:MasterProfile[];ready:boolean;error:string;save:(p:MasterProfile)=>Promise<void>;register:(p:MasterProfile)=>Promise<void>}|null>(null);
export function MasterDirectoryProvider({children}:{children:ReactNode}) {
 const [profiles,setProfiles]=useState<MasterProfile[]>([]),[ready,setReady]=useState(false),[error,setError]=useState('');
 const refresh=useCallback(async()=>{setProfiles(await readProfiles());},[]);
 useEffect(()=>{refresh().then(()=>setReady(true)).catch(()=>setError('Persistent browser storage is unavailable. Profiles cannot be saved.'));},[refresh]);
 const register=useCallback(async(p:MasterProfile)=>{try{await writeProfile(p,true);await refresh();}catch{setError('Unable to register profile in browser storage.');}},[refresh]);
 const save=useCallback(async(p:MasterProfile)=>{await writeProfile(p);await refresh();},[refresh]);
 return <Context.Provider value={{profiles,ready,error,save,register}}>{children}</Context.Provider>;
}
export function useMasterDirectory(){const value=useContext(Context);if(!value)throw new Error('Master directory provider missing');return value;}
export function DirectoryRegistration({artists}:{artists:{id:string;artistName:string;nationality:string;medium:string}[]}) {
 const directory=useMasterDirectory();
 useEffect(()=>{if(!directory.ready)return;let stopped=false;async function register(){for(const artist of artists){if(stopped)return;if(!directory.profiles.some(p=>p.id===artist.id)){const profile:MasterProfile={id:artist.id,name:artist.artistName,nationality:artist.nationality,medium:artist.medium,editions:['12th Edition'],bioAr:'',bioEn:'',affiliations:'',press:[]};await directory.register(profile);}}}register().catch(()=>{});return()=>{stopped=true;};},[artists,directory.ready,directory.profiles,directory.register]);
 return null;
}
