import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initFrontendObservability(): void {
  if (!SENTRY_DSN) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: (import.meta.env.MODE as string) || 'production',
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.05),
  });
}

export function captureFrontendException(error: unknown, context?: Record<string, unknown>): void {
  if (!SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(error);
  });
}
