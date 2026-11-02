// Umami already drops visits whose user agent admits to being a bot. Bots dressed up as browsers still get
// counted, but they rarely move a mouse, touch the screen or press a key. The first such interaction marks
// the session as `visitor: human` (plus a "human" event); browsers that report being automated
// (navigator.webdriver) are marked `visitor: automated`. In Umami both can be filtered as session properties.
import { replayChoice } from './replay';

type Tracker = {
  identify: (data: Record<string, string>) => Promise<void>;
  track: (name: string) => Promise<void>;
};

const KEY = 'comae.visitor';
const INTERACTIONS = ['pointermove', 'pointerdown', 'touchstart', 'keydown', 'wheel'];

// The tracker script loads deferred, so give it a few seconds to appear
function whenTracker(run: (tracker: Tracker) => void, tries = 0) {
  const tracker = (window as unknown as { umami?: Tracker }).umami;
  if (tracker) run(tracker);
  else if (tries < 50) setTimeout(() => whenTracker(run, tries + 1), 200);
}

// Once per browser tab is enough: the session keeps the property across page loads
function alreadyMarked() {
  try {
    if (sessionStorage.getItem(KEY)) return true;
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* storage blocked: mark again on every page, which does no harm */
  }
  return false;
}

export function markVisitor() {
  if (navigator.webdriver) {
    if (!alreadyMarked() && replayChoice() !== 'yes') whenTracker(tracker => tracker.identify({ visitor: 'automated' }));
    return;
  }
  const first = (event: Event) => {
    if (!event.isTrusted) return;
    INTERACTIONS.forEach(kind => removeEventListener(kind, first, true));
    if (alreadyMarked()) return;
    whenTracker(tracker => {
      // identify() briefly drops the session token, and a replay chunk sent in that moment is lost; so while
      // the recorder may be running (the visitor agreed), the event alone has to do, and the replay shows the rest
      if (replayChoice() !== 'yes') tracker.identify({ visitor: 'human' });
      tracker.track('human');
    });
  };
  INTERACTIONS.forEach(kind => addEventListener(kind, first, { capture: true, passive: true }));
}
