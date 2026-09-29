# Visa authority refusal — audit

Implemented PR-only recording with mandatory reference/confirmation, immutable contract-bound receipt, minimal artist notification and bilingual template approval gate. No reasons are invented or editable by Coordinators.

Database checks: Coordinator RPC denied; artist cannot read internal reference; Coordinator cannot read notice; repeated PR commands retain one receipt and timestamp; unapproved template text remains withheld; approved template releases pending notices; client outbox mutation denied; refused itineraries leave operational calendar and cannot be re-approved.

Verification: production build and 134 guards; four desktop/mobile browser tests covering confirmation, repeat prevention, artist read-only view and prior guest intake; local rollback SQL fixtures passed. Mobile screenshot inspected.

Limits: text supplied by user is DRAFT, not legally vetted. Local test approval rolled back. No real notification email, hosted schema deployment or reversal workflow. Template approval and production sender require institutional setup. Existing bundle-size warning remains.
