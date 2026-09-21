import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Language, RoleKey, WorkspaceTab, ExhibitionProgramme } from '../types';
import { ROLE_PROFILES, PROGRAMMES } from '../data/mockData';
import { useI18n } from '../context/I18nContext';
import { LOCALES } from '../i18n/locales';
import { 
  Search, 
  Command, 
  ArrowRight, 
  CornerDownLeft, 
  X, 
  LayoutDashboard, 
  FileText, 
  Lock, 
  FileSignature, 
  Wrench, 
  MessageSquare, 
  Archive, 
  UserCheck, 
  Layers, 
  SlidersHorizontal, 
  Globe, 
  BookOpen, 
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Award,
  Scale,
  Zap,
  Printer,
  FileCheck
} from 'lucide-react';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  currentRole: RoleKey;
  selectedProgramme: ExhibitionProgramme;
  scopeLocked?: boolean;
  onNavigateTab: (tab: WorkspaceTab) => void;
  onSelectRole: (role: RoleKey) => void;
  onSelectProgramme: (programme: ExhibitionProgramme) => void;
  onOpenStory: () => void;
  onOpenPresenter: () => void;
  onToggleLanguage: () => void;
  onToggleDensity: () => void;
  onOpenNewContract?: () => void;
  onExportPdf?: () => void;
}

export type CommandCategory = 'all' | 'workflows' | 'workspaces' | 'roles' | 'programmes' | 'actions';

export interface CommandItem {
  id: string;
  category: 'workflows' | 'workspaces' | 'roles' | 'programmes' | 'actions';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  shortcut?: string[];
  hotkey?: string;
  keywords?: string[];
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  lang,
  currentRole,
  selectedProgramme,
  scopeLocked = false,
  onNavigateTab,
  onSelectRole,
  onSelectProgramme,
  onOpenStory,
  onOpenPresenter,
  onToggleLanguage,
  onToggleDensity,
  onOpenNewContract,
  onExportPdf,
}) => {
  const i18n = useI18n();
  const currentLang = lang || i18n.lang;
  const isAr = currentLang === 'ar';
  const dict = LOCALES[currentLang].commandPalette;
  const common = LOCALES[currentLang].common;
  const navDict = LOCALES[currentLang].navigation;

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedCategory('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global hotkey listeners for power users
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette (Cmd+K / Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }

      // Escape closes palette
      if (e.key === 'Escape' && isOpen) {
        onClose();
        return;
      }

      // Power-user institutional workflow shortcuts using Alt/Option
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        
        switch (key) {
          case 'a':
            e.preventDefault();
            onNavigateTab('archive');
            onClose();
            break;
            
          case 'n':
            e.preventDefault();
            if (onOpenNewContract) {
              onOpenNewContract();
            } else {
              onNavigateTab('contracts');
            }
            onClose();
            break;

          case 'c':
            e.preventDefault();
            onNavigateTab('contracts');
            onClose();
            break;

          case 's':
            e.preventDefault();
            onNavigateTab('approved-scope');
            onClose();
            break;

          case 'd':
            e.preventDefault();
            onNavigateTab('dossiers');
            onClose();
            break;

          case 'o':
            e.preventDefault();
            onNavigateTab('operations');
            onClose();
            break;

          case 'm':
            e.preventDefault();
            onNavigateTab('communications');
            onClose();
            break;

          case 'l':
            e.preventDefault();
            onToggleLanguage();
            onClose();
            break;

          case 'p':
            e.preventDefault();
            if (onExportPdf) {
              onExportPdf();
            } else {
              window.print();
            }
            onClose();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose, onNavigateTab, onOpenNewContract, onToggleLanguage, onExportPdf]);

  // Assemble list of all navigable items with centralized dictionary strings
  const allCommands = useMemo<CommandItem[]>(() => {
    const wf = dict.workflows;
    const acts = dict.actions;

    const items: CommandItem[] = [
      // ==========================================
      // High-Priority Institutional Fast Workflows
      // ==========================================
      {
        id: 'act-jump-archive',
        category: 'workflows',
        title: wf.archiveTitle,
        subtitle: wf.archiveSubtitle,
        icon: Archive,
        badge: wf.archiveBadge,
        shortcut: ['⌥', 'A'],
        hotkey: 'a',
        keywords: ['archive', 'sovereign', 'dossier', 'manifest', 'seal', 'أرشيف', 'ذاكرة', 'إغلاق', 'وثائق', 'حفظ', 'ga'],
        action: () => {
          onNavigateTab('archive');
          onClose();
        },
      },
      {
        id: 'act-new-contract',
        category: 'workflows',
        title: wf.newContractTitle,
        subtitle: wf.newContractSubtitle,
        icon: FileSignature,
        badge: wf.newContractBadge,
        shortcut: ['⌥', 'N'],
        hotkey: 'n',
        keywords: ['contract', 'new', 'request', 'legal', 'covenant', 'form 1b', 'honorarium', 'عقد', 'اتفاقية', 'صياغة', 'جديد', 'ميثاق', 'nc'],
        action: () => {
          if (onOpenNewContract) {
            onOpenNewContract();
          } else {
            onNavigateTab('contracts');
          }
          onClose();
        },
      },
      {
        id: 'act-jump-contracts',
        category: 'workflows',
        title: wf.contractsTitle,
        subtitle: wf.contractsSubtitle,
        icon: FileCheck,
        badge: wf.contractsBadge,
        shortcut: ['⌥', 'C'],
        hotkey: 'c',
        keywords: ['contracts', 'bilateral', 'ledger', 'legal', 'directorate', 'عقود', 'مسار', 'توثيق', 'gc'],
        action: () => {
          onNavigateTab('contracts');
          onClose();
        },
      },
      {
        id: 'act-jump-scope',
        category: 'workflows',
        title: wf.scopeTitle,
        subtitle: wf.scopeSubtitle,
        icon: Lock,
        badge: wf.scopeBadge,
        shortcut: ['⌥', 'S'],
        hotkey: 's',
        keywords: ['scope', 'frozen', 'v1.2', 'specifications', 'dimensions', 'exclusion', 'نطاق', 'مواصفات', 'مجمدة', 'gs'],
        action: () => {
          onNavigateTab('approved-scope');
          onClose();
        },
      },
      {
        id: 'act-jump-dossiers',
        category: 'workflows',
        title: wf.dossiersTitle,
        subtitle: wf.dossiersSubtitle,
        icon: Scale,
        badge: wf.dossiersBadge,
        shortcut: ['⌥', 'D'],
        hotkey: 'd',
        keywords: ['dossiers', 'jury', 'committee', 'curatorial', 'conditions', 'rubrics', 'لجنة', 'تحكيم', 'محضر', 'شروط', 'gd'],
        action: () => {
          onNavigateTab('dossiers');
          onClose();
        },
      },
      {
        id: 'act-jump-ops',
        category: 'workflows',
        title: wf.operationsTitle,
        subtitle: wf.operationsSubtitle,
        icon: Wrench,
        badge: wf.operationsBadge,
        shortcut: ['⌥', 'O'],
        hotkey: 'o',
        keywords: ['operations', 'engineering', 'customs', 'floor load', 'travel', 'iban', 'عمليات', 'هندسة', 'حمولة', 'جمارك', 'go'],
        action: () => {
          onNavigateTab('operations');
          onClose();
        },
      },
      {
        id: 'act-jump-comms',
        category: 'workflows',
        title: wf.communicationsTitle,
        subtitle: wf.communicationsSubtitle,
        icon: MessageSquare,
        badge: wf.communicationsBadge,
        shortcut: ['⌥', 'M'],
        hotkey: 'm',
        keywords: ['communications', 'messages', 'gateway', 'thread', 'letters', 'مراسلات', 'رسائل', 'بوابة', 'gm'],
        action: () => {
          onNavigateTab('communications');
          onClose();
        },
      },
      {
        id: 'act-toggle-lang',
        category: 'workflows',
        title: wf.toggleLangTitle,
        subtitle: wf.toggleLangSubtitle,
        icon: Globe,
        badge: currentLang === 'en' ? 'AR' : 'EN',
        shortcut: ['⌥', 'L'],
        hotkey: 'l',
        keywords: ['language', 'arabic', 'english', 'bilingual', 'translate', 'لغة', 'عربي', 'إنجليزي', 'ترجمة'],
        action: () => {
          onToggleLanguage();
          onClose();
        },
      },
      {
        id: 'act-export-pdf',
        category: 'workflows',
        title: wf.exportPdfTitle,
        subtitle: wf.exportPdfSubtitle,
        icon: Printer,
        badge: wf.exportPdfBadge,
        shortcut: ['⌥', 'P'],
        hotkey: 'p',
        keywords: ['pdf', 'report', 'print', 'download', 'export', 'تقرير', 'طباعة', 'تصدير', 'سجل'],
        action: () => {
          if (onExportPdf) {
            onExportPdf();
          } else {
            window.print();
          }
          onClose();
        },
      },

      // ==========================================
      // Workspaces Overview
      // ==========================================
      {
        id: 'ws-overview',
        category: 'workspaces',
        title: isAr ? 'الرئيسية / لوحة المتابعة' : 'Dashboard / Overview',
        subtitle: isAr ? 'نظرة عامة على الدور الحالي والموضوعات ذات الأولوية' : 'Overview of the current role and priority matters',
        icon: LayoutDashboard,
        badge: 'Desk',
        action: () => {
          onNavigateTab('overview');
          onClose();
        },
      },

      // ==========================================
      // Institutional Perspectives (Roles)
      // ==========================================
      ...Object.entries(ROLE_PROFILES).map(([rk, prof]) => ({
        id: `role-${rk}`,
        category: 'roles' as const,
        title: isAr ? `تبديل المنظور: ${prof.nameAr}` : `Switch Perspective: ${prof.nameEn}`,
        subtitle: isAr ? prof.titleAr : prof.titleEn,
        icon: UserCheck,
        badge: rk,
        keywords: ['role', 'perspective', 'switch', rk.toLowerCase(), prof.nameEn.toLowerCase(), prof.nameAr],
        action: () => {
          onSelectRole(rk as RoleKey);
          onClose();
        },
      })),

      // ==========================================
      // Exhibition Programmes
      // ==========================================
      ...(scopeLocked ? [] : PROGRAMMES).map(prog => ({
        id: `prog-${prog.id}`,
        category: 'programmes' as const,
        title: isAr ? `المعرض: ${prog.titleAr}` : `Programme: ${prog.titleEn}`,
        subtitle: isAr ? `${prog.venueAr} (${prog.dates})` : `${prog.venueEn} (${prog.dates})`,
        icon: Layers,
        badge: prog.status.toUpperCase(),
        keywords: ['programme', 'exhibition', 'biennial', prog.id.toLowerCase(), prog.titleEn.toLowerCase(), prog.titleAr],
        action: () => {
          onSelectProgramme(prog);
          onClose();
        },
      })),

      // ==========================================
      // Operational Actions & Presentation Utilities
      // ==========================================
      {
        id: 'act-story',
        category: 'actions',
        title: acts.storyTitle,
        subtitle: acts.storySubtitle,
        icon: BookOpen,
        badge: 'Story',
        keywords: ['story', 'presentation', 'chapters', 'walkthrough', 'قصة', 'عرض'],
        action: () => {
          onOpenStory();
          onClose();
        },
      },
      {
        id: 'act-presenter',
        category: 'actions',
        title: acts.presenterTitle,
        subtitle: acts.presenterSubtitle,
        icon: Sparkles,
        badge: 'Audit',
        keywords: ['presenter', 'architecture', 'audit', 'raci', 'matrix', 'معمارية', 'تدقيق'],
        action: () => {
          onOpenPresenter();
          onClose();
        },
      },
      {
        id: 'act-personas',
        category: 'actions',
        title: acts.personasTitle,
        subtitle: acts.personasSubtitle,
        icon: Award,
        badge: 'Executive',
        keywords: ['leadership', 'persona', 'ruler', 'chairman', 'director', 'قيادة', 'محاكاة'],
        action: () => {
          onSelectRole('LEADERSHIP');
          onNavigateTab('overview');
          onClose();
        },
      },
      {
        id: 'act-density',
        category: 'actions',
        title: acts.densityTitle,
        subtitle: acts.densitySubtitle,
        icon: SlidersHorizontal,
        badge: 'View',
        shortcut: ['⌥', 'T'],
        hotkey: 't',
        keywords: ['density', 'compact', 'comfortable', 'view', 'كثافة', 'عرض'],
        action: () => {
          onToggleDensity();
          onClose();
        },
      },
    ];

    return items;
  }, [
    dict,
    scopeLocked,
    isAr,
    currentLang,
    onNavigateTab, 
    onSelectRole, 
    onSelectProgramme, 
    onOpenStory, 
    onOpenPresenter, 
    onToggleLanguage, 
    onToggleDensity, 
    onOpenNewContract,
    onExportPdf,
    onClose
  ]);

  // Filter commands based on search term and selected category tab
  const filteredCommands = useMemo(() => {
    let list = allCommands;

    if (selectedCategory !== 'all') {
      list = list.filter(cmd => cmd.category === selectedCategory);
    }

    if (!query.trim()) return list;

    const q = query.toLowerCase().trim();
    return list.filter(cmd => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchSubtitle = cmd.subtitle && cmd.subtitle.toLowerCase().includes(q);
      const matchBadge = cmd.badge && cmd.badge.toLowerCase().includes(q);
      const matchCategory = cmd.category.toLowerCase().includes(q);
      const matchKeywords = cmd.keywords && cmd.keywords.some(k => k.toLowerCase().includes(q));
      const matchHotkey = cmd.hotkey && cmd.hotkey.toLowerCase() === q;
      return matchTitle || matchSubtitle || matchBadge || matchCategory || matchKeywords || matchHotkey;
    });
  }, [allCommands, query, selectedCategory]);

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const categories: CommandCategory[] = ['all', 'workflows', 'workspaces', 'roles', 'programmes', 'actions'];
      const currentIndex = categories.indexOf(selectedCategory);
      const nextCategory = categories[(currentIndex + 1) % categories.length];
      setSelectedCategory(nextCategory);
      setSelectedIndex(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-sadu-charcoal/65 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-sadu-linen border-2 border-sadu-gold rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Header */}
        <div className="relative border-b border-sadu-gold px-4 py-3 bg-sadu-sand/60 flex items-center gap-3">
          <Search className="w-5 h-5 text-sadu-brick shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={dict.placeholder}
            className="w-full bg-transparent text-sm sm:text-base text-sadu-charcoal placeholder-sadu-muted focus:outline-hidden"
          />
          {query && (
            <button 
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              aria-label={common.clear}
              className="text-sadu-muted hover:text-sadu-charcoal p-1 text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-sadu-muted bg-sadu-linen px-2 py-0.5 rounded border border-sadu-gold">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="px-3 py-2 bg-sadu-sand/40 border-b border-sadu-gold/50 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
          <button
            onClick={() => { setSelectedCategory('all'); setSelectedIndex(0); }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-sadu-brick text-white'
                : 'text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand'
            }`}
          >
            {dict.categoryAll}
          </button>
          <button
            onClick={() => { setSelectedCategory('workflows'); setSelectedIndex(0); }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedCategory === 'workflows'
                ? 'bg-sadu-brick text-white'
                : 'text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{dict.categoryWorkflows}</span>
          </button>
          <button
            onClick={() => { setSelectedCategory('workspaces'); setSelectedIndex(0); }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'workspaces'
                ? 'bg-sadu-brick text-white'
                : 'text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand'
            }`}
          >
            {dict.categoryWorkspaces}
          </button>
          <button
            onClick={() => { setSelectedCategory('roles'); setSelectedIndex(0); }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'roles'
                ? 'bg-sadu-brick text-white'
                : 'text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand'
            }`}
          >
            {dict.categoryRoles}
          </button>
          <button
            onClick={() => { setSelectedCategory('programmes'); setSelectedIndex(0); }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'programmes'
                ? 'bg-sadu-brick text-white'
                : 'text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand'
            }`}
          >
            {dict.categoryProgrammes}
          </button>
          <button
            onClick={() => { setSelectedCategory('actions'); setSelectedIndex(0); }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'actions'
                ? 'bg-sadu-brick text-white'
                : 'text-sadu-muted hover:text-sadu-charcoal hover:bg-sadu-sand'
            }`}
          >
            {dict.categoryActions}
          </button>
        </div>

        {/* Results List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-sadu-gold/30 divide-dashed space-y-1"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-sadu-muted">
              <Search className="w-8 h-8 mx-auto text-sadu-gold mb-2 opacity-50" />
              <p className="font-semibold text-sm text-sadu-charcoal">
                {dict.emptyTitle}
              </p>
              <p className="mt-1 leading-relaxed">
                {dict.emptyDesc}
              </p>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-start px-3.5 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected 
                      ? 'bg-sadu-brick text-white' 
                      : 'hover:bg-sadu-sand text-sadu-charcoal'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-md shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-sadu-sand text-sadu-ink border border-sadu-gold'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm truncate">
                          {cmd.title}
                        </span>
                        {cmd.badge && (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                            isSelected 
                              ? 'bg-white/25 text-white' 
                              : 'bg-sadu-gold/30 text-sadu-brick'
                          }`}>
                            {cmd.badge}
                          </span>
                        )}
                      </div>
                      {cmd.subtitle && (
                        <p className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-white/80' : 'text-sadu-muted'
                        }`}>
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <div className="flex items-center gap-1">
                        {cmd.shortcut.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 font-mono text-[10px] font-bold rounded shadow-2xs transition-colors ${
                              isSelected
                                ? 'bg-white/30 text-white border border-white/50'
                                : 'bg-sadu-linen text-sadu-brick border border-sadu-gold'
                            }`}
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    )}

                    {isSelected && (
                      <span className="hidden sm:flex text-[11px] items-center gap-1 font-mono text-white/90 ps-1">
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar with clickable power-user shortcuts cheat-sheet */}
        <div className="border-t border-sadu-gold px-4 py-2.5 bg-sadu-sand text-[11px] text-sadu-muted flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Quick Clickable Workflows */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-sadu-charcoal flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>{dict.shortcutsTitle}</span>
            </span>

            <button
              onClick={() => { onNavigateTab('archive'); onClose(); }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rtl:px-2 rtl:py-1 rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-gold/20 transition-colors cursor-pointer"
              title={dict.workflows.archiveTitle}
            >
              <kbd className="font-mono text-[10px] font-bold text-sadu-brick">⌥A</kbd>
              <span>{navDict.tabs.archive}</span>
            </button>

            <button
              onClick={() => { 
                if (onOpenNewContract) { onOpenNewContract(); } else { onNavigateTab('contracts'); }
                onClose(); 
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rtl:px-2 rtl:py-1 rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-gold/20 transition-colors cursor-pointer"
              title={dict.workflows.newContractTitle}
            >
              <kbd className="font-mono text-[10px] font-bold text-sadu-brick">⌥N</kbd>
              <span>{dict.workflows.newContractBadge}</span>
            </button>

            <button
              onClick={() => { onNavigateTab('contracts'); onClose(); }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rtl:px-2 rtl:py-1 rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-gold/20 transition-colors cursor-pointer"
              title={dict.workflows.contractsTitle}
            >
              <kbd className="font-mono text-[10px] font-bold text-sadu-brick">⌥C</kbd>
              <span>{navDict.tabs.contracts}</span>
            </button>

            <button
              onClick={() => { onNavigateTab('approved-scope'); onClose(); }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rtl:px-2 rtl:py-1 rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-gold/20 transition-colors cursor-pointer"
              title={dict.workflows.scopeTitle}
            >
              <kbd className="font-mono text-[10px] font-bold text-sadu-brick">⌥S</kbd>
              <span>{dict.workflows.scopeBadge}</span>
            </button>

            <button
              onClick={() => { onNavigateTab('dossiers'); onClose(); }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rtl:px-2 rtl:py-1 rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-gold/20 transition-colors cursor-pointer"
              title={dict.workflows.dossiersTitle}
            >
              <kbd className="font-mono text-[10px] font-bold text-sadu-brick">⌥D</kbd>
              <span>{dict.workflows.dossiersBadge}</span>
            </button>

            <button
              onClick={() => { onToggleLanguage(); onClose(); }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rtl:px-2 rtl:py-1 rounded bg-sadu-linen border border-sadu-gold text-sadu-charcoal hover:bg-sadu-gold/20 transition-colors cursor-pointer"
              title={dict.workflows.toggleLangTitle}
            >
              <kbd className="font-mono text-[10px] font-bold text-sadu-brick">⌥L</kbd>
              <span>{currentLang === 'en' ? 'عربي' : 'EN'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-sadu-muted">
            <span className="flex items-center gap-0.5">
              <kbd className="bg-sadu-linen px-1 rounded border border-sadu-gold">↑↓</kbd>
              <span>{dict.navigateHint}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <kbd className="bg-sadu-linen px-1 rounded border border-sadu-gold">↵</kbd>
              <span>{dict.selectHint}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-0.5">
              <kbd className="bg-sadu-linen px-1 rounded border border-sadu-gold">Tab</kbd>
              <span>{dict.filterHint}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
