import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTheme, emptyTheme, restoreTheme, type ThemeEvent, type Proposal, type Essay } from '../src/lib/themeWorkflow';
const proposals: Proposal[] = [1,2,3].map(i => ({ en: `Theme ${i}`, ar: `الموضوع ${i}`, rationale: 'Shared practice', feasibility: 'Within exhibition scope', translation: 'Human bilingual preflight completed; no concerns identified' }));
const essay: Essay = { introduction: { en: 'An introduction', ar: 'مقدمة' }, context: { en: 'Cultural context', ar: 'السياق الثقافي' }, checkedEn: true, checkedAr: true };
function fixture() { let state = emptyTheme(); return { get state() { return state; }, act(role: ThemeEvent['role'], action: ThemeEvent['action'], fields: Partial<ThemeEvent> = {}) { state = applyTheme(state, { ...fields, role, action, at: '2026-09-30T12:00:00Z', expected: state.revision }); } }; }
test('theme journey publishes an exact bilingual snapshot and restores across reload', () => {
 const f = fixture(); f.act('Committee','SUBMIT_PROPOSAL',{ proposals }); f.act('Editorial','PREFLIGHT',{preflight:'Both titles and directions reviewed; concerns captured in proposals.'}); f.act('Director','ENDORSE'); f.act('Chairman','SELECT',{selected:1}); f.act('Editorial','SUBMIT_ESSAY',{essay}); f.act('Chairman','PUBLISH');
 assert.equal(f.state.published?.selected,1); assert.deepEqual(f.state.published?.essay,essay);
 assert.deepEqual(restoreTheme(JSON.stringify({version:1,events:f.state.events})),f.state);
 const approved = structuredClone(f.state.published); f.act('Committee','NEW_VERSION');
 assert.equal(f.state.phase,'Proposal draft'); assert.deepEqual(f.state.published,approved);
 assert.throws(() => f.act('Chairman','SELECT',{selected:0}),/not available/);
});
test('Chairman changes require resolution and fresh Director endorsement', () => {
 const f = fixture(); f.act('Committee','SUBMIT_PROPOSAL',{proposals}); f.act('Editorial','PREFLIGHT',{preflight:'Both titles and directions reviewed; concerns captured in proposals.'}); f.act('Director','ENDORSE'); f.act('Chairman','RETURN',{note:{reason:'Budgetary scope concern',text:'Clarify resources',anchor:'Proposal 1'}});
 assert.throws(() => f.act('Committee','SUBMIT_PROPOSAL',{proposals}),/Resolve every/);
 f.act('Committee','RESOLVE',{noteId:f.state.notes[0].id,resolution:'Clarification needed',explanation:'Please specify budget'});
 assert.throws(() => f.act('Committee','SUBMIT_PROPOSAL',{proposals}),/Resolve every/);
 f.act('Committee','RESOLVE',{noteId:f.state.notes[0].id,resolution:'Not adopted',explanation:'Existing facilities cover this scope'});
 f.act('Committee','SUBMIT_PROPOSAL',{proposals}); assert.equal(f.state.phase,'Director review');
 assert.throws(() => f.act('Chairman','SELECT',{selected:1}),/not available/);
});
test('role, required fields, stale mutations, malformed journals and language gates fail closed', () => {
 const f = fixture(); assert.throws(() => f.act('Artist_Portal','SUBMIT_PROPOSAL',{proposals}),/not available/);
 assert.throws(() => f.act('Committee','SUBMIT_PROPOSAL',{proposals:proposals.slice(1)}),/Complete all/);
 f.act('Committee','SUBMIT_PROPOSAL',{proposals});
 assert.throws(() => applyTheme(f.state,{role:'Director',action:'ENDORSE',expected:0,at:'now'}),/changed/);
 assert.throws(() => f.act('Director','RETURN',{note:{reason:'Other',text:'Change',anchor:''}}),/Choose a reason/);
 f.act('Editorial','PREFLIGHT',{preflight:'Both titles and directions reviewed; concerns captured in proposals.'}); f.act('Director','ENDORSE'); assert.throws(() => f.act('Chairman','SELECT',{selected:3}),/Select one/); f.act('Chairman','SELECT',{selected:0});
 assert.throws(() => f.act('Editorial','SUBMIT_ESSAY',{essay:{...essay,checkedAr:false}}),/both languages/);
 assert.throws(() => restoreTheme('{broken'));
 assert.throws(() => restoreTheme('{"version":2,"events":[]}'),/Invalid/);
});
test('final revision loop preserves prior snapshots and requires a second Chairman decision', () => {
 const f = fixture(); f.act('Committee','SUBMIT_PROPOSAL',{proposals}); f.act('Editorial','PREFLIGHT',{preflight:'Both titles and directions reviewed; concerns captured in proposals.'}); f.act('Director','ENDORSE'); f.act('Chairman','SELECT',{selected:0}); f.act('Editorial','SUBMIT_ESSAY',{essay});
 f.act('Chairman','RETURN',{note:{reason:'Translation or cultural concern',text:'Clarify introduction',anchor:'Introduction'}});
 assert.throws(() => f.act('Chairman','PUBLISH'),/not available/);
 f.act('Editorial','RESOLVE',{noteId:f.state.notes[0].id,resolution:'Addressed',explanation:'Revised both introductions'});
 const revision = {...essay,introduction:{en:'New introduction',ar:'مقدمة جديدة'}};
 f.act('Editorial','SUBMIT_ESSAY',{essay:revision}); f.act('Chairman','PUBLISH');
 assert.equal(f.state.snapshots[1].essay?.introduction.en,'An introduction'); assert.equal(f.state.published?.essay.introduction.en,'New introduction');
});
