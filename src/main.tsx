import ExecutiveDashboard from './components/ExecutiveDashboard';
import { executiveMode } from './lib/executiveMode';
import PreviewUnavailable from './components/PreviewUnavailable';
import { isLocalPreview, journeyPaths, normalizePreviewPath, pausedPaths } from './lib/previewRoutes';
import GlobalPasswordGate from './components/GlobalPasswordGate';
import {StrictMode, useEffect, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import RehearsalJourney from './components/RehearsalJourney';
import './index.css';

const ExecutiveLanding = lazy(() => import('./components/ExecutiveLanding'));
const GalleryConsignmentForm = lazy(() => import('./components/GalleryConsignmentForm'));
const AuthenticatedPilot = lazy(() => import('./components/AuthenticatedPilot'));
const Workbench = lazy(() => import('./App'));
const CommitteeSpectatorWorkspace = lazy(() => import('./components/CommitteeSpectatorWorkspace'));
const ConnectedPilot = lazy(() => import('./components/ConnectedPilot'));
const PublicationReview = lazy(() => import('./components/PublicationReview'));

function ReadyApp() {
  // Hide the HTML fallback only after React commits the application successfully.
  useEffect(() => { window.dispatchEvent(new Event('sadu:ready')); }, []);
  const path = normalizePreviewPath(window.location.pathname);
  const local = isLocalPreview(window.location.hostname);
  if (path === '/committee-gallery') return local ? <Suspense fallback={<p role="status">Loading Committee gallery…</p>}><CommitteeSpectatorWorkspace /></Suspense> : <PreviewUnavailable review />;
  if (path === '/connected-pilot') return local ? <Suspense fallback={<p role="status">Loading connected pilot…</p>}><ConnectedPilot /></Suspense> : <PreviewUnavailable review />;
  if (executiveMode && (journeyPaths.includes(path) || path === '/review')) return <ExecutiveDashboard />;
  if (path === '/overview') return <Suspense fallback={<p role="status">Loading presentation…</p>}><ExecutiveLanding /></Suspense>;
  if (path === '/review' && !local) return <PreviewUnavailable review />;
  if (!local && pausedPaths.includes(path)) return <PreviewUnavailable />;
  if (path === '/review') return <Suspense fallback={<p>Loading submission review…</p>}><PublicationReview /></Suspense>;
  if(path === '/gallery-consignment') return <Suspense fallback={<p>Loading gallery form...</p>}><GalleryConsignmentForm /></Suspense>;
  if (path === '/workbench') return <Suspense fallback={<p>Loading earlier workbench…</p>}><Workbench /></Suspense>;
  if (path === '/pilot') return <Suspense fallback={<p>Loading authenticated pilot…</p>}><AuthenticatedPilot /></Suspense>;
  if (local && pausedPaths.includes(path)) return <Suspense fallback={<p>Loading earlier workbench…</p>}><Workbench /></Suspense>;
  if (!journeyPaths.includes(path)) return <PreviewUnavailable notFound />;
  return <RehearsalJourney />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><GlobalPasswordGate>
    <ReadyApp />
  </GlobalPasswordGate></StrictMode>,
);
