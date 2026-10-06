import {createContext,useContext,useLayoutEffect,useRef,type ReactNode} from 'react';
import type {DraftFields} from '../lib/workspaceDraft';

export const DraftFieldsContext=createContext<DraftFields>({});
/** Recover working text only. File inputs and review assertions require a fresh action. */
export function DraftForm({children,...props}:React.ComponentProps<'form'> & {children:ReactNode}) {
  const fields=useContext(DraftFieldsContext),ref=useRef<HTMLFormElement>(null);
  useLayoutEffect(()=>{
    for(const el of Array.from(ref.current?.elements??[])){
      if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement)||!el.name)continue;
      if(el instanceof HTMLInputElement&&['file','checkbox','radio','hidden'].includes(el.type)){
        if(el.name==='conflict'&&fields.conflict!==undefined)el.checked=fields.conflict==='true';
        continue;
      }
      // Controlled evidence selector is restored by the workspace itself.
      if(el.name==='evidenceId'||el.name==='result')continue;
      if(fields[el.name]!==undefined)el.value=fields[el.name];
    }
    // Fields are a mount-only recovery snapshot; polling must never reset typed text.
  },[fields]);
  return <form {...props} ref={ref}>{children}</form>;
}
