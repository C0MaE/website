// Outside the hero, the mouse pointer is a small planet with a moon. The moon is a little two-body
// problem in the planet's frame: when the pointer accelerates, inertia swings the moon out and gravity
// pulls it back in. Over links it settles into a tighter orbit (and so, by Kepler, a faster one).
// Entering the hero, where the pointer becomes a black hole (lib/blackHole.ts), the moon spirals in.
// Mouse and pen only, and not with reduced motion.

const SIZE = 120, MID = SIZE / 2;
const ORBIT = 13, ORBIT_HOT = 7.5, PERIOD = 1.7;       // px, px, seconds per lap at ORBIT
const GM = (2 * Math.PI / PERIOD) ** 2 * ORBIT ** 3;
const INERTIA = 0.1;                                   // how strongly pointer acceleration reaches the moon
const MAX_R = 46;
const FALL_PULL = 6;                                   // the black hole pulls harder than the planet did

export function mountCursor() {
  if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = `position:fixed;left:0;top:0;width:${SIZE}px;height:${SIZE}px;pointer-events:none;z-index:80`;
  document.body.append(c);
  const g = c.getContext('2d')!;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = SIZE * dpr; c.height = SIZE * dpr;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const root = document.documentElement;

  // Pointer (viewport px) and its motion, measured per frame
  let px = -200, py = -200, lx = px, ly = py, pvx = 0, pvy = 0, pax = 0, pay = 0;
  // Moon, relative to the planet
  let mx = ORBIT, my = 0, mvx = 0, mvy = -Math.sqrt(GM / ORBIT);
  let mode: 'planet' | 'falling' | 'hole' | 'hidden' = 'hidden';
  let hot = false, planet = 0, moon = 0, squash = 0, raf = 0, last = 0;
  const trail: { x: number; y: number }[] = [];

  function respawnMoon() {
    const a = Math.random() * Math.PI * 2, v = Math.sqrt(GM / ORBIT);
    mx = ORBIT * Math.cos(a); my = ORBIT * Math.sin(a);
    mvx = v * Math.sin(a); mvy = -v * Math.cos(a);
    trail.length = 0; moon = 0;
  }

  function physics(dt: number) {
    const r = Math.hypot(mx, my) || 1e-3, ux = mx / r, uy = my / r;
    let ax = (-GM / (r * r)) * ux, ay = (-GM / (r * r)) * uy;
    if (mode === 'falling') {
      // Inside the black hole's reach: stronger pull and drag, so it spirals in
      ax *= FALL_PULL; ay *= FALL_PULL; ax -= 0.55 * mvx; ay -= 0.55 * mvy;
    } else {
      // Gently settle back onto a circular orbit at the target radius after every disturbance
      const target = hot ? ORBIT_HOT : ORBIT, vc = Math.sqrt(GM / target);
      const vr = mvx * ux + mvy * uy, vt = -mvx * uy + mvy * ux;
      const dvt = (Math.sign(vt || -1) * vc - vt) * 1.4, dvr = -vr * 1.4 - (r - target) * 7;
      ax += dvr * ux - dvt * uy; ay += dvr * uy + dvt * ux;
      ax -= pax * INERTIA; ay -= pay * INERTIA;          // inertia: the planet accelerates, the moon lags
    }
    mvx += ax * dt; mvy += ay * dt;
    mx += mvx * dt; my += mvy * dt;
    const r2 = Math.hypot(mx, my);
    if (r2 > MAX_R) { mx *= MAX_R / r2; my *= MAX_R / r2; }
    if (mode === 'falling' && r2 < 7) { mode = 'hole'; trail.length = 0; }   // gone behind the shadow
  }

  function frame(t: number) {
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    // Pointer velocity and acceleration from its movement since the last frame
    if (dt > 0) {
      const vx = (px - lx) / dt, vy = (py - ly) / dt;
      const k = 1 - Math.exp(-dt / 0.03);
      pax += (Math.max(-60000, Math.min(60000, (vx - pvx) / dt)) - pax) * k;
      pay += (Math.max(-60000, Math.min(60000, (vy - pvy) / dt)) - pay) * k;
      pvx = vx; pvy = vy; lx = px; ly = py;
    }
    const steps = Math.ceil(dt / (1 / 240));
    for (let i = 0; i < steps; i++) physics(dt / steps);
    if (mode === 'planet' || mode === 'falling') { trail.push({ x: mx, y: my }); if (trail.length > 14) trail.shift(); }

    const fade = 1 - Math.exp(-dt / 0.12);
    planet += ((mode === 'planet' ? 1 : 0) - planet) * fade;
    moon += ((mode === 'planet' || mode === 'falling' ? 1 : 0) - moon) * fade;
    squash *= Math.exp(-dt / 0.12);

    c.style.transform = `translate(${px - MID}px, ${py - MID}px)`;
    g.clearRect(0, 0, SIZE, SIZE);
    if (planet > 0.01) {
      const size = (hot ? 3.9 : 3.2) * (1 - 0.3 * squash);
      const glow = g.createRadialGradient(MID, MID, 0, MID, MID, size * 3.2);
      glow.addColorStop(0, `rgba(167,139,250,${0.45 * planet})`); glow.addColorStop(1, 'rgba(167,139,250,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(MID, MID, size * 3.2, 0, Math.PI * 2); g.fill();
      g.globalAlpha = planet; g.fillStyle = '#f4f4f5';
      g.beginPath(); g.arc(MID, MID, size, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
    if (moon > 0.01) {
      g.strokeStyle = '#d4d4d8'; g.lineWidth = 1; g.lineCap = 'round';
      for (let i = 1; i < trail.length; i++) {
        g.globalAlpha = (i / trail.length) * 0.35 * moon;
        g.beginPath(); g.moveTo(MID + trail[i - 1].x, MID + trail[i - 1].y); g.lineTo(MID + trail[i].x, MID + trail[i].y); g.stroke();
      }
      g.globalAlpha = moon; g.fillStyle = '#e4e4e7';
      g.beginPath(); g.arc(MID + mx, MID + my, 1.6, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
    // Keep going while anything is visible
    raf = planet > 0.01 || moon > 0.01 || mode === 'planet' ? requestAnimationFrame(frame) : 0;
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    // Appearing (or coming back into the window) is not a jolt: start from rest
    if (mode === 'hidden') { lx = px; ly = py; pvx = pvy = pax = pay = 0; }
    const el = e.target as Element;
    if (el.closest('[data-native-cursor]')) {
      mode = 'hidden'; root.classList.remove('space-cursor');
    } else if (el.closest('#hero')) {
      if (mode === 'planet') {                           // the black hole takes over
        // Start it on the circular orbit for the stronger pull, so it spirals in instead of dropping straight
        const r = Math.hypot(mx, my) || 1, vt = -mvx * (my / r) + mvy * (mx / r), v = Math.sqrt((FALL_PULL * GM) / r) * Math.sign(vt || -1);
        mvx = -v * (my / r); mvy = v * (mx / r);
        mode = 'falling';
      }
      if (mode === 'hidden') mode = 'hole';
      root.classList.remove('space-cursor');
    } else {
      if (mode !== 'planet') { if (mode !== 'falling') respawnMoon(); mode = 'planet'; }
      hot = !!el.closest('a, button, [role="button"], summary, label');
      root.classList.add('space-cursor');
    }
    wake();
  }, { passive: true });
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || mode !== 'planet') return;
    squash = 1;                                          // a click: the planet flinches, the moon gets a nudge
    const a = Math.random() * Math.PI * 2;
    mvx += 60 * Math.cos(a); mvy += 60 * Math.sin(a);
  });
  // Leaving the window: hide it
  document.addEventListener('mouseout', e => { if (!e.relatedTarget) { mode = 'hidden'; root.classList.remove('space-cursor'); wake(); } });
}
