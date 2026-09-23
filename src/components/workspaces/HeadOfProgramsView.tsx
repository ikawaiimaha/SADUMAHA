import React, { useState } from 'react';
import { Clock, CheckCircle, Send, Eye } from 'lucide-react';

interface InviteDraft {
  id: string;
  artistName: string;
  coordinator: string;
  theme: string;
  status: 'pending' | 'dispatched';
  brief: string;
}

const MOCK_DRAFTS: InviteDraft[] = [
  {
    id: 'INV-001',
    artistName: 'Youssef Nabhan',
    coordinator: 'Maha',
    theme: 'Balance',
    status: 'pending',
    brief: 'We are specifically interested in your large-scale Kufic bronze sculptures for the main hall.'
  },
  {
    id: 'INV-002',
    artistName: 'Noura Al-Mazrouei',
    coordinator: 'Maha',
    theme: 'Balance',
    status: 'pending',
    brief: 'Your recent explorations in digital Ruq’ah projection align perfectly with the biennial’s multimedia sector.'
  }
];

export const HeadOfProgramsView: React.FC = () => {
  const [drafts, setDrafts] = useState<InviteDraft[]>(MOCK_DRAFTS);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(MOCK_DRAFTS[0].id);

  const activeDraft = drafts.find(d => d.id === activeDraftId);

  const handleDispatch = (id: string) => {
    setDrafts(current => 
      current.map(draft => 
        draft.id === id ? { ...draft, status: 'dispatched' } : draft
      )
    );
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-sadu-gold/30 pb-4">
        <h1 className="text-2xl font-serif text-slate-800">International Programs & Dispatch Control</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome, Aisha. Review coordinator nominations and dispatch official encrypted institutional invitations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Pane: The Approval Queue */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-medium text-sm text-slate-700 flex justify-between items-center">
            <span>Draft Queue</span>
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
              {drafts.filter(d => d.status === 'pending').length} Pending
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {drafts.map(draft => (
              <button
                key={draft.id}
                onClick={() => setActiveDraftId(draft.id)}
                className={`w-full text-left px-4 py-4 transition-colors hover:bg-slate-50 ${activeDraftId === draft.id ? 'bg-slate-50 border-l-4 border-l-slate-800' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-slate-800">{draft.artistName}</span>
                  {draft.status === 'pending' ? (
                    <Clock className="text-amber-500" size={14}/>
                  ) : (
                    <CheckCircle className="text-emerald-500" size={14}/>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Prepared by: {draft.coordinator}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Pane: The Mail-Merge Preview */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md shadow-sm flex flex-col h-[600px]">
          {activeDraft ? (
            <>
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h2 className="font-medium text-slate-800 flex items-center gap-2">
                    <Eye className="text-slate-400" size={16}/>
                    Invitation Preview
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">System auto-merges Event Data and Coordinator Brief.</p>
                </div>
                <button
                  onClick={() => handleDispatch(activeDraft.id)}
                  disabled={activeDraft.status === 'dispatched'}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeDraft.status === 'dispatched' 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  <Send size={14}/>
                  {activeDraft.status === 'dispatched' ? 'Dispatched' : 'Approve & Dispatch'}
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50">
                <div className="bg-white border border-slate-200 p-8 shadow-sm max-w-2xl mx-auto font-serif text-slate-700 space-y-6">
                  <div className="border-b border-slate-200 pb-4 mb-6">
                    <p className="text-sm font-sans font-medium text-slate-400 uppercase tracking-wider mb-2">Subject</p>
                    <p className="text-lg">Official Invitation: 12th Sharjah Calligraphy Biennial – {activeDraft.artistName}</p>
                  </div>
                  
                  <p>Dear {activeDraft.artistName},</p>
                  <p>On behalf of the Directorate of Cultural Affairs and the Curatorial Committee, it is our distinct honor to officially invite you to participate in <strong>The 12th Sharjah Calligraphy Biennial</strong>.</p>
                  <p>Under this year’s curatorial theme, <em>{activeDraft.theme}</em>, the Committee has closely followed your practice. <strong>{activeDraft.brief}</strong></p>
                  <p>To ensure the highest level of security for your personal data and to streamline your exhibition logistics, our institution utilizes the <strong>System for Arts Data Unification (SADU)</strong>. Please access your secure onboarding workspace here:</p>
                  
                  <div className="bg-slate-100 p-4 text-center rounded border border-slate-200 font-sans">
                    <span className="text-blue-600 font-medium break-all">
                      [https://sadu.sharjah.gov.ae/onboard/](https://sadu.sharjah.gov.ae/onboard/){activeDraft.id.toLowerCase()}-secure-token
                    </span>
                  </div>

                  <p>Your dedicated Exhibition Coordinator, <strong>{activeDraft.coordinator}</strong>, will be your primary liaison throughout this journey.</p>
                  <p>Sincerely,</p>
                  <div className="pt-4">
                    <p className="font-bold">Directorate of Cultural Affairs</p>
                    <p className="text-sm text-slate-500 font-sans">Sharjah Department of Culture</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Select a draft from the queue to preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
