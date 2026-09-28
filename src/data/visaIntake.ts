export interface VisaIntake { id:string;contractId:string;passportNumber:string;expiryDate:string;motherName:string;nationality:string;passport:File;companion?:{name:string;passport:File;liabilityAcknowledged:true};submittedAt:string }
export const validPassportPDF=(f?:File)=>Boolean(f&&/\.pdf$/i.test(f.name)&&(!f.type||f.type==='application/pdf')&&f.size>0&&f.size<=10*1024*1024);
export async function pdfHasSignature(file:File){return validPassportPDF(file)&&(await file.slice(0,5).text())==='%PDF-';}
export function validVisaIntake(v:VisaIntake):boolean {
 const date=Date.parse(v.expiryDate+'T23:59:59+04:00'),at=Date.parse(v.submittedAt);
 return Boolean(v.id&&v.contractId&&v.passportNumber.trim()&&v.passportNumber.length<=50&&v.motherName.trim()&&v.motherName.length<=200&&v.nationality.trim()&&v.nationality.length<=100&&/^\d{4}-\d{2}-\d{2}$/.test(v.expiryDate)&&Number.isFinite(date)&&Number.isFinite(at)&&date>at&&validPassportPDF(v.passport)&&(!v.companion||(v.companion.name.trim()&&v.companion.name.length<=200&&v.companion.liabilityAcknowledged===true&&validPassportPDF(v.companion.passport))));
}
