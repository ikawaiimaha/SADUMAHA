const fs = require('fs');
const content = fs.readFileSync('src/components/StoryMode.tsx', 'utf8');

const newChapters = `    {
      id: 'leadership-visionary',
      icon: BookOpen,
      titleEn: 'The Visionary Mandate',
      titleAr: 'رسالة الرؤية الكبرى',
      subtitleEn: 'His Highness Sheikh Dr. Sultan bin Muhammad Al Qasimi, Supreme Council Member and Ruler of Sharjah.',
      subtitleAr: 'صاحب السمو الشيخ الدكتور سلطان بن محمد القاسمي، عضو المجلس الأعلى حاكم الشارقة',
      contentEn: 'Building enduring institutions that outlast individuals. SADU ensures that every stroke of calligraphy, every scholarly critique, and every commissioned masterpiece is cryptographically sealed in a century-long archival record for future generations.',
      contentAr: 'بناء مؤسسات خالدة تبقى بعد الأفراد. يضمن سدو أن تُحفظ كل جرة قلم، وكل نقد أكاديمي، وكل عمل فني مكلف بدقة في سجل أرشيفي موثق يمتد لقرن من الزمان، ليكون إرثاً للأجيال القادمة.',
      type: 'leadership-portrait',
      portraitPosition: 'right',
      imagePath: '/sultan_portrait.png',
      highlightPrefixEn: 'Sovereign Archive:',
      highlightPrefixAr: 'الأرشيف السيادي:',
      highlightBoxEn: 'Protecting Sharjah’s heritage through permanent, immutable cultural preservation.',
      highlightBoxAr: 'حماية تراث الشارقة عبر حفظ ثقافي دائم لا يقبل التعديل.'
    },
    {
      id: 'leadership-governance',
      icon: ShieldCheck,
      titleEn: 'The Governance Mandate',
      titleAr: 'التفويض المؤسسي والرقابة',
      subtitleEn: 'His Excellency Abdullah bin Mohammed Al Owais, Chairman of the Department of Culture.',
      subtitleAr: 'سعادة عبد الله بن محمد العويس، رئيس دائرة الثقافة في الشارقة',
      contentEn: 'The Institutional Canon: Enforcing statutory delegation and absolute financial accountability. SADU implements immutable anti-bypass gates, ensuring public funds are committed strictly through authorized 3-bid procurement, supported by verified curatorial ledgers.',
      contentAr: 'الأصل المؤسسي المعتمد: فرض الصلاحيات القانونية والمساءلة المالية المطلقة. يُطبق سدو بوابات صلبة تمنع الالتفاف، وتضمن التزام الإنفاق العام الصارم وفقاً لنظام المشتريات المعتمد وبناءً على سجلات تحكيم فنية موثقة.',
      type: 'leadership-portrait',
      portraitPosition: 'left',
      imagePath: '/owais_portrait.png',
      highlightPrefixEn: 'Statutory Compliance:',
      highlightPrefixAr: 'الامتثال التنظيمي:',
      highlightBoxEn: 'Guarding institutional risk through absolute financial and procedural integrity.',
      highlightBoxAr: 'حماية المؤسسة من المخاطر عبر نزاهة مالية وإجرائية مطلقة.'
    },
    {
      id: 'leadership-operational',
      icon: Wrench,
      titleEn: 'The Operational Mandate',
      titleAr: 'التفويض العملياتي والميداني',
      subtitleEn: 'His Excellency Mohammed Ibrahim Al Qaseer, Director of Cultural Affairs.',
      subtitleAr: 'سعادة محمد إبراهيم القصير، مدير إدارة الشؤون الثقافية',
      contentEn: 'Connecting Curatorial Vision with Operational Reality. SADU bridges the gap between the jury room and the gallery floor—simultaneously managing complex logistical telemetry, structural engineering hold-points, and cross-exhibition dependencies to ensure flawless delivery.',
      contentAr: 'ربط الرؤية الفنية بالواقع العملياتي. يجسّر سدو الفجوة بين قاعة التحكيم وأرض المعرض، مديراً بالتزامن بيانات لوجستية معقدة، وتوقفات الفحص الهندسي، والترابط بين المعارض المختلفة لضمان تنفيذ بلا شوائب.',
      type: 'leadership-portrait',
      portraitPosition: 'right',
      imagePath: '/qaseer_portrait.png',
      highlightPrefixEn: 'Parallel Workstreams:',
      highlightPrefixAr: 'مسارات العمل المتزامنة:',
      highlightBoxEn: 'Translating visionary cultural concepts into flawless on-the-ground execution.',
      highlightBoxAr: 'ترجمة المفاهيم الثقافية الرؤيوية إلى تنفيذ ميداني متقن.'
    },`;

const updatedContent = content.replace("  const chapters = [\n    {", "  const chapters = [\n    {\n      id: 'title',\n      icon: Layers,\n      titleEn: 'SADU System Overview',\n      titleAr: 'نظرة عامة على نظام سدو',\n      subtitleEn: 'Welcome to the System for Arts Data Unification.',\n      subtitleAr: 'مرحباً بكم في نظام توحيد بيانات الفنون.',\n      contentEn: 'Begin the presentation to discover how SADU revolutionizes cultural administration.',\n      contentAr: 'ابدأ العرض لاكتشاف كيف يُحدث سدو ثورة في الإدارة الثقافية.',\n      statNumber: '',\n      statLabelEn: '',\n      statLabelAr: '',\n      highlightPrefixEn: '',\n      highlightPrefixAr: '',\n      highlightBoxEn: '',\n      highlightBoxAr: ''\n    },\n" + newChapters + "\n    {");

fs.writeFileSync('src/components/StoryMode.tsx', updatedContent);
