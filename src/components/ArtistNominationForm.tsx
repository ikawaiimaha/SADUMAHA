import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  User,
  Image as ImageIcon,
  Sparkles,
  ShieldAlert,
  X,
  FileCheck,
} from 'lucide-react';

export type ArtistCategory = 'Emerging' | 'Established';

export interface NominatedArtistDossier {
  id: string;
  artistName: string;
  artistCategory: ArtistCategory;
  nationality: string;
  medium: string;
  proposedWorkTitle: string;
  isCommissioned?: boolean;
  cvFileName: string;
  previousWorksCount: number;
  mockupCount: number;
  submittedBy: 'Preparatory Committee' | 'Coordinator';
  submittedAt: string;
  status: 'PENDING_DIRECTOR_REVIEW' | 'VETOED' | 'APPROVED';
  vetoReason?: string;
  vetoNotes?: string;
}

export interface ArtistNominationFormProps {
  curatorialBrief?: string;
  blocklist?: string[];
  onSubmitNomination: (dossier: NominatedArtistDossier) => void;
  submittedBy?: 'Preparatory Committee' | 'Coordinator';
  onCancel?: () => void;
}

export const ArtistNominationForm: React.FC<ArtistNominationFormProps> = ({
  curatorialBrief,
  blocklist = [],
  onSubmitNomination,
  submittedBy = 'Coordinator',
  onCancel,
}) => {
  const [artistName, setArtistName] = useState('');
  const [artistCategory, setArtistCategory] = useState<ArtistCategory | ''>('');
  const [nationality, setNationality] = useState('');
  const [medium, setMedium] = useState('');
  const [proposedWorkTitle, setProposedWorkTitle] = useState('');
  // Hardening #1: Dynamic Dossier Schema toggle
  const [isCommissioned, setIsCommissioned] = useState<boolean>(true);

  // Strict Dossier Schema flags / files
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploaded, setCvUploaded] = useState<boolean>(false);
  const [cvFileName, setCvFileName] = useState<string>('');

  const [previousWorks, setPreviousWorks] = useState<string[]>([]);
  const [previousWorksUploaded, setPreviousWorksUploaded] = useState<boolean>(false);

  const [newWorkMockup, setNewWorkMockup] = useState<string[]>([]);
  const [newWorkMockupUploaded, setNewWorkMockupUploaded] = useState<boolean>(false);

  // Rejection alert state
  const [blocklistAlert, setBlocklistAlert] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const isFormValid =
    artistName.trim() !== '' &&
    (artistCategory === 'Emerging' || artistCategory === 'Established') &&
    (cvUploaded || cvFile !== null) &&
    (previousWorksUploaded || previousWorks.length > 0) &&
    (!isCommissioned || newWorkMockupUploaded || newWorkMockup.length > 0);

  const checkIsBlocked = () => {
    const normNationality = nationality.trim().toLowerCase();
    const normMedium = medium.trim().toLowerCase();
    const normName = artistName.trim().toLowerCase();

    return blocklist.find(tag => {
      const cleanTag = tag
        .toLowerCase()
        .replace(/^restricted nationality:\s*/i, '')
        .replace(/^hazardous medium:\s*/i, '')
        .replace(/^directive:\s*/i, '')
        .trim();

      if (!cleanTag) return false;
      return (
        (normNationality && (normNationality.includes(cleanTag) || cleanTag.includes(normNationality))) ||
        (normMedium && (normMedium.includes(cleanTag) || cleanTag.includes(normMedium))) ||
        (normName && normName.includes(cleanTag))
      );
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    // Check against HIP Dynamic Blocklist
    const matchedBlock = checkIsBlocked();
    if (matchedBlock) {
      const alertMsg = 'Submission blocked by current HIP security/administrative directives.';
      setBlocklistAlert(alertMsg);
      // Also show native alert for instant user feedback
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(alertMsg);
      }
      return;
    }

    setBlocklistAlert(null);

    const dossier: NominatedArtistDossier = {
      id: `dossier-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      artistName: artistName.trim(),
      artistCategory: artistCategory as ArtistCategory,
      nationality: nationality.trim() || 'Undisclosed',
      medium: medium.trim() || 'Calligraphic Arts',
      proposedWorkTitle: proposedWorkTitle.trim() || 'Untitled Biennial Proposal',
      isCommissioned,
      cvFileName: cvFileName || (cvFile ? cvFile.name : 'Artist_Curriculum_Vitae.pdf'),
      previousWorksCount: previousWorks.length > 0 ? previousWorks.length : 3,
      mockupCount: newWorkMockup.length > 0 ? newWorkMockup.length : 2,
      submittedBy,
      submittedAt: new Date().toISOString(),
      status: 'PENDING_DIRECTOR_REVIEW',
    };

    onSubmitNomination(dossier);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      // Reset form
      setArtistName('');
      setArtistCategory('');
      setNationality('');
      setMedium('');
      setProposedWorkTitle('');
      setCvFile(null);
      setCvUploaded(false);
      setCvFileName('');
      setPreviousWorks([]);
      setPreviousWorksUploaded(false);
      setNewWorkMockup([]);
      setNewWorkMockupUploaded(false);
    }, 2500);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-sadu-gold bg-sadu-paper p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-sadu-gold/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sadu-brick text-white shadow-xs">
              <User className="h-6 w-6" />
            </div>
            <div>
              <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-brick uppercase tracking-wider border border-sadu-gold/60">
                Stage 3: The Multaqa Protocol
              </span>
              <h2 className="font-editorial text-2xl font-bold text-sadu-charcoal mt-0.5">
                Artist Nomination Dossier
              </h2>
              <p className="text-xs text-sadu-muted">
                Collaborative Nomination ({submittedBy}) &middot; Strict Dossier Schema Enforced
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-sadu-gold bg-sadu-sand px-3 py-1.5 text-xs font-bold text-sadu-charcoal hover:bg-sadu-gold/20 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        {curatorialBrief && (
          <div className="mt-4 rounded-lg border border-sadu-gold/50 bg-white p-3 text-xs">
            <span className="font-bold text-sadu-charcoal block mb-0.5">
              Active HIP Curatorial Brief Reference:
            </span>
            <p className="text-sadu-muted leading-relaxed line-clamp-2 italic">
              "{curatorialBrief}"
            </p>
          </div>
        )}
      </div>

      {/* Blocklist Hard Error Alert */}
      {blocklistAlert && (
        <div className="rounded-xl border-2 border-red-500 bg-red-50 p-4 text-red-900 shadow-md">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="text-sm font-bold block mb-1">
                Institutional Security/Administrative Rejection
              </strong>
              <p className="font-mono text-xs font-bold text-red-800 bg-white/80 p-2 rounded border border-red-300">
                {blocklistAlert}
              </p>
            </div>
            <button type="button" onClick={() => setBlocklistAlert(null)} className="text-red-500 hover:text-red-800 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {submitSuccess && (
        <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-4 text-emerald-900 shadow-xs flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <strong className="text-sm font-bold block">Dossier Submitted Successfully to Candidate Pool</strong>
            <p className="text-xs text-emerald-800">
              {artistName} ({artistCategory} Artist) is now routed to Mohammed Al Qaseer for Stage 4 Director Review.
            </p>
          </div>
        </div>
      )}

      {/* Nomination Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-sadu-gold bg-white p-6 shadow-xs space-y-6">
        {/* Section 1: Artist Identity & Strategic Tagging */}
        <div className="space-y-4 border-b border-sadu-gold/30 pb-6">
          <h3 className="font-editorial text-lg font-bold text-sadu-charcoal flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sadu-brick" />
            1. Artist Identity & Strategic Tagging
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nomination-artist-name" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider mb-1">
                Artist Full Name <span className="text-red-600">*</span>
              </label>
              <input
                id="nomination-artist-name"
                type="text"
                required
                value={artistName}
                onChange={e => setArtistName(e.target.value)}
                placeholder="e.g. Farhad Moshiri"
                className="w-full rounded-md border border-sadu-gold/60 p-2 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
              />
            </div>

            <div>
              <label htmlFor="nomination-artwork-title" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider mb-1">
                Proposed Artwork Title
              </label>
              <input
                id="nomination-artwork-title"
                type="text"
                value={proposedWorkTitle}
                onChange={e => setProposedWorkTitle(e.target.value)}
                placeholder="e.g. Resonances of the Kufic Axis"
                className="w-full rounded-md border border-sadu-gold/60 p-2 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
              />
            </div>
          </div>

          {/* Strategic Tagging */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider">
              Strategic Exhibition Category Tag <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`flex flex-col justify-between rounded-lg border p-3 cursor-pointer ${
                  artistCategory === 'Emerging'
                    ? 'border-sadu-brick bg-sadu-sand/60 ring-2 ring-sadu-brick/40'
                    : 'border-sadu-gold/60 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-editorial text-sm font-bold text-sadu-charcoal">Emerging Artist</span>
                  <input
                    type="radio"
                    name="artistCategory"
                    value="Emerging"
                    checked={artistCategory === 'Emerging'}
                    onChange={() => setArtistCategory('Emerging')}
                    className="accent-sadu-brick"
                  />
                </div>
                <p className="text-[10px] text-sadu-muted mt-1">
                  Early/mid-career practitioner. Strengthens avant-garde presence.
                </p>
              </label>

              <label
                className={`flex flex-col justify-between rounded-lg border p-3 cursor-pointer ${
                  artistCategory === 'Established'
                    ? 'border-sadu-brick bg-sadu-sand/60 ring-2 ring-sadu-brick/40'
                    : 'border-sadu-gold/60 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-editorial text-sm font-bold text-sadu-charcoal">Established Artist</span>
                  <input
                    type="radio"
                    name="artistCategory"
                    value="Established"
                    checked={artistCategory === 'Established'}
                    onChange={() => setArtistCategory('Established')}
                    className="accent-sadu-brick"
                  />
                </div>
                <p className="text-[10px] text-sadu-muted mt-1">
                  Master calligrapher or prominent figure. Grounds institutional prestige.
                </p>
              </label>
            </div>
          </div>

          {/* Nationality & Medium */}
          <div className="grid gap-4 sm:grid-cols-2 pt-1">
            <div>
              <label htmlFor="nomination-nationality" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider mb-1">
                Nationality / Country
              </label>
              <input
                id="nomination-nationality"
                type="text"
                value={nationality}
                onChange={e => setNationality(e.target.value)}
                placeholder="e.g. Iraq, Japan, Egypt"
                className="w-full rounded-md border border-sadu-gold/60 p-2 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
              />
            </div>
            <div>
              <label htmlFor="nomination-medium" className="block text-xs font-bold text-sadu-charcoal uppercase tracking-wider mb-1">
                Medium & Materials
              </label>
              <input
                id="nomination-medium"
                type="text"
                value={medium}
                onChange={e => setMedium(e.target.value)}
                placeholder="e.g. Ink on Wasli, Bronze Casting"
                className="w-full rounded-md border border-sadu-gold/60 p-2 text-xs text-sadu-charcoal focus:border-sadu-brick focus:outline-none focus:ring-1 focus:ring-sadu-brick"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Strict Dossier Schema (File Uploads) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-sadu-gold/30 pb-3">
            <h3 className="font-editorial text-lg font-bold text-sadu-charcoal flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-sadu-brick" />
              2. Strict Dossier Schema Attachments
            </h3>
            <span className="rounded bg-sadu-sand px-2 py-0.5 text-[10px] font-bold text-sadu-muted uppercase">
              {isCommissioned ? 'All 3 Files Required' : '2 Files Required (Mockup Optional)'}
            </span>
          </div>

          {/* Hardening #1: Dynamic Dossier Schema toggle */}
          <div className="rounded-lg border border-sadu-gold/50 bg-sadu-sand/30 p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="font-bold text-sadu-charcoal block">Work Production Framework</span>
              <span className="text-[11px] text-sadu-muted">
                Differentiates newly commissioned productions from existing institutional masterpieces.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCommissioned(true)}
                className={`rounded px-3 py-1 font-semibold text-xs transition-colors cursor-pointer ${
                  isCommissioned ? 'bg-sadu-brick text-white shadow-xs' : 'bg-white text-sadu-charcoal border border-sadu-gold/50'
                }`}
              >
                Commissioned (Mockup Required)
              </button>
              <button
                type="button"
                onClick={() => setIsCommissioned(false)}
                className={`rounded px-3 py-1 font-semibold text-xs transition-colors cursor-pointer ${
                  !isCommissioned ? 'bg-sadu-brick text-white shadow-xs' : 'bg-white text-sadu-charcoal border border-sadu-gold/50'
                }`}
              >
                Existing Work (Mockup Optional)
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Attachment 1: CV (PDF) */}
            <div className={`rounded-lg border p-3 flex flex-col justify-between space-y-2 ${
              cvUploaded || cvFile !== null ? 'border-emerald-400 bg-emerald-50/50' : 'border-sadu-gold/60 bg-sadu-sand/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sadu-charcoal">CV (PDF) *</span>
                {cvUploaded || cvFile !== null ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">Required</span>
                )}
              </div>
              {cvUploaded || cvFile !== null ? (
                <div className="flex items-center justify-between rounded bg-white p-2 border border-emerald-300 text-xs">
                  <span className="truncate text-emerald-950 font-medium">{cvFileName || cvFile?.name || 'Artist_CV.pdf'}</span>
                  <button type="button" onClick={() => { setCvFile(null); setCvUploaded(false); setCvFileName(''); }} className="text-red-500 hover:text-red-700 ms-1 cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded border-2 border-dashed border-sadu-gold/70 bg-white p-2.5 text-center cursor-pointer hover:border-sadu-brick">
                  <Upload className="h-4 w-4 text-sadu-muted mb-0.5" />
                  <span className="text-[10px] font-bold text-sadu-brick">Attach CV (PDF)</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { setCvFile(file); setCvFileName(file.name); setCvUploaded(true); }
                  }} />
                </label>
              )}
            </div>

            {/* Attachment 2: Images of Previous Work */}
            <div className={`rounded-lg border p-3 flex flex-col justify-between space-y-2 ${
              previousWorksUploaded || previousWorks.length > 0 ? 'border-emerald-400 bg-emerald-50/50' : 'border-sadu-gold/60 bg-sadu-sand/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sadu-charcoal">Previous Works *</span>
                {previousWorksUploaded || previousWorks.length > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">Required</span>
                )}
              </div>
              {previousWorksUploaded || previousWorks.length > 0 ? (
                <div className="flex items-center justify-between rounded bg-white p-2 border border-emerald-300 text-xs">
                  <span className="text-emerald-950 font-medium">{previousWorks.length > 0 ? `${previousWorks.length} Images Attached` : 'Images Attached'}</span>
                  <button type="button" onClick={() => { setPreviousWorks([]); setPreviousWorksUploaded(false); }} className="text-red-500 hover:text-red-700 ms-1 cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded border-2 border-dashed border-sadu-gold/70 bg-white p-2.5 text-center cursor-pointer hover:border-sadu-brick">
                  <ImageIcon className="h-4 w-4 text-sadu-muted mb-0.5" />
                  <span className="text-[10px] font-bold text-sadu-brick">Attach Images</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setPreviousWorks(Array.from(e.target.files).map(f => f.name));
                      setPreviousWorksUploaded(true);
                    }
                  }} />
                </label>
              )}
            </div>

            {/* Attachment 3: Mockups/Sketches of New Work (Optional if Existing Work) */}
            <div className={`rounded-lg border p-3 flex flex-col justify-between space-y-2 ${
              newWorkMockupUploaded || newWorkMockup.length > 0
                ? 'border-emerald-400 bg-emerald-50/50'
                : !isCommissioned
                ? 'border-stone-300 bg-stone-50/60'
                : 'border-sadu-gold/60 bg-sadu-sand/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sadu-charcoal">
                  {isCommissioned ? 'New Work Mockups *' : 'New Work Mockups (Optional)'}
                </span>
                {newWorkMockupUploaded || newWorkMockup.length > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : !isCommissioned ? (
                  <span className="text-[10px] font-semibold text-stone-600 bg-stone-200 px-1 py-0.5 rounded">Optional</span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">Required</span>
                )}
              </div>
              {newWorkMockupUploaded || newWorkMockup.length > 0 ? (
                <div className="flex items-center justify-between rounded bg-white p-2 border border-emerald-300 text-xs">
                  <span className="text-emerald-950 font-medium">{newWorkMockup.length > 0 ? `${newWorkMockup.length} Mockups Attached` : 'Mockups Attached'}</span>
                  <button type="button" onClick={() => { setNewWorkMockup([]); setNewWorkMockupUploaded(false); }} className="text-red-500 hover:text-red-700 ms-1 cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded border-2 border-dashed border-sadu-gold/70 bg-white p-2.5 text-center cursor-pointer hover:border-sadu-brick">
                  <Upload className="h-4 w-4 text-sadu-muted mb-0.5" />
                  <span className="text-[10px] font-bold text-sadu-brick">Attach Mockups</span>
                  <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setNewWorkMockup(Array.from(e.target.files).map(f => f.name));
                      setNewWorkMockupUploaded(true);
                    }
                  }} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Submit Action Gate */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-sadu-gold/40 pt-4">
          <span className="text-xs text-sadu-muted">
            {isFormValid ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> {isCommissioned ? 'All 5 mandatory schema components attached and validated.' : 'Historical/existing work schema validated (mockup waived).'}
              </span>
            ) : (
              <span className="text-amber-800 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> {isCommissioned ? 'Required: Name, Category tag, CV, Previous Works, and Mockups.' : 'Required: Name, Category tag, CV, and Previous Works.'}
              </span>
            )}
          </span>

          <button
            type="submit"
            disabled={!isFormValid}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-sadu-brick px-6 py-3 text-xs font-bold text-white shadow-xs transition-colors hover:bg-sadu-brick-dark disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Submit Artist Dossier (Multaqa Gate)</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArtistNominationForm;
