import {StrictMode, useEffect, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const GalleryConsignmentForm = lazy(() => import('./components/GalleryConsignmentForm'));
const AuthenticatedPilot = lazy(() => import('./components/AuthenticatedPilot'));

function ReadyApp() {
  // Hide the HTML fallback only after React commits the application successfully.
  useEffect(() => { window.dispatchEvent(new Event('sadu:ready')); }, []);
  if(window.location.pathname === '/gallery-consignment') return <Suspense fallback={<p>Loading gallery form...</p>}><GalleryConsignmentForm /></Suspense>;
  return window.location.pathname === '/pilot' ? <Suspense fallback={<p>Loading authenticated pilot…</p>}><AuthenticatedPilot /></Suspense> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReadyApp />
  </StrictMode>,
);
