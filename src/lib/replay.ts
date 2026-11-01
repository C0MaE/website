// Session replays and heatmaps (Umami's recorder) only run for visitors who said yes.
// The answer lives in localStorage; without an answer, or when storage is blocked, nothing is recorded.
const KEY = 'comae.replay';

export type ReplayChoice = 'yes' | 'no' | null;

export function replayChoice(): ReplayChoice {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'yes' || value === 'no' ? value : null;
  } catch {
    return null;
  }
}

export function setReplayChoice(choice: 'yes' | 'no') {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* storage blocked: the banner just comes back next time */
  }
}

/** Load the recorder (once, and only on comae.dev itself, like the tracker). The website ID comes from the
 *  page (lib/umami.ts reads the environment and can't run in the browser). */
export function startReplay(website: string) {
  if (location.hostname !== 'comae.dev' || document.getElementById('umami-recorder')) return;
  const script = document.createElement('script');
  script.id = 'umami-recorder';
  script.defer = true;
  script.src = '/m/rec.js';
  script.dataset.websiteId = website;
  script.dataset.hostUrl = '/m';
  document.head.appendChild(script);
}
