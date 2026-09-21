import type { Language } from '../../types';
import { CalendarDays, CheckCircle2, Globe2, WalletCards } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { DirectorateOversight } from '../DirectorateOversight';
import { KpiCard } from '../common/KpiCard';
import { PageHeader, Panel, StatGrid, TwoColumnLayout } from '../common/dashboard';
import { leadershipPeople } from '../../data/leadershipMedia';
import '../LivingRecordWorkspace.css';

export interface DirectorateDashboardProps { lang?: Language }

export function DirectorateDashboard(_props: DirectorateDashboardProps) {
  const { isAr, formatNumber } = useI18n();
  const person = leadershipPeople.director;
  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        eyebrow={isAr ? 'القيادة التنفيذية · لوحة المؤشرات' : 'Executive Directorate · KPI Dashboard'}
        title={isAr ? person.nameAr : person.nameEn}
        description={isAr ? person.titleAr : person.titleEn}
        actions={
          <span className="rounded-md border border-sadu-gold bg-sadu-sand px-3 py-2 text-xs font-bold text-sadu-ink">
            {isAr ? 'نظرة إشرافية مقترحة' : 'Proposed oversight view'}
          </span>
        }
      />

      <StatGrid>
        <KpiCard
          titleEn="Active Programs"
          titleAr="البرامج النشطة"
          value={formatNumber(11)}
          trend="neutral"
          trendLabelEn="Across the portfolio"
          trendLabelAr="ضمن محفظة البرامج"
          icon={CalendarDays}
          lang={isAr ? 'ar' : 'en'}
        />
        <KpiCard
          titleEn="Pending Approvals"
          titleAr="الاعتمادات المعلقة"
          value={formatNumber(7)}
          trend="down"
          trendLabelEn="Requires review"
          trendLabelAr="تتطلب المراجعة"
          icon={CheckCircle2}
          lang={isAr ? 'ar' : 'en'}
          alert
        />
        <KpiCard
          titleEn="International Guests"
          titleAr="الضيوف الدوليين"
          value={formatNumber(38)}
          trend="neutral"
          trendLabelEn="Scheduled this cycle"
          trendLabelAr="مجدولون لهذه الدورة"
          icon={Globe2}
          lang={isAr ? 'ar' : 'en'}
        />
        <KpiCard
          titleEn="Budget Utilization"
          titleAr="استغلال الميزانية"
          value="68%"
          trend="up"
          trendLabelEn="Of approved envelope"
          trendLabelAr="من الاعتماد المعتمد"
          icon={WalletCards}
          lang={isAr ? 'ar' : 'en'}
        />
      </StatGrid>

      <TwoColumnLayout
        left={
          <Panel className="h-full" padded={false}>
            <div className="border-b border-sadu-gold/50 p-4 sm:p-5">
              <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">{isAr ? 'ملخص المحفظة التنفيذية' : 'Executive portfolio summary'}</h2>
              <p className="mt-1 text-xs leading-relaxed text-sadu-muted">
                {isAr
                  ? 'بانتظار تقارير مؤرخة للبرامج الفعلية. تعرض هذه اللوحة بيانات سيناريو للعرض فقط.'
                  : 'Dated reports for live programmes are pending. This boardroom view presents scenario data for demonstration only.'}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <div className="living-record" dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight: 0, background: 'transparent' }}>
                <DirectorateOversight />
              </div>
            </div>
          </Panel>
        }
        right={
          <Panel className="h-full" padded={false}>
            <div className="border-b border-sadu-gold/50 p-4 sm:p-5">
              <h2 className="text-lg font-editorial font-bold text-sadu-charcoal">{isAr ? 'حالة العرض التنفيذي' : 'Boardroom readiness'}</h2>
              <p className="mt-1 text-xs leading-relaxed text-sadu-muted">{isAr ? 'مؤشرات العرض قبل مراجعة المجلس.' : 'Presentation checks before executive review.'}</p>
            </div>
            <dl className="divide-y divide-sadu-gold/30 text-xs">
              <div className="flex items-center justify-between gap-4 p-4"><dt className="text-sadu-muted">{isAr ? 'نطاق البرامج' : 'Programme scope'}</dt><dd className="font-bold text-sadu-sage">{isAr ? 'مُحمّل' : 'Loaded'}</dd></div>
              <div className="flex items-center justify-between gap-4 p-4"><dt className="text-sadu-muted">{isAr ? 'تقارير المديرين' : 'Manager reports'}</dt><dd className="font-bold text-amber-700">{isAr ? 'بانتظار التحديث' : 'Awaiting updates'}</dd></div>
              <div className="flex items-center justify-between gap-4 p-4"><dt className="text-sadu-muted">{isAr ? 'مخاطر مصعّدة' : 'Escalated risks'}</dt><dd className="font-mono font-bold text-sadu-charcoal">{formatNumber(0)}</dd></div>
              <div className="flex items-center justify-between gap-4 p-4"><dt className="text-sadu-muted">{isAr ? 'مصدر الحالة' : 'Status source'}</dt><dd className="font-bold text-sadu-ink">{isAr ? 'بيانات تجريبية' : 'Scenario data'}</dd></div>
            </dl>
          </Panel>
        }
        leftSpan="lg:col-span-2"
      />
    </section>
  );
}
