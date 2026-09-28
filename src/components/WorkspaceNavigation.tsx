import { Compass, Globe, BookOpen, ArrowUpRight } from 'lucide-react';
import type { InstitutionalRole } from '../App';

const ROLE_GROUPS: { ar: string; en: string; roles: [InstitutionalRole, string, string][] }[] = [
  { ar: 'الثيمة والتوجيهات', en: 'Theme & guidelines', roles: [
    ['PREP_COMMITTEE', 'اللجنة التحضيرية', 'Preparatory Committee'],
    ['BIENNIAL_DIRECTOR', 'مدير الملتقى', 'Biennial Director'],
    ['CHAIRMAN', 'رئيس الدائرة', 'Chairman'],
    ['EDITORIAL', 'قسم التحرير', 'Editorial'],
    ['HIP', 'منسق معرض عام', 'HIP'],
  ] },
  { ar: 'التنفيذ والتعاقد', en: 'Delivery & agreements', roles: [
    ['COORDINATOR', 'المنسق العام', 'Coordinator'], ['ARTIST', 'الفنان', 'Artist'],
    ['PR_PROTOCOL', 'التشريفات والعلاقات', 'PR & Protocol'], ['TECHNICAL', 'الفريق الفني', 'Technical'],
    ['FINANCE', 'الشؤون المالية', 'Finance'], ['LOGISTICS', 'اللوجستيات والإعادة', 'Logistics & Return'],
  ] },
];

export interface WorkspaceHandoff {
  title: string;
  description: string;
  owner?: InstitutionalRole;
}

export function WorkspaceNavigation({ role, onNavigate, isAr, onToggleLanguage, onOpenPresenter, handoff }: {
  role: InstitutionalRole;
  onNavigate: (role: InstitutionalRole) => void;
  isAr: boolean;
  onToggleLanguage: () => void;
  onOpenPresenter: () => void;
  handoff?: WorkspaceHandoff;
}) {
  const control = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#D9CEBA] bg-white ps-3 pe-3 py-2 text-sm text-[#51453B] hover:bg-[#EDE4D3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B261E]';
  return <header dir={isAr ? 'rtl' : 'ltr'} className="sticky top-0 z-50 border-b border-[#D9CEBA] bg-[#F7F1E6] text-[#2C2A29] shadow-sm">
    <p className="border-b border-[#D9CEBA] ps-4 pe-4 py-2 text-center text-xs" dir="ltr">Guided rehearsal • fictional records • no external actions</p>
    <p className="ps-4 pe-4 py-1 text-center text-xs text-[#736357]">{isAr ? 'العقود والمراجعات الفنية والاعتمادات تخص هذه الجلسة فقط؛ ليست سجلات قانونية ثابتة.' : 'Contracts, engineering reviews and approvals are session-bound prototype state, not immutable legal records.'}</p>
    <nav aria-label={isAr ? 'مساحات العمل' : 'Workspaces'} className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 ps-4 pe-4 py-3">
      <div className="me-auto flex items-baseline gap-2">
        <span className="font-serif text-2xl font-bold text-[#8B261E]">{isAr ? 'سدو' : 'SADU'}</span>
        <span className="text-xs text-[#736357]">{isAr ? 'عرض تجريبي' : 'Demo'}</span>
      </div>
      <label className="flex min-w-0 items-center gap-2 text-sm">
        <span className="sr-only sm:not-sr-only">{isAr ? 'مساحة العمل' : 'Workspace'}</span>
        <select value={role} onChange={event => onNavigate(event.target.value as InstitutionalRole)} className="min-h-10 max-w-full rounded-md border border-[#D9CEBA] bg-white ps-3 pe-3 py-2 text-start focus-visible:outline-2 focus-visible:outline-[#8B261E]">
          {ROLE_GROUPS.map(group => <optgroup key={group.en} label={isAr ? group.ar : group.en}>
            {group.roles.map(([value, ar, en]) => <option key={value} value={value}>{isAr ? ar : en}</option>)}
          </optgroup>)}
          <option value="ROLES">{isAr ? 'جميع الأدوار' : 'All Roles'}</option>
        </select>
      </label>
      <button type="button" onClick={onToggleLanguage} className={control}><Globe className="size-4" aria-hidden="true" />{isAr ? 'English' : 'العربية'}</button>
      <details className="relative">
        <summary className={`${control} cursor-pointer`}>{isAr ? 'أدوات العرض' : 'Demo tools'}</summary>
        <div className="absolute end-0 mt-2 grid min-w-52 gap-2 rounded-lg border border-[#D9CEBA] bg-[#F7F1E6] ps-3 pe-3 py-3 shadow-lg">
          <button type="button" onClick={() => onNavigate('LANDING')} className={control}><BookOpen className="size-4" aria-hidden="true" />{isAr ? 'العودة إلى المقدمة' : 'Back to introduction'}</button>
          <button type="button" onClick={onOpenPresenter} className={control}><Compass className="size-4" aria-hidden="true" />{isAr ? 'تفاصيل العرض' : 'Presenter details'}</button>
        </div>
      </details>
    </nav>
    {handoff && <div className="border-t border-[#D9CEBA]/60 bg-white/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 ps-4 pe-4 py-2 text-start">
        <div role="status" aria-atomic="true" className="min-w-0">
          <span className="text-sm font-semibold">{handoff.title}</span>
          <span className="ms-2 text-sm text-[#736357]">{handoff.description}</span>
        </div>
        {handoff.owner && handoff.owner !== role && <button type="button" onClick={() => onNavigate(handoff.owner!)} className="inline-flex items-center gap-1 rounded ps-2 pe-2 py-1 text-sm font-semibold text-[#8B261E] underline underline-offset-4 focus-visible:outline-2">
          {isAr ? 'فتح المكتب المسؤول' : 'Open responsible desk'}<ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        </button>}
      </div>
    </div>}
  </header>;
}
