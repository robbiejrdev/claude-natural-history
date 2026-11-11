/* world.js — the world the mascot lives in: sea, land, ash, and the sky that
 * gets interrupted. Everything is drawn with canvas primitives; nothing is
 * loaded from disk. */
(function (g) {
  const U = g.U;
  const W = {};

  W.env = {
    waterY: -400, wet: 1,
    skyTop: U.hex('#08243F'), skyBot: U.hex('#14456B'),
    groundY: 880, groundCol: U.hex('#0E2C42'), hillCol: U.hex('#0A2136'),
    foliage: 0, foliageCol: U.hex('#1B4A38'),
    ash: 0, sunAmt: 0, sunX: 1460, sunY: 230, sunCol: U.hex('#FFE9B0'),
    warm: 0, starAmt: 0, haze: 0.35, grassCol: U.hex('#2E6B4F'),
  };

  W.lerpEnv = function (a, b, t) {
    const o = {};
    for (const k in a) {
      if (typeof a[k] === 'number') o[k] = U.lerp(a[k], b[k], t);
      else if (Array.isArray(a[k])) o[k] = U.mixCol(a[k], b[k], t);
      else o[k] = t < 0.5 ? a[k] : b[k];
    }
    return o;
  };

  // ---------------------------------------------------------------- sky
  W.drawSky = function (ctx, env, t) {
    const grd = ctx.createLinearGradient(0, 0, 0, 1080);
    grd.addColorStop(0, U.rgba(env.skyTop, 1));
    grd.addColorStop(1, U.rgba(env.skyBot, 1));
    ctx.fillStyle = grd;
    ctx.fillRect(-600, -400, 3200, 1700);

    if (env.starAmt > 0.01) {
      const rnd = U.rng(7);
      ctx.fillStyle = U.rgba([255, 255, 255], env.starAmt * 0.8);
      for (let i = 0; i < 90; i++) {
        const x = rnd() * 1920, y = rnd() * 700, r = rnd() * 1.6 + 0.4;
        const tw = 0.6 + 0.4 * Math.sin(t * 2 + i);
        ctx.globalAlpha = env.starAmt * tw;
        ctx.fillRect(x, y, r, r);
      }
      ctx.globalAlpha = 1;
    }

    if (env.sunAmt > 0.01) {
      const r = 92;
      const gl = ctx.createRadialGradient(env.sunX, env.sunY, 0, env.sunX, env.sunY, 320);
      gl.addColorStop(0, U.rgba(env.sunCol, 0.85 * env.sunAmt));
      gl.addColorStop(0.25, U.rgba(env.sunCol, 0.28 * env.sunAmt));
      gl.addColorStop(1, U.rgba(env.sunCol, 0));
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(env.sunX, env.sunY, 320, 0, U.TAU); ctx.fill();
      ctx.fillStyle = U.rgba(env.sunCol, 0.92 * env.sunAmt);
      ctx.beginPath(); ctx.arc(env.sunX, env.sunY, r * 0.55, 0, U.TAU); ctx.fill();
    }
  };

  // ---------------------------------------------------------------- hills
  W.drawHills = function (ctx, env, t) {
    const base = env.groundY;
    for (let layer = 0; layer < 3; layer++) {
      const amp = 90 - layer * 22;
      const y0 = base - 150 + layer * 46;
      const col = U.mixCol(env.hillCol, env.skyBot, 0.35 - layer * 0.1);
      ctx.fillStyle = U.rgba(col, 0.9);
      ctx.beginPath();
      ctx.moveTo(-600, base + 10);
      const rnd = U.rng(31 + layer);
      let x = -600;
      ctx.lineTo(x, y0);
      while (x < 2600) {
        const w = 260 + rnd() * 320;
        const h = amp * (0.45 + rnd() * 0.8);
        ctx.quadraticCurveTo(x + w * 0.5, y0 - h, x + w, y0);
        x += w;
      }
      ctx.lineTo(2600, base + 10);
      ctx.closePath();
      ctx.fill();
    }
  };

  // ---------------------------------------------------------------- foliage
  function fern(ctx, x, y, h, col, seed, sway) {
    const rnd = U.rng(seed);
    ctx.fillStyle = U.rgba(col, 1);
    // trunk
    ctx.beginPath();
    ctx.moveTo(x - h * 0.035, y);
    ctx.quadraticCurveTo(x - h * 0.02 + sway, y - h * 0.6, x + sway * 1.4, y - h);
    ctx.lineTo(x + h * 0.03 + sway * 1.4, y - h);
    ctx.quadraticCurveTo(x + h * 0.02 + sway, y - h * 0.6, x + h * 0.035, y);
    ctx.closePath(); ctx.fill();
    // fronds
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const bx = x + sway * 1.4 * t * t;
      const by = y - h * t;
      const bl = h * (0.34 - 0.2 * t) * (0.7 + rnd() * 0.6);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + side * bl * 0.6, by - bl * 0.25, bx + side * bl, by + bl * 0.18);
        ctx.quadraticCurveTo(bx + side * bl * 0.55, by + bl * 0.12, bx, by);
        ctx.fill();
      }
    }
  }

  W.drawFoliage = function (ctx, env, t) {
    if (env.foliage <= 0.01) return;
    const y = env.groundY;
    const n = Math.round(30 * env.foliage);
    const rnd = U.rng(97);
    for (let i = 0; i < n; i++) {
      const x = -420 + (i + rnd() * 0.7) * (2760 / n);
      const depth = rnd();
      const h = (90 + depth * 190) * env.foliage;
      const sway = Math.sin(t * 0.9 + i * 0.7) * 6 * env.foliage;
      const col = U.mixCol(env.foliageCol, [0, 0, 0], 0.35 - depth * 0.3);
      fern(ctx, x, y + 6, h, col, 300 + i, sway);
    }
  };

  // ---------------------------------------------------------------- ground
  W.drawGround = function (ctx, env, t) {
    const y = env.groundY;
    const grd = ctx.createLinearGradient(0, y, 0, 1300);
    grd.addColorStop(0, U.rgba(env.groundCol, 1));
    grd.addColorStop(1, U.rgba(U.mixCol(env.groundCol, [0, 0, 0], 0.4), 1));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(-600, y + 4);
    for (let x = -600; x < 2600; x += 120) {
      const wob = Math.sin(x * 0.011 + 1.3) * 7 + Math.sin(x * 0.031) * 3;
      ctx.lineTo(x, y + wob);
    }
    ctx.lineTo(2600, 1400); ctx.lineTo(-600, 1400);
    ctx.closePath(); ctx.fill();
    // grass fringe
    if (env.foliage > 0.05) {
      ctx.fillStyle = U.rgba(env.grassCol, 0.85 * env.foliage);
      ctx.beginPath();
      ctx.moveTo(-600, y + 6);
      for (let x = -600; x < 2600; x += 26) {
        const h = 10 + Math.sin(x * 0.21) * 5 + Math.sin(x * 0.07) * 6;
        ctx.lineTo(x, y - h);
        ctx.lineTo(x + 13, y);
      }
      ctx.lineTo(2600, y + 6);
      ctx.closePath(); ctx.fill();
    }
  };

  // ---------------------------------------------------------------- water
  W.drawWater = function (ctx, env, t) {
    const y = env.waterY;
    if (y > 1120) return;                 // fully above water
    // submerged tint
    if (y < 0) {
      ctx.fillStyle = U.rgba(U.hex('#0B3A63'), 0.3 * env.wet);
      ctx.fillRect(0, 0, 1920, 1080);
    } else {
      ctx.fillStyle = U.rgba(U.hex('#0B3A63'), 0.3 * env.wet);
      ctx.fillRect(0, y, 1920, 1080 - y);
      // surface line
      ctx.strokeStyle = U.rgba([220, 240, 255], 0.5 * env.wet);
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let x = 0; x <= 1920; x += 20) {
        const wy = y + Math.sin(x * 0.014 + t * 2.1) * 5 + Math.sin(x * 0.05 + t * 3.3) * 2.5;
        if (x === 0) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    // light shafts
    if (env.wet > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const bx = 260 + i * 380 + Math.sin(t * 0.3 + i) * 40;
        const w = 90 + i * 14;
        const a = 0.055 * env.wet;
        const grd = ctx.createLinearGradient(bx, -200, bx + 180, 1080);
        grd.addColorStop(0, U.rgba([180, 225, 255], a));
        grd.addColorStop(1, U.rgba([180, 225, 255], 0));
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(bx - w * 0.25, -200);
        ctx.lineTo(bx + w * 0.25, -200);
        ctx.lineTo(bx + 320, 1080);
        ctx.lineTo(bx + 320 - w * 1.5, 1080);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  };

  // ---------------------------------------------------------------- bubbles
  W.drawBubbles = function (ctx, env, t) {
    if (env.wet < 0.35) return;
    const rnd = U.rng(1234);
    ctx.strokeStyle = U.rgba([220, 245, 255], 0.5);
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 26; i++) {
      const sx = rnd() * 1920, sp = 26 + rnd() * 60, r = 4 + rnd() * 11;
      const y = 1080 - (((t * sp + rnd() * 1200) % 1300));
      const x = sx + Math.sin(t * 1.4 + i) * 18;
      if (y > env.waterY + 30) continue;
      ctx.globalAlpha = 0.5 * env.wet;
      ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // ---------------------------------------------------------------- ash
  W.drawAsh = function (ctx, env, t) {
    if (env.ash <= 0.02) return;
    ctx.fillStyle = U.rgba(U.hex('#6B6560'), 0.26 * env.ash);
    ctx.fillRect(0, 0, 1920, 1080);
    const rnd = U.rng(555);
    ctx.fillStyle = U.rgba(U.hex('#D8D2C8'), 0.75 * env.ash);
    for (let i = 0; i < 60; i++) {
      const x = rnd() * 1920;
      const y = (rnd() * 1200 + t * (18 + rnd() * 26)) % 1200 - 60;
      const r = 1.2 + rnd() * 2.6;
      ctx.globalAlpha = 0.5 * env.ash;
      ctx.fillRect(x + Math.sin(t * 0.7 + i) * 22, y, r, r);
    }
    ctx.globalAlpha = 1;
  };

  // ---------------------------------------------------------------- asteroid
  W.drawAsteroid = function (ctx, a) {
    // a: {x,y,r,rot,fade}
    if (!a || a.fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = a.fade;
    // fire trail
    for (let i = 0; i < 16; i++) {
      const d = i * 0.55;
      const tx = a.x - Math.cos(a.ang) * d * a.r * 0.9;
      const ty = a.y - Math.sin(a.ang) * d * a.r * 0.9;
      const rr = a.r * (1.5 - i * 0.055);
      const heat = 1 - i / 16;
      const grd = ctx.createRadialGradient(tx, ty, 0, tx, ty, rr);
      grd.addColorStop(0, U.rgba([255, 236, 170], 0.5 * heat));
      grd.addColorStop(0.4, U.rgba([255, 140, 40], 0.42 * heat));
      grd.addColorStop(1, U.rgba([180, 40, 20], 0));
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(tx, ty, rr, 0, U.TAU); ctx.fill();
    }
    // rock
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    const pts = [];
    const n = 13;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * U.TAU;
      const rr = a.r * (0.78 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.36);
      pts.push([Math.cos(ang) * rr, Math.sin(ang) * rr]);
    }
    ctx.fillStyle = U.rgba(U.hex('#4A4038'), 1);
    U.path(ctx, pts); ctx.fill();
    ctx.fillStyle = U.rgba(U.hex('#6B5C4C'), 1);
    ctx.beginPath(); ctx.arc(-a.r * 0.25, -a.r * 0.3, a.r * 0.4, 0, U.TAU); ctx.fill();
    ctx.fillStyle = U.rgba(U.hex('#332B26'), 1);
    ctx.beginPath(); ctx.arc(a.r * 0.3, a.r * 0.25, a.r * 0.26, 0, U.TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  };

  // ---------------------------------------------------------------- impact
  W.drawImpact = function (ctx, imp) {
    if (!imp || imp.t <= 0) return;
    const t = imp.t;   // 0..1
    // flash
    if (t < 0.42) {
      const k = 1 - t / 0.42;
      const grd = ctx.createRadialGradient(imp.x, imp.y, 0, imp.x, imp.y, 1800 * (0.4 + t * 2.2));
      grd.addColorStop(0, U.rgba([255, 253, 245], 1 * k));
      grd.addColorStop(0.22, U.rgba([255, 232, 170], 0.95 * k));
      grd.addColorStop(0.5, U.rgba([255, 170, 70], 0.6 * k));
      grd.addColorStop(1, U.rgba([255, 120, 40], 0));
      ctx.fillStyle = grd;
      ctx.fillRect(-600, -400, 3200, 1700);
    }
    // shock rings
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const rt = Math.max(0, (t - i * 0.12) / 0.7);
      if (rt <= 0 || rt >= 1) continue;
      ctx.strokeStyle = U.rgba([255, 226, 170], (1 - rt) * 0.5);
      ctx.lineWidth = 14 * (1 - rt) + 2;
      ctx.beginPath();
      ctx.arc(imp.x, imp.y, 90 + rt * 1500, 0, U.TAU);
      ctx.stroke();
    }
    ctx.restore();
    // debris
    const rnd = U.rng(imp.seed || 5);
    for (let i = 0; i < 46; i++) {
      const ang = -Math.PI * 0.5 + (rnd() - 0.5) * 2.6;
      const sp = 260 + rnd() * 900;
      const life = U.clamp01(t * 1.5 - rnd() * 0.35);
      if (life <= 0) continue;
      const px = imp.x + Math.cos(ang) * sp * life;
      const py = imp.y + Math.sin(ang) * sp * life + 620 * life * life;
      const s = (5 + rnd() * 16) * (1 - life * 0.6);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rnd() * 6 + life * 9);
      ctx.fillStyle = U.rgba(U.hex('#4A4038'), (1 - life) * 0.95);
      ctx.fillRect(-s / 2, -s / 2, s, s * 0.8);
      ctx.restore();
    }
    // smoke plume
    if (t > 0.15) {
      const rnd2 = U.rng((imp.seed || 5) + 9);
      for (let i = 0; i < 26; i++) {
        const ang = -Math.PI * 0.5 + (rnd2() - 0.5) * 1.5;
        const sp = 60 + rnd2() * 240;
        const life = U.clamp01((t - 0.15) * 1.1);
        const px = imp.x + Math.cos(ang) * sp * life;
        const py = imp.y + Math.sin(ang) * sp * life - life * 120;
        const rr = (40 + rnd2() * 90) * (0.4 + life);
        const grd = ctx.createRadialGradient(px, py, 0, px, py, rr);
        grd.addColorStop(0, U.rgba([70, 62, 56], 0.5 * (1 - life * 0.6)));
        grd.addColorStop(1, U.rgba([70, 62, 56], 0));
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(px, py, rr, 0, U.TAU); ctx.fill();
      }
    }
  };

  // ---------------------------------------------------------------- hole
  W.drawHole = function (ctx, x, y, r, t) {
    ctx.fillStyle = U.rgba(U.hex('#1A1512'), 1);
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.34, 0, 0, U.TAU);
    ctx.fill();
    const grd = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.35);
    grd.addColorStop(0, U.rgba(U.hex('#0C0908'), 0.75));
    grd.addColorStop(1, U.rgba(U.hex('#0C0908'), 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.35, r * 0.5, 0, 0, U.TAU);
    ctx.fill();
  };

  g.W = W;

  return g;
})(typeof window !== 'undefined' ? window : globalThis);
