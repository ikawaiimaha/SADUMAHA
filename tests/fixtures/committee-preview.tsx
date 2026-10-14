// Isolated browser entry: mount the actual dashboard with its own providers.
import React from 'react';
import { createRoot } from 'react-dom/client';
import ExecutiveDashboard from '../../src/components/ExecutiveDashboard';
import '../../src/rehearsal.css';

createRoot(document.getElementById('root')!).render(<ExecutiveDashboard />);
