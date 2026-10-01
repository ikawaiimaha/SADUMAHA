import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CollectionHandoffDemo from './components/CollectionHandoffDemo';
import './collection-demo.css';
createRoot(document.getElementById('root')!).render(<StrictMode><CollectionHandoffDemo /></StrictMode>);
