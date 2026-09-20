import { PROGRAMMES } from './mockData';
export const EDITORIAL_PROGRAMME_ID = PROGRAMMES[0].id;
export const EDITORIAL_VERSION = 1;
export const editorialSamples = [
    {
      id: 'CAT-01',
      artistEn: 'Youssef Nabhan',
      artistAr: 'يوسف نبهان',
      artworkCode: 'SCB-2026-YN-02',
      titleEn: 'Kufic Horizon: Architectural Bronze & Black Oxide',
      titleAr: 'أفق كوفي: برونز معماري وأكسيد أسود مصفح',
      curatorialStatementEn: 'Youssef Nabhan deconstructs historical Kufic proportions into spatial bronze extrusions, mediating the classical balance between monumental weight and geometric void.',
      curatorialStatementAr: 'يفكك يوسف نبهان النسب الهندسية للخط الكوفي القديم محولاً إياها إلى كتل برونزية فراغية تتوسط التوازن بين الثقل النحتي والفراغ المعماري المعاصر.',
    },
    {
      id: 'CAT-02',
      artistEn: 'Mounir Fatmi',
      artistAr: 'منير فاطمي',
      artworkCode: 'SCB-2026-MF-01',
      titleEn: 'Ghosting (Single-channel 4K Projection)',
      titleAr: 'الاختفاء المفاجئ (عرض فيديو بدقة 4K)',
      curatorialStatementEn: 'Through rapid optical flickering, Fatmi interrogates the obsolescence of calligraphic reproduction in the post-digital age.',
      curatorialStatementAr: 'من خلال الوميض البصري المتسارع، يسائل فاطمي زوال النسخ الخطي في العصر الرقمي الفائق، مجسداً الذاكرة والنسيان.',
    }

];
export interface EditorialCheck { actor: 'DEMO-EDITORIAL'; at: string; version: number }
export function recordEditorialCheck(checks: Record<string, EditorialCheck>, programmeId: string, id: string, actor: string, at: string) {
  const key = `${programmeId}/${id}/v${EDITORIAL_VERSION}`;
  if (actor !== 'EDITORIAL' || programmeId !== EDITORIAL_PROGRAMME_ID || !editorialSamples.some(e => e.id === id) || checks[key] || !Number.isFinite(Date.parse(at))) return checks;
  return { ...checks, [key]: { actor: 'DEMO-EDITORIAL' as const, at, version: EDITORIAL_VERSION } };
}
