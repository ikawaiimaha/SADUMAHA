import {StrictMode, useEffect, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import RehearsalJourney from './components/RehearsalJourney';
import './index.css';

const GalleryConsignmentForm = lazy(() => import('./components/GalleryConsignmentForm'));
const AuthenticatedPilot = lazy(() => import('./components/AuthenticatedPilot'));
const Workbench = lazy(() => import('./App'));

function ReadyApp() {
  // Hide the HTML fallback only after React commits the application successfully.
  useEffect(() => { window.dispatchEvent(new Event('sadu:ready')); }, []);
  if(window.location.pathname === '/gallery-consignment') return <Suspense fallback={<p>Loading gallery form...</p>}><GalleryConsignmentForm /></Suspense>;
  if (window.location.pathname === '/workbench') return <Suspense fallback={<p>Loading earlier workbench…</p>}><Workbench /></Suspense>;
  if (window.location.pathname === '/pilot') return <Suspense fallback={<p>Loading authenticated pilot…</p>}><AuthenticatedPilot /></Suspense>;
  if (!['/', '/rehearsal'].includes(window.location.pathname)) return <Suspense fallback={<p>Loading earlier workbench…</p>}><Workbench /></Suspense>;
  return <RehearsalJourney />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReadyApp />
  </StrictMode>,
);
