/** SADU controlled vocabulary v1. These are local conventions, not UNESCO enums. */
export const heritageVocabulary = {
  transmission_method: { INTERGENERATIONAL:'انتقال عبر الأجيال', FORMAL_TRAINING:'تدريب رسمي', PEER_EXCHANGE:'تبادل بين الأقران', REVITALIZATION_PROGRAM:'برنامج إحياء' },
  safeguarding_measure: { DOCUMENTATION:'توثيق', EXHIBITION:'عرض', CAPACITY_BUILDING:'بناء القدرات', ECONOMIC_SUPPORT:'دعم اقتصادي' },
  material_provenance: { NATURAL_RAW:'مواد خام طبيعية', SYNTHETIC:'مواد اصطناعية', MIXED_MEDIA:'وسائط مختلطة', HISTORICAL_DYE:'صبغة تاريخية' },
};
export const socialActorTypes = ['Institution','Family_Group','Guild','Master_Practitioner'];
export const heritageDecision = 'https://ich.unesco.org/en/decisions/20.COM/7.C.1';
const fail = message => { throw Object.assign(new Error(message), {status:422}); };
export function validateHeritage(value, registry = [], exhibitionId) {
  if (!value || typeof value !== 'object') fail('Record safeguarding applicability before submission.');
  if (value.applicability === 'NOT_APPLICABLE') {
    if (typeof value.reason !== 'string' || value.reason.trim().length < 10 || value.reason.length > 500) fail('Explain why this record is outside the safeguarding taxonomy.');
    return { applicability:'NOT_APPLICABLE', reason:value.reason.trim(), vocabulary_version:1 };
  }
  if (value.applicability !== 'APPLICABLE') fail('Choose safeguarding applicability.');
  for (const key of ['transmission_method','material_provenance']) if (!Object.hasOwn(heritageVocabulary[key],value[key])) fail(`Invalid ${key}.`);
  const measures=value.safeguarding_measure;
  if (!Array.isArray(measures) || !measures.length || measures.length>4 || new Set(measures).size!==measures.length || measures.some(v=>!Object.hasOwn(heritageVocabulary.safeguarding_measure,v))) fail('Select valid safeguarding measures without duplicates.');
  const actors=value.social_actors;
  if (!Array.isArray(actors) || !actors.length || actors.length>50 || new Set(actors).size!==actors.length || actors.some(id=>typeof id!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !registry.some(a=>a.id===id&&a.exhibitionId===exhibitionId&&socialActorTypes.includes(a.kind)))) fail('Select registered social actors from this exhibition.');
  return { applicability:'APPLICABLE', vocabulary_version:1, transmission_method:value.transmission_method, safeguarding_measure:[...measures].sort(), social_actors:[...actors].sort(), material_provenance:value.material_provenance };
}
export function institutionalAssertion(revision) {
  return { record_type:'Institutional_Assertion', target_entity_id:revision.artworkId, revision_id:revision.id, version_hash:revision.versionHash,
    source_decision:heritageDecision, decision_year:2025, mapping_authority:'SADU_LOCAL_VOCABULARY', evidence_status:revision.heritage ? 'DECLARED_NOT_INDEPENDENTLY_VERIFIED' : 'NOT_RECORDED',
    criteria_mapping:{transmission_method:['R.1'],safeguarding_measure:['G.1'],social_actors:['G.3'],material_provenance:['R.2']},
    declaration:revision.heritage ?? null, compliance_determination:'NOT_ASSESSED' };
}
