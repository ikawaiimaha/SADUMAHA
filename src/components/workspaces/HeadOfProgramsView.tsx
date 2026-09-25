import React, { useState } from 'react';
import { Mail, Send, Users, Clock, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { useGovernance } from '../../context/GovernanceContext';

const APPROVED_EVENT_NAME = '12th Sharjah Calligraphy Biennial';
const OFFICIAL_CURATORIAL_MATERIAL = 'This edition invites artists to explore the Chairman-approved theme through the interplay of script, space and silence, honoring the calligraphic tradition while inviting contemporary material experimentation.';

interface CommitteePresentation {
  id: string;
  artistName: string;
  summary: string;
  routed: boolean;
}

const MOCK_PRESENTATIONS: CommitteePresentation[] = [
  { id: 'CP-001', artistName: 'Youssef Nabhan', summary: '3 Artworks Submitted', routed: false },
  { id: 'CP-002', artistName: 'Noura Al-Mazrouei', summary: '2 Artworks Submitted', routed: false },
  { id: 'CP-003', artistName: 'Fatima Al Suwaidi', summary: '5 Artworks Submitted', routed: false }
];

interface DispatchLogEntry {
  id: string;
  nominationId?: string;
  artistName: string;
  artistEmail: string;
  eventName: string;
  theme: string;
  status: 'awaiting' | 'accepted';
  coordinator?: string;
  dispatchedAt: string;
}

const MOCK_DISPATCH_LOG: DispatchLogEntry[] = [
  {
    id: 'DL-001',
    artistName: 'Youssef Nabhan',
    artistEmail: 'y.nabhan@studio.art',
    eventName: '12th Sharjah Calligraphy Biennial',
    theme: 'Balance',
    status: 'awaiting',
    dispatchedAt: '2 days ago'
  },
  {
    id: 'DL-002',
    artistName: 'Noura Al-Mazrouei',
    artistEmail: 'noura.m@design.ae',
    eventName: '12th Sharjah Calligraphy Biennial',
    theme: 'Balance',
    status: 'accepted',
    coordinator: 'Maha',
    dispatchedAt: '5 days ago'
  }
];

export const HeadOfProgramsView: React.FC = () => {
  const { nominations, approvedTheme, markInvitationAccepted } = useGovernance();
  const readyForDispatch = nominations.filter(nom => nom.approvalStatus === 'APPROVED_FOR_DISPATCH');
  const [activeTab, setActiveTab] = useState<'dispatch' | 'committee'>('dispatch');
  const [presentations, setPresentations] = useState<CommitteePresentation[]>(MOCK_PRESENTATIONS);
  const [log, setLog] = useState<DispatchLogEntry[]>(MOCK_DISPATCH_LOG);

  const [artistName, setArtistName] = useState('');
  const [artistEmail, setArtistEmail] = useState('');
  const [brief, setBrief] = useState('');
  const [selectedNominationId, setSelectedNominationId] = useState<string | undefined>(undefined);

  const handleRouteToCommittee = (id: string) => {
    setPresentations(current =>
      current.map(item =>
        item.id === id ? { ...item, routed: true } : item
      )
    );
  };

  const handleGenerateDispatch = () => {
    if (!artistName.trim() || !artistEmail.trim()) return;
    const entry: DispatchLogEntry = {
      id: `DL-${String(log.length + 1).padStart(3, '0')}`,
      nominationId: selectedNominationId,
      artistName,
      artistEmail,
      eventName: APPROVED_EVENT_NAME,
      theme: approvedTheme?.englishName ?? 'Pending Chairman Approval',
      status: 'awaiting',
      dispatchedAt: 'Just now'
    };
    setLog(current => [entry, ...current]);
    setArtistName('');
    setArtistEmail('');
    setBrief('');
    setSelectedNominationId(undefined);
  };

  const handleMarkAccepted = (entry: DispatchLogEntry) => {
    setLog(current => current.map(item => item.id === entry.id ? { ...item, status: 'accepted', coordinator: item.coordinator ?? 'Maha' } : item));
    if (entry.nominationId) markInvitationAccepted(entry.nominationId);
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-sadu-gold/30 pb-4">
        <h1 className="text-2xl font-serif text-slate-800">International Programs & Dispatch Control</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome, Aisha. Review coordinator nominations and dispatch official encrypted institutional invitations.</p>
      </header>

      <nav className="flex items-center gap-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`pb-3 text-sm transition-colors ${activeTab === 'dispatch' ? 'border-b-2 border-slate-800 font-medium text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Invitation Dispatch
        </button>
        <button
          onClick={() => setActiveTab('committee')}
          className={`pb-3 text-sm transition-colors ${activeTab === 'committee' ? 'border-b-2 border-slate-800 font-medium text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Committee Routing
        </button>
      </nav>

      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Pane: Draft New Invitation */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="font-medium text-slate-800">Draft New Invitation</h2>
              <p className="text-xs text-slate-500 mt-1">Initiate a secure, encrypted onboarding invitation directly to the artist.</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Locked Institutional Context */}
              <div className="rounded-md border border-sadu-gold/60 bg-sadu-linen/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Locked Institutional Context</span>
                  <Lock size={12} className="text-slate-400"/>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Event</span>
                  <span className="text-sm font-medium text-slate-800">{APPROVED_EVENT_NAME}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Approved Theme</span>
                    <Lock size={10} className="text-slate-400"/>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-sm font-medium text-slate-800">{approvedTheme ? approvedTheme.englishName : 'Pending Chairman Approval'}</span>
                    {approvedTheme && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">
                        <ShieldCheck size={10}/>
                        Approved by Chairman of the Department
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Official Curatorial Material</span>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{OFFICIAL_CURATORIAL_MATERIAL}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Drafted by the Preparatory Committee.</p>
                </div>
              </div>

              {readyForDispatch.length > 0 && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Approved for Dispatch</span>
                  {readyForDispatch.map(nom => (
                    <button
                      key={nom.id}
                      type="button"
                      onClick={() => { setArtistName(nom.artistName); setArtistEmail(nom.artistEmail); setSelectedNominationId(nom.id); }}
                      className="w-full flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-xs hover:border-slate-400 transition-colors"
                    >
                      <span className="font-medium text-slate-800">{nom.artistName}</span>
                      <span className="text-slate-400">Use details</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-medium text-slate-600">
                  Artist Name
                  <input
                    type="text"
                    value={artistName}
                    onChange={e => setArtistName(e.target.value)}
                    placeholder="e.g. Youssef Nabhan"
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sadu-gold"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Artist Email
                  <input
                    type="email"
                    value={artistEmail}
                    onChange={e => setArtistEmail(e.target.value)}
                    placeholder="artist@studio.art"
                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sadu-gold"
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-slate-600">
                Specific Artist Request / Brief
                <textarea
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  rows={6}
                  placeholder="Describe what you are specifically asking this artist to submit..."
                  className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sadu-gold resize-none"
                />
              </label>

              <button
                onClick={handleGenerateDispatch}
                disabled={!artistName.trim() || !artistEmail.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                <Mail size={14}/>
                Generate & Dispatch Secure Link
              </button>
            </div>
          </div>

          {/* Right Pane: Dispatch Log & Routing Status */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="font-medium text-slate-800">Dispatch Log & Routing Status</h2>
              <p className="text-xs text-slate-500 mt-1">Recently dispatched institutional invitations.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {log.map(entry => (
                <div key={entry.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-medium text-slate-800 block">{entry.artistName}</span>
                      <span className="text-xs text-slate-500">{entry.dispatchedAt}</span>
                    </div>
                    {entry.status === 'awaiting' ? (
                      <button
                        type="button"
                        onClick={() => handleMarkAccepted(entry)}
                        className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full whitespace-nowrap hover:bg-amber-200 transition-colors"
                      >
                        <Clock size={12}/>
                        Pending Artist Response
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                        <CheckCircle2 size={12}/>
                        Accepted - Routed to Coordinator {entry.coordinator}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'committee' && (
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-medium text-slate-800 flex items-center gap-2">
                <Users className="text-slate-400" size={16}/>
                Pending Committee Presentations
              </h2>
              <p className="text-xs text-slate-500 mt-1">Artist proposals awaiting routing to the Curatorial Committee.</p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start text-xs uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <th className="px-6 py-3 font-medium">Artist</th>
                <th className="px-6 py-3 font-medium">Summary</th>
                <th className="px-6 py-3 font-medium text-end">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {presentations.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-medium text-slate-800">{item.artistName}</td>
                  <td className="px-6 py-4 text-slate-500">{item.artistName} - {item.summary}</td>
                  <td className="px-6 py-4 text-end">
                    <button
                      onClick={() => handleRouteToCommittee(item.id)}
                      disabled={item.routed}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                        item.routed
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      <Send size={14}/>
                      {item.routed ? 'Routed' : 'Route to Committee'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
