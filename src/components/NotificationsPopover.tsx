import React from 'react';
import { Language, WorkspaceTab } from '../types';
import { ATTENTION_ITEMS } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Wrench, 
  FileSignature, 
  ShieldCheck, 
  DollarSign, 
  Truck,
  ExternalLink
} from 'lucide-react';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onNavigateTab: (tab: WorkspaceTab) => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  lang,
  onNavigateTab,
}) => {
  const isAr = lang === 'ar';
  const { formatNumber } = useI18n();
  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return Wrench;
      case 'contract':
        return FileSignature;
      case 'condition':
        return Truck;
      case 'finance':
        return DollarSign;
      default:
        return AlertTriangle;
    }
  };

  const handleItemClick = (category: string) => {
    if (category === 'technical' || category === 'condition' || category === 'finance' || category === 'visa') {
      onNavigateTab('operations');
    } else if (category === 'contract') {
      onNavigateTab('contracts');
    } else {
      onNavigateTab('overview');
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
      />

      {/* Popover Card */}
      <div className="absolute end-0 top-full mt-2 w-80 sm:w-96 bg-sadu-linen border-2 border-sadu-gold rounded-lg shadow-2xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100">
        <div className="p-3.5 bg-sadu-ink text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-300" />
            <span className="font-bold text-sm">
              {isAr ? 'تنبيهات الانتباه والمسارات الحرجة' : 'Institutional Attention Feed'}
            </span>
          </div>
          <span className="bg-amber-400 text-sadu-charcoal font-bold text-[10px] px-1.5 py-0.5 rounded-full">
            {isAr ? `${formatNumber(3)} نشطة` : '3 Active'}
          </span>
        </div>

        <div className="p-2 divide-y divide-sadu-gold/40 max-h-80 overflow-y-auto">
          {ATTENTION_ITEMS.slice(0, 4).map((item) => {
            const Icon = getCategoryIcon(item.category);
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.category)}
                className="w-full text-start p-2.5 hover:bg-sadu-sand rounded-md transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className={`p-1.5 rounded mt-0.5 shrink-0 ${
                  item.priority === 'critical' 
                    ? 'bg-red-100 text-red-800' 
                    : item.priority === 'high' 
                    ? 'bg-amber-100 text-amber-900' 
                    : 'bg-sadu-sage-light text-sadu-ink'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-sadu-charcoal text-[11px] truncate group-hover:text-sadu-brick">
                      {isAr ? item.titleAr : item.titleEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-sadu-muted">
                    <span className="font-medium text-sadu-ink">
                      {isAr ? item.artistAr : item.artistEn}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {isAr ? `${formatNumber(item.dueDays)} أيام متبقية` : `${item.dueDays}d remaining`}
                    </span>
                  </div>
                </div>

                <ExternalLink className="w-3 h-3 text-sadu-muted group-hover:text-sadu-brick shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>

        <div className="p-2.5 bg-sadu-sand border-t border-sadu-gold flex items-center justify-between text-[11px]">
          <span className="text-sadu-muted">
            {isAr ? 'إجراءات معلقة تتطلب اعتماد' : 'Unresolved handoffs in ledger'}
          </span>
          <button
            onClick={() => {
              onNavigateTab('overview');
              onClose();
            }}
            className="font-bold text-sadu-brick hover:underline cursor-pointer"
          >
            {isAr ? 'عرض غرفة التحكم الكاملة ←' : 'Open Control Room →'}
          </button>
        </div>
      </div>
    </>
  );
};
