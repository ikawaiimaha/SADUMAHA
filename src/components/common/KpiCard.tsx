import React from 'react';
import { Language } from '../../types';
import { Activity, LucideIcon } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';

export interface KpiCardProps {
  titleEn?: string;
  titleAr?: string;
  title?: string;
  value: string | number;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  trendLabelEn?: string;
  trendLabelAr?: string;
  icon?: LucideIcon;
  subtitle?: string;
  statusColor?: string;
  onClick?: () => void;
  isActive?: boolean;
  filterLabel?: string;
  filterActiveText?: string;
  lang?: Language;
  alert?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = (props) => {
  const i18n = useI18n();
  const lang = props.lang ?? i18n.lang;
  const isAr = lang === 'ar';
  const Icon = props.icon ?? Activity;
  const Tag = props.onClick ? 'button' : 'div';
  const trendDirection = props.trendDirection ?? props.trend;

  return (
    <Tag onClick={props.onClick} type={props.onClick ? 'button' : undefined} aria-pressed={props.onClick ? !!props.isActive : undefined} className={`p-4 rounded-xl border flex flex-col justify-between min-h-[120px] text-start transition-all shadow-sm ${props.onClick ? 'cursor-pointer' : ''} ${props.isActive ? 'ring-2 ring-sadu-brick' : ''} ${
      props.alert 
        ? 'bg-amber-50 border-amber-300' 
        : 'bg-sadu-linen border-sadu-gold hover:border-sadu-brick/40 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between gap-3">
        {/* FIXED: Title is locked to 40px height so it never collapses */}
        <h3 className="text-xs font-bold text-sadu-charcoal h-10 line-clamp-2 leading-snug w-full">
          {props.title ?? (isAr ? props.titleAr : props.titleEn)}
        </h3>
        <div className={`p-2 rounded-lg shrink-0 ${props.alert ? 'bg-amber-100 text-amber-700' : 'bg-sadu-sand text-sadu-brick'}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-auto">
        <span className="text-2xl font-editorial font-bold text-sadu-ink leading-none">
          {props.value}
        </span>
        {props.trend && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            trendDirection === 'up' ? 'text-emerald-700 bg-emerald-100' :
            trendDirection === 'down' ? 'text-amber-700 bg-amber-100' :
            'text-sadu-muted bg-sadu-sand'
          }`}>
            {(isAr ? props.trendLabelAr : props.trendLabelEn) ?? (props.trendDirection ? props.trend : '')}
          </span>
        )}
      </div>
      {props.subtitle && <span className="text-[10px] text-sadu-muted mt-2">{props.subtitle}</span>}
      {props.filterLabel && <span className="text-[10px] text-sadu-brick mt-1">{props.isActive ? props.filterActiveText : props.filterLabel}</span>}
    </Tag>
  );
};
