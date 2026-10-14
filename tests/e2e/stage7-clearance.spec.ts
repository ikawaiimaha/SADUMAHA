import { test, expect } from '@playwright/test';

// Stage 7 needs the whole theme→nomination→agreement pipeline to reach in the workbench, so this
// spec mounts the real PR, Technical and Finance workspaces around one shared commission state
// with an accepted sample agreement. The reducer rules are covered in tests/prWorkspace.test.tsx.

test('Stage 7 requires separate PR and Technical clearance before Finance release', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/src/main.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: `
    import React from '/node_modules/.vite/deps/react.js';
    import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
    import PRWorkspace from '/src/components/PRWorkspace.tsx';
    import TechnicalWorkspace from '/src/components/TechnicalWorkspace.tsx';
    import FinanceWorkspace from '/src/components/FinanceWorkspace.tsx';
    import { COMMISSION, createCommission, commissionReducer } from '/src/data/commissionScenario.ts';
    import '/src/index.css';
    const h = React.createElement;
    const contract = { id: 'contract-demo', artistId: COMMISSION.id, artistName: COMMISSION.artistName, artistCategory: 'Emerging', nationality: 'Fictional', medium: 'Bronze',
      proposedWorkTitle: COMMISSION.title, productionCost: 45000, shippingTerms: 'Sample delivery', cancellationClauseMandatory: false, status: 'ARTIST_APPROVED', auditTrail: [],
      tranches: { advancePercentage: 30, advanceAmount: 13500, advanceStatus: 'PENDING', deliveryPercentage: 40, deliveryAmount: 18000, deliveryStatus: 'PENDING', installationPercentage: 30, installationAmount: 13500, installationStatus: 'PENDING' },
      documents: { passportStatus: 'SUBMITTED', artworkDpi: 300, highResStatus: 'NOT_UPLOADED', catalogBioStatus: 'DRAFT' } };
    const initial = commissionReducer(createCommission(), { type: 'contracts', update: () => [contract] });
    function Harness() {
      const [role, setRole] = React.useState('FINANCE');
      const [state, dispatch] = React.useReducer(commissionReducer, initial);
      const at = () => new Date().toISOString();
      const artist = { id: COMMISSION.id, prCleared: state.evidence.prEvidenceGate, technicalCleared: state.evidence.technicalEvidenceGate, physicalAssetCleared: false };
      const desks = { PR_PROTOCOL: 'PR & Protocol', TECHNICAL: 'Technical', FINANCE: 'Finance' };
      return h('main', null,
        h('nav', { 'aria-label': 'Desks' }, ...Object.entries(desks).map(([key, label]) => h('button', { key, 'aria-pressed': role === key, onClick: () => setRole(key) }, label))),
        role === 'PR_PROTOCOL' && h(PRWorkspace, { isAr: false, state, onCheck: (field, value) => dispatch({ type: 'pr-check', actor: 'PR_PROTOCOL', field, value }), onClearPR: () => dispatch({ type: 'record-pr', actor: 'PR_PROTOCOL', at: at() }) }),
        role === 'TECHNICAL' && h(TechnicalWorkspace, { isAr: false, state, onCheck: (field, value) => dispatch({ type: 'technical-check', actor: 'TECHNICAL', field, value }), onClearTechnical: () => dispatch({ type: 'record-technical', actor: 'TECHNICAL', at: at() }) }),
        role === 'FINANCE' && h(FinanceWorkspace, { isAr: false, state, artist, onAuthorizeAdvance: () => dispatch({ type: 'authorize-advance', actor: 'FINANCE', at: at() }), onRecordTranche: () => {}, onEmergencyAction: dispatch }));
    }
    ReactDOM.createRoot(document.getElementById('root')).render(h(Harness));
    window.dispatchEvent(new Event('sadu:ready'));
  ` }));
  await page.goto('/');
  const desk = (name: string) => page.getByRole('navigation', { name: 'Desks' }).getByRole('button', { name, exact: true }).click();
  const release = page.getByRole('button', { name: 'Record Advance Disbursement in Ledger' });

  await expect(release).toBeDisabled();
  await expect(page.getByText('Waiting on PR and Technical clearance. Advance payment is locked.')).toBeVisible();

  await desk('PR & Protocol');
  await page.getByRole('checkbox', { name: 'Passport Verification — simulated' }).check();
  await page.getByRole('checkbox', { name: 'Visa Status Cleared — simulated' }).check();
  await page.getByRole('button', { name: 'Verify Identity & Travel Documents' }).click();
  await desk('Finance');
  await expect(release).toBeDisabled();
  await expect(page.getByText('Waiting on Technical clearance. Advance payment is locked.')).toBeVisible();

  await desk('Technical');
  await page.getByRole('checkbox', { name: 'Approve 84 kg Floor Load Variance — simulated' }).check();
  await expect(page.getByRole('button', { name: 'Approve Structural Variance' })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'Verify Mounting Bracket Specs — simulated' }).check();
  await page.getByRole('button', { name: 'Approve Structural Variance' }).click();
  await desk('Finance');
  await expect(release).toBeEnabled();
  await release.click();
  await expect(page.getByText('Advance authorization recorded in the local demo only. No money transferred.')).toBeVisible();
  await expect(release).toBeDisabled();

  // Reopening PR evidence re-locks Finance; the recorded advance stays in history.
  await desk('PR & Protocol');
  await page.getByRole('checkbox', { name: 'Passport Verification — simulated' }).uncheck();
  await desk('Finance');
  await expect(release).toBeDisabled();
  await expect(page.getByText('Waiting on PR clearance. Advance payment is locked.')).toBeVisible();
  await expect(page.getByText('Advance authorization recorded in the local demo only. No money transferred.')).toBeVisible();
  expect(errors).toEqual([]);
});
