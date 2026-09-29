import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import RehearsalJourney from './components/RehearsalJourney';
import './rehearsal.css';

// Dedicated release entry: no pilot, authentication, analytics or integration imports.
const PublicationReview = lazy(() => import('./components/PublicationReview'));
createRoot(document.getElementById('root')!).render(<StrictMode>{window.location.pathname === '/review' ? <Suspense fallback={<p>Loading submission review…</p>}><PublicationReview /></Suspense> : <RehearsalJourney />}</StrictMode>);
