import type { NominatedArtistDossier } from '../components/ArtistNominationForm';
import { COORDINATORS } from './participation2026';
export const GENERAL_COORDINATOR_ID='demo-general-coordinator';
export const REGIONS = {
 LEVANT:{en:'Levant',ar:'بلاد الشام',countries:['Jordan','Jordanian','الأردن','Lebanon','Lebanese','لبنان','Syria','Syrian','سوريا','Palestine','Palestinian','فلسطين']},
 NORTH_AFRICA:{en:'North Africa',ar:'شمال أفريقيا',countries:['Morocco','Moroccan','المغرب','Egypt','Egyptian','مصر','Algeria','Algerian','الجزائر','Tunisia','Tunisian','تونس','Libya','Libyan','ليبيا']},
 EUROPE:{en:'Europe',ar:'أوروبا',countries:['France','French','فرنسا','Germany','German','ألمانيا','Spain','Spanish','إسبانيا','Italy','Italian','إيطاليا','United Kingdom','British','UK','بريطانيا']},
 GCC:{en:'GCC',ar:'دول مجلس التعاون الخليجي',countries:['United Arab Emirates','UAE','Emirati','الإمارات','الإمارات العربية المتحدة','Saudi Arabia','Saudi','السعودية','Kuwait','Kuwaiti','الكويت','Bahrain','Bahraini','البحرين','Qatar','Qatari','قطر','Oman','Omani','عمان']},
 TURKEY_EASTERN_EUROPE:{en:'Turkey & Eastern Europe',ar:'تركيا وأوروبا الشرقية',countries:['Turkey','Türkiye','Turkish','تركيا','Poland','Polish','بولندا','Romania','Romanian','رومانيا','Bulgaria','Bulgarian','بلغاريا','Ukraine','Ukrainian','أوكرانيا']},
 UNCLASSIFIED:{en:'Unclassified / review origin',ar:'غير مصنف / مراجعة بلد المنشأ',countries:[]}
} as const;
export type Region=keyof typeof REGIONS;
export function artistRegion(d: Pick<NominatedArtistDossier,'nationality'|'geographicRegion'>):Region {
 if(d.geographicRegion && Object.hasOwn(REGIONS,d.geographicRegion))return d.geographicRegion;
 const value=d.nationality.trim().toLocaleLowerCase();
 return (Object.keys(REGIONS) as Region[]).find(r=>(REGIONS[r].countries as readonly string[]).some(c=>c.toLocaleLowerCase()===value))??'UNCLASSIFIED';
}
export function delegateRegion(rows:NominatedArtistDossier[],input:{actor:string;coordinatorId:string;region:Region;target:string;at:string},lockedIds:readonly string[]):NominatedArtistDossier[] {
 if(input.actor!=='COORDINATOR'||input.coordinatorId!==GENERAL_COORDINATOR_ID||!COORDINATORS.some(c=>c.id===input.target)||!Object.hasOwn(REGIONS,input.region)||input.region==='UNCLASSIFIED'||!Number.isFinite(Date.parse(input.at)))return rows;
 const candidates=rows.filter(d=>artistRegion(d)===input.region&&d.assignedCoordinatorId!==input.target);
 if(!candidates.length||candidates.some(d=>lockedIds.includes(d.id)||d.amendments?.some(a=>a.status==='PENDING')))return rows;
 return rows.map(d=>candidates.includes(d)?{...d,assignedCoordinatorId:input.target,delegationHistory:[...(d.delegationHistory??[]),{from:d.assignedCoordinatorId,to:input.target,region:input.region,at:input.at,by:GENERAL_COORDINATOR_ID}]}:d);
}
