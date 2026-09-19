import { BookOpen, Building2, GitBranch, Layers, Compass, Award, Users } from 'lucide-react';

export const storyChapters = [
  {
    id: 'leadership-visionary', icon: BookOpen,
    titleEn: 'His Highness Sheikh Dr. Sultan bin Muhammad Al Qasimi',
    titleAr: 'صاحب السمو الشيخ الدكتور سلطان بن محمد القاسمي',
    designationEn: 'Supreme Council Member and Ruler of Sharjah', designationAr: 'عضو المجلس الأعلى حاكم الشارقة',
    subtitleEn: 'Vision and Preservation', subtitleAr: 'الرؤية وصون الذاكرة',
    leadershipRank: 'ruler' as const,
    contentEn: 'Sharjah’s cultural vision connects its present and future with its cultural and scientific heritage. Preserving that memory, nurturing knowledge, and supporting cultural expression create a lasting foundation for people and society.',
    contentAr: 'تربط رؤية الشارقة الثقافية حاضرها ومستقبلها بإرثها الثقافي والعلمي. ويشكل صون هذه الذاكرة وتنمية المعرفة ودعم التعبير الثقافي أساساً مستداماً لبناء الإنسان والمجتمع.',
    highlightBoxEn: 'Cultural continuity begins with preserving knowledge and the context that gives it meaning.',
    highlightBoxAr: 'تبدأ الاستمرارية الثقافية بصون المعرفة والسياق الذي يمنحها معناها.'
  },
  {
    id: 'leadership-governance', icon: Building2,
    titleEn: 'His Excellency Abdullah bin Mohammed Al Owais', titleAr: 'سعادة عبد الله بن محمد العويس',
    designationEn: 'Chairman of the Department of Culture', designationAr: 'رئيس دائرة الثقافة',
    subtitleEn: 'Accountability and Decisions', subtitleAr: 'المساءلة والقرارات',
    leadershipRank: 'chairman' as const,
    contentEn: 'The Chairman’s proposed brief focuses on SDC: readiness across directorates, publication cycles, and executive review. It connects internal delivery reports to the decisions requiring attention, with evidence and the applicable authority route.',
    contentAr: 'يركز موجز رئيس الدائرة المقترح على جاهزية إدارات دائرة الثقافة ودورات النشر والمراجعة التنفيذية. ويربط تقارير الإنجاز الداخلية بالقرارات التي تتطلب المتابعة وأدلتها ومسار الصلاحية المنطبق.',
    highlightBoxEn: 'Executive review is visible. Approval still requires a documented delegation.',
    highlightBoxAr: 'المراجعة التنفيذية واضحة، ويظل الاعتماد مرهوناً بتفويض موثق.'
  },
  {
    id: 'leadership-operational', icon: GitBranch,
    titleEn: 'Mr. Mohammed Ibrahim Al Qaseer', titleAr: 'الأستاذ محمد إبراهيم القصير',
    designationEn: 'Director of Cultural Affairs', designationAr: 'مدير إدارة الشؤون الثقافية',
    subtitleEn: 'Cultural Programmes, Delivery and Oversight', subtitleAr: 'البرامج الثقافية والإنجاز والمتابعة',
    leadershipRank: 'director' as const,
    contentEn: 'Across awards, cultural programmes, and publishing, the Director follows manager reports, milestones, and escalated risks. The proposed overview distinguishes programme references from reported delivery.',
    contentAr: 'تجمع النظرة المقترحة الجوائز والبرامج الثقافية والنشر. ويتابع مدير الإدارة تقارير المديرين والمراحل والمخاطر المصعّدة، مع التمييز بين مراجع البرامج المنشورة وتقارير الإنجاز.',
    highlightBoxEn: 'Managers own day-to-day delivery and handovers. The Director oversees outcomes, schedules, and cross-department priorities.',
    highlightBoxAr: 'يتولى المديرون التنفيذ اليومي والتسليم. ويتابع مدير الإدارة النتائج والجداول والأولويات بين الأقسام.'
  },
  {
    id: 'one-record', icon: Layers, titleEn: 'One Case, One Living Record', titleAr: 'حالة واحدة وسجل حي واحد',
    subtitleEn: 'The same evidence connects every responsibility level.', subtitleAr: 'الأدلة نفسها تربط جميع مستويات المسؤولية.',
    contentEn: 'Follow a fictional Mounir Fatmi crate through arrival, condition evidence, and a proposed handover. The demonstration uses shared session data: changing one record updates the delivery table and the executive brief.',
    contentAr: 'تابع صندوقاً افتراضياً لمنير فاطمي عبر الوصول وأدلة الحالة والتسليم المقترح. يستخدم النموذج بيانات جلسة مشتركة؛ فتحديث سجل واحد ينعكس على جدول التنفيذ والموجز التنفيذي.',
    highlightBoxEn: 'Demonstrated: linked views. Proposed: institutional assignments and approval rights.', highlightBoxAr: 'موضح في النموذج: ترابط العروض. مقترح: التكليفات المؤسسية وصلاحيات الاعتماد.'
  },
  {
    id: 'arrival', icon: Compass, titleEn: 'Arrival Is the First Checkpoint', titleAr: 'الوصول أول نقطة تحقق',
    subtitleEn: 'Logistics records identity before the next handover.', subtitleAr: 'تسجل اللوجستيات الهوية قبل الانتقال إلى التسليم التالي.',
    contentEn: 'Match the crate reference and exterior seal with the expected record. A mismatch stops the sequence. A matching arrival places the asset on site and routes the next action to the Technical workspace.',
    contentAr: 'طابق مرجع الصندوق والختم الخارجي بالسجل المتوقع. يوقف عدم التطابق التسلسل. ويسجل الوصول المطابق وجود الأصل في الموقع ويحيل الإجراء التالي إلى مساحة الفريق الفني.',
    highlightBoxEn: 'Receipt records arrival. It does not confirm condition or authorize opening.', highlightBoxAr: 'يوثق الاستلام الوصول، ولا يؤكد الحالة أو يجيز الافتتاح.'
  },
  {
    id: 'evidence', icon: BookOpen, titleEn: 'Evidence Makes the Handover Reviewable', titleAr: 'الأدلة تتيح مراجعة التسليم',
    subtitleEn: 'A condition report stays linked to the asset and its version.', subtitleAr: 'يبقى تقرير الحالة مرتبطاً بالأصل وإصداره.',
    contentEn: 'The Technical role attaches a prepared sample condition report. A reported discrepancy keeps the handover on hold. A clear sample report routes the case to the assigned exhibition manager for review; report versions remain visible in session history.',
    contentAr: 'يرفق الدور الفني تقرير حالة تجريبياً معداً مسبقاً. ويُبقي الاختلاف المسجل التسليم معلقاً. ويُحال التقرير التجريبي الخالي من الاختلافات إلى مدير المعارض المكلف للمراجعة، مع حفظ الإصدارات في سجل الجلسة.',
    highlightBoxEn: 'Evidence is attributable to a sample role, source reference, version, and time.', highlightBoxAr: 'ترتبط الأدلة بدور تجريبي ومرجع مصدر وإصدار ووقت.'
  },
  {
    id: 'handover', icon: GitBranch, titleEn: 'Review First. Confirm Deliberately.', titleAr: 'المراجعة أولاً ثم التأكيد الصريح',
    subtitleEn: 'A two-step acknowledgement preserves the reviewed version.', subtitleAr: 'تأكيد من خطوتين يحفظ مرجع الإصدار المراجع.',
    contentEn: 'In the manager workspace, Review Handover opens the asset dossier and condition evidence. An explicit acknowledgement is required before confirmation. The demo records the sample manager, time, and report version, then makes that handover read-only.',
    contentAr: 'في مساحة المدير، تفتح مراجعة التسليم ملف الأصل وأدلة حالته. ويلزم إقرار صريح قبل التأكيد. يسجل النموذج المدير التجريبي والوقت وإصدار التقرير، ثم يصبح التسليم للقراءة فقط.',
    highlightBoxEn: 'This is a demonstration acknowledgement, not a digital signature or legal custody instrument.', highlightBoxAr: 'هذا تأكيد تجريبي، وليس توقيعاً رقمياً أو سند حيازة قانونية.'
  },
  {
    id: 'roll-up', icon: Award, titleEn: 'Operational Evidence, Executive Clarity', titleAr: 'أدلة تشغيلية ورؤية تنفيذية واضحة',
    subtitleEn: 'Management by exception, calculated from the shared record.', subtitleAr: 'متابعة الاستثناءات انطلاقاً من السجل المشترك.',
    contentEn: 'A manager’s completed handover clears its exhibition delivery risk. In the publishing example, a proof reaches executive review only after manager checks and a proposed routing reference. Each result updates the Chairman’s SDC brief.',
    contentAr: 'يزيل التسليم الذي يكمله المدير مخاطر تنفيذ المعرض المرتبطة به. وفي مثال النشر، تصل البروفة للمراجعة التنفيذية بعد تحققات المدير ومرجع الإحالة المقترح فقط. وتحدّث النتائج موجز رئيس الدائرة.',
    highlightBoxEn: 'Operational readiness remains separate from opening, payment, and signing authorization.', highlightBoxAr: 'تبقى الجاهزية التشغيلية منفصلة عن إذن الافتتاح والدفع والتوقيع.'
  },
  {
    id: 'explore-next', icon: Users, titleEn: 'Follow the Record Across Roles', titleAr: 'تابع السجل عبر الأدوار',
    subtitleEn: 'Oversight follows outcomes. Managers and teams deliver the work.', subtitleAr: 'تتابع القيادة النتائج، وينفذ المديرون والفرق العمل.',
    contentEn: 'Follow an exhibition handover or a print proof from its assigned team to the appropriate review. Artist intake offers a separate path: one profile, a proposal for each programme, and coordinator feedback before any selection decision.',
    contentAr: 'تابع تسليم المعرض أو بروفة الطباعة من الفريق المكلف إلى المراجعة المناسبة. ويوفر تقديم الفنان مساراً مستقلاً: ملف واحد ومقترح لكل برنامج وملاحظات المنسق قبل أي قرار اختيار.',
    highlightBoxEn: 'Connected sample roles include leadership, delivery, publishing, coordination, and finance. All decisions remain demonstrations.', highlightBoxAr: 'تشمل الأدوار التجريبية المترابطة القيادة والتنفيذ والنشر والتنسيق والمالية. وتبقى جميع القرارات توضيحية.'
  }
];
