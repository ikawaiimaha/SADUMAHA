# Authenticated spatial pilot

The Vite app exposes `/pilot`. `/` remains the session-only leadership rehearsal.
Local API: http://127.0.0.1:55321 ; Studio: http://127.0.0.1:55323.
The ignored `.env.local` contains only the local URL and browser anon key. The service key is never included in frontend configuration.

## Run

From the repository root, run `npm run dev`, then open its printed URL with `/pilot` appended.
Create separate local users, choosing a password at the hidden prompt:

```powershell
./scripts/New-LocalPilotUser.ps1 -Email coordinator@example.test -Role COORDINATOR
./scripts/New-LocalPilotUser.ps1 -Email director@example.test -Role BIENNIAL_DIRECTOR
./scripts/New-LocalPilotUser.ps1 -Email technical@example.test -Role TECHNICAL
```

1. Coordinator signs in and creates a dossier.
2. Director signs in and approves the pilot scope.
3. Coordinator signs back in and claims an available room for that approved dossier.
4. Technical signs in and records a request against the claim; its venue curator comes from the room registry.
5. Refresh the page or sign out/back in to confirm persistence. Use Refresh records for changes made in another session. Realtime subscriptions are not yet enabled.

Roles are assigned by an administrator in `sadu_pilot_members`; browser users cannot change them. Room claims and requests are append-only. Unique constraints enforce one room per dossier and one dossier per room. This pilot is a single-event test; multi-edition booking windows and the complete dossier/vetting schema remain future work. Pilot approvals never generate contracts or satisfy the rehearsal's financial gates.

## Verification

`node scripts/test-spatial-pilot.mjs` exercises actual local Auth and PostgREST, including simultaneous room claims. It uses temporary fictional users and a unique test room, then removes only those fixtures. It refuses any API other than local port 55321. No credentials are printed.
`npm run build` runs TypeScript, guard tests and production compilation.
`npx supabase db advisors --local --type security --level warn` checks database advisors.

## GitHub, Supabase and Vercel mapping

- GitHub repository: SADUMAHA. Supabase integration working directory: `.` (this repository's `supabase/` directory is at its root).
- Local pilot currently targets only the local stack. Hosted integration/deployment settings have not been independently verified.
- Before enabling production auto-deployment, reconcile existing hosted migration history with all repository migrations. Do not blindly replay the legacy migrations.
- Once a staging migration review passes, Vercel receives `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for that staging project. Rebuild the frontend; Vite embeds these at build time.
- Do not put a service-role/secret key in any `VITE_` variable. Hosted accounts need explicit administrator membership provisioning.
- The existing legacy tables and storage policies are not certified by this pilot. Keep production auto-deployment off until the full schema and migration history have been reviewed.
