import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { retiredPortraitMiddleware, retiredPortraitPaths } from '../config/retiredPortraits';
import { isFinanceScenario } from '../src/data/legacyScenario';
import { ARTWORKS, ROLE_PROFILES } from '../src/data/mockData';
import type { RoleKey } from '../src/types';
import { recordSampleTechnicalReview, operationsBaselineRecords } from '../src/data/legacyOperations';
import { requiresBrowserPrint } from '../src/utils/pdfExport';

test('retired portrait requests return non-cacheable 404s without swallowing other routes', async () => {
  const server = createServer((req, res) => retiredPortraitMiddleware(req, res, () => res.end('app route')));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string');
  try {
    for (const path of retiredPortraitPaths) {
      for (const suffix of ['', '?v=old']) {
        const response = await fetch(`http://127.0.0.1:${address.port}${path}${suffix}`);
        assert.equal(response.status, 404);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.equal(await response.text(), 'Not found');
      }
    }
    for (const path of ['/', '/join', '/artist/register', '/roster', '/other.jpg']) {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), 'app route');
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('deployment blocks retired paths before the filesystem and preserves intake deep links', () => {
  const { routes } = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const filesystemIndex = routes.findIndex(route => route.handle === 'filesystem');
  for (const path of retiredPortraitPaths) {
    assert.equal(existsSync(new URL(`../public${path}`, import.meta.url)), false, `${path} must not ship`);
    const index = routes.findIndex(route => route.src && new RegExp(`^${route.src}`).test(path));
    assert(index >= 0 && index < filesystemIndex);
    assert.equal(routes[index].status, 404);
    assert.equal(routes[index].headers['Cache-Control'], 'no-store');
    assert(existsSync(new URL(`../public${routes[index].dest}`, import.meta.url)));
  }
  for (const path of ['/join', '/artist/register', '/roster']) {
    const route = routes.find(route => route.src && new RegExp(`^${route.src}`).test(path));
    assert.equal(route.dest, '/index.html');
  }
});

test('fixed finance scope covers every finance entry tab but not other workspaces', () => {
  for (const tab of ['overview', 'contracts', 'operations'] as const) {
    assert.equal(isFinanceScenario('FINANCE', tab), true);
    assert.equal(isFinanceScenario('COORDINATOR', tab), false);
  }
  assert.equal(isFinanceScenario('FINANCE', 'archive'), false);
  assert.equal(isFinanceScenario('DIRECTORATE', 'overview'), false);
});

test('only sample technical roles can record a review and repeated actions retain the original actor and time', () => {
  for (const role of Object.keys(ROLE_PROFILES) as RoleKey[]) {
    const result = recordSampleTechnicalReview(role, '2026-09-19T12:00:00Z', null);
    if (role === 'TECHNICAL_MUSEUM' || role === 'TECHNICAL' || role === 'SAF_TECHNICIAN') {
      assert.equal(result?.actorRole, role);
      assert.equal(result?.assetId, 'art-02');
      assert.equal(result?.evidenceReference, 'DEMO-TECH-BASE-01');
      assert.strictEqual(recordSampleTechnicalReview('COORDINATOR', '2026-09-20T12:00:00Z', result), result);
      assert.strictEqual(recordSampleTechnicalReview(role, '2026-09-20T12:00:00Z', result), result);
    } else assert.equal(result, null, `${role} must not record a technical review`);
  }
});

test('baseline report retains all sample records, separates dimensions and updates only the reviewed artwork', () => {
  const before = operationsBaselineRecords(ARTWORKS, null, false);
  const review = recordSampleTechnicalReview('TECHNICAL_MUSEUM', '2026-09-19T12:00:00Z', null);
  const after = operationsBaselineRecords(ARTWORKS, review, false);
  assert.equal(after.length, ARTWORKS.length);
  ARTWORKS.forEach((art, index) => {
    assert.equal(after[index].dimensions, art.dimensionsCm);
    assert.equal('dueDateOrProgress' in after[index], false);
    if (art.id === 'art-02') assert.equal(after[index].status, 'Sample technical review recorded');
    else assert.deepEqual(after[index], before[index]);
  });
  assert(operationsBaselineRecords(ARTWORKS, review, true).every(row => /[\u0600-\u06ff]/.test(row.status)));
});

test('unfiltered baseline always uses its labelled HTML print view, without changing normal ASCII exports', () => {
  assert.equal(requiresBrowserPrint({ scopeMode: 'unfiltered-sample', programmeName: 'DEMO-OPS' }), true);
  assert.equal(requiresBrowserPrint({ programmeName: 'Sample programme' }), false);
  assert.equal(requiresBrowserPrint({ programmeName: 'برنامج تجريبي' }), true);
});

// These claims once appeared in legacy workspaces (since deleted as unreachable). Guard the whole
// source tree so they cannot return anywhere. SHA-256 is omitted: live evidence hashing uses it.
const WITHDRAWN_CLAIMS = [
  'Certified Safe', '100% Certified', 'legally authorized', 'Central Finance Department directives', 'Institutional governance forbids', 'Institutional License Granted', 'مستوفٍ قانونياً', 'مرخصة قانونياً',
  'Sign as Mohammed', 'DIR-MIAQ-AUTH', 'توقيع رسمي معتمد', 'Under Sharjah Calligraphy Biennial governance',
  'legally issued', 'SAM-PERMIT-', 'اعتماد وإصدار تصريح', 'Checksum Verified',
  'Security Check Passed', 'Identity Verified', 'Under Biennale governance policy',
  'authenticated against original', 'دار المخطوطات بالشارقة', 'رَمَى الدَّهْرُ', 'شروحات الدليل (2).docx',
  'Authenticated Government Procurement Record', 'وثيقة شراء موثقة رقمياً', 'Standard Museum Spec', 'الخطوط المعتمد لدائرة الثقافة',
  'Authorized for Invoicing', 'أمر الشراء نافذ ومسجل رسمياً', '100% Registered Suppliers',
];

test('withdrawn policy, certification and attestation claims cannot return anywhere in the source', () => {
  const files = execSync('git ls-files src', { encoding: 'utf8' }).split('\n').filter(f => /\.(tsx?|mjs|json)$/.test(f));
  assert(files.length > 100);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const claim of WITHDRAWN_CLAIMS) assert(!text.includes(claim), `${file}: ${claim}`);
  }
});
