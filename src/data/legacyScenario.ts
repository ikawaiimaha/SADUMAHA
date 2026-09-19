import type { RoleKey, WorkspaceTab } from '../types';

export const FINANCE_SCENARIO_ID = 'DEMO-FINANCE-01';
export const FINANCE_SCENARIO_LABEL = {
  en: 'Fixed finance sample',
  ar: 'مثال مالي ثابت',
};

// This is presentation scoping, not authorization.
export function isFinanceScenario(role: RoleKey, tab: WorkspaceTab): boolean {
  return role === 'FINANCE' && ['overview', 'contracts', 'operations'].includes(tab);
}
