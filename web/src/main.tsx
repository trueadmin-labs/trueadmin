import { env } from '@config/index';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/app/App';
import { AppProviders } from '@/app/providers/AppProviders';
import '@/app/styles/global.css';

async function enableMock() {
  if (!env.isDev || !env.enableMsw) {
    return;
  }

  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

await enableMock();

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root is missing');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
