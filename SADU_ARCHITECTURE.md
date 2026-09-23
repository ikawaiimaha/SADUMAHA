# SADU Project Architecture & AI Handoff Document

Provide this document to your next AI agent to establish the absolute source of truth for the Sharjah Calligraphy Biennial (SADU) governance portal. Instruct the agent to treat this architecture as immutable.

## 1. The Corrected Institutional Hierarchy & Chain of Command

**H.E. Abdullah Al Owais (Chairman / CEO)**

* **Scope:** Macro. Oversees the entire Sharjah Department of Culture across all seasonal and yearly activities.
* **Portal Authority:** Reviews the heavily defended, rigorous artistic theme proposals. Holds the ultimate executive authority to sign off on the official theme and officially **assign the budget**.

**Mohammed Al Qaseer (Director of the Biennial / Directorate)**

* **Scope:** Micro / Arts Catalyst. Oversees specific arts programming (e.g., Islamic Arts Festival, Calligraphy Biennial).
* **Portal Authority:** Knows the operational calendar. Convenes the Preparatory Committee to initiate theme proposals.
* **Phase 2 Pivot:** Once the Chairman approves the theme and assigns the budget, Al Qaseer pivots to become the head of the committee responsible for **selecting the artists** that fit the funded theme.

**Preparatory Committee**

* **Scope:** Theme Formulation.
* **Portal Authority:** Must propose themes to the Chairman.
* **Strict Curatorial Rigor:** Themes cannot be justified with bureaucratic fluff. They must be defended using meticulous artistic criteria, solid curatorial justification, and adherence to the highest international standards of art.

**General Coordinator**

* **Scope:** Program Operations. Assembles artist dossiers, cross-references restrictions, and orchestrates the invitation workflows based on Al Qaseer's artist selections.

**External & Operational Departments**

* **Artist (الفنان):** External user portal to upload passports, high-res artwork photos, and bilingual bios.
* **Finance & Contracts (الشؤون المالية):** Generates bespoke bilingual PDF contracts and tracks payment tranches (unlocked only after the Chairman assigns the budget).
* **PR & Protocol (العلاقات العامة):** Extracts artist dossiers for exhibition catalogs, manages flight itineraries, and coordinates hospitality.

---

## 2. The Operational Workflow (Phase 1 & 2)

1. **Initiation:** Mohammed Al Qaseer convenes the Preparatory Committee based on the established cultural calendar.
2. **Meticulous Formulation:** The Preparatory Committee drafts theme proposals. They are forced by the system to provide bulletproof, highly rigorous artistic justifications for each theme.
3. **Executive Sign-Off:** The proposals are routed to Chairman Al Owais. He evaluates the artistic criteria, locks the official theme, and assigns the budget.
4. **Artist Selection:** Authority routes back to Mohammed Al Qaseer, who now heads the committee to select the specific artists that align with the ratified theme and budget.

---

## 3. Current Codebase State (React / Vite / Tailwind)

* **`src/App.tsx`:** Operates as the central state machine and routing engine. Holds the `currentRole` state and the `submittedThemes` array in memory.
* **`src/components/RoleSelection.tsx`:** The entry portal rendering the institutional hierarchy. *(Note: Currently missing the operational departments and needs Al Qaseer's role properly split from the Chairman).*
* **`src/components/CommitteeThemeWorkspace.tsx`:** The Preparatory Committee's drafting table. *(Note: Currently too simple. Needs a major refactor to enforce the strict artistic criteria required by the user).*
* **`src/components/ChairmanWorkspace.tsx`:** Displays the candidate themes, allows the Chairman to lock the winning theme, and triggers the success state.

---

## 4. Immediate Action Items for Your Next AI Agent

When you start your new session, instruct the AI to execute the following steps:

1. **Create a Master Architecture File:** Save this exact markdown text as `SADU_ARCHITECTURE.md` in the root folder so the AI never loses the hierarchy context.
2. **Refactor `CommitteeThemeWorkspace.tsx`:** Destroy the basic "Definition / Meaning" text box. Rebuild the form to force the Committee to fill out strict, meticulous fields (e.g., *Aesthetic Framework*, *Contemporary Relevance*, *Curatorial Justification*) before they are allowed to submit to the Chairman.
3. **Refactor `RoleSelection.tsx`:** Update the `AppRole` types and the `ROLE_OPTIONS` array to perfectly reflect the 7 distinct roles defined in Section 1 (Chairman, Biennial Director, Preparatory Committee, Coordinator, Artist, Finance, PR).
4. **Update `ChairmanWorkspace.tsx`:** Add a "Budget Assignment" UI element that unlocks when Chairman Al Owais approves the theme, signaling the transition of authority back to Al Qaseer for artist selection.
