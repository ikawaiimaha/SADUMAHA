# Label and inventory audit — 29 September 2026

Implemented structured religious-title declarations, complete bilingual PDF proof export, formatting in CSV, and management session inventory downloads. HIP has read-only inventory access.

Review fixes: source Arabic medium/concept now resolve correctly; parentheses normalize malformed imports; missing declarations fail closed; submitted declarations cannot change; async export checks unmount/current approval; CSV neutralizes formula prefixes and preserves unknown versus zero counts.

Validation: TypeScript/build and 133 guard tests passed; PDF download tested on desktop/mobile and page visually reviewed. Local database tests cover missing declaration and immutable declaration, alongside existing complete-delivery/Finance isolation gates.

Limitations: PDF is a raster proof pending approved museum typography/trim and attribution. No hosted SQL applied. Inventory is current session data. Historical unknown declarations require a future reviewed amendment path, not silent backfill.
