import {lazy,Suspense} from 'react';
const Builder=lazy(()=>import('./ExhibitionScenario').then(m=>({default:m.ExhibitionScenario})));
const Queue=lazy(()=>import('./ExhibitionScenario').then(m=>({default:m.ExhibitionChecklistQueue})));
export function ExhibitionScenario(){return <Suspense fallback={<p>Loading exhibition checklist…</p>}><Builder/></Suspense>;}
export function ExhibitionChecklistQueue(){return <Suspense fallback={<p>Loading exhibition checklist…</p>}><Queue/></Suspense>;}
