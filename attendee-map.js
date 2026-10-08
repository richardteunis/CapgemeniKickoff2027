(function () {
  if (customElements.get('attendee-map')) return;
  const URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
  const CUN = [-86.85, 21.16];
  const CITIES = [
    [[-74, 40.7], [-87.6, 41.9], [-122.4, 37.8], [-96.8, 32.8], [-84.4, 33.7]],
    [[-79.4, 43.7], [-73.6, 45.5], [-123.1, 49.3]],
    [[-99.1, 19.4], [-100.3, 25.7], [-103.3, 20.7]],
    [[-46.6, -23.5], [-43.2, -22.9]],
    [[-58.4, -34.6]],
    [[-74.1, 4.7], [-75.6, 6.2]],
    [[-70.7, -33.4]]
  ];
  const STOPS = ['#0058AB', '#1A86D0', '#05A3E6', '#00BFB3'];
  const NS = 'http://www.w3.org/2000/svg';
  const W = 800, H = 900;
  let topoP = null;
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  class AttendeeMap extends HTMLElement {
    static get observedAttributes() { return ['data-counts', 'data-pulse']; }
    connectedCallback() {
      if (this._svg) return;
      this.style.display = 'block'; this.style.width = '100%';
      const svg = this._svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'Map of the Americas with arcs from each market to Cancún' });
      svg.style.display = 'block'; svg.style.height = 'auto'; svg.style.overflow = 'visible';
      this.appendChild(svg);
      const defs = el('defs', {}, svg);
      const g = el('linearGradient', { id: 'am-grad', x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
      STOPS.forEach((c, i) => el('stop', { offset: String(i / 3), 'stop-color': c }, g));
      const rg = el('radialGradient', { id: 'am-glow' }, defs);
      el('stop', { offset: '0', 'stop-color': '#05A3E6', 'stop-opacity': '0.35' }, rg);
      el('stop', { offset: '1', 'stop-color': '#05A3E6', 'stop-opacity': '0' }, rg);
      this.gLand = el('g', { fill: '#222C47' }, svg);
      this.gArcs = el('g', { fill: 'none' }, svg);
      this.gDots = el('g', {}, svg);
      this.gFx = el('g', {}, svg);
      this.build();
    }
    async build() {
      const t0 = Date.now();
      while (!(window.d3 && window.topojson)) { if (Date.now() - t0 > 15000) return; await new Promise(r => setTimeout(r, 100)); }
      topoP = topoP || fetch(URL).then(r => r.json());
      const topo = await topoP;
      const land = topojson.feature(topo, topo.objects.countries);
      const proj = this.proj = d3.geoMercator().fitExtent([[24, 24], [W - 24, H - 24]], { type: 'MultiPoint', coordinates: [[-126, 56], [-34, -55]] });
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#000'; ctx.beginPath(); d3.geoPath(proj, ctx)(land); ctx.fill();
      const px = ctx.getImageData(0, 0, W, H).data, step = 9;
      let frag = '';
      for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step)
        if (px[(Math.floor(y) * W + Math.floor(x)) * 4 + 3] > 0) frag += `<circle cx="${x}" cy="${y}" r="1.6"/>`;
      this.gLand.innerHTML = frag;

      const c = proj(CUN); this.c = c;
      el('circle', { cx: c[0], cy: c[1], r: 90, fill: 'url(#am-glow)' }, this.gArcs);
      this.cities = [];
      const motion = !still();
      CITIES.forEach((list, mi) => list.forEach((ll, ci) => {
        const p = proj(ll);
        const dx = c[0] - p[0], dy = c[1] - p[1], len = Math.hypot(dx, dy);
        const k = Math.min(0.42, 40 / len + 0.2), side = p[0] < c[0] ? 1 : -1;
        const qx = (p[0] + c[0]) / 2 - dy * k * side, qy = (p[1] + c[1]) / 2 + dx * k * side;
        const d = `M${p[0].toFixed(1)},${p[1].toFixed(1)} Q${qx.toFixed(1)},${qy.toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;
        const path = el('path', { d, stroke: 'url(#am-grad)', 'stroke-width': '1.4', 'stroke-linecap': 'round', opacity: '0.8' }, this.gArcs);
        const L = path.getTotalLength();
        path.style.strokeDasharray = L; path.style.strokeDashoffset = motion ? L : 0;
        const dot = el('circle', { cx: p[0], cy: p[1], r: 3, fill: '#FFFFFF' }, this.gDots);
        if (motion) {
          const comet = el('circle', { r: '2.2', fill: '#7FD3F2', opacity: '0' }, this.gFx);
          const dur = (3.6 + ((mi * 7 + ci * 3) % 10) / 4).toFixed(2) + 's', begin = ((mi * 1.3 + ci * 0.7) % 4 + 2).toFixed(2) + 's';
          el('animateMotion', { dur, begin, repeatCount: 'indefinite', path: d }, comet);
          el('animate', { attributeName: 'opacity', values: '0;1;1;0', keyTimes: '0;0.1;0.85;1', dur, begin, repeatCount: 'indefinite' }, comet);
        }
        this.cities.push({ mi, ci, p, path, dot, L });
      }));
      const ring = el('circle', { cx: c[0], cy: c[1], r: 7, fill: 'none', stroke: '#05A3E6', 'stroke-width': '1.5' }, this.gFx);
      if (motion) {
        el('animate', { attributeName: 'r', values: '7;30', dur: '2.4s', repeatCount: 'indefinite' }, ring);
        el('animate', { attributeName: 'opacity', values: '1;0', dur: '2.4s', repeatCount: 'indefinite' }, ring);
      }
      el('circle', { cx: c[0], cy: c[1], r: 6, fill: '#FFFFFF' }, this.gFx);
      const lbl = el('text', { x: c[0] + 16, y: c[1] + 5, fill: '#FFFFFF', 'font-size': '14', 'letter-spacing': '3.5', 'font-family': 'Ubuntu, sans-serif' }, this.gFx);
      lbl.textContent = 'CANCÚN';

      this.applyCounts();
      if (motion) {
        const io = new IntersectionObserver(es => {
          if (!es.some(e => e.isIntersecting)) return;
          io.disconnect();
          this.cities.forEach((ct, i) => ct.path.animate([{ strokeDashoffset: ct.L }, { strokeDashoffset: 0 }], { duration: 1600, delay: 200 + i * 90, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' }));
        }, { threshold: 0.2 });
        io.observe(this);
      }
    }
    applyCounts() {
      if (!this.cities) return;
      let counts = [];
      try { counts = JSON.parse(this.getAttribute('data-counts') || '[]'); } catch (e) {}
      this.cities.forEach(ct => { const n = counts[ct.mi] || 10; ct.dot.setAttribute('r', (2.4 + Math.sqrt(n) * 0.55).toFixed(2)); });
    }
    pulse(v) {
      if (!this.cities || !v) return;
      const [mi, ci] = v.split(':').map(Number);
      const ct = this.cities.find(c => c.mi === mi && c.ci === ci);
      if (!ct || still()) return;
      const ring = el('circle', { cx: ct.p[0], cy: ct.p[1], r: 5, fill: 'none', stroke: '#00BFB3', 'stroke-width': '2' }, this.gFx);
      ring.style.transformBox = 'fill-box'; ring.style.transformOrigin = 'center';
      ring.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(6)', opacity: 0 }], { duration: 1600, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = () => ring.remove();
      ct.path.animate([{ strokeWidth: '4px', opacity: 1 }, { strokeWidth: '1.4px', opacity: 0.8 }], { duration: 1800, easing: 'ease-out' });
      const comet = el('circle', { r: '4', fill: '#FFFFFF' }, this.gFx);
      const am = el('animateMotion', { dur: '1.4s', begin: 'indefinite', fill: 'freeze', path: ct.path.getAttribute('d') }, comet);
      am.beginElement();
      setTimeout(() => comet.remove(), 1500);
    }
    attributeChangedCallback(n, o, v) {
      if (n === 'data-counts') this.applyCounts();
      if (n === 'data-pulse' && v !== o) this.pulse(v);
    }
  }
  customElements.define('attendee-map', AttendeeMap);
})();
