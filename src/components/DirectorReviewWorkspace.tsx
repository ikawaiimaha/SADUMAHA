import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  AlertOctagon,
  Scale,
  ExternalLink,
  RotateCcw,
  X
} from 'lucide-react';
import { ArtistDossier } from '../types';

// Mock Data for the Pitch Demo
const MOCK_DOSSIERS: ArtistDossier[] = [
  {
    id: 'd-101',
    name: 'Ahmed Al-Farsi',
    arabicName: 'أحمد الفارسي',
    category: 'Established',
    nationality: 'Omani',
    medium: 'Bronze Sculpture',
    status: 'PENDING_DIRECTOR_REVIEW',
    isCommissioned: true,
    cvUrl: '#',
    portfolioUrl: '#',
    mockupsUrl: '#'
  },
  {
    id: 'd-102',
    name: 'Fatima Al-Qasimi',
    arabicName: 'فاطمة القاسمي',
    category: 'Emerging',
    nationality: 'Emirati',
    medium: 'Digital Calligraphy',
    status: 'PENDING_DIRECTOR_REVIEW',
    isCommissioned: false,
    cvUrl: '#',
    portfolioUrl: '#'
  },
  {
    id: 'd-103',
    name: 'Yousef Hassan',
    arabicName: 'يوسف حسن',
    category: 'Emerging',
    nationality: 'Bahraini',
    medium: 'Mixed Media Installation',
    status: 'PENDING_DIRECTOR_REVIEW',
    isCommissioned: true,
    cvUrl: '#',
    portfolioUrl: '#',
    mockupsUrl: '#'
  }
];

export interface DirectorReviewWorkspaceProps {
  initialDossiers?: ArtistDossier[];
  onApproveDossier?: (id: string) => void;
  onVetoDossier?: (id: string, reason: string) => void;
  onBackToRoles?: () => void;
}

export default function DirectorReviewWorkspace({
  initialDossiers,
  onApproveDossier,
  onVetoDossier,
  onBackToRoles,
}: DirectorReviewWorkspaceProps = {}) {
  const [dossiers, setDossiers] = useState<ArtistDossier[]>(initialDossiers || MOCK_DOSSIERS);
  const [selectedDossier, setSelectedDossier] = useState<ArtistDossier | null>(null);
  
  // Veto State
  const [isVetoModalOpen, setIsVetoModalOpen] = useState(false);
  const [vetoReasonCategory, setVetoReasonCategory] = useState('Curatorial Mismatch');
  const [vetoReason, setVetoReason] = useState('');

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVetoModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Analytics for the Executive Dashboard
  const pendingCount = dossiers.filter(d => d.status === 'PENDING_DIRECTOR_REVIEW').length;
  const emergingCount = dossiers.filter(d => d.category === 'Emerging' && d.status !== 'DIRECTOR_VETOED').length;
  const establishedCount = dossiers.filter(d => d.category === 'Established' && d.status !== 'DIRECTOR_VETOED').length;
  const totalActive = emergingCount + establishedCount;
  const emergingRatioPct = totalActive > 0 ? Math.round((emergingCount / totalActive) * 100) : 50;

  const handleApprove = (id: string) => {
    setDossiers(prev => prev.map(d => 
      d.id === id ? { ...d, status: 'DIRECTOR_APPROVED' } : d
    ));
    onApproveDossier?.(id);
    setSelectedDossier(null);
  };

  const executeVeto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vetoReason.trim() || !selectedDossier) return;

    const fullReason = `[${vetoReasonCategory}] ${vetoReason.trim()}`;

    setDossiers(prev => prev.map(d => 
      d.id === selectedDossier.id ? { ...d, status: 'DIRECTOR_VETOED', rejectionReason: fullReason } : d
    ));
    
    onVetoDossier?.(selectedDossier.id, fullReason);
    setIsVetoModalOpen(false);
    setVetoReason('');
    setSelectedDossier(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F1E6] p-6 text-[#2C2A29] font-sans text-start">
      
      {/* Header */}
      <header className="mb-8 border-b border-[#D9D2C5] pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8B4513] font-bold">Stage 5 Operations</span>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1A1817] mt-1">
            Directorate Vetting (الاعتماد الإداري)
          </h1>
          <p className="text-[#6B635B] text-sm mt-1">
            Executive oversight of incoming artist dossiers by Mohammed Al Qaseer. Approve to unblock Stage 6 Contracting.
          </p>
        </div>
        {onBackToRoles && (
          <button
            type="button"
            onClick={onBackToRoles}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D9D2C5] bg-white px-3 py-2 text-xs font-bold text-[#6B635B] hover:bg-stone-50 cursor-pointer shadow-xs transition-colors self-start md:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Switch Role</span>
          </button>
        )}
      </header>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-md border border-[#D9D2C5] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-stone-100 rounded text-[#1A1817]">
            <FileText className="w-6 h-6 text-[#8B4513]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#6B635B] uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-serif font-bold text-[#1A1817]">{pendingCount}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-md border border-[#D9D2C5] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-stone-100 rounded text-[#1A1817]">
            <Scale className="w-6 h-6 text-[#5C6F58]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#6B635B] uppercase tracking-wider">Emerging Ratio</p>
              <span className="text-xs font-mono font-bold text-[#5C6F58]">{emergingRatioPct}%</span>
            </div>
            <p className="text-2xl font-serif font-bold text-[#1A1817]">{emergingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md border border-[#D9D2C5] shadow-xs flex items-center gap-4">
          <div className="p-3 bg-stone-100 rounded text-[#1A1817]">
            <ShieldCheck className="w-6 h-6 text-[#8B4513]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#6B635B] uppercase tracking-wider">Established Ratio</p>
              <span className="text-xs font-mono font-bold text-[#8B4513]">{100 - emergingRatioPct}%</span>
            </div>
            <p className="text-2xl font-serif font-bold text-[#1A1817]">{establishedCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dossier Queue */}
        <div className="lg:col-span-1 bg-white border border-[#D9D2C5] rounded-lg shadow-xs overflow-hidden flex flex-col h-[600px]">
          <div className="bg-[#FAF8F5] px-4 py-3 border-b border-[#D9D2C5] flex justify-between items-center">
            <h2 className="text-sm font-bold text-[#1A1817]">Awaiting Vetting</h2>
            <span className="bg-[#1A1817] text-white text-[10px] px-2 py-0.5 rounded font-bold">{pendingCount}</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {dossiers.filter(d => d.status === 'PENDING_DIRECTOR_REVIEW').map(dossier => (
              <button
                key={dossier.id}
                onClick={() => setSelectedDossier(dossier)}
                className={`w-full text-start p-3 rounded border transition-colors cursor-pointer ${
                  selectedDossier?.id === dossier.id 
                    ? 'bg-[#1A1817] border-[#1A1817] text-white' 
                    : 'bg-white border-[#D9D2C5] hover:bg-stone-50 text-[#2C2A29]'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm">{dossier.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                    selectedDossier?.id === dossier.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {dossier.category}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs opacity-80" dir="rtl">
                  <span className="font-serif">{dossier.arabicName}</span>
                </div>
              </button>
            ))}
            {pendingCount === 0 && (
              <div className="p-8 text-center text-stone-400 text-sm">
                Queue is empty. All candidate dossiers have been processed.
              </div>
            )}
          </div>
        </div>

        {/* Executive Inspection View */}
        <div className="lg:col-span-2">
          {selectedDossier ? (
            <div className="bg-white border border-[#D9D2C5] rounded-lg shadow-xs overflow-hidden h-[600px] flex flex-col">
              
              {/* Profile Header */}
              <div className="p-6 border-b border-[#D9D2C5] bg-[#FAF8F5] flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#1A1817]">{selectedDossier.name}</h2>
                  <h3 className="text-lg font-serif text-[#6B635B] mt-1 text-end" dir="rtl">{selectedDossier.arabicName}</h3>
                </div>
                <div className="text-end">
                  <span className={`inline-block text-white text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider ${
                    selectedDossier.category === 'Established' ? 'bg-[#8B4513]' : 'bg-[#5C6F58]'
                  }`}>
                    {selectedDossier.category}
                  </span>
                  <p className="text-sm text-[#6B635B] mt-2 font-medium">{selectedDossier.nationality}</p>
                </div>
              </div>

              {/* Dossier Metadata */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <span className="block text-xs font-bold text-[#6B635B] uppercase tracking-wider mb-1">Primary Medium</span>
                    <p className="text-[#1A1817] font-medium">{selectedDossier.medium}</p>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#6B635B] uppercase tracking-wider mb-1">Project Type</span>
                    <p className="text-[#1A1817] font-medium">
                      {selectedDossier.isCommissioned ? 'New Commission (عمل جديد)' : 'Existing Masterpiece (عمل جاهز)'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-[#1A1817] border-b border-[#EAE3D9] pb-2">Verified Attachments</h4>
                  <div className="flex flex-wrap gap-3">
                    <a href={selectedDossier.cvUrl} className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-2 rounded text-xs font-bold text-[#1A1817] transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> View CV
                    </a>
                    <a href={selectedDossier.portfolioUrl} className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-2 rounded text-xs font-bold text-[#1A1817] transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> View Portfolio
                    </a>
                    {selectedDossier.isCommissioned && (
                      <a href={selectedDossier.mockupsUrl} className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-2 rounded text-xs font-bold text-[#1A1817] transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" /> Proposal Mockups
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Executive Actions */}
              <div className="p-4 border-t border-[#D9D2C5] bg-[#FAF8F5] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsVetoModalOpen(true)}
                  className="flex items-center gap-2 bg-white border border-[#A32A29] text-[#A32A29] hover:bg-red-50 px-4 py-2 rounded text-sm font-bold transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Executive Veto
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(selectedDossier.id)}
                  className="flex items-center gap-2 bg-[#1A1817] hover:bg-black text-white px-6 py-2 rounded text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve for Contracting
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[600px] border border-dashed border-[#D9D2C5] rounded-lg flex flex-col items-center justify-center text-stone-400 bg-white/40">
              <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a dossier from the queue to review.</p>
            </div>
          )}
        </div>
      </div>

      {/* Veto Modal (Accountability Gate) */}
      {isVetoModalOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsVetoModalOpen(false);
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden text-start">
            <div className="bg-[#A32A29] p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-5 h-5" />
                <h3 className="font-bold text-sm">Execute Institutional Veto</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVetoModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={executeVeto} className="p-6">
              <p className="text-xs text-[#6B635B] mb-4 leading-relaxed">
                You are executing an executive veto against <strong className="text-[#1A1817]">{selectedDossier?.name}</strong>. 
                Under Sharjah Calligraphy Biennial governance rules, an executive veto requires a logged institutional justification.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-bold text-[#1A1817] mb-1">
                  Veto Category (تصنيف سبب الاستبعاد)
                </label>
                <select
                  value={vetoReasonCategory}
                  onChange={(e) => setVetoReasonCategory(e.target.value)}
                  className="w-full p-2.5 border border-[#D9D2C5] rounded-md bg-[#FAF8F5] text-xs font-semibold text-[#1A1817] focus:ring-1 focus:ring-[#A32A29] focus:border-[#A32A29] outline-hidden cursor-pointer"
                >
                  <option value="Curatorial Mismatch">Curatorial Mismatch (عدم توافق تقييمي)</option>
                  <option value="Budget Exceeded">Budget Exceeded (تجاوز سقف الميزانية)</option>
                  <option value="Security/HIP Blocklist">Security/HIP Blocklist (توجيه أمني / حظر المنصة)</option>
                  <option value="Administrative Directive">Administrative Directive (توجيه إداري رئاسي)</option>
                </select>
              </div>
              
              <label className="block text-xs font-bold text-[#1A1817] mb-1 flex justify-between">
                <span>Detailed Justification Notes</span>
                <span className="text-[#A32A29]">* Mandatory</span>
              </label>
              <textarea
                required
                rows={3}
                value={vetoReason}
                onChange={(e) => setVetoReason(e.target.value)}
                placeholder="State the strategic or curatorial conflict for the Coordinator's feedback log..."
                className="w-full p-3 border border-[#D9D2C5] rounded bg-[#FAF8F5] text-xs text-[#1A1817] focus:ring-1 focus:ring-[#A32A29] focus:border-[#A32A29] outline-hidden mb-6 resize-none"
              />
              
              <div className="flex justify-end gap-3 border-t border-[#EAE3D9] pt-4">
                <button
                  type="button"
                  onClick={() => setIsVetoModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#6B635B] hover:text-[#1A1817] transition-colors cursor-pointer border border-[#D9D2C5] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!vetoReason.trim()}
                  className="px-5 py-2 bg-[#A32A29] hover:bg-red-800 disabled:opacity-40 text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Confirm Veto &amp; Lock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export { DirectorReviewWorkspace };
