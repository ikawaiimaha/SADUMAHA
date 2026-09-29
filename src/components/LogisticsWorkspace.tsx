import {FreightPickupScheduler} from './FreightPickupScheduler';
import {GalleryAllocationLedger} from './GalleryAllocationLedger';
import {CrateReceiving} from './CrateReceiving';
import {ArtworkFreightOrigins} from './BankingFreightBridge';
import { ArtistExecutionBridge } from './ArtistExecutionBridge';
import { CollectionCloseout } from './CollectionCloseout';
import { ConditionReporting } from './ConditionReporting';
import { damageHold } from '../data/conditionReporting';
import { useState } from 'react';
import { FleetDispatch } from './FleetDispatch';
import type { CommissionState } from '../types';
import type { CommissionAction } from '../data/commissionScenario';
import { panel, actionButton } from './CommissionSummary';

export default function LogisticsWorkspace({ state, isAr, onRecord, onClearPhysicalAsset }: { onClearPhysicalAsset?: (artistId:string,action:CommissionAction)=>void; state: CommissionState; isAr: boolean; onRecord: (action: CommissionAction) => void }) {
  const [receipt, setReceipt] = useState('');
  const [returned, setReturned] = useState('');
  const [condition, setCondition] = useState('');
  const [closed, setClosed] = useState(false);
  const accepted = ['ARTIST_APPROVED', 'LOCKED'].includes(state.contracts[0]?.status || '');
  const input = 'block mt-2 w-full rounded border border-[#D9CEBA] ps-3 pe-3 py-2';
  return <div dir={isAr ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto ps-4 pe-4 py-6 space-y-5 text-start">
    <h1 className="text-3xl font-bold">{isAr ? 'اللوجستيات · الاستلام والإعادة' : 'Logistics · Receipt and Return'}</h1>
    <FreightPickupScheduler logistics/><GalleryAllocationLedger/><CrateReceiving key={state.agreementRevision} state={state} onRecord={onRecord} onClearPhysicalAsset={onClearPhysicalAsset}/>
    {!!state.receiptHistory?.length && <section className={panel}><h2>Receipt audit history</h2>{state.receiptHistory.map((row, index) => <p key={index}>{row.reference} · {row.receivedAt} · Revision {row.appliesToRevision} · Superseded{row.closedAt ? ` · Closed ${row.closedAt}` : ''}</p>)}</section>}

    {state && <CollectionCloseout state={state} actor="LOGISTICS" onAction={onRecord}/>}
    <ArtistExecutionBridge state={state} actor="LOGISTICS"/>
    <ConditionReporting state={state} isAr={isAr} actor="LOGISTICS" onRecord={onRecord} />
    <ArtworkFreightOrigins state={state} actor="LOGISTICS" onAction={onRecord}/><FleetDispatch state={state} isAr={isAr} onRecord={onRecord} />
    {state.contracts[0]?.productionOrigin==='LOCAL_FABRICATION'&&<section className={panel}><h2 className="text-xl">{isAr ? 'المرحلة 7 · الاستلام الفعلي' : 'Stage 7 · Physical receipt'}</h2>
      <label>{isAr ? 'مرجع استلام الصندوق التجريبي' : 'Fictional crate receipt reference'}<input className={input} value={receipt} onChange={e => setReceipt(e.target.value)} /></label>
      <button className={`${actionButton} mt-3`} disabled={!state.localProductionEvents?.some(r=>r.revision===state.agreementRevision&&r.stage==='DELIVERED') || !accepted || !receipt.trim() || Boolean(state.logistics)} onClick={() => onRecord({type: 'receive-asset', actor: 'LOGISTICS', at: new Date().toISOString(), reference: receipt})}>{isAr ? 'تسجيل الاستلام التجريبي' : 'Record simulated receipt'}</button>
      <p role="status">{state.logistics ? `PHYSICAL_ASSET_RECEIVED · ${state.logistics.reference}` : (isAr ? 'بانتظار الاتفاقية المقبولة ودليل الاستلام' : 'Waiting for accepted agreement and receipt evidence')}</p>
    </section>}
    <section className={panel}><h2 className="text-xl">{isAr ? 'المرحلة 8 · الإغلاق والإعادة' : 'Stage 8 · Closure and Return'}</h2>
      <label className="block my-3"><input type="checkbox" checked={closed} onChange={e => setClosed(e.target.checked)} /> {isAr ? 'تأكيد إغلاق المعرض — محاكاة' : 'Confirm exhibition closure — simulated'}</label>
      <label>{isAr ? 'مرجع الإعادة الآمنة' : 'Safe return reference'}<input className={input} value={returned} onChange={e => setReturned(e.target.value)} /></label>
      <label>{isAr ? 'مرجع تسوية حالة العمل' : 'Condition reconciliation reference'}<input className={input} value={condition} onChange={e => setCondition(e.target.value)} /></label>
      <button className={`${actionButton} mt-3`} disabled={damageHold(state) || !state.logistics || Boolean(state.logistics.closedAt) || !closed || !returned.trim() || !condition.trim()} onClick={() => onRecord({type: 'close-exhibition', actor: 'LOGISTICS', at: new Date().toISOString(), returnReference: returned, reconciliationReference: condition})}>{isAr ? 'تسجيل إكمال الإعادة' : 'Record closure and return'}</button>
      {state.logistics?.closedAt && <p role="status">{isAr ? 'سُجّل الإكمال لهذه الجلسة' : 'Completion recorded for this session'}</p>}
    </section>
  </div>;
}
