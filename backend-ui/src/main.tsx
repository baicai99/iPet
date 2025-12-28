import { StrictMode, Fragment } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

async function enableMocking() {
  if (import.meta.env.VITE_MOCK !== '1') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start();
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

const RootWrapper = import.meta.env.DEV ? Fragment : StrictMode;

enableMocking()
  .catch((error) => {
    console.error('Failed to enable MSW, continuing without mocks.', error);
  })
  .finally(() => {
    createRoot(rootElement).render(
      <RootWrapper>
        <App />
      </RootWrapper>,
    );
  });
