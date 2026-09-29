# Guest document gates — 29 September 2026

Fixed the previous expiry-after-arrival check: six calendar months now gate intake in browser and database. Month-end and leap-year tests cover the exact boundary and one-day-short rejection.

Added bilingual nationality selection and a policy-driven National ID PDF for IQ/PK/AF. The database snapshots policy decisions, rejects client spoofing, requires stored PDF evidence before finalization and retains immutable historical submissions. New PR itinerary approval cannot use legacy packets with unrecorded policy evidence.

Privacy verification: owner uploads, PR sees finalized ID; Coordinator, Finance, Technical, HIP and Director cannot select private guest objects. Policy tests also cover missing ID, PR draft invisibility and idempotent finalization. No private data is put in localStorage or logs.

Validation: production build and 134 guards; desktop/mobile browser intake, short-expiry warning, conditional ID, interrupted-upload retry and PR download controls; local rollback PostgreSQL tests. Existing bundle-size warning remains.

Authority limits: the country matrix is supplied by the user, not independently verified immigration law. Official passport guidance checked: https://gdrfad.gov.ae/en/services/f9e586fe-0642-11ec-0320-0050569629e8 . The configured six-month arrival gate implements the requested workflow and is not a universal visa eligibility determination. PR still inspects scan quality and applicability. No new encryption layer or legal compliance certification is claimed. Hosted SQL rollout and companion policy expansion remain separate.
