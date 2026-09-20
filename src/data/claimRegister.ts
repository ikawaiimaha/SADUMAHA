type Text = { en: string; ar: string };
export interface ClaimSource {
  id: string;
  url: string;
  title: Text;
  published: string | null;
  checked: string;
  passage: Text;
  language: Text;
  limit: Text;
}
const publicLimit: Text = {
  en: 'Public programme or title reference only. It does not establish current delivery, reporting lines, selection, spending, signing or publication authority.',
  ar: 'مرجع منشور للبرنامج أو المسمى فقط. لا يثبت الإنجاز الحالي أو خطوط الإشراف أو صلاحيات الاختيار أو الإنفاق أو التوقيع أو النشر.',
};
const quotationLimit: Text = {
  en: 'Remarks about heritage at the Faya inscription ceremony, not an endorsement of SADU or an operational delegation.',
  ar: 'كلمة عن التراث في حفل إدراج الفاية، وليست تأييداً لسدو أو تفويضاً تشغيلياً.',
};
// Checked against public originals in the 20 September 2026 source audit.
// This date is an editorial check, never a signature, appointment or permission date.
export const claimRegister = {
  quoteEn: {
    id: 'QUOTE-EN-FAYA', url: 'https://sharjah24.ae/en/Articles/2025/12/16/kmr15',
    title: { en: 'Sharjah24 — Faya World Heritage listing ceremony', ar: 'الشارقة 24 — حفل إدراج الفاية في قائمة التراث العالمي' },
    published: '2025-12-16', checked: '2026-09-20',
    passage: { en: 'Section: The true value of historical sites', ar: 'فقرة: القيمة الحقيقية للمواقع التاريخية' },
    language: { en: 'Verbatim excerpt from the published English report; not a SADU translation. Translation certification not established.', ar: 'مقتطف حرفي من التقرير الإنجليزي المنشور؛ ليس ترجمة من سدو. لم يُثبت اعتماد الترجمة.' }, limit: quotationLimit,
  },
  quoteAr: {
    id: 'QUOTE-AR-WUSTA-76',
    url: 'https://sdc.gov.ae/assets/download/99551019/%E2%80%8E%E2%81%A8%D9%85%D8%AC%D9%84%D8%A9%20%D8%A7%D9%84%D9%88%D8%B3%D8%B7%D9%89%20%D8%A7%D9%84%D8%B9%D8%AF%D8%AF%2076%20%D8%B9%D9%86%20%D8%B4%D9%87%D8%B1%20%D9%8A%D9%86%D8%A7%D9%8A%D8%B1%202026%E2%81%A9.pdf.aspx',
    title: { en: 'SDC — Al Wusta, issue 76', ar: 'دائرة الثقافة — الوسطى، العدد 76' },
    published: '2026-01', checked: '2026-09-20',
    passage: { en: 'PDF page 10 quotation; speech context on PDF page 6', ar: 'الاقتباس في صفحة PDF 10؛ سياق الكلمة في صفحة PDF 6' },
    language: { en: 'Excerpt from the published Arabic text', ar: 'مقتطف من النص العربي المنشور' }, limit: quotationLimit,
  },
  calendar: {
    id: 'SDC-CALENDAR-2026', url: 'https://sdc.gov.ae/en/media-center/news/31/8/2026/sharjah-department-of-culture-announces-annual-program-of-permanent-festivals-and-forums',
    title: { en: 'SDC — annual festivals and forums programme', ar: 'دائرة الثقافة — البرنامج السنوي للمهرجانات والملتقيات' },
    published: '2026-08-31', checked: '2026-09-20',
    passage: { en: 'Chairman attribution and September 2026–August 2027 programme', ar: 'نسبة التصريح إلى رئيس الدائرة وبرنامج سبتمبر 2026–أغسطس 2027' },
    language: { en: 'SDC English web edition; site warns that translated pages may use Google translation. SADU labels are editorial summaries.', ar: 'النسخة الإنجليزية لموقع الدائرة؛ ينبه الموقع إلى احتمال استخدام ترجمة غوغل. عناوين سدو ملخصات تحريرية.' }, limit: publicLimit,
  },
  creativity: {
    id: 'SDC-CREATIVITY-2026', url: 'https://sdc.gov.ae/en/media-center/news/5/5/2026/sharjah-award-for-arab-creativity-sets-october-31-as-final-deadline-for-submissions',
    title: { en: 'SDC — Arab Creativity submission deadline', ar: 'دائرة الثقافة — موعد التقديم لجائزة الإبداع العربي' },
    published: '2026-05-05', checked: '2026-09-20',
    passage: { en: 'Al Qaseer title, award role and six award fields', ar: 'مسمى القصير ودوره في الجائزة ومجالاتها الستة' },
    language: { en: 'SDC English web edition; SADU labels are editorial summaries, not certified translations.', ar: 'نسخة الموقع الإنجليزية؛ عناوين سدو ملخصات تحريرية وليست ترجمات معتمدة.' }, limit: publicLimit,
  },
  artCriticism: {
    id: 'SDC-ART-CRITICISM-2026', url: 'https://sdc.gov.ae/ar/media-center/news/22/2/2026/the-sharjah-award-for-art-criticism-announces-the-theme-of-its-17th-edition',
    title: { en: 'SDC — 17th artistic criticism award theme', ar: 'دائرة الثقافة — موضوع الدورة 17 لجائزة البحث النقدي التشكيلي' },
    published: '2026-02-22', checked: '2026-09-20',
    passage: { en: 'Director and Secretary-General attribution; publication of winning research', ar: 'المسمى الإداري والأمانة العامة؛ نشر البحوث الفائزة' },
    language: { en: 'Arabic original; English labels are SADU editorial summaries.', ar: 'الأصل العربي؛ العناوين الإنجليزية ملخصات تحريرية من سدو.' }, limit: publicLimit,
  },
  poetryCriticism: {
    id: 'SDC-POETRY-CRITICISM-2026', url: 'https://sdc.gov.ae/ar/media-center/news/16/2/2026/the-sharjah-award-for-arabic-poetry-criticism-announces-the-theme-of-its-sixth-edition',
    title: { en: 'SDC — sixth poetry criticism award theme', ar: 'دائرة الثقافة — موضوع الدورة السادسة لجائزة نقد الشعر العربي' },
    published: '2026-02-16', checked: '2026-09-20',
    passage: { en: 'Cultural Affairs organisation of the award; Al Qaseer attribution', ar: 'تنظيم إدارة الشؤون الثقافية للجائزة؛ نسبة التصريح إلى القصير' },
    language: { en: 'Arabic original; English labels are SADU editorial summaries.', ar: 'الأصل العربي؛ العناوين الإنجليزية ملخصات تحريرية من سدو.' }, limit: publicLimit,
  },
  department: {
    id: 'SDC-ABOUT', url: 'https://sdc.gov.ae/ar/about-sdc',
    title: { en: 'SDC — about the department', ar: 'دائرة الثقافة — عن الدائرة' },
    published: null, checked: '2026-09-20',
    passage: { en: 'Ruler name and title; departmental descriptions', ar: 'اسم صاحب السمو حاكم الشارقة ومسمّاه؛ وصف الإدارات' },
    language: { en: 'Arabic original; SADU uses editorial English labels and transliteration.', ar: 'الأصل العربي؛ تستخدم سدو مقابلات إنجليزية تحريرية ونقلاً للأسماء.' }, limit: publicLimit,
  },
  magazines: {
    id: 'SDC-MAGAZINES', url: 'https://sdc.gov.ae/ar/our-publications/magazines',
    title: { en: 'SDC — magazine catalogue', ar: 'دائرة الثقافة — دليل المجلات' },
    published: null, checked: '2026-09-20',
    passage: { en: 'Seven magazine entries and their monthly frequency; not issue progress', ar: 'بيانات المجلات السبع ودورية صدورها الشهرية؛ لا تقدم الإصدارات' },
    language: { en: 'Arabic original; English names are editorial transliterations.', ar: 'الأصل العربي؛ الأسماء الإنجليزية نقل تحريري.' }, limit: publicLimit,
  },
} satisfies Record<string, ClaimSource>;
export type ClaimKey = keyof typeof claimRegister;
