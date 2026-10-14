-- Configuration rows the hand-applied scripts inserted alongside their schema. The baseline
-- migration (20261014100000) was generated with `supabase db diff`, which captures schema
-- only, so a fresh database had these tables empty. Values match the verified local
-- database (pg_dump --data-only, 2026-10-14). No personal data; the visa notice template is
-- an unapproved draft. Idempotent so it is safe on databases that already hold the rows.
begin;

insert into public.sadu_guest_deadline_policy (id, lead_days) values (true, 30)
on conflict do nothing;

insert into public.sadu_guest_document_policy (id, version, national_id_countries, reference)
values (true, 'PR-INTAKE-2026-09-29', '{IQ,PK,AF}', 'User-supplied PR intake requirement; confirm applicability with PR')
on conflict do nothing;

insert into public.sadu_visa_notice_templates (version, body_ar, body_en, approved_at, approval_reference)
values ('draft-2026-09-29',
  'نأسف لإبلاغكم بعدم إمكانية استكمال إجراءات التأشيرة بناءً على أنظمة الهجرة والجوازات في دولة الإمارات. لأسباب تتعلق بالخصوصية، لا تملك دائرة الثقافة صلاحية الاطلاع على أسباب الرفض. لمزيد من الاستفسارات، يرجى مراجعة سفارة الدولة أو الجهات المعنية.',
  'We regret to inform you that the visa process cannot be completed under UAE immigration and passport regulations. For privacy reasons, the Department of Culture does not have access to the reasons for refusal. For further enquiries, please contact the UAE embassy or the relevant authority.',
  null, null)
on conflict do nothing;

commit;
