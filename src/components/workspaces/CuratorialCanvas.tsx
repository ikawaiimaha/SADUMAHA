import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { ARTWORKS } from '../../data/mockData';
import { ArtworkThumbnail } from '../common/ArtworkThumbnail';
import { LayoutGrid, Type, Map, Eye, Palette, Maximize2, Minimize2, Link as LinkIcon } from 'lucide-react';

export const CuratorialCanvas: React.FC = () => {
  const { isAr } = useI18n();
  const [viewMode, setViewMode] = useState<'spatial' | 'narrative'>('spatial');
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`transition-all duration-500 bg-sadu-cream ${isFullscreen ? 'fixed inset-0 z-[100] p-6 sm:p-12 overflow-y-auto' : 'space-y-6'}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-sadu-gold/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sadu-ink uppercase tracking-widest mb-2"><Palette className="w-4 h-4" /><span>{isAr ? 'المخطط التقييمي والفراغي' : 'Curatorial Spatial Canvas'}</span></div>
          <h2 className="text-3xl sm:text-4xl font-editorial font-bold text-sadu-charcoal leading-tight">{isAr ? 'خرائط الصوت والحرف' : 'Cartographies of Sound & Script'}</h2>
          <p className="text-sm text-sadu-muted mt-2 font-serif max-w-2xl">{isAr ? 'مساحة بصرية حرة لتنظيم الأعمال الفنية، بناء السردية الموضوعية، وهندسة مسار الزائر داخل قاعات العرض.' : 'A chromeless visual staging area to arrange artworks, build thematic taxonomies, and engineer the visitor narrative journey.'}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white/50 p-1 rounded-md border border-sadu-gold/40 flex items-center gap-1 shadow-2xs">
            <button type="button" onClick={() => setViewMode('spatial')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-2 ${viewMode === 'spatial' ? 'bg-sadu-ink text-white' : 'text-sadu-muted hover:text-sadu-charcoal'}`}><Map className="w-3.5 h-3.5" />{isAr ? 'المخطط المكاني' : 'Spatial Map'}</button>
            <button type="button" onClick={() => setViewMode('narrative')} className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-2 ${viewMode === 'narrative' ? 'bg-sadu-brick text-white' : 'text-sadu-muted hover:text-sadu-charcoal'}`}><Type className="w-3.5 h-3.5" />{isAr ? 'خيوط السرد' : 'Narrative Threads'}</button>
          </div>
          <button type="button" onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 bg-white/50 border border-sadu-gold/40 rounded-md text-sadu-muted hover:text-sadu-charcoal transition-colors" aria-label={isAr ? 'تبديل ملء الشاشة' : 'Toggle fullscreen'}>{isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
        </div>
      </div>

      {viewMode === 'spatial' && <div className="grid lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-editorial text-lg font-bold text-sadu-charcoal">{isAr ? 'الجناح الشرقي: البهو الرئيسي' : 'East Wing: Central Atrium'}</h3><span className="text-[10px] font-mono uppercase tracking-widest text-sadu-muted">{isAr ? 'مساحة النحت المفتوحة' : 'Open Sculptural Space'}</span></div>
          <div className="p-8 border-2 border-dashed border-sadu-gold/50 bg-sadu-sand/20 rounded-xl min-h-[400px] relative flex flex-col items-center justify-center gap-8">
            <span className="absolute top-4 start-4 text-xs font-bold text-sadu-gold/60 flex items-center gap-1"><Eye className="w-4 h-4" />{isAr ? 'مسار الزائر الرئيسي' : 'Primary Visitor Sightline'}</span>
            <div className="flex flex-col sm:flex-row items-center gap-12">
              {[ARTWORKS[1], ARTWORKS[2]].map((artwork, index) => <React.Fragment key={artwork.id}>
                {index > 0 && <div className="w-px h-16 sm:w-16 sm:h-px bg-sadu-gold/40" />}
                <div className="group cursor-pointer flex flex-col items-center text-center max-w-[200px]"><div className={`${index === 0 ? 'w-32 h-32' : 'w-40 h-40'} mb-4 ring-1 ring-sadu-gold/50 shadow-md group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300`}><ArtworkThumbnail canonicalCode={artwork.canonicalCode} className="w-full h-full rounded-none" isAr={isAr} mediumAr={artwork.mediumAr} mediumEn={artwork.mediumEn} /></div><h4 className="font-editorial font-bold text-sm text-sadu-charcoal">{isAr ? artwork.titleAr : artwork.titleEn}</h4><span className="text-[10px] text-sadu-muted mt-1">{isAr ? artwork.artistNameAr : artwork.artistNameEn}</span></div>
              </React.Fragment>)}
            </div>
          </div>
        </div>
        <div className="space-y-4"><div className="flex items-center justify-between"><h3 className="font-editorial text-lg font-bold text-sadu-charcoal">{isAr ? 'القاعة المعتمة' : 'The Black Box'}</h3><span className="text-[10px] font-mono uppercase tracking-widest text-sadu-muted">{isAr ? 'تجهيزات الفيديو' : 'Video & AV'}</span></div><div className="p-8 border-2 border-sadu-ink bg-sadu-charcoal rounded-xl min-h-[400px] flex flex-col items-center justify-center"><div className="group cursor-pointer flex flex-col items-center text-center max-w-[200px]"><div className="w-48 h-28 mb-4 ring-1 ring-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]"><ArtworkThumbnail canonicalCode="SCB-2026-MF-01" className="w-full h-full rounded-none opacity-80" isAr={isAr} mediumAr="عرض فيديو" mediumEn="Video Projection" /></div><h4 className="font-editorial font-bold text-sm text-white">{isAr ? 'الاختفاء المفاجئ' : 'Ghosting'}</h4><span className="text-[10px] text-white/50 mt-1">{isAr ? 'منير فاطمي' : 'Mounir Fatmi'}</span></div></div></div>
      </div>}

      {viewMode === 'narrative' && <div className="grid md:grid-cols-2 gap-12 mt-8 max-w-5xl mx-auto">
        {[
          { label: 'Taxonomy I', labelAr: 'الثيمة الأولى', title: 'Mass & Architectural Void', titleAr: 'الكتلة والفراغ المعماري', body: 'This thread explores the dialectic between material solidity (bronze, gypsum) and the spatial void carved by Arabic script. Here, calligraphy escapes the two-dimensional plane to be experienced as a spatial entity demanding physical presence.', bodyAr: 'يتناول هذا المحور العلاقة الجدلية بين صلابة المادة كالبرونز والجبس وبين الفراغ الذي يخلقه الحرف العربي. هنا، لا يُقرأ الخط على مسطح ثنائي الأبعاد، بل يُختبر ككيان مكاني يفرض حضوره المادي.', links: [ARTWORKS[1].titleEn, ARTWORKS[2].titleEn], linksAr: [ARTWORKS[1].titleAr, ARTWORKS[2].titleAr] },
          { label: 'Taxonomy II', labelAr: 'الثيمة الثانية', title: 'Deconstructing Digital Time', titleAr: 'تفكيك الزمن الرقمي', body: 'Focusing on the impermanence and preservation of text in the machine age. How does classical Arabic calligraphy interact with magnetic tape and obsolescent media? An archaeological study of media memory.', bodyAr: 'يركز هذا المحور على زوال النص وحفظه في عصر الآلة. كيف يتفاعل الخط العربي الكلاسيكي مع وسائط البث المغناطيسية وأجهزة العرض المتقادمة؟ إنها دراسة أثرية لذاكرة الوسائط.', links: ['Ghosting (Mounir Fatmi)'], linksAr: ['الاختفاء المفاجئ (منير فاطمي)'] },
        ].map(thread => <div key={thread.title} className="space-y-8"><div><span className="text-[10px] font-bold text-sadu-brick uppercase tracking-widest block mb-2">{isAr ? thread.labelAr : thread.label}</span><h3 className="text-2xl font-editorial font-bold text-sadu-charcoal mb-4 border-b border-sadu-gold/30 pb-4">{isAr ? thread.titleAr : thread.title}</h3><p className="text-sm font-serif text-sadu-charcoal leading-loose text-justify">{isAr ? thread.bodyAr : thread.body}</p></div><div className="flex gap-4 p-4 bg-sadu-sand/40 border border-sadu-gold/50 rounded-lg"><LinkIcon className="w-5 h-5 text-sadu-brick shrink-0 mt-1" /><div><span className="text-xs font-bold text-sadu-charcoal block mb-1">{isAr ? 'الأعمال المرتبطة بالسردية:' : 'Linked Artworks in Taxonomy:'}</span><ul className="text-xs text-sadu-muted space-y-1">{(isAr ? thread.linksAr : thread.links).map(link => <li key={link}>• {link}</li>)}</ul></div></div></div>)}
      </div>}
    </div>
  );
};
