export type DraftFields=Record<string,string>;
export type WorkspaceDraft={taskId:string;key:string;kind:'collection'|'print'|'treatment';panel:'decision'|'upload'|'assign'|'return';baseVersion:number;fields:DraftFields;fileName:string|null;attempted:boolean;savedAt?:string};
export type DraftComparison={currentVersion:number;baselineAvailable:boolean;changes:{key:string;before:string;current:string}[]};
export type DraftEnvelope={revision:number;draft:WorkspaceDraft|null;currentVersion:number;comparison?:DraftComparison|null};

export function captureDraftFields(form:HTMLFormElement):{fields:DraftFields;fileName:string|null} {
  const fields:DraftFields={};let fileName:string|null=null;
  for(const el of Array.from(form.elements)) {
    if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement)||!el.name)continue;
    if(el instanceof HTMLInputElement&&el.type==='file'){fileName=el.files?.[0]?.name??null;continue;}
    // Inspection assertions are deliberately never recovered as approvals.
    if(el.name==='result')continue;
    if(el instanceof HTMLInputElement&&['checkbox','radio'].includes(el.type)){
      if(el.name==='conflict')fields.conflict=String(el.checked);
      continue;
    }
    fields[el.name]=el.value;
  }
  return {fields,fileName};
}

/** Serial optimistic writes. An unknown outcome freezes writing until a fresh read. */
export class DraftWriter {
  revision:number;blocked=false;
  private tail:Promise<unknown>=Promise.resolve();
  constructor(revision:number,private send:(revision:number,draft:WorkspaceDraft|null)=>Promise<DraftEnvelope>){this.revision=revision;}
  write(draft:WorkspaceDraft|null):Promise<DraftEnvelope> {
    const operation=this.tail.then(async()=>{
      if(this.blocked)throw new Error('Reload the draft after a failed or conflicting save.');
      try{const result=await this.send(this.revision,draft);this.revision=result.revision;return result;}
      catch(e){this.blocked=true;throw e;}
    });
    this.tail=operation.catch(()=>{});return operation;
  }
  async settled(){await this.tail;}
}
