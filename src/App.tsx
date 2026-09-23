import React, { useState } from 'react';
import RoleSelection, { AppRole } from './components/RoleSelection';
import CommitteeThemeWorkspace, { CommitteeThemeDraft } from './components/CommitteeThemeWorkspace';
import ChairmanWorkspace, { ThemeItem } from './components/ChairmanWorkspace';
import {
  RotateCcw,
  ShieldCheck,
  GitMerge,
  Building2,
  Clock,
  Users,
  User,
  FileText,
  Megaphone,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const EVENT_ID = '123e4567-e89b-12d3-a456-426614174000';

function App() {
  const [currentRole, setCurrentRole] = useState<AppRole | null>(null);
  const [submittedThemes, setSubmittedThemes] = useState<CommitteeThemeDraft[] | undefined>(undefined);
  const [assignedBudget, setAssignedBudget] = useState<number | null>(null);
  const [ratifiedTheme, setRatifiedTheme] = useState<ThemeItem | null>(null);

  const handlePresentToChairman = (themes: CommitteeThemeDraft[]) => {
    setSubmittedThemes(themes);
  };

  const handleBudgetAssigned = (amount: number, theme: ThemeItem) => {
    setAssignedBudget(amount);
    setRatifiedTheme(theme);
  };

  return (
    <div className="min-h-screen bg-sadu-sand text-sadu-charcoal flex flex-col">
      {/* Persistent 'Switch Role' Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-sadu-gold/70 bg-sadu-paper/95 backdrop-blur-sm shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sadu-brick text-xs font-bold text-white shadow-2xs">
              S
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-base font-bold text-sadu-charcoal">
                  SADU
                </span>
                <span className="rounded bg-sadu-sand px-1.5 py-0.2 text-[10px] font-semibold text-sadu-muted">
                  Sharjah Calligraphy Biennial
                </span>
              </div>
              <p className="text-[11px] text-sadu-muted hidden sm:block">
                Institutional Governance Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentRole ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-sadu-gold/70 bg-sadu-sand px-3 py-1 text-xs font-semibold text-sadu-charcoal">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Role: <strong className="font-bold">{currentRole}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentRole(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal shadow-2xs transition-colors hover:bg-sadu-gold/25 hover:border-sadu-brick cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-sadu-brick" />
                  <span>Switch Role</span>
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sadu-gold/60 bg-sadu-sand px-3 py-1 text-[11px] font-semibold text-sadu-muted">
                <Users className="h-3.5 w-3.5" />
                Select Role to Proceed
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        {!currentRole && (
          <RoleSelection onSelectRole={role => setCurrentRole(role)} />
        )}

        {currentRole === 'Preparatory Committee' && (
          <CommitteeThemeWorkspace
            eventId={EVENT_ID}
            onPresentToChairman={handlePresentToChairman}
          />
        )}

        {currentRole === 'Chairman' && (
          <ChairmanWorkspace
            eventId={EVENT_ID}
            themes={submittedThemes}
            onBudgetAssigned={handleBudgetAssigned}
          />
        )}
        {currentRole === 'Coordinator' && (
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-sadu-gold bg-sadu-paper p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-sadu-gold/40 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sadu-ochre/15 text-sadu-ochre">
                <GitMerge className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-editorial text-xl font-bold text-sadu-charcoal">
                  Coordinator Workspace &middot; Program Operations
                </h2>
                <p className="text-xs text-sadu-muted">
                  Phase 2: Artist Nomination Pool & Dossier Assembly
                </p>
              </div>
            </div>

            <div className="rounded-md border border-sadu-gold/60 bg-white p-5 text-sm space-y-3">
              {assignedBudget ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Theme Ratified & Budget Assigned: AED {assignedBudget.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-sadu-muted leading-relaxed">
                    Authority has routed to Mohammed Al Qaseer. The Coordinator is now authorized to assemble
                    artist dossiers and manage invitation dispatches aligned with the ratified theme.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sadu-brick font-semibold">
                    <Clock className="h-4 w-4" />
                    <span>Awaiting Executive Theme Ratification</span>
                  </div>
                  <p className="text-xs text-sadu-muted leading-relaxed">
                    The Preparatory Committee must formulate thematic proposals and Chairman Al Owais must lock
                    the official theme and assign budget before artist nomination pools can be mobilized.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentRole(null)}
                className="rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
              >
                Back to Role Selection
              </button>
            </div>
          </div>
        )}

        {currentRole === 'Biennial Director' && (
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-sadu-gold bg-sadu-paper p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-sadu-gold/40 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sadu-brick/15 text-sadu-brick">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-editorial text-xl font-bold text-sadu-charcoal">
                  Biennial Director Workspace &middot; Mohammed Al Qaseer
                </h2>
                <p className="text-xs text-sadu-muted">
                  Executive Veto & Oversight &middot; Artist Selection Committee Lead
                </p>
              </div>
            </div>

            <div className="rounded-md border border-sadu-gold/60 bg-white p-5 text-sm space-y-3">
              {assignedBudget ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Phase 2 Pivot Active &middot; Budget Assigned: AED {assignedBudget.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-sadu-muted leading-relaxed">
                    Chairman Al Owais has ratified the official theme {ratifiedTheme ? `"${ratifiedTheme.englishName}"` : ''} and assigned the biennial budget.
                    Mohammed Al Qaseer now heads the committee responsible for <strong>selecting the artists</strong> that fit the funded theme.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sadu-brick font-semibold">
                    <Clock className="h-4 w-4" />
                    <span>Phase 1 Initiation Gate</span>
                  </div>
                  <p className="text-xs text-sadu-muted leading-relaxed">
                    Mohammed Al Qaseer has convened the Preparatory Committee based on the cultural calendar.
                    Once Chairman Al Owais approves the theme and assigns the budget, Al Qaseer pivots to lead the Artist Selection Committee.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentRole(null)}
                className="rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
              >
                Back to Role Selection
              </button>
            </div>
          </div>
        )}

        {currentRole === 'Artist' && (
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-sadu-gold bg-sadu-paper p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-sadu-gold/40 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sadu-ink/15 text-sadu-ink">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-editorial text-xl font-bold text-sadu-charcoal">
                  Artist &middot; Participant Portal
                </h2>
                <p className="text-xs text-sadu-muted">
                  External Access &middot; Archival Verification & Dossier Intake
                </p>
              </div>
            </div>

            <div className="rounded-md border border-sadu-gold/60 bg-white p-5 text-sm space-y-3">
              <div className="flex items-center gap-2 text-sadu-ink font-semibold">
                <User className="h-4 w-4" />
                <span>Secure Participant Intake</span>
              </div>
              <p className="text-xs text-sadu-muted leading-relaxed">
                Secure portal for invited artists to upload passports, high-res artwork photos,
                and bilingual bios for international exhibition labeling and publishing.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentRole(null)}
                className="rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
              >
                Back to Role Selection
              </button>
            </div>
          </div>
        )}

        {currentRole === 'Finance' && (
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-sadu-gold bg-sadu-paper p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-sadu-gold/40 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sadu-ochre/15 text-sadu-ochre">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-editorial text-xl font-bold text-sadu-charcoal">
                  Finance &middot; Contracts & Disbursements
                </h2>
                <p className="text-xs text-sadu-muted">
                  Legal & Budget &middot; Tranche Management & Milestone Clearance
                </p>
              </div>
            </div>

            <div className="rounded-md border border-sadu-gold/60 bg-white p-5 text-sm space-y-3">
              {assignedBudget ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Budget Appropriated &middot; AED {assignedBudget.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-sadu-muted leading-relaxed">
                    Official budget clearance granted by Chairman Al Owais. Finance & Contracts is authorized
                    to generate bespoke bilingual PDF contracts and schedule milestone payment tranches.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-amber-800 font-semibold">
                    <Lock className="h-4 w-4" />
                    <span>Contracts Locked &middot; Awaiting Chairman Budget Assignment</span>
                  </div>
                  <p className="text-xs text-sadu-muted leading-relaxed">
                    Departmental contracts and financial disbursements remain locked until Chairman Al Owais ratifies
                    the official theme and formally assigns the biennial budget.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentRole(null)}
                className="rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
              >
                Back to Role Selection
              </button>
            </div>
          </div>
        )}

        {currentRole === 'PR' && (
          <div className="mx-auto w-full max-w-5xl rounded-lg border border-sadu-gold bg-sadu-paper p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-sadu-gold/40 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sadu-brick/15 text-sadu-brick">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-editorial text-xl font-bold text-sadu-charcoal">
                  PR & Protocol &middot; Logistics & Media
                </h2>
                <p className="text-xs text-sadu-muted">
                  Catalog Publishing, Flight Coordination & Biennial Hospitality
                </p>
              </div>
            </div>

            <div className="rounded-md border border-sadu-gold/60 bg-white p-5 text-sm space-y-3">
              <div className="flex items-center gap-2 text-sadu-brick font-semibold">
                <Megaphone className="h-4 w-4" />
                <span>Media & Guest Protocol</span>
              </div>
              <p className="text-xs text-sadu-muted leading-relaxed">
                Extract artist dossiers for catalogs, manage flight itineraries, and coordinate biennial hospitality
                for international delegates and VIP delegations.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentRole(null)}
                className="rounded-md border border-sadu-gold bg-sadu-sand px-4 py-2 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
              >
                Back to Role Selection
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;


