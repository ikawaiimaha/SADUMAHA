import React from 'react';
import { Language, WorkspaceTab } from '../../types';
import { useI18n } from '../../context/I18nContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { KpiCard } from '../common/KpiCard';
import { PageHeader, Panel, StatGrid, TwoColumnLayout } from '../common/dashboard';
import { 
  AlertCircle, 
  Users, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Globe, 
  Calendar 
} from 'lucide-react';

export interface CoordinatorViewProps {
  lang?: Language;
  onNavigateTab?: (tab: WorkspaceTab) => void;
}

export const CoordinatorView: React.FC<CoordinatorViewProps> = (props) => {
  const i18n = useI18n();
  const workspace = useWorkspace();
  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const { formatNumber, localizeDigits } = i18n;
  const onNavigateTab = props.onNavigateTab ?? workspace.navigateTab;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        eyebrow={isAr ? 'غرفة التحكم' : 'Control Room'}
        title={isAr ? 'إدارة التنفيذ والاعتماد' : 'Operational Monitoring & Approvals'}
        description={isAr ? 'ملخص رئيسي لأداء البرامج، الملفات العالقة، وسير الاعتماد.' : 'High-level overview of programme health, blockers, and approval flow.'}
      />

      <StatGrid>
        <KpiCard
          titleEn="Pending Approvals" titleAr="اعتمادات معلقة"
          value={formatNumber(12)} trend="up" trendLabelEn="+3 from yesterday" trendLabelAr="زيادة ٣ عن الأمس"
          icon={Clock} lang={lang} alert={true}
        />
        <KpiCard
          titleEn="Artists Deployed" titleAr="فنانون معتمدون"
          value={formatNumber(145)} trend="up" trendLabelEn="Target: 150" trendLabelAr="المستهدف: ١٥٠"
          icon={Users} lang={lang}
        />
        <KpiCard
          titleEn="Global Festivals" titleAr="مهرجانات دولية"
          value={formatNumber(42)} icon={Globe} lang={lang}
        />
        <KpiCard
          titleEn="Venues Ready" titleAr="جاهزية المواقع"
          value={formatNumber(8)} trend="neutral" trendLabelEn="8 / 10 Active" trendLabelAr="٨ من ١٠ مواقع"
          icon={CheckCircle2} lang={lang}
        />
      </StatGrid>

      <TwoColumnLayout
        left={
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-editorial font-bold text-sadu-charcoal flex items-center gap-2">
                <Activity className="w-5 h-5 text-sadu-brick" />
                {isAr ? 'غرفة المتابعة والمهام العاجلة' : 'Attention Queue & Active Blockers'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {isAr ? `${formatNumber(4)} تنبيهات` : '4 Alerts'}
              </span>
            </div>

            <div className="space-y-3">
              {[
                { id: 1, type: 'committee', status: 'pending', titleEn: 'Jury Sign-off Required', titleAr: 'اعتماد لجنة التحكيم مطلوب', descEn: 'Youssef Nabhan text verification blocked.', descAr: 'نصوص يوسف نبهان تنتظر الاعتماد.', actionEn: 'Review', actionAr: 'مراجعة' },
                { id: 2, type: 'technical', status: 'blocked', titleEn: 'Floor Load Limits', titleAr: 'تحذير حمولة الأرضية', descEn: 'Sharjah Art Museum Gallery 4 limits exceeded.', descAr: 'تجاوز حدود الحمولة بمتحف الشارقة.', actionEn: 'Inspect', actionAr: 'معاينة' },
                { id: 3, type: 'finance', status: 'warning', titleEn: 'Advance Payment Delayed', titleAr: 'تأخر الدفعة المقدمة', descEn: 'Missing IBAN validation for international wire.', descAr: 'رقم الحساب البنكي غير معتمد.', actionEn: 'Notify', actionAr: 'إشعار' },
              ].map((item, idx) => (
                <Panel key={idx} className="bg-sadu-sand" padded={false}>
                  <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3 w-full max-w-xl">
                      {item.status === 'blocked' ? <AlertCircle className="w-5 h-5 text-sadu-brick shrink-0 mt-0.5" /> : <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                      <div>
                        <h3 className="font-bold text-sm text-sadu-charcoal">{isAr ? item.titleAr : item.titleEn}</h3>
                        <p className="text-xs text-sadu-muted mt-1 leading-relaxed">{isAr ? item.descAr : item.descEn}</p>
                      </div>
                    </div>
                    <button onClick={() => onNavigateTab('operations')} className="px-4 py-2 text-xs font-semibold rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-brick hover:text-white transition-colors whitespace-nowrap shrink-0 w-full md:w-auto">
                      {isAr ? item.actionAr : item.actionEn}
                    </button>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        }
        right={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-editorial font-bold text-sadu-charcoal flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sadu-ink" />
                {isAr ? 'البرامج النشطة' : 'Active Programmes'}
              </h2>
            </div>

            <Panel className="space-y-4" padded={false}>
              <div className="space-y-4 p-4">
                {[
                  { id: 'prog-1', titleEn: '12th Sharjah Calligraphy Biennial', titleAr: 'بينالي الشارقة للخط - الدورة 12', date: '2026 Oct - Dec', progress: 74 },
                  { id: 'prog-2', titleEn: 'Islamic Arts Festival (28th)', titleAr: 'مهرجان الفنون الإسلامية (28)', date: '2026 Dec - Jan', progress: 42 },
                  { id: 'prog-3', titleEn: 'Marrakech Poetry Festival', titleAr: 'مهرجان مراكش للشعر', date: '2026 Nov', progress: 88 },
                ].map((prog) => (
                  <div key={prog.id} className="border-b border-sadu-gold/30 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start gap-3 mb-1.5">
                      <h3 className="text-xs font-bold text-sadu-charcoal">{isAr ? prog.titleAr : prog.titleEn}</h3>
                      <span className="text-[10px] text-sadu-brick font-mono shrink-0 bg-sadu-sand px-1.5 rounded">{prog.progress}%</span>
                    </div>
                    <div className="w-full bg-sadu-sand h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div className="bg-sadu-ink h-full rounded-full" style={{ width: `${prog.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-sadu-muted block">{localizeDigits(prog.date)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        }
        leftSpan="lg:col-span-2"
      />
    </div>
  );
};
