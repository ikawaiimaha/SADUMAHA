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
 /^\d{4}-\d{2}-\d{2}$/.test(v.passportExpiry??'')&&Number.isFinite(Date.parse(v.passportExpiry))&&new Date(v.passportExpiry).toISOString().slice(0,10)===v.passportExpiry&&Boolean(passportMinimumExpiry(arrival)&&v.passportExpiry>=passportMinimumExpiry(arrival)!)&&NATIONALITY_CODES.includes(v.nationality)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email??'');
}
export function guestDeadline(arrival:string,leadDays:number){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(arrival)||!Number.isInteger(leadDays)||leadDays<1||leadDays>180)return null;
 const time=Date.parse(arrival+'T00:00:00Z');if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==arrival)return null;
 return new Date(time-leadDays*86400000).toISOString().slice(0,10);
}

export function passportMinimumExpiry(arrival:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(arrival)||!Number.isFinite(Date.parse(arrival))||new Date(arrival).toISOString().slice(0,10)!==arrival)return null;
 const [year,month,day]=arrival.split('-').map(Number),date=new Date(Date.UTC(year,month-1+6,1));
 date.setUTCDate(Math.min(day,new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate()));return date.toISOString().slice(0,10);
}
export const NATIONALITY_CODES='AE AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ');
export type GuestDocumentPolicy={version:string;national_id_countries:string[];reference:string};
export const requiresNationalId=(nationality:string,policy:GuestDocumentPolicy|null)=>Boolean(policy?.national_id_countries.includes(nationality));
