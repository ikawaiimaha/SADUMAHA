# SADU Institutional Architecture & AI Governance Ruleset

> **CRITICAL SYSTEM PROMPT INSTRUCTION FOR AI AGENTS:**  
> This document is the absolute, immutable ruleset and single source of truth for the SADU (Sharjah Calligraphy Biennial / Multaqa) institutional governance portal. Any AI coding agent, system prompt, or automated refactoring workflow MUST treat this exact chronological workflow, role division, operational gate, and state machine as immutable law for all code generation. No role titles, authorities, or gate sequences may be altered, merged, or diluted.

---

## 1. Chronological Operational Workflow (The Multaqa Stages)

### Stage 1: Theme Proposal & Executive Ratification
* **Preparatory Committee (اللجنة التحضيرية):** Formulates 3 theme proposals, writing the initial explanation and curatorial intent for each across three mandatory artistic criteria:
  1. *Aesthetic Framework:* Define the visual and stylistic parameters.
  2. *Contemporary & Historical Relevance:* Justify the theme's position within international art standards.
  3. *Curatorial Justification:* The rigorous defense of why this theme is necessary.
* **Chairman (H.E. Abdullah Al Owais / رئيس الدائرة):** Reviews the 3 proposals and officially selects/approves one theme and assigns the budget. Once locked, the theme does not go directly to the HIP; instead, the system updates the status to **Pending Editorial Polish** and routes the theme to the Editorial Department.

### Stage 2: Editorial Polish & Final Phrasing
* **Editorial Department (قسم التحرير):**
  * Receives the Chairman-approved theme in the Approved Theme Queue.
  * Takes the Preparatory Committee's raw explanation, aesthetic framework, and curatorial intent.
  * Rewrites it into the final, polished bilingual (Arabic/English) institutional text:
    - *Official Theme Essay (Arabic)*
    - *Official Theme Essay (English)*
  * **Publishing Gate:** Holds exclusive authority to click **"Publish Official Theme"**. Once Editorial publishes the final text, it updates global state to **Published**, becoming the immutable official theme visible to the HIP and Coordinators.

### Stage 3: Curatorial Guidelines & Dynamic Blocklists
* **HIP (Head of International Programs / منسق معرض عام):**
  * Receives the polished official theme published by Editorial.
  * Drafts the operational curatorial brief and exhibition guidelines based on the approved, phrased theme.
  * Manages the **"Dynamic Blocklist"** (an active array of restricted tags, e.g., temporarily restricting certain nationalities or mediums due to real-time political/security directives).
  * **System Invariant:** If a Coordinator or Committee member attempts to submit an artist matching an active blocked tag, the system immediately rejects the submission with an alert:  
    `"Submission blocked by current HIP security/administrative directives."`

### Stage 4: Artist Nomination (The Multaqa Protocol)
* **Preparatory Committee & Coordinators (اللجنة التحضيرية والمنسقون):** Collaboratively nominate artists.
* **Strict Dossier Schema (Hard Validation):** The system blocks submission unless the dossier contains all mandatory components:
  1. `artistName` (String, Required)
  2. `artistCategory` (Enum: `'Emerging'` or `'Established'`, Required)
  3. `cvUpload` (CV in PDF format / boolean flag, Required)
  4. `previousWorks` (Images of Previous Work / boolean flag, Required)
  5. `newWorkMockup` (Mockups/Sketches of the proposed new work / boolean flag, Required)
* **Strategic Tagging:** Each nominated artist must be tagged as either **Emerging Artist** or **Established Artist** to maintain exhibition balance.

### Stage 5: Director's Veto & Balance Review
* **Biennial Director (Mohammed Al Qaseer):**
  * Reviews the submitted dossiers in the candidate pool.
  * **Balance Review:** The UI provides a visual ratio and progress bar of Emerging vs. Established artists currently in the proposed pool to ensure institutional goals are met.
  * **Absolute Veto Power:** Holds absolute veto power over any artist. Clicking "Veto/Reject" requires selecting a reason from a dropdown (e.g., Budget, Security, Curatorial Mismatch, Administrative Directive) and automatically routes the status and rejection feedback back to the Coordinators.

### Stage 6: Contracting & Logistics
* **Coordinator (المنسق العام):** Drafts customized bilateral artist contracts specifying production values and shipping terms based on Director-approved artists.
* **Artist (الفنان):** External access portal to approve contract terms and upload passports and print-quality high-resolution artwork files.
* **PR (التشريفات):** Verifies passports and print-quality images for catalog publishing, delegation logistics, and exhibition wall text.
* **Finance (المالية):** Executes payment tranches based on the locked contract and Chairman budget allocation.

---

## 2. Institutional Roles Mapping (9 Distinct Roles)

1. **Chairman** (H.E. Abdullah Al Owais - Executive Gate & Budget Allocation)
2. **Biennial Director** (Mohammed Al Qaseer - Executive Veto, Balance Review & Artist Selection)
3. **Preparatory Committee** (Theme Formulation & Initial Curatorial Intent)
4. **Editorial** (قسم التحرير - Theme Rewriting & Bilingual Polishing)
5. **HIP** (Head of International Programs / منسق معرض عام - Curatorial Guidelines & Dynamic Blocklists)
6. **Coordinator** (Program Operations & Dossier Assembly)
7. **Artist** (External Access - Portfolio & Dossier Intake)
8. **Finance** (المالية - Contracts & Tranche Disbursements)
9. **PR** (التشريفات - Passports & Print Verification)

---

## 3. System Invariants & Enforcement Gates

1. **Editorial Polish Gate:** When Chairman Al Owais approves a theme and locks the budget, it is not sent immediately to the HIP. The theme enters **Pending Editorial Polish** status. Only the Editorial Department can craft the official Arabic and English theme essays and execute the **"Publish Official Theme"** action to unlock Stage 3 for the HIP and Coordinators.
2. **Zero Fluff Theme Gate:** Chairman cannot approve until 3 distinct themes have Aesthetic Framework, Contemporary Relevance, and Curatorial Justification.
3. **Dynamic Blocklist Gate:** Any nomination matching an active HIP blocked tag triggers an immediate system rejection: `"Submission blocked by current HIP security/administrative directives."`
4. **Dossier Schema Gate:** Submissions missing `artistName`, `artistCategory` ('Emerging'/'Established'), `cvUpload`, `previousWorks`, or `newWorkMockup` are strictly blocked.
5. **Director Balance & Veto Gate:** The Director's dashboard renders a visual ratio bar of Emerging vs. Established artists. Vetoes require selecting a reason from a dropdown (Budget, Security, Curatorial Mismatch, Administrative Directive) and routes the status back to Coordinators.
6. **Financial Lock Gate:** Finance cannot execute payment tranches until contracts are locked post-Chairman budget authorization.


