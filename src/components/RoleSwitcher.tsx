import React from 'react';
import { sandboxRoles, type SandboxRole } from '../lib/executiveSandbox';
import { useSandbox } from './SandboxProvider';

export default function RoleSwitcher() {
  const { role, setRole } = useSandbox();
  return <div className="text-start">
    <label htmlFor="sandbox-role" className="block text-xs text-[#655D50]">Sandbox role</label>
    <select id="sandbox-role" value={role} onChange={e => setRole(e.target.value as SandboxRole)} className="mt-1 max-w-full rounded-lg border border-[#DED5C4] bg-[#FFFDF9] ps-3 pe-8 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#8B261E]">
      {Object.entries(sandboxRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <p className="mt-1 text-xs text-[#655D50]">Simulation only · No live permissions</p>
  </div>;
}
