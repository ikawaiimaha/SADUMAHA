export type ParticipationTrack = 'HONORED_GUEST' | 'SOLO_EXHIBITION' | 'GENERAL_COMPETITION';
export const PARTICIPATION_TRACKS: Record<ParticipationTrack, { ar: string; en: string }> = {
  HONORED_GUEST: {ar: 'فنانو التكريم / ضيوف الملتقى', en: 'Honored guest'},
  SOLO_EXHIBITION: {ar: 'معرض شخصي', en: 'Solo exhibition'},
  GENERAL_COMPETITION: {ar: 'المعرض العام والمسابقة', en: 'General exhibition / competition'},
};
export const HONORED_EVENT = {date: '2026-10-10', venueAr: 'بيت الحكمة', venueEn: 'House of Wisdom', hostingStart: '2026-10-06', hostingEnd: '2026-10-11', requiresExternalClearance: true} as const;
export const ROSTER_SOURCE = 'قائمة فناني التكريم (2).docx';
export const COORDINATORS = [
  {
    "id": "demo-coordinator",
    "name": "Demo coordinator · منسق المحاكاة"
  },
  {
    "id": "coordinator-1",
    "name": "عائشة النقبي"
  },
  {
    "id": "coordinator-2",
    "name": "ساره الشيخ"
  },
  {
    "id": "coordinator-3",
    "name": "فاطمة الزرعوني"
  },
  {
    "id": "coordinator-4",
    "name": "مريم المهيري"
  },
  {
    "id": "coordinator-5",
    "name": "عائشة السقطري"
  },
  {
    "id": "coordinator-6",
    "name": "مها السويدي"
  },
  {
    "id": "coordinator-7",
    "name": "شما ال علي"
  },
  {
    "id": "coordinator-8",
    "name": "فاطمة آل علي"
  },
  {
    "id": "coordinator-9",
    "name": "نورة البقيش"
  }
] as const;
export const HONORED_GUESTS = [
  {
    "id": "honored-2026-1",
    "name": "محمود الجابري",
    "assignedCoordinatorId": "coordinator-1",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-2",
    "name": "كريم الدغيدي",
    "assignedCoordinatorId": "coordinator-1",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-3",
    "name": "نور الله أوزدم",
    "assignedCoordinatorId": "coordinator-2",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-4",
    "name": "عبدالرحيم حمزة",
    "assignedCoordinatorId": "coordinator-2",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-5",
    "name": "خاقان أرسلان",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-6",
    "name": "محفوظ ذنون",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-7",
    "name": "محمد قنا",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-8",
    "name": "مهند الساعي",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-9",
    "name": "عامر بن جدو",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-10",
    "name": "عمران البلوشي",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-11",
    "name": "جاسم معراج",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-12",
    "name": "الحاج نور الدين",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-13",
    "name": "أيمن حسن",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-14",
    "name": "أسامة الحمزاوي",
    "assignedCoordinatorId": "coordinator-3",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-15",
    "name": "د. خليل قويعه",
    "assignedCoordinatorId": "coordinator-4",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-16",
    "name": "د. خالد عزب",
    "assignedCoordinatorId": "coordinator-4",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-17",
    "name": "Paco Feenandez",
    "assignedCoordinatorId": "coordinator-4",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-18",
    "name": "مأمون يغمور",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-19",
    "name": "منذر الدليمي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-20",
    "name": "نور الدين شاطر",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-21",
    "name": "ياسر العشري",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-22",
    "name": "صباح الأربيلي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-23",
    "name": "فرهاد قورلو",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-24",
    "name": "محفوظ البوعيشي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-25",
    "name": "محمد اباعبيدة",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-26",
    "name": "د. هند الصوفي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-27",
    "name": "أحمد أربيلي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-28",
    "name": "عبدالرحيم كولين",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-29",
    "name": "عبيدة البنكي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-30",
    "name": "عثمان أوزجاي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-31",
    "name": "عثمان حامد",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-32",
    "name": "أحمد البشير",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-33",
    "name": "د. بلال مختار",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-34",
    "name": "علاء إسماعيل",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-35",
    "name": "منير الشعراني",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-36",
    "name": "حسام خورشيد",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-37",
    "name": "خالد الساعي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-38",
    "name": "خالد الجلاف",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-39",
    "name": "تاج السر حسن",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-40",
    "name": "جمال السويدي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-41",
    "name": "محمد النعيمي",
    "assignedCoordinatorId": "coordinator-5",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-42",
    "name": "فاطمة الحمادي",
    "assignedCoordinatorId": "coordinator-6",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-43",
    "name": "Asli Turkman",
    "assignedCoordinatorId": "coordinator-7",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-44",
    "name": "Hasan Turkman",
    "assignedCoordinatorId": "coordinator-7",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-45",
    "name": "Mohammad Yunus Jami",
    "assignedCoordinatorId": "coordinator-7",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-46",
    "name": "Şeyma Nur Düzenli",
    "assignedCoordinatorId": "coordinator-7",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-47",
    "name": "ساره أهلي",
    "assignedCoordinatorId": "coordinator-8",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-48",
    "name": "فريدة ستيت",
    "assignedCoordinatorId": "coordinator-8",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-49",
    "name": "علي مليح",
    "assignedCoordinatorId": "coordinator-9",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-50",
    "name": "حصه لوتاه",
    "assignedCoordinatorId": "coordinator-8",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-51",
    "name": "Shabir Mir",
    "assignedCoordinatorId": "coordinator-8",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-52",
    "name": "حامد السوداوي",
    "assignedCoordinatorId": "coordinator-9",
    "participationTrack": "HONORED_GUEST"
  },
  {
    "id": "honored-2026-53",
    "name": "Murat Kurt",
    "assignedCoordinatorId": "coordinator-6",
    "participationTrack": "HONORED_GUEST"
  }
] as const;
export function assignedTo<T extends {assignedCoordinatorId?: string}>(rows: readonly T[], coordinatorId: string): T[] {
  return rows.filter(row => Boolean(coordinatorId) && row.assignedCoordinatorId === coordinatorId);
}
export function validSoloCount(track: ParticipationTrack | undefined, count?: number): boolean {
  return track !== 'SOLO_EXHIBITION' || (Number.isInteger(count) && count! >= 15 && count! <= 20);
}
