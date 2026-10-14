import {safeMapUrl} from './catalogFreight';
export const consignmentFields = {
 return_country:'Return country / بلد الإعادة',return_city:'Return city / مدينة الإعادة',return_address:'Exact return address / عنوان الإعادة',
 packing_list:'Packing list / Contents per crate / قائمة التعبئة',
 length_cm:'Crate length (cm) / طول الصندوق',width_cm:'Crate width (cm) / العرض',height_cm:'Crate height (cm) / الارتفاع',weight_kg:'Gross weight (kg) / الوزن الإجمالي',insurance_value:'Insurance value / قيمة التأمين',
 country:'Country / البلد',city:'City / المدينة',district:'District / المنطقة',street:'Street / الشارع',building:'Facility / Building / المنشأة',map_url:'Google Maps / Makani URL',hours:'Operating hours & collection instructions / ساعات العمل',phone:'Courier contact phone / هاتف التواصل'
} as const;
export const numericFields=['length_cm','width_cm','height_cm','weight_kg','insurance_value'];
// NO_PACKAGING records carry the artwork's own measurements, not a crate's.
const unpackedLabels:Partial<Record<keyof typeof consignmentFields,string>>={length_cm:'Unpacked length (cm) / الطول دون تغليف',width_cm:'Unpacked width (cm) / العرض دون تغليف',height_cm:'Unpacked height (cm) / الارتفاع دون تغليف',weight_kg:'Unpacked weight (kg) / الوزن دون تغليف',packing_list:'Contents / المحتويات'};
export function consignmentLabel(key:keyof typeof consignmentFields,packingType?:unknown):string{return (packingType==='NO_PACKAGING'&&unpackedLabels[key])||consignmentFields[key];}
export type ConsignmentDetails=Record<keyof typeof consignmentFields,string|number>&{currency:string;packing_type:string};
export type Consignment={id:string;artwork_id:string;origin:'ARTIST_STUDIO'|'THIRD_PARTY_GALLERY';contact_name:string|null;contact_email:string|null;status:string;details:ConsignmentDetails|null;received_at:string|null};
export function validConsignment(d:Partial<ConsignmentDetails>):boolean {
 return ['MUSEUM_CRATE','SOFT_PACK','NO_PACKAGING'].includes(String(d.packing_type))&&Object.keys(consignmentFields).every(k=>numericFields.includes(k)?Number.isFinite(Number(d[k]))&&Number(d[k])>0&&Number(d[k])<=100000000:typeof d[k]==='string'&&String(d[k]).trim().length>0&&String(d[k]).length<=500)&&['AED','USD','EUR'].includes(d.currency??'')&&safeMapUrl(String(d.map_url??''));
}
