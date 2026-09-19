import React from 'react';
import { UserRole, WorkspaceTab } from '../types';
import { ROLE_PROFILES } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  LayoutDashboard, 
  FileText, 
  Lock, 
  FileSignature, 
  Wrench, 
  MessageSquare, 
  Archive,
  ChevronRight,
  Shield,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  Users
} from 'lucide-react';

interface SidebarNavProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  className?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  collapsed = false,
  onToggleCollapse,
  onNavigateTab,
  className = '',
}) => {
  const { lang, isAr, formatNumber } = useI18n();
  const { currentRole, activeTab, setActiveTab } = useWorkspace();

  const handleNavigate = (tab: WorkspaceTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const roleProfile = ROLE_PROFILES[currentRole];

  // Dynamic label for the overview / primary desk tab based on role
  const getRoleOverviewLabel = () => {
    switch (currentRole) {
      case 'DIRECTORATE':
      case 'LEADERSHIP':
        return { en: 'Executive Directorate', ar: 'القيادة التنفيذية' };
      case 'COORDINATOR':
        return { en: 'Control Room (41)', ar: `غرفة التحكم (${formatNumber(41)})` };
      case 'COMMITTEE':
        return { en: 'Curatorial Jury', ar: 'التحكيم الفني' };
      case 'TECHNICAL_MUSEUM':
      case 'TECHNICAL':
      case 'VENUE_ADMIN':
        return { en: 'Technical & SAM Loop', ar: 'الهندسة وتصاريح SAM' };
      case 'PR_PROTOCOL':
      case 'PR_VISA':
        return { en: 'PR & Protocol Gate', ar: 'المراسم والبروتوكول' };
      case 'EDITORIAL':
        return { en: 'Editorial & Catalogue', ar: 'التحرير والكتالوج' };
      case 'FINANCE':
        return { en: 'Finance & Compliance', ar: 'المالية والمشتريات' };
      case 'LOGISTICS':
        return { en: 'Freight & Movement', ar: 'الشحن واللوجستيات' };
      case 'ARTIST':
        return { en: 'Artist Studio', ar: 'استوديو الفنان' };
      case 'ARCHIVE':
        return { en: 'Permanent Archive', ar: 'الأرشيف الدائم' };
      default:
        return { en: 'Role Overview', ar: 'نظرة عامة على الدور' };
    }
  };

  const overviewLabel = getRoleOverviewLabel();

  // Master definition of all workspace navigation items
  const allNavItems: {
    id: WorkspaceTab;
    icon: React.ElementType;
    labelEn: string;
    labelAr: string;
    tagEn: string;
    tagAr: string;
    descriptionEn: string;
    descriptionAr: string;
  }[] = [
    { 
      id: 'overview', 
      icon: LayoutDashboard, 
      labelEn: overviewLabel.en, 
      labelAr: overviewLabel.ar,
      tagEn: 'Primary',
      tagAr: 'الرئيسي',
      descriptionEn: 'Role-specific active operating desk and immediate tasks',
      descriptionAr: 'المكتب التشغيلي المباشر والمهام العاجلة الخاصة بالدور'
    },
    { 
      id: 'dossiers', 
      icon: FileText, 
      labelEn: 'Curatorial Dossiers', 
      labelAr: 'ملفات الاختيار والتحكيم',
      tagEn: 'Jury',
      tagAr: 'التحكيم',
      descriptionEn: 'Artwork proposals, visual scoring, and jury evaluations',
      descriptionAr: 'المقترحات الفنية والتقييم البصري وملاحظات المحكمين'
    },
    { 
      id: 'approved-scope', 
      icon: Lock, 
      labelEn: 'Approved Scope (v1.2)', 
      labelAr: 'النطاق المعتمد (v1.2)',
      tagEn: 'Frozen',
      tagAr: 'مجمد',
      descriptionEn: 'Certified specs, dimensions, weights, and production requirements',
      descriptionAr: 'المواصفات المجمدة والأبعاد والأوزان المعتمدة نهائياً'
    },
    { 
      id: 'contracts', 
      icon: FileSignature, 
      labelEn: 'Contracts & Legal', 
      labelAr: 'العقود النظامية والتواقيع',
      tagEn: 'Legal',
      tagAr: 'قانوني',
      descriptionEn: 'Digital signature workflows, LPOs, and financial compliance',
      descriptionAr: 'مسارات التوقيع الرقمي وأوامر الشراء والالتزامات المالية'
    },
    { 
      id: 'operations', 
      icon: Wrench, 
      labelEn: 'Specialist Operations', 
      labelAr: 'العمليات التخصصية والميدان',
      tagEn: 'Gates',
      tagAr: 'بوابات',
      descriptionEn: 'Technical venue permits, protocol visas, editorial, and freight',
      descriptionAr: 'تصاريح المتحف، تأشيرات المراسم، تحرير الكتالوج، وإجراءات الشحن'
    },
    { 
      id: 'communications', 
      icon: MessageSquare, 
      labelEn: 'Official Messages', 
      labelAr: 'المراسلات الرسمية الموثقة',
      tagEn: 'Audit',
      tagAr: 'توثيق',
      descriptionEn: 'Audit-logged direct correspondence between artists and leads',
      descriptionAr: 'مراسلات موثقة رقابياً بين الفنانين ورؤساء الأقسام'
    },
    { 
      id: 'archive', 
      icon: Archive, 
      labelEn: 'Archive & Closeout', 
      labelAr: 'الأرشيف والإغلاق الدائم',
      tagEn: 'Permanent',
      tagAr: 'دائم',
      descriptionEn: 'Permanent institutional repository, seal certificates, and audit trails',
      descriptionAr: 'المستودع المؤسسي الدائم وشهادات الإغلاق وسجلات التدقيق'
    },
  ];

  // Enforce Data Minimization: dynamically filter navigation links strictly to role's permittedViews
  const permittedViews = roleProfile?.permittedViews || ['overview'];
  const allowedItems = allNavItems.filter(item => permittedViews.includes(item.id));

  return (
    <aside 
      className={`bg-sadu-linen border-e border-sadu-gold/70 flex flex-col shrink-0 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}
      aria-label={isAr ? 'القائمة الجانبية للتنقل' : 'Sidebar Navigation'}
    >
      {/* Sidebar Header: Role Identity & Privilege Indicator */}
      <div className="p-3.5 border-b border-sadu-gold/60 bg-sadu-sand/40">
        {!collapsed ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-sadu-brick flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sadu-brick" />
                <span>{isAr ? 'الصلاحيات النشطة' : 'RBAC Clearance'}</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-sadu-brick/10 text-sadu-brick border border-sadu-brick/20">
                {currentRole}
              </span>
            </div>
            <div className="font-semibold text-xs text-sadu-ink truncate">
              {isAr ? roleProfile?.nameAr : roleProfile?.nameEn}
            </div>
            <div className="text-[11px] text-sadu-muted truncate">
              {isAr ? roleProfile?.titleAr : roleProfile?.titleEn}
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`${currentRole}: ${isAr ? roleProfile?.nameAr : roleProfile?.nameEn}`}>
            <div className="w-8 h-8 rounded-md bg-sadu-brick/10 border border-sadu-brick/30 text-sadu-brick font-bold flex items-center justify-center text-xs">
              {currentRole.slice(0, 2)}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Nav Items strictly filtered by Role Profile */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold text-sadu-muted uppercase tracking-wider flex items-center justify-between">
            <span>{isAr ? 'المسارات المصرح بها' : 'Permitted Views'}</span>
            <span className="text-[10px] text-sadu-brick font-mono font-bold">
              {isAr ? `${formatNumber(allowedItems.length)} أقسام` : `${allowedItems.length} active`}
            </span>
          </div>
        )}

        {allowedItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full text-start group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-sadu-brick text-white font-bold shadow-xs'
                  : 'text-sadu-charcoal hover:bg-sadu-sand hover:text-sadu-ink'
              }`}
              title={collapsed ? (isAr ? item.labelAr : item.labelEn) : undefined}
            >
              <Icon 
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-sadu-muted group-hover:text-sadu-brick'
                }`} 
              />
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                    <span 
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-sadu-gold/30 text-sadu-ink group-hover:bg-sadu-gold/50'
                      }`}
                    >
                      {isAr ? item.tagAr : item.tagEn}
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role Scope Notice at bottom */}
      {!collapsed && (
        <div className="p-3 border-t border-sadu-gold/50 bg-sadu-sand/30 text-[10px] text-sadu-muted">
          <div className="font-semibold text-sadu-ink mb-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{isAr ? 'عزل البيانات المشدد' : 'Strict Data Minimization'}</span>
          </div>
          <p className="line-clamp-2 leading-relaxed">
            {isAr ? roleProfile?.scopeAr : roleProfile?.scopeEn}
          </p>
        </div>
      )}
    </aside>
  );
};
