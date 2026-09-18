# SADUVISION — repaired bilingual demonstration

Complete runnable source prepared for GitHub on 18 September 2026, based on the audited `SADUVISION-main (5).zip`.

This package includes the tested audit fixes. The proposed shared custody-handover record and global programme filtering have **not** been implemented yet.

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

`lint` runs TypeScript checking. `build` runs that check and then produces the Vite application in `dist/`. No API key or environment file is required for this demonstration.

## Upload to GitHub

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

## What is implemented

- Arabic and English demonstration screens, introductory presentation, and selectable role views.
- The nine-chapter introduction opens with H.H. Sheikh Dr. Sultan bin Muhammad Al Qasimi, with his full name as the main heading and a full-width, uncropped portrait. Al Owais and Al Qaseer follow in chapters 2–3. The active Directorate dashboard also places his full-width portrait card above their cards. This presentation hierarchy does not change system permissions or delegated authority. The accompanying copy is proposed SADU content, not attributed statements or endorsements. These are in-app slides, not separate PDF or PowerPoint attachments.
- Repaired platform startup, KPI controls, navigation guards, RFQ default selection, and storage-failure handling.
- Complete paginated vector report rows; Arabic and mixed-script reports use the browser's **Print / Save PDF** view.
- Corrected sample banking, contract-preview, and report labels; a mobile RTL status wrapping fix.

## Demonstration boundaries

This is a browser-only prototype with sample data. It does not implement real sign-in, server authorization, durable case storage, encryption, messaging, signatures, or payments. Local workflow state may reset when changing views or reloading. Programme selection does not yet consistently filter all records. Role names and policy examples do not establish institutional authority.

External Google Fonts require connectivity on an uncached first load. Arabic report export opens a printable view; choose the browser's PDF destination. Sample reports and RFQs are not approved institutional instruments.

See `CHANGELOG.md` for the included fixes and verification summary. This repository update contains the repaired demonstration and its handoff documentation; it does not add a new deployment configuration or implement the proposed shared custody workflow.
