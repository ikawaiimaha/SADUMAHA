import { useEffect, useState } from 'react';
import { Plane, FileText, Download } from 'lucide-react';
import { useSessionDraft } from '../context/SessionDrafts';
import { dispatchTravel, emptyTravelPacket, validTravelFile, type TravelKind } from '../data/executionBridges';

function TravelDownload({file}: {file: File}) {
  const [url, setUrl] = useState('');
  useEffect(() => { const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value); }, [file]);
  return url ? <a className="flex items-center gap-2 break-all underline" href={url} download={file.name}><Download aria-hidden="true" className="size-4 shrink-0"/><bdi>{file.name}</bdi></a> : null;
}
export function TravelVault({artistId, isAr, dispatcher = false, cleared = false}: {artistId: string; isAr: boolean; dispatcher?: boolean; cleared?: boolean}) {
  const [packet, setPacket] = useSessionDraft(`travel-vault:${artistId}`, emptyTravelPacket);
  const [error, setError] = useState('');
  const sent = packet.status === 'TRAVEL_DOCUMENTS_DISPATCHED';
  const t = (ar: string, en: string) => isAr ? ar : en;
  if (dispatcher ? !cleared : !sent) return null;
  const fields: [TravelKind, string][] = [['visa', t('تأشيرة الدخول — الفنان', 'UAE Visa — Primary')], ['escortVisa', t('تأشيرة الدخول — المرافق (اختياري)', 'UAE Visa — Escort (optional)')], ['flight', t('تذاكر الطيران', 'Flight Itinerary')]];
  return <section className="space-y-4 rounded-lg border border-[#D9CEBA] bg-[#F7F1E6] ps-5 pe-5 py-5 text-start">
    <h2 className="flex items-center gap-2 text-xl font-semibold"><Plane aria-hidden="true" className="size-5"/>{dispatcher ? t('إصدار وثائق السفر', 'Issue Travel Documents') : t('خزنة السفر والإقامة', 'My Travel & Accommodation Vault')}</h2>
    <p className="text-sm text-[#736357]">{t('محاكاة فقط؛ استخدم ملفات تجريبية. تُحفظ في ذاكرة الجلسة وتُفقد عند تحديث الصفحة؛ لا تخزين آمن بالخادم أو إرسال خارجي.', 'Rehearsal only: use sample files. Files stay in session memory and are lost on refresh; no secure server storage or external dispatch.')}</p>
    {dispatcher && !sent && fields.map(([kind, label]) => <label key={kind} className="block rounded border-2 border-dashed border-[#D9CEBA] bg-white ps-4 pe-4 py-4"><span className="flex items-center gap-2"><FileText aria-hidden="true" className="size-4"/>{label}</span><input type="file" accept=".pdf,application/pdf" className="mt-2 block w-full text-sm" onChange={event => {const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; if (!validTravelFile(file)) {setError(t('اختر ملف PDF غير فارغ حتى 10 ميغابايت.', 'Choose a nonempty PDF up to 10 MB.')); return;} setError(''); setPacket(previous => previous.status === 'DRAFT' ? {...previous, files: {...previous.files, [kind]: file}} : previous);}}/><span className="mt-2 block text-sm"><bdi>{packet.files[kind]?.name}</bdi></span></label>)}
    {error && <p role="alert" className="text-red-800">{error}</p>}
    {dispatcher && !sent && <button type="button" disabled={!packet.files.visa || !packet.files.flight} className="rounded bg-[#8B261E] ps-4 pe-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={() => setPacket(previous => dispatchTravel(previous, cleared, new Date().toISOString()))}>{t('إرسال إلى الفنان — محاكاة', 'Dispatch to Artist — simulated')}</button>}
    {sent && <><p role="status" className="break-words text-emerald-800"><bdi>TRAVEL_DOCUMENTS_DISPATCHED</bdi> · <bdi>{new Date(packet.dispatchedAt!).toLocaleString(isAr ? 'ar-AE' : 'en-AE')}</bdi></p><ul className="space-y-3">{fields.map(([kind, label]) => packet.files[kind] && <li key={kind}><p className="text-sm">{label}</p><TravelDownload file={packet.files[kind]!}/></li>)}</ul></>}
  </section>;
}
