-- Local-only scheduler. Generates outbox rows; never sends external messages.
create extension if not exists pg_cron;
select cron.schedule('sadu-guest-reminders-local','*/15 * * * *','select sadu_private.queue_guest_reminders()');
