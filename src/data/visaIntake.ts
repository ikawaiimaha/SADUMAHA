import {passportFormat,personalPhotoFormat,MIN_PHOTO_PIXELS} from './prFileValidation';
export interface VisaIntake { id:string;contractId:string;passportNumber:string;expiryDate:string;motherName:string;nationality:string;passport:File;personalPhoto?:File;photoDimensions?:{width:number;height:number};companion?:{name:string;passport:File;liabilityAcknowledged:true};submittedAt:string }
export const validPassportPDF=passportFormat;
export async function pdfHasSignature(file:File){return validPassportPDF(file)&&(await file.slice(0,5).text())==='%PDF-';}
export function validVisaIntake(v:VisaIntake):boolean {
 const calendarDate=new Date(v.expiryDate+'T00:00:00Z');
 const calendarValid=Number.isFinite(calendarDate.getTime())&&calendarDate.toISOString().slice(0,10)===v.expiryDate;
 const date=Date.parse(v.expiryDate+'T23:59:59+04:00'),at=Date.parse(v.submittedAt);
 return Boolean(v.id&&v.contractId&&v.passportNumber.trim()&&v.passportNumber.length<=50&&v.motherName.trim()&&v.motherName.length<=200&&v.nationality.trim()&&v.nationality.length<=100&&/^\d{4}-\d{2}-\d{2}$/.test(v.expiryDate)&&calendarValid&&Number.isFinite(date)&&Number.isFinite(at)&&date>at&&validPassportPDF(v.passport)&&personalPhotoFormat(v.personalPhoto)&&Number.isFinite(v.photoDimensions?.width)&&Number.isFinite(v.photoDimensions?.height)&&v.photoDimensions!.width>=MIN_PHOTO_PIXELS&&v.photoDimensions!.height>=MIN_PHOTO_PIXELS&&(!v.companion||(v.companion.name.trim()&&v.companion.name.length<=200&&v.companion.liabilityAcknowledged===true&&validPassportPDF(v.companion.passport))));
}
