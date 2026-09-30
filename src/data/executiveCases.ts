export const executiveCases = [
  { id: 'case-mounir-fatmi', name: 'Mounir Fatmi', focus: 'Collection & installation', owner: 'Logistics & Production', next: 'Confirm collection details', works: ['Between the Lines', 'Heavier Than Words'], summary: 'Two named works require a reconciled artwork record and collection instructions before transport planning.', facts: ['Collection city: Paris', 'Gallery collection address: awaiting source confirmation', 'Dimensions, materials, year and packing specifications: awaiting source confirmation'], request: 'Confirm the gallery collection address and source artwork specifications.' },
  { id: 'case-murat-kurt', name: 'Murat Kurt', focus: 'Condition review', owner: 'Technical & Logistics', next: 'Review condition evidence', works: ['Steel-letter artwork — title awaiting confirmation'], summary: 'Reported rust on steel letters requires a condition review before treatment or installation decisions.', facts: ['Condition concern: rusted steel letters, as reported in the supplied case summary', 'Dated photographs and original condition report: awaiting source confirmation', 'Whether oxidation is intended or damage: specialist assessment required'], request: 'Obtain the dated condition report and artist guidance before proposing treatment.' },
  { id: 'case-khaled-al-saai', name: 'Khaled Al-Saai', focus: 'Installation planning', owner: 'General Exhibition Coordinator', next: 'Confirm scope & availability', works: ['10-piece photo-collage', 'Dark-room video installation'], summary: 'The supplied case describes two installation formats. Participation and the current scope must be reconfirmed before allocating space.', facts: ['Photo-collage: 10 pieces, as described in the supplied case summary', 'Video: dark-room requirement', 'Dimensions, duration, equipment and current participation: awaiting confirmation'], request: 'Confirm participation and the installation brief before reserving space or equipment.' },
] as const;
export type ExecutiveNote = { caseId: string; text: string; recordedAt: string };
export function openExecutiveDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sadu-executive-presentation', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      const dossiers = db.createObjectStore('dossiers', { keyPath: 'id' });
      executiveCases.forEach(record => dossiers.add({ ...record, provenance: 'User-supplied case summary; primary documents not verified' }));
      db.createObjectStore('notes', { keyPath: 'caseId' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other presentation tabs and retry.'));
  });
}
