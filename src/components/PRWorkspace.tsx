import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  AlertTriangle, 
  UserCheck, 
  Download, 
  Send,
  Lock,
  RotateCcw
} from 'lucide-react';
import { BilateralContract } from '../types/contractStage6';

export interface LogisticsSubmission {
  id: string;
  artistName: string;
  arabicName: string;
  nationality: string;
  medium: string;
  passportUrl: string;
  passportStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  artworkImageUrl: string;
  artworkStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
}

const MOCK_SUBMISSIONS: LogisticsSubmission[] = [
  {
    id: 'SUB-001',
    artistName: 'Yousef Nabhan',
    arabicName: 'يوسف نبهان',
    nationality: 'Jordanian / UAE',
    medium: 'Large-scale Kufic bronze sculpture',
    passportUrl: '/secure-docs/passport_yousef_nabhan.pdf',
    passportStatus: 'PENDING',
    artworkImageUrl: '/secure-docs/artwork_kufic_bronze.tiff',
    artworkStatus: 'PENDING'
  },
  {
    id: 'SUB-002',
    artistName: 'Noura Al-Mazrouei',
    arabicName: 'نورة المزروعي',
    nationality: 'UAE',
    medium: 'Digital Lightbox Installation',
    passportUrl: '/secure-docs/passport_noura_mazrouei.pdf',
    passportStatus: 'VERIFIED',
    artworkImageUrl: '/secure-docs/artwork_lightbox_01.png',
    artworkStatus: 'VERIFIED'
  }
];

export interface PRWorkspaceProps {
  contracts?: BilateralContract[];
  onVerifyPassport?: (contractId: string, notes?: string) => void;
  onVerifyHighResArtwork?: (contractId: string, notes?: string) => void;
  onBackToRoles?: () => void;
}

export default function PRWorkspace({
  contracts,
  onVerifyPassport,
  onVerifyHighResArtwork,
  onBackToRoles
}: PRWorkspaceProps = {}) {
  // Map from contracts if provided, otherwise fallback to MOCK_SUBMISSIONS
  const initialSubmissions: LogisticsSubmission[] = contracts && contracts.length > 0
    ? contracts.map(c => ({
        id: c.id,
        artistName: c.artistName,
        arabicName: (c as any).artistArabicName || (
          c.artistName === 'Yousef Nabhan' ? 'يوسف نبهان' :
          c.artistName === 'Hassan Sharif' ? 'حسن شريف' :
          c.artistName === 'Mohamed Zakariya' ? 'محمد زكريا' :
          'فنان مشارك'
        ),
        nationality: c.nationality,
        medium: c.medium,
        passportUrl: c.documents.passportFileName ? `/secure-docs/${c.documents.passportFileName}` : `/secure-docs/passport_${c.artistName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        passportStatus: c.documents.passportStatus === 'VERIFIED' ? 'VERIFIED' : c.documents.passportStatus === 'REJECTED' ? 'REJECTED' : 'PENDING',
        artworkImageUrl: c.documents.highResArtworkFileName ? `/secure-docs/${c.documents.highResArtworkFileName}` : `/secure-docs/artwork_${c.artistName.toLowerCase().replace(/\s+/g, '_')}_300dpi.tiff`,
        artworkStatus: c.documents.highResStatus === 'VERIFIED' ? 'VERIFIED' : c.documents.highResStatus === 'REJECTED' ? 'REJECTED' : 'PENDING',
        rejectionReason: c.documents.passportNotes || c.documents.highResNotes,
      }))
    : MOCK_SUBMISSIONS;

  const [submissions, setSubmissions] = useState<LogisticsSubmission[]>(initialSubmissions);
  const [selectedSub, setSelectedSub] = useState<LogisticsSubmission | null>(initialSubmissions[0] || null);
  const [activeTab, setActiveTab] = useState<'PASSPORT' | 'ARTWORK'>('PASSPORT');
  const [rejectionInput, setRejectionInput] = useState('');
  const [showRejectBox, setShowRejectBox] = useState<'PASSPORT' | 'ARTWORK' | null>(null);

  // Sync when contracts prop updates
  useEffect(() => {
    if (contracts && contracts.length > 0) {
      const mapped = contracts.map(c => ({
        id: c.id,
        artistName: c.artistName,
        arabicName: (c as any).artistArabicName || (
          c.artistName === 'Yousef Nabhan' ? 'يوسف نبهان' :
          c.artistName === 'Hassan Sharif' ? 'حسن شريف' :
          c.artistName === 'Mohamed Zakariya' ? 'محمد زكريا' :
          'فنان مشارك'
        ),
        nationality: c.nationality,
        medium: c.medium,
        passportUrl: c.documents.passportFileName ? `/secure-docs/${c.documents.passportFileName}` : `/secure-docs/passport_${c.artistName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        passportStatus: (c.documents.passportStatus === 'VERIFIED' ? 'VERIFIED' : c.documents.passportStatus === 'REJECTED' ? 'REJECTED' : 'PENDING') as 'PENDING' | 'VERIFIED' | 'REJECTED',
        artworkImageUrl: c.documents.highResArtworkFileName ? `/secure-docs/${c.documents.highResArtworkFileName}` : `/secure-docs/artwork_${c.artistName.toLowerCase().replace(/\s+/g, '_')}_300dpi.tiff`,
        artworkStatus: (c.documents.highResStatus === 'VERIFIED' ? 'VERIFIED' : c.documents.highResStatus === 'REJECTED' ? 'REJECTED' : 'PENDING') as 'PENDING' | 'VERIFIED' | 'REJECTED',
        rejectionReason: c.documents.passportNotes || c.documents.highResNotes,
      }));
      setSubmissions(mapped);
      setSelectedSub(prev => mapped.find(m => m.id === prev?.id) || mapped[0] || null);
    }
  }, [contracts]);

  const handleVerify = (subId: string, fileType: 'PASSPORT' | 'ARTWORK', decision: 'VERIFIED' | 'REJECTED', reason?: string) => {
    setSubmissions(prev => prev.map(item => {
      if (item.id === subId) {
        if (fileType === 'PASSPORT') {
          return { ...item, passportStatus: decision, rejectionReason: reason };
        } else {
          return { ...item, artworkStatus: decision, rejectionReason: reason };
        }
      }
      return item;
    }));

    if (decision === 'VERIFIED') {
      if (fileType === 'PASSPORT') {
        onVerifyPassport?.(subId, reason || 'Verified by PR & Protocol');
      } else {
        onVerifyHighResArtwork?.(subId, reason || 'Verified by PR & Protocol (300 DPI Confirmed)');
      }
    } else {
      if (fileType === 'PASSPORT') {
        onVerifyPassport?.(subId, `REJECTED: ${reason || 'Correction requested'}`);
      } else {
        onVerifyHighResArtwork?.(subId, `REJECTED: ${reason || 'Correction requested'}`);
      }
    }

    setShowRejectBox(null);
    setRejectionInput('');
  };

  const pendingCount = submissions.filter(s => s.passportStatus === 'PENDING' || s.artworkStatus === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#F7F1E6] p-6 text-[#2C2A29] font-sans text-start" dir="ltr">
      
      {/* Header */}
      <header className="mb-8 border-b border-[#D9D2C5] pb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold">Stage 7 • Protocol &amp; Asset Verification</span>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-[#1A1817] mt-1">PR &amp; Protocol Verification Dashboard</h1>
          <p className="text-[#6B635B] text-sm mt-1">
            التشريفات — Verify passport validity for visa clearance and inspect print quality of catalog assets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-md border border-[#D9D2C5] text-xs font-mono shadow-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#8B4513]" />
            <span>Pending Verification Queue: {pendingCount}</span>
          </div>
          {onBackToRoles && (
            <button
              type="button"
              onClick={onBackToRoles}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#D9D2C5] bg-white px-3 py-2 text-xs font-bold text-[#6B635B] hover:bg-stone-50 cursor-pointer shadow-xs transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Switch Role</span>
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Artist Submissions Queue */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-[#D9D2C5] flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-[#EAE3D9] pb-3">
            <UserCheck className="w-5 h-5 text-[#8B4513]" />
            <h2 className="text-base font-semibold font-serif">Logistics Submissions ({submissions.length})</h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[550px] pe-1">
            {submissions.map((sub) => {
              const isSelected = selectedSub?.id === sub.id;
              const isFullyVerified = sub.passportStatus === 'VERIFIED' && sub.artworkStatus === 'VERIFIED';
              const hasRejection = sub.passportStatus === 'REJECTED' || sub.artworkStatus === 'REJECTED';

              return (
                <button 
                  key={sub.id}
                  type="button"
                  onClick={() => { setSelectedSub(sub); setShowRejectBox(null); }}
                  className={`w-full text-start p-4 rounded-md border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#8B4513] ${
                    isSelected 
                      ? 'border-[#8B4513] bg-[#FDFBF7] shadow-sm ring-1 ring-[#8B4513]' 
                      : 'border-[#D9D2C5] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-[#1A1817]">{sub.artistName}</h3>
                      <p className="text-xs text-[#8C7A6B] font-serif">{sub.arabicName}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isFullyVerified ? 'bg-emerald-100 text-emerald-800' : hasRejection ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isFullyVerified ? 'Cleared' : hasRejection ? 'Revision Req.' : 'Pending Review'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B635B] mb-2">{sub.medium}</p>
                  <div className="flex justify-between items-center text-[11px] text-[#8C7A6B] border-t border-[#F2ECE1] pt-2">
                    <span>{sub.nationality}</span>
                    <span className="font-mono">ID: {sub.id}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Column 2 & 3: Asset Inspector & Verification Controls */}
        <section className="lg:col-span-2 space-y-6">
          {selectedSub ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#D9D2C5]">
              
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 border-b border-[#EAE3D9] pb-4">
                <div>
                  <span className="text-xs text-[#8C7A6B] uppercase font-mono">Inspecting Asset Package For:</span>
                  <h2 className="text-xl font-serif font-bold text-[#1A1817]">{selectedSub.artistName} ({selectedSub.arabicName})</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('PASSPORT'); setShowRejectBox(null); }}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === 'PASSPORT' ? 'bg-[#8B4513] text-white' : 'bg-[#FAF8F5] text-[#6B635B] border border-[#D9D2C5]'
                    }`}
                  >
                    Passport Document ({selectedSub.passportStatus})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('ARTWORK'); setShowRejectBox(null); }}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === 'ARTWORK' ? 'bg-[#8B4513] text-white' : 'bg-[#FAF8F5] text-[#6B635B] border border-[#D9D2C5]'
                    }`}
                  >
                    Catalog Imagery ({selectedSub.artworkStatus})
                  </button>
                </div>
              </div>

              {/* Asset Viewer Container */}
              <div className="space-y-6">
                
                <div className="border border-[#D9D2C5] rounded-md p-6 bg-[#FAF8F5] flex flex-col items-center justify-center min-h-[280px] text-center relative">
                  {activeTab === 'PASSPORT' ? (
                    <div className="space-y-3">
                      <FileText className="w-16 h-16 text-[#8C7A6B] mx-auto opacity-60" />
                      <div>
                        <h4 className="font-semibold text-sm text-[#1A1817]">Official Passport Copy (Secured File)</h4>
                        <p className="text-xs text-[#6B635B] font-mono mt-1">{selectedSub.passportUrl}</p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                        selectedSub.passportStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                        selectedSub.passportStatus === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Current Status: {selectedSub.passportStatus}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-48 h-32 bg-stone-200 rounded border border-stone-300 flex items-center justify-center mx-auto shadow-inner">
                        <span className="text-xs text-stone-500 font-mono">300 DPI TIFF / PNG Preview</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-[#1A1817]">High-Resolution Catalog Plate</h4>
                        <p className="text-xs text-[#6B635B] font-mono mt-1">{selectedSub.artworkImageUrl}</p>
                      </div>
                      <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${
                        selectedSub.artworkStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                        selectedSub.artworkStatus === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Current Status: {selectedSub.artworkStatus}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rejection Input Box (Conditional) */}
                {showRejectBox === activeTab && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-700" />
                      Specify Correction Reason for Artist Notification
                    </h4>
                    <textarea 
                      rows={3}
                      value={rejectionInput}
                      onChange={(e) => setRejectionInput(e.target.value)}
                      placeholder="e.g., Passport scan is blurry or cropped; please re-upload a clear copy meeting 300 DPI standards..."
                      className="w-full p-3 border border-red-300 rounded-md bg-white text-xs text-[#1A1817] focus:ring-1 focus:ring-red-600 outline-hidden"
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => setShowRejectBox(null)}
                        className="px-3 py-1.5 border border-stone-300 rounded text-xs font-medium text-stone-600 bg-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button"
                        disabled={!rejectionInput.trim()}
                        onClick={() => handleVerify(selectedSub.id, activeTab, 'REJECTED', rejectionInput.trim())}
                        className="bg-red-700 hover:bg-red-800 disabled:opacity-40 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors shadow-sm cursor-pointer"
                      >
                        Confirm Rejection &amp; Alert Artist
                      </button>
                    </div>
                  </div>
                )}

                {/* Verification Action Toolbar */}
                {!showRejectBox && (
                  <div className="pt-4 border-t border-[#EAE3D9] flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => alert("Downloading secure asset package for protocol audit...")}
                      className="flex items-center gap-2 px-4 py-2 border border-[#D9D2C5] rounded-md text-xs font-bold text-[#6B635B] hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Secure Asset</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowRejectBox(activeTab)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-red-300 bg-red-50 text-red-800 rounded-md text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Reject &amp; Request Correction</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVerify(selectedSub.id, activeTab, 'VERIFIED')}
                        className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify &amp; Clear Asset</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-[#D9D2C5] text-center text-[#8C7A6B]">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Select an artist from the queue to inspect logistics and protocol submissions.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
