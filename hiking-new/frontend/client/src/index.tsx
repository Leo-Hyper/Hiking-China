import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { createPortal } from 'react-dom';

import RoutesComponent from './app';
import { Toaster } from '@client/src/components/ui/sonner';
import { captureFrontendException, initFrontendObservability } from '@client/src/utils/observability';
import { initAnalytics } from '@client/src/utils/analytics';
import './index.css';

const CLIENT_BASE_PATH = process.env.CLIENT_BASE_PATH || '/';
initFrontendObservability();
initAnalytics();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const ErrorFallback = ({ resetErrorBoundary }: FallbackProps) => (
  <div style={{ padding: 48, fontFamily: 'system-ui', textAlign: 'center' }}>
    <h1 style={{ fontSize: 20, marginBottom: 8 }}>页面出错了</h1>
    <p style={{ color: '#666', marginBottom: 16 }}>页面暂时无法加载，请稍后重试。</p>
    <button
      onClick={resetErrorBoundary}
      style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
    >
      重新加载
    </button>
  </div>
);

const MainApp = () => {
  return (
    <BrowserRouter basename={CLIENT_BASE_PATH}>
      <ErrorBoundary
        fallbackRender={ErrorFallback}
        onError={(error, info) => captureFrontendException(error, { componentStack: info.componentStack })}
      >
        <RoutesComponent />
        {createPortal(<Toaster />, document.body)}
      </ErrorBoundary>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
