// The Committee presentation (docs/pilot-slice-nomination.md): one slide model, rendered as an
// editable PowerPoint file and as a print view for PDF. The deck language is chosen at export and
// is independent of the screen language.
import type { CaseWork, NominationCase, NominationEvent } from './nominations';
import type PptxGenJS from 'pptxgenjs';
type TextPropsOptions = PptxGenJS.TextPropsOptions;

export type DeckLang = 'ar' | 'en';
export type DeckCase = NominationCase & { works: CaseWork[] };
export type DeckWork = { path: string; caption: string; credit: string };
export type Slide =
  | { kind: 'title'; title: string; subtitle: string; meta: string }
  | { kind: 'summary'; title: string; headers: string[]; rows: string[][] }
  | { kind: 'profile'; name: string; otherName: string; facts: string; bioLabel: string; bio: string; rationaleLabel: string; rationale: string; image?: DeckWork }
  | { kind: 'works'; title: string; works: DeckWork[] }
  | { kind: 'closing'; title: string; intro: string; items: string[] };

const copy = {
  en: {
    subtitle: 'Artist nominations for Committee review', prepared: 'Prepared by the Exhibition Coordinator',
    summary: 'Proposed artists', headers: ['#', 'Artist', 'Nationality', 'Category', 'Medium', 'Participation'],
    emerging: 'Emerging', established: 'Established', existing: 'Existing work', commission: 'New commission', undecided: 'To be decided',
    bio: 'Biography', rationale: 'Why this artist', works: 'Selected works', continued: 'continued',
    closing: 'Decisions requested',
    closingIntro: 'The Committee is asked to recommend each nomination, and the Director to confirm.',
    credit: 'Credit',
  },
  ar: {
    subtitle: 'ترشيحات الفنانين للعرض على اللجنة', prepared: 'إعداد منسق المعرض',
    summary: 'الفنانون المقترحون', headers: ['#', 'الفنان', 'الجنسية', 'الفئة', 'الوسيط', 'المشاركة'],
    emerging: 'ناشئ', established: 'متمرّس', existing: 'عمل قائم', commission: 'تكليف بعمل جديد', undecided: 'لم تُحدد بعد',
    bio: 'النبذة التعريفية', rationale: 'مبررات الترشيح', works: 'الأعمال المختارة', continued: 'تابع',
    closing: 'القرارات المطلوبة',
    closingIntro: 'يُرجى من اللجنة التوصية بشأن كل ترشيح، ومن المدير اعتماد القرار.',
    credit: 'المصدر',
  },
} as const;

export const SUMMARY_ROWS_PER_SLIDE = 10;
export const WORKS_PER_SLIDE = 6;
/** Slide text is trimmed to fit; the full text is in the exported case summary. */
export const SLIDE_TEXT_LIMIT = 550;

export function clip(text: string | null | undefined, limit = SLIDE_TEXT_LIMIT): string {
  const t = (text ?? '').trim().replace(/\s+\n/g, '\n');
  if (t.length <= limit) return t;
  const cut = t.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > limit * 0.8 ? lastSpace : limit).trimEnd()}…`;
}

export function deckDate(date: Date, lang: DeckLang): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' }).format(date);
}

export function buildDeck(event: NominationEvent, cases: DeckCase[], lang: DeckLang, date: Date): Slide[] {
  const c = copy[lang];
  const name = (k: NominationCase) => (lang === 'ar' ? k.arabic_name : k.name);
  const other = (k: NominationCase) => (lang === 'ar' ? k.name : k.arabic_name);
  const category = (v: string) => (v === 'Emerging' ? c.emerging : v === 'Established' ? c.established : v);
  const participation = (v: NominationCase['participation']) => (v === 'EXISTING_WORK' ? c.existing : v === 'NEW_COMMISSION' ? c.commission : c.undecided);
  const work = (w: CaseWork): DeckWork => ({
    path: w.image_path,
    caption: [w.title + (w.year ? `, ${w.year}` : ''), w.medium, w.dimensions].filter(Boolean).join(' · '),
    credit: `${c.credit}: ${w.source_credit}`,
  });

  const slides: Slide[] = [{
    kind: 'title', title: lang === 'ar' ? event.name_ar : event.name_en,
    subtitle: c.subtitle, meta: `${c.prepared} · ${deckDate(date, lang)}`,
  }];
  for (let i = 0; i < cases.length; i += SUMMARY_ROWS_PER_SLIDE) {
    const page = cases.slice(i, i + SUMMARY_ROWS_PER_SLIDE);
    slides.push({
      kind: 'summary', title: i ? `${c.summary} (${c.continued})` : c.summary, headers: [...c.headers],
      rows: page.map((k, j) => [String(i + j + 1), `${name(k)} / ${other(k)}`, k.nationality, category(k.category), k.medium, participation(k.participation)]),
    });
  }
  for (const k of cases) {
    const works = [...k.works].sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
    slides.push({
      kind: 'profile', name: name(k), otherName: other(k),
      facts: [k.nationality, k.base_city, category(k.category), k.medium, participation(k.participation)].filter(Boolean).join(' · '),
      bioLabel: c.bio, bio: clip(k.biography), rationaleLabel: c.rationale, rationale: clip(k.rationale),
      image: works[0] ? work(works[0]) : undefined,
    });
    for (let i = 0; i < works.length; i += WORKS_PER_SLIDE) {
      slides.push({ kind: 'works', title: `${name(k)} · ${c.works}${i ? ` (${c.continued})` : ''}`, works: works.slice(i, i + WORKS_PER_SLIDE).map(work) });
    }
  }
  slides.push({ kind: 'closing', title: c.closing, intro: c.closingIntro, items: cases.map(k => `${name(k)} — ${k.nationality}`) });
  return slides;
}

/** Arabic counted noun: one, two, 3 to 10 (plural), 11 and above (singular accusative). */
export const arabicCount = (n: number, [one, two, few, many]: [string, string, string, string]) =>
  n === 1 ? one : n === 2 ? two : n % 100 >= 3 && n % 100 <= 10 ? `${n} ${few}` : `${n} ${many}`;

/** Covering message for the Outlook email that carries the presentation. */
export function coveringEmail(event: NominationEvent, cases: NominationCase[], lang: DeckLang): string {
  const names = cases.map((k, i) => `${i + 1}. ${lang === 'ar' ? `${k.arabic_name} (${k.name})` : `${k.name} (${k.arabic_name})`} — ${k.nationality}`).join('\n');
  return lang === 'ar'
    ? `السادة أعضاء اللجنة التحضيرية،\n\nتجدون مرفقاً عرض ترشيحات الفنانين لـ${event.name_ar}، ويضم ${arabicCount(cases.length, ['ترشيحاً واحداً', 'ترشيحين', 'ترشيحات', 'ترشيحاً'])}:\n\n${names}\n\nنرجو التكرم بالتوصية بشأن كل ترشيح، واعتماد المدير للقرار، والرد على هذه الرسالة.\n\nمع التحية،`
    : `Dear members of the Preparatory Committee,\n\nPlease find attached the artist nominations for the ${event.name_en}, covering ${cases.length} ${cases.length === 1 ? 'artist' : 'artists'}:\n\n${names}\n\nWe would be grateful for the Committee's recommendation on each nomination and the Director's confirmation, by reply to this email.\n\nKind regards,`;
}

export const deckFileName = (event: NominationEvent, lang: DeckLang, date: Date) =>
  `Committee presentation ${date.toISOString().slice(0, 10)} - ${event.name_en} (${lang === 'ar' ? 'Arabic' : 'English'})`;

type ImageData = { dataUrl: string; width: number; height: number };

/** Fits an image of the given size inside a box, centred; returns inches. */
export function fit(width: number, height: number, box: { x: number; y: number; w: number; h: number }) {
  const scale = Math.min(box.w / width, box.h / height);
  const w = width * scale, h = height * scale;
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

/** Builds the PowerPoint file (16:9). The library is loaded only when a deck is made. */
export async function deckToPptx(slides: Slide[], lang: DeckLang, images: Record<string, ImageData>): Promise<Blob> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
  pptx.rtlMode = lang === 'ar';
  const W = 13.333, M = 0.6;
  const ink = '111817', soft = '5E554B', accent = '8B261E', ground = 'F7F1E6', paper = 'FFFDF7';
  const rtl = lang === 'ar';
  const font = rtl ? 'Arial' : 'Georgia';
  const body = 'Arial';
  const text = (extra: TextPropsOptions): TextPropsOptions => ({ fontFace: body, color: ink, align: rtl ? 'right' : 'left', rtlMode: rtl, lang: rtl ? 'ar-AE' : 'en-GB', valign: 'top', margin: 0, ...extra });
  const addImage = (slide: ReturnType<typeof pptx.addSlide>, path: string, box: { x: number; y: number; w: number; h: number }) => {
    const img = images[path];
    if (!img) { slide.addShape('rect', { ...box, fill: { color: 'F1E7D6' }, line: { color: 'D9CEBA' } }); return; }
    slide.addImage({ data: img.dataUrl, ...fit(img.width, img.height, box) });
  };

  for (const s of slides) {
    const slide = pptx.addSlide();
    slide.background = { color: s.kind === 'title' ? ground : paper };
    slide.addShape('rect', { x: 0, y: 7.38, w: W, h: 0.12, fill: { color: accent }, line: { color: accent } });
    if (s.kind === 'title') {
      slide.addText(s.title, text({ x: M, y: 2.2, w: W - 2 * M, h: 1.2, fontFace: font, fontSize: 40, bold: true }));
      slide.addText(s.subtitle, text({ x: M, y: 3.5, w: W - 2 * M, h: 0.7, fontSize: 22, color: accent }));
      slide.addText(s.meta, text({ x: M, y: 4.4, w: W - 2 * M, h: 0.5, fontSize: 14, color: soft }));
    } else if (s.kind === 'summary') {
      slide.addText(s.title, text({ x: M, y: 0.45, w: W - 2 * M, h: 0.7, fontFace: font, fontSize: 26, bold: true }));
      const header = s.headers.map(h => ({ text: h, options: { bold: true, color: 'FFFFFF', fill: { color: accent } } }));
      const rows = s.rows.map(r => r.map(cell => ({ text: cell })));
      const table = rtl ? [header.reverse(), ...rows.map(r => r.reverse())] : [header, ...rows];
      const widths = [0.5, 4.0, 1.8, 1.5, 2.3, 2.03];
      slide.addTable(table, { x: M, y: 1.35, w: W - 2 * M, colW: rtl ? [...widths].reverse() : widths, fontFace: body, fontSize: 12, color: ink, border: { type: 'solid', color: 'D9CEBA', pt: 0.75 }, align: rtl ? 'right' : 'left', valign: 'middle', margin: 0.06 });
    } else if (s.kind === 'profile') {
      const imageBox = { x: rtl ? M : W - M - 4.6, y: 0.6, w: 4.6, h: 5.8 };
      const textX = rtl ? M + 4.9 : M, textW = W - 2 * M - 4.9;
      slide.addText(s.name, text({ x: textX, y: 0.45, w: textW, h: 0.75, fontFace: font, fontSize: 30, bold: true }));
      slide.addText(s.otherName, text({ x: textX, y: 1.15, w: textW, h: 0.45, fontSize: 16, color: soft, rtlMode: !rtl, align: rtl ? 'right' : 'left' }));
      slide.addText(s.facts, text({ x: textX, y: 1.65, w: textW, h: 0.45, fontSize: 13, color: accent }));
      slide.addText([
        { text: s.bioLabel, options: { bold: true, breakLine: true } }, { text: s.bio || '—', options: { breakLine: true } },
        { text: ' ', options: { breakLine: true } },
        { text: s.rationaleLabel, options: { bold: true, breakLine: true } }, { text: s.rationale || '—' },
      ], text({ x: textX, y: 2.25, w: textW, h: 4.9, fontSize: 12, paraSpaceAfter: 2 }));
      if (s.image) {
        addImage(slide, s.image.path, imageBox);
        slide.addText(s.image.caption, text({ x: imageBox.x, y: 6.5, w: imageBox.w, h: 0.35, fontSize: 10, color: soft }));
      }
    } else if (s.kind === 'works') {
      slide.addText(s.title, text({ x: M, y: 0.4, w: W - 2 * M, h: 0.6, fontFace: font, fontSize: 22, bold: true }));
      const cols = 3, gap = 0.3, cellW = (W - 2 * M - gap * (cols - 1)) / cols, imgH = 2.3, cellH = 3.05;
      s.works.forEach((w, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = rtl ? W - M - cellW - col * (cellW + gap) : M + col * (cellW + gap), y = 1.15 + row * cellH;
        addImage(slide, w.path, { x, y, w: cellW, h: imgH });
        slide.addText(w.caption, text({ x, y: y + imgH + 0.05, w: cellW, h: 0.35, fontSize: 10.5, bold: true }));
        slide.addText(w.credit, text({ x, y: y + imgH + 0.38, w: cellW, h: 0.3, fontSize: 9, color: soft }));
      });
    } else {
      slide.addText(s.title, text({ x: M, y: 0.6, w: W - 2 * M, h: 0.8, fontFace: font, fontSize: 30, bold: true }));
      slide.addText(s.intro, text({ x: M, y: 1.5, w: W - 2 * M, h: 0.6, fontSize: 15, color: soft }));
      slide.addText(s.items.map(item => ({ text: item, options: { bullet: true, breakLine: true } })), text({ x: M, y: 2.3, w: W - 2 * M, h: 4.8, fontSize: 16 }));
    }
  }
  return (await pptx.write({ outputType: 'blob' })) as Blob;
}
