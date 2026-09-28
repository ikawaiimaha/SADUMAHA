export type ParticipationCategory = 'SINGLE_WORK' | 'SOLO_EXHIBITION';

// User-supplied transcription of [source: 6]; the scan has not been independently inspected.
export const SOLO_INVITATION_2026 = {
  sourceId: 'user-transcription:6',
  reference: 'ش.ث/خ.س/001',
  letterDate: '2026/02/24',
  theme: 'ميزان',
  eventStart: '2026-10-07', eventEnd: '2026-11-15',
  hostingStart: '2026-10-06', hostingEnd: '2026-10-11',
  minArtworks: 15, maxArtworks: 20,
  coverage: 'تتكفل الدائرة بنقل الأعمال والتأمين عليها ذهاباً وإياباً، إضافة إلى الاستضافة والإقامة.',
  coordinator: { name: 'ميا السويدي', email: 'm.alsuwaidi@sdci.gov.ae', phone: '0097165123136' },
  signatory: 'محمد القصير',
  attachments: ['الوثائق المطلوبة للمعرض الشخصي', 'عقد المشاركة', 'استمارة تفاصيل الأعمال المشاركة'],
} as const;

export function validParticipationScope(scope: { participationCategory?: ParticipationCategory; artworkCount?: number }): boolean {
  // Legacy single-work records predate these fields.
  if (scope.participationCategory === undefined) return scope.artworkCount === undefined;
  if (!Number.isInteger(scope.artworkCount)) return false;
  if (scope.participationCategory === 'SINGLE_WORK') return scope.artworkCount === 1;
  return scope.participationCategory === 'SOLO_EXHIBITION'
    && scope.artworkCount! >= SOLO_INVITATION_2026.minArtworks
    && scope.artworkCount! <= SOLO_INVITATION_2026.maxArtworks;
}
