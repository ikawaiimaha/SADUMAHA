import React, { createContext, useContext, useRef, useState } from 'react';
import { applySandboxEvent, emptySandbox, restoreSandbox, sandboxRoles, type SandboxAction, type SandboxEvent, type SandboxRole, type SandboxState } from '../lib/executiveSandbox';

const KEY = 'sadu-executive-sandbox-v1';
const ROLE_KEY = 'sadu-executive-sandbox-role';
type Session = { state: SandboxState; events: SandboxEvent[]; error: string };
const SandboxContext = createContext<{
  role: SandboxRole; setRole: (role: SandboxRole) => void; state: SandboxState; error: string;
  run: (id: string, action: SandboxAction, fields?: Record<string, string>) => void;
} | null>(null);
export function SandboxProvider({ children }: { children: React.ReactNode }) {
  const [role, updateRole] = useState<SandboxRole>(() => {
    try { const value = sessionStorage.getItem(ROLE_KEY); return value && Object.hasOwn(sandboxRoles, value) ? value as SandboxRole : 'General_Exhibition_Coordinator'; }
    catch { return 'General_Exhibition_Coordinator'; }
  });
  const [session, setSession] = useState<Session>(() => {
    try { return { ...restoreSandbox(sessionStorage.getItem(KEY)), error: '' }; }
    catch { return { state: emptySandbox(), events: [], error: 'The saved sandbox session could not be read. Actions are locked to preserve it. Open a new browser tab for a fresh simulation.' }; }
  });
  const latest = useRef(session);
  const setRole = (next: SandboxRole) => {
    if (!Object.hasOwn(sandboxRoles, next)) return;
    updateRole(next);
    try { sessionStorage.setItem(ROLE_KEY, next); } catch { /* The active role still works in memory. */ }
  };
  const run = (id: string, action: SandboxAction, fields: Record<string, string> = {}) => {
    const current = latest.current;
    if (current.error) throw new Error(current.error);
    if (current.events.length >= 1000) throw new Error('This demo session is full. Start another demo in a new tab.');
    const event: SandboxEvent = { id: crypto.randomUUID(), at: new Date().toISOString(), dossierId: id, role, action, fields, expectedRevision: current.state.dossiers[id].revision };
    const state = applySandboxEvent(current.state, event);
    const events = [...current.events, event];
    // Persist before showing success, so a failed write leaves the form and workflow unchanged.
    try { sessionStorage.setItem(KEY, JSON.stringify({ version: 1, events })); }
    catch { throw new Error('The browser could not save this action. Your inputs are still here; enable session storage and retry.'); }
    latest.current = { state, events, error: '' }; setSession(latest.current);
  };
  return <SandboxContext.Provider value={{ role, setRole, state: session.state, error: session.error, run }}>{children}</SandboxContext.Provider>;
}
export function useSandbox() {
  const context = useContext(SandboxContext);
  if (!context) throw new Error('SandboxProvider is required.');
  return context;
}
