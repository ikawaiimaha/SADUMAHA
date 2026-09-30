import test from 'node:test';
import assert from 'node:assert/strict';
import {validateHeritage,institutionalAssertion} from '../src/heritage/taxonomy.mjs';
const id='901bb523-c68b-4db8-b605-e4841d715c2f';
const registry=[{id,kind:'Institution',exhibitionId:'demo'}];
const value={applicability:'APPLICABLE',transmission_method:'INTERGENERATIONAL',safeguarding_measure:['DOCUMENTATION'],material_provenance:'NATURAL_RAW',social_actors:[id]};
test('controlled declarations reject missing, unknown, duplicate and out-of-scope values',()=>{
 assert.equal(validateHeritage(value,registry,'demo').vocabulary_version,1);
 for(const v of [null,{...value,transmission_method:'OTHER'},{...value,safeguarding_measure:[]},{...value,safeguarding_measure:['DOCUMENTATION','DOCUMENTATION']},{...value,social_actors:['missing']}]) assert.throws(()=>validateHeritage(v,registry,'demo'),{status:422});
 assert.throws(()=>validateHeritage(value,registry,'another-exhibition'),{status:422});
 assert.throws(()=>validateHeritage({applicability:'NOT_APPLICABLE',reason:'x'}),{status:422});
 assert.deepEqual(validateHeritage({applicability:'NOT_APPLICABLE',reason:'Contemporary sculpture outside this programme.',social_actors:[id]}),{applicability:'NOT_APPLICABLE',reason:'Contemporary sculpture outside this programme.',vocabulary_version:1});
});
test('assertions identify source revision and never declare UNESCO compliance',()=>{
 const output=institutionalAssertion({id:'revision',artworkId:'art',versionHash:'hash',heritage:validateHeritage(value,registry,'demo')});
 assert.equal(output.decision_year,2025);assert.equal(output.compliance_determination,'NOT_ASSESSED');assert.equal(output.version_hash,'hash');
 assert.equal(institutionalAssertion({id:'old'}).evidence_status,'NOT_RECORDED');
});
