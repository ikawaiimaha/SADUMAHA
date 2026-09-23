import React from 'react';
import {
  Award,
  ShieldCheck,
  ClipboardList,
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
  | 'Coordinator'
  | 'Artist'
  | 'Finance'
  | 'PR';

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
    phaseBadge: 'Executive Gate & Budget Allocation',
    description:
      "H.E. Abdullah Al Owais's executive suite. Macro oversight. Reviews heavily defended themes, confers official sign-off, and assigns the biennial budget.",
    icon: Award,
    accentColor: 'text-sadu-brick',
  },
  {
    key: 'Biennial Director',
    titleEn: 'Biennial Director',
    titleAr: 'مدير البينالي',
    phaseBadge: 'Executive Veto & Oversight',
    description:
      "Mohammed Al Qaseer's workspace. Convenes the Preparatory Committee, and heads artist selection once the theme and budget are assigned.",
    icon: ShieldCheck,
    accentColor: 'text-sadu-brick',
  },
  {
    key: 'Preparatory Committee',
    titleEn: 'Preparatory Committee',
    titleAr: 'اللجنة التحضيرية',
    phaseBadge: 'Theme Formulation',
    description:
      'Formulate three candidate themes defended with rigorous aesthetic frameworks, contemporary relevance, and curatorial justifications.',
    icon: ClipboardList,
    accentColor: 'text-sadu-brick',
  },
  {
    key: 'Coordinator',
    titleEn: 'General Coordinator',
    titleAr: 'المنسق العام',
    phaseBadge: 'Program Operations',
    description:
      'Manage curatorial drafting pools, assemble artist dossiers, and orchestrate invitation workflows based on Al Qaseer’s selections.',
    icon: GitMerge,
    accentColor: 'text-sadu-ochre',
  },
  {
    key: 'Artist',
    titleEn: 'Artist / Participant',
    titleAr: 'الفنان',
    phaseBadge: 'External Access',
    description:
      'Secure portal for invited artists to upload passports, high-res artwork photos, and bilingual bios.',
    icon: User,
    accentColor: 'text-sadu-ink',
  },
  {
    key: 'Finance',
    titleEn: 'Finance & Contracts',
    titleAr: 'الشؤون المالية',
    phaseBadge: 'Legal & Budget',
    description:
      'Generate bespoke bilingual contracts and track artist payment tranches (unlocked after Chairman budget assignment).',
    icon: FileText,
    accentColor: 'text-sadu-ochre',
  },
  {
    key: 'PR',
    titleEn: 'PR & Protocol',
    titleAr: 'العلاقات العامة',
    phaseBadge: 'Logistics & Media',
    description:
      'Extract artist dossiers for exhibition catalogs, manage flight itineraries, and coordinate hospitality.',
    icon: Megaphone,
    accentColor: 'text-sadu-brick',
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ROLE_OPTIONS.map(role => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.key;

          return (
            <div
              key={role.key}
              onClick={() => onSelectRole(role.key)}
              className={`group flex flex-col justify-between rounded-xl border p-6 shadow-xs transition-all cursor-pointer ${
                isSelected
                  ? 'border-sadu-brick bg-white ring-2 ring-sadu-brick/30 shadow-md'
                  : 'border-sadu-gold bg-white hover:border-sadu-brick hover:bg-sadu-paper hover:shadow-md'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-sadu-gold/60 bg-sadu-sand transition-colors group-hover:bg-sadu-gold/20">
                      <Icon className={`h-6 w-6 ${role.accentColor}`} />
                    </div>
                    <div>
                      <h2 className="font-editorial text-xl font-bold text-sadu-charcoal">
                        {role.titleEn}
                      </h2>
                      <span dir="rtl" className="text-sm font-semibold text-sadu-brick">
                        {role.titleAr}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-md border border-sadu-gold/50 bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-muted">
                    {role.phaseBadge}
                  </span>
                </div>

                <p className="text-xs text-sadu-muted leading-relaxed min-h-[44px]">
                  {role.description}
                </p>
              </div>

              <div className="mt-6 border-t border-sadu-gold/30 pt-4">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onSelectRole(role.key);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sadu-brick px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-sadu-brick-dark cursor-pointer group-hover:shadow"
                >
                  <span>Enter as {role.titleEn}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
