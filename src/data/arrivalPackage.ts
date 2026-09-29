export interface ArrivalDraft {
  airport: string;
  flight: string;
  terminal: string;
  arrivalLocal: string;
  identityReviewed: boolean;
  identityReviewedFor?: string;
  itineraryReviewed: boolean;
  welcomeGuideIncluded: boolean;
}

export const EMPTY_ARRIVAL: ArrivalDraft = {airport:'',flight:'',terminal:'',arrivalLocal:'',identityReviewed:false,itineraryReviewed:false,welcomeGuideIncluded:false};
export type ArrivalRecipientTag = 'GUEST_ARTIST' | 'JURY_MEMBER';
export interface ArrivalRecipient {
  id: string; artistName: string; status: string; assignedCoordinatorId?: string;
  arrivalRecipientTag?: ArrivalRecipientTag; approvalRevision?: number;
}
export interface ArrivalDispatch {
  recipientId: string; recipientName: string; tag: ArrivalRecipientTag; revision: number;
  itinerary: ArrivalDraft; service: 'Marhaba' | 'Hala'; attachments: string[];
  at: string; coordinatorId: string;
}

/** No PDF bytes or public URL: these are rehearsal manifest identifiers only. */
export function buildArrivalPackage(recipient: ArrivalRecipient, draft: ArrivalDraft): Omit<ArrivalDispatch,'at'|'coordinatorId'> | null {
  if (recipient.status !== 'APPROVED' || !recipient.artistName.trim() || draft.identityReviewedFor !== recipient.artistName || !arrivalPreviewReady(draft) ||
    !['GUEST_ARTIST','JURY_MEMBER'].includes(recipient.arrivalRecipientTag ?? '')) return null;
  return {recipientId:recipient.id,recipientName:recipient.artistName,tag:recipient.arrivalRecipientTag!,revision:recipient.approvalRevision ?? 1,
    itinerary:{...draft},service:airportService(draft.airport)!,
    attachments:['FLIGHT_TICKET','VISA','WELCOME_GUIDE',...(recipient.arrivalRecipientTag==='JURY_MEMBER'?['JUDGING_MECHANISM_PDF']:[])]};
}

export function recordArrivalDispatch(records: ArrivalDispatch[], recipient: ArrivalRecipient, draft: ArrivalDraft, actor: string, coordinatorId: string, publicationReady: boolean, at: string): ArrivalDispatch[] {
  const packet=buildArrivalPackage(recipient,draft);
  if (!packet || actor!=='COORDINATOR' || !coordinatorId || recipient.assignedCoordinatorId!==coordinatorId || !publicationReady || !Number.isFinite(Date.parse(at))) return records;
  // A double click or revisit cannot create another receipt for the same snapshot.
  if(records.some(r=>r.recipientId===packet.recipientId && r.revision===packet.revision && r.tag===packet.tag && r.recipientName===packet.recipientName && JSON.stringify(r.itinerary)===JSON.stringify(packet.itinerary))) return records;
  return [...records,{...packet,at,coordinatorId}];
}

// Rehearsal routing from the user's supplied text, not a confirmed service booking.
export function airportService(airport: string): 'Marhaba' | 'Hala' | null {
  if (airport === 'DXB') return 'Marhaba';
  if (airport === 'SHJ') return 'Hala';
  return null;
}

export function arrivalPreviewReady(draft: ArrivalDraft): boolean {
  const calendarDate = new Date(`${draft.arrivalLocal}Z`);
  const validLocalTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(draft.arrivalLocal)
    && Number.isFinite(calendarDate.getTime())
    && calendarDate.toISOString().slice(0, 16) === draft.arrivalLocal;
  return Boolean(airportService(draft.airport) && draft.flight.trim() && draft.terminal.trim()
    && validLocalTime
    && draft.identityReviewed && draft.itineraryReviewed && draft.welcomeGuideIncluded);
}
