import {useEffect,useRef,useState} from 'react';
import {FileText,ShieldAlert} from 'lucide-react';
import {readTechnicalRider,requiresTechnicalRider,validTechnicalRider,type TechnicalRider} from '../data/technicalRider';
import type {NominatedArtistDossier} from './ArtistNominationForm';
export function TechnicalRiderUpload({value,onChange}:{value?:TechnicalRider;onChange:(value?:TechnicalRider)=>void}){
 const [notice,setNotice]=useState('');const generation=useRef(0);useEffect(()=>()=>{generation.current++;},[]);
 return <section className="space-y-3 rounded border border-amber-700 bg-[#F7F1E6] ps-4 pe-4 py-4"><h3 className="flex gap-2"><ShieldAlert aria-hidden="true"/>Technical &amp; Safety Rider / الملف التقني وتعليمات السلامة</h3><p>Required for sculpture / 3D installation. Include floor protection, loads, handling and installation instructions. Upload does not grant safety approval.</p><label className="block">Safety rider PDF — maximum 20 MiB<input className="block w-full min-w-0" type="file" accept=".pdf,application/pdf" onChange={async e=>{const n=++generation.current,file=e.target.files?.[0];onChange(undefined);if(!file)return;try{const rider=await readTechnicalRider(file);if(n!==generation.current)return;onChange(rider??undefined);setNotice(rider?'PDF recorded in this rehearsal dossier.':'Choose a PDF with a valid header, up to 20 MiB.');}catch{if(n===generation.current)setNotice('File could not be read. Try again.');}}}/></label>{value&&<p>{value.file.name}</p>}<p role="status">{notice}</p></section>;
}
export function TechnicalRiderReference({dossier}:{dossier:NominatedArtistDossier}){
 const rider=dossier.technicalRider,[url,setUrl]=useState('');
 useEffect(()=>{setUrl('');if(!validTechnicalRider(rider)||!rider)return;const next=URL.createObjectURL(rider.file);setUrl(next);return()=>URL.revokeObjectURL(next);},[rider]);
 if(!requiresTechnicalRider(dossier.medium,dossier.mediumTag)&&!rider)return null;
 return <section className="my-3 space-y-2 rounded border bg-[#FFFDF7] ps-4 pe-4 py-3 text-start"><h3 className="flex gap-2"><FileText aria-hidden="true"/>Technical &amp; Safety Rider · {dossier.artistName}</h3>{validTechnicalRider(rider)&&rider?<><a className="break-all underline" href={url||undefined} download={rider.file.name}>Download safety instructions — {rider.file.name}</a><p>{rider.uploadedAt}</p></>:<p role="status" className="text-red-800">Required safety rider missing — nomination/approval locked.</p>}<p className="text-sm">Shared session file • lost on refresh • evidence, not structural or venue approval.</p></section>;
}
