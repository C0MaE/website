// A faint starfield behind the hero, gravitationally lensed by a point mass that follows the pointer.
// The shader traces each pixel back through the lens equation β = θ − θE²·θ/|θ|², so arcs,
// double images and Einstein rings come out on their own, with surface brightness conserved.

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2(a_pos.x + 1.0, 1.0 - a_pos.y) * 0.5;   // top-left origin, like the 2D canvas
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
uniform sampler2D u_sky;
uniform vec2 u_size;
uniform vec2 u_lens;
uniform float u_re2;
varying vec2 v_uv;
void main() {
  vec2 p = v_uv * u_size;
  vec2 d = p - u_lens;
  vec2 src = p - u_re2 * d / max(dot(d, d), 1e-3);
  vec2 uv = src / u_size;
  vec4 col = (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) ? vec4(0.0) : texture2D(u_sky, uv);
  gl_FragColor = col * (1.0 - smoothstep(0.65, 1.0, v_uv.y));   // fade out towards the bottom of the hero
}`;

/** Deterministic, so the sky looks the same on every visit and after a resize */
function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_TINTS = ['255,255,255', '219,234,254', '224,231,255', '254,243,199', '253,230,138'];
const GALAXY_TINTS = ['253,230,138', '196,181,253', '191,219,254', '254,215,170'];

/** Paint the unlensed sky (premultiplied alpha on transparent) at device resolution */
function paintSky(w: number, h: number, dpr: number) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const g = c.getContext('2d')!;
  g.scale(dpr, dpr);
  const rand = mulberry(54_32);
  const stars = Math.round((w * h) / 1500);
  for (let i = 0; i < stars; i++) {
    const b = Math.pow(rand(), 2.6);                 // mostly faint, a few bright ones
    const tint = STAR_TINTS[Math.floor(rand() * (rand() < 0.85 ? 3 : STAR_TINTS.length))];
    g.fillStyle = `rgba(${tint},${0.12 + 0.6 * b})`;
    g.beginPath(); g.arc(rand() * w, rand() * h, 0.45 + 1.0 * b, 0, Math.PI * 2); g.fill();
  }
  // Small, distant galaxies: these are what a lens smears into the classic arcs
  const galaxies = Math.max(8, Math.round((w * h) / 45000));
  for (let i = 0; i < galaxies; i++) {
    const x = rand() * w, y = rand() * h, size = 4 + rand() * 8, ratio = 0.3 + rand() * 0.5;
    const tint = GALAXY_TINTS[Math.floor(rand() * GALAXY_TINTS.length)];
    g.save();
    g.translate(x, y); g.rotate(rand() * Math.PI); g.scale(1, ratio);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, size);
    grad.addColorStop(0, `rgba(${tint},0.5)`); grad.addColorStop(0.35, `rgba(${tint},0.16)`); grad.addColorStop(1, `rgba(${tint},0)`);
    g.fillStyle = grad; g.beginPath(); g.arc(0, 0, size, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  return c;
}

/** Software renderers are slow, and some break page compositing; they get the plain sky */
function softwareRenderer(gl: WebGLRenderingContext) {
  // Firefox reports the real renderer directly; Chrome and Safari only through the debug extension
  let renderer = String(gl.getParameter(gl.RENDERER));
  if (/^webkit webgl$/i.test(renderer)) {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  }
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
}

export function mountLensedSky(sky: HTMLCanvasElement, area: HTMLElement) {
  let canvas = sky;
  let gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, failIfMajorPerformanceCaveat: true });
  if (gl && softwareRenderer(gl)) {
    // A canvas that has a WebGL context can't switch to 2D, so swap in a fresh one
    const fresh = canvas.cloneNode() as HTMLCanvasElement;
    canvas.replaceWith(fresh);
    canvas = fresh; gl = null;
  }
  let w = 0, h = 0, dpr = 1;
  // Lens state: pointer target and the eased values actually drawn
  let x = 0, y = 0, reTarget = 0, re = 0, raf = 0, last = 0, ready = false;

  if (!gl) {
    // No (fast) WebGL: the sky without the lens
    const g = canvas.getContext('2d');
    const paint = () => {
      const r = canvas.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      g?.drawImage(paintSky(r.width, r.height, dpr), 0, 0);
    };
    paint(); addEventListener('resize', paint);
    return;
  }

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const uSize = gl.getUniformLocation(prog, 'u_size');
  const uLens = gl.getUniformLocation(prog, 'u_lens');
  const uRe2 = gl.getUniformLocation(prog, 'u_re2');
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, paintSky(w, h, dpr));
    ready = true;
    render();
  }

  function render() {
    if (!ready) return;
    gl!.uniform2f(uSize, canvas.width, canvas.height);
    gl!.uniform2f(uLens, x * dpr, y * dpr);
    gl!.uniform1f(uRe2, (re * dpr) ** 2);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  // Fade the lens in and out; stop the loop once it has settled
  function tick(t: number) {
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    const kr = 1 - Math.exp(-dt / 0.25);
    re += (reTarget - re) * kr;
    render();
    const moving = Math.abs(reTarget - re) > 0.05;
    raf = moving ? requestAnimationFrame(tick) : 0;
    if (!moving && reTarget === 0) { re = 0; render(); }
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  // Einstein radius in CSS pixels: big enough to see arcs, small enough to stay subtle
  const einstein = () => Math.min(Math.max(Math.min(w, h) * 0.11, 50), 110);
  area.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = canvas.getBoundingClientRect();
    // Sits exactly under the pointer, which is drawn as the black hole (lib/blackHole.ts)
    x = e.clientX - r.left; y = e.clientY - r.top;
    reTarget = einstein();
    if (raf) return;
    render(); if (Math.abs(reTarget - re) > 0.05) wake();
  });
  area.addEventListener('pointerleave', () => { reTarget = 0; wake(); });

  resize();
  addEventListener('resize', resize);
}
