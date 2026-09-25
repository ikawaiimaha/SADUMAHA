import React, { useState } from 'react';
import { 
  UserPlus, 
  Upload, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Palette, 
  Globe, 
  AlertTriangle,
  Lock,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { Language } from '../types';

export interface DossierForm {
  nameEn: string;
  nameAr: string;
  nationality: string;
  category: 'Emerging' | 'Established' | '';
  medium: string;
  isCommissioned: boolean;
  files: {
    cv: boolean;
    portfolio: boolean;
    mockups: boolean;
  };
}

export interface ArtistNominationBuilderProps {
  lang?: Language;
  onSuccess?: () => void;
  onCancel?: () => void;
  curatorialBrief?: string;
  blocklist?: string[];
  onSubmitNomination?: (dossier: DossierForm) => void;
  submittedBy?: 'PREP_COMMITTEE' | 'COORDINATOR';
}

export default function ArtistNominationBuilder({
  lang = 'en',
  onSuccess,
  onCancel,
  curatorialBrief,
  blocklist = [],
  onSubmitNomination,
  submittedBy: propSubmittedBy,
}: ArtistNominationBuilderProps = {}) {
  const [form, setForm] = useState<DossierForm>({
    nameEn: '',
    nameAr: '',
    nationality: '',
    category: '',
    medium: '',
    isCommissioned: true, // Default to new commissioned work
    files: { cv: false, portfolio: false, mockups: false }
  });

  // Role simulation for Hardening #4 (Accountability)
  // In production, this comes from your Auth context or prop
  const [currentUserRole, setCurrentUserRole] = useState<'PREP_COMMITTEE' | 'COORDINATOR'>(
    propSubmittedBy || 'PREP_COMMITTEE'
  );

  // Simulated Blocklist Check: checks against blocklist prop or demo keyword
  const isBlocklisted = 
    form.nationality.trim().toLowerCase() === 'restricted-demo' ||
    blocklist.some(b => 
      b.toLowerCase().includes(form.nationality.trim().toLowerCase()) && 
      form.nationality.trim().length > 2
    );

  // Dynamic schema validation (Hardening #1)
  const isDossierComplete = 
    Boolean(form.nameEn && 
    form.nameAr && 
    form.nationality && 
    form.category && 
    form.medium && 
    form.files.cv && 
    form.files.portfolio && 
    (!form.isCommissioned || form.files.mockups));

  const handleFileUpload = (type: keyof DossierForm['files']) => {
    setForm(prev => ({ ...prev, files: { ...prev.files, [type]: true } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDossierComplete) return;
    if (isBlocklisted) {
      alert("System Action: Dossier quarantined due to active HIP Blocklist parameters.");
      return;
    }
    onSubmitNomination?.(form);
    alert("Dossier locked and submitted to Stage 5: Pending Director Review.");
    onSuccess?.();
  };

  return (
    <div className="bg-[#F7F1E6] p-6 text-[#2C2A29] font-sans text-start rounded-lg border border-[#D9D2C5]" dir="ltr">
      
      {/* Header */}
      <header className="mb-6 border-b border-[#D9D2C5] pb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">Stage 4 • The Multaqa Protocol</span>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-[#1A1817] mt-1">Artist Nomination Builder</h1>
          <p className="text-[#6B635B] text-sm mt-1">
            بناء ملف الترشيح — Assemble cultural dossiers, categorize strategic tier, and clear initial curatorial compliance.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Role Toggle for Mockup Demonstration */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-[#D9D2C5] shadow-xs">
            <span className="text-[10px] uppercase font-bold text-stone-400">View As:</span>
            <select 
              value={currentUserRole}
              onChange={(e) => setCurrentUserRole(e.target.value as any)}
              className="text-xs font-semibold text-[#8B4513] bg-transparent outline-hidden cursor-pointer"
            >
              <option value="PREP_COMMITTEE">Preparatory Committee</option>
              <option value="COORDINATOR">General Coordinator</option>
            </select>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D9D2C5] bg-white px-3 py-1.5 text-xs font-bold text-[#6B635B] hover:bg-stone-50 cursor-pointer shadow-xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Artist Identity & Metadata */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5] space-y-5">
          <div className="flex items-center gap-2 border-b border-[#EAE3D9] pb-3">
            <UserPlus className="w-5 h-5 text-[#8B4513]" />
            <h2 className="text-base font-semibold font-serif">Artist Identity (بيانات الفنان)</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1817] mb-1">Official Name (English)</label>
              <input 
                type="text" 
                value={form.nameEn}
                onChange={e => setForm({...form, nameEn: e.target.value})}
                placeholder="e.g. Yousef Nabhan"
                className="w-full p-2.5 border border-[#D9D2C5] rounded bg-[#FAF8F5] text-sm focus:ring-1 focus:ring-[#8B4513] outline-hidden"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[#1A1817] mb-1">Official Name (Arabic - الاسم الرسمي)</label>
              <input 
                type="text" 
                dir="rtl"
                value={form.nameAr}
                onChange={e => setForm({...form, nameAr: e.target.value})}
                placeholder="يوسف نبهان"
                className="w-full p-2.5 border border-[#D9D2C5] rounded bg-[#FAF8F5] text-sm focus:ring-1 focus:ring-[#8B4513] outline-hidden text-end font-serif"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1817] mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#8B4513]" /> Nationality
                </label>
                <input 
                  type="text" 
                  value={form.nationality}
                  onChange={e => setForm({...form, nationality: e.target.value})}
                  placeholder="e.g. UAE / Jordan"
                  className={`w-full p-2 border rounded bg-[#FAF8F5] text-sm outline-hidden ${isBlocklisted ? 'border-red-400 focus:ring-red-500' : 'border-[#D9D2C5] focus:ring-[#8B4513]'}`}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[#1A1817] mb-1 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#8B4513]" /> Medium
                </label>
                <input 
                  type="text" 
                  value={form.medium}
                  onChange={e => setForm({...form, medium: e.target.value})}
                  placeholder="e.g. Bronze sculpture"
                  className="w-full p-2 border border-[#D9D2C5] rounded bg-[#FAF8F5] text-sm focus:ring-1 focus:ring-[#8B4513] outline-hidden"
                />
              </div>
            </div>

            {/* Strategic Category - Enforced by Director Balance Requirements */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-[#1A1817] mb-2">Curatorial Tier Designation (التصنيف)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({...form, category: 'Emerging'})}
                  className={`p-2.5 rounded border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    form.category === 'Emerging' ? 'bg-[#5C6F58] border-[#5C6F58] text-white shadow-2xs' : 'bg-white border-[#D9D2C5] text-[#6B635B] hover:bg-stone-50'
                  }`}
                >
                  Emerging
                </button>
                <button
                  type="button"
                  onClick={() => setForm({...form, category: 'Established'})}
                  className={`p-2.5 rounded border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    form.category === 'Established' ? 'bg-[#8B4513] border-[#8B4513] text-white shadow-2xs' : 'bg-white border-[#D9D2C5] text-[#6B635B] hover:bg-stone-50'
                  }`}
                >
                  Established
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Column 2: Dynamic Schema & Uploads */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5] space-y-5">
          <div className="flex items-center gap-2 border-b border-[#EAE3D9] pb-3">
            <FileText className="w-5 h-5 text-[#8B4513]" />
            <h2 className="text-base font-semibold font-serif">Dossier Assets (المرفقات)</h2>
          </div>

          {/* Hardening #1: Dynamic Dossier Toggle */}
          <div className="bg-[#FAF8F5] p-1 rounded-md border border-[#D9D2C5] flex mb-4">
            <button
              type="button"
              onClick={() => setForm({...form, isCommissioned: true})}
              className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${form.isCommissioned ? 'bg-white shadow-xs text-[#1A1817]' : 'text-[#8C7A6B] hover:text-[#1A1817]'}`}
            >
              New Commission (عمل جديد)
            </button>
            <button
              type="button"
              onClick={() => setForm({...form, isCommissioned: false})}
              className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${!form.isCommissioned ? 'bg-white shadow-xs text-[#1A1817]' : 'text-[#8C7A6B] hover:text-[#1A1817]'}`}
            >
              Existing Masterpiece (عمل جاهز)
            </button>
          </div>

          <div className="space-y-3">
            {/* CV Upload */}
            <div className="p-3 border border-[#D9D2C5] rounded bg-white flex justify-between items-center">
              <div>
                <span className="block text-xs font-bold text-[#1A1817]">Artist CV (PDF) <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-stone-400">Institutional curriculum vitae</span>
              </div>
              {form.files.cv ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <button type="button" onClick={() => handleFileUpload('cv')} className="p-1.5 bg-stone-100 rounded hover:bg-stone-200 cursor-pointer">
                  <Upload className="w-4 h-4 text-stone-600" />
                </button>
              )}
            </div>

            {/* Portfolio Upload */}
            <div className="p-3 border border-[#D9D2C5] rounded bg-white flex justify-between items-center">
              <div>
                <span className="block text-xs font-bold text-[#1A1817]">Previous Portfolio (PDF) <span className="text-red-500">*</span></span>
                <span className="text-[10px] text-stone-400">Past major exhibitions and catalog plates</span>
              </div>
              {form.files.portfolio ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <button type="button" onClick={() => handleFileUpload('portfolio')} className="p-1.5 bg-stone-100 rounded hover:bg-stone-200 cursor-pointer">
                  <Upload className="w-4 h-4 text-stone-600" />
                </button>
              )}
            </div>

            {/* Conditional Mockup Upload */}
            {form.isCommissioned && (
              <div className="p-3 border border-[#8B4513]/30 rounded bg-[#8B4513]/5 flex justify-between items-center">
                <div>
                  <span className="block text-xs font-bold text-[#8B4513]">Proposed Work Mockups/Sketches <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-[#8B4513]/70">Required for new commissions</span>
                </div>
                {form.files.mockups ? (
                  <CheckCircle2 className="w-5 h-5 text-[#8B4513]" />
                ) : (
                  <button type="button" onClick={() => handleFileUpload('mockups')} className="p-1.5 bg-white rounded border border-[#8B4513]/20 hover:bg-[#8B4513]/10 cursor-pointer">
                    <ImageIcon className="w-4 h-4 text-[#8B4513]" />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Column 3: Compliance & Submission Gate */}
        <section className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#EAE3D9] pb-3">
              <ShieldAlert className="w-5 h-5 text-[#8B4513]" />
              <h2 className="text-base font-semibold font-serif">Verification &amp; Submit</h2>
            </div>

            {/* Blocklist Simulation Warning */}
            {isBlocklisted && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-start gap-2 text-red-800 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <p><strong>System Alert:</strong> Nationality matches active HIP dynamic blocklist constraints. Submission will route to QUARANTINE.</p>
              </div>
            )}

            <div className="text-xs text-[#6B635B] space-y-2">
              <p className="flex items-center justify-between">
                <span>Identity Schema:</span> 
                {form.nameEn && form.nameAr && form.nationality && form.medium ? <strong className="text-emerald-700">Complete</strong> : <span className="text-stone-400">Pending</span>}
              </p>
              <p className="flex items-center justify-between">
                <span>Strategic Tier:</span> 
                {form.category ? <strong className="text-emerald-700">{form.category}</strong> : <span className="text-stone-400">Pending</span>}
              </p>
              <p className="flex items-center justify-between">
                <span>Asset Schema:</span> 
                {form.files.cv && form.files.portfolio && (!form.isCommissioned || form.files.mockups) ? <strong className="text-emerald-700">Verified</strong> : <span className="text-stone-400">Incomplete</span>}
              </p>
            </div>
          </div>

          {/* Hardening #4: Accountable Submission Permission */}
          <div className="mt-6 pt-4 border-t border-[#EAE3D9]">
            {currentUserRole === 'PREP_COMMITTEE' ? (
              <div className="bg-stone-50 border border-stone-200 p-3 rounded-md flex items-center gap-3 text-stone-600 text-xs">
                <Lock className="w-6 h-6 shrink-0 text-stone-400" />
                <p>Drafting enabled. Only the designated <strong>General Coordinator</strong> can officially execute the <code className="bg-stone-200 px-1 rounded font-mono">SUBMIT_FOR_VETTING</code> action.</p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!isDossierComplete}
                className="w-full bg-[#1A1817] hover:bg-black disabled:bg-stone-300 disabled:text-stone-500 text-white py-3 rounded-md text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                {isDossierComplete ? 'Lock Dossier & Submit to Director' : 'Complete Dossier to Submit'}
              </button>
            )}
          </div>
        </section>

      </form>
    </div>
  );
}

export { ArtistNominationBuilder };
