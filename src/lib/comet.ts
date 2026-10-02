// Comets thrown into the hero's solar system: two-body motion around the Sun in the ecliptic plane,
// in astronomical units and days. Steps shrink close to the Sun, so sungrazers stay accurate.

export const K2 = 0.01720209895 ** 2;   // Gaussian gravitational constant squared, AU³/day²
export const SUN_HIT = 0.02;            // AU, about four solar radii: closer than this, the comet is gone
export const ESCAPED = 60;              // AU, well past Neptune

export interface Comet { x: number; y: number; vx: number; vy: number }
export type Outcome = 'sun' | 'escaped' | null;

/** Speed of a circular orbit at distance r */
export const circularSpeed = (r: number) => Math.sqrt(K2 / r);

/** Advance by `days`; each step is a small fraction of the local orbital period (leapfrog) */
export function advance(c: Comet, days: number): Outcome {
  let left = days;
  while (left > 1e-9) {
    const r = Math.hypot(c.x, c.y);
    if (r < SUN_HIT) return 'sun';
    if (r > ESCAPED) return 'escaped';
    const dt = Math.min(left, 0.0015 * 2 * Math.PI * Math.pow(r, 1.5) / Math.sqrt(K2));
    const kick = (h: number) => {
      const r2 = c.x * c.x + c.y * c.y, a = -K2 / (r2 * Math.sqrt(r2));
      c.vx += a * c.x * h; c.vy += a * c.y * h;
    };
    kick(dt / 2);
    c.x += c.vx * dt; c.y += c.vy * dt;
    kick(dt / 2);
    left -= dt;
  }
  return null;
}

/** The path ahead, for the aiming line: stops at the Sun, far out, or after one full lap */
export function preview(start: Comet, maxDays = 20000, samples = 360) {
  const c = { ...start };
  const points = [{ x: c.x, y: c.y }];
  let outcome: Outcome = null, swept = 0, last = Math.atan2(c.y, c.x);
  // Sample by angle as well as time, so close perihelion passages still look smooth
  for (let i = 0; i < samples * 4 && outcome === null; i++) {
    const r = Math.hypot(c.x, c.y);
    const days = Math.min(maxDays / samples, 0.004 * 2 * Math.PI * Math.pow(r, 1.5) / Math.sqrt(K2));
    outcome = advance(c, days);
    points.push({ x: c.x, y: c.y });
    const a = Math.atan2(c.y, c.x);
    swept += Math.abs(((a - last + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
    last = a;
    if (swept > 2 * Math.PI || Math.hypot(c.x, c.y) > 40) break;
  }
  return { points, outcome: outcome ?? (Math.hypot(c.x, c.y) > 40 ? 'escaped' : null) };
}
