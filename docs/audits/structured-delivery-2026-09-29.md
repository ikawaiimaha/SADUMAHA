# Structured delivery audit

Fixed a final-submit bypass: matching artist-entered zones was insufficient without an approved institutional artwork count. The new database trigger rejects missing counts, partial sets and missing declared values. Frontend controls explain those locks. Bilingual export now excludes incomplete approved groups.

Added the private structured value ledger and Artist/Finance views. Amounts use integer minor units, allow intentional zero and reject excess precision or exponent notation. Totals remain currency/purpose-specific. Server-derived title and timestamp, column grants and RLS prevent forged ownership, Finance mutation and access to unfinished values. No USD 20,000 assumption is seeded.

Verification: production build; 132 guard tests; desktop/mobile value-entry tests; local SQL transaction checks for absent/mismatched scope, missing values, zero value, Finance access before/after final submission and denied mutation. SQL fixtures rolled back. Existing bundle warning remains.

Limits: local schema only; production e-signature provider is unconfigured. Simulated acceptance no longer displays Signed & Active. Metadata export is not print-quality certification. Values lock when recorded and require a separately designed revision workflow for corrections. Historical submitted scenarios are not retroactively altered.
