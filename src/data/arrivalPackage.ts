export interface ArrivalDraft {
  airport: string;
  flight: string;
  terminal: string;
  arrivalLocal: string;
  identityReviewed: boolean;
  itineraryReviewed: boolean;
  juryGuideIncluded: boolean;
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
    && draft.identityReviewed && draft.itineraryReviewed && draft.juryGuideIncluded);
}
