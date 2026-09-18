import { Language } from '../types';

export interface Translations {
  common: {
    systemName: string;
    systemSubname: string;
    department: string;
    loading: string;
    close: string;
    cancel: string;
    confirm: string;
    save: string;
    search: string;
    status: string;
    actions: string;
    viewAll: string;
    verified: string;
    pending: string;
    critical: string;
    attention: string;
    export: string;
    auditLog: string;
    overview: string;
    all: string;
    filter: string;
    clear: string;
    details: string;
    active: string;
    completed: string;
    urgent: string;
    inProgress: string;
    back: string;
    next: string;
    printReport: string;
    shortcut: string;
    fastAction: string;
    legalFast: string;
    jumpTo: string;
    jurisdiction: string;
  };
  navigation: {
    commandPalettePlaceholder: string;
    quickSearch: string;
    density: string;
    comfortable: string;
    compact: string;
    storyMode: string;
    architecturalDrawer: string;
    notifications: string;
    menu: string;
    roles: {
      leadership: string;
      coordinator: string;
      committee: string;
      artist: string;
      technical: string;
      finance: string;
      prVisa: string;
      archive: string;
    };
    tabs: {
      overview: string;
      dossiers: string;
      approvedScope: string;
      contracts: string;
      operations: string;
      communications: string;
      archive: string;
    };
  };
  commandPalette: {
    placeholder: string;
    categoryAll: string;
    categoryWorkflows: string;
    categoryWorkspaces: string;
    categoryRoles: string;
    categoryProgrammes: string;
    categoryActions: string;
    shortcutsTitle: string;
    emptyTitle: string;
    emptyDesc: string;
    navigateHint: string;
    selectHint: string;
    filterHint: string;
    workflows: {
      archiveTitle: string;
      archiveSubtitle: string;
      archiveBadge: string;
      newContractTitle: string;
      newContractSubtitle: string;
      newContractBadge: string;
      contractsTitle: string;
      contractsSubtitle: string;
      contractsBadge: string;
      scopeTitle: string;
      scopeSubtitle: string;
      scopeBadge: string;
      dossiersTitle: string;
      dossiersSubtitle: string;
      dossiersBadge: string;
      operationsTitle: string;
      operationsSubtitle: string;
      operationsBadge: string;
      communicationsTitle: string;
      communicationsSubtitle: string;
      communicationsBadge: string;
      toggleLangTitle: string;
      toggleLangSubtitle: string;
      exportPdfTitle: string;
      exportPdfSubtitle: string;
      exportPdfBadge: string;
    };
    actions: {
      storyTitle: string;
      storySubtitle: string;
      presenterTitle: string;
      presenterSubtitle: string;
      personasTitle: string;
      personasSubtitle: string;
      densityTitle: string;
      densitySubtitle: string;
    };
  };
  contracts: {
    modalTitle: string;
    modalBadge: string;
    institutionalTag: string;
    targetProgrammeLabel: string;
    step1Title: string;
    step2Title: string;
    step3Title: string;
    artistLabel: string;
    artworkAnchorLabel: string;
    totalHonorariumLabel: string;
    advanceHoldLabel: string;
    advanceOption20: string;
    advanceOption30: string;
    advanceOption50: string;
    section4Title: string;
    section4Desc: string;
    gateMilestone2Title: string;
    gateMilestone2Desc: string;
    validationNotice: string;
    cancelBtn: string;
    submitBtn: string;
    submittingBtn: string;
    successTitle: string;
    successDesc: string;
    firstPartyLabel: string;
    secondPartyLabel: string;
    initialStateLabel: string;
    initialStateVal: string;
    jumpToLedgerBtn: string;
    types: {
      master: { title: string; desc: string; codePrefix: string };
      schedule: { title: string; desc: string; codePrefix: string };
      covenant: { title: string; desc: string; codePrefix: string };
      milestone: { title: string; desc: string; codePrefix: string };
      logistics: { title: string; desc: string; codePrefix: string };
    };
  };
  coordinator: {
    title: string;
    subtitle: string;
    deskBadge: string;
    filterLabel: string;
    statusFilterLabel: string;
    totalItemsLabel: string;
    totalItemsSubtitle: string;
    atRiskLabel: string;
    atRiskSubtitle: string;
    inProgressLabel: string;
    inProgressSubtitle: string;
    completedLabel: string;
    completedSubtitle: string;
    evidenceScoreLabel: string;
    evidenceScoreSubtitle: string;
    filters: {
      all: string;
      technical: string;
      contract: string;
      visa: string;
      finance: string;
      condition: string;
    };
    statusFilters: {
      all: string;
      atRisk: string;
      inProgress: string;
      completed: string;
    };
    actionNewContract: string;
    actionExportPdf: string;
    actionDispatch: string;
    actionEscalate: string;
    actionResolve: string;
    itemDetails: string;
    responsibleParty: string;
    targetMilestone: string;
    emptyItemsTitle: string;
    emptyItemsDesc: string;
    controlHeroBadge: string;
    controlHeroSubtitle: string;
    officialMessagingBtn: string;
    approvedScopeBtn: string;
    kpiBenchmarksTitle: string;
    inScopeSuffix: string;
    downloadReportBtn: string;
    downloadReportTitle: string;
    printPreviewBtn: string;
    printPreviewTitle: string;
    activeStatusFilterLabel: string;
    clearStatusFilterBtn: string;
    attentionQueueTitle: string;
    attentionQueueSubtitle: string;
    artistLabel: string;
    dueInDays: string;
    markResolved: string;
    escalate: string;
    resolvedInLedger: string;
    resetAllFilters: string;
    assignedDossiersTitle: string;
    assignedDossiersSubtitle: string;
    scopeBtn: string;
    toastReportDownloaded: string;
    toastResolvedPrefix: string;
    toastEscalatedPrefix: string;
    generatedByTitle: string;
  };
  leadership: {
    portfolioRadar: string;
    executiveDesk: string;
    evidenceScoreM01: string;
    activeExceptions: string;
    totalPlanned: string;
    contractualCommitments: string;
    readinessGates: string;
    strategicBottlenecks: string;
    programmeMatrix: string;
    programmeMatrixSubtitle: string;
    engineeringEscalation: string;
    governanceContract: string;
    personaSuiteTitle: string;
    personaSuiteSubtitle: string;
    antiBypassTitle: string;
    antiBypassSubtitle: string;
    simulateBypass: string;
    delegationMatrixTitle: string;
    rippleSimulatorTitle: string;
  };
  operations: {
    title: string;
    subtitle: string;
    engineeringChecks: string;
    freightCustoms: string;
    installationReadiness: string;
    conservationLedger: string;
    floorLoadLabel: string;
    customsClearanceLabel: string;
    travelTokensLabel: string;
    ibanValidationLabel: string;
  };
  archive: {
    sovereignTitle: string;
    sovereignSubtitle: string;
    centuryPreservation: string;
    immutableHash: string;
    manifestVerification: string;
    closeoutManifestPoints: string;
    tamperAuditTitle: string;
    sealCertificateTitle: string;
  };
  communications: {
    title: string;
    subtitle: string;
    attributableGateway: string;
    tamperEvidentNotice: string;
    newMessage: string;
    recipientLabel: string;
    subjectLabel: string;
    sendButton: string;
  };
  dossiers: {
    title: string;
    subtitle: string;
    anonymizedReview: string;
    juryEvaluationRubrics: string;
    conflictDisclosures: string;
    bindingConditions: string;
  };
  ui?: {
    navigation?: {
      dashboard?: string;
      dossiers?: string;
      approvedScope?: string;
      contracts?: string;
      operations?: string;
      communications?: string;
      archive?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

export const LOCALES: Record<Language, Translations> = {
  en: {
    common: {
      systemName: 'SADU',
      systemSubname: 'System for Arts Data Unification',
      department: 'Sharjah Department of Culture',
      loading: 'Loading...',
      close: 'Close',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      search: 'Search...',
      status: 'Status',
      actions: 'Actions',
      viewAll: 'View All',
      verified: 'Verified',
      pending: 'Pending',
      critical: 'Critical',
      attention: 'Attention Required',
      export: 'Export Manifest',
      auditLog: 'Audit Trail',
      overview: 'Overview',
      all: 'All',
      filter: 'Filter',
      clear: 'Clear',
      details: 'Details',
      active: 'Active',
      completed: 'Completed',
      urgent: 'Urgent',
      inProgress: 'In Progress',
      back: 'Back',
      next: 'Next',
      printReport: 'Print Report',
      shortcut: 'Shortcut',
      fastAction: 'Institutional Fast Action',
      legalFast: 'Legal Fast Action',
      jumpTo: 'Jump to',
      jurisdiction: 'United Arab Emirates · Government of Sharjah',
    },
    navigation: {
      commandPalettePlaceholder: 'Search dossiers, programmes, actions, or jump to role (⌘K)...',
      quickSearch: 'Quick Command',
      density: 'Display Density',
      comfortable: 'Comfortable',
      compact: 'Compact',
      storyMode: 'Story Mode',
      architecturalDrawer: 'Architectural Notes',
      notifications: 'Alerts & Handoffs',
      menu: 'Menu',
      roles: {
        leadership: 'Leadership & Oversight',
        coordinator: 'Control Room Coordinator',
        committee: 'Selection Committee',
        artist: 'Artist & Studio Portal',
        technical: 'Technical & Installation',
        finance: 'Finance & Contracts',
        prVisa: 'PR, Visa & Hospitality',
        archive: 'Permanent Sovereign Archive',
      },
      tabs: {
        overview: 'Leadership Radar',
        dossiers: 'Curatorial Dossiers',
        approvedScope: 'Approved Scope (Frozen)',
        contracts: 'Contracts & Legal',
        operations: 'Operations & Logistics',
        communications: 'Communications Evidence',
        archive: 'Sovereign Archive',
      },
    },
    commandPalette: {
      placeholder: 'Search or trigger shortcuts (e.g. ⌥A for Archive, ⌥N for New Contract, ⌥C for Contracts)...',
      categoryAll: 'All',
      categoryWorkflows: 'Fast Workflows (⌥)',
      categoryWorkspaces: 'Workspaces',
      categoryRoles: 'Roles',
      categoryProgrammes: 'Exhibitions',
      categoryActions: 'Actions',
      shortcutsTitle: 'Shortcuts:',
      emptyTitle: 'No matching items found',
      emptyDesc: 'Try searching for "archive", "contract", "operations", or use the Alt shortcuts.',
      navigateHint: 'Navigate',
      selectHint: 'Select',
      filterHint: 'Filter',
      workflows: {
        archiveTitle: 'Jump to Sovereign Archive & Institutional Memory',
        archiveSubtitle: '10-point cryptographic closeout manifest, tamper audit & seal certificate',
        archiveBadge: 'Fast Jump',
        newContractTitle: 'New Contract Request (Form 1B Bilateral Covenants)',
        newContractSubtitle: 'Initiate bilateral covenants with Section 4 exclusion and milestone honorarium gates',
        newContractBadge: 'Legal Fast',
        contractsTitle: 'Jump to Bilateral Exhibition Contracts & Execution',
        contractsSubtitle: 'Direct jump to bilateral agreement terms, milestone holds & Directorate countersign',
        contractsBadge: 'Contracts',
        scopeTitle: 'Jump to Approved Scope Register (Revision v1.2)',
        scopeSubtitle: 'Frozen artwork specifications, weight/dimensions & Section 4 exclusion ledger',
        scopeBadge: 'Scope',
        dossiersTitle: 'Jump to Curatorial Selection Dossiers & Jury Sessions',
        dossiersSubtitle: 'Anonymized dossiers, conflict disclosures & binding committee approval conditions',
        dossiersBadge: 'Jury',
        operationsTitle: 'Jump to Specialist Field Operations & Gate Ledger',
        operationsSubtitle: 'Structural engineering floor loads, customs unpack, travel tokens & IBAN gates',
        operationsBadge: 'Gates',
        communicationsTitle: 'Jump to Official Attributable Communication Gateway',
        communicationsSubtitle: 'Authoritative thread between coordinator and artist with tamper-evident audit',
        communicationsBadge: 'Gateway',
        toggleLangTitle: 'Toggle Language to Arabic (العربية)',
        toggleLangSubtitle: 'Instant full bilingual UI switch with typography pairing and RTL flow',
        exportPdfTitle: 'Download Clean Institutional Report (PDF)',
        exportPdfSubtitle: 'Institutional-grade PDF formatted for Sharjah Department of Culture records',
        exportPdfBadge: 'Report',
      },
      actions: {
        storyTitle: 'Open Interactive Institutional Story Presentation',
        storySubtitle: '8-chapter walkthrough: cultural continuity, audit dilemma & architecture',
        presenterTitle: 'Open Presenter Architecture & Audit Drawer',
        presenterSubtitle: 'Architectural canon, audit matrix M01-M08, and RACI governance',
        personasTitle: 'Open 3-Tier Leadership Persona Evaluation & Audit',
        personasSubtitle: 'Visionary, Executive, and Director lenses with live Ripple Effect Simulator',
        densityTitle: 'Toggle Display Density (Comfortable / Compact)',
        densitySubtitle: 'Optimized data density for archival desks and dense tabular analysis',
      },
    },
    contracts: {
      modalTitle: 'New Bilateral Contract Instrument Request',
      modalBadge: 'Institutional Fast Action · Shortcut ⌥N',
      institutionalTag: 'SADU-LEGAL-v1.2',
      targetProgrammeLabel: 'Target Exhibition Programme',
      step1Title: '1. Select Contract Instrument Type:',
      step2Title: '2. Participating Artist (Second Party):',
      step3Title: '3. Fiscal Terms & Milestone Holds:',
      artistLabel: 'Participating Artist (Second Party):',
      artworkAnchorLabel: 'Anchor Artwork from Form 1(B):',
      totalHonorariumLabel: 'Total Honorarium / Commission',
      advanceHoldLabel: 'Advance Payment Hold (Milestone 1)',
      advanceOption20: '20% Upon Form 1(B) Bilateral Signing',
      advanceOption30: '30% Upon Form 1(B) Bilateral Signing (Default)',
      advanceOption50: '50% Advance with Directorate Board Exception',
      section4Title: 'Section 4: Curatorial Right of Exclusion',
      section4Desc: 'Department reserves unilateral exclusion rights for safety or curatorial non-compliance.',
      gateMilestone2Title: 'Gate Milestone 2 to Committee Condition Clearance',
      gateMilestone2Desc: 'Milestone 2 release gated until structural engineering and patina clearance.',
      validationNotice: 'Directorate of Cultural Affairs Validated',
      cancelBtn: 'Cancel',
      submitBtn: 'Issue Contract Request',
      submittingBtn: 'Registering in Ledger...',
      successTitle: 'Contract Instrument Registered in Ledger',
      successDesc: 'The agreement has been registered in the bilateral execution pipeline, anchored to Scope Revision v1.2.',
      firstPartyLabel: 'First Party:',
      secondPartyLabel: 'Second Party:',
      initialStateLabel: 'Initial State:',
      initialStateVal: 'Draft 1(B) - Legal Review Gated',
      jumpToLedgerBtn: 'Jump to Contracts Register →',
      types: {
        master: {
          title: 'Solo Exhibition Master Participation Agreement',
          desc: 'Full bilateral instrument governing commission, curation, and institutional rights.',
          codePrefix: 'SCB-CTR-2026',
        },
        schedule: {
          title: 'Form 1(B): Approved Artwork Schedule Annex',
          desc: 'Binding dimensional and technical specifications frozen to Approved Scope v1.2.',
          codePrefix: 'SCB-SCH-2026',
        },
        covenant: {
          title: 'Consignment, Bailment & Right of Exclusion Covenant',
          desc: 'Statutory covenant protecting curatorial exclusion and legal custody.',
          codePrefix: 'SCB-COV-2026',
        },
        milestone: {
          title: 'Production Honorarium Milestone Disbursement Covenant',
          desc: 'Gated fiscal release tied directly to engineering and condition verification.',
          codePrefix: 'SCB-HON-2026',
        },
        logistics: {
          title: 'Freight Manifest, Customs Bond & Transit Indemnity',
          desc: 'Cross-border transport manifest with statutory valuation and condition reports.',
          codePrefix: 'SCB-LOG-2026',
        },
      },
    },
    coordinator: {
      title: 'Control Room Coordinator Operations Desk',
      subtitle: 'Authoritative coordination triage: 41 cross-departmental attention items and bilateral handoffs',
      deskBadge: 'Control Desk',
      filterLabel: 'Discipline Filter:',
      statusFilterLabel: 'Lifecycle Status:',
      totalItemsLabel: 'Total Attention Items',
      totalItemsSubtitle: 'Full cycle active',
      atRiskLabel: 'At Risk / Urgent',
      atRiskSubtitle: 'Due ≤ 48h',
      inProgressLabel: 'In Progress / Active',
      inProgressSubtitle: 'Executing on schedule',
      completedLabel: 'Resolved & Signed',
      completedSubtitle: 'Verified in ledger',
      evidenceScoreLabel: 'M01 Evidence Score',
      evidenceScoreSubtitle: 'Sharjah standard ≥ 90%',
      filters: {
        all: 'All Disciplines',
        technical: 'Technical & Engineering',
        contract: 'Contracts & Legal',
        visa: 'PR & Protocol',
        finance: 'Finance & Accounts',
        condition: 'Conservation & Condition',
      },
      statusFilters: {
        all: 'All Statuses',
        atRisk: 'At Risk / Escalated',
        inProgress: 'In Progress',
        completed: 'Resolved',
      },
      actionNewContract: 'Draft Contract (⌥N)',
      actionExportPdf: 'Print Manifest (PDF)',
      actionDispatch: 'Dispatch Official Letter',
      actionEscalate: 'Escalate to Directorate',
      actionResolve: 'Mark Resolved',
      itemDetails: 'Actionable Details',
      responsibleParty: 'Action Officer',
      targetMilestone: 'Gated Milestone',
      emptyItemsTitle: 'No attention items match this filter',
      emptyItemsDesc: 'Try adjusting your discipline or lifecycle filter to inspect active operations.',
      controlHeroBadge: 'Central Control Room — Project Coordinator',
      controlHeroSubtitle: 'Triaging attention records, managing departmental handoffs, and official artist messaging gateway.',
      officialMessagingBtn: 'Official Messaging Gateway',
      approvedScopeBtn: 'Approved Scope (v1.2)',
      kpiBenchmarksTitle: 'Operational Readiness & KPI Benchmarks',
      inScopeSuffix: 'in scope',
      downloadReportBtn: 'Download Report (PDF)',
      downloadReportTitle: 'Download clean printable PDF version of current filtered data',
      printPreviewBtn: 'Print View',
      printPreviewTitle: 'Preview institutional audit document and print view',
      activeStatusFilterLabel: 'Drill-down Status Filter:',
      clearStatusFilterBtn: 'Clear status filter',
      attentionQueueTitle: 'Coordinator Attention & Triage Queue',
      attentionQueueSubtitle: 'Actionable milestones requiring coordinator follow-up, verification, or handoff',
      artistLabel: 'Artist:',
      dueInDays: 'Due in',
      markResolved: 'Mark Resolved',
      escalate: 'Escalate',
      resolvedInLedger: 'Resolved in Ledger',
      resetAllFilters: 'Reset All Filters',
      assignedDossiersTitle: 'Assigned Artist Participation Dossiers',
      assignedDossiersSubtitle: '3 Participating Artists Confirmed',
      scopeBtn: 'Scope',
      toastReportDownloaded: 'Clean printable PDF report generated and downloaded successfully.',
      toastResolvedPrefix: 'Resolved action:',
      toastEscalatedPrefix: 'Escalated to Section Head:',
      generatedByTitle: 'Cultural Affairs Coordinator',
    },
    leadership: {
      portfolioRadar: 'Executive Portfolio Oversight & Strategic Radar',
      executiveDesk: 'Executive Leadership & Governance Desk',
      evidenceScoreM01: 'M01 Evidence Score',
      activeExceptions: 'Active Exceptions',
      totalPlanned: 'Total Portfolio Planned',
      contractualCommitments: 'Contractual Commitments',
      readinessGates: 'Readiness Gates Cleared',
      strategicBottlenecks: 'Strategic Bottlenecks',
      programmeMatrix: 'Institutional Programme Portfolio Matrix',
      programmeMatrixSubtitle: 'Comparison of progress, fiscal commitments, and operational milestones',
      engineeringEscalation: 'Critical Engineering Escalation',
      governanceContract: 'Governance Contract: M01 Evidence Completeness',
      personaSuiteTitle: 'Multi-Tier Institutional Persona Evaluation',
      personaSuiteSubtitle: 'Evaluate SADU UX, data hierarchy, and authority chains through three leadership lenses',
      antiBypassTitle: 'Integrity Test: Anti-Bypass Gate Enforcement Engine',
      antiBypassSubtitle: 'Attempting to bypass curatorial freeze to generate contract',
      simulateBypass: 'Simulate Bypass Attempt',
      delegationMatrixTitle: 'Statutory Authority & Financial Delegation Matrix',
      rippleSimulatorTitle: 'Live Operational Ripple Effect Simulator: 120kg Sculpture Load Check',
    },
    operations: {
      title: 'Technical Operations & Gate Tracker',
      subtitle: 'Real-time monitoring of crating, customs, condition inspection, and floor loads',
      engineeringChecks: 'Engineering & Structural Checks',
      freightCustoms: 'Freight & Climate Staging',
      installationReadiness: 'Installation & Conservation',
      conservationLedger: 'Condition Intake & Conservation Reports',
      floorLoadLabel: 'Floor Load Verification (120 kg/m²)',
      customsClearanceLabel: 'Port Customs Bond & Clearances',
      travelTokensLabel: 'Artist Flight & Travel Tokens',
      ibanValidationLabel: 'IBAN Direct Bank Verification',
    },
    archive: {
      sovereignTitle: 'Sovereign Cultural Memory & Archive',
      sovereignSubtitle: 'Century-long immutable preservation of Sharjah calligraphic and visual art heritage',
      centuryPreservation: 'Century-Long Cultural Preservation',
      immutableHash: 'Cryptographic Custody Hash',
      manifestVerification: 'Verified Institutional Manifest',
      closeoutManifestPoints: '10-Point Sovereign Archive Closeout Manifest',
      tamperAuditTitle: 'Tamper-Evident SHA-256 Checksum Audit',
      sealCertificateTitle: 'Sharjah Department of Culture Seal Certificate',
    },
    communications: {
      title: 'Official Attributable Communication Gateway',
      subtitle: 'Authoritative bilateral thread between coordinator and artist with tamper-evident audit',
      attributableGateway: 'Official Attributable Gateway',
      tamperEvidentNotice: 'All correspondence cryptographically anchored to exhibition dossier ledger.',
      newMessage: 'Draft Institutional Letter',
      recipientLabel: 'Recipient Artist',
      subjectLabel: 'Official Subject',
      sendButton: 'Dispatch Official Letter',
    },
    dossiers: {
      title: 'Curatorial Selection Dossiers & Jury Sessions',
      subtitle: 'Anonymized curatorial dossiers, conflict disclosures, and binding committee approval conditions',
      anonymizedReview: 'Anonymized Curatorial Review',
      juryEvaluationRubrics: 'Institutional Juried Scoring Rubrics',
      conflictDisclosures: 'Integrity & Conflict of Interest Disclosures',
      bindingConditions: 'Binding Committee Approval Conditions',
    },
    ui: {
      navigation: {
        dashboard: 'Leadership Radar',
        dossiers: 'Curatorial Dossiers',
        approvedScope: 'Approved Scope (Frozen)',
        contracts: 'Contracts & Legal',
        operations: 'Operations & Logistics',
        communications: 'Communications Evidence',
        archive: 'Sovereign Archive',
      },
    },
  },
  ar: {
    common: {
      systemName: 'سدو',
      systemSubname: 'نظام توحيد بيانات الفنون والبرامج الثقافية',
      department: 'دائرة الثقافة — الشارقة',
      loading: 'جاري التحميل...',
      close: 'إغلاق',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      save: 'حفظ',
      search: 'بحث...',
      status: 'الحالة',
      actions: 'الإجراءات',
      viewAll: 'عرض الكل',
      verified: 'معتمد وموثق',
      pending: 'قيد المراجعة',
      critical: 'حرج',
      attention: 'يتطلب انتباهاً',
      export: 'تصدير السجل',
      auditLog: 'سجل التدقيق الرقمي',
      overview: 'نظرة عامة',
      all: 'الكل',
      filter: 'تصفية',
      clear: 'مسح',
      details: 'التفاصيل',
      active: 'نشط',
      completed: 'مكتمل',
      urgent: 'عاجل',
      inProgress: 'قيد التنفيذ',
      back: 'رجوع',
      next: 'التالي',
      printReport: 'طباعة التقرير',
      shortcut: 'اختصار',
      fastAction: 'إجراء مؤسسي سريع',
      legalFast: 'إجراء قانوني سريع',
      jumpTo: 'الانتقال إلى',
      jurisdiction: 'دولة الإمارات العربية المتحدة • حكومة الشارقة',
    },
    navigation: {
      commandPalettePlaceholder: 'ابحث في الملفات والبرامج أو انتقل للدور فوراً (⌘K)...',
      quickSearch: 'لوحة الأوامر',
      density: 'كثافة العرض',
      comfortable: 'مريح',
      compact: 'مدمج',
      storyMode: 'القصة المؤسسية',
      architecturalDrawer: 'الشرح المعماري',
      notifications: 'التنبيهات والتسليمات',
      menu: 'القائمة',
      roles: {
        leadership: 'القيادة والإشراف الاستراتيجي',
        coordinator: 'منسق غرفة التحكم',
        committee: 'لجنة الاختيار والتحكيم',
        artist: 'بوابة الفنان والمحترف',
        technical: 'الفريق الفني والتثبيت',
        finance: 'العقود والمالية',
        prVisa: 'العلاقات والتأشيرات والضيافة',
        archive: 'الأرشيف السيادي الدائم',
      },
      tabs: {
        overview: 'رادار القيادة',
        dossiers: 'الملفات الفنية والمقترحات',
        approvedScope: 'النطاق المعتمد (المجمد)',
        contracts: 'العقود والاتفاقيات',
        operations: 'العمليات واللوجستيات',
        communications: 'أدلة المراسلات الرسمية',
        archive: 'الأرشيف السيادي',
      },
    },
    commandPalette: {
      placeholder: 'ابحث أو استخدم الاختصارات السريعة (مثل: ⌥A للأرشيف، ⌥N لعقد جديد، ⌥C للعقود)...',
      categoryAll: 'كافة العناصر',
      categoryWorkflows: 'سير العمل السريع (⌥)',
      categoryWorkspaces: 'المساحات',
      categoryRoles: 'الأدوار',
      categoryProgrammes: 'المعارض',
      categoryActions: 'الإجراءات',
      shortcutsTitle: 'اختصارات سريعة:',
      emptyTitle: 'لم يتم العثور على نتائج مطابقة',
      emptyDesc: 'جرّب البحث بكلمات مثل "أرشيف"، "عقد"، "هندسة"، أو استعمل الاختصارات السريعة.',
      navigateHint: 'تنقل',
      selectHint: 'اختيار',
      filterHint: 'تصفية',
      workflows: {
        archiveTitle: 'القفز السريع إلى الأرشيف والذاكرة المؤسسية الدائمة',
        archiveSubtitle: 'محضر الإغلاق الأرشيفي الدائم المكون من 10 بنود وفحص البصمات الرقمية والختم المعتمد',
        archiveBadge: 'قفز سريع',
        newContractTitle: 'طلب صياغة عقد ثنائي وميثاق ملحق جديد',
        newContractSubtitle: 'بدء إجراءات صياغة عقد المشاركة الفنية وميثاق حق الاستبعاد وجدولة الدفعات',
        newContractBadge: 'إجراء قانوني',
        contractsTitle: 'القفز إلى سجل العقود الثنائية ومسار التوقيع',
        contractsSubtitle: 'انتقال مباشر إلى مسار توثيق العقود وتواقيع الإدارة الثقافية وحجز الدفعات',
        contractsBadge: 'العقود',
        scopeTitle: 'القفز إلى سجل النطاق الفني المعتمد (النسخة v1.2)',
        scopeSubtitle: 'المواصفات الفنية المجمدة وحق الاستبعاد التعاقدي وجداول الأعمال المعتمدة',
        scopeBadge: 'النطاق',
        dossiersTitle: 'القفز إلى ملفات الاختيار والتحكيم الفني ومحاضر اللجنة',
        dossiersSubtitle: 'الملفات المقنعة وإفصاحات النزاهة وشروط اعتماد اللجنة الملزمة',
        dossiersBadge: 'التحكيم',
        operationsTitle: 'القفز إلى العمليات التخصصية الميدانية والتحقق الهندسي',
        operationsSubtitle: 'الأحمال الإنشائية للأرضيات، المعاينة الجمركية، تصاريح السفر، ومطابقة الحسابات',
        operationsBadge: 'بوابات',
        communicationsTitle: 'القفز إلى بوابة المراسلات المؤسسية الرسمية المعتمدة',
        communicationsSubtitle: 'قناة المراسلات المعتمدة بين المنسق والفنان مع التدقيق والربط النظامي',
        communicationsBadge: 'بوابة',
        toggleLangTitle: 'تبديل اللغة المؤسسية إلى الإنجليزية (English)',
        toggleLangSubtitle: 'تبديل فوري ثنائي اللغة مع المحاذاة والخطوط المؤسسية والتناغم البصري',
        exportPdfTitle: 'تصدير وطباعة تقرير السجل المؤسسي (PDF)',
        exportPdfSubtitle: 'تقرير رسمي معتمد ومُهيأ للطباعة والأرشفة الرسمية بدائرة الثقافة',
        exportPdfBadge: 'تقرير',
      },
      actions: {
        storyTitle: 'عرض القصة التأسيسية التفاعلية لنظام سدو',
        storySubtitle: 'عرض من 8 فصول: استمرارية التراث، معضلة البريد، والرؤية الرقمية',
        presenterTitle: 'فتح لوحة الشرح المعماري ومبررات التدقيق',
        presenterSubtitle: 'الكانون المعماري، مصفوفة التدقيق وحوكمة الصلاحيات',
        personasTitle: 'فتح محاكاة تقييم القيادة المؤسسية (الراعي، الرئيس، المدير)',
        personasSubtitle: 'منظار الحاكم ورئيس الدائرة ومدير الإدارة مع محاكي سلاسل الأثر ومصفوفة الصلاحيات',
        densityTitle: 'تبديل كثافة العرض (مريح / مكثف)',
        densitySubtitle: 'ملاءمة مساحات القراءة للمكاتب الأرشيفية والتحليلية',
      },
    },
    contracts: {
      modalTitle: 'طلب صياغة عقد ثنائي وميثاق ملحق',
      modalBadge: 'إجراء مؤسسي سريع · اختصار ⌥N',
      institutionalTag: 'SADU-LEGAL-v1.2',
      targetProgrammeLabel: 'المعرض والبرنامج المستهدف',
      step1Title: '1. نوع الوثيقة التعاقدية أو الملحق:',
      step2Title: '2. الفنان المشارك (الطرف الثاني):',
      step3Title: '3. بنود الصرف المالي والجدولة المرحلية:',
      artistLabel: 'الفنان المشارك (الطرف الثاني):',
      artworkAnchorLabel: 'العمل الفني المربوط بالجدول من النموذج 1 (ب):',
      totalHonorariumLabel: 'المكافأة الفنية الإجمالية',
      advanceHoldLabel: 'نسبة الدفعة المقدمة (المرحلة 1)',
      advanceOption20: '20% عند توقيع ملحق النموذج 1 (ب)',
      advanceOption30: '30% عند توقيع ملحق النموذج 1 (ب) (الافتراضي)',
      advanceOption50: '50% دفعة مقدمة باستثناء من مجلس الإدارة',
      section4Title: 'المادة الرابعة: حق الاستبعاد الصريح',
      section4Desc: 'حق الدائرة الحصري في استبعاد أي عمل يخالف شروط السلامة أو التقييم الفني.',
      gateMilestone2Title: 'ربط صرف الدفعة الثانية باستيفاء شروط اللجنة',
      gateMilestone2Desc: 'حجز الدفعة الثانية حتى اعتماد تقرير فحص حمولة الأرضيات والأكسدة.',
      validationNotice: 'تدقيق نظامي معتمد من إدارة الشؤون الثقافية',
      cancelBtn: 'إلغاء',
      submitBtn: 'قيد وتوليد مسودة العقد',
      submittingBtn: 'جارٍ القيد بالسجل...',
      successTitle: 'تم قيد طلب العقد في السجل المعتمد بنجاح',
      successDesc: 'تم إدراج العقد في مسار الاعتماد الثنائي مع ربطه بالمادة الرابعة لحق الاستبعاد والمواصفات الفنية v1.2.',
      firstPartyLabel: 'الطرف الأول:',
      secondPartyLabel: 'الطرف الثاني:',
      initialStateLabel: 'المرحلة المبدئية:',
      initialStateVal: 'المسودة 1 (ب) - قيد التدقيق القانوني',
      jumpToLedgerBtn: 'الانتقال إلى سجل العقود ←',
      types: {
        master: {
          title: 'عقد المشاركة الفنية الرئيسي بالمعرض الشخصي',
          desc: 'العقد الثنائي الحاكم للتكليف، التقييم الفني، والالتزامات السيادية.',
          codePrefix: 'SCB-CTR-2026',
        },
        schedule: {
          title: 'ملحق جدول الأعمال الفنية المعتمدة نموذج 1 (ب)',
          desc: 'المواصفات الفنية والهندسية المجمدة والمربوطة بالنطاق المعتمد v1.2.',
          codePrefix: 'SCB-SCH-2026',
        },
        covenant: {
          title: 'ميثاق الأمانة والإعارة وحق الاستبعاد النظامي',
          desc: 'الميثاق النظامي لحق الاستبعاد الفني وحفظ الحيازة والأمانة.',
          codePrefix: 'SCB-COV-2026',
        },
        milestone: {
          title: 'اتفاقية صرف الدفعة الإنتاجية للمكافأة الفنية',
          desc: 'صرف مالي مرحلي مشروط باستيفاء بوابات الاعتماد الهندسي والتحكيمي.',
          codePrefix: 'SCB-HON-2026',
        },
        logistics: {
          title: 'بوليصة الشحن الجوي والضمان الجمركي والتأمين',
          desc: 'بيان النقل الجوي الدولي المعتمد مع تقارير المعاينة والتأمين.',
          codePrefix: 'SCB-LOG-2026',
        },
      },
    },
    coordinator: {
      title: 'مكتب عمليات منسق غرفة التحكم',
      subtitle: 'فرز وتنسيق العمليات الميدانية: متابعة 41 بند انتباه مشترك بين الأقسام والتسليم الثنائي',
      deskBadge: 'مكتب التحكم',
      filterLabel: 'تصفية حسب التخصص:',
      statusFilterLabel: 'حالة دورة العمل:',
      totalItemsLabel: 'إجمالي بنود المتابعة',
      totalItemsSubtitle: 'دورة المبادرة كاملة',
      atRiskLabel: 'عناصر تحت الخطر / عاجل',
      atRiskSubtitle: 'خلال 48 ساعة',
      inProgressLabel: 'قيد المتابعة والتنفيذ',
      inProgressSubtitle: 'يسير وفق الجدول الزمني',
      completedLabel: 'تم الحل والاعتماد',
      completedSubtitle: 'موثق في السجل',
      evidenceScoreLabel: 'مؤشر اكتمال الأدلة M01',
      evidenceScoreSubtitle: 'المعيار المعتمد بالشارقة ≥ 90%',
      filters: {
        all: 'كافة التخصصات',
        technical: 'الهندسة والتركيب الفني',
        contract: 'العقود والشؤون القانونية',
        visa: 'العلاقات العامة والبروتوكول',
        finance: 'المالية والحسابات',
        condition: 'المعاينة والترميم وحفظ العمل',
      },
      statusFilters: {
        all: 'كافة الحالات',
        atRisk: 'تحت الخطر / مُصعّد',
        inProgress: 'قيد التنفيذ',
        completed: 'تم الإنجاز',
      },
      actionNewContract: 'صياغة عقد (⌥N)',
      actionExportPdf: 'طباعة البيان (PDF)',
      actionDispatch: 'إرسال خطاب رسمي',
      actionEscalate: 'تصعيد إلى الإدارة',
      actionResolve: 'اعتماد الحل',
      itemDetails: 'تفاصيل الإجراء المطلوب',
      responsibleParty: 'المسؤول المباشر',
      targetMilestone: 'بوابة الإنجاز المستهدفة',
      emptyItemsTitle: 'لا توجد بنود مطابقة لهذه التصفية',
      emptyItemsDesc: 'جرّب تعديل تصفية التخصص أو حالة الإنجاز لعرض العمليات النشطة.',
      controlHeroBadge: 'غرفة التحكم المركزية — منسق الشؤون الثقافية',
      controlHeroSubtitle: 'إدارة بنود الانتباه، فرز الأولويات حسب الحالة، وبوابة المراسلة الرسمية مع الفنانين.',
      officialMessagingBtn: 'بوابة المراسلات الرسمية',
      approvedScopeBtn: 'النطاق المعتمد (v1.2)',
      kpiBenchmarksTitle: 'مؤشرات الأداء والجاهزية التشغيلية (KPIs)',
      inScopeSuffix: 'بنداً ضمن نطاق التصفية',
      downloadReportBtn: 'تنزيل التقرير (PDF)',
      downloadReportTitle: 'تنزيل فوري لتقرير PDF للبيانات المفلترة الحالية',
      printPreviewBtn: 'معاينة وطباعة',
      printPreviewTitle: 'معاينة المستند المؤسسي والطباعة',
      activeStatusFilterLabel: 'تصفية الحالة النشطة:',
      clearStatusFilterBtn: 'إلغاء تصفية الحالة',
      attentionQueueTitle: 'طابور المتابعة وفرز الأولويات (سجلات الانتباه)',
      attentionQueueSubtitle: 'بنود حيوية تتطلب التنسيق مع الفنان أو الأقسام الهندسية والمالية',
      artistLabel: 'الفنان:',
      dueInDays: 'خلال',
      markResolved: 'تأكيد التسوية',
      escalate: 'تصعيد',
      resolvedInLedger: 'تمت التسوية بنجاح',
      resetAllFilters: 'إعادة ضبط كافة المرشحات',
      assignedDossiersTitle: 'المشاركات الفنية الخاضعة للإشراف',
      assignedDossiersSubtitle: 'سجلات معتمدة ومربوطة بالنطاق',
      scopeBtn: 'النطاق',
      toastReportDownloaded: 'تم توليد وتنزيل تقرير المؤشرات التنفيذي (PDF) بنجاح',
      toastResolvedPrefix: 'تمت تسوية الإجراء:',
      toastEscalatedPrefix: 'تم تصعيد البند للإشراف:',
      generatedByTitle: 'منسق الشؤون الفنية والمبادرات',
    },
    leadership: {
      portfolioRadar: 'رادار الإشراف الاستراتيجي والمحافظ الثقافية',
      executiveDesk: 'منظور القيادة والحوكمة المؤسسية',
      evidenceScoreM01: 'مؤشر اكتمال الأدلة M01',
      activeExceptions: 'الاستثناءات النشطة',
      totalPlanned: 'الميزانية الإجمالية المعتمدة',
      contractualCommitments: 'الالتزامات التعاقدية المثبتة',
      readinessGates: 'بوابات الجاهزية المكتملة',
      strategicBottlenecks: 'حالات تعارض أو مخاطر استراتيجية',
      programmeMatrix: 'مصفوفة البرامج والمعارض المعتمدة',
      programmeMatrixSubtitle: 'مقارنة دقيقة بين نسب الإنجاز، الصرف الفعلي، وجاهزية البوابات',
      engineeringEscalation: 'استثناء هندسي يستوجب البت المؤسسي',
      governanceContract: 'عقد القياس المؤسسي: مؤشر اكتمال الأدلة M01',
      personaSuiteTitle: 'محاكاة التقييم المؤسسي متعدد المستويات',
      personaSuiteSubtitle: 'اختبار واجهة سدو وتماسك بياناتها من منظور الراعي المؤسسي، الرئيس، ومدير الإدارة',
      antiBypassTitle: 'اختبار النزاهة: محاكي حظر الالتفاف على الصلاحيات',
      antiBypassSubtitle: 'محاولة تجاوز ختم النطاق وإصدار عقد فوري',
      simulateBypass: '⚡ اختبار محاولة الالتفاف',
      delegationMatrixTitle: 'مصفوفة الصلاحيات والتفويض المالي المعتمدة (دائرة الثقافة)',
      rippleSimulatorTitle: 'محاكي سلاسل الأثر العملياتية (تأخير حمولة العمل النحتي 120 كجم)',
    },
    operations: {
      title: 'سجل العمليات وبوابات الجاهزية الفنية',
      subtitle: 'متابعة حية لصناديق الشحن، الإفراج الجمركي، فحص الحالة الإنشائية، وأحمال الأرضيات',
      engineeringChecks: 'الفحوصات الهندسية والإشراف الإنشائي',
      freightCustoms: 'الشحن والتخزين المبرد',
      installationReadiness: 'التثبيت وحفظ الأعمال',
      conservationLedger: 'محاضر الاستلام والمعاينة والترميم',
      floorLoadLabel: 'التحقق من حمولة الأرضية (120 كجم/م²)',
      customsClearanceLabel: 'الضمان والإفراج الجمركي للميناء',
      travelTokensLabel: 'حجوزات وتذاكر سفر الفنانين',
      ibanValidationLabel: 'المطابقة المباشرة للحساب البنكي (IBAN)',
    },
    archive: {
      sovereignTitle: 'سجل الذاكرة الثقافية والأرشيف السيادي',
      sovereignSubtitle: 'حفظ دائم وموثق لإرث الشارقة في فنون الخط العربي والفنون البصرية لأجيال قادمة',
      centuryPreservation: 'الحفظ الثقافي المئوي الممتد',
      immutableHash: 'البصمة الرقمية لحافظة الحفظ',
      manifestVerification: 'سجل الإيداع المؤسسي المعتمد',
      closeoutManifestPoints: 'محضر الإغلاق الأرشيفي السيادي المكون من 10 بنود',
      tamperAuditTitle: 'تدقيق البصمات الرقمية والتشفير SHA-256',
      sealCertificateTitle: 'شهادة الختم المعتمد لدائرة الثقافة بالشارقة',
    },
    communications: {
      title: 'بوابة المراسلات المؤسسية الرسمية المعتمدة',
      subtitle: 'قناة مراسلات ثنائية ملزمة بين المنسق والفنان مع التدقيق والربط النظامي',
      attributableGateway: 'بوابة المراسلات المعتمدة',
      tamperEvidentNotice: 'كافة المراسلات مربوطة رقمياً بسجل ملف المعرض الرسمي وغير قابلة للتعديل.',
      newMessage: 'صياغة خطاب مؤسسي رسمي',
      recipientLabel: 'الفنان المستلم',
      subjectLabel: 'الموضوع الرسمي',
      sendButton: 'إرسال الخطاب المعتمد',
    },
    dossiers: {
      title: 'ملفات الاختيار والتحكيم الفني ومحاضر اللجنة',
      subtitle: 'الملفات الفنية المقنعة، إفصاحات النزاهة، وشروط الاعتماد الملزمة الصادرة عن لجنة التحكيم',
      anonymizedReview: 'التحكيم الفني المقنع لحماية النزاهة',
      juryEvaluationRubrics: 'معايير التقييم المؤسسي المعتمدة',
      conflictDisclosures: 'إفصاحات النزاهة ومنع تعارض المصالح',
      bindingConditions: 'شروط الاعتماد الملزمة الصادرة عن اللجنة',
    },
    ui: {
      navigation: {
        dashboard: 'رادار القيادة',
        dossiers: 'الملفات الفنية والمقترحات',
        approvedScope: 'النطاق المعتمد (المجمد)',
        contracts: 'العقود والاتفاقيات',
        operations: 'العمليات واللوجستيات',
        communications: 'أدلة المراسلات الرسمية',
        archive: 'الأرشيف السيادي',
      },
    },
  },
};

/**
 * Helper to pick dynamic bilingual field from data objects (e.g. titleEn / titleAr)
 */
export function getBilingual<T extends Record<string, any>>(
  item: T,
  field: string,
  lang: Language
): string {
  if (!item) return '';
  const key = lang === 'ar' 
    ? `${field}Ar` 
    : `${field}En`;
  
  return item[key] || item[`${field}En`] || item[`${field}Ar`] || '';
}

/**
 * Access nested dictionary value by dot-notation (e.g. 'navigation.tabs.overview')
 */
export function getTranslation(lang: Language, keyPath: string, fallback?: string): string {
  const parts = keyPath.split('.');
  let current: any = LOCALES[lang] || LOCALES.en;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English if missing in target
      let enFallback: any = LOCALES.en;
      for (const p of parts) {
        if (enFallback && typeof enFallback === 'object' && p in enFallback) {
          enFallback = enFallback[p];
        } else {
          return fallback || keyPath;
        }
      }
      return typeof enFallback === 'string' ? enFallback : fallback || keyPath;
    }
  }

  return typeof current === 'string' ? current : fallback || keyPath;
}
