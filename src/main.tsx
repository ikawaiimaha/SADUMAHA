import {StrictMode, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function ReadyApp() {
  // Hide the HTML fallback only after React commits the application successfully.
  useEffect(() => { window.dispatchEvent(new Event('sadu:ready')); }, []);
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReadyApp />
  </StrictMode>,
);
