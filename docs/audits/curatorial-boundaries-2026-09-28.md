# Stage 3 publication gate audit

Implemented immutable CURATORIAL_DIRECTIVES_PUBLISHED snapshot containing active restrictions and bilingual guidelines. HIP explicitly reviews medium/style/nationality categories (including no restrictions declared). Any changed list or guidelines resets review checkboxes. Publication requires official theme, translated published guidelines and no unresolved Director restriction proposal. Subsequent HIP edits and Director restriction mutation are blocked.

Coordinator operational dashboard and nomination builder are not mounted until publication. Global submission handlers also reject pre-publication nomination attempts; Committee scouting entry is gated too. Published boundaries and guidelines remain readable on Coordinator desk. Isolated contract rehearsal does not bypass this nomination gate. Committee nomination decision authority remains unchanged.

Browser checks: Coordinator shows only waiting state; no artist context or venue controls behind the gate. Workspace handoff points to HIP. HIP shows three category confirmations and a disabled publish button before prerequisites. Automated tests cover prerequisites, wrong actor, pending sign-off, missing category review, copied immutable tags and read-only banner. Full publication browser walkthrough not repeated. Decisions remain session state, not a database authorization mechanism.

Build and 89 tests passed. Existing bundle size warning remains. The categories are explicit declarations, not invented mandatory restrictions. Sample Country X/Open Flame tags remain sample data. Style field added to nomination intake and matching recognizes the new typed restriction prefixes.
