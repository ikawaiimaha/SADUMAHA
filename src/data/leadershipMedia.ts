export type LeadershipRank = 'ruler' | 'chairman' | 'director';

// SADU presentation proportions requested by the owner, not a statutory protocol.
export const portraitScale: Record<LeadershipRank, number> = { ruler: 1, chairman: .92, director: .84 };
export interface ApprovedPortrait {
  src: string;
  sourceUrl: string;
  credit: string;
  approvalReference: string;
  approvedFor: 'sadu-presentation';
}

export const leadershipPeople = {
  ruler: { nameEn: 'His Highness Sheikh Dr. Sultan bin Muhammad Al Qasimi', nameAr: 'صاحب السمو الشيخ الدكتور سلطان بن محمد القاسمي', titleEn: 'Supreme Council Member and Ruler of Sharjah', titleAr: 'عضو المجلس الأعلى حاكم الشارقة' },
  chairman: { nameEn: 'His Excellency Abdullah bin Mohammed Al Owais', nameAr: 'سعادة عبد الله بن محمد العويس', titleEn: 'Chairman of the Department of Culture', titleAr: 'رئيس دائرة الثقافة' },
  director: { nameEn: 'Mr. Mohammed Ibrahim Al Qaseer', nameAr: 'الأستاذ محمد إبراهيم القصير', titleEn: 'Director of Cultural Affairs', titleAr: 'مدير إدارة الشؤون الثقافية' },
} satisfies Record<LeadershipRank, { nameEn: string; nameAr: string; titleEn: string; titleAr: string }>;

// No approved replacement files or permission records were supplied. Never fall back
// to the old illustrations. Add a reviewed asset and its evidence together here.
export const leadershipPortraits: Record<LeadershipRank, ApprovedPortrait | null> = {
  ruler: null, chairman: null, director: null,
};

export function hasPortraitEvidence(asset: ApprovedPortrait | null): asset is ApprovedPortrait {
  return Boolean(asset && asset.approvedFor === 'sadu-presentation'
    && /^\/assets\/leadership\/[\w.-]+\.(?:png|jpe?g|webp)$/i.test(asset.src)
    && /^https:\/\//.test(asset.sourceUrl) && asset.credit.trim() && asset.approvalReference.trim());
}
