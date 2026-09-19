import type { LivingRecord } from './livingRecord';
import { selectDirectoratePortfolio } from './directoratePortfolio';

export const OUTLOOK_SCENARIO_DATE = '2026-09-19';
const DAY = 86_400_000;

function calendarDay(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().startsWith(value) ? time : null;
}

// A transparent demonstration rule, not an AI prediction or institutional target.
// Use the same manager report and dependency as Directorate oversight.
export function selectReadinessOutlook(state: LivingRecord, asOf = OUTLOOK_SCENARIO_DATE) {
  const day = calendarDay(asOf);
  const activities = selectDirectoratePortfolio(state).activities;
  const known = activities.filter(activity => activity.forecast !== 'awaiting-update' && calendarDay(activity.due) !== null);
  const deadlines = day === null ? [] : known.map(activity => ({
    ...activity,
    daysRemaining: Math.round((calendarDay(activity.due)! - day) / DAY),
    dependencyOpen: activity.id === 'DEMO-A1' && !state.acceptance,
  }));
  const dueSoon = deadlines.filter(activity => activity.daysRemaining >= 0 && activity.daysRemaining <= 7 && activity.dependencyOpen);
  const overdue = deadlines.filter(activity => activity.daysRemaining < 0 && activity.dependencyOpen);
  return {
    asOf, validDate: day !== null, horizonDays: 7,
    dueSoon, overdue,
    awaitingReports: activities.length - known.length,
    caseDeadline: deadlines.find(activity => activity.id === 'DEMO-A1'),
  };
}
