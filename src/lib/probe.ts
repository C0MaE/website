// Physics for the 404 mini game: a probe on a hyperbolic flyby that the player brakes into orbit.
// Plain two-body gravity in the orbital plane; units are arbitrary "map units" and seconds.

export const GM = 540000;          // circular orbit speed at r = 150 is 60 units/s
export const PLANET_R = 32;
export const ATMOSPHERE = 8;
export const CRASH_R = PLANET_R + ATMOSPHERE;   // entering the atmosphere ends the flight
export const VIEW_R = 340;         // radius of the map
export const LOST_R = 400;         // leaving past this is lost; a captured orbit has to stay inside it
export const THRUST = 12;          // units/s² while the retro-thrusters fire
export const FUEL = 36;            // Δv budget, units/s: 3 s of burn. Braking far too early or holding on too
                                   // long drags the periapsis into the atmosphere; too little and it escapes

export interface Probe { x: number; y: number; vx: number; vy: number; fuel: number }
export type Fate = 'crash' | 'escape' | 'orbit';

/**
 * A fresh probe far out on the incoming branch of a hyperbola: it would swing past the planet
 * at periapsis `rp` and leave again with speed `vInf`, unless someone brakes.
 */
export function launch(rand = Math.random): Probe {
  const vInf = 32 + rand() * 10;
  const rp = 70 + rand() * 25;
  const omega = rand() * Math.PI * 2;          // direction of periapsis
  const sense = rand() < 0.5 ? 1 : -1;         // clockwise or counter-clockwise
  const e = 1 + (rp * vInf * vInf) / GM;
  const p = rp * (1 + e);                      // semi-latus rectum
  const D = 420;                               // start just outside the map
  const nu = -Math.acos((p / D - 1) / e);      // true anomaly on the way in
  const r = p / (1 + e * Math.cos(nu));
  const k = Math.sqrt(GM / p);
  const [px, py] = [r * Math.cos(nu), sense * r * Math.sin(nu)];
  const [qx, qy] = [-k * Math.sin(nu), sense * k * (e + Math.cos(nu))];
  const c = Math.cos(omega), s = Math.sin(omega);
  return { x: c * px - s * py, y: s * px + c * py, vx: c * qx - s * qy, vy: s * qx + c * qy, fuel: FUEL };
}

/** Advance by dt with kick-drift-kick leapfrog; thrust points against the velocity. Returns the Δv spent. */
export function step(b: Probe, dt: number, burning: boolean) {
  const burn = burning && b.fuel > 0 ? Math.min(THRUST, b.fuel / dt) : 0;
  const kick = (h: number) => {
    const r2 = b.x * b.x + b.y * b.y, r = Math.sqrt(r2), g = -GM / (r2 * r);
    const v = Math.hypot(b.vx, b.vy) || 1;
    b.vx += (g * b.x - (burn * b.vx) / v) * h;
    b.vy += (g * b.y - (burn * b.vy) / v) * h;
  };
  kick(dt / 2);
  b.x += b.vx * dt; b.y += b.vy * dt;
  kick(dt / 2);
  b.fuel = Math.max(0, b.fuel - burn * dt);
  return burn * dt;
}

/** Osculating orbit: eccentricity, periapsis and apoapsis (Infinity when unbound) */
export function elements(b: Probe) {
  const r = Math.hypot(b.x, b.y);
  const energy = (b.vx * b.vx + b.vy * b.vy) / 2 - GM / r;
  const h = b.x * b.vy - b.y * b.vx;
  const e = Math.sqrt(Math.max(0, 1 + (2 * energy * h * h) / (GM * GM)));
  const p = (h * h) / GM;
  return { e, energy, r, rp: p / (1 + e), ra: e < 1 ? p / (1 - e) : Infinity };
}

/** How the current orbit ends if nobody touches the controls */
export function fateOf(b: Probe): Fate {
  const { e, rp, ra } = elements(b);
  const outbound = b.x * b.vx + b.y * b.vy > 0;
  if (e >= 1 && outbound) return 'escape';          // already past the planet, never coming back
  if (rp < CRASH_R) return 'crash';
  return e < 1 && ra < LOST_R ? 'orbit' : 'escape';
}

/** Where the probe goes if nobody touches the controls: sampled path and how it ends */
export function predict(b: Probe, dt = 1 / 30, maxSteps = 1600) {
  const q = { ...b };
  const points: { x: number; y: number }[] = [{ x: q.x, y: q.y }];
  const fate = fateOf(q);
  let swept = 0, last = Math.atan2(q.y, q.x);
  for (let i = 0; i < maxSteps; i++) {
    step(q, dt, false);
    points.push({ x: q.x, y: q.y });
    const r = Math.hypot(q.x, q.y);
    if (r < CRASH_R || (r > LOST_R * 1.5 && q.x * q.vx + q.y * q.vy > 0)) break;
    const a = Math.atan2(q.y, q.x);
    swept += Math.abs(((a - last + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
    last = a;
    if (swept > 2 * Math.PI) break;   // one full lap is enough to draw a closed orbit
  }
  return { points, fate };
}
