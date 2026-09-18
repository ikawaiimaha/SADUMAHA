import React, { createContext, useContext, useReducer, useState } from 'react';
import { createLivingRecord, livingRecordReducer, DemoAction, LivingRecord } from '../data/livingRecord';

interface LivingRecordContextValue {
  state: LivingRecord;
  dispatch: React.Dispatch<DemoAction>;
  leadershipView: 'CHAIRMAN' | 'DIRECTORATE' | 'MANAGER';
  setLeadershipView: React.Dispatch<React.SetStateAction<'CHAIRMAN' | 'DIRECTORATE' | 'MANAGER'>>;
}
const Context = createContext<LivingRecordContextValue | null>(null);
export function LivingRecordProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(livingRecordReducer, undefined, createLivingRecord);
  const [leadershipView, setLeadershipView] = useState<'CHAIRMAN' | 'DIRECTORATE' | 'MANAGER'>('CHAIRMAN');
  return <Context.Provider value={{ state, dispatch, leadershipView, setLeadershipView }}>{children}</Context.Provider>;
}
export function useLivingRecord() {
  const value = useContext(Context);
  if (!value) throw new Error('LivingRecordProvider is required');
  return value;
}
