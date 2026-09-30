import React, { useEffect, useState } from 'react';
import { sandboxBlock, sandboxRoles, type SandboxAction } from '../lib/executiveSandbox';
import { useSandbox } from './SandboxProvider';

const input = 'mt-1 block w-full rounded-lg border border-[#8C8173] bg-white p-2.5 text-sm focus-visible:outline-2 focus-visible:outline-[#8B261E]';
const button = 'rounded-lg bg-[#8B261E] ps-4 pe-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B261E]';
export default function SandboxRoleActions({ dossierId }: { dossierId: string }) {
  const { role, state, run, error } = useSandbox();
  const d = state.dossiers[dossierId];
  // Switching desks or dossiers preserves unsubmitted fields for the presenter.
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [notices, setNotices] = useState<Record<string, string>>({});
  const draft = drafts[dossierId] ?? {};
  const dirty = Object.values(drafts).some(fields => Object.values(fields).some(Boolean));
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const set = (key: string, value: string) => setDrafts(all => ({ ...all, [dossierId]: { ...all[dossierId], [key]: value } }));
  const block = (action: SandboxAction) => error || sandboxBlock(d, role, action);
  const act = (action: SandboxAction, fields = draft) => {
    try {
      run(dossierId, action, fields);
      const used: Partial<Record<SandboxAction, string[]>> = { SUBMIT: ['submission'], REQUEST_REVISION: ['critique'], COLLECTION: ['address', 'date', 'packing'], VERIFY_PR: ['identity', 'travel'] };
      setDrafts(all => ({ ...all, [dossierId]: Object.fromEntries(Object.entries(all[dossierId] ?? {}).filter(([k]) => !used[action]?.includes(k))) }));
      setNotices(all => ({ ...all, [dossierId]: 'Sandbox action saved. Switch roles to continue the handoff.' }));
    } catch (e) { setNotices(all => ({ ...all, [dossierId]: e instanceof Error ? e.message : 'Unable to record this action.' })); }
  };
  const field = (key: string, label: string, type = 'text') => <label className="block text-sm" key={key}>{label}<input name={key} type={type} required value={draft[key] ?? ''} onChange={e => set(key, e.target.value)} onInput={e => { if (type === 'date') set(key, e.currentTarget.value); }} maxLength={2000} className={input}/></label>;
  const submit = (action: SandboxAction, label: string) => <><button type="submit" disabled={!!block(action)} className={button}>{label}</button>{block(action) && <p className="mt-2 text-sm text-[#655D50]">{block(action)}</p>}</>;
  return <section className="my-6 border-s-2 border-[#8B261E] bg-[#F7F1E6] p-5" aria-label="Role workspace">
    <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{sandboxRoles[role]} workspace</h3><span className="text-xs text-[#655D50]">Revision {d.revision} · {d.status}</span></div>
    <p className="mt-2 text-xs text-[#655D50]">Use synthetic information only. Progress stays in this browser tab; no messages, payments or live publishing.</p>
    {role === 'Artist_Portal' && <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); act('SUBMIT'); }}>
      {d.status === 'Revision requested' && <p className="text-sm"><strong>Coordinator’s revision request:</strong> {d.critique}</p>}
      <label className="block text-sm">Artwork submission / revised information<textarea required minLength={10} maxLength={2000} value={draft.submission ?? ''} onChange={e => set('submission', e.target.value)} rows={3} className={input}/></label>
      {submit('SUBMIT', d.revision ? 'Submit revised information' : 'Submit artwork information')}
    </form>}
    {role === 'General_Exhibition_Coordinator' && <div className="mt-4 space-y-4">
      <div><button type="button" disabled={!!block('READY')} className={button} onClick={() => act('READY')}>Ready for Executive Review</button>{block('READY') && <p className="mt-2 text-sm text-[#655D50]">{block('READY')}</p>}</div>
      <details><summary className="cursor-pointer text-sm">Request an artist revision</summary><form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); act('REQUEST_REVISION'); }}><label className="block text-sm">Critique notes<textarea required minLength={5} maxLength={2000} value={draft.critique ?? ''} onChange={e => set('critique', e.target.value)} className={input} rows={2}/></label>{submit('REQUEST_REVISION', 'Request Revision')}</form></details>
    </div>}
    {role === 'Logistics_Officer' && <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); act('COLLECTION', Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>); }}>
      {field('address', 'Collection address (synthetic)')}{field('date', 'Collection date', 'date')}{field('packing', 'Packing and handling instructions')}
      {submit('COLLECTION', 'Save collection details')}
    </form>}
    {role === 'PR_Officer' && <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); act('VERIFY_PR'); }}>
      <p className="text-sm">Record specialist evidence for the current revision. No passport numbers or documents are collected in this demo.</p>
      {(['identity', 'travel'] as const).map(key => <label key={key} className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={draft[key] === 'confirmed'} onChange={e => set(key, e.target.checked ? 'confirmed' : '')} className="mt-1 accent-[#8B261E]"/>{key === 'identity' ? 'Simulated identity evidence checked' : 'Simulated travel status checked'}</label>)}
      {submit('VERIFY_PR', 'Verify Identity & Travel Documents')}
    </form>}
    {role === 'Director' && <div className="mt-4"><button type="button" className={button} disabled={!!block('PUBLISH')} onClick={() => act('PUBLISH')}>Approve & Publish (sandbox)</button>{block('PUBLISH') && <p className="mt-2 text-sm text-[#655D50]">{block('PUBLISH')}</p>}</div>}
    {notices[dossierId] && <p role="status" className="mt-3 text-sm">{notices[dossierId]}</p>}
    {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
    <div className="mt-4 border-t border-[#DED5C4] pt-3 text-xs text-[#655D50]" aria-label="Shared evidence status">
      <p>PR evidence: {d.prRevision && d.prRevision === d.revision ? 'Current' : 'Pending'} · Collection details: {d.collectionRevision && d.collectionRevision === d.revision ? 'Current' : 'Pending'}</p>
      {d.submission && <details className="mt-3"><summary className="cursor-pointer">Submitted artwork information</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm">{d.submission}</p></details>}
      {d.collection && <details className="mt-3"><summary className="cursor-pointer">Saved collection details{d.collectionRevision !== d.revision ? ' · Requires review' : ''}</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm">{d.collection.address}<br/>{d.collection.date}<br/>{d.collection.packing}</p></details>}
      <details className="mt-3"><summary className="cursor-pointer">Sandbox decision history</summary><ol className="mt-2 space-y-2">{state.decisions.filter(x => x.dossierId === dossierId).map(x => <li key={x.id}>{sandboxRoles[x.role]} · {x.action.replaceAll('_', ' ')} · Revision {x.revision} · {new Date(x.at).toLocaleString('en-GB')}</li>)}</ol>{!state.decisions.some(x => x.dossierId === dossierId) && <p className="mt-2">No actions recorded.</p>}</details>
    </div>
  </section>;
}
