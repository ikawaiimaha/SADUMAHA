# Sources and authority corrections — 20 September 2026

Scope: the fictional SADU mockup. These changes correct claims and attribution; they do not certify compliance, authenticate delegation or implement government services. The preceding source audit and its private original documents remain in the local research workspace, not the public app.

| Finding | Correction | Main files |
|---|---|---|
| SA-01 | Replaced named-person signing with resettable DEMO specialist reviews. Nomination success now says local preview, not delivery to an official. | CommitteeView, ArtistNominationBuilder |
| SA-02 | Removed executed-contract assertions and the unsupported section-4 exclusion claim. Contract generation describes its actual local preview. Generic stage popovers identify sample stages. | ScopeContractsView, StatusProgressIndicator, locales |
| SA-03 | Replaced legal permit issuance with a local sample venue review and DEMO reference. Onboarding and role descriptions now match. | TechnicalMuseumDashboard, RoleOnboarding, mockData |
| SA-04 | Marked scoring, procurement and payment dependencies as scenario assumptions. Removed financial authorization, patronage and supplier-award assertions. | OperationsView, PrProtocolDashboard, CommitteeView, ArtistView, locales |
| SA-05 | Removed invented manuscript authentication and the unsourced additional verse. Editorial seeds now use explicitly authored sample text and DEMO editors. Retained classical excerpts in Committee carry narrow attribution references, not authentication. | EditorialPipeline, CommitteeView |
| SA-06 | Replaced checksum and identity-verification badges with accurate sample-reference/field-check labels. | CommunicationView, PrProtocolDashboard |
| SA-07 | Removed approved catalogue-blueprint and museum-format claims. Label outputs retain a sample watermark; RFQ disclaimer is visible onscreen and in print. | GalleryLabelPrintView, RfqGeneratorModal, EditorialPipeline |
| SA-08 | Qualified 65/35 scoring and novelty criteria; removed claims of actual vendor certification and engineering approval from seed records. Supplier comparison names are DEMO identities. | CommitteeView, TechnicalMuseumDashboard, mockData |
| SA-09 | Corrected Arabic and English together, including LPO, contract, print and threshold labels. | locales and affected components |
| SA-10 | Added a public claim register with source identity, URL, publication/check dates, passage, language treatment and authority limit. Panels accompany quotations, leadership references, programme entries and magazine/department references. | claimRegister, ClaimProvenance, ExecutiveQuote, PortraitHierarchy, DirectorateOversight, ChairmanBrief |
| SA-11 | Included the earlier uncommitted workflow-linkage work, updated obsolete portrait documentation, and stopped tracking generated dist files. Builds are generated from source. | WORKFLOW_LINKAGE.md, tests, documentation, Git index |

## Source interpretation

- The English opening quotation is a verbatim excerpt from Sharjah24's 16 December 2025 report, not a SADU-authored translation. Its Arabic counterpart is referenced to Al Wusta 76 (January 2026). Neither endorses SADU.
- Public SDC articles support titles and programme context. They do not establish appointments, reporting lines, current completion, spending, selection, publication or signing powers.
- The source contract's section 4 covers first-party obligations. The former exclusion wording was removed rather than reassigned a guessed clause number.
- The claimed approved catalogue template was not established. No substitute source is presented as an approved institutional specification.
- Checked dates record the source audit, not an institution's approval. Metadata completeness is not proof of authenticity or permission.

## Verification

- TypeScript, production build, 42 workflow tests and 8 demonstration-boundary tests.
- Six existing browser checks cover roster → programme → proposal → selection → custody → executive totals, draft isolation and editorial scope on desktop/mobile.
- Eight new browser checks cover DEMO specialist/venue actions in both languages, the disconnected UAE PASS walkthrough, and all nine presentation chapters at 320×700, 390×844, 844×390 and 1366×768. All 14 browser checks passed with installed Edge (`PLAYWRIGHT_CHANNEL=msedge`). Provenance panels expand without horizontal overflow. Reading surfaces are keyboard-focusable and navigation remains reachable.
- Chapter geometry is compared after fonts settle. Google-hosted font loading can still cause an initial layout shift; cold-network performance and offline typography are not certified. The large main JavaScript bundle remains a performance limitation.
- Physical projectors, actual phones/tablets, assistive technologies and independent Arabic editorial approval were not exhaustively tested. Browser emulation is not a guarantee for every screen.
- UAE PASS remains a proposed, disconnected walkthrough. No authentication, signature, external delivery, institutional permission, banking verification or durable records were added.

Production publication is verified separately against the deployed commit and live asset bundle. Earlier historical deployments and third-party caches are outside this check.
