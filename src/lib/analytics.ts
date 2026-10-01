declare global {
  interface Window {
    gtag?: (command: 'event', eventName: string, parameters: Record<string, string>) => void;
  }
}

export function trackPageView(title: string, previousUrl?: string): string {
  const url = window.location.href;
  const referrer = previousUrl ?? document.referrer;
  const parameters: Record<string, string> = {
    page_title: title,
    page_location: url,
  };
  if (referrer) parameters.page_referrer = referrer;
  window.gtag?.('event', 'page_view', parameters);
  return url;
}
