import type { InvitationVersion } from '../data/invitationArchive';

export async function downloadInvitation(row: InvitationVersion, isAr: boolean, historical: boolean) {
  const { jsPDF } = await import('jspdf');
  await document.fonts.ready;
  const pdf = new jsPDF({ compress: true });
  const canvas = document.createElement('canvas'); canvas.width = 1240; canvas.height = 1754;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable');
  const t = (ar: string, en: string) => isAr ? ar : en;
  const date = (value: string) => new Date(value).toLocaleString(isAr ? 'ar-AE' : 'en-GB', { timeZone: 'Asia/Dubai' });
  const rows = [t('سدو — خطاب دعوة تدريبي', 'SADU — Rehearsal invitation letter'),
    t('خيالي / غير ملزم / لم يُرسل خارجياً', 'FICTIONAL / NON-BINDING / NOT DISPATCHED'),
    historical ? t('نسخة تاريخية — ليست النسخة الحالية', 'Historical copy — not current') : row.approval ? t('اعتماد مسجل في المحاكاة فقط', 'Approval recorded in rehearsal only') : t('مسودة غير معتمدة', 'Unapproved draft'),
    `${t('الفنان', 'Artist')}: ${row.artistName}`, `${t('رقم الفنان', 'Artist ID')}: ${row.artistId}`,
    `${t('الإصدار', 'Version')}: ${row.version} · ${date(row.createdAt)} (${t('دبي', 'Dubai')})`, `${t('العمل', 'Artwork')}: ${row.work}`,
    isAr ? row.bodyAr : row.bodyEn,
    ...(row.approval ? [`${t('المعتمد المسجل', 'Recorded approver')}: ${row.approval.approver}`, `${t('مرجع التفويض ونطاقه', 'Delegation reference and scope')}: ${row.approval.delegation}`, `${t('مرجع دليل الاعتماد', 'Approval evidence')}: ${row.approval.evidence}`, `${t('تاريخ التسجيل', 'Recorded at')}: ${date(row.approval.at)} (${t('دبي', 'Dubai')})`] : []),
    t('هذه النسخة ليست توقيعاً رسمياً. صيغة PDF لا تضمن منع التعديل أو صحة المراجع المدخلة.', 'This copy is not an official signature. PDF format does not guarantee tamper protection or verify entered references.')];
  let y = 140;
  const reset = () => { ctx.fillStyle = '#F7F1E6'; ctx.fillRect(0, 0, 1240, 1754); ctx.fillStyle = '#8B261E'; ctx.font = '23px sans-serif'; ctx.direction = isAr ? 'rtl' : 'ltr'; ctx.textAlign = isAr ? 'right' : 'left'; ctx.fillText(t('سدو · محاكاة فقط', 'SADU · REHEARSAL ONLY'), isAr ? 1160 : 80, 65); ctx.fillStyle = '#2C2A29'; ctx.font = '27px sans-serif'; y = 140; };
  const flush = () => pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
  const line = (text: string) => { if (y > 1620) { flush(); pdf.addPage(); reset(); } ctx.fillText(text, isAr ? 1160 : 80, y); y += 42; };
  reset();
  for (const rowText of rows) {
    for (const paragraph of rowText.split('\n')) {
      let buffer = '';
      for (const word of paragraph.split(/\s+/)) {
        const candidate = buffer ? `${buffer} ${word}` : word;
        if (buffer && ctx.measureText(candidate).width > 1080) { line(buffer); buffer = ''; }
        if (ctx.measureText(word).width > 1080) {
          for (const character of word) { if (ctx.measureText(buffer + character).width > 1080) { line(buffer); buffer = ''; } buffer += character; }
        } else buffer = buffer ? `${buffer} ${word}` : word;
      }
      line(buffer);
    }
    y += 18;
  }
  flush(); pdf.save(`SADU-invitation-${row.artistId.replace(/[^a-zA-Z0-9_-]/g, '_')}-v${row.version}-${historical ? 'history' : row.approval ? 'rehearsal-approved' : 'draft'}.pdf`);
}
