import { createContext, useContext } from 'react';
import type { IntakeIssue } from '../data/artistIntake';

const IntakeFieldIssues = createContext<readonly IntakeIssue[]>([]);
export const IntakeFieldIssuesProvider = IntakeFieldIssues.Provider;
export const useIntakeFieldIssue = (name: string) => useContext(IntakeFieldIssues).find(issue => issue.path === name);
