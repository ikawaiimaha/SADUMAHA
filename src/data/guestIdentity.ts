export const GUEST_IDENTITY_FIELDS=[
 ['passportNumber','Passport number / رقم الجواز','text',true],['passportExpiry','Passport expiry / انتهاء الجواز','date',true],
 ['nationality','Current nationality / الجنسية الحالية','text',true],['previousNationality','Previous nationality / الجنسية السابقة','text',false],
 ['birthDate','Date of birth / تاريخ الميلاد','date',true],['birthPlace','Place of birth / مكان الميلاد','text',true],
 ['email','Email / البريد الإلكتروني','email',true],['phone','Home/mobile phone / الهاتف الخارجي','tel',true],['uaePhone','UAE telephone / هاتف الإمارات','tel',false],
 ['religion','Religion / الديانة','text',false],['qualification','Qualification / المؤهل','text',false],['school','School / University / المؤسسة التعليمية','text',false],['languages','Languages / اللغات','text',false],['maritalStatus','Marital status / الحالة الاجتماعية','text',false],
 ['spouseName','Spouse name / اسم الزوج أو الزوجة','text',false],['spouseNationality','Spouse nationality / جنسية الزوج أو الزوجة','text',false],['spouseBirthPlace','Spouse birthplace / مكان ميلاد الزوج أو الزوجة','text',false],['spouseBirthDate','Spouse birth date / تاريخ ميلاد الزوج أو الزوجة','date',false],
 ['children','Children details / بيانات الأبناء','text',false],['fatherName','Father’s name / اسم الأب','text',false],['fatherNationality','Father’s nationality / جنسية الأب','text',false],['fatherBirthPlace','Father’s birthplace / مكان ميلاد الأب','text',false],['fatherBirthDate','Father’s birth date / تاريخ ميلاد الأب','date',false],
 ['motherName','Mother’s name / اسم الأم','text',false],['motherNationality','Mother’s nationality / جنسية الأم','text',false],['motherBirthPlace','Mother’s birthplace / مكان ميلاد الأم','text',false],['motherBirthDate','Mother’s birth date / تاريخ ميلاد الأم','date',false],['website','Website / الموقع الإلكتروني','url',false],
] as const;
export function validGuestIdentity(v:Record<string,string>,arrival:string){
 return GUEST_IDENTITY_FIELDS.filter(f=>f[3]).every(([k])=>typeof v[k]==='string'&&Boolean(v[k].trim()))&&Object.values(v).every(s=>typeof s==='string'&&s.length<=200)&&
 /^\d{4}-\d{2}-\d{2}$/.test(v.birthDate??'')&&Number.isFinite(Date.parse(v.birthDate))&&new Date(v.birthDate).toISOString().slice(0,10)===v.birthDate&&v.birthDate<arrival&&
 /^\d{4}-\d{2}-\d{2}$/.test(v.passportExpiry??'')&&Number.isFinite(Date.parse(v.passportExpiry))&&new Date(v.passportExpiry).toISOString().slice(0,10)===v.passportExpiry&&v.passportExpiry>arrival&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email??'');
}
export function guestDeadline(arrival:string,leadDays:number){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(arrival)||!Number.isInteger(leadDays)||leadDays<1||leadDays>180)return null;
 const time=Date.parse(arrival+'T00:00:00Z');if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==arrival)return null;
 return new Date(time-leadDays*86400000).toISOString().slice(0,10);
}
