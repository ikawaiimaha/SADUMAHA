import { leadershipPeople } from '../data/leadershipMedia';
import { ClaimProvenance } from './ClaimProvenance';
import './ExecutiveQuote.css';

const sourceEn = 'https://sharjah24.ae/en/Articles/2025/12/16/kmr15';
const sourceAr = 'https://sdc.gov.ae/assets/download/99551019/%E2%80%8E%E2%81%A8%D9%85%D8%AC%D9%84%D8%A9%20%D8%A7%D9%84%D9%88%D8%B3%D8%B7%D9%89%20%D8%A7%D9%84%D8%B9%D8%AF%D8%AF%2076%20%D8%B9%D9%86%20%D8%B4%D9%87%D8%B1%20%D9%8A%D9%86%D8%A7%D9%8A%D8%B1%202026%E2%81%A9.pdf.aspx';

// Short published excerpts about heritage, not a statement about or endorsement of SADU.
// Semantic AEGOV pattern with SADU styling; no claim of DLS certification.
export function ExecutiveQuote({ isAr }: { isAr: boolean }) {
  const person = leadershipPeople.ruler;
  const source = isAr ? sourceAr : sourceEn;
  return <div className="story-description executive-quote">
    <blockquote className="aegov-quote" cite={source} lang={isAr ? 'ar' : 'en'} dir={isAr ? 'rtl' : 'ltr'}>
      <p>{isAr ? '«كل موقع تراثي هو مدرسة مفتوحة للأجيال»' : '“Every heritage site is an open school for generations.”'}</p>
      <footer className="quote-footer">
        <p className="quote-author">{isAr ? person.nameAr : person.nameEn}</p>
        <p className="quote-cite">{isAr ? person.titleAr : person.titleEn}</p>
        <a href={source} target="_blank" rel="noreferrer">{isAr ? 'المصدر: مجلة الوسطى، العدد ٧٦، يناير ٢٠٢٦' : 'Source: Sharjah24 · 16 December 2025'}</a>
      </footer>
    </blockquote>
    <p className="executive-quote__context">{isAr ? 'مقتطف عن التراث في سياق إدراج الفاية على قائمة التراث العالمي؛ وليس تأييداً لمنصة سدو.' : 'Heritage remarks at the Faya World Heritage inscription ceremony; not an endorsement of SADU.'}</p>
    <ClaimProvenance sourceKey={isAr ? 'quoteAr' : 'quoteEn'} isAr={isAr}/>
  </div>;
}
