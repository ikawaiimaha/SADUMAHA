import React from 'react';
import {
  Award,
  ShieldCheck,
  ClipboardList,
  Globe,
  BookOpen,
  GitMerge,
  User,
  FileText,
  Megaphone,
  ArrowRight,
} from 'lucide-react';

export type AppRole =
  | 'Chairman'
  | 'Biennial Director'
  | 'Preparatory Committee'
  | 'HIP'
  | 'Editorial'
  | 'Coordinator'
  | 'Artist'
  | 'PR'
  | 'Finance';

export interface RoleSelectionProps {
  onSelectRole: (role: AppRole) => void;
  selectedRole?: AppRole | null;
}

interface RoleOption {
  key: AppRole;
  titleEn: string;
  titleAr: string;
  phaseBadge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: 'Chairman',
    titleEn: 'Chairman',
    titleAr: 'رئيس الدائرة',
    phaseBadge: 'H.E. Abdullah Al Owais - Executive Gate',
    description:
      'Macro oversight of the Sharjah Department of Culture. Evaluates candidate themes, confers official sign-off, and assigns the biennial budget.',
    icon: Award,
    accentColor: 'text-sadu-brick',
  },
  {
    key: 'Biennial Director',
    titleEn: 'Biennial Director',
    titleAr: 'مدير البينالي',
    phaseBadge: 'Mohammed Al Qaseer - Executive Veto & Balance Review',
    description:
      'Reviews nominated dossiers, monitors Emerging vs. Established balance ratio, and holds absolute executive veto before contracting.',
    icon: ShieldCheck,
    accentColor: 'text-sadu-brick',
  },
  {
    key: 'Preparatory Committee',
    titleEn: 'Preparatory Committee',
    titleAr: 'اللجنة التحضيرية',
    phaseBadge: 'Theme Formulation & Nomination',
    description:
      'Formulates three candidate themes defended with rigorous aesthetic frameworks, and collaboratively nominates artists into the Multaqa pool.',
    icon: ClipboardList,
    accentColor: 'text-sadu-brick',
  },
  {
    key: 'HIP',
    titleEn: 'HIP (Head of Programs)',
    titleAr: 'منسق معرض عام',
    phaseBadge: 'Arabic Directives & Blocklists',
    description:
      'Drafts exhibition guidelines exclusively in Arabic and manages dynamic blocklists to enforce real-time diplomatic and safety directives.',
    icon: Globe,
    accentColor: 'text-sadu-brick',
  },
  {
    key: 'Editorial',
    titleEn: 'Editorial',
    titleAr: 'التحرير والترجمة',
    phaseBadge: 'Bilingual Translation & Institutional Publishing',
    description:
      'Receives locked Arabic curatorial briefs from HIP, drafts official English translations, and holds sole authority to publish to Coordinators.',
    icon: BookOpen,
    accentColor: 'text-sadu-brick',
  },
  {
    key: 'Coordinator',
    titleEn: 'Coordinator',
    titleAr: 'المنسق العام',
    phaseBadge: 'Program Operations & Dossiers',
    description:
      'Assembles strict schema artist dossiers (CV, previous works, mockups) and drafts customized contracts post-Director approval.',
    icon: GitMerge,
    accentColor: 'text-sadu-ochre',
  },
  {
    key: 'Artist',
    titleEn: 'Artist',
    titleAr: 'الفنان',
    phaseBadge: 'External Access & Dossier Intake',
    description:
      'Secure portal for invited artists to review contract terms, confirm participation, and upload passports and high-res files.',
    icon: User,
    accentColor: 'text-sadu-ink',
  },
  {
    key: 'PR',
    titleEn: 'PR (التشريفات)',
    titleAr: 'التشريفات والعلاقات',
    phaseBadge: 'Passports & Print Verification',
    description:
      'Verifies artist passports, travel logistics, and high-resolution print quality files for catalog publishing and wall texts.',
    icon: Megaphone,
    accentColor: 'text-sadu-brick',
  },
  {
    key: 'Finance',
    titleEn: 'Finance (المالية)',
    titleAr: 'الشؤون المالية',
    phaseBadge: 'Contracts & Tranche Disbursements',
    description:
      'Executes milestone payment tranches (advances, production, completion) based on locked contracts post-Chairman budget authorization.',
    icon: FileText,
    accentColor: 'text-sadu-ochre',
  },
];

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole, selectedRole }) => {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* Portal Header */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-8 text-center shadow-xs">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sadu-brick/10 text-sadu-brick">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <span className="rounded-full border border-sadu-gold/60 bg-sadu-sand px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sadu-muted">
          Institutional Governance Portal
        </span>
        <h1 className="mt-3 font-editorial text-3xl font-bold text-sadu-charcoal sm:text-4xl">
          SADU Biennial Operations
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-sadu-muted leading-relaxed">
          Please select your institutional role to enter the dedicated governance workspace. Each role
          has specific responsibilities across theme selection, nomination, and dispatch.
        </p>
      </div>

      {/* Role Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ROLE_OPTIONS.map((role, index) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.key;

          return (
            <div
              key={role.key}
              onClick={() => onSelectRole(role.key)}
              className={`group flex flex-col justify-between h-full rounded-xl border p-5 shadow-xs transition-all cursor-pointer ${
                isSelected
                  ? 'border-sadu-brick bg-white ring-2 ring-sadu-brick/30 shadow-md'
                  : 'border-sadu-gold bg-white hover:border-sadu-brick hover:bg-sadu-paper hover:shadow-md'
              } ${index === 8 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sadu-gold/60 bg-sadu-sand transition-colors group-hover:bg-sadu-gold/20">
                      <Icon className={`h-5 w-5 ${role.accentColor}`} />
                    </div>
                    <div>
                      <h2 className="font-editorial text-base font-bold text-sadu-charcoal leading-tight">
                        {role.titleEn}
                      </h2>
                      <span dir="rtl" className="text-xs font-semibold text-sadu-brick block">
                        {role.titleAr}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="inline-block rounded-md border border-sadu-gold/50 bg-sadu-sand px-2 py-0.5 text-[9px] font-bold text-sadu-muted">
                    {role.phaseBadge}
                  </span>
                </div>

                <p className="text-xs text-sadu-muted leading-relaxed min-h-[44px]">
                  {role.description}
                </p>
              </div>

              <div className="mt-4 border-t border-sadu-gold/30 pt-3">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onSelectRole(role.key);
                  }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-sadu-brick px-3 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-sadu-brick-dark cursor-pointer group-hover:shadow"
                >
                  <span>Enter as {role.titleEn}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSelection;
