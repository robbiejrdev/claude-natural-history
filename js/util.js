/* util.js — small math/color helpers shared by every module. */
(function (g) {
  const U = {};

  U.TAU = Math.PI * 2;
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.mix = U.lerp;

  // frame-rate independent exponential approach
  U.damp = (a, b, lambda, dt) => U.lerp(a, b, 1 - Math.exp(-lambda * dt));

  U.smooth = (t) => { t = U.clamp01(t); return t * t * (3 - 2 * t); };
  U.easeInOut = (t) => { t = U.clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  U.easeOut = (t) => { t = U.clamp01(t); return 1 - Math.pow(1 - t, 3); };
  U.easeIn = (t) => { t = U.clamp01(t); return t * t * t; };
  U.easeOutBack = (t) => {
    t = U.clamp01(t);
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  U.easeOutElasticSoft = (t) => {
    t = U.clamp01(t);
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  };

  // deterministic RNG so a transition always dissolves the same way
  U.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // ---- colour ----
  U.hex = (h) => {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  U.mixCol = (a, b, t) => [
    U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t),
  ];
  U.col = (h, a) => U.rgba(U.hex(h), a === undefined ? 1 : a);

  // ---- geometry ----
  // Superellipse blob: e=1 is an ellipse, e<1 is a rounded box.
  U.blob = function (cx, cy, w, h, e, steps) {
    steps = steps || 34;
    const p = [];
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * U.TAU;
      const ct = Math.cos(t), st = Math.sin(t);
      const x = cx + (w / 2) * Math.sign(ct) * Math.pow(Math.abs(ct), e);
      const y = cy + (h / 2) * Math.sign(st) * Math.pow(Math.abs(st), e);
      p.push([x, y]);
    }
    return p;
  };

  // path from a point list
  U.path = function (ctx, pts, close) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close !== false) ctx.closePath();
  };

  U.rot = (x, y, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [x * c - y * s, x * s + y * c];
  };

  g.U = U;

  return g;
})(typeof window !== 'undefined' ? window : globalThis);
