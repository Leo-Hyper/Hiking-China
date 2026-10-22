let sentry = null;

function initObservability() {
  if (!process.env.SENTRY_DSN) return;
  try {
    sentry = require("@sentry/node");
    sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      release: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || undefined,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
    });
  } catch (error) {
    console.error("[OBSERVABILITY] Sentry init failed:", error.message);
  }
}

function captureException(error, context = {}) {
  if (!sentry) return;
  sentry.withScope((scope) => {
    scope.setExtras(context);
    sentry.captureException(error);
  });
}

module.exports = { initObservability, captureException };
