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
