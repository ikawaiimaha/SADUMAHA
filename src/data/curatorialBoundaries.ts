export const boundaryCategories=['Medium','Style','Nationality'] as const;
export type Boundaries={status:'CURATORIAL_DIRECTIVES_PUBLISHED';tags:string[];guidelinesArabic:string;guidelinesEnglish:string;publishedAt:string};
export function categoryTags(tags:string[],category:typeof boundaryCategories[number]){return tags.filter(t=>category==='Medium'?/^(Restricted Medium|Hazardous Medium):/i.test(t):new RegExp(`^Restricted ${category}:`,'i').test(t));}
export function publishBoundaries(current:Boundaries|null,actor:string,theme:string,guidelinesStatus:string,arabic:string,english:string,tags:string[],pending:boolean,confirmed:boolean[],at:string):Boundaries|null{
 if(current)return current;
 if(actor!=='HIP'||theme!=='PUBLISHED_OFFICIAL'||guidelinesStatus!=='PUBLISHED'||!arabic.trim()||!english.trim()||pending||confirmed.length!==3||!confirmed.every(v=>v===true)||!Number.isFinite(Date.parse(at))||tags.some(t=>!t.trim()))return null;
 return {status:'CURATORIAL_DIRECTIVES_PUBLISHED',tags:[...tags],guidelinesArabic:arabic,guidelinesEnglish:english,publishedAt:at};
}
export const nominationOpen=(b:Boundaries|null|undefined)=>b?.status==='CURATORIAL_DIRECTIVES_PUBLISHED';
