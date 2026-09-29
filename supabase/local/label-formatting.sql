-- Local only; follows structured-delivery.sql. Historical flags remain unknown.
begin;
alter table public.sadu_artwork_checklist add column religious_text boolean;
create function public.sadu_require_label_declaration() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='INSERT' and new.religious_text is null then raise exception 'Explicit religious text declaration required'; end if;
 if TG_OP='UPDATE' and new.religious_text is distinct from old.religious_text then raise exception 'Submitted formatting declaration is immutable'; end if;
 return new;
end;
$$;
revoke all on function public.sadu_require_label_declaration() from public;
create trigger label_declaration before insert or update on public.sadu_artwork_checklist for each row execute function public.sadu_require_label_declaration();
grant insert(religious_text) on public.sadu_artwork_checklist to authenticated;
commit;
