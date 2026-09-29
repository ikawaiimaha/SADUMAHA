import {useCallback,useEffect,useRef,useState} from 'react';
import {pilotSupabase as client} from './pilotSupabase';
export function useOperationalRows<T>(table:'sadu_artwork_checklist'|'sadu_freight_bookings'|'sadu_consignments'|'sadu_condition_reports'|'sadu_asset_scope'|'sadu_artwork_values'|'sadu_visa_notifications'|'sadu_visa_notice_templates'|'sadu_exhibition_titles'|'sadu_arrival_receipts'|'sadu_media_inventory'|'sadu_publication_queue'|'sadu_freight_assignments'|'sadu_freight_alerts'|'sadu_logistics_tickets',filter?:{column:string;value:string}) {
 const [rows,setRows]=useState<T[]>([]),[notice,setNotice]=useState(''),[live,setLive]=useState(false),[signedIn,setSignedIn]=useState(false);
 const epoch=useRef(0);const column=filter?.column,value=filter?.value;
 const refresh=useCallback(async()=>{
  const version=++epoch.current;
  if(!client){setNotice('Authenticated database is not configured.');return;}
  const session=await client.auth.getSession();if(version!==epoch.current)return;setSignedIn(Boolean(session.data.session));if(!session.data.session){setRows([]);setNotice('Sign in at /pilot with an authorized account / يرجى تسجيل الدخول بالحساب المخوّل.');return;}
  let query=client.from(table).select('*');if(column&&value)query=query.eq(column,value);
  const result=await query;
  if(version!==epoch.current)return;
  if(result.error){setRows([]);setNotice('Database queue unavailable. Check sign-in and local schema setup.');}
  else{setRows((result.data??[]) as T[]);setNotice(result.data?.length?'':'No records visible to this account.');}
 },[table,column,value]);
 useEffect(()=>{
  let active=true;setRows([]);void refresh();if(!client)return;
  const auth=client.auth.onAuthStateChange(()=>{epoch.current++;setRows([]);window.setTimeout(()=>{if(active)void refresh();},0);});
  const channel=client.channel(`${table}:${crypto.randomUUID()}`).on('postgres_changes',{event:'*',schema:'public',table},()=>void refresh()).subscribe(status=>{if(!active)return;setLive(status==='SUBSCRIBED');if(status==='SUBSCRIBED')void refresh();});
  const timer=window.setInterval(()=>void refresh(),15000);
  return()=>{active=false;epoch.current++;clearInterval(timer);auth.data.subscription.unsubscribe();void client.removeChannel(channel);};
 },[refresh,table]);
 return {rows,notice,live:live&&signedIn,refresh};
}
