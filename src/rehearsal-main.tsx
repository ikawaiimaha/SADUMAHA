import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RehearsalJourney from './components/RehearsalJourney';
import './rehearsal.css';

// Dedicated release entry: no pilot, authentication, analytics or integration imports.
createRoot(document.getElementById('root')!).render(<StrictMode><RehearsalJourney /></StrictMode>);
