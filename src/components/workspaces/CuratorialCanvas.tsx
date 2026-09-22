import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { Map, Workflow, Maximize, Zap, Volume2, Weight, Sun, Ruler, AlertTriangle, Move } from 'lucide-react';

const placements = [
  { code: 'SCB-YN-02', titleEn: 'Kufic Horizon', titleAr: 'أفق كوفي', weight: '84kg' },
  { code: 'SCB-NM-01', titleEn: 'Tectonic Whispers', titleAr: 'همس البنية', weight: '140kg' },
];

export const CuratorialCanvas: React.FC = () => {
  const { isAr } = useI18n();
  const [viewMode, setViewMode] = useState<'blueprint' | 'flow'>('blueprint');
  const label = (en: string, ar: string) => isAr ? ar : en;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 border-b border-sadu-gold/40 pb-2 sm:flex-row sm:items-center">
        <div>
          <span className="mb-1 inline-block rounded border border-sadu-gold/50 bg-sadu-sand px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest text-sadu-brick">{label('Smart Floorplan', 'مخطط ذكي')}</span>
          <h3 className="flex items-center gap-2 text-lg font-editorial font-bold text-sadu-charcoal"><Map className="h-5 w-5 text-sadu-brick" />{label('Curatorial Spatial Canvas', 'اللوحة التقييمية والمكانية')}</h3>
          <p className="mt-1 text-xs text-sadu-muted">{label('Live architectural blueprint: maps artworks to physical space and generates engineering requirements.', 'مخطط معماري حي: يعكس ارتباط الأعمال بالفراغ، ويولد متطلبات الهندسة تلقائياً.')}</p>
        </div>
        <div className="flex items-center rounded-md border border-sadu-gold bg-white p-1 shadow-2xs">
          <button type="button" onClick={() => setViewMode('blueprint')} className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === 'blueprint' ? 'bg-sadu-ink text-white' : 'text-sadu-charcoal hover:bg-sadu-sand'}`}><Maximize className="h-3.5 w-3.5" />{label('Blueprint View', 'المخطط المعماري')}</button>
          <button type="button" onClick={() => setViewMode('flow')} className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-colors ${viewMode === 'flow' ? 'bg-sadu-ink text-white' : 'text-sadu-charcoal hover:bg-sadu-sand'}`}><Workflow className="h-3.5 w-3.5" />{label('Visitor Flow', 'مسار الزائر')}</button>
        </div>
      </div>

      <div className="relative min-h-[480px] w-full overflow-hidden rounded-lg border-2 border-sadu-gold/60 bg-[#fdfbf7]">
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(to right, #2F4A5B 1px, transparent 1px), linear-gradient(to bottom, #2F4A5B 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute start-4 top-4 z-10 space-y-1.5 rounded border border-sadu-gold/50 bg-white/90 p-2.5 text-[10px] font-mono text-sadu-charcoal shadow-sm"><strong className="block border-b border-sadu-gold/30 pb-1">{label('LEGEND', 'مفتاح المخطط')}</strong><span className="flex items-center gap-2"><i className="h-3 w-3 bg-sadu-brick opacity-80" />{label('Structural Load', 'متطلب إنشائي')}</span><span className="flex items-center gap-2"><i className="h-3 w-3 bg-sadu-ink opacity-80" />{label('Power / AV Data', 'متطلب طاقة / بيانات')}</span></div>

        <section className="absolute bottom-8 start-8 top-8 flex w-[55%] flex-col rounded border-2 border-dashed border-sadu-ink/40 bg-white/60 p-4 transition-all hover:bg-white/80">
          <div className="mb-4 flex items-start justify-between"><div><h4 className="font-editorial text-base font-bold text-sadu-charcoal">{label('East Wing: Central Atrium', 'الجناح الشرقي: البهو الرئيسي')}</h4><span className="text-[10px] font-mono text-sadu-muted">ZONE_A · OPEN SCULPTURAL SPACE</span></div><div className="flex gap-2"><span className="flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800"><Sun className="h-3 w-3" />{label('Natural Light', 'إضاءة طبيعية')}</span><span className="flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-800"><Ruler className="h-3 w-3" />240 m²</span></div></div>
          <div className="relative flex flex-1 items-center justify-center gap-8"><span className="absolute start-0 top-1/2 text-[9px] font-mono text-sadu-brick">{viewMode === 'flow' ? label('Visitor flow →', 'مسار الزائر ←') : ''}</span>{placements.map(placement => <article key={placement.code} className="relative z-10 w-40 cursor-move overflow-hidden rounded border border-sadu-gold bg-white shadow-md"><div className="h-1.5 bg-sadu-brick" /><div className="space-y-2 p-3"><div className="flex items-start justify-between"><span className="text-[9px] font-mono font-bold text-sadu-brick">{placement.code}</span><Move className="h-3 w-3 text-sadu-muted" /></div><div className="font-bold text-[11px] text-sadu-charcoal">{isAr ? placement.titleAr : placement.titleEn}</div><div className="flex gap-1 border-t border-sadu-gold/30 pt-2"><span className="flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[8px] font-bold text-rose-700"><Weight className="h-2.5 w-2.5" />{placement.weight}</span><span className="rounded border border-sadu-gold/50 bg-sadu-sand px-1.5 py-0.5 text-[8px] font-bold">Floor Plate</span></div></div></article>)}</div>
        </section>

        <section className="absolute bottom-8 end-8 top-8 flex w-[35%] flex-col rounded bg-sadu-charcoal p-4 shadow-inner transition-all hover:bg-sadu-ink-dark"><div className="mb-4 flex items-start justify-between border-b border-white/10 pb-3"><div><h4 className="font-editorial text-base font-bold text-white">{label('The Black Box', 'الصالة المعتمة')}</h4><span className="text-[10px] font-mono text-white/50">ZONE_B · IMMERSIVE AV</span></div><span className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white">0.1 Lux Max</span></div><div className="flex flex-1 items-center justify-center"><article className="w-48 overflow-hidden rounded border border-white/20 bg-white/10 shadow-xl backdrop-blur-md"><div className="h-1.5 bg-amber-400" /><div className="space-y-2 p-3"><div className="flex items-start justify-between"><span className="text-[9px] font-mono font-bold text-amber-400">SCB-MF-01</span><Move className="h-3 w-3 text-white/50" /></div><div className="font-bold text-[11px] text-white">{label('Ghosting (4K Projection)', 'الاختفاء المفاجئ (فيديو)')}</div><div className="flex flex-col gap-1.5 border-t border-white/10 pt-2"><span className="flex items-center gap-1.5 rounded bg-amber-400/20 px-2 py-1 text-[8px] font-bold text-amber-300"><Zap className="h-2.5 w-2.5" />{label('Req: 3-Phase Power', 'متطلب: 3 منافذ طاقة')}</span><span className="flex items-center gap-1.5 rounded bg-white/10 px-2 py-1 text-[8px] font-bold text-white/80"><Volume2 className="h-2.5 w-2.5" />{label('Directional Audio', 'توجيه صوتي ستيريو')}</span></div></div></article></div></section>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-sadu-ink p-2.5 text-[10px] font-mono text-white"><div className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sadu-sage opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span><span>SYSTEM SYNC: ACTIVE</span></div><span className="hidden opacity-80 sm:inline">{label('Placement automatically generates Floor Load & AV wiring tickets for Operations Desk.', 'يتم توليد متطلبات الأحمال وتمديدات الكهرباء لقسم العمليات تلقائياً.')}</span></div>
      </div>
    </div>
  );
};
