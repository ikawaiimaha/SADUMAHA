export type Language = 'en' | 'ar';

export type ExperienceMode = 'story' | 'onboarding' | 'platform';

export type UserRole = 
  | 'COORDINATOR'
  | 'DIRECTORATE'
  | 'COMMITTEE'
  | 'TECHNICAL_MUSEUM'
  | 'PR_PROTOCOL'
  | 'EDITORIAL'
  | 'FINANCE'
  | 'LOGISTICS'
  | 'ARTIST'
  | 'HEAD_OF_PROGRAMS'
  // Arts Square Triad Explicit Roles
  | 'SDC_COORDINATOR'
  | 'SAF_TECHNICIAN'
  | 'SMA_VENUE_ADMIN'
  // Backward-compatibility aliases
  | 'LEADERSHIP'
  | 'TECHNICAL'
  | 'PR_VISA'
  | 'ARCHIVE'
  | 'VENUE_ADMIN';

export type RoleKey = UserRole;

export type DisplayDensity = 'comfortable' | 'compact';

export type WorkspaceTab = 
  | 'overview'
  | 'dossiers'
  | 'approved-scope'
  | 'contracts'
  | 'operations'
  | 'communications'
  | 'archive';

export interface BiennialConfig {
  editionNumber: number;
  year: string;
  themeEn: string;
  themeAr: string;
  primaryColor: string;
}

export type EditorialStatus = 'pending_arabic_proof' | 'pending_english_translation' | 'ready_for_print';

export interface VendorBid {
  id: string;
  vendorName: string;
  vendorNameAr?: string;
  isRegisteredSupplier: boolean; 
  submittedPrice: number; // in AED
  technicalApproval: boolean; 
  technicalNotes?: string;
  category?: 'printing' | 'fabrication' | 'shipping' | 'installation';
  quotationRef?: string;
  submissionDate?: string;
}

export type LpoStatus = 'pending_bids' | 'pending_technical_eval' | 'pending_lpo' | 'lpo_issued';

// Phase 1-4 institutional chain-of-command governance types.
export type EventType = 'FESTIVAL' | 'FORUM';
export type EventStatus = 'SETUP' | 'PENDING_DIRECTORATE_REVIEW' | 'PRESENTED_TO_CHAIRMAN' | 'THEME_LOCKED';

// --- SADU Master Types & State Enums ---

export type ThemeStatus = 
  | 'DRAFT'
  | 'PROPOSED'
  | 'APPROVED'
  | 'PENDING_CHAIRMAN_APPROVAL'
  | 'PENDING_EDITORIAL_POLISH'
  | 'PUBLISHED_OFFICIAL';

export type ArtistStatus = 
  | 'ARCHIVED_CLOSED'
  | 'EXECUTIVE_IMPOUND'
  | 'NOMINATED'
  | 'PENDING_VETTING'
  | 'DIRECTOR_APPROVED'
  | 'DIRECTOR_VETOED'
  | 'CONTRACT_PENDING_SIGNATURE'
  | 'CONTRACT_EXECUTED'
  | 'LOGISTICS_PENDING_PR'
  | 'INCOMPLETE_DOSSIER'
  | 'HIP_BLOCKED'
  | 'PENDING_DIRECTOR_REVIEW'
  | 'CONTRACT_DISPUTED' // Hardening #2: Contract amendment negotiation loop
  | 'AMENDMENT_UNDER_REVIEW' // Active coordinator renegotiation loop
  | 'PHYSICAL_ASSET_RECEIVED'; // Hardening #3: Physical crate sign-off before final finance release

export interface ArtistDossier {
  id: string;
  name: string;
  arabicName: string;
  category: 'Emerging' | 'Established';
  nationality: string;
  medium: string;
  status: ArtistStatus;
  rejectionReason?: string;
  
  // Hardening #1: Dynamic Dossier Schema toggle
  isCommissioned: boolean; 
  cvUrl: string;
  portfolioUrl: string;
  mockupsUrl?: string; // Optional if isCommissioned is false (existing work/masterpiece)
}

/** Local fictional commission only; these gates do not establish institutional authority. */
export interface CommissionEvidence {
  passportVerified: boolean;
  visaCleared: boolean;
  prEvidenceGate: boolean;
  floorLoadVerified: boolean;
  mountingVerified: boolean;
  technicalEvidenceGate: boolean;
  financeApprovalGate: boolean;
  prRecordedAt?: string;
  technicalRecordedAt?: string;
  advanceAuthorizedAt?: string;
}

export interface CommissionState {
  collectionTerms?: import('./data/collectionCloseout').CollectionTerms;
  acquisition?: {status:'ACQUIRED_BY_INSTITUTION';priceUSD:number;at:string;payoutStatus:'PENDING_FINANCE'};
  returnFreight?: {status:'PENDING_RETURN'|'CANCELLED_ACQUISITION'|'CLOSED';address:string;packing:string;at:string;cancelledAt?:string;awb?:File;awbAt?:string};
  archivedAt?:string;

  administration?: import('./data/artistAdministration').ArtistAdministration;
  loanPayment?: {contractId:string;amount:number;reference:string;at:string};
  visaIntakes?: import('./data/visaIntake').VisaIntake[];
  catalogSubmissions?: import('./data/catalogMetadata').CatalogMetadata[];
  conditionReports?: import('./data/conditionReporting').ConditionReport[];
  emergencyRequests?: import('./data/conditionReporting').EmergencyRequest[];
  installationStatus?: ArtistStatus;
  impounds?: import('./data/installationOperations').ExecutiveImpound[];
  fleetTickets?: import('./data/installationOperations').FleetTicket[];
  receiptHistory?: NonNullable<CommissionState['logistics']>[];
  logistics?: { appliesToRevision?: number; isSuperseded?: boolean; status: 'PHYSICAL_ASSET_RECEIVED'; reference: string; receivedAt: string; closedAt?: string; returnReference?: string; reconciliationReference?: string };
  safRequest?: { technicians: number; hours: number; rationale: string; requestedAt: string };
  ledger?: { tranche: 'advance' | 'delivery' | 'completion'; amount: number; at: string; revision: number }[];
  contracts: import('./types/contractStage6').BilateralContract[];
  agreementRevision: number;
  evidence: CommissionEvidence;
}

export interface ContractTerms {
  artistId: string;
  productionGrant: number;
  shippingMethod: 'FINE_ART_COURIER' | 'AIR_FREIGHT' | 'LOCAL_UAE';
  trancheStructure: 'STANDARD_SPLIT' | 'SINGLE_DISBURSAL';
  status: 'DISPATCHED' | 'DISPUTED_BY_ARTIST' | 'SIGNED';
  amendmentNotes?: string;
}

// Single Source of Truth for Stage 6 Bilateral Contracts & Auditing
export * from './types/contractStage6';

export interface DynamicBlocklistRule {
  id: string;
  parameterType: 'NATIONALITY' | 'MEDIUM' | 'ETHICAL_CRITERIA';
  value: string;
  addedBy: string;
  // Hardening #5: Executive oversight flag for HIP modifications
  isDirectorApproved: boolean; 
}

export interface ThemeProposal {
  id: string;
  arabicName: string;
  englishName: string;
  definition: string;
  status: ThemeStatus;
}

export type NominationSource = 'COMMITTEE' | 'COORDINATOR';
export type NominationApprovalStatus = 'DRAFT' | 'PENDING_DIRECTORATE_REVIEW' | 'REVISION_REQUESTED' | 'APPROVED_FOR_DISPATCH' | 'INVITATION_ACCEPTED';
export interface ArtistNomination {
  id: string;
  artistName: string;
  artistEmail: string;
  nominationSource: NominationSource;
  approvalStatus: NominationApprovalStatus;
  directorateNotes: string | null;
  requestedBudget: number | null;
}

export type PaymentStructure = 'FULL_UPFRONT' | 'MILESTONE_SPLIT';

export interface ProcurementPackage {
  id: string;
  code: string;
  titleEn: string;
  titleAr: string;
  category: 'printing' | 'fabrication' | 'shipping';
  scopeDescriptionEn: string;
  scopeDescriptionAr: string;
  linkedArtworkId?: string;
  linkedArtworkTitleEn?: string;
  linkedArtworkTitleAr?: string;
  budgetAllocatedAed: number;
  bids: VendorBid[];
  status: LpoStatus;
  lpoNumber?: string;
  lpoIssueDate?: string;
  issuedVendorId?: string;
  vendorWorkStartedWithoutLpo?: boolean;
}

export interface EditorialItem {
  id: string;
  artistName: string;
  artworkTitleEn: string;
  artworkTitleAr: string;
  mediumEn: string;
  mediumAr: string;
  dimensions: string;
  dimensionsAr?: string;
  year: string;
  status: EditorialStatus;
}

export type ProposalCategory = 
  | 'solo' 
  | 'group' 
  | 'installation' 
  | 'video' 
  | 'site_specific'
  | 'solo_exhibition'
  | 'video_media'
  | 'photography';

export type CulturalTrack = 'AUTHENTIC_TRADITIONAL' | 'MODERN_CONTEMPORARY';

export interface ExhibitionProgramme {
  id: string;
  titleEn: string;
  titleAr: string;
  themeEn: string;
  themeAr: string;
  dates: string;
  venueEn: string;
  venueAr: string;
  status: 'planning' | 'production' | 'installed' | 'concluded';
  budgetPlanned: number;
  budgetCommitted: number;
  budgetSpent: number;
  currency: string;
  progressPercent: number;
  gatesReady: number;
  gatesTotal: number;
  criticalRisks: number;
  unresolvedHandoffs: number;
}

export interface CommitteeRubric {
  alignmentTheme: number; // max 10
  artisticQuality: number; // max 10
  innovation: number; // max 10 (or trackSpecificOne)
  culturalValue: number; // max 10 (or trackSpecificTwo)
  artistProfile: number; // max 5
  exhibitionHistory: number; // max 5
  strategicValue: number; // max 5
  calligraphyRelevance: number; // max 10 (or trackSpecificThree)
}

export interface OperationalRubric {
  completeness: number; // max 10
  technicalFeasibility: number; // max 15
  logisticsFeasibility: number; // max 10
  budgetValue: number; // max 10
}

export interface PRProtocolClearance {
  certificateNameVerified: boolean;
  exhibitionTitleLocked: boolean;
  bioApproved: boolean;
  portraitReceived: boolean;
  nationalityConfirmed: boolean;
  socialMediaLogged: boolean;
  guestListSubmitted: boolean;
}

export interface ApprovalMilestones {
  sdcProposalSentAt?: string;
  safTechnicalPlanSubmittedAt?: string;
  smaVenuePermitIssuedAt?: string;
}

export interface ArtworkRecord {
  id: string;
  canonicalCode: string;
  titleEn: string;
  titleAr: string;
  artistNameEn: string;
  artistNameAr: string;
  isTakreem?: boolean;
  hasPreviousParticipation?: boolean;
  prProtocol?: PRProtocolClearance;
  isPrProtocolReady?: boolean;
  year: string;
  mediumEn: string;
  mediumAr: string;
  category?: ProposalCategory;
  culturalTrack?: CulturalTrack;
  dimensionsCm: string;
  weightKg: number;
  insuranceValueUsd: number;
  locationEn: string;
  locationAr: string;
  conditionStatus: 'pristine' | 'minor_wear' | 'discrepancy_reported' | 'conserved';
  conditionNotesEn: string;
  conditionNotesAr: string;
  installationRequirementsEn: string;
  installationRequirementsAr: string;
  logisticsRequirements?: string;
  avRequirements?: string;
  riskAssessment?: string;
  imageThumbnail: string;
}

export interface AttentionItem {
  id: string;
  titleEn: string;
  titleAr: string;
  artistEn: string;
  artistAr: string;
  isTakreem?: boolean;
  programmeId: string;
  category: 'technical' | 'contract' | 'visa' | 'finance' | 'condition';
  priority: 'critical' | 'high' | 'medium';
  dueDays: number;
  assignedRole: RoleKey;
  status: 'pending' | 'resolved' | 'escalated';
  restrictedToRole?: RoleKey[];
}

export interface MessageRecord {
  id: string;
  senderNameEn: string;
  senderNameAr: string;
  senderRole: RoleKey;
  recipientRole: RoleKey;
  timestamp: string;
  contentEn: string;
  contentAr: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  linkedTaskId?: string;
  isInternalOnly?: boolean;
}

export interface CommitteeReviewSubmission {
  id: string;
  artistNameEn: string;
  artistNameAr: string;
  isTakreem?: boolean;
  category?: ProposalCategory;
  culturalTrack?: CulturalTrack;
  proposalTitleEn: string;
  proposalTitleAr: string;
  conceptStatementEn: string;
  conceptStatementAr: string;
  worksCount: number;
  proposedBudgetUsd: number;
  budgetBreakdown?: {
    production: number;
    artistFee: number;
    travel: number;
    installation: number;
  };
  timeline?: {
    productionStart: string;
    shippingDate: string;
    installationDate: string;
  };
  dynamicRequirements?: {
    avSpecs?: string;
    duration?: string;
    projectionNeeds?: string;
    audioRequirements?: string;
    fileFormat?: string;
    floorLoad?: string;
    assemblyMethod?: string;
    weldingHazards?: string;
    printMethod?: string;
    framingSpecs?: string;
    linearMeters?: string;
    environmentalRequirements?: string;
    specialHandlingInstructions?: string;
    [key: string]: any;
  };
  logisticsRequirements?: string;
  avRequirements?: string;
  riskAssessment?: string;
  scores: {
    artisticMerit: number; 
    culturalRelevance: number; 
    technicalFeasibility?: number; 
  };
  hasPreviousParticipation?: boolean;
  committeeRubric?: CommitteeRubric;
  operationalRubric?: OperationalRubric;
  prProtocol?: PRProtocolClearance;
  isPrProtocolReady?: boolean;
  overallStatus: 'conceptually_approved' | 'approved_with_conditions' | 'under_review' | 'deferred';
  conditionsEn: string[];
  conditionsAr: string[];
  reviewerNotes: {
    reviewerName: string;
    commentEn: string;
    commentAr: string;
    conflictDeclared: boolean;
  }[];
}
