import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { createIntakeDraft, IntakeAsset, IntakeDraft, IntakeSubmission, ProgrammeId, reviewSubmission, validateIntake } from '../data/artistIntake';
interface Value { form: UseFormReturn<IntakeDraft>; programmeId: ProgrammeId; setProgrammeId: (id: ProgrammeId) => void; assets: IntakeAsset[]; addAsset: (asset: IntakeAsset) => void; removeAsset: (id: string) => void; submissions: IntakeSubmission[]; submit: () => IntakeSubmission | null; review: (id: string, outcome: 'checked' | 'revision', note: string) => void }
const Context = createContext<Value | null>(null);
export function ArtistIntakeProvider({ children }: { children: ReactNode }) {
  const form = useForm<IntakeDraft>({ defaultValues: createIntakeDraft(), shouldUnregister: false });
  const [programmeId, setProgrammeId] = useState<ProgrammeId>('DEMO-CALL-01');
  const [assets, setAssets] = useState<IntakeAsset[]>([]); const assetsRef = useRef<IntakeAsset[]>([]);
  const [submissions, setSubmissions] = useState<IntakeSubmission[]>([]); const submissionsRef = useRef<IntakeSubmission[]>([]);
  useEffect(() => () => { assetsRef.current.forEach(a => URL.revokeObjectURL(a.url)); }, []);
  const addAsset = (asset: IntakeAsset) => { assetsRef.current.push(asset); setAssets(current => [...current, asset]); };
  // Retain a submitted asset URL for its immutable session snapshot, even if removed from the next draft.
  const removeAsset = (id: string) => { setAssets(current => current.filter(a => a.id !== id)); };
  const submit = () => {
    const snapshot = structuredClone(form.getValues()); if (validateIntake(snapshot, programmeId).length) return null;
    // A submission includes only the selected programme; other proposals remain private drafts.
    const blank = createIntakeDraft();
    for (const id of Object.keys(snapshot.proposals) as ProgrammeId[]) if (id !== programmeId) snapshot.proposals[id] = blank.proposals[id];
    const previous = submissionsRef.current.filter(s => s.programmeId === programmeId).at(-1);
    if (previous && previous.status !== 'revision') return null;
    const version = (previous?.version ?? 0) + 1;
    const item: IntakeSubmission = { id: `${programmeId}/proposal-${version}`, version, at: new Date().toISOString(), programmeId, snapshot, assets: assets.filter(a => a.slot === 'cv' || a.slot === programmeId), status: 'received', note: '' };
    submissionsRef.current = [...submissionsRef.current, item]; setSubmissions(submissionsRef.current); return item;
  };
  const review = (id: string, outcome: 'checked' | 'revision', note: string) => { submissionsRef.current = submissionsRef.current.map(s => s.id === id ? reviewSubmission(s, 'COORDINATOR', outcome, note, new Date().toISOString()) : s); setSubmissions(submissionsRef.current); };
  return <Context.Provider value={{ form, programmeId, setProgrammeId, assets, addAsset, removeAsset, submissions, submit, review }}>{children}</Context.Provider>;
}
export function useArtistIntake() { const value = useContext(Context); if (!value) throw new Error('ArtistIntakeProvider required'); return value; }
