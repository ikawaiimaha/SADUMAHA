import { PortraitHierarchy } from '../PortraitHierarchy';
import React from 'react';
import { Language } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { INSTITUTIONAL_INFO } from '../../data/mockData';
import { KpiCard } from '../common/KpiCard';
import { 
  Globe, 
  MapPin, 
  ShieldAlert, 
  BookOpen, 
  Award, 
  Activity 
} from 'lucide-react';

export interface DirectorateDashboardProps {
  lang?: Language;
}

export const DirectorateDashboard: React.FC<DirectorateDashboardProps> = (props) => {
  const i18n = useI18n();
  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, localizeDigits } = i18n;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section aria-label={isAr ? 'نظرة عامة على القيادة' : 'Leadership overview'}>
        <ol className="flex flex-col gap-3">
          <li className="rounded-lg border border-sadu-gold border-t-4 border-t-sadu-brick bg-sadu-linen p-5 sm:p-8">
            <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 items-center">
              <div>
                <p className="text-xs font-semibold text-sadu-brick mb-3">
                  {isAr ? 'الرؤية الثقافية' : 'Cultural Vision'}
                </p>
                <h2 className="font-editorial font-bold text-2xl sm:text-3xl lg:text-4xl leading-snug text-sadu-charcoal">
                  {isAr ? 'صاحب السمو الشيخ الدكتور سلطان بن محمد القاسمي' : 'His Highness Sheikh Dr. Sultan bin Muhammad Al Qasimi'}
                </h2>
                <p className="text-sm sm:text-base text-sadu-ink mt-3">
                  {isAr ? 'الثقافة والذاكرة المؤسسية' : 'Culture and Institutional Memory'}
                </p>
              </div>
              <div className="h-64 w-52 shrink-0"><PortraitHierarchy rank="ruler" isAr={isAr}/></div>
            </div>
          </li>
          <li className="w-full md:w-5/6 mx-auto rounded-lg border border-sadu-gold bg-sadu-linen p-5">
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <div className="min-w-0 flex-1 w-full">
                <h3 className="font-editorial font-bold text-xl sm:text-2xl text-sadu-charcoal leading-snug">
                  {isAr ? INSTITUTIONAL_INFO.chairmanAr : INSTITUTIONAL_INFO.chairmanEn}
                </h3>
                <p className="text-xs sm:text-sm text-sadu-muted mt-2">
                  {isAr ? 'المساءلة ووضوح القرارات' : 'Accountability and Clear Decisions'}
                </p>
              </div>
              <div className="h-64 w-52 shrink-0"><PortraitHierarchy rank="chairman" isAr={isAr}/></div>
            </div>
          </li>
          <li className="w-full md:w-2/3 mx-auto rounded-lg border border-sadu-gold bg-sadu-linen p-5">
            <h3 className="font-editorial font-bold text-lg text-sadu-charcoal">
              {isAr ? INSTITUTIONAL_INFO.directorAr : INSTITUTIONAL_INFO.directorEn}
            </h3>
          </li>
        </ol>
      </section>
      
      {/* Header Banner */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
            <Globe className="w-4 h-4" />
            <span>{isAr ? 'غرفة العمليات المركزية — إدارة الشؤون الثقافية' : 'Central Operations — Directorate of Cultural Affairs'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
            {isAr ? 'القيادة العملياتية والدبلوماسية الثقافية' : 'Executive Operations & Cultural Diplomacy'}
          </h1>
          <p className="text-xs sm:text-sm text-sadu-muted mt-1 max-w-2xl">
            {isAr 
              ? 'منظور التوجيه الشامل: إدارة أكثر من ٤٠ مهرجاناً عالمياً، توجيه آلاف المخطوطات لجوائز الشارقة للإبداع، ومتابعة مسار الإنتاج الفكري والنشر المؤسسي.' 
              : 'Global oversight perspective: managing 40+ international festivals, steering thousands of SDC Award manuscripts, and monitoring the institutional intellectual production pipeline.'}
          </p>
        </div>
      </div>

      {/* FIXED: Top KPI Grid forced to 120px heights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 [&>div]:h-[120px]">
        <KpiCard
          titleEn="UAE Active Initiatives" titleAr="فعاليات محلية"
          value={formatNumber(14)} icon={MapPin} lang={lang}
        />
        <KpiCard
          titleEn="Levant & Arab Forums" titleAr="الشرق العربي"
          value={formatNumber(8)} icon={Globe} lang={lang}
        />
        <KpiCard
          titleEn="North Africa Projects" titleAr="شمال إفريقيا"
          value={formatNumber(12)} icon={MapPin} lang={lang}
        />
        <KpiCard
          titleEn="Sub-Saharan Poetry" titleAr="إفريقيا جنوب الصحراء"
          value={formatNumber(6)} icon={Globe} lang={lang}
        />
      </div>

      {/* Global Calendar Schedule */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-sadu-gold bg-sadu-sand/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-sadu-charcoal flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sadu-brick" />
            {isAr ? `جدول الانتشار الجيوسياسي (${localizeDigits('2026')}-${localizeDigits('2027')})` : 'Geopolitical Deployment Schedule (2026-2027)'}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-sadu-sand text-sadu-muted border-b border-sadu-gold">
              <tr>
                <th className="px-4 py-3 font-semibold w-1/3">{isAr ? 'المهرجان / الملتقى' : 'Festival / Forum'}</th>
                <th className="px-4 py-3 font-semibold">{isAr ? 'الدولة والمدينة' : 'Location'}</th>
                <th className="px-4 py-3 font-semibold">{isAr ? 'التصنيف' : 'Category'}</th>
                <th className="px-4 py-3 font-semibold">{isAr ? 'التاريخ' : 'Target Date'}</th>
                <th className="px-4 py-3 font-semibold">{isAr ? 'حالة التنسيق' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sadu-gold/30">
              {[
                { nameEn: 'Sharjah Narrative Forum (22nd)', nameAr: 'ملتقى الشارقة للسرد (الدورة 22)', locEn: 'Amman — Jordan', locAr: 'الأردن — عمّان', catEn: 'Literature', catAr: 'الأدب والسرد', date: '2026 Sept', status: 'EXECUTED' },
                { nameEn: 'Sharjah Calligraphy Biennial (12th)', nameAr: 'بينالي الشارقة للخط (الدورة 12)', locEn: 'Sharjah — UAE', locAr: 'الإمارات — الشارقة', catEn: 'Visual Arts', catAr: 'الفنون البصرية', date: '2026 Oct', status: 'IN PROGRESS' },
                { nameEn: 'Marrakech Moroccan Poetry Festival (8th)', nameAr: 'مهرجان مراكش للشعر المغربي (الدورة 8)', locEn: 'Marrakech — Morocco', locAr: 'المغرب — مراكش', catEn: 'Poetry', catAr: 'الشعر', date: '2026 Oct', status: 'APPROVED' },
                { nameEn: 'Sharjah Cultural Honoring Forum (28th)', nameAr: 'ملتقى الشارقة للتكريم الثقافي (الدورة 28)', locEn: 'Nouakchott — Mauritania', locAr: 'موريتانيا — نواكشوط', catEn: 'Honoring', catAr: 'ملتقى تكريم', date: '2026 Nov', status: 'APPROVED' },
                { nameEn: 'N\'Djamena Arabic Poetry Forum (5th)', nameAr: 'ملتقى تشاد للشعر العربي (الدورة 5)', locEn: 'N\'Djamena — Chad', locAr: 'تشاد — نجامينا', catEn: 'Poetry', catAr: 'الشعر', date: '2026 July', status: 'EXECUTED' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-sadu-sand/40 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-sadu-charcoal block">{isAr ? row.nameAr : row.nameEn}</span>
                    <span className="text-[9px] text-sadu-muted font-mono block">FEST-{localizeDigits(String(i+1).padStart(2, '0'))}</span>
                  </td>
                  <td className="px-4 py-3 text-sadu-charcoal">{isAr ? row.locAr : row.locEn}</td>
                  <td className="px-4 py-3 text-sadu-muted">{isAr ? row.catAr : row.catEn}</td>
                  <td className="px-4 py-3 text-sadu-ink font-mono">{localizeDigits(row.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      row.status === 'EXECUTED' ? 'bg-sadu-sage-light text-sadu-sage-dark border-sadu-sage' :
                      row.status === 'IN PROGRESS' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-sky-100 text-sky-800 border-sky-300'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
