export type BilateralContractStatus =
  | 'NOT_DRAFTED'
  | 'DRAFT'
  | 'SENT_TO_ARTIST'
  | 'CONTRACT_DISPUTED'
  | 'AMENDMENT_UNDER_REVIEW' // Added state
  | 'ARTIST_APPROVED'
  | 'LOCKED'; // Moves to Stage 7 Finance

export interface NegotiationRound {
  id: string;
  requestedAt: string;
  disputedCategory: 'PRODUCTION_GRANT' | 'SHIPPING_TERMS' | 'INSTALLATION_DATES' | 'OTHER';
  artistJustification: string;
  coordinatorResolutionNotes?: string;
  resolvedAt?: string;
}

export interface TrancheSchedule {
  advancePercentage: number;
  advanceAmount: number;
  advanceStatus: 'PENDING' | 'DISBURSED';
  advanceDisbursedAt?: string;
  advanceVoucherRef?: string;

  deliveryPercentage: number;
  deliveryAmount: number;
  deliveryStatus: 'PENDING' | 'DISBURSED';
  deliveryDisbursedAt?: string;
  deliveryVoucherRef?: string;

  installationPercentage: number;
  installationAmount: number;
  installationStatus: 'PENDING' | 'DISBURSED';
  installationDisbursedAt?: string;
  installationVoucherRef?: string;
}

export interface ArtistDocumentIntake {
  passportFileName?: string;
  passportStatus: 'NOT_UPLOADED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  passportUploadedAt?: string;
  passportVerifiedAt?: string;
  passportNotes?: string;

  highResArtworkFileName?: string;
  artworkDpi: number;
  highResStatus: 'NOT_UPLOADED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  highResUploadedAt?: string;
  highResVerifiedAt?: string;
  highResNotes?: string;

  catalogBioArabic?: string;
  catalogBioEnglish?: string;
  catalogBioStatus: 'DRAFT' | 'SUBMITTED' | 'VERIFIED';
}

export interface BilateralContract {
  id: string;
  artistId: string;
  artistName: string;
  artistCategory: 'Emerging' | 'Established';
  nationality: string;
  medium: string;
  proposedWorkTitle: string;
  productionCost: number;
  shippingTerms: string;
  cancellationClauseMandatory: boolean;
  status: BilateralContractStatus;
  tranches: TrancheSchedule;
  documents: ArtistDocumentIntake;
  draftedAt?: string;
  sentAt?: string;
  signedAt?: string;
  signatureReference?: string;
  auditTrail: NegotiationRound[]; // Replaces amendmentNotes
}

export interface DisbursementRecord {
  id: string;
  contractId: string;
  voucherRef: string;
  artistName: string;
  trancheType: 'Advance (30%)' | 'Delivery (40%)' | 'Installation (30%)';
  amount: number;
  disbursedAt: string;
  paymentMethod: string;
}
