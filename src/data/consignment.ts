import {safeMapUrl} from './catalogFreight';
export const consignmentFields = {
 packing_list:'Packing list / Contents per crate / قائمة التعبئة',
 length_cm:'Crate length (cm) / طول الصندوق',width_cm:'Crate width (cm) / العرض',height_cm:'Crate height (cm) / الارتفاع',weight_kg:'Gross weight (kg) / الوزن الإجمالي',insurance_value:'Insurance value / قيمة التأمين',
 country:'Country / البلد',city:'City / المدينة',district:'District / المنطقة',street:'Street / الشارع',building:'Facility / Building / المنشأة',map_url:'Google Maps / Makani URL',hours:'Operating hours & collection instructions / ساعات العمل',phone:'Courier contact phone / هاتف التواصل'
} as const;
export const numericFields=['length_cm','width_cm','height_cm','weight_kg','insurance_value'];
export type ConsignmentDetails=Record<keyof typeof consignmentFields,string|number>&{currency:string};
export type Consignment={id:string;artwork_id:string;origin:'ARTIST_STUDIO'|'THIRD_PARTY_GALLERY';contact_name:string|null;contact_email:string|null;status:string;details:ConsignmentDetails|null;received_at:string|null};
export function validConsignment(d:Partial<ConsignmentDetails>):boolean {
 return Object.keys(consignmentFields).every(k=>numericFields.includes(k)?Number.isFinite(Number(d[k]))&&Number(d[k])>0&&Number(d[k])<=100000000:typeof d[k]==='string'&&String(d[k]).trim().length>0&&String(d[k]).length<=500)&&['AED','USD','EUR'].includes(d.currency??'')&&safeMapUrl(String(d.map_url??''));
}
