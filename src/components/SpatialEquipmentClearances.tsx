import { useSessionDraft } from '../context/SessionDrafts';
import { clearanceFromClaim } from '../data/spatialClearances';
import type { SpatialClaim } from '../data/spatialClaims';
import { CheckCircle, Clock, MapPin, Projector, UserCheck } from 'lucide-react';
import type { SpatialClearance } from '../data/spatialClearances';

export function SpatialEquipmentClearances({ clearance, isAr }: { clearance: SpatialClearance; isAr: boolean }) {
  const language = isAr ? 'ar' : 'en';
  const cleared = clearance.status === 'CLEARED_BY_VENUE';
  const StatusIcon = cleared ? CheckCircle : Clock;
  return <section className="space-y-4 rounded-lg border border-[#D9CEBA] border-s-4 border-s-[#8B261E] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start text-[#1A1817]">
    <h2 className="text-lg font-semibold">{isAr ? 'التصاريح المكانية والمعدات' : 'Spatial & Equipment Clearances'}</h2>
    <p className="font-semibold">{clearance.artist[language]} · <bdi>{clearance.artworkCode}</bdi></p>
    <p className="text-sm text-[#736357]">{isAr ? 'مرجع اللوحة المكانية لـ HIP • بيانات تدريبية غير متحققة؛ ليست تصريحاً نافذاً.' : 'HIP Curatorial Spatial Canvas reference • unverified rehearsal data; not an operational permit.'}</p>
    <dl className="grid gap-4 sm:grid-cols-2">
      {[
        { label: isAr ? 'الموقع / القاعة المخصصة' : 'Allocated Venue/Room', value: clearance.venue[language], Icon: MapPin },
        { label: isAr ? 'المعدات الخاصة المعتمدة' : 'Approved Special Equipment', value: clearance.equipment[language], Icon: Projector },
        { label: isAr ? 'جهة التصريح' : 'Clearance Authority', value: clearance.authority[language], Icon: UserCheck },
      ].map(({ label, value, Icon }) => <div key={label}><dt className="flex items-center gap-2 text-sm text-[#736357]"><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}
    </dl>
    <p className={`inline-flex flex-wrap items-center gap-2 rounded ps-3 pe-3 py-2 text-sm ${cleared ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}><StatusIcon aria-hidden="true" className="size-5" /><bdi>{clearance.status}</bdi><span>· {isAr ? 'محاكاة' : 'Sample'}</span></p>
  </section>;
}

export function ClaimedSpatialClearances({ artistId, isAr }: { artistId?: string; isAr: boolean }) {
  const [claims] = useSessionDraft<SpatialClaim[]>('spatial-claims:biennial-2026', []);
  const visible = artistId ? claims.filter(claim => claim.artistId === artistId) : claims;
  return <div className="space-y-3">{visible.length ? visible.map(claim => <SpatialEquipmentClearances key={claim.spaceId} clearance={clearanceFromClaim(claim)} isAr={isAr} />) : <p className="text-start">{isAr ? 'لا توجد مساحة محجوزة؛ لم يصدر تصريح للموقع.' : 'No claimed space; venue clearance has not been issued.'}</p>}</div>;
}
