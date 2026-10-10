import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export default function EvidencePreview({file,onClose,onReady,inline=false,language='ar'}:{file:{id:string;name:string;url:string;file_hash:string;source?:string;sender?:string;receivedAt?:string|null;actorId?:string};onClose:()=>void;onReady?:(id:string|null)=>void;inline?:boolean;language?:'ar'|'en'}) {
  const t=(ar:string,en:string)=>language==='ar'?ar:en;
  const dialog=useRef<HTMLDialogElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const [pdf,setPdf]=useState<PDFDocumentProxy|null>(null),[image,setImage]=useState(''),[page,setPage]=useState(1),[loading,setLoading]=useState(true),[error,setError]=useState(''),[pageText,setPageText]=useState('');
  useEffect(()=>{if(inline)return;const trigger=document.activeElement as HTMLElement|null;const modal=dialog.current;modal?.showModal();return()=>{modal?.close();trigger?.focus();};},[inline]);
  useEffect(()=>{
    onReady?.(null);setLoading(true);setError('');setImage('');setPdf(null);setPage(1);
    const abort=new AbortController();let objectUrl='',active=true,document:PDFDocumentProxy|undefined,task:PDFDocumentLoadingTask|undefined;
    void (async()=>{
      try {
        const response=await fetch(file.url,{cache:'no-store',signal:abort.signal});
        if(!response.ok){const result=await response.json();throw Error(result.error??'Evidence unavailable');}
        const bytes=new Uint8Array(await response.arrayBuffer());
        const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
        if(hash!==file.file_hash)throw Error('Evidence does not match this recorded file version.');
        if(response.headers.get('content-type')?.includes('application/pdf')){
          const {getDocument,GlobalWorkerOptions}=await import('pdfjs-dist');GlobalWorkerOptions.workerSrc=workerUrl;
          task=getDocument({data:bytes,enableXfa:false,useSystemFonts:true});document=await task.promise;
          if(!active){await task.destroy();return;}
          if(document.numPages>500)throw Error('This preview supports up to 500 pages. Download the original to inspect it.');
          setPdf(document);
        } else {
          objectUrl=URL.createObjectURL(new Blob([bytes],{type:response.headers.get('content-type')??'image/png'}));
          if(active)setImage(objectUrl);
        }
      }catch(e){if(active&&!abort.signal.aborted){setError((e as Error).message);setLoading(false);}}
    })();
    return()=>{active=false;abort.abort();onReady?.(null);if(objectUrl)URL.revokeObjectURL(objectUrl);void task?.destroy();};
  },[file.id,file.url,file.file_hash,onReady]);
  useEffect(()=>{
    if(!pdf)return;let active=true;let rendering:ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>|undefined;
    setLoading(true);setPageText('');onReady?.(null);
    void (async()=>{try{
      const sheet=await pdf.getPage(page);if(!active||!canvas.current)return;
      const original=sheet.getViewport({scale:1});const viewport=sheet.getViewport({scale:Math.min(1.6,1200/original.width,1600/original.height)});
      canvas.current.width=viewport.width;canvas.current.height=viewport.height;
      rendering=sheet.render({canvas:canvas.current,viewport});await rendering.promise;
      const text=await sheet.getTextContent();if(active){setPageText(text.items.map(i=>'str' in i?i.str:'').join(' '));setLoading(false);onReady?.(file.id);}
    }catch(e){if(active){setError((e as Error).message);setLoading(false);}}})();
    return()=>{active=false;rendering?.cancel();};
  },[pdf,page,onReady,file.id]);
  const content=<>
    {!inline&&<header className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold" dir="auto">{file.name}</h4>{!inline&&<button autoFocus className="min-h-12 rounded border px-4" onClick={onClose}>{t('إغلاق','Close')}</button>}</header>}
    {loading&&<p role="status">{t('جارٍ عرض الملف…','Rendering evidence…')}</p>}{error&&<p role="alert">{error}</p>}
    {image&&<img src={image} alt={`${t('صورة الدليل','Evidence photograph')}: ${file.name}`} onLoad={()=>{setLoading(false);onReady?.(file.id);}} onError={()=>{setLoading(false);onReady?.(null);setError(t('تعذر عرض الصورة. أرفق صورة صالحة قبل الاعتماد.','The image could not be displayed. Attach a readable image before confirming.'));}} className="mx-auto max-w-full"/>}
    <canvas ref={canvas} dir="ltr" hidden={!pdf||!!error} className="mx-auto max-w-full h-auto bg-white" aria-label={`${t('صفحة PDF','PDF page')} ${page}`}/>
    {pdf&&<>{pdf.numPages>1&&<nav aria-label={t('صفحات الملف','Document pages')} className="evidence-tools flex items-center justify-center gap-4 py-3"><button className="min-h-12 underline disabled:opacity-40" disabled={page<=1||loading} onClick={()=>setPage(n=>n-1)}>{t('السابق','Previous')}</button><span>{page} / {pdf.numPages}</span><button className="min-h-12 underline disabled:opacity-40" disabled={page>=pdf.numPages||loading} onClick={()=>setPage(n=>n+1)}>{t('التالي','Next')}</button></nav>}<details><summary>{t('نص الصفحة','Page text')}</summary><p dir="auto">{pageText||t('لا يوجد نص قابل للاستخراج.','No extractable text on this page.')}</p></details></>}
    <details><summary>{t('تفاصيل الملف والأصل','File details and original')}</summary><p dir="auto">{file.name}</p>{file.source&&<p>{t('مرجع المصدر:','Source:')} <bdi>{file.source}</bdi></p>}{file.sender&&<p>{t('المرسل:','Sender:')} <bdi>{file.sender}</bdi></p>}{file.receivedAt&&<p>{t('تاريخ الاستلام:','Received:')} <bdi>{new Date(file.receivedAt).toLocaleString(language==='ar'?'ar-AE':'en-GB')}</bdi></p>}{file.actorId&&<p>{t('مسجل الدليل:','Recorded by:')} <bdi>{file.actorId}</bdi></p>}<p className="break-all text-sm" dir="ltr">SHA-256: {file.file_hash}</p><a className="underline min-h-12 inline-flex items-center" href={`${file.url}?download=1`} download={file.name}>{t('تنزيل الأصل','Download original')}</a></details>
  </>;
  return inline?<div className="evidence-inline" aria-label={t('معاينة الدليل','Evidence preview')}>{content}</div>:<dialog ref={dialog} onCancel={e=>{e.preventDefault();onClose();}} dir={language==='ar'?'rtl':'ltr'} className="m-auto max-h-[92vh] w-[min(92vw,1000px)] rounded-xl border border-[#D9CEBA] bg-[#F7F1E6] p-5 text-[#1A1817] backdrop:bg-black/50" aria-label={t('معاينة الدليل','Evidence preview')}>{content}</dialog>;
}
