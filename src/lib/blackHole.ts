// Over the hero the mouse pointer becomes a small black hole, the mass behind the starfield's lensing:
// a shadow, a photon ring that is brighter on the side moving towards us (as in the M87* image) and a
// faint glow. Over anything clickable the ring brightens. Mouse and pen only.

const SIZE = 56, SHADOW = 7.5;

export function mountBlackHole(area: HTMLElement) {
  const c = document.createElement('canvas');
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = `position:absolute;left:0;top:0;width:${SIZE}px;height:${SIZE}px;pointer-events:none;z-index:30;opacity:0;transition:opacity .15s`;
  area.append(c);
  const g = c.getContext('2d')!;
  let hot = false, overLink = false;

  // `hot`: over links and buttons, and over what the hero marks as clickable (planets, the Sun)
  function paint() {
    const dpr = Math.min(devicePixelRatio || 1, 2), m = SIZE / 2, ring = SHADOW * (hot ? 1.4 : 1.14);
    c.width = SIZE * dpr; c.height = SIZE * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const glow = g.createRadialGradient(m, m, SHADOW, m, m, SHADOW * 3.4);
    glow.addColorStop(0, `rgba(255,205,140,${hot ? 0.34 : 0.2})`); glow.addColorStop(1, 'rgba(255,205,140,0)');
    g.fillStyle = glow; g.beginPath(); g.arc(m, m, SHADOW * 3.4, 0, Math.PI * 2); g.fill();
    const beam = g.createLinearGradient(m, m - ring, m, m + ring);
    beam.addColorStop(0, `rgba(255,214,160,${hot ? 0.6 : 0.38})`); beam.addColorStop(1, `rgba(255,238,205,${hot ? 1 : 0.95})`);
    g.strokeStyle = beam; g.lineWidth = hot ? 2.2 : 1.6;
    g.beginPath(); g.arc(m, m, ring, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#000'; g.beginPath(); g.arc(m, m, SHADOW, 0, Math.PI * 2); g.fill();
  }
  paint();

  let x = 0, y = 0, queued = false;
  const place = () => { queued = false; c.style.transform = `translate(${x - SIZE / 2}px, ${y - SIZE / 2}px)`; };
  area.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = area.getBoundingClientRect();
    x = e.clientX - r.left; y = e.clientY - r.top;
    c.style.opacity = '1';
    overLink = !!(e.target as Element).closest('a, button');
    repaint();
    area.classList.add('black-hole-cursor');
    if (!queued) { queued = true; requestAnimationFrame(place); }
  });
  area.addEventListener('pointerleave', () => { c.style.opacity = '0'; area.classList.remove('black-hole-cursor'); });
  function repaint() {
    const now = overLink || area.dataset.hot === '1';
    if (now !== hot) { hot = now; paint(); }
  }
  new MutationObserver(repaint).observe(area, { attributes: true, attributeFilter: ['data-hot'] });
}
