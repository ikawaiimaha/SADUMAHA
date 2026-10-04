# SADU exhibition workflow prototype

SADU is an Arabic-first exhibition-workflow prototype prepared for institutional discussion. Start at `/overview` for the guided collection demonstration; the optional expanded view contains the presentation, independent workflow examples and technical explanation. The collection case follows an unavailable owner, an accepted backup, a valid pickup date and packing clearance. Readiness remains separate from a transport booking, physical collection or payment.

Presentation examples use synthetic roles and isolated browser-tab checkpoints. Separate local Node services provide file-backed persistence and server-validated demonstration commands; the presentation does not submit to those services. Institutional identity, production authorization and live integrations remain outside the demonstrated scope. See [SADU_ARCHITECTURE.md](SADU_ARCHITECTURE.md) for current workflow rules and [the research and claims brief](docs/research-and-claims-brief.md) before preparing research or proposal copy.

## Additional demonstrations

The repository also retains earlier delivery, publishing and artist-intake workspaces. Their implementation and persistence boundaries differ from `/overview`; do not infer a connected production journey from their presence.

Use **Join Institutional Roster** in the navigation or open `/join` directly for standalone registration (`/artist/register` is an alias). Open `/roster` to create a sample programme using three fictional pre-registered profiles. New registrations remain pending review.

Artist intake reuses one sample profile across two separate programme proposals. Optional device backup stores an allowlisted subset of text; legal names, contacts, files and submission receipts remain session-only. A coordinator can return a version for revision or record a completeness check. See [ARTIST_INTAKE_DEMO.md](ARTIST_INTAKE_DEMO.md) for the walkthrough and evidence limits.

## Run and build

Tested with Node.js 24.16.0 and npm. Use the included npm lockfile.

```sh
npm ci --ignore-scripts
npm run dev
```

Open the localhost address printed by Vite.

```sh
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

`lint` runs TypeScript checking. `build` runs TypeScript, the guard suite and the focused workflow suite before producing the Vite application in `dist/`. Synthetic examples require no external service credentials. The restricted preview still requires its local access-gate configuration; see [server/README.md](server/README.md#restricted-local-preview). Never put credentials in browser-exposed variables or commits.

## Hosting and institutional readiness

Publishing the Vite presentation on Vercel does not deploy the local Node services or establish an approved government hosting environment. This repository does not demonstrate a production container deployment, approved Sahab integration or compliance with an institution's data-residency requirements. The preview password gate protects access to the demonstration; it is not institutional identity or role authorization.

Before a live pilot, the institution and IT must confirm the permitted hosting environment, data classes, authority assignments, retention, encryption, backups and restore procedures. Authentication, storage and other provider adapters require specific implementation and integration tests. Local JSON persistence and synthetic role selection are demonstration mechanisms, not evidence of production readiness. Shipping, email, payments and government integrations remain paused.

## Earlier ZIP handoff notes

These instructions describe the original September 2026 ZIP handoff. Continue current development in the existing Git checkout; they are not instructions to overwrite it with an older archive.

1. Extract the ZIP.
2. Open the `SADUVISION` folder.
3. Put its **contents** at your repository root. `package.json`, `index.html`, `vite.config.ts`, `src/`, and `public/` must be at the same level.
4. Include `.gitignore` and `package-lock.json`.
5. Do not upload `node_modules/`, `dist/`, local environment files, or Vercel credentials.

The standalone ZIP contains the complete active application, assets, and build configuration. It excludes inactive duplicate root components, old repair scripts, the stale Bun lock, and generated builds. This repository retains those previously uploaded legacy files and `dist/`; they have not been removed by this update. Edit `src/`, do not run the legacy repair scripts, and generate a fresh build for deployment. The `.gitignore` prevents new generated files from being added but does not untrack existing files. Use npm with `package-lock.json` and set the build service's install command to `npm ci --ignore-scripts` so it does not select the old `bun.lock`.

## Structure

```text
src/
  main.tsx
  App.tsx
  components/
  context/
  data/
  i18n/
  utils/
  index.css
  types.ts
public/
index.html
package.json
package-lock.json
tsconfig.json
vite.config.ts
```

Edit `src/`: `index.html` loads `src/main.tsx`, which loads `src/App.tsx`.

## Earlier presentation features

The following describes retained presentation and workspace features, not the default `/overview` collection demonstration. The current pitch keeps one bounded collection case at its centre.

- All nine presentation chapters share a viewport-sized frame with stable card boundaries and navigation. Text and visuals sit side by side on desktop; mobile stacks the content inside a scrollable reading card while keeping navigation visible. Arabic mirrors the layout.
- Leadership presentation order is Al Qasimi, Al Owais, then Al Qaseer. Each uses the person's name as the heading and the existing operational theme as the subtitle, without a header icon. Typography, portrait scale, and an exclusive first-slide accent preserve this hierarchy within the shared frame. The Directorate overview uses three separate rows in the same order.
- Presentation portraits use individual 4:5 SVG viewports over the original JPEGs, with no image regeneration or source-file modification. The source-coordinate crops remove excess scenery and keep heads and headwear visible. The first portrait uses 100% of the available height, the second 92%, and the third 84%. Captions sit below the portraits without an extra filled frame; their desktop footer area aligns with the callout. On mobile, the order is heading, portrait/caption, description, and callout, with anchored navigation.
- Arabic and English demonstration screens, introductory presentation, and selectable role views.
- The nine-chapter introduction opens with H.H. Sheikh Dr. Sultan bin Muhammad Al Qasimi, with his full name as the main heading. Al Owais and Al Qaseer follow in chapters 2–3. The active Directorate dashboard places his full-width portrait card above their cards. This presentation hierarchy does not change system permissions or delegated authority. The accompanying copy is proposed SADU content, not attributed statements or endorsements. These are in-app slides, not separate PDF or PowerPoint attachments.
- Repaired platform startup, KPI controls, navigation guards, RFQ default selection, and storage-failure handling.
- Complete paginated vector report rows; Arabic and mixed-script reports use the browser's **Print / Save PDF** view.
- Corrected sample banking, contract-preview, and report labels; a mobile RTL status wrapping fix.

## Demonstration boundaries

The `/overview` examples save submitted synthetic steps in separate versioned tab checkpoints when browser storage is available. Refresh and unlocking can restore those steps; unsaved input, closed tabs and unavailable storage have different limits. The examples do not share a live dossier. Older workspaces may still reset. The separate local services serialize file-backed changes within one server process; they do not establish multi-instance database durability or institutional disaster recovery. Role names and policy examples do not establish delegated authority.

External Google Fonts require connectivity on an uncached first load. Arabic report export opens a printable view; choose the browser's PDF destination. Sample reports and RFQs are not approved institutional instruments.

Use [SADU_ARCHITECTURE.md](SADU_ARCHITECTURE.md) and the route-specific notes in `docs/` and `server/` for current boundaries. Dated audits, codebase exports and earlier presentation scripts describe their own revisions; they are not proof of the current deployment or live institutional integration.
