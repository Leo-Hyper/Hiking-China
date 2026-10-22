type AnalyticsData = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: AnalyticsData) => void;
    };
  }
}

const UMAMI_SCRIPT_URL = import.meta.env.VITE_UMAMI_SCRIPT_URL as string | undefined;
const UMAMI_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;

export function initAnalytics(): void {
  if (!UMAMI_SCRIPT_URL || !UMAMI_WEBSITE_ID || document.querySelector('script[data-umami]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = UMAMI_SCRIPT_URL;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  script.setAttribute('data-umami', 'true');
  document.head.appendChild(script);
}

export function trackEvent(event: string, data?: AnalyticsData): void {
  window.umami?.track(event, data);
}
