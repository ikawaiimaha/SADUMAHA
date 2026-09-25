import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { ArtistNomination, BilateralContract, NominationSource, ThemeProposal, PaymentStructure } from '../types';

const SEED_THEMES: ThemeProposal[] = [
  { id: 'THEME-01', arabicName: 'التوازن', englishName: 'Balance', definition: 'Exploring the interplay of script, space and silence.', status: 'PROPOSED' },
  { id: 'THEME-02', arabicName: 'الاستمرارية', englishName: 'Continuum', definition: 'Tracing an unbroken line between classical form and contemporary practice.', status: 'PROPOSED' },
  { id: 'THEME-03', arabicName: 'العتبة', englishName: 'Threshold', definition: 'Marking the passage between the written word and lived experience.', status: 'PROPOSED' },
];

const SEED_NOMINATIONS: ArtistNomination[] = [];
const SEED_CONTRACTS: BilateralContract[] = [];

interface GovernanceContextType {
  themes: ThemeProposal[];
  proposeTheme: (input: { arabicName: string; englishName: string; definition: string }) => void;
  approveTheme: (id: string) => void;
  approvedTheme: ThemeProposal | undefined;
  nominations: ArtistNomination[];
  addDraftNomination: (input: { artistName: string; artistEmail: string; nominationSource: NominationSource }) => void;
  submitFinalistsToDirectorate: (ids: string[]) => void;
  approveNomination: (id: string) => void;
  requestRevision: (id: string, note: string) => void;
  markInvitationAccepted: (id: string) => void;
  contracts: BilateralContract[];
  generateContract: (input: { artistId: string; shippingTerms: string; paymentStructure?: PaymentStructure; productionCost: number | null; initialPaymentAmount?: number | null; finalPaymentAmount?: number | null }) => void;
  markContractSigned: (id: string) => void;
  requestMilestoneDisbursement: (id: string) => void;
}

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

export const GovernanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themes, setThemes] = useState<ThemeProposal[]>(SEED_THEMES);
  const [nominations, setNominations] = useState<ArtistNomination[]>(SEED_NOMINATIONS);
  const [contracts, setContracts] = useState<BilateralContract[]>(SEED_CONTRACTS);

  const proposeTheme: GovernanceContextType['proposeTheme'] = (input) => {
    setThemes(current => {
      if (current.length >= 3) return current;
      return [...current, { id: `THEME-${String(current.length + 1).padStart(2, '0')}`, ...input, status: 'PROPOSED' }];
    });
  };

  const approveTheme = (id: string) => {
    setThemes(current => current.map(theme => ({ ...theme, status: theme.id === id ? 'APPROVED' : theme.status })));
  };

  const approvedTheme = themes.find(theme => theme.status === 'APPROVED');

  const addDraftNomination: GovernanceContextType['addDraftNomination'] = (input) => {
    setNominations(current => [
      ...current,
      { id: `NOM-${String(current.length + 1).padStart(3, '0')}`, artistName: input.artistName, artistEmail: input.artistEmail, nominationSource: input.nominationSource, approvalStatus: 'DRAFT', directorateNotes: null, requestedBudget: null },
    ]);
  };

  const submitFinalistsToDirectorate = (ids: string[]) => {
    setNominations(current => current.map(nom => ids.includes(nom.id) ? { ...nom, approvalStatus: 'PENDING_DIRECTORATE_REVIEW' } : nom));
  };

  const approveNomination = (id: string) => {
    setNominations(current => current.map(nom => nom.id === id ? { ...nom, approvalStatus: 'APPROVED_FOR_DISPATCH', directorateNotes: null } : nom));
  };

  const requestRevision = (id: string, note: string) => {
    setNominations(current => current.map(nom => nom.id === id ? { ...nom, approvalStatus: 'REVISION_REQUESTED', directorateNotes: note } : nom));
  };

  const markInvitationAccepted = (id: string) => {
    setNominations(current => current.map(nom => nom.id === id ? { ...nom, approvalStatus: 'INVITATION_ACCEPTED' } : nom));
  };

  const generateContract: GovernanceContextType['generateContract'] = (input) => {
    const artist = nominations.find(n => n.id === input.artistId);
    const prodCost = input.productionCost || 50000;
    setContracts(current => [
      ...current,
      {
        id: `CON-${String(current.length + 1).padStart(3, '0')}`,
        artistId: input.artistId,
        artistName: artist?.artistName || 'Artist Candidate',
        artistCategory: 'Emerging',
        nationality: 'United Arab Emirates',
        medium: 'Classical Calligraphy',
        proposedWorkTitle: 'Commissioned Artwork',
        productionCost: prodCost,
        shippingTerms: input.shippingTerms,
        cancellationClauseMandatory: true,
        status: 'SENT_TO_ARTIST',
        tranches: {
          advancePercentage: 30,
          advanceAmount: Math.round(prodCost * 0.3),
          advanceStatus: 'PENDING',
          deliveryPercentage: 40,
          deliveryAmount: Math.round(prodCost * 0.4),
          deliveryStatus: 'PENDING',
          installationPercentage: 30,
          installationAmount: Math.round(prodCost * 0.3),
          installationStatus: 'PENDING',
        },
        documents: {
          artworkDpi: 300,
          passportStatus: 'NOT_UPLOADED',
          highResStatus: 'NOT_UPLOADED',
          catalogBioStatus: 'DRAFT',
        },
        sentAt: new Date().toISOString(),
        auditTrail: [],
      },
    ]);
  };

  const markContractSigned = (id: string) => {
    setContracts(current => current.map(contract => contract.id === id ? { ...contract, status: 'ARTIST_APPROVED', signedAt: new Date().toISOString().split('T')[0] } : contract));
  };

  const requestMilestoneDisbursement = (id: string) => {
    setContracts(current => current.map(contract => {
      if (contract.id !== id) return contract;
      if (contract.tranches.advanceStatus === 'PENDING') {
        return {
          ...contract,
          tranches: { ...contract.tranches, advanceStatus: 'DISBURSED', advanceDisbursedAt: new Date().toISOString().split('T')[0] },
        };
      }
      if (contract.tranches.deliveryStatus === 'PENDING') {
        return {
          ...contract,
          tranches: { ...contract.tranches, deliveryStatus: 'DISBURSED', deliveryDisbursedAt: new Date().toISOString().split('T')[0] },
        };
      }
      if (contract.tranches.installationStatus === 'PENDING') {
        return {
          ...contract,
          status: 'LOCKED',
          tranches: { ...contract.tranches, installationStatus: 'DISBURSED', installationDisbursedAt: new Date().toISOString().split('T')[0] },
        };
      }
      return contract;
    }));
  };

  const value = useMemo<GovernanceContextType>(() => ({
    themes, proposeTheme, approveTheme, approvedTheme,
    nominations, addDraftNomination, submitFinalistsToDirectorate, approveNomination, requestRevision, markInvitationAccepted,
    contracts, generateContract, markContractSigned, requestMilestoneDisbursement,
  }), [themes, nominations, approvedTheme, contracts]);

  return <GovernanceContext.Provider value={value}>{children}</GovernanceContext.Provider>;
};

export const useGovernance = (): GovernanceContextType => {
  const context = useContext(GovernanceContext);
  if (!context) throw new Error('useGovernance must be used within a GovernanceProvider');
  return context;
};
