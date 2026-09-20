import { claimRegister, type ClaimKey } from '../data/claimRegister';
import './ClaimProvenance.css';

export function ClaimProvenance({ sourceKey, isAr }: { sourceKey: ClaimKey; isAr: boolean }) {
  const source = claimRegister[sourceKey];
  const lang = isAr ? 'ar' : 'en';
  return <details className="claim-provenance" data-source-id={source.id}>
    <summary>{isAr ? 'المصدر وحدود الاستدلال' : 'Source and authority limits'}</summary>
    <div>
      <a href={source.url} target="_blank" rel="noreferrer">{source.title[lang]}</a>
      <p><bdi>{source.id}</bdi> · {isAr ? 'نُشر:' : 'Published:'} <bdi>{source.published ?? (isAr ? 'غير مؤرخ' : 'Undated')}</bdi> · {isAr ? 'فُحص المصدر:' : 'Source checked:'} <time dateTime={source.checked}>{source.checked}</time></p>
      <p>{source.passage[lang]}</p>
      <p>{source.language[lang]}</p>
      <p>{source.limit[lang]}</p>
    </div>
  </details>;
}
