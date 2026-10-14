import { useEffect, useReducer, type Dispatch, type SetStateAction } from 'react';
import type { InstitutionalRole } from '../App';
import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
import type { VettedArtist, ContractFormState } from '../components/CoordinatorContractWorkspace';
import type { ThemeItem } from '../components/ChairmanWorkspace';
import type { ThemePolishStatus } from '../components/EditorialWorkspace';
import type { TranslationStatus } from '../components/GeneralCoordinatorWorkspace';
import { COMMISSION, createCommission, commissionReducer, physicalAssetCleared, type CommissionAction } from '../data/commissionScenario';
import { damageHold } from '../data/conditionReporting';
import { agreementPipelineReady } from '../data/workflowEligibility';
import { productionReady } from '../data/logisticsExpansion';
import { validParticipationScope } from '../data/soloInvitation2026';
import type { BilateralContract, NegotiationRound } from '../types/contractStage6';

/**
 * Stages 6–8 of the workbench rehearsal: the bilateral agreement, artist identity and signature,
 * amendments, document intake, and the PR / Technical / physical-asset evidence that gates
 * Finance. State lives in the shared commission reducer; every handler re-checks the acting role,
 * holds and pipeline readiness, so a desk switch never skips a gate.
 */
export function useCommissionContracts({
  activeRole, activeCoordinatorId, nominatedArtists, setNominatedArtists, artists, setArtists,
  themePolishStatus, translationStatus, ratifiedTheme, isIsolatedRehearsalMode,
}: {
  activeRole: InstitutionalRole;
  activeCoordinatorId: string;
  nominatedArtists: NominatedArtistDossier[];
  setNominatedArtists: Dispatch<SetStateAction<NominatedArtistDossier[]>>;
  artists: VettedArtist[];
  setArtists: Dispatch<SetStateAction<VettedArtist[]>>;
  themePolishStatus: ThemePolishStatus;
  translationStatus: TranslationStatus;
  ratifiedTheme: ThemeItem | null;
  isIsolatedRehearsalMode: boolean;
}) {
  const commissionCoordinatorId = nominatedArtists.find(d=>d.id===COMMISSION.id)?.assignedCoordinatorId;
  const [commission, dispatchCommission] = useReducer(commissionReducer, undefined, createCommission);
  const contracts = commission.contracts;
  const resourceEligibleIds = nominatedArtists.filter(d=>d.status==='APPROVED'&&!d.amendments?.some(a=>a.status==='PENDING')&&contracts.some(c=>c.artistId===d.id&&['ARTIST_APPROVED','LOCKED'].includes(c.status))&&!(d.id===COMMISSION.id&&(damageHold(commission)||['EXECUTIVE_IMPOUND','ARCHIVED_CLOSED'].includes(commission.installationStatus??'')))).map(d=>d.id);
  const resourceScopeKeys = Object.fromEntries(contracts.map(c=>[c.artistId,`${c.id}:${commission.agreementRevision}:${nominatedArtists.find(d=>d.id===c.artistId)?.approvalRevision??1}`]));
  useEffect(() => {
    if (commission.installationStatus) setArtists(rows => rows.map(a => a.id === COMMISSION.id ? {...a, status: commission.installationStatus!} : a));
  }, [commission.installationStatus]);
  const setContracts = (update: (previous: BilateralContract[]) => BilateralContract[]) =>
    dispatchCommission({ type: 'contracts', update });

  // Clearance mirrors the reducer's recorded evidence, including revocation on revised terms.
  useEffect(() => {
    setArtists(current => current.map(artist => artist.id === COMMISSION.id
      ? { ...artist, prCleared: commission.evidence.prEvidenceGate, technicalCleared: commission.evidence.technicalEvidenceGate, physicalAssetCleared: physicalAssetCleared(commission) }
      : artist));
  }, [commission.evidence.prEvidenceGate, commission.evidence.technicalEvidenceGate, commission.logistics, commission.conditionReports, commission.agreementRevision]);

  const handleClearPhysicalAsset = (artistId:string, action:CommissionAction) => {
    if(activeRole!=='LOGISTICS'||artistId!==commission.contracts[0]?.artistId||!['receive-crate','verify-arrival'].includes(action.type))return;
    const next=commissionReducer(commission,action);
    if(next===commission)return;
    dispatchCommission(action);
    setArtists(rows=>rows.map(a=>a.id===artistId?{...a,physicalAssetCleared:physicalAssetCleared(next)}:a));
  };

  const handleClearPR = (artistId: string) => {
    if (artistId !== COMMISSION.id || activeRole !== 'PR_PROTOCOL') return;
    const action = { type: 'record-pr', actor: activeRole, at: new Date().toISOString() } as const;
    if (!commissionReducer(commission, action).evidence.prEvidenceGate) return;
    dispatchCommission(action);
    setArtists(current => current.map(artist => artist.id === artistId ? { ...artist, prCleared: true } : artist));
  };

  const handleClearTechnical = (artistId: string) => {
    if (artistId !== COMMISSION.id || activeRole !== 'TECHNICAL') return;
    const action = { type: 'record-technical', actor: activeRole, at: new Date().toISOString() } as const;
    if (!commissionReducer(commission, action).evidence.technicalEvidenceGate) return;
    dispatchCommission(action);
    setArtists(current => current.map(artist => artist.id === artistId ? { ...artist, technicalCleared: true } : artist));
  };

  const handleDispatchContract = (
    artistId: string,
    contractTerms: any,
    shippingTermsArg?: string,
    resolutionNotes?: string
  ) => {
    if (damageHold(commission) || ['ARCHIVED_CLOSED','EXECUTIVE_IMPOUND'].includes(commission.installationStatus ?? '') || !agreementPipelineReady(themePolishStatus, translationStatus, isIsolatedRehearsalMode)) return;
    const terms = contractTerms as ContractFormState;
    if (!['ARTIST','DEPARTMENT'].includes(terms.shippingLiability ?? '') || (!terms.productionOrigin || !productionReady(terms)) || commission.installationStatus === 'EXECUTIVE_IMPOUND') return;
    const approvedDossier = nominatedArtists.find(d => d.id === artistId);
    if (!approvedDossier || approvedDossier.status !== 'APPROVED' || approvedDossier.assignedCoordinatorId !== activeCoordinatorId || approvedDossier.amendments?.some(a => a.status === 'PENDING') || approvedDossier.artworkCount !== terms.artworkCount) return;
    if (artistId !== COMMISSION.id || activeRole !== 'COORDINATOR' || activeCoordinatorId !== commissionCoordinatorId) return;
    if (!validParticipationScope(terms) || terms.participationCategory !== 'SINGLE_WORK') return;
    if (!['DEPARTMENT', 'HOUSE_OF_WISDOM', 'SHARJAH_ART_MUSEUM'].includes(terms.venue) || (terms.venue !== 'DEPARTMENT' && !terms.venueClearanceReference?.trim()) || commission.ledger?.length) return;
    const percentages = [terms.advancePercentage, terms.interimPercentage, terms.finalPercentage];
    if (!Number.isFinite(terms.productionGrant) || terms.productionGrant <= 0
      || percentages.some(value => !Number.isFinite(value) || value < 0 || value > 100)
      || Math.abs(percentages.reduce((a, b) => a + b, 0) - 100) > 0.000001) return;
    if (commission.invitation?.status === 'INVITATION_DISPATCHED' || (contracts[0] && !['CONTRACT_DISPUTED','AMENDMENT_UNDER_REVIEW'].includes(contracts[0].status))) return;
    const cleanArtistId = artistId.startsWith('contract-') ? artistId.replace('contract-', '') : artistId;
    const targetArtist =
      artists.find(a => a.id === cleanArtistId || a.id === artistId) ||
      nominatedArtists.find(a => a.id === cleanArtistId || a.id === artistId);

    const isObjectTerms = typeof contractTerms === 'object' && contractTerms !== null;
    const productionCost = isObjectTerms
      ? (contractTerms.productionGrant ?? contractTerms.productionCost ?? 45000)
      : (typeof contractTerms === 'number' ? contractTerms : 45000);
    const advancePct = isObjectTerms ? (contractTerms.advancePercentage ?? 40) : 30;
    const interimPct = isObjectTerms ? (contractTerms.interimPercentage ?? 30) : 40;
    const finalPct = isObjectTerms ? (contractTerms.finalPercentage ?? 30) : 30;
    const shippingMethod = isObjectTerms
      ? (contractTerms.shippingMethod || 'Fine Art Dedicated Freight (Climate Controlled)')
      : (shippingTermsArg || 'Fine Art Dedicated Freight (Climate Controlled)');

    const advanceAmount = Math.round(productionCost * advancePct) / 100;
    const deliveryAmount = Math.round(productionCost * interimPct) / 100;
    const installationAmount = Math.round((productionCost - advanceAmount - deliveryAmount) * 100) / 100;

    {
      const existing = contracts.find(
        c => c.artistId === cleanArtistId || c.id === artistId || c.id === `contract-${cleanArtistId}`
      );

      const contractId = existing?.id || (artistId.startsWith('contract-') ? artistId : `contract-${artistId}`);

      const newContractRecord: any = {
        id: contractId,
        artistId: cleanArtistId,
        artistName: commission.invitation?.legalName || (targetArtist as any)?.name_en || (targetArtist as any)?.artistName || 'Artist',
        artistCategory:
          ((targetArtist as any)?.category === 'ESTABLISHED' || (targetArtist as any)?.artistCategory === 'Established')
            ? 'Established'
            : 'Emerging',
        nationality: approvedDossier.nationality,
        medium: approvedDossier.medium,
        proposedWorkTitle: approvedDossier.proposedWorkTitle,
        themeArabic: themePolishStatus === 'PUBLISHED_OFFICIAL' ? ratifiedTheme?.arabicName : undefined,
        productionCost,
        productionOrigin: terms.productionOrigin,
        localVendorId: terms.localVendorId,
        shippingLiability: terms.shippingLiability,
        shippingTerms: shippingMethod,
        specialConditions: terms.specialConditions,
        crate: terms.crate,
        participationCategory: terms.participationCategory,
        artworkCount: terms.artworkCount,
        invitationSourceId: undefined,
        venue: terms.venue,
        venueClearanceReference: terms.venueClearanceReference,
        cancellationClauseMandatory: true,
        status: 'SENT_TO_ARTIST',
        draftedAt: existing?.draftedAt || new Date().toISOString(),
        sentAt: new Date().toISOString(),
        tranches: {
          advancePercentage: advancePct,
          advanceAmount,
          advanceStatus: existing?.tranches?.advanceStatus || 'PENDING',
          advanceDisbursedAt: existing?.tranches?.advanceDisbursedAt,
          advanceVoucherRef: existing?.tranches?.advanceVoucherRef,
          deliveryPercentage: interimPct,
          deliveryAmount,
          deliveryStatus: existing?.tranches?.deliveryStatus || 'PENDING',
          deliveryDisbursedAt: existing?.tranches?.deliveryDisbursedAt,
          deliveryVoucherRef: existing?.tranches?.deliveryVoucherRef,
          installationPercentage: finalPct,
          installationAmount,
          installationStatus: existing?.tranches?.installationStatus || 'PENDING',
          installationDisbursedAt: existing?.tranches?.installationDisbursedAt,
          installationVoucherRef: existing?.tranches?.installationVoucherRef,
        },
        documents: existing?.documents || {
          passportStatus: 'NOT_UPLOADED',
          artworkDpi: 300,
          highResStatus: 'NOT_UPLOADED',
          catalogBioStatus: 'DRAFT',
        },
        auditTrail: existing?.auditTrail || [],
        terms: contractTerms,
        createdAt: new Date().toISOString(),
      };

      if (existing) {
        setContracts(previous => previous.map(c => c.id === existing.id ? newContractRecord : c));
        setArtists(previous => previous.map(a => a.id === artistId ? {...a,status:'CONTRACT_PENDING_SIGNATURE'} : a));
      } else {
        dispatchCommission({type:'dispatch-invitation',actor:activeRole,pipelineReady:true,id:crypto.randomUUID(),at:new Date().toISOString(),contract:newContractRecord});
      }
    }
    return true;
  };
  useEffect(() => {
    const invitation = commission.invitation;
    if (!invitation) return;
    setArtists(previous => previous.map(a => a.id === invitation.artistId ? {...a,
      name_en:invitation.legalName ?? a.name_en,
      status:'CONTRACT_PENDING_SIGNATURE'} : a));
    if (invitation.legalName) setNominatedArtists(previous => previous.map(d => d.id === invitation.artistId ? {...d,artistName:invitation.legalName!} : d));
  }, [commission.invitation]);
  const handleConfirmIdentity = (legalName:string) => {
    const dossier = nominatedArtists.find(d => d.id === COMMISSION.id);
    if (activeRole !== 'ARTIST' || !commission.invitation || dossier?.status !== 'APPROVED' || dossier.amendments?.some(a=>a.status==='PENDING')) return;
    dispatchCommission({type:'confirm-identity',actor:activeRole,invitationId:commission.invitation.id,legalName,at:new Date().toISOString(),
      pipelineReady:agreementPipelineReady(themePolishStatus,translationStatus,isIsolatedRehearsalMode)});
  };
  const handleSignContract = (contractId?: string, signerName?: string) => {
    const target = contracts.find(c => c.id === contractId);
    if (damageHold(commission) || ['ARCHIVED_CLOSED','EXECUTIVE_IMPOUND'].includes(commission.installationStatus ?? '') || activeRole !== 'ARTIST' || !target || target.status !== 'SENT_TO_ARTIST' || signerName !== target.artistName) return;
    setArtists(previous => previous.map(artist => artist.id === target.artistId ? { ...artist, status: 'LOGISTICS_PENDING_PR' } : artist));
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              status: 'ARTIST_APPROVED',
              signedAt: new Date().toISOString().split('T')[0],
              signatureReference: `REF-SCB-EXEC-${Math.floor(1000 + Math.random() * 9000)}`,
            }
          : c
      )
    );
  };

  const handleRequestAmendment = (
    contractId: string,
    category: NegotiationRound['disputedCategory'],
    justification: string,
    proposedGrant?: number
  ) => {
    const target = contracts.find(c => c.id === contractId);
    if (damageHold(commission) || ['ARCHIVED_CLOSED','EXECUTIVE_IMPOUND'].includes(commission.installationStatus ?? '') || activeRole !== 'ARTIST' || !target || target.status !== 'SENT_TO_ARTIST' || !justification.trim() || commission.ledger?.length) return;
    setArtists(rows => rows.map(row => row.id === target.artistId ? {...row, status: 'CONTRACT_DISPUTED'} : row));
    dispatchCommission({ type: 'CONTRACT_DISPUTED', actor: activeRole, contractId,
      round: { id: `neg-${Date.now()}`, contractId, requestedAt: new Date().toISOString(),
        disputedCategory: category, artistJustification: justification, justification,
        proposedValue: proposedGrant, proposedGrant, status: 'PENDING_COORDINATOR_REVIEW' } });
  };

  const handleStartReviewAmendment = (contractId: string) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId && c.status === 'CONTRACT_DISPUTED'
          ? { ...c, status: 'AMENDMENT_UNDER_REVIEW' }
          : c
      )
    );
  };

  const handleUploadPassport = (contractId: string, fileName: string) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              documents: {
                ...c.documents,
                passportFileName: fileName,
                passportStatus: 'SUBMITTED',
                passportUploadedAt: new Date().toISOString(),
              },
            }
          : c
      )
    );
  };

  const handleUploadHighResArtwork = (contractId: string, fileName: string, dpi: number) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              documents: {
                ...c.documents,
                highResArtworkFileName: fileName,
                artworkDpi: dpi,
                highResStatus: 'SUBMITTED',
                highResUploadedAt: new Date().toISOString(),
                highResVerifiedAt: undefined,
                highResNotes: undefined,
              },
            }
          : c
      )
    );
  };

  const handleSaveBio = (contractId: string, bioAr: string, bioEn: string) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              documents: {
                ...c.documents,
                catalogBioArabic: bioAr,
                catalogBioEnglish: bioEn,
                catalogBioStatus: 'SUBMITTED',
              },
            }
          : c
      )
    );
  };

  return {
    commission, dispatchCommission, contracts, setContracts, commissionCoordinatorId, resourceEligibleIds, resourceScopeKeys,
    handleClearPhysicalAsset, handleClearPR, handleClearTechnical, handleDispatchContract, handleConfirmIdentity,
    handleSignContract, handleRequestAmendment, handleStartReviewAmendment, handleUploadPassport,
    handleUploadHighResArtwork, handleSaveBio,
  };
}
