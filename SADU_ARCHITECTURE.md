# SADU Institutional Architecture & AI Governance Ruleset

> **CRITICAL SYSTEM PROMPT INSTRUCTION FOR AI AGENTS:**  
> This document is the absolute, immutable ruleset and single source of truth for the SADU (Sharjah Calligraphy Biennial) institutional governance portal. Any AI coding agent, system prompt, or automated refactoring workflow MUST treat this hierarchy, role division, operational gate, and state machine as immutable law for all code generation. No role titles, authorities, or gate sequences may be altered, merged, or diluted.

---

## 1. The True Institutional Hierarchy & Chain of Command

### 1. H.E. Abdullah Al Owais — Chairman / CEO (Executive Gate & Budget Allocation)
* **Scope:** Macro oversight. Presides over the entire Sharjah Department of Culture across all seasonal and yearly activities.
* **Portal Authority & Gate:** Serves as the ultimate executive gate. Evaluates candidate theme proposals defended by the Preparatory Committee, confers official theme ratification ("Approve Theme"), officially assigns the biennial budget ("Official Budget Assignment"), and executes the "Authorize Budget & Transfer Authority" sign-off, transitioning operational mandate to Biennial Director Mohammed Al Qaseer.

### 2. Mohammed Al Qaseer — Biennial Director (Executive Veto, Budget Evaluation & Artist Selection)
* **Scope:** Micro oversight / Arts Catalyst. Directs visual arts and calligraphy biennials.
* **Portal Authority & Gate:**
  * **Phase 1 (Initiation):** Manages the institutional calendar and convenes the Preparatory Committee to initiate theme proposals. Holds executive veto prior to Chairman escalation.
  * **Phase 2 (Pivot upon Budget Authorization):** Once Chairman Al Owais approves the theme and assigns the budget, Al Qaseer pivots to become the Head of the **Artist Selection Committee**, selecting artists matching the ratified theme within the locked budget.

### 3. Preparatory Committee (Theme Formulation)
* **Scope:** Academic & Curatorial Theme Formulation.
* **Portal Authority & Gate:** Convenes to formulate exactly three candidate theme proposals.
* **Strict Curatorial Rigor:** Themes cannot be justified with bureaucratic fluff. Each proposal must be defended across three mandatory criteria:
  1. **Aesthetic Framework:** Define the visual and stylistic parameters.
  2. **Contemporary & Historical Relevance:** Justify the theme's position within international art standards.
  3. **Curatorial Justification:** The rigorous defense of why this theme is necessary.
* The submission button ("Present to Chairman") remains strictly disabled until all fields across all three candidate themes are 100% complete.

### 4. General Coordinator (Program Operations)
* **Scope:** Program Operations. Assembles artist dossiers, cross-references restrictions, tracks intake requirements, and orchestrates invitation workflows based on Al Qaseer's artist selections.

### 5. Artist / Participant (الفنان — External Access)
* **Scope:** External Contributor. Secure participant intake portal to upload passports, high-res artwork photos, production specs, and bilingual artist biographies.

### 6. Finance & Contracts (الشؤون المالية — Legal & Budget)
* **Scope:** Legal, Contracts & Disbursements. Generates bespoke bilingual PDF artist contracts and tracks milestone payment tranches.
* **Hard Security Lock:** Contract generation and disbursements remain strictly locked until Chairman Al Owais assigns and authorizes the official budget.

### 7. PR & Protocol (العلاقات العامة — Logistics & Media)
* **Scope:** Logistics & Media. Extracts verified dossiers for catalog publishing, manages flight itineraries, and coordinates hospitality and protocol.

---

## 2. Institutional Workflow & Operational Phase Gates

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: THEME FORMULATION & RATIFICATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Mohammed Al Qaseer (Director) convenes Preparatory Committee.             │
│ 2. Preparatory Committee formulates 3 distinct proposals:                   │
│    - Aesthetic Framework (Visual & stylistic parameters)                    │
│    - Contemporary & Historical Relevance (International art standards)      │
│    - Curatorial Justification (Academic defense of necessity)               │
│ 3. Proposals submitted to H.E. Abdullah Al Owais (Chairman / CEO).          │
│ 4. Chairman reviews proposals -> Selects 1 proposal -> "Approve Theme".     │
│ 5. Chairman unlocks "Official Budget Assignment":                           │
│    - Inputs approved biennial budget amount (AED)                           │
│    - Clicks "Authorize Budget & Transfer Authority"                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: BUDGET LOCK & OPERATIONAL AUTHORITY TRANSITION                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. Budget is locked. Operational authority transitions to Mohammed         │
│    Al Qaseer to head the Artist Selection Committee.                        │
│ 7. Al Qaseer reviews nominations & selects artists matching theme & budget. │
│ 8. General Coordinator compiles artist dossiers and dispatches invitations. │
│ 9. Finance & Contracts generates bilingual agreements & releases tranches.  │
│ 10. PR & Protocol extracts catalog data & coordinates travel hospitality.    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Codebase Invariants & Component Responsibilities

1. **`src/components/RoleSelection.tsx`:**  
   Defines the 7 institutional roles respecting the chain of command:
   * Chairman (`H.E. Abdullah Al Owais - Executive Gate`)
   * Biennial Director (`Mohammed Al Qaseer - Executive Veto, Budget Evaluation & Artist Selection`)
   * Preparatory Committee (`Theme Formulation`)
   * Coordinator (`Program Operations`)
   * Artist (`External Access`)
   * Finance (`Legal & Budget`)
   * PR (`Logistics & Media`)  
   The grid must be displayed proportionally (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

2. **`src/components/CommitteeThemeWorkspace.tsx`:**  
   Enforces zero bureaucratic fluff. No generic definition text area. Each of the 3 theme proposals requires:
   * **Aesthetic Framework:** Define the visual and stylistic parameters.
   * **Contemporary & Historical Relevance:** Justify the theme's position within international art standards.
   * **Curatorial Justification:** The rigorous defense of why this theme is necessary.  
   The "Present to Chairman" action remains strictly disabled until all fields across all three themes are completely filled.

3. **`src/components/ChairmanWorkspace.tsx`:**  
   Displays candidate themes. When the Chairman clicks "Approve Theme", reveals the section titled **"Official Budget Assignment"** with an input field for the approved budget amount and an **"Authorize Budget & Transfer Authority"** button. Clicking this button triggers the final success state confirming the budget is locked and authority has officially transitioned to Mohammed Al Qaseer for artist selection.

