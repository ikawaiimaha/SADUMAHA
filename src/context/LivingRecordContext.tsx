import React, { createContext, useContext, useCallback, useState } from 'react';
import { useDemoCheckpoint } from '../lib/useDemoCheckpoint';
import { createLivingRecord, livingRecordReducer, validLivingRecord, DemoAction, LivingRecord } from '../data/livingRecord';

interface LivingRecordContextValue {
  state: LivingRecord;
  dispatch: React.Dispatch<DemoAction>;
  leadershipView: 'CHAIRMAN' | 'DIRECTORATE' | 'MANAGER';
  setLeadershipView: React.Dispatch<React.SetStateAction<'CHAIRMAN' | 'DIRECTORATE' | 'MANAGER'>>;
}
const Context = createContext<LivingRecordContextValue | null>(null);
export function LivingRecordProvider({ children, checkpointKey }: { children: React.ReactNode; checkpointKey?: string }) {
  const [state, setState, warning] = useDemoCheckpoint(checkpointKey, createLivingRecord, validLivingRecord);
  const dispatch = useCallback((action: DemoAction) => setState(previous => livingRecordReducer(previous, action)), [setState]);
  const [leadershipView, setLeadershipView] = useState<'CHAIRMAN' | 'DIRECTORATE' | 'MANAGER'>('CHAIRMAN');
  return <Context.Provider value={{ state, dispatch, leadershipView, setLeadershipView }}>{warning && <p role="alert">{warning}</p>}{children}</Context.Provider>;
}
export function useLivingRecord() {
  const value = useContext(Context);
  if (!value) throw new Error('LivingRecordProvider is required');
  return value;
}
