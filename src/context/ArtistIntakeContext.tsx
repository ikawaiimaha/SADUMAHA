import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useForm, useWatch, UseFormReturn } from 'react-hook-form';
import { ARTIST_ID, INTAKE_PROGRAMMES, createIntakeDraft, emptyProposal, findIntakeProgramme, IntakeProgramme, IntakeAsset, IntakeDraft, IntakeSubmission, ProgrammeId, validateIntake } from '../data/artistIntake';
import { seedRoster, registerProfile, reviewRoster, createRosterProgramme, type RosterEntry, type RosterProgramme } from '../data/artistRoster';
import { intakeWorkflowReducer, type IntakeWorkflow, type IntakeWorkflowAction } from '../data/intakeWorkflow';
import { useWorkspace } from './WorkspaceContext';
import { useLivingRecord } from './LivingRecordContext';
import type { DemoAction, DemoActor } from '../data/livingRecord';
interface Value { form: UseFormReturn<IntakeDraft>; programmeId: ProgrammeId; setProgrammeId: (id: ProgrammeId) => void; availableProgrammes: IntakeProgramme[]; canSubmit: (id: string) => boolean; assets: IntakeAsset[]; addAsset: (asset: IntakeAsset) => void; removeAsset: (id: string) => void; submissions: IntakeSubmission[]; submit: () => IntakeSubmission | null; review: (id: string, outcome: 'checked' | 'revision', note: string) => void; workflow: IntakeWorkflow; activate: (id: string, acknowledged: boolean) => void; actOnDelivery: (id: string, action: DemoAction) => void }
interface RosterValue { roster: RosterEntry[]; registerRoster: () => boolean; simulateRosterReview: (id: string) => void; rosterProgrammes: RosterProgramme[]; createProgramme: (titleEn: string, titleAr: string, artistIds: string[]) => boolean }
const Context = createContext<(Value & RosterValue) | null>(null);
export function ArtistIntakeProvider({ children }: { children: ReactNode }) {
  const { currentRole } = useWorkspace();
  const { leadershipView } = useLivingRecord();
  const form = useForm<IntakeDraft>({ defaultValues: createIntakeDraft(), shouldUnregister: false });
  const briefs = useWatch({ control: form.control, name: 'programmeBriefs' });
  const availableProgrammes = [...INTAKE_PROGRAMMES, ...Object.values(briefs ?? {})];
  const [activeProgrammeId, setActiveProgramme] = useState<ProgrammeId>('DEMO-CALL-01');
  const programmeId = findIntakeProgramme(form.getValues(), activeProgrammeId) ? activeProgrammeId : 'DEMO-CALL-01';
  const setProgrammeId = (id: string) => {
    if (!findIntakeProgramme(form.getValues(), id)) return;
    if (!form.getValues().proposals[id]) form.setValue(`proposals.${id}`, emptyProposal(id));
    setActiveProgramme(id);
  };
  const [roster, setRoster] = useState(seedRoster); const rosterRef = useRef(roster);
  const [rosterProgrammes, setRosterProgrammes] = useState<RosterProgramme[]>([]);
  const coordinator = ['SDC_COORDINATOR', 'COORDINATOR'].includes(currentRole);
  const simulateRosterReview = (id: string) => {
    const next = reviewRoster(rosterRef.current, id, coordinator ? 'COORDINATOR' : 'OBSERVER', new Date().toISOString());
    rosterRef.current = next; setRoster(next);
  };
  const registerRoster = () => {
    const next = registerProfile(rosterRef.current, form.getValues().profile, assets, new Date().toISOString());
    if (next === rosterRef.current) return false;
    rosterRef.current = next; setRoster(next); return true;
  };
  const createProgramme = (titleEn: string, titleAr: string, artistIds: string[]) => {
    if (availableProgrammes.length >= 50) return false;
    const item = createRosterProgramme(rosterRef.current, { id: `DEMO-PROGRAMME-${crypto.randomUUID().slice(0, 8)}`, titleEn, titleAr, artistIds, createdAt: new Date().toISOString() });
    if (!item) return false;
    const brief: IntakeProgramme = { ...INTAKE_PROGRAMMES[0], id: item.id, en: item.titleEn, ar: item.titleAr, artistIds: item.artistIds };
    form.setValue(`proposals.${item.id}`, emptyProposal(item.id));
    form.setValue(`programmeBriefs.${item.id}`, brief);
    setRosterProgrammes(current => [...current, item]); return true;
  };
  const canSubmit = (id: string) => {
    const programme = findIntakeProgramme(form.getValues(), id);
    if (!programme) return false;
    return !programme.artistIds || (programme.artistIds.includes(ARTIST_ID) && rosterRef.current.some(r => r.id === ARTIST_ID && r.status === 'verified-sample' && JSON.stringify(r.profile) === JSON.stringify(form.getValues().profile)));
  };
  const [assets, setAssets] = useState<IntakeAsset[]>([]); const assetsRef = useRef<IntakeAsset[]>([]);
  const [workflow, setWorkflow] = useState<IntakeWorkflow>({ submissions: [], deliveries: [] }); const workflowRef = useRef(workflow);
  const transition = (action: IntakeWorkflowAction) => { workflowRef.current = intakeWorkflowReducer(workflowRef.current, action); setWorkflow(workflowRef.current); };
  useEffect(() => () => { assetsRef.current.forEach(a => URL.revokeObjectURL(a.url)); }, []);
  const addAsset = (asset: IntakeAsset) => { assetsRef.current.push(asset); setAssets(current => [...current, asset]); };
  // Retain a submitted asset URL for its immutable session snapshot, even if removed from the next draft.
  const removeAsset = (id: string) => { setAssets(current => current.filter(a => a.id !== id)); };
  const submit = () => {
    const snapshot = structuredClone(form.getValues()); if (currentRole !== 'ARTIST' || !canSubmit(programmeId) || validateIntake(snapshot, programmeId).length) return null;
    // A submission includes only the selected programme; other proposals remain private drafts.
    for (const id of Object.keys(snapshot.proposals)) if (id !== programmeId) delete snapshot.proposals[id];
    snapshot.programmeBriefs = snapshot.programmeBriefs?.[programmeId] ? { [programmeId]: snapshot.programmeBriefs[programmeId] } : undefined;
    const previous = workflowRef.current.submissions.filter(s => s.programmeId === programmeId).at(-1);
    if (previous && previous.status !== 'revision') return null;
    const version = (previous?.version ?? 0) + 1;
    const item: IntakeSubmission = { id: `${programmeId}/proposal-${version}`, version, at: new Date().toISOString(), programmeId, snapshot, assets: assets.filter(a => a.slot === 'cv' || a.slot === 'portfolio' || a.slot === programmeId), status: 'received', note: '' };
    transition({ type: 'SUBMIT', submission: item }); return item;
  };
  const review = (id: string, outcome: 'checked' | 'revision', note: string) => transition({ type: 'REVIEW', id, outcome, note, actor: coordinator ? 'COORDINATOR' : 'OBSERVER', at: new Date().toISOString() });
  const activate = (id: string, acknowledged: boolean) => transition({ type: 'ACTIVATE', id, acknowledged, actor: currentRole === 'COMMITTEE' ? 'SELECTION' : 'OBSERVER', at: new Date().toISOString() });
  const actOnDelivery = (id: string, action: DemoAction) => {
    const actor: DemoActor = currentRole === 'LOGISTICS' ? 'LOGISTICS' : ['SAF_TECHNICIAN', 'TECHNICAL', 'TECHNICAL_MUSEUM'].includes(currentRole) ? 'TECHNICAL' : currentRole === 'DIRECTORATE' || currentRole === 'LEADERSHIP' ? leadershipView : 'OBSERVER';
    if (action.type === 'RESET' || action.actor !== actor) return;
    transition({ type: 'DELIVERY', id, action });
  };
  return <Context.Provider value={{ form, programmeId, setProgrammeId, availableProgrammes, canSubmit, assets, addAsset, removeAsset, submissions: workflow.submissions, submit, review, workflow, activate, actOnDelivery, roster, registerRoster, simulateRosterReview, rosterProgrammes, createProgramme }}>{children}</Context.Provider>;
}
export function useArtistIntake() { const value = useContext(Context); if (!value) throw new Error('ArtistIntakeProvider required'); return value; }
