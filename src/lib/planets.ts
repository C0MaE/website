// Planet positions from JPL's Keplerian elements ("Approximate Positions of the Planets",
// E. M. Standish, Table 1, valid 1800–2050). Accurate to well under a degree, plenty for a picture.
// https://ssd.jpl.nasa.gov/planets/approx_pos.html

export interface Planet {
  name: string;
  /** a [AU], e, I, L, long. perihelion, long. node [deg] at J2000, then the same per Julian century */
  el: [number, number, number, number, number, number];
  rate: [number, number, number, number, number, number];
}

export const PLANETS: Planet[] = [
  { name: 'Mercury', el: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593], rate: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081] },
  { name: 'Venus', el: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255], rate: [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418] },
  { name: 'Earth', el: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], rate: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0] },
  { name: 'Mars', el: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891], rate: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343] },
  { name: 'Jupiter', el: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], rate: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106] },
  { name: 'Saturn', el: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], rate: [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794] },
  { name: 'Uranus', el: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503], rate: [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589] },
  { name: 'Neptune', el: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574], rate: [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664] },
];

const RAD = Math.PI / 180;
/** Light travel time for one astronomical unit, in seconds */
export const LIGHT_SECONDS_PER_AU = 499.004784;

export const julianDate = (ms: number) => ms / 86400000 + 2440587.5;

/** Orbital elements of a planet at a Julian date */
export function elementsAt(p: Planet, jd: number) {
  const T = (jd - 2451545) / 36525;
  const [a, e, I, L, peri, node] = p.el.map((v, i) => v + p.rate[i] * T);
  return { a, e, I: I * RAD, M: (L - peri) * RAD, w: (peri - node) * RAD, node: node * RAD };
}

/** Heliocentric ecliptic position [AU] for given elements and eccentric anomaly */
function toEcliptic(el: ReturnType<typeof elementsAt>, E: number) {
  const { a, e, I, w, node } = el;
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(node), sO = Math.sin(node), cI = Math.cos(I);
  return {
    x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    z: Math.sin(w) * Math.sin(I) * xp + Math.cos(w) * Math.sin(I) * yp,
  };
}

/** Where the planet is at a Julian date: solves Kepler's equation M = E − e·sin E by Newton's method */
export function positionAt(p: Planet, jd: number) {
  const el = elementsAt(p, jd);
  const M = ((el.M % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  let E = M + el.e * Math.sin(M);
  for (let i = 0; i < 8; i++) E -= (E - el.e * Math.sin(E) - M) / (1 - el.e * Math.cos(E));
  return toEcliptic(el, E);
}

/** The full orbit as a closed loop of points, for drawing */
export function orbitAt(p: Planet, jd: number, steps = 180) {
  const el = elementsAt(p, jd);
  return Array.from({ length: steps + 1 }, (_, i) => toEcliptic(el, (i / steps) * 2 * Math.PI));
}
