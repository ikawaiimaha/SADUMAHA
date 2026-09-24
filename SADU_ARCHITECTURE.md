# SADU Institutional Architecture & AI Governance Ruleset

> **CRITICAL SYSTEM PROMPT INSTRUCTION FOR AI AGENTS:**  
> This document is the absolute, immutable ruleset and single source of truth for the SADU (Sharjah Calligraphy Biennial / Multaqa) institutional governance portal. Any AI coding agent, system prompt, or automated refactoring workflow MUST treat this exact chronological workflow, role division, operational gate, and state machine as immutable law for all code generation. No role titles, authorities, or gate sequences may be altered, merged, or diluted.

---

## 1. Chronological Operational Workflow (The Multaqa Stages)

### Stage 1: Theme & Executive Ratification
* **Preparatory Committee (اللجنة التحضيرية):** Formulates 3 distinct theme proposals with strict, meticulous artistic justifications:
  1. *Aesthetic Framework:* Define the visual and stylistic parameters.
  2. *Contemporary & Historical Relevance:* Justify the theme's position within international art standards.
  3. *Curatorial Justification:* The rigorous defense of why this theme is necessary.
* **Biennial Director (Mohammed Al Qaseer / مدير البينالي):** Reviews the candidate proposals, exercises initial veto/curatorial review, and presents the defended themes to the Chairman.
* **Chairman (H.E. Abdullah Al Owais / رئيس الدائرة):** Approves the final theme ("Approve Theme"), assigns the overarching biennial budget, and formally authorizes the transition of authority back to Mohammed Al Qaseer.

### Stage 2: Curatorial Guidelines & Dynamic Blocklists
* **HIP (Head of International Programs / منسق معرض عام):**
  * Sets the overarching exhibition guidelines and curatorial brief based on the approved theme.
  * Manages the **"Dynamic Blocklist"** (an active array of restricted tags, e.g., temporarily restricting certain nationalities or mediums due to real-time political/security directives).
  * **System Invariant:** If a Coordinator or Committee member attempts to submit an artist matching an active blocked tag, the system immediately rejects the submission with an alert:  
    `"Submission blocked by current HIP security/administrative directives."`

### Stage 3: Artist Nomination (The Multaqa Protocol)
* **Preparatory Committee & Coordinators (اللجنة التحضيرية والمنسقون):** Collaboratively nominate artists.
* **Strict Dossier Schema (Hard Validation):** The system blocks submission unless the dossier contains all mandatory components:
  1. `artistName` (String, Required)
  2. `artistCategory` (Enum: `'Emerging'` or `'Established'`, Required)
  3. `cvUpload` (CV in PDF format / boolean flag, Required)
  4. `previousWorks` (Images of Previous Work / boolean flag, Required)
  5. `newWorkMockup` (Mockups/Sketches of the proposed new work / boolean flag, Required)
* **Strategic Tagging:** Each nominated artist must be tagged as either **Emerging Artist** or **Established Artist** to maintain exhibition balance.

### Stage 4: Director's Veto & Balance Review
* **Biennial Director (Mohammed Al Qaseer):**
  * Reviews the submitted dossiers in the candidate pool.
  * **Balance Review:** The UI provides a visual ratio and progress bar of Emerging vs. Established artists currently in the proposed pool to ensure institutional goals are met.
  * **Absolute Veto Power:** Holds absolute veto power over any artist. Clicking "Veto/Reject" requires selecting a reason from a dropdown (e.g., Budget, Security, Curatorial Mismatch, Administrative Directive) and automatically routes the status and rejection feedback back to the Coordinators.

### Stage 5: Contracting & Logistics
* **Coordinator (المنسق العام):** Drafts customized bilateral artist contracts specifying production values and shipping terms based on Director-approved artists.
* **Artist (الفنان):** External access portal to approve contract terms and upload passports and print-quality high-resolution artwork files.
* **PR (التشريفات):** Verifies passports and print-quality images for catalog publishing, delegation logistics, and exhibition wall text.
* **Finance (المالية):** Executes payment tranches based on the locked contract and Chairman budget allocation.


---

## 2. Institutional Roles Mapping (8 Distinct Roles)

1. **Chairman** (H.E. Abdullah Al Owais - Executive Gate & Budget Allocation)
2. **Biennial Director** (Mohammed Al Qaseer - Executive Veto, Balance Review & Artist Selection)
3. **Preparatory Committee** (Theme Formulation & Artist Nomination)
4. **HIP** (Head of International Programs / منسق معرض عام - Curatorial Guidelines & Dynamic Blocklists)
5. **Coordinator** (Program Operations & Dossier Assembly)
6. **Artist** (External Access - Portfolio & Dossier Intake)
7. **PR** (التشريفات - Passports & Print Verification)
8. **Finance** (المالية - Contracts & Tranche Disbursements)

---

## 3. System Invariants & Enforcement Gates

1. **Zero Fluff Theme Gate:** Chairman cannot approve until 3 distinct themes have Aesthetic Framework, Contemporary Relevance, and Curatorial Justification.
2. **Dynamic Blocklist Gate:** Any nomination matching an active HIP blocked tag triggers an immediate system rejection: `"Submission blocked by current HIP security/administrative directives."`
3. **Dossier Schema Gate:** Submissions missing `artistName`, `artistCategory` ('Emerging'/'Established'), `cvUpload`, `previousWorks`, or `newWorkMockup` are strictly blocked.
4. **Director Balance & Veto Gate:** The Director's dashboard renders a visual ratio bar of Emerging vs. Established artists. Vetoes require selecting a reason from a dropdown (Budget, Security, Curatorial Mismatch, Administrative Directive) and routes the status back to Coordinators.
5. **Financial Lock Gate:** Finance cannot execute payment tranches until contracts are locked post-Chairman budget authorization.


