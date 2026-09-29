/** Normalize surrounding ASCII brackets from imported titles; preserve internal punctuation. */
export function formatLabelTitle(title:string,religious:boolean){const value=title.trim();return religious?`(${value.replace(/^[()\s]+|[()\s]+$/g,'')})`:title;}
export function csvCell(value:unknown){return '"'+String(value??'').replace(/^\s*[=+@-]/,"'$&").replace(/"/g,'""')+'"';}
