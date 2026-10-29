import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Activate new deployments immediately so users do not continue using stale
// cached attendance controls after an update.
let reloadPwaApp: (reloadPage?: boolean) => void;
reloadPwaApp = registerSW({
  immediate: true,
  onNeedRefresh() {
    reloadPwaApp(true);
  },
});

// Global error traps to avoid unhandled async promise rejections crashing the runtime in iframe
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Trapped unhandled promise rejection in BIMS runtime:', event.reason);
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.warn('Trapped window error in BIMS runtime:', event.error || event.message);
    if (!event.error && !event.message) {
      event.preventDefault();
    }
  });
}

function AppRoot() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const updateConnectionStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    return () => {
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
    };
  }, []);

  if (!isOnline) {
    return (
      <main className="offline-page" role="status" aria-live="assertive">
        <h1>No internet connection</h1>
      </main>
    );
  }

  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
