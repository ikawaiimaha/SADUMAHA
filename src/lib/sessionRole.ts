import type { Session } from '@supabase/supabase-js';

// The access-token hook (sadu_custom_access_token) issues institutional_role into the token only.
// session.user.app_metadata is read from auth.users and never carries it, so read the token claims.
// Display only: row-level security enforces every permission on the server.
export function institutionalRole(session: Pick<Session, 'access_token'> | null | undefined): string {
  const payload = session?.access_token?.split('.')[1];
  if (!payload) return '';
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes));
    const role = claims.institutional_role ?? claims.app_metadata?.institutional_role;
    return typeof role === 'string' ? role : '';
  } catch {
    return '';
  }
}

export const institutionalRoleLabels: Record<string, { en: string; ar: string }> = {
  ADMIN: { en: 'Administrator', ar: 'مسؤول النظام' },
  ARTIST: { en: 'Artist', ar: 'الفنان' },
  BIENNIAL_DIRECTOR: { en: 'Biennial Director', ar: 'مدير الملتقى' },
  CHAIRMAN: { en: 'Chairman', ar: 'رئيس الدائرة' },
  COORDINATOR: { en: 'Exhibition Coordinator', ar: 'منسق المعرض' },
  GENERAL_COORDINATOR: { en: 'General Exhibition Coordinator', ar: 'المنسقة' },
  EDITORIAL: { en: 'Editorial', ar: 'قسم التحرير' },
  EDITORIAL_DEPARTMENT: { en: 'Editorial Department', ar: 'قسم التحرير' },
  EXTERNAL_VENDOR: { en: 'External vendor', ar: 'مورد خارجي' },
  FINANCE: { en: 'Finance', ar: 'المالية' },
  LOGISTICS: { en: 'Logistics', ar: 'الشؤون اللوجستية' },
  PREPARATORY_COMMITTEE: { en: 'Preparatory Committee', ar: 'اللجنة التحضيرية' },
  PR_PROTOCOL: { en: 'PR & Protocol', ar: 'العلاقات العامة والتشريفات' },
  TECHNICAL: { en: 'Technical', ar: 'الفريق الفني' },
};

// Which pilot tools each role works with. Mirrors the role routing of the workbench (App.tsx).
export type PilotTool =
  | 'guestCalendar' | 'pendingAssets' | 'guestTravel' | 'conditionReports' | 'finalDeliverables'
  | 'freightPickup' | 'checklistQueue' | 'arrivalFeed' | 'freightChange' | 'logisticsQueue'
  | 'freightClosure' | 'titleHeader' | 'publicationHandoff' | 'titleGate';

const pilotTools: Record<PilotTool, string[]> = {
  titleHeader: ['COORDINATOR', 'GENERAL_COORDINATOR', 'BIENNIAL_DIRECTOR', 'CHAIRMAN', 'PR_PROTOCOL', 'TECHNICAL'],
  titleGate: ['GENERAL_COORDINATOR'],
  pendingAssets: ['COORDINATOR', 'BIENNIAL_DIRECTOR', 'LOGISTICS'],
  guestCalendar: ['TECHNICAL', 'GENERAL_COORDINATOR', 'BIENNIAL_DIRECTOR', 'PR_PROTOCOL'],
  guestTravel: ['ARTIST', 'PR_PROTOCOL'],
  conditionReports: ['ARTIST', 'LOGISTICS', 'TECHNICAL'],
  finalDeliverables: ['ARTIST'],
  freightPickup: ['ARTIST', 'LOGISTICS'],
  checklistQueue: ['COORDINATOR', 'LOGISTICS'],
  arrivalFeed: ['TECHNICAL', 'COORDINATOR', 'LOGISTICS', 'ARTIST'],
  freightChange: ['ARTIST', 'EXTERNAL_VENDOR', 'LOGISTICS', 'FINANCE'],
  logisticsQueue: ['ARTIST', 'LOGISTICS', 'BIENNIAL_DIRECTOR', 'CHAIRMAN'],
  freightClosure: ['ARTIST', 'GENERAL_COORDINATOR', 'LOGISTICS', 'EXTERNAL_VENDOR'],
  publicationHandoff: ['EDITORIAL', 'ADMIN'],
};

export const showsPilotTool = (role: string, tool: PilotTool) => pilotTools[tool].includes(role);

// Roles the spatial pilot tables (sadu_pilot_members) can enrol.
export const spatialPilotRoles = ['COORDINATOR', 'BIENNIAL_DIRECTOR', 'GENERAL_COORDINATOR', 'TECHNICAL'];
