import React, { useState } from 'react';
import {
  Megaphone,
  CheckCircle2,
  Clock,
  FileText,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Check,
  Eye,
  Award,
  Globe,
  Upload,
} from 'lucide-react';
import { BilateralContract } from '../types/contractStage6';

export interface PRWorkspaceProps {
  contracts: BilateralContract[];
  onVerifyPassport: (contractId: string, notes?: string) => void;
  onVerifyHighResArtwork: (contractId: string, notes?: string) => void;
  onBackToRoles?: () => void;
}

export const PRWorkspace: React.FC<PRWorkspaceProps> = ({
  contracts,
  onVerifyPassport,
  onVerifyHighResArtwork,
  onBackToRoles,
}) => {
  const [selectedBioModalContract, setSelectedBioModalContract] = useState<BilateralContract | null>(null);

  // Metrics
  const totalArtists = contracts.length;
  const passportsVerified = contracts.filter(c => c.documents.passportStatus === 'VERIFIED').length;
  const printMastersVerified = contracts.filter(c => c.documents.highResStatus === 'VERIFIED').length;
  const readinessRate = totalArtists > 0 ? Math.round(((passportsVerified + printMastersVerified) / (totalArtists * 2)) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* 1. Header */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sadu-brick text-white shadow-xs">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-brick uppercase tracking-wider border border-sadu-gold/60">
                  Stage 6 &middot; Public Relations &amp; Protocol
                </span>
                <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                  التشريفات والمراسم
                </span>
              </div>
              <h1 className="font-editorial text-2xl font-bold text-sadu-charcoal mt-1">
                PR &amp; Protocol Verification Workspace (التشريفات)
              </h1>
              <p className="text-xs text-sadu-muted">
                Official Passports Clearance, Delegation Visa Processing &amp; 300 DPI Catalog Master Plate Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToRoles && (
              <button
                type="button"
                onClick={onBackToRoles}
                className="inline-flex items-center gap-1.5 rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/25 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Switch Role</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. KPI Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4">
          <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
              Contracted Artists
            </span>
            <span className="font-editorial text-2xl font-bold text-sadu-charcoal mt-1 block">
              {totalArtists}
            </span>
          </div>

          <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
              Passports Cleared
            </span>
            <span className="font-editorial text-2xl font-bold text-emerald-800 mt-1 block">
              {passportsVerified} / {totalArtists}
            </span>
          </div>

          <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
              300 DPI Print Masters
            </span>
            <span className="font-editorial text-2xl font-bold text-sadu-brick mt-1 block">
              {printMastersVerified} / {totalArtists}
            </span>
          </div>

          <div className="rounded-lg border border-sadu-gold/60 bg-white p-3.5 shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase text-sadu-muted tracking-wider block">
              Protocol Readiness
            </span>
            <span className="font-editorial text-2xl font-bold text-sadu-ochre mt-1 block">
              {readinessRate}%
            </span>
          </div>
        </div>
      </div>
      {/* 3. Verification Queue Table */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-3">
          <div>
            <h2 className="font-editorial text-base font-bold text-sadu-charcoal">
              Artist Verification Queue &middot; Passports &amp; Print-Ready Catalog Masters
            </h2>
            <p className="text-xs text-sadu-muted">
              Inspect submitted credentials and approve for official biennial delegation visas and catalog publishing plates.
            </p>
          </div>
          <span className="rounded bg-sadu-sand px-2.5 py-1 text-[10px] font-bold text-sadu-charcoal border border-sadu-gold/60">
            PR Official Gatekeeper
          </span>
        </div>

        <div className="space-y-3">
          {contracts.map(contract => {
            const isSigned = contract.status === 'ARTIST_APPROVED' || contract.status === 'LOCKED';
            const isPassportSubmitted = contract.documents.passportStatus === 'SUBMITTED';
            const isPassportVerified = contract.documents.passportStatus === 'VERIFIED';
            const isHighResSubmitted = contract.documents.highResStatus === 'SUBMITTED';
            const isHighResVerified = contract.documents.highResStatus === 'VERIFIED';

            return (
              <div
                key={contract.id}
                className="rounded-lg border border-sadu-gold/60 bg-white p-4 shadow-2xs space-y-3 text-xs"
              >
                {/* Artist Row Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-sadu-charcoal">{contract.artistName}</strong>
                    <span className="rounded bg-sadu-sand px-2 py-0.5 text-[9px] font-bold text-sadu-muted border border-sadu-gold/40">
                      {contract.artistCategory}
                    </span>
                    <span className="text-[11px] text-sadu-muted">&middot; {contract.nationality}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-sadu-muted">Contract Status:</span>
                    {isSigned ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                        Executed &amp; Locked
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                        Pending Artist Acceptance
                      </span>
                    )}
                  </div>
                </div>

                {/* Verification Controls Grid */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Passport Verification Card */}
                  <div className="rounded border border-sadu-gold/40 bg-sadu-sand/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sadu-charcoal flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-sadu-brick" />
                        Passport Protocol
                      </span>
                      {isPassportVerified ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-300">
                          Cleared
                        </span>
                      ) : isPassportSubmitted ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-300">
                          Awaiting Review
                        </span>
                      ) : (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-600">
                          Not Uploaded
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-sadu-muted truncate">
                      File: {contract.documents.passportFileName || 'None submitted yet'}
                    </p>

                    {isPassportSubmitted && (
                      <button
                        type="button"
                        onClick={() => onVerifyPassport(contract.id, 'Verified by SDC PR Protocol Desk')}
                        className="inline-flex w-full items-center justify-center gap-1 rounded bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-900 cursor-pointer shadow-2xs"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        <span>Verify Passport for Visa</span>
                      </button>
                    )}

                    {isPassportVerified && (
                      <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                        <span>Visa &amp; Delegation Cleared</span>
                      </div>
                    )}
                  </div>

                  {/* 300 DPI Artwork Verification Card */}
                  <div className="rounded border border-sadu-gold/40 bg-sadu-sand/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sadu-charcoal flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-sadu-ochre" />
                        Catalog Master (300 DPI)
                      </span>
                      {isHighResVerified ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-300">
                          Approved
                        </span>
                      ) : isHighResSubmitted ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-300">
                          Awaiting Review
                        </span>
                      ) : (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold text-stone-600">
                          Not Uploaded
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-sadu-muted truncate">
                      File: {contract.documents.highResArtworkFileName || 'None submitted yet'}
                    </p>

                    {isHighResSubmitted && (
                      <button
                        type="button"
                        onClick={() => onVerifyHighResArtwork(contract.id, 'Validated 300 DPI for Hardcover Catalog Plate')}
                        className="inline-flex w-full items-center justify-center gap-1 rounded bg-sadu-brick px-2.5 py-1 text-[11px] font-bold text-white hover:bg-sadu-brick-dark cursor-pointer shadow-2xs"
                      >
                        <Check className="h-3 w-3" />
                        <span>Approve for Catalog Print</span>
                      </button>
                    )}

                    {isHighResVerified && (
                      <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                        <span>Catalog Master Approved</span>
                      </div>
                    )}
                  </div>

                  {/* Catalog Wall Text Inspection Card */}
                  <div className="rounded border border-sadu-gold/40 bg-sadu-sand/20 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sadu-charcoal flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-sadu-ink" />
                        Wall Text &amp; Bio
                      </span>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 border border-emerald-300">
                        Bilingual
                      </span>
                    </div>

                    <p className="text-[11px] text-sadu-muted truncate">
                      "{contract.proposedWorkTitle}"
                    </p>

                    <button
                      type="button"
                      onClick={() => setSelectedBioModalContract(contract)}
                      className="inline-flex w-full items-center justify-center gap-1 rounded border border-sadu-gold/60 bg-white px-2.5 py-1 text-[11px] font-bold text-sadu-charcoal hover:bg-stone-50 cursor-pointer shadow-2xs"
                    >
                      <Eye className="h-3 w-3 text-sadu-muted" />
                      <span>Inspect Plaque Wall Text</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* 4. Bio Inspection Modal */}
      {selectedBioModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-sadu-gold/40 pb-2">
              <h3 className="font-editorial text-base font-bold text-sadu-charcoal">
                Exhibition Wall Text &middot; {selectedBioModalContract.artistName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBioModalContract(null)}
                className="rounded p-1 text-sadu-muted hover:bg-stone-100 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded border border-sadu-gold/50 bg-sadu-sand/20 p-3 space-y-1">
                <span className="font-bold text-sadu-charcoal block">Arabic Plaque Biography (السيرة العربية)</span>
                <p className="text-sadu-muted leading-relaxed font-serif" dir="rtl">
                  {selectedBioModalContract.documents.catalogBioArabic ||
                    'فنان خطاط وباحث في جماليات الحرف العربي، قدم تجارب متميزة في تطويع السطر الكوفي والثلث ضمن تشكيلات معاصرة.'}
                </p>
              </div>

              <div className="rounded border border-sadu-gold/50 bg-sadu-sand/20 p-3 space-y-1">
                <span className="font-bold text-sadu-charcoal block">English Wall Text Biography</span>
                <p className="text-sadu-muted leading-relaxed">
                  {selectedBioModalContract.documents.catalogBioEnglish ||
                    'Renowned calligrapher and visual theorist specializing in monumental script manifestations, sacred geometry, and modern spatial dialogues.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedBioModalContract(null)}
                className="rounded bg-sadu-brick px-4 py-1.5 text-xs font-bold text-white hover:bg-sadu-brick-dark cursor-pointer"
              >
                Close Wall Text Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PRWorkspace;

