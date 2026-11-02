import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initGlobalErrorLogging } from './lib/logger.ts';
import './index.css';

// Initialize global window.onerror and unhandledrejection monitoring
initGlobalErrorLogging();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
