(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function canvasSetup(el) {
    if (!el) return null;
    const ctx = el.getContext('2d');
    let w = 0, h = 0;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = el.getBoundingClientRect();
      w = r.width;
      h = r.height;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }

    resize();
    return { ctx, resize, get dims() { return { w, h }; } };
  }

  function pellet(ctx, x, y, r, a) {
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(Math.round(x - r / 2), Math.round(y - r / 2), r, r);
  }

  /* ── HERO: pac-man pellet route + chaser ── */
  function heroMaze() {
    const canvas = document.querySelector('.hero-maze');
    const runner = document.querySelector('.hero-runner');
    const setup = canvasSetup(canvas);
    if (!setup) return;

    const { ctx, resize, dims } = setup;
    const ptr = { x: -999, y: -999 };
    let route = [];
    let arrow = [];

    const pt = (x, y) => ({ x, y });

    function buildRoute(verts, gap) {
      const dots = [];
      for (let i = 1; i < verts.length; i++) {
        const a = verts[i - 1], b = verts[i];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const n = Math.max(1, Math.floor(len / gap));
        for (let s = i === 1 ? 0 : 1; s <= n; s++) {
          const t = s / n;
          dots.push(pt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
        }
      }
      return dots;
    }

    function layout() {
      const { w, h } = resize();
      const mob = w <= 768;
      const copyL = mob ? 24 : Math.min(Math.max(400, w * 0.4), 540);
      const rx = mob ? w * 0.42 : copyL;
      const ry = mob ? 168 : h * 0.3;
      const top = mob ? 56 : 72;

      route = buildRoute([
        pt(mob ? 80 : Math.max(100, copyL - 260), top),
        pt(rx, top),
        pt(rx, ry),
      ], mob ? 24 : 32);

      arrow = [
        pt(rx - 16, ry + 20),
        pt(rx + 16, ry + 20),
        pt(rx, ry + 38),
      ];
    }

    function placeRunner(idx) {
      if (!runner || !route.length) return;
      const dot = route[Math.min(idx, route.length - 1)];
      runner.style.opacity = '1';
      runner.style.left = `${dot.x - 4}px`;
      runner.style.top = `${dot.y - 4}px`;
    }

    function draw(t) {
      const { w, h } = dims;
      ctx.clearRect(0, 0, w, h);

      const cycle = 6400;
      const prog = (t % cycle) / cycle;
      const eaten = Math.floor(prog * route.length);
      const active = Math.min(eaten, route.length - 1);

      placeRunner(active);

      route.forEach((dot, i) => {
        if (i < eaten - 1) return;
        const trail = i - eaten;
        const lit = trail >= 0 && trail <= 4;
        const dist = Math.hypot(dot.x - ptr.x, dot.y - ptr.y);
        const pull = dist < 100 ? (1 - dist / 100) * 2 : 0;
        const px = dist ? dot.x + ((dot.x - ptr.x) / dist) * pull : dot.x;
        const py = dist ? dot.y + ((dot.y - ptr.y) / dist) * pull : dot.y;
        const size = i === active ? 6 : 4;
        const alpha = lit ? 0.95 - trail * 0.15 : i < eaten ? 0 : 0.28;
        if (alpha > 0) pellet(ctx, px, py, size, alpha);
      });

      const flash = prog > 0.74 && prog < 0.82;
      arrow.forEach((dot, i) => {
        pellet(ctx, dot.x, dot.y, i === 2 ? 6 : 4, flash ? 1 : 0.3);
      });

      if (!reduced.matches) requestAnimationFrame(draw);
    }

    window.addEventListener('resize', layout, { passive: true });
    window.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
    }, { passive: true });
    window.addEventListener('pointerleave', () => { ptr.x = ptr.y = -999; }, { passive: true });

    layout();
    requestAnimationFrame(draw);
  }

  /* ── FRAGMENT: dead-end rays (no connection) ── */
  function fragmentRays() {
    const canvas = document.querySelector('.fragment-canvas');
    const stage = document.querySelector('.fragment-stage');
    const plats = [...document.querySelectorAll('.platform')];
    if (!canvas || !stage || !plats.length) return;

    const setup = canvasSetup(canvas);
    if (!setup) return;
    const { ctx, resize, dims } = setup;
    const angles = [-2.5, 2.3, 1.2, -0.9, 2.7, 0.4];

    function draw(t) {
      const sr = stage.getBoundingClientRect();
      const { w, h } = dims;
      ctx.clearRect(0, 0, w, h);

      plats.forEach((el, idx) => {
        const pr = el.getBoundingClientRect();
        const ox = pr.left - sr.left + pr.width / 2;
        const oy = pr.top - sr.top + pr.height / 2;
        const ang = angles[idx];
        const head = Math.floor(((t + idx * 800) % 5000) / 5000 * 5);

        for (let s = 0; s < 5; s++) {
          const d = 20 + s * 16;
          const x = ox + Math.cos(ang) * d;
          const y = oy + Math.sin(ang) * d;
          const trail = (head - s + 5) % 5;
          const on = trail <= 1;
          if (s === 4) {
            pellet(ctx, x, y, 3, on ? 0.15 : 0.05);
          } else {
            pellet(ctx, x, y, 3, on ? 0.55 - trail * 0.2 : 0.1);
          }
        }
      });

      if (!reduced.matches) requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(draw);
  }

  /* ── IMPORT: pellets fall into pipeline ── */
  function importFlow() {
    const canvas = document.querySelector('.import-canvas');
    const stage = document.querySelector('.import-stage');
    const drop = document.querySelector('.drop-zone');
    if (!canvas || !stage || !drop) return;

    const setup = canvasSetup(canvas);
    if (!setup) return;
    const { ctx, resize, dims } = setup;

    function draw(t) {
      const sr = stage.getBoundingClientRect();
      const dr = drop.getBoundingClientRect();
      const { w, h } = dims;
      ctx.clearRect(0, 0, w, h);

      const cx = dr.left - sr.left + dr.width / 2;
      const cy = dr.top - sr.top + dr.height;
      const floor = h * 0.82;
      const n = 10;

      for (let i = 0; i < n; i++) {
        const off = i / n;
        const p = ((t * 0.0002 + off) % 1);
        const y = cy + (floor - cy) * p;
        const x = cx + Math.sin(p * Math.PI) * 24 * (i % 2 ? 1 : -1);
        const a = p < 0.08 || p > 0.92 ? 0.12 : 0.65;
        pellet(ctx, x, y, 4, a);
      }

      if (!reduced.matches) requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(draw);
  }

  /* ── INJECT: memory pellets to surfaces ── */
  function injectFlow() {
    const canvas = document.querySelector('.inject-canvas');
    const stage = document.querySelector('.inject-stage');
    const rows = [...document.querySelectorAll('.inject-row')];
    if (!canvas || !stage || !rows.length) return;

    const setup = canvasSetup(canvas);
    if (!setup) return;
    const { ctx, resize, dims } = setup;

    function draw(t) {
      const sr = stage.getBoundingClientRect();
      const { w, h } = dims;
      ctx.clearRect(0, 0, w, h);

      const srcX = 16;
      const srcY = h / 2;
      pellet(ctx, srcX, srcY, 6, 0.85);

      rows.forEach((row, idx) => {
        const rr = row.getBoundingClientRect();
        const tx = rr.left - sr.left + 8;
        const ty = rr.top - sr.top + rr.height / 2;
        const prog = ((t + idx * 900) % 3600) / 3600;

        for (let d = 0; d < 6; d++) {
          const p = (prog + d / 6) % 1;
          const x = srcX + (tx - srcX) * p;
          const y = srcY + (ty - srcY) * p;
          pellet(ctx, x, y, 3, p < 0.05 || p > 0.95 ? 0.1 : 0.5);
        }
      });

      if (!reduced.matches) requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(draw);
  }

  /* ── SCROLL REVEAL (stepped) ── */
  function reveal() {
    const els = document.querySelectorAll('.panel-copy, .fragment-stage, .engine-stage, .import-stage, .structure-stage, .proof-stage, .inject-stage, .cta');
    els.forEach((el) => el.classList.add('reveal'));

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('is-in');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    els.forEach((el) => obs.observe(el));
  }

  heroMaze();
  fragmentRays();
  importFlow();
  injectFlow();
  reveal();
})();