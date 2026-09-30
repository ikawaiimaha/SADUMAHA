import React from 'react';
import { heritageVocabulary } from '../heritage/taxonomy.mjs';
export type HeritageDraft = { applicability: string; reason: string; transmission_method: string; safeguarding_measure: string[]; material_provenance: string; social_actors: string[] };
export const emptyHeritage = (): HeritageDraft => ({ applicability:'',reason:'',transmission_method:'',safeguarding_measure:[],material_provenance:'',social_actors:[] });
const input='mt-1 block w-full rounded-lg border border-[#8C8173] bg-white p-2 text-sm';
export default function HeritageFields({value,onChange,actors=[]}:{value:HeritageDraft;onChange:(v:HeritageDraft)=>void;actors?:{id:string;label:string}[]}) {
  const set=(key:keyof HeritageDraft,v:string|string[])=>onChange({...value,[key]:v});
  return <fieldset className="mt-4 space-y-3 border-t border-[#DED5C4] pt-4"><legend className="text-sm font-semibold">Safeguarding context / سياق الصون</legend>
    <p className="text-xs text-[#655D50]">SADU vocabulary inspired by UNESCO Decision 20.COM 7.C.1 (2025). A declaration is not certification.</p>
    <label className="block text-sm">Applicability / مدى الانطباق<select required className={input} value={value.applicability} onChange={e=>set('applicability',e.target.value)}><option value="">Choose / اختر</option><option value="APPLICABLE">Applicable / ينطبق</option><option value="NOT_APPLICABLE">Not applicable / لا ينطبق</option></select></label>
    {value.applicability==='NOT_APPLICABLE'&&<label className="block text-sm">Reason / السبب<input required minLength={10} maxLength={500} className={input} value={value.reason} onChange={e=>set('reason',e.target.value)}/></label>}
    {value.applicability==='APPLICABLE'&&<>
      {(['transmission_method','material_provenance'] as const).map(key=><label key={key} className="block text-sm">{key==='transmission_method'?'Transmission method / طريقة نقل المعرفة':'Material provenance category / فئة أصل المواد'}<select required className={input} value={value[key]} onChange={e=>set(key,e.target.value)}><option value="">Choose / اختر</option>{Object.entries(heritageVocabulary[key]).map(([en,ar])=><option value={en} key={en}>{en} / {String(ar)}</option>)}</select></label>)}
      <fieldset><legend className="text-sm">Safeguarding measures / تدابير الصون — select at least one</legend>{Object.entries(heritageVocabulary.safeguarding_measure).map(([en,ar])=><label key={en} className="mt-2 flex gap-2 text-sm"><input type="checkbox" checked={value.safeguarding_measure.includes(en)} onChange={e=>set('safeguarding_measure',e.target.checked?[...value.safeguarding_measure,en]:value.safeguarding_measure.filter(x=>x!==en))}/>{en} / {String(ar)}</label>)}</fieldset>
      <fieldset><legend className="text-sm">Social actors / الجهات المشاركة — select at least one</legend>{actors.map(a=><label key={a.id} className="mt-2 flex gap-2 text-sm"><input type="checkbox" checked={value.social_actors.includes(a.id)} onChange={e=>set('social_actors',e.target.checked?[...value.social_actors,a.id]:value.social_actors.filter(x=>x!==a.id))}/>{a.label}</label>)}{!actors.length&&<p className="text-sm">No registered actors are available. A Coordinator must register the participating actors before this declaration can be submitted.</p>}</fieldset>
    </>}
  </fieldset>;
}
