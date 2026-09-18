import { BookOpen, Building2, GitBranch, Layers, Compass, Award, Users } from 'lucide-react';

export const storyChapters = [
  {
    id: 'leadership-visionary', icon: BookOpen,
    titleEn: 'His Highness Sheikh Dr. Sultan bin Muhammad Al Qasimi',
    titleAr: 'صاحب السمو الشيخ الدكتور سلطان بن محمد القاسمي',
    designationEn: 'Supreme Council Member and Ruler of Sharjah', designationAr: 'عضو المجلس الأعلى حاكم الشارقة',
    subtitleEn: 'Vision and Preservation', subtitleAr: 'الرؤية وصون الذاكرة',
    imagePath: '/sultan_portrait.jpg', portrait: { width: 2816, height: 1536, viewBox: '1000 0 1228.8 1536' },
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
    imagePath: '/owais_portrait.jpg', portrait: { width: 2730, height: 1536, viewBox: '1065 0 1228.8 1536' },
    contentEn: 'The proposed Chairman’s brief distils programme readiness, institutional commitments, and missing evidence into three panels. It brings forward exceptions requiring attention, with their responsible role and supporting record.',
    contentAr: 'يلخص موجز رئيس الدائرة المقترح جاهزية البرامج والالتزامات المؤسسية والأدلة الناقصة في ثلاث لوحات. ويبرز الاستثناءات التي تتطلب المتابعة مع الدور المسؤول والسجل الداعم.',
    highlightBoxEn: 'Executive review is visible. Approval still requires a documented delegation.',
    highlightBoxAr: 'المراجعة التنفيذية واضحة، ويظل الاعتماد مرهوناً بتفويض موثق.'
  },
  {
    id: 'leadership-operational', icon: GitBranch,
    titleEn: 'Mr. Mohammed Ibrahim Al Qaseer', titleAr: 'الأستاذ محمد إبراهيم القصير',
    designationEn: 'Director of Cultural Affairs', designationAr: 'مدير إدارة الشؤون الثقافية',
    subtitleEn: 'Programme Delivery and Handover', subtitleAr: 'تنفيذ البرامج وتسليم المسؤوليات',
    imagePath: '/qaseer_portrait.jpg', portrait: { width: 1728, height: 2418, viewBox: '525 550 1024 1280' },
    contentEn: 'The proposed delivery table connects exhibition plans with coordination, technical evidence, and logistics. Each row shows the asset, its blocker, the next responsible role, and the evidence needed to continue.',
    contentAr: 'يربط جدول التنفيذ المقترح خطط المعارض بالتنسيق والأدلة الفنية واللوجستيات. ويعرض كل صف الأصل ومعوقه والدور المسؤول التالي والأدلة اللازمة لاستكمال العمل.',
    highlightBoxEn: 'Review the dossier, acknowledge the handover, then pass on an understandable record.',
    highlightBoxAr: 'راجع الملف وأكد التسليم، ثم انقل سجلاً واضحاً لمن يتولى المتابعة.'
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
    contentEn: 'The Technical role attaches a prepared sample condition report. A reported discrepancy keeps the handover on hold. A clear sample report routes the case to the Directorate for review; later versions remain distinguishable in session history.',
    contentAr: 'يرفق الدور الفني تقرير حالة تجريبياً معداً مسبقاً. ويُبقي الاختلاف المسجل التسليم معلقاً. أما التقرير التجريبي الخالي من الاختلافات فيحيل الحالة إلى الإدارة للمراجعة، مع تمييز الإصدارات في سجل الجلسة.',
    highlightBoxEn: 'Evidence is attributable to a sample role, source reference, version, and time.', highlightBoxAr: 'ترتبط الأدلة بدور تجريبي ومرجع مصدر وإصدار ووقت.'
  },
  {
    id: 'handover', icon: GitBranch, titleEn: 'Review First. Confirm Deliberately.', titleAr: 'المراجعة أولاً ثم التأكيد الصريح',
    subtitleEn: 'A two-step acknowledgement preserves the reviewed version.', subtitleAr: 'تأكيد من خطوتين يحفظ مرجع الإصدار المراجع.',
    contentEn: 'Review Handover opens the asset dossier and its condition evidence. An explicit acknowledgement is required before confirmation. The demo records the sample role, time, and report version, then makes that handover read-only.',
    contentAr: 'يفتح إجراء مراجعة التسليم ملف الأصل وأدلة حالته. ويلزم إقرار صريح قبل التأكيد. يسجل النموذج الدور التجريبي والوقت وإصدار التقرير، ثم يصبح التسليم للقراءة فقط.',
    highlightBoxEn: 'This is a demonstration acknowledgement, not a digital signature or legal custody instrument.', highlightBoxAr: 'هذا تأكيد تجريبي، وليس توقيعاً رقمياً أو سند حيازة قانونية.'
  },
  {
    id: 'roll-up', icon: Award, titleEn: 'Operational Evidence, Executive Clarity', titleAr: 'أدلة تشغيلية ورؤية تنفيذية واضحة',
    subtitleEn: 'Management by exception, calculated from the shared record.', subtitleAr: 'متابعة الاستثناءات انطلاقاً من السجل المشترك.',
    contentEn: 'After the demo handover, the readiness count moves from three to four sample programmes. A missing artist statement lowers evidence completeness. A Finance pack reaches executive review only after Directorate review. Each change has a visible cause.',
    contentAr: 'بعد التسليم التجريبي يرتفع عدد البرامج الجاهزة من ثلاثة إلى أربعة. ويخفض نقص بيان الفنان نسبة اكتمال الأدلة. ولا يصل الملف المالي إلى المراجعة التنفيذية إلا بعد مراجعة الإدارة. لكل تغير سبب واضح.',
    highlightBoxEn: 'Operational readiness remains separate from opening, payment, and signing authorization.', highlightBoxAr: 'تبقى الجاهزية التشغيلية منفصلة عن إذن الافتتاح والدفع والتوقيع.'
  },
  {
    id: 'explore-next', icon: Users, titleEn: 'Follow the Record Across Roles', titleAr: 'تابع السجل عبر الأدوار',
    subtitleEn: 'Begin with the Chairman’s brief, then resolve its delivery exception.', subtitleAr: 'ابدأ بموجز رئيس الدائرة، ثم عالج استثناء التسليم.',
    contentEn: 'Start with the blocked programme. Record its crate arrival in Logistics, attach the sample condition report in Technical, and confirm the proposed handover in Directorate. Return to the Chairman’s brief to see the same record update the count.',
    contentAr: 'ابدأ بالبرنامج المعلق. سجل وصول صندوقه في اللوجستيات، وأرفق تقرير الحالة التجريبي في مساحة الفريق الفني، وأكد التسليم المقترح في الإدارة. عد إلى موجز رئيس الدائرة لتشاهد أثر السجل نفسه في المؤشر.',
    highlightBoxEn: 'The connected case covers leadership, logistics, technical, coordination, and finance. Other roles open the earlier sample workspaces.', highlightBoxAr: 'تشمل الحالة المترابطة القيادة واللوجستيات والفريق الفني والتنسيق والمالية. وتفتح الأدوار الأخرى مساحات العمل التجريبية السابقة.'
  }
];
