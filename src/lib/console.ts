// A little something for whoever opens the developer console: a banner and a few commands.
// The solar-system commands talk to the hero through `comae:*` events (see Hero.astro).
import { PLANETS, positionAt, julianDate, LIGHT_SECONDS_PER_AU } from './planets';
import { K2 } from './comet';

const ART = `
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢁⢄⠴⢕⣾⣎⣷⢄⢀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⠀⣀⡠⠦⠊⡁⠣⠂⠀⠄⠙⣇⡑⠫⢄⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢉⡀⠛⠈⠧⠀⢀⠀⠈⠀⠐⢀⠘⣦⠁⡆⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠄⡀⠀⠑⠂⣄⣶⡓⢀⠀⠀⠀⠀⠀⠀⠢⠀⠀⡀⠀⢾⢌⠢⡔
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⡄⡖⠀⢥⠀⣉⠈⠑⠉⣒⠐⠁⢠⠀⠀⠂⠄⠀⡀⡀⠀⠀⠀⢀⡻⣈⡐⠈
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢄⡺⠇⠍⠀⠀⠂⠁⠁⡠⠀⠀⠊⡀⠀⠀⠐⠐⠁⠁⣨⠈⠀⠠⣠⡄⠀⠀⡍⣤⡜⡂⠄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡢⣓⠛⠃⠠⠀⠂⢀⠀⠂⠀⠁⠐⠀⠀⠐⠐⢀⢀⠀⠀⠀⠠⠄⣈⠘⠘⠀⢈⡪⡹⢆⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡅⠄⣧⠀⠀⠠⢁⠀⠐⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⢡⠀⠀⠀⠀⠆⡠⠀⠀⢰⢞⡓⡵⠀⠈⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⠀⢗⣏⢇⠃⠀⠄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠀⠂⠀⠀⣂⠀⢸⢄⣵⠗⠧⣽⠄⠈⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡰⠀⡄⡖⣍⡈⣎⠕⢀⠀⠀⠀⠀⡀⠄⠀⠀⠀⠀⠁⠀⠀⠄⠀⠊⡀⣀⠀⠢⡤⣨⣂⢜⣋⣕⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠠⣥⣏⡎⠁⡁⠟⢀⠀⠀⠀⠀⠀⠀⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠀⡃⢰⡰⠋⡱⠃⠀⣁⠀⠀⡀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠡⠓⡿⣗⡪⠂⢀⠑⣓⠂⠀⠀⠀⠀⠀⠀⠂⠀⠀⠀⠀⠀⠀⡀⠀⠁⠠⣆⢋⣯⠑⢋⠀⠀⠂⡠⠀⠂⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠒⠐⡏⢟⣇⣁⡑⢁⡠⠂⡍⠁⠀⠐⠀⠐⠀⠀⠀⠀⠀⣀⠀⠁⡀⣾⡷⢗⠔⣠⠄⠃⠀⡀⡈⠁⡀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢁⠐⣳⣲⡪⠌⠔⡓⡄⠐⢀⡄⠀⠂⠀⠀⠀⠀⠀⠀⠂⡂⡜⣴⢳⢍⠁⢤⡀⠄⠀⠀⠀⠰⢐⠀⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢄⢃⣝⡗⠯⣡⢦⢕⠇⠄⡁⣁⡄⠀⠀⠀⠀⡄⢊⡰⢠⠴⡹⠂⠀⡥⠀⠁⠀⢀⠀⠀⠀⢂⢀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢂⠈⠂⢆⠉⡍⡮⣓⡶⡛⠥⠂⢒⢐⢁⠀⡀⠨⡁⢄⣑⡺⠎⣁⠳⠱⡂⠀⠃⠠⠀⠀⠁⠈⠂⠁⠄⠂⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢀⢤⣦⠇⠀⠐⡀⠁⠎⠱⣁⢯⠿⣃⣋⠆⠏⠁⣀⣪⣎⣽⠎⡒⠀⠉⡀⠢⢀⠀⠀⢀⠀⢀⡀⠃⢀⠀⠄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠐⣹⣿⣟⠇⠀⠀⠁⡈⣅⠀⠙⡳⡂⡗⣇⣇⡘⣗⣋⢣⠳⡎⢡⡀⠀⠄⠀⠀⠀⠀⠂⠀⠀⠍⣁⠄⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢈⣯⣟⣻⡅⠀⠀⠀⠈⠀⡡⢁⠌⠊⢫⣮⣚⢏⡯⡶⡟⡏⠑⢁⠃⡂⠀⡠⠜⠆⡀⣄⡔⠗⠂⠁⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠉⣦⣿⣣⠓⠂⠄⡑⣀⣁⡄⢢⢢⡧⠑⡟⢫⢷⡋⠯⠵⢏⣩⡇⡥⣤⣠⡈⣠⣾⠖⣇⢊⢀⠡⡁⠢⠚⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢠⠁⠨⣽⣿⣏⣍⡈⠭⠂⡃⡒⢘⡲⠋⡎⠖⢆⠐⠠⡈⢣⡨⡏⠍⠃⠈⠔⡊⢂⡰⡉⠊⠁⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠠⠐⣘⡛⡢⡬⡡⠡⡆⢚⣕⡟⢅⠒⠐⠀⠂⠂⠠⠠⠂⠁⡠⢂⠠⡨⠀⠊⠊⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠐⠀⡁⢸⢅⠃⢐⡈⡀⡨⠙⠁⠕⠂⠂⠑⠀⠈⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
`.trim().split('\n');

const MONO = 'font-family:"JetBrains Mono",ui-monospace,monospace';
const say = (text: string, color = '#a1a1aa') => console.log(`%c${text}`, `${MONO};color:${color}`);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// The banner fades from the comet's amber head to the site's violet
function banner() {
  const mix = (t: number) => {
    const a = [252, 211, 77], b = [167, 139, 250];
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
  };
  console.log(ART.map(line => `%c${line}`).join('\n'), ...ART.map((_, i) => `${MONO};line-height:1.1;color:${mix(i / (ART.length - 1))}`));
  console.log(
    '%cCoMaE%c  hey there, fellow dev! You found the console.\n%cEverything on this page is open source → https://github.com/C0MaE/website',
    'font-family:"Instrument Serif",Georgia,serif;font-size:22px;color:#fafafa', `${MONO};color:#d4d4d8`, `${MONO};color:#a1a1aa`,
  );
  const commands: [string, string][] = [
    ['comet()', 'throw a comet into the solar system   · comet(distance AU, speed)'],
    ['flare()', 'make the Sun erupt'],
    ['warp(30)', 'let the planets run 30 days per second · negative runs backwards'],
    ['planets()', 'where everything is right now, as a table'],
    ['hire()', '…you know what this does'],
    ['comae()', 'show this again'],
  ];
  console.log(
    `%cSome things to try:\n${commands.map(() => '%c  %s%c %s').join('\n')}\n\n%cpsst… there is one more command. Think rockets.`,
    `${MONO};color:#a1a1aa`,
    ...commands.flatMap(([cmd, what]) => [`${MONO};color:#fcd34d`, cmd.padEnd(10), `${MONO};color:#8f8f98`, what]),
    `${MONO};color:#5f5f68;font-style:italic`,
  );
}

// Commands that need the solar system only work on the home page, near the top
function solarSystem() {
  if (document.documentElement.dataset.solarSystem !== 'on') {
    say('The solar system lives on the home page: https://comae.dev/', '#fbbf24');
    return false;
  }
  const hero = document.getElementById('hero')!;
  if (hero.getBoundingClientRect().bottom < 120) hero.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
  return true;
}

function comet(distance?: number, speed?: number) {
  if (!solarSystem()) return;
  const detail: { distance?: number; speed?: number; comet?: { x: number; y: number; vx: number; vy: number } } = {
    distance: distance === undefined ? undefined : Math.min(Math.max(distance, 0.2), 40),
    speed: speed === undefined ? undefined : Math.min(Math.max(speed, 0), 2.5),
  };
  dispatchEvent(new CustomEvent('comae:comet', { detail }));
  const c = detail.comet;
  if (!c) return;
  // Describe the orbit it ended up on
  const r = Math.hypot(c.x, c.y), v2 = c.vx ** 2 + c.vy ** 2, energy = v2 / 2 - K2 / r;
  const h = c.x * c.vy - c.y * c.vx, e = Math.sqrt(Math.max(0, 1 + (2 * energy * h * h) / (K2 * K2)));
  const q = (h * h) / K2 / (1 + e);
  const orbit = energy < 0
    ? `a ${(2 * Math.PI * Math.pow(-K2 / (2 * energy), 1.5) / Math.sqrt(K2) / 365.25).toFixed(1)}-year orbit`
    : 'a one-way trip out of the solar system';
  const fate = q < 0.02 ? ' It is heading straight into the Sun.' : ` Closest approach: ${q.toFixed(2)} AU from the Sun.`;
  say(`☄ Comet away from ${r.toFixed(1)} AU at ${(Math.sqrt(v2) / Math.sqrt(K2 / r)).toFixed(2)}× circular speed, on ${orbit} (e = ${e.toFixed(2)}).${fate}`, '#bae6fd');
}

function flare() {
  if (!solarSystem()) return;
  dispatchEvent(new CustomEvent('comae:flare'));
  say('☀ The Sun just erupted. Keep an eye on Earth.', '#fdba74');
}

function warp(daysPerSecond = 30) {
  if (!solarSystem()) return;
  const rate = Math.round(Math.min(Math.max(daysPerSecond, -3650), 3650));
  dispatchEvent(new CustomEvent('comae:warp', { detail: { rate } }));
  if (!rate) say('Back to today.');
  else say(`⏩ ${Math.abs(rate)} days per second${rate < 0 ? ', backwards' : ''}, for 15 seconds. Then back to today.`, '#c4b5fd');
}

function planets() {
  const jd = julianDate(Date.now()), earth = positionAt(PLANETS[2], jd);
  const light = (au: number) => {
    const m = Math.round((au * LIGHT_SECONDS_PER_AU) / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
  };
  console.table(Object.fromEntries(PLANETS.map(p => {
    const q = positionAt(p, jd), toEarth = Math.hypot(q.x - earth.x, q.y - earth.y, q.z - earth.z);
    return [p.name, {
      'from Sun (AU)': +Math.hypot(q.x, q.y, q.z).toFixed(3),
      'from Earth (AU)': p.name === 'Earth' ? '—' : +toEarth.toFixed(3),
      'light to Earth': p.name === 'Earth' ? '—' : light(toEarth),
      'longitude (°)': +(((Math.atan2(q.y, q.x) * 180) / Math.PI + 360) % 360).toFixed(1),
    }];
  })));
  say(`Heliocentric, ecliptic coordinates for ${new Date().toUTCString()}, from JPL's Keplerian elements.`);
}

function hire() {
  const contact = document.getElementById('contact');
  if (!contact) { location.href = '/#contact'; return; }
  contact.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
  document.querySelector<HTMLElement>('a.mail-link')?.animate(
    [{ boxShadow: '0 0 0 0 rgba(167,139,250,0.75)' }, { boxShadow: '0 0 0 16px rgba(167,139,250,0)' }],
    { duration: 1100, iterations: 3, delay: 700, easing: 'ease-out' },
  );
  say('Not actively looking, but always up for interesting projects. Say hi!', '#c4b5fd');
}

// The easter egg: the probe takes a tour of the page, swinging past every heading
let touring = false;
function launch() {
  if (reduced()) return say('Reduced motion is on, so the probe stays in its hangar.');
  if (touring) return say('The probe is already out there.');
  const stops = [...document.querySelectorAll<HTMLElement>('main h1, main h2')];
  const dock = document.querySelector<HTMLElement>('a.mail-link');
  if (!stops.length || !dock) return say('Nothing to tour here. Try https://comae.dev/', '#fbbf24');
  touring = true;
  say('🛰 Launch! Sit back, the probe is giving you a tour.', '#fcd34d');

  // Flight path in page coordinates: swing around the right end of each heading, then on to the next
  const page = (r: DOMRect) => ({ left: r.left + scrollX, right: r.right + scrollX, top: r.top + scrollY, bottom: r.bottom + scrollY });
  const text = (el: HTMLElement) => { const range = document.createRange(); range.selectNodeContents(el); return page(range.getBoundingClientRect()); };
  const pts: { x: number; y: number }[] = [];
  const anchors: { x: number; y: number }[] = [];
  const curve = (a: { x: number; y: number }, c1: { x: number; y: number }, c2: { x: number; y: number }, b: { x: number; y: number }) => {
    for (let i = 1; i <= 40; i++) {
      const t = i / 40, u = 1 - t;
      pts.push({ x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y });
    }
  };
  let at = { x: -30, y: text(stops[0]).top - 160 };
  pts.push(at);
  for (const el of stops) {
    const r = text(el), cy = (r.top + r.bottom) / 2, rad = Math.max((r.bottom - r.top) * 0.75, 40);
    anchors.push({ x: r.right, y: cy });
    const entry = { x: r.right, y: cy - rad };
    curve(at, { x: at.x + 220, y: at.y + 60 }, { x: entry.x - 260, y: entry.y }, entry);
    for (let i = 1; i <= 36; i++) { const a = -Math.PI / 2 + (i / 36) * Math.PI; pts.push({ x: r.right + rad * Math.cos(a), y: cy + rad * Math.sin(a) }); }
    at = { x: r.right, y: cy + rad };
  }
  const d = page(dock.getBoundingClientRect()), end = { x: (d.left + d.right) / 2, y: (d.top + d.bottom) / 2 };
  curve(at, { x: at.x - 260, y: at.y + 80 }, { x: end.x + 200, y: end.y - 120 }, end);
  const lengths = [0];
  for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = lengths[lengths.length - 1];

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
  document.body.append(canvas);
  const ctx = canvas.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);

  let s = 0, last = performance.now(), aborted = 0, landed = 0, idx = 0;
  const trail: { x: number; y: number }[] = [];
  const abort = () => { if (!aborted && !landed) aborted = performance.now(); };
  const inputs = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
  inputs.forEach(ev => addEventListener(ev, abort, { once: true, passive: true }));
  const finish = () => {
    inputs.forEach(ev => removeEventListener(ev, abort));
    removeEventListener('resize', size);
    canvas.remove(); touring = false;
  };

  function frame(t: number) {
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    if (!landed && !aborted) {
      while (idx < lengths.length - 2 && lengths[idx + 1] < s) idx++;
    }
    const i = Math.min(idx, pts.length - 2), k = Math.min(Math.max((s - lengths[i]) / (lengths[i + 1] - lengths[i] || 1), 0), 1);
    const p = { x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k };
    if (!landed && !aborted) {
      // Faster while swinging close past a heading, like a gravity assist
      const near = Math.min(...anchors.map(a => Math.hypot(a.x - p.x, a.y - p.y)));
      s = Math.min(s + dt * 760 * (1 + 0.9 * Math.exp(-((near / 110) ** 2))), total);
    }
    if (!landed && !aborted) {
      trail.push(p); if (trail.length > 70) trail.shift();
      // The camera follows the probe down the page
      const target = p.y - innerHeight * 0.45;
      scrollTo({ top: scrollY + (target - scrollY) * (1 - Math.exp(-dt / 0.22)), behavior: 'instant' as ScrollBehavior });
      if (s >= total) { landed = t; say('Tour complete. The probe is parked right next to the email button, in case you want to say hi.', '#fcd34d'); dock!.animate([{ boxShadow: '0 0 0 0 rgba(252,211,77,0.8)' }, { boxShadow: '0 0 0 18px rgba(252,211,77,0)' }], { duration: 900, iterations: 2 }); }
    }
    const fade = aborted ? Math.max(0, 1 - (t - aborted) / 600) : 1;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = 'round';
    for (let j = 1; j < trail.length; j++) {
      ctx.globalAlpha = (j / trail.length) * 0.6 * fade; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(trail[j - 1].x - scrollX, trail[j - 1].y - scrollY); ctx.lineTo(trail[j].x - scrollX, trail[j].y - scrollY); ctx.stroke();
    }
    const vx = p.x - scrollX, vy = p.y - scrollY;
    const settle = landed ? Math.max(0, 1 - (t - landed) / 1400) : 1;
    ctx.globalAlpha = 0.25 * fade * settle; ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(vx, vy, 11, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = fade * settle; ctx.fillStyle = '#fde68a';
    ctx.beginPath(); ctx.arc(vx, vy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    if ((aborted && fade === 0) || (landed && t - landed > 1500)) {
      if (aborted) say('Tour aborted. You took the controls.');
      return finish();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export function installConsole() {
  Object.assign(window, { comae: banner, comet, flare, warp, planets, hire, launch });
  banner();
}
