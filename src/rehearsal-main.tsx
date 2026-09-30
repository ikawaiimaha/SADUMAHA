import ExecutiveDashboard from './components/ExecutiveDashboard';
import { executiveMode } from './lib/executiveMode';
import PreviewUnavailable from './components/PreviewUnavailable';
import { isLocalPreview, journeyPaths, normalizePreviewPath } from './lib/previewRoutes';
import GlobalPasswordGate from './components/GlobalPasswordGate';
import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import ExecutiveLanding from './components/ExecutiveLanding';
import RehearsalJourney from './components/RehearsalJourney';
import './rehearsal.css';

// Dedicated release entry: no pilot, authentication, analytics or integration imports.
const PublicationReview = lazy(() => import('./components/PublicationReview'));
const path = normalizePreviewPath(window.location.pathname);
const screen = executiveMode && (journeyPaths.includes(path) || path === '/review') ? <ExecutiveDashboard /> : path === '/review' ? (isLocalPreview(window.location.hostname) ? <Suspense fallback={<p role="status">Loading submission review…</p>}><PublicationReview /></Suspense> : <PreviewUnavailable review />) : path === '/overview' || path === '/' ? <ExecutiveLanding /> : journeyPaths.includes(path) ? <RehearsalJourney /> : <PreviewUnavailable notFound />;
createRoot(document.getElementById('root')!).render(<StrictMode><GlobalPasswordGate>{screen}</GlobalPasswordGate></StrictMode>);
