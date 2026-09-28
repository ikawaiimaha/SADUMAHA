const escapeHtml=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Shared envelope for a future mail transport. No emails are sent by this function. */
export function vaultNotification(subject:string,body:string,magicLink:string,trustedOrigin:string){
 const url=new URL(magicLink),origin=new URL(trustedOrigin);
 if(url.protocol!=='https:'||url.origin!==origin.origin||url.username||url.password||/[\r\n]/.test(subject))throw new Error('Invalid notification destination or subject');
 const notice=`⚠️ IMPORTANT: For security and file-size compliance, the Sharjah Department of Culture does not accept artwork or document attachments via email. Please upload all high-resolution files directly to your encrypted SADU Vault here: ${url.href}`;
 return {subject,text:`${notice}\n\n${body}\n\n${notice}`,html:`<p>${escapeHtml(notice)}</p><p>${escapeHtml(body).replace(/\n/g,'<br>')}</p><p>${escapeHtml(notice)}</p>`,headers:{'Auto-Submitted':'auto-generated','X-Auto-Response-Suppress':'All'}};
}
