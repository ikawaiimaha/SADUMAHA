# SADU Post-Greenlight Operational Questionnaire

This document records stealth process-oriented validation questions identified during state machine implementation and edge-case modeling for the Sharjah Calligraphy Biennial governance platform.

---

## Stage 5: Director's Veto & Balance Review

### Question 1: Post-Veto Remediation Protocol vs. Permanent Disqualification
* **Operational Observation:** When the Biennial Director executes an institutional veto (`DIRECTOR_VETOED`) with a mandatory justification, the state machine routes the decision back to the Coordinator queue.
* **Stealth Validation Question:** Does an executive veto permanently disqualify the candidate artist for the entire biennial edition, or can the General Coordinator address the logged reason (e.g., replacing a conflicting mockup or adjusting scope) and re-submit the dossier for secondary Director review?
* **Risk If Unresolved:** An undefined post-veto lifecycle causes ambiguity in roster quotas: either valuable artists are permanently lost to remediable minor conflicts, or unconstrained re-submissions create operational deadlock between Coordinators and Directorate.

