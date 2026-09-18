const fs = require('fs');
const content = fs.readFileSync('src/components/StoryMode.tsx', 'utf8');

const updatedContent = content.replace(
  `  const chapters = [
    {
      id: 'title',
      icon: Layers,
      titleEn: 'SADU System Overview',
      titleAr: 'نظرة عامة على نظام سدو',
      subtitleEn: 'Welcome to the System for Arts Data Unification.',
      subtitleAr: 'مرحباً بكم في نظام توحيد بيانات الفنون.',
      contentEn: 'Begin the presentation to discover how SADU revolutionizes cultural administration.',
      contentAr: 'ابدأ العرض لاكتشاف كيف يُحدث سدو ثورة في الإدارة الثقافية.',
      statNumber: '',
      statLabelEn: '',
      statLabelAr: '',
      highlightPrefixEn: '',
      highlightPrefixAr: '',
      highlightBoxEn: '',
      highlightBoxAr: ''
    },`,
  `  const chapters = [`
);

fs.writeFileSync('src/components/StoryMode.tsx', updatedContent);
