# Freight vendor and closure audit — 29 September 2026

Implemented restricted, authenticated vendor visibility of assigned gallery consignments. Logistics records provisioned vendor/curator IDs and timezone-aware closure dates; deadline is computed server-side five days before closure. Local pg_cron generates deduplicated in-app alerts every 15 minutes and resolves missing-data alerts after complete submission.

Verified local SQL: July 25 produces July 20; repeated evaluations create one alert; assigned vendor sees the record and incoming structured data; unassigned vendor cannot; vendor cannot read dossiers or Storage and cannot change assignment dates; artist and assigned curator see alerts; completion resolves the alert. Transactional fixtures roll back.

Browser checks cover readonly vendor view, currency and missing-data warning, required assignment fields and rejection of reopening before closure, on desktop/mobile. Build runs TypeScript and 137 workflow/worker guards. No real vendor accounts, email messages or transport bookings were created. Local schema only.

Remaining limits: no carrier dispatch workflow or multi-crate expansion; insurance remains declared, not certified; historical dates trigger overdue alerts if entered; self-service correction/revocation is not implemented. The scheduler runs only while local Supabase runs. Hosted deployment is a separate operation.
