import { useEffect, useRef, type RefObject } from 'react';

/** Keep user-initiated task changes visible without moving focus during typing or initial load. */
export function useTaskFocus(scope: RefObject<HTMLElement | null>, step: string | number, errorAttempt = 0) {
  const previous = useRef({ step, errorAttempt });
  useEffect(() => {
    const errorChanged = previous.current.errorAttempt !== errorAttempt;
    const stepChanged = previous.current.step !== step;
    previous.current = { step, errorAttempt };
    if (!errorChanged && !stepChanged) return;
    const target = errorChanged
      ? scope.current?.querySelector<HTMLElement>('[data-task-error]')
      : scope.current?.querySelector<HTMLElement>('[data-next-action-heading]')
        ?? scope.current?.querySelector<HTMLElement>('[data-workflow-heading]');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [scope, step, errorAttempt]);
}
