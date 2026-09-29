-- LOCAL ONLY, after guest-document-gates.sql. No email provider or legal approval is implied.
begin;
create table public.sadu_visa_notice_templates(
 version text primary key,body_ar text not null,body_en text not null,
 approved_at timestamptz,approval_reference text,
 check((approved_at is null and approval_reference is null) or (approved_at is not null and length(trim(approval_reference))>=3))
);
alter table public.sadu_visa_notice_templates enable row level security;
revoke all on public.sadu_visa_notice_templates from anon,authenticated;
grant select on public.sadu_visa_notice_templates to authenticated;
create policy visa_template_read on public.sadu_visa_notice_templates for select to authenticated using(auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL');
insert into public.sadu_visa_notice_templates(version,body_ar,body_en) values('draft-2026-09-29',
'نأسف لإبلاغكم بعدم إمكانية استكمال إجراءات التأشيرة بناءً على أنظمة الهجرة والجوازات في دولة الإمارات. لأسباب تتعلق بالخصوصية، لا تملك دائرة الثقافة صلاحية الاطلاع على أسباب الرفض. لمزيد من الاستفسارات، يرجى مراجعة سفارة الدولة أو الجهات المعنية.',
'We regret to inform you that the visa process cannot be completed under UAE immigration and passport regulations. For privacy reasons, the Department of Culture does not have access to the reasons for refusal. For further enquiries, please contact the UAE embassy or the relevant authority.');
create table public.sadu_visa_refusals(
 contract_id text primary key references public.bilateral_contracts(id),
 intake_id uuid not null references public.sadu_guest_finalizations(intake_id),
 authority_reference text not null check(length(trim(authority_reference)) between 3 and 200),
 recorded_by uuid not null default auth.uid(),recorded_at timestamptz not null default clock_timestamp()
);
alter table public.sadu_visa_refusals enable row level security;
revoke all on public.sadu_visa_refusals from anon,authenticated;
grant select on public.sadu_visa_refusals to authenticated;
create policy visa_refusal_read on public.sadu_visa_refusals for select to authenticated using(auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL');
create table public.sadu_visa_notifications(
 contract_id text primary key references public.sadu_visa_refusals(contract_id),
 artist_id uuid not null references auth.users(id),
 visa_status text not null check(visa_status='REJECTED_BY_AUTHORITY'),
 delivery_status text not null check(delivery_status in ('TEMPLATE_APPROVAL_REQUIRED','PENDING_DELIVERY')),
 template_version text references public.sadu_visa_notice_templates(version),
 body_ar text,body_en text,recorded_at timestamptz not null default clock_timestamp()
);
alter table public.sadu_visa_notifications enable row level security;
revoke all on public.sadu_visa_notifications from anon,authenticated;
grant select on public.sadu_visa_notifications to authenticated;
create policy visa_notice_read on public.sadu_visa_notifications for select to authenticated using(artist_id=auth.uid() or auth.jwt()->'app_metadata'->>'institutional_role'='PR_PROTOCOL');
-- Narrow transactional command. Actor, contract, recipient, time and template are derived server-side.
create function sadu_private.record_visa_refusal(p_intake uuid,p_reference text) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare r public.sadu_guest_intakes;t public.sadu_visa_notice_templates;stamp timestamptz;
begin
 if auth.uid() is null or auth.jwt()->'app_metadata'->>'institutional_role' is distinct from 'PR_PROTOCOL' then raise exception 'PR authority required' using errcode='42501';end if;
 if p_reference is null or length(trim(p_reference)) not between 3 and 200 then raise exception 'Authority decision reference required';end if;
 select * into r from public.sadu_guest_intakes where id=p_intake;
 if r.id is null or not exists(select 1 from public.sadu_guest_finalizations where intake_id=r.id) then raise exception 'Finalized guest packet required';end if;
 -- Serialize per agreement so repeats cannot create multiple receipts.
 perform 1 from public.bilateral_contracts where id=r.contract_id and status in ('ARTIST_APPROVED','LOCKED') for update;
 if not found then raise exception 'Active accepted agreement required';end if;
 select recorded_at into stamp from public.sadu_visa_refusals where contract_id=r.contract_id;
 if stamp is not null then return stamp;end if;
 if exists(select 1 from public.sadu_guest_intakes n join public.sadu_guest_finalizations f on f.intake_id=n.id where n.contract_id=r.contract_id and (n.created_at,n.id)>(r.created_at,r.id)) then raise exception 'Current finalized packet required';end if;
 insert into public.sadu_visa_refusals(contract_id,intake_id,authority_reference) values(r.contract_id,r.id,trim(p_reference)) returning recorded_at into stamp;
 select * into t from public.sadu_visa_notice_templates where approved_at is not null and approved_at<=clock_timestamp() and approval_reference is not null and length(trim(body_ar))>=30 and length(trim(body_en))>=30 order by approved_at desc,version desc limit 1;
 insert into public.sadu_visa_notifications(contract_id,artist_id,visa_status,delivery_status,template_version,body_ar,body_en,recorded_at)
 values(r.contract_id,r.artist_id,'REJECTED_BY_AUTHORITY',case when t.version is null then 'TEMPLATE_APPROVAL_REQUIRED' else 'PENDING_DELIVERY' end,t.version,t.body_ar,t.body_en,stamp);
 return stamp;
end $$;
revoke all on function sadu_private.record_visa_refusal(uuid,text) from public,anon;
grant execute on function sadu_private.record_visa_refusal(uuid,text) to authenticated;
create function public.sadu_record_visa_refusal(p_intake uuid,p_reference text) returns timestamptz language sql security invoker set search_path='' as $$select sadu_private.record_visa_refusal(p_intake,p_reference);$$;
revoke all on function public.sadu_record_visa_refusal(uuid,text) from public,anon;
grant execute on function public.sadu_record_visa_refusal(uuid,text) to authenticated;
create policy itinerary_no_refusal on public.sadu_guest_itinerary_approvals as restrictive for insert to authenticated with check(
 not exists(select 1 from public.sadu_visa_refusals v join public.sadu_guest_intakes r on r.contract_id=v.contract_id where r.id=intake_id)
);
create or replace function sadu_private.operational_guest_calendar() returns table(contract_id text,artist_name text,arrival date,departure date,arrival_airport text,departure_airport text,approved_at timestamptz)
language sql stable security definer set search_path='' as $$
 select r.contract_id,r.artist_name,r.arrival,r.departure,r.airport,r.departure_airport,a.approved_at
 from public.sadu_guest_itinerary_approvals a join public.sadu_guest_intakes r on r.id=a.intake_id join public.bilateral_contracts c on c.id=r.contract_id
 where auth.uid() is not null and auth.jwt()->'app_metadata'->>'institutional_role' in ('TECHNICAL','PR_PROTOCOL','BIENNIAL_DIRECTOR','HIP')
 and c.status in ('ARTIST_APPROVED','LOCKED')
 and not exists(select 1 from public.sadu_visa_refusals v where v.contract_id=r.contract_id)
 and exists(select 1 from (select * from public.sadu_guest_travel_plans p where p.contract_id=r.contract_id order by created_at desc,id desc limit 1)p where p.arrival=r.arrival and p.departure=r.departure)
 and not exists(select 1 from public.sadu_guest_intakes n join public.sadu_guest_finalizations f on f.intake_id=n.id where n.contract_id=r.contract_id and (n.created_at,n.id)>(r.created_at,r.id));
$$;

-- Trusted template approval releases held notices, without sending email.
create function sadu_private.release_visa_notices() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.approved_at is not null and new.approved_at<=clock_timestamp() and length(trim(new.approval_reference))>=3 and length(trim(new.body_ar))>=30 and length(trim(new.body_en))>=30 then
 update public.sadu_visa_notifications n set delivery_status='PENDING_DELIVERY',template_version=new.version,body_ar=new.body_ar,body_en=new.body_en
 where delivery_status='TEMPLATE_APPROVAL_REQUIRED' and exists(select 1 from public.bilateral_contracts c where c.id=n.contract_id and c.status in ('ARTIST_APPROVED','LOCKED'));
 end if;return new;
end $$;
revoke all on function sadu_private.release_visa_notices() from public,anon,authenticated;
create trigger approved_visa_template after insert or update on public.sadu_visa_notice_templates for each row execute function sadu_private.release_visa_notices();


create function sadu_private.lock_approved_visa_template() returns trigger language plpgsql security invoker set search_path='' as $$
begin if old.approved_at is not null then raise exception 'Approved template is immutable; create a new version';end if;return new;end $$;
revoke all on function sadu_private.lock_approved_visa_template() from public,anon,authenticated;
create trigger lock_visa_template before update or delete on public.sadu_visa_notice_templates for each row execute function sadu_private.lock_approved_visa_template();

commit;
