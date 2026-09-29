# Logistics SLA audit — 29 September 2026

Added mandatory packing-list intake, shared completeness checklist, artist Ready for Shipping action, named Logistics routing, separate open/action receipts, and 48-hour escalation to the configured department head. The local cron runs every 15 minutes; late action itself also stamps a breach to close the between-runs loophole. Action records preserve prior escalation.

Security checks: accepted owner plus complete submitted gallery data for readiness; no inferred officer identities; trusted account role validation; assigned Logistics actor only; server timestamps; no Technical ticket access; no frontend escalation/delivery writes. No external email or booking action.

Verification: TypeScript/build with 137 guards; local rollback SQL covers complete data routing, opening versus action, timestamp spoof rejection, meaningful action requirement, head escalation visibility, retained history and Technical isolation. Desktop/mobile browser tests cover missing packing-list indicator, open without action and subsequent action after breach.

Setup: after local migration, a trusted administrator must insert one `sadu_logistics_routing` row with `officer_id` pointing to an existing LOGISTICS auth user and `head_id` pointing to an existing BIENNIAL_DIRECTOR or CHAIRMAN auth user. This does not grant those roles or create users. No production accounts or hosted database were modified.

Limits: legacy locked consignment records missing a packing list need a reviewed correction; assignment/routing changes require an administrative migration until an audited reassignment workflow exists. Current intake remains one consolidated consignment per artwork. In-app escalation is not email delivery, verified officer performance, insurance certification or carrier booking.
