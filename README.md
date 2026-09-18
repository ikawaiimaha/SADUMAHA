# SADUVISION — audited demonstration copy

Reviewed on 18 September 2026 from `SADUVISION-main (5).zip`.

This is a browser-only React/Vite prototype with sample data. It has no real authentication, server-side authorization, database, payments, messaging, electronic signatures, or encrypted vault. Role switching demonstrates views; it does not grant institutional authority. Most operational changes reset when their component unmounts or the page reloads.

## Run locally

Use a current Node.js version compatible with Vite 6 and the committed npm lockfile:

```text
npm ci --ignore-scripts
npm run dev
```

Open the local address printed by Vite. The default development server binds to `127.0.0.1`.

```text
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

`lint` currently means TypeScript checking; there is no ESLint configuration. Build now runs the type check before bundling. No Gemini key or `.env` file is required for the current mockup. Do not enter real banking, identity, or confidential institutional information.

## Which code runs?

`index.html` loads `src/main.tsx`, which loads `src/App.tsx`. Edit the `src/` tree. Similar files at the repository root are inactive legacy copies retained from the supplied archive. TypeScript and the `@` alias now target the active tree. Do not run the legacy `patch*.cjs` scripts as setup steps.

Use `package-lock.json` with npm for this repaired copy. The original `bun.lock` remains as input provenance and does not include the added React type packages; it was not used to validate this repair.

## Reports

ASCII reports use the existing vector PDF renderer. Arabic and mixed-script reports open the report view; choose **Print / Save PDF** and the browser's PDF destination. This preserves browser font shaping and all report rows. External Google Fonts still require connectivity on an uncached first load. Sample reports and quotation previews are not approved institutional instruments.

## Review package

The accompanying `AUDIT.md` explains the architecture, defects fixed, remaining gaps, and test evidence. `changes.patch` records changes against the input ZIP, with banking-like literals redacted. Use the repaired source for builds. The live SADU application and the previously published Vercel mockup were not modified or published by this audit.
