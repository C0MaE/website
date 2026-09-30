// Umami runs alongside TAP; the site relays its script and events through its own domain so ad blockers
// that block third-party analytics hosts don't skew the numbers. Set UMAMI_URL on the server to talk to the
// container directly (e.g. http://tap-umami:3000 on the shared "proxy" network).
export const UMAMI_URL = (process.env.UMAMI_URL ?? 'https://analytics.tap.comae.dev').replace(/\/$/, '');
export const UMAMI_WEBSITE_ID = 'bc7133c7-0071-45c5-b357-982557718d69';
