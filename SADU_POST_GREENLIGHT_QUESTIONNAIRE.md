# SADU Post-Greenlight Operational Questionnaire

This document records process-oriented validation questions identified during state machine implementation and edge-case modeling for the Sharjah Calligraphy Biennial governance platform.

---

## Stage 5: Director's Veto & Balance Review

### Question 1: Post-Veto Remediation Protocol vs. Permanent Disqualification
* **Operational Observation:** When the Biennial Director executes an institutional veto (`DIRECTOR_VETOED`) with a mandatory justification, the state machine routes the decision back to the Coordinator queue.
* **Validation Question:** Does an executive veto permanently disqualify the candidate artist for the entire biennial edition, or can the General Coordinator address the logged reason (e.g., replacing a conflicting mockup or adjusting scope) and re-submit the dossier for secondary Director review?
* **Risk If Unresolved:** An undefined post-veto lifecycle causes ambiguity in roster quotas: either valuable artists are permanently lost to remediable minor conflicts, or unconstrained re-submissions create operational deadlock between Coordinators and Directorate.


---

## V25.0 Addendum — Governance, Contracts & Legal Compliance

**Document status:** Internal review draft; not dispatched. The repository contains Question 1 above, but not the complete Questions 2–116. Numbers 117–119 are retained from the supplied V25.0 additions; this file is not represented as the complete 119-question master.

**Evidence boundary:** The questions below retain the supplied wording. Statements about the absence of registries, unrestricted access, or decentralized approval must be verified with the responsible departments. Before dispatch, distinguish a documented control gap from an assumption or an unanswered question. Word/Excel usage alone does not establish a legal or governance violation. SADU controls require institutional approval, production deployment and verification; a prototype does not itself establish compliance.

### 117. Legal Risk of Ad Hoc Contracts

If individual coordinators are permitted to draft, alter, and agree to exhibition contracts on an *ad hoc* basis without a system-locked legal approval workflow, how does the institution currently protect itself from unauthorized financial commitments or unforeseen legal liabilities?

إذا كان يُسمح للمنسقات بصياغة وتعديل والموافقة على عقود المعارض بشكل مخصص (Ad hoc) دون مسار موافقة قانونية مقفل في النظام، كيف تحمي المؤسسة نفسها حالياً من الالتزامات المالية غير المصرح بها أو التبعات القانونية غير المتوقعة؟

**Primary respondents:** Legal, Finance and Director.

**Evidence requested:** Approved contract templates; delegated signing authority and financial limits; Legal/Finance review requirements; amendment procedure; one redacted example showing approval before commitment. Identify who may draft, negotiate, approve and sign separately.

### 118. The Missing Audit Trail

Given the complete lack of a centralized digital registry, if an international dispute arises regarding insurance or damaged artwork, how does executive management locate the legally binding version of a contract when it may only exist in a coordinator's WhatsApp history or personal Outlook attachments?

نظراً للافتقار التام إلى سجل رقمي مركزي، إذا نشأ نزاع دولي بشأن التأمين أو عمل فني متضرر، كيف تتمكن الإدارة التنفيذية من تحديد النسخة الملزمة قانونياً من العقد عندما تكون موجودة فقط في سجل محادثات واتساب أو المرفقات الشخصية للمنسقة؟

**Primary respondents:** Legal and records custodian; Director accountable for ownership.

**Evidence requested:** First confirm whether any central register, document-management system or controlled physical archive exists. Request its owner, approved-copy identification method, signature evidence, amendment/version history, retention rules, access controls and a redacted retrieval demonstration. If a registry exists, revise the opening premise before dispatch.

### 119. Vulnerability of Editable Files

Transparency and institutional best practices demand strict standardization. Why are processes involving high-value assets and significant government budgets currently managed through editable Microsoft Word and Excel files, which are inherently vulnerable to manipulation, human error, or accidental deletion?

تتطلب الشفافية وأفضل الممارسات المؤسسية توحيداً صارماً للمعايير. لماذا تُدار العمليات التي تتضمن أصولاً عالية القيمة وميزانيات حكومية ضخمة حالياً عبر ملفات Microsoft Word و Excel قابلة للتعديل، والتي تعتبر بطبيعتها عرضة للتلاعب أو الخطأ البشري أو الحذف غير المتعمد؟

**Primary respondents:** IT, records custodian, Legal and Finance.

**Evidence requested:** Template ownership, document permissions, version history, approved-release controls, retention/backups and restore testing. Assess these controls rather than treating the file extension as proof of a violation.

## V25.0 Proposed Departmental Dispatch Plan

This is a routing plan, not authorization or confirmation of external dispatch. Questions 117–119 are available here; the other topics below still need mapping to the complete questionnaire. Do not assign invented numbers or claim all 119 questions have been classified.

| Packet | Proposed lead recipients | Included questions / topics | Requested outcome |
| --- | --- | --- | --- |
| 1 — Executive Risk & Financial Control | Director, Legal, Finance | Questions 117–119; approval of hotel extensions; ownership and verification of declared insurance values and coverage | Confirm authority limits, contract standards, exception approvals and records ownership. |
| 2 — Data Security & International Reputation | PR, Protocol, IT | Access to passports/IDs and travel records; approved multilingual visa-decision communications; repeated requests for previously supplied information | Confirm access/retention controls, authorized communication ownership and the authoritative guest-data record. |
| 3 — Operational Reliability & Data Quality | Operations, Editorial, Design | Re-entry of prices/dimensions; availability of blueprints during leave; matching artwork images, reference IDs and printed labels | Confirm handoff owners, source/version controls, continuity arrangements and acceptance criteria. |

### Dispatch procedure

1. Reconcile this addendum with the complete master, preserving question IDs and version history.
2. Validate each factual premise and remove unsupported legal/privacy assertions. Use redacted examples, not passport copies or private correspondence, as packet evidence.
3. Prepare a short cover note for each packet: purpose, observed issue, questions, evidence requested and decision needed. Keep the complete master available as a reference.
4. Nominate one accountable respondent per question. Other recipients contribute; being copied does not create ownership. Agree a response deadline instead of inferring one.
5. Record responses centrally. Link cross-department dependencies to the same question ID so recipients do not answer competing copies.
6. Consolidate evidence and unresolved decisions into an executive readout before proposing policy or system changes.

### Response and finding register

| Question / topic | Accountable owner | Current process | Evidence reference | Finding status | Decision or corrective action | Due date |
| --- | --- | --- | --- | --- | --- | --- |
| 117 | To be nominated | Awaiting response | Not supplied | Not assessed | Confirm drafting, approval and signature authorities | To be agreed |
| 118 | To be nominated | Awaiting response | Not supplied | Not assessed | Verify authoritative contract register and retrieval process | To be agreed |
| 119 | To be nominated | Awaiting response | Not supplied | Not assessed | Verify document lifecycle controls | To be agreed |

Use finding states **Not assessed**, **Evidence requested**, **Control evidenced**, **Gap evidenced**, or **Not applicable with rationale**. An unanswered question is not a proven violation. A reported use of Excel is a process description; the finding depends on the applicable requirement and evidence of how the process is controlled.
