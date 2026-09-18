import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Lock, 
  Sparkles, 
  Download, 
  Languages, 
  ShieldCheck,
  Edit3
} from 'lucide-react';

export const EditorialDashboard: React.FC = () => {
  const { isAr, formatNumber } = useI18n();

  // Bi-directional Arabic & English Content State
  const [catalogueEntries, setCatalogueEntries] = useState([
    {
      id: 'CAT-01',
      artistEn: 'Youssef Nabhan',
      artistAr: 'يوسف نبهان',
      artworkCode: 'SCB-2026-YN-02',
      titleEn: 'Kufic Horizon: Architectural Bronze & Black Oxide',
      titleAr: 'أفق كوفي: برونز معماري وأكسيد أسود مصفح',
      bioWordCountEn: 280,
      bioWordCountAr: 275,
      essayProofed: true,
      arabicCalligraphyVerified: true,
      curatorialStatementEn: 'Youssef Nabhan deconstructs historical Kufic proportions into spatial bronze extrusions, mediating the classical balance between monumental weight and geometric void.',
      curatorialStatementAr: 'يفكك يوسف نبهان النسب الهندسية للخط الكوفي القديم محولاً إياها إلى كتل برونزية فراغية تتوسط التوازن بين الثقل النحتي والفراغ المعماري المعاصر.',
      status: 'proofed' as 'draft' | 'proofed' | 'catalog_locked',
      highResTiffReceived: true,
    },
    {
      id: 'CAT-02',
      artistEn: 'Mounir Fatmi',
      artistAr: 'منير فاطمي',
      artworkCode: 'SCB-2026-MF-01',
      titleEn: 'Ghosting (Single-channel 4K Projection)',
      titleAr: 'الاختفاء المفاجئ (عرض فيديو بدقة 4K)',
      bioWordCountEn: 310,
      bioWordCountAr: 295,
      essayProofed: true,
      arabicCalligraphyVerified: true,
      curatorialStatementEn: 'Through rapid optical flickering, Fatmi interrogates the obsolescence of calligraphic reproduction in the post-digital age.',
      curatorialStatementAr: 'من خلال الوميض البصري المتسارع، يسائل فاطمي زوال النسخ الخطي في العصر الرقمي الفائق، مجسداً الذاكرة والنسيان.',
      status: 'catalog_locked' as 'draft' | 'proofed' | 'catalog_locked',
      highResTiffReceived: true,
    }
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLockCatalogue = (id: string) => {
    setCatalogueEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        return {
          ...entry,
          status: 'catalog_locked'
        };
      }
      return entry;
    }));
    setToastMessage(isAr ? 'تم تجميد واعتماد النص رسمياً للطباعة في مطبعة حكومة الشارقة' : 'Text locked & certified for Sharjah Government Press production.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 end-6 rtl:end-auto rtl:start-6 z-50 bg-sadu-brick text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-sadu-linen border border-sadu-gold rounded-lg p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sadu-brick uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>{isAr ? 'إدارة التحرير والنشر والكتالوج الرسمي للبينالي' : 'Biennale Editorial & Publishing Desk'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial font-bold text-sadu-charcoal">
              {isAr ? 'مكتب التحرير والترجمة والتوثيق الببليوغرافي' : 'Editorial, Translation & Catalogue Desk'}
            </h1>
            <p className="text-xs sm:text-sm text-sadu-muted mt-1">
              {isAr
                ? 'تدقيق ثنائي اللغة (عربي / إنجليزي)، تجميد النصوص للطباعة المتحفية، والتكامل مع هوية بينالي الشارقة للخط الدورة 11.'
                : 'Bilingual curatorial essays, calligraphic accuracy verification, and final text-lock for museum catalogue printing.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-sadu-sand border border-sadu-gold text-sadu-charcoal text-xs font-bold flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-sadu-brick" />
              <span>{isAr ? 'تدقيق لغوي ثنائي' : 'Bilingual Curatorial Desk'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Catalogue Entries & Proofing Queue */}
      <div className="space-y-4">
        {catalogueEntries.map(entry => {
          const isLocked = entry.status === 'catalog_locked';
          return (
            <div 
              key={entry.id}
              className="bg-white border border-sadu-gold rounded-lg p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sadu-gold/50 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sadu-ink text-white">
                      {entry.artworkCode}
                    </span>
                    <h3 className="font-bold text-sadu-charcoal text-base">
                      {isAr ? entry.titleAr : entry.titleEn}
                    </h3>
                  </div>
                  <span className="text-xs text-sadu-muted">
                    {isAr ? entry.artistAr : entry.artistEn}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <span className="text-xs font-bold px-3 py-1 rounded bg-sadu-sage-light border border-sadu-sage text-sadu-ink flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-sadu-sage" />
                      <span>{isAr ? 'نص مجمد للطباعة' : 'Catalogue Locked'}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleLockCatalogue(entry.id)}
                      className="px-3.5 py-1.5 rounded bg-sadu-brick hover:bg-sadu-brick-dark text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اعتماد وتجميد النص (Lock)' : 'Certify & Lock Text'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Side-by-Side Arabic & English Essays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Arabic Curatorial Statement */}
                <div className="p-4 rounded bg-sadu-linen/40 border border-sadu-gold/60 space-y-2">
                  <div className="flex items-center justify-between font-bold text-sadu-charcoal">
                    <span>النص القيّمي باللغة العربية (المعتمد)</span>
                    <span className="text-[10px] font-mono text-sadu-muted">٢٧٥ كلمة</span>
                  </div>
                  <p className="text-sadu-charcoal leading-relaxed font-serif">
                    {entry.curatorialStatementAr}
                  </p>
                  <div className="text-[10px] text-emerald-800 font-semibold pt-1 border-t border-sadu-gold/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>تم التحقق من دقة المصطلحات الخطية الكوفية وتشكيل الحروف</span>
                  </div>
                </div>

                {/* English Curatorial Statement */}
                <div className="p-4 rounded bg-sadu-linen/40 border border-sadu-gold/60 space-y-2">
                  <div className="flex items-center justify-between font-bold text-sadu-charcoal">
                    <span>Curatorial Statement (English)</span>
                    <span className="text-[10px] font-mono text-sadu-muted">280 words</span>
                  </div>
                  <p className="text-sadu-charcoal leading-relaxed font-serif">
                    {entry.curatorialStatementEn}
                  </p>
                  <div className="text-[10px] text-emerald-800 font-semibold pt-1 border-t border-sadu-gold/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>Peer-reviewed for international catalog distribution</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
