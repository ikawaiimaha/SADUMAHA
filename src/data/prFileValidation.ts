export const INVALID_PR_FORMAT='Invalid format. Please upload a clear scanned file, not a mobile photograph.';
export const MIN_PHOTO_PIXELS=1200; // Prototype quality threshold, not an immigration specification.
export const passportFormat=(f?:File)=>Boolean(f&&f.type==='application/pdf'&&/\.pdf$/i.test(f.name)&&f.size>0&&f.size<=10*1024*1024);
export const personalPhotoFormat=(f?:File)=>Boolean(f&&f.size>0&&f.size<=10*1024*1024&&((f.type==='image/jpeg'&&/\.jpe?g$/i.test(f.name))||(f.type==='image/png'&&/\.png$/i.test(f.name))));
export async function validatePassport(file:File){if(!passportFormat(file)||(await file.slice(0,5).text())!=='%PDF-')throw new Error(INVALID_PR_FORMAT);}
export async function validatePersonalPhoto(file:File){
 if(!personalPhotoFormat(file))throw new Error(INVALID_PR_FORMAT);
 const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());
 const signature=file.type==='image/png'?[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b):bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(!signature)throw new Error(INVALID_PR_FORMAT);
 let bitmap:ImageBitmap;
 try{bitmap=await createImageBitmap(file);}catch{throw new Error(INVALID_PR_FORMAT);}
 try{if(bitmap.width<MIN_PHOTO_PIXELS||bitmap.height<MIN_PHOTO_PIXELS)throw new Error(`Personal photo must be at least ${MIN_PHOTO_PIXELS} × ${MIN_PHOTO_PIXELS} pixels (prototype threshold).`);return {width:bitmap.width,height:bitmap.height};}finally{bitmap.close();}
}
