import { useState, type CSSProperties } from 'react';
import { UserRound } from 'lucide-react';
import { hasPortraitEvidence, leadershipPeople, leadershipPortraits, portraitScale, type LeadershipRank } from '../data/leadershipMedia';
import './PortraitHierarchy.css';
import { ClaimProvenance } from './ClaimProvenance';

export function PortraitHierarchy({ rank, isAr, compact = false }: { rank: LeadershipRank; isAr: boolean; compact?: boolean }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const asset = leadershipPortraits[rank];
  const person = leadershipPeople[rank];
  const available = hasPortraitEvidence(asset) && failedSource !== asset.src;
  const name = isAr ? person.nameAr : person.nameEn;
  return <div className={`portrait-hierarchy ${compact ? 'portrait-hierarchy--compact' : ''}`} data-rank={rank} data-asset-status={available ? 'documented' : 'pending'} style={{ '--portrait-scale': portraitScale[rank] } as CSSProperties}>
    <div className="portrait-hierarchy__frame">
      {available ? <img src={asset.src} alt={name} onError={() => setFailedSource(asset.src)} />
        : <div className="portrait-hierarchy__pending" role="img" aria-label={`${name} — ${isAr ? 'بانتظار صورة معتمدة' : 'Approved portrait pending'}`}>
            <UserRound className="portrait-hierarchy__symbol" aria-hidden="true" strokeWidth={1.25}/>
            <div className="portrait-hierarchy__label">
              <span className="portrait-hierarchy__eyebrow">{isAr ? 'معاينة العرض' : 'Presentation preview'}</span>
              <span>{isAr ? 'بانتظار صورة معتمدة' : 'Approved portrait pending'}</span>
            </div>
        </div>}
    </div>
  </div>;
}

export function PortraitCredit({ rank, isAr }: { rank: LeadershipRank; isAr: boolean }) {
  const asset = leadershipPortraits[rank];
  return <>{hasPortraitEvidence(asset)
    ? <a aria-label={isAr ? 'حدود المصادر والصلاحيات للصور الرسمية' : 'Source and authority limits for portrait'} href={asset.sourceUrl} target="_blank" rel="noreferrer">{asset.credit}</a>
    : <span>{isAr ? 'ستضاف الصورة بعد توثيق المصدر والإذن باستخدامها في العرض.' : 'Portrait awaiting a documented source and permission for this presentation.'}</span>}
    <ClaimProvenance sourceKey={rank === 'ruler' ? 'department' : rank === 'chairman' ? 'calendar' : 'creativity'} isAr={isAr}/>
  </>;
}
