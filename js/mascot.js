/* mascot.js — the Claude mascot, drawn from scratch every frame.
 *
 * The character is a terracotta, flat-shaded quadruped built out of blobs:
 * closed happy eyes and a black-and-white checkered flag are carried through
 * every stage of the film so it always reads as the same creature.
 *
 * Every stage is one flat parameter set; morphing is a straight lerp of that
 * set, which is what keeps each transformation on screen instead of cutting.
 */
(function (g) {
  const U = g.U;
  const M = {};

  // ---------------------------------------------------------------- palette
  M.COL = {
    body: U.hex('#D97757'),      // Claude orange
    bodyDark: U.hex('#B4583C'),  // far-side limbs, shadow side
    bodyLight: U.hex('#E89270'),
    ink: U.hex('#1A1210'),       // eyes, mouth, flag pole
    cream: U.hex('#F6EFE4'),
    flagBlack: U.hex('#171412'),
    flagWhite: U.hex('#FBF8F2'),
  };

  // ---------------------------------------------------------------- stages
  const base = {
    // torso
    torsoLen: 1, torsoH: 0.6, torsoRound: 0.6, taperF: 0, taperB: 0,
    spine: 0,                      // 0 = horizontal, -PI/2 = standing up
    // head
    headOff: 0.8, headY: 0, headLen: 0.6, headH: 0.55, headRound: 0.7,
    snout: 0, snoutLen: 0, nose: 0,
    earRound: 0, earSize: 0.34,
    muzzle: 0, hair: 0,
    // legs (0 far-front, 1 near-front, 2 far-back, 3 near-back)
    legP0: 0, legP1: 0, legP2: 0, legP3: 0,
    legS: 0.42, legS2: -0.42, legDrop: 0.24, legA: Math.PI / 2, legLen: 0.4, legW: 0.16,
    // arms (0 = high-five arm, 1 = flag arm)
    armP0: 0, armP1: 0,
    armS: 0.5, armDrop: 0.1, armA0: Math.PI / 2, armA1: Math.PI / 2,
    armLen: 0.4, armW: 0.14, armSpread: 0.3,
    // tail
    tailLen: 1, tailThick: 0.25, tailDir: Math.PI, tailCurve: 0, tailFin: 0, tailTaper: 1.45,
    // fins & plates
    dorsal: 0, ventral: 0, sideFin: 0, spikes: 0,
    // face
    eyeSize: 0.13, eyeGap: 0.3, eyeFwd: 0.06, eyeUp: 0, mouth: 0.6,
    // flag
    flagS: 0.42, flagRise: 0.52, flagLen: 1.05, flagScale: 1,
    // placement
    px: 960, py: 620, scale: 220, flip: 1, tilt: 0,
  };

  const P = (o) => Object.assign({}, base, o);

  M.STAGE = {
    TADPOLE: P({
      torsoLen: 0.66, torsoH: 0.6, torsoRound: 0.95, taperF: 0.1, taperB: 0.18,
      headOff: 0.4, headY: -0.07, headLen: 0.6, headH: 0.68, headRound: 0.95,
      tailLen: 0.9, tailThick: 0.2, tailTaper: 0.85, tailDir: Math.PI * 0.92, tailCurve: 0.42, tailFin: 0.55,
      dorsal: 0.3, ventral: 0.1,
      eyeSize: 0.05, eyeGap: 0.2, eyeFwd: 0.02, eyeUp: 0.14,
      flagS: 0.1, flagRise: 0.34, flagLen: 0.5, flagScale: 0.56,
      px: 930, py: 660, scale: 190,
    }),
    FISH: P({
      torsoLen: 1.2, torsoH: 0.82, torsoRound: 0.82, taperF: 0.1, taperB: 0.34,
      headOff: 0.5, headY: -0.05, headLen: 0.68, headH: 0.84, headRound: 0.95,
      tailLen: 0.34, tailThick: 0.2, tailTaper: 0.9, tailDir: Math.PI * 0.94, tailCurve: 0.1, tailFin: 1,
      dorsal: 1, ventral: 0.45, sideFin: 0.8,
      eyeSize: 0.056, eyeGap: 0.26, eyeFwd: 0.06, eyeUp: 0.12,
      flagS: 0.26, flagRise: 0.4, flagLen: 0.58, flagScale: 0.7,
      px: 940, py: 630, scale: 205,
    }),
    LIZARD: P({
      torsoLen: 1.35, torsoH: 0.56, torsoRound: 0.45, taperF: 0.16, taperB: 0.3,
      headOff: 0.92, headY: -0.1, headLen: 0.66, headH: 0.5, headRound: 0.5,
      snout: 1, snoutLen: 0.3, nose: 0.5,
      legP0: 1, legP1: 1, legP2: 1, legP3: 1,
      legS: 0.44, legS2: -0.44, legDrop: 0.2, legA: Math.PI / 2, legLen: 0.42, legW: 0.15,
      tailLen: 1.3, tailThick: 0.15, tailDir: Math.PI * 0.88, tailCurve: 0.32,
      eyeSize: 0.044, eyeGap: 0.22, eyeFwd: 0.08, eyeUp: 0.2,
      flagS: 0.44, flagRise: 0.3, flagLen: 0.54, flagScale: 0.66,
      px: 950, py: 648, scale: 225,
    }),
    DINO: P({
      torsoLen: 1.75, torsoH: 1.05, torsoRound: 0.4, taperF: 0.1, taperB: 0.26,
      headOff: 1.32, headY: -0.34, headLen: 1.0, headH: 0.8, headRound: 0.42,
      snout: 1, snoutLen: 0.46, nose: 0.4,
      legP0: 1, legP1: 1, legP2: 1, legP3: 1,
      legS: 0.5, legS2: -0.55, legDrop: 0.4, legA: Math.PI / 2, legLen: 0.7, legW: 0.44,
      armP0: 0.8, armP1: 1,
      armS: 0.62, armDrop: -0.2, armA0: -1.0, armA1: -2.25,
      armLen: 0.42, armW: 0.14, armSpread: 0.3,
      tailLen: 2.0, tailThick: 0.26, tailDir: Math.PI * 0.93, tailCurve: 0.2,
      spikes: 1,
      eyeSize: 0.05, eyeGap: 0.24, eyeFwd: 0.12, eyeUp: 0.18,
      flagS: 0.58, flagRise: 0.58, flagLen: 0.78, flagScale: 0.92,
      px: 1030, py: 466, scale: 230,
    }),
    RAT: P({
      torsoLen: 0.92, torsoH: 0.6, torsoRound: 0.85, taperF: 0.12, taperB: 0.28,
      headOff: 0.6, headY: -0.06, headLen: 0.56, headH: 0.54, headRound: 0.8,
      snout: 1, snoutLen: 0.34, nose: 1,
      earRound: 1, earSize: 0.42,
      legP0: 1, legP1: 1, legP2: 1, legP3: 1,
      legS: 0.3, legS2: -0.3, legDrop: 0.2, legA: Math.PI / 2, legLen: 0.28, legW: 0.13,
      tailLen: 1.05, tailThick: 0.075, tailDir: Math.PI * 1.04, tailCurve: 0.38,
      eyeSize: 0.042, eyeGap: 0.19, eyeFwd: 0.04, eyeUp: 0.14,
      flagS: 0.2, flagRise: 0.31, flagLen: 0.5, flagScale: 0.62,
      px: 930, py: 674, scale: 200,
    }),
    MONKEY: P({
      torsoLen: 0.8, torsoH: 0.92, torsoRound: 0.9, taperF: 0.05, taperB: 0.12,
      spine: -0.42,
      headOff: 0.72, headY: -0.06, headLen: 0.6, headH: 0.6, headRound: 0.9,
      snout: 0.55, snoutLen: 0.16, nose: 0.7,
      earRound: 1, earSize: 0.36,
      muzzle: 1,
      legP0: 0, legP1: 0, legP2: 1, legP3: 1,
      legS: 0.2, legS2: -0.34, legDrop: 0.2, legA: Math.PI / 2, legLen: 0.52, legW: 0.17,
      armP0: 1, armP1: 1,
      armS: 0.26, armDrop: 0.12, armA0: Math.PI * 0.72, armA1: -2.1,
      armLen: 0.52, armW: 0.14, armSpread: 0.32,
      tailLen: 0.92, tailThick: 0.11, tailDir: Math.PI * 1.12, tailCurve: 0.42,
      eyeSize: 0.044, eyeGap: 0.22, eyeFwd: 0.08, eyeUp: 0.16,
      flagS: 0.2, flagRise: 0.44, flagLen: 0.54, flagScale: 0.7,
      px: 960, py: 594, scale: 245,
    }),
    HUMAN: P({
      torsoLen: 1.12, torsoH: 0.52, torsoRound: 0.4, taperF: 0.04, taperB: 0.05,
      spine: -Math.PI / 2,
      headOff: 0.62, headY: 0, headLen: 0.56, headH: 0.54, headRound: 0.88,
      snout: 0.12, snoutLen: 0.05,
      earRound: 0.55, earSize: 0.3,
      hair: 1,
      legP0: 0, legP1: 0, legP2: 1, legP3: 1,
      legS: 0.1, legS2: -0.32, legDrop: 0.12, legA: Math.PI / 2, legLen: 0.72, legW: 0.26,
      armP0: 1, armP1: 1,
      armS: 0.34, armDrop: 0.1, armA0: Math.PI * 0.62, armA1: Math.PI * 0.88,
      armLen: 0.72, armW: 0.14, armSpread: 0.3,
      tailLen: 0, tailThick: 0,
      eyeSize: 0.055, eyeGap: 0.2, eyeFwd: -0.09, eyeUp: 0.03,
      flagS: 0.2, flagRise: 0.3, flagLen: 0.54, flagScale: 0.7,
      px: 830, py: 525, scale: 250,
    }),
  };

  // ---------------------------------------------------------------- lerp
  const FIELDS = Object.keys(base);
  M.lerpParams = function (a, b, t) {
    const o = {};
    for (const k of FIELDS) o[k] = U.lerp(a[k], b[k], t);
    return o;
  };

  // ---------------------------------------------------------------- helpers
  function torsoPath(p) {
    const pts = U.blob(0, 0, p.torsoLen, p.torsoH, U.lerp(0.34, 1, p.torsoRound), 40);
    // taper the silhouette toward the snout and the tail
    for (const q of pts) {
      const u = q[0] / (p.torsoLen / 2);
      const k = (1 - p.taperF * Math.max(0, u) ** 2) * (1 - p.taperB * Math.max(0, -u) ** 2);
      q[1] *= k;
      q[0] = Math.sign(q[0]) * Math.min(Math.abs(q[0]), p.torsoLen / 2);
    }
    // the body lies along the spine
    const c = Math.cos(p.spine), sn = Math.sin(p.spine);
    for (const q of pts) {
      const x = q[0], y = q[1];
      q[0] = x * c - y * sn;
      q[1] = x * sn + y * c;
    }
    return pts;
  }

  function limbPoints(x, y, ang, len, w, far) {
    const a = ang;
    const dx = Math.cos(a), dy = Math.sin(a);
    const px_ = -dy, py_ = dx;
    const w0 = w * 0.5, w1 = w * 0.38;
    const pts = [];
    const N = 8;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const ww = U.lerp(w0, w1, t);
      pts.push([x + dx * len * t + px_ * ww, y + dy * len * t + py_ * ww]);
    }
    for (let i = N; i >= 0; i--) {
      const t = i / N;
      const ww = U.lerp(w0, w1, t);
      pts.push([x + dx * len * t - px_ * ww, y + dy * len * t - py_ * ww]);
    }
    return pts;
  }

  function tailPath(x, y, dir, curve, len, thick, taper) {
    const N = 20;
    const spine = [];
    let a = dir, cx = x, cy = y;
    for (let i = 0; i <= N; i++) {
      spine.push([cx, cy]);
      const st = len / N;
      cx += Math.cos(a) * st;
      cy += Math.sin(a) * st;
      a += curve / N;
    }
    const left = [], right = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const w = Math.max(0.01, thick * (1 - t) ** taper);
      const prev = spine[Math.max(0, i - 1)], next = spine[Math.min(N, i + 1)];
      const ang = Math.atan2(next[1] - prev[1], next[0] - prev[0]);
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      left.push([spine[i][0] + nx * w, spine[i][1] + ny * w]);
      right.push([spine[i][0] - nx * w, spine[i][1] - ny * w]);
    }
    return { pts: left.concat(right.reverse()), spine, endAng: a, end: spine[N] };
  }

  function caudalFin(end, ang, size) {
    // a soft rounded fan at the end of the tail
    const L = size * 0.85, W = size * 0.66;
    const cx = end[0] + Math.cos(ang) * L * 0.3;
    const cy = end[1] + Math.sin(ang) * L * 0.3;
    const a0 = ang - 1.15, a1 = ang + 1.15;
    const pts = [[end[0], end[1]]];
    for (let i = 0; i <= 12; i++) {
      const a = a0 + (a1 - a0) * (i / 12);
      pts.push([cx + Math.cos(a) * W, cy + Math.sin(a) * W]);
    }
    pts.push([end[0], end[1]]);
    return pts;
  }

  // ---------------------------------------------------------------- drawing
  /**
   * drawMascot(ctx, p, time, opts)
   *   p    – parameter set (already morphed)
   *   time – seconds, for the flag flutter / walk cycle
   *   opts – { motion:'swim'|'walk'|'idle'|'talk'|'stand', walkPhase, facing }
   */
  M.drawMascot = function (ctx, p, time, opts) {
    opts = opts || {};
    const motion = opts.motion || 'idle';
    const s = p.scale;
    const col = M.COL;

    ctx.save();
    ctx.translate(p.px, p.py);
    if (p.tilt) ctx.rotate(p.tilt);
    ctx.scale(p.flip * s, s);
    // in local space: +x forward, +y down, one unit = one body length

    const sp = p.spine;
    const fwd = [Math.cos(sp), Math.sin(sp)];       // along the spine, toward the head
    const perp = [-Math.sin(sp), Math.cos(sp)];     // perpendicular (down for a horizontal spine)

    // gait
    let gait = 0;
    if (motion === 'walk') gait = Math.sin(opts.walkPhase || 0);
    else if (motion === 'swim') gait = Math.sin((opts.walkPhase || 0) * 1.4);
    const bob = motion === 'walk' ? Math.abs(Math.sin(opts.walkPhase || 0)) * 0.03
      : motion === 'swim' ? Math.sin((opts.walkPhase || 0) * 1.4) * 0.05 : 0;

    // ---------------------------------------------------------- tail (behind)
    if (p.tailLen > 0.02) {
      const tailX = -p.torsoLen / 2 + 0.02, tailY = 0;
      const tp = tailPath(tailX, tailY, p.tailDir, p.tailCurve, p.tailLen, p.tailThick, p.tailTaper);
      ctx.fillStyle = U.rgba(col.body, 1);
      U.path(ctx, tp.pts); ctx.fill();
      if (p.tailFin > 0.02) {
        ctx.fillStyle = U.rgba(col.body, 1);
        U.path(ctx, caudalFin(tp.end, tp.endAng, p.tailFin)); ctx.fill();
      }
    }

    // ---------------------------------------------------------- far legs
    const legDefs = [
      { p: p.legP0, s: p.legS + 0.05, far: true },
      { p: p.legP1, s: p.legS - 0.02, far: false },
      { p: p.legP2, s: p.legS2 + 0.05, far: true },
      { p: p.legP3, s: p.legS2 - 0.02, far: false },
    ];
    const drawLeg = (L) => {
      if (L.p <= 0.01) return;
      const drop = L.far ? p.legDrop - p.legW * 0.35 : p.legDrop;
      const ax = fwd[0] * L.s + perp[0] * 0, ay = fwd[1] * L.s;
      const x = ax, y = ay + drop + bob;
      const swing = gait * 0.42 * (L.far ? -1 : 1) * (motion === 'walk' ? 1 : 0);
      const ang = p.legA + swing;
      ctx.fillStyle = U.rgba(L.far ? col.bodyDark : col.body, 1);
      U.path(ctx, limbPoints(x, y, ang, p.legLen, p.legW, L.far)); ctx.fill();
      // foot
      const fx = x + Math.cos(ang) * p.legLen, fy = y + Math.sin(ang) * p.legLen;
      const foot = U.blob(fx + Math.cos(ang) * p.legW * 0.5, fy + Math.sin(ang) * p.legW * 0.5,
        p.legW * 1.9, p.legW * 0.95, 0.45, 16);
      U.path(ctx, foot); ctx.fill();
    };
    legDefs.filter((l) => l.far).forEach(drawLeg);

    // ---------------------------------------------------------- far arm
    const armPos = [];
    const drawArm = (idx, presence, ang, far) => {
      if (presence <= 0.01) return null;
      const side = idx === 0 ? 1 : -1;
      const ax = fwd[0] * p.armS + side * p.armSpread * (far ? 0.85 : 1);
      const ay = fwd[1] * p.armS + p.armDrop + (far ? -p.armW * 0.3 : 0) + bob;
      const swing = gait * 0.3 * (far ? -1 : 1);
      const a = ang + swing;
      ctx.fillStyle = U.rgba(far ? col.bodyDark : col.bodyLight, 1);
      U.path(ctx, limbPoints(ax, ay, a, p.armLen, p.armW, far)); ctx.fill();
      const hx2 = ax + Math.cos(a) * p.armLen, hy2 = ay + Math.sin(a) * p.armLen;
      ctx.fillStyle = U.rgba(far ? col.bodyDark : col.bodyLight, 1);
      U.path(ctx, U.blob(hx2, hy2, p.armW * 1.5, p.armW * 1.5, 0.75, 18)); ctx.fill();
      return [hx2, hy2];
    };
    armPos[1] = drawArm(1, p.armP1, p.armA1, true);

    // ---------------------------------------------------------- torso
    ctx.save();
    ctx.translate(0, bob);
    const tp = torsoPath(p);
    ctx.fillStyle = U.rgba(col.body, 1);
    U.path(ctx, tp); ctx.fill();

    // belly / back shading
    ctx.save();
    U.path(ctx, tp); ctx.clip();
    ctx.fillStyle = U.rgba(col.bodyDark, 0.17);
    ctx.save();
    ctx.rotate(p.spine);
    ctx.beginPath();
    ctx.ellipse(0, p.torsoH * 0.62, p.torsoLen * 0.52, p.torsoH * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();

    // ---------------------------------------------------------- fins & plates
    const backDir = [-perp[0], -perp[1]];
    const up = [0, -1];

    if (p.dorsal > 0.02) {
      const bx = -p.torsoLen * 0.06, by = 0;
      const h = p.dorsal * 0.55, w = p.torsoLen * 0.3;
      ctx.fillStyle = U.rgba(col.body, 1);
      U.path(ctx, [
        [bx - w / 2, by + backDir[1] * p.torsoH * 0.42],
        [bx + w * 0.12, by + backDir[1] * (p.torsoH * 0.42 + h)],
        [bx + w / 2, by + backDir[1] * p.torsoH * 0.42],
      ]);
      ctx.fill();
    }
    if (p.ventral > 0.02) {
      const bx = p.torsoLen * 0.12, by = 0;
      const h = p.ventral * 0.36, w = p.torsoLen * 0.22;
      ctx.fillStyle = U.rgba(col.body, 1);
      U.path(ctx, [
        [bx - w / 2, by + perp[1] * p.torsoH * 0.46],
        [bx, by + perp[1] * (p.torsoH * 0.46 + h)],
        [bx + w / 2, by + perp[1] * p.torsoH * 0.46],
      ]);
      ctx.fill();
    }
    if (p.sideFin > 0.02) {
      const bx = p.torsoLen * 0.28, by = 0;
      const r = p.sideFin * 0.3;
      ctx.fillStyle = U.rgba(col.bodyDark, 0.92);
      U.path(ctx, [
        [bx + fwd[0] * r * 0.8, by + fwd[1] * r * 0.8 + perp[1] * p.torsoH * 0.22],
        [bx - fwd[0] * r * 0.5 + perp[0] * r * 0.2, by - fwd[1] * r * 0.5 + perp[1] * p.torsoH * 0.22 + r * 1.1],
        [bx - fwd[0] * r * 0.9, by - fwd[1] * r * 0.9 + perp[1] * p.torsoH * 0.3],
        [bx + fwd[0] * r * 0.2 + perp[0] * r * 0.2, by + fwd[1] * r * 0.2 + perp[1] * p.torsoH * 0.3 + r * 0.5],
      ]);
      ctx.fill();
    }
    if (p.spikes > 0.02) {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const sx = U.lerp(-p.torsoLen * 0.46, p.torsoLen * 0.34, t);
        const h = p.spikes * (0.26 + 0.4 * Math.sin(t * Math.PI));
        const w = p.torsoLen * 0.08;
        ctx.fillStyle = U.rgba(col.body, 1);
        U.path(ctx, [
          [sx - w / 2, backDir[1] * p.torsoH * 0.38],
          [sx + w * 0.1, backDir[1] * (p.torsoH * 0.38 + h)],
          [sx + w / 2, backDir[1] * p.torsoH * 0.38],
        ]);
        ctx.fill();
      }
    }

    ctx.restore();   // end of the torso group

    // ---------------------------------------------------------- near legs
    legDefs.filter((l) => !l.far).forEach(drawLeg);

    // ---------------------------------------------------------- near arm
    armPos[0] = drawArm(0, p.armP0, p.armA0, false);

    // ---------------------------------------------------------- head
    ctx.save();
    ctx.translate(0, bob);
    const hx = fwd[0] * p.headOff, hy = fwd[1] * p.headOff + p.headY;
    const headPts = U.blob(hx, hy, p.headLen, p.headH, U.lerp(0.34, 1, p.headRound), 32);

    // ears behind the head
    if (p.earSize > 0.02) {
      // square mascot ear
      if (p.earRound < 0.99) {
        ctx.globalAlpha = 1 - p.earRound;
        const ew = p.earSize * 0.85, eh = p.earSize * 0.62;
        const ex = hx + fwd[0] * p.headLen * 0.06, ey = hy + fwd[1] * p.headLen * 0.06 - p.headH * 0.34;
        ctx.fillStyle = U.rgba(col.body, 1);
        U.path(ctx, [
          [ex - ew / 2, ey], [ex - ew / 2 + ew * 0.18, ey - eh],
          [ex + ew / 2, ey - eh], [ex + ew / 2, ey],
        ]);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // round ears
      if (p.earRound > 0.01) {
        ctx.globalAlpha = p.earRound;
        ctx.fillStyle = U.rgba(col.body, 1);
        for (const side of [-1, 1]) {
          const rx = hx + fwd[0] * p.headLen * 0.12 + side * p.headH * 0.44;
          const ry = hy + fwd[1] * p.headLen * 0.12 - p.headH * 0.3;
          U.path(ctx, U.blob(rx, ry, p.earSize, p.earSize, 1, 22)); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    ctx.fillStyle = U.rgba(col.body, 1);
    U.path(ctx, headPts); ctx.fill();

    // snout
    if (p.snout > 0.02 && p.snoutLen > 0.01) {
      ctx.globalAlpha = p.snout;
      const baseX = hx + fwd[0] * p.headLen * 0.34, baseY = hy + fwd[1] * p.headLen * 0.34 + p.headH * 0.1;
      const sn = U.blob(baseX + fwd[0] * p.snoutLen * 0.55, baseY + fwd[1] * p.snoutLen * 0.55,
        p.snoutLen * 1.25, p.headH * 0.62, 0.55, 22);
      ctx.fillStyle = U.rgba(col.body, 1);
      U.path(ctx, sn); ctx.fill();
      if (p.nose > 0.02) {
        ctx.globalAlpha = p.snout * p.nose;
        ctx.fillStyle = U.rgba(col.ink, 1);
        const nx2 = baseX + fwd[0] * p.snoutLen * 1.05, ny2 = baseY + fwd[1] * p.snoutLen * 1.05;
        U.path(ctx, U.blob(nx2, ny2, p.headH * 0.16, p.headH * 0.14, 0.9, 14)); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // muzzle patch
    if (p.muzzle > 0.02) {
      ctx.globalAlpha = p.muzzle;
      ctx.fillStyle = U.rgba(col.cream, 0.95);
      const mx = hx + fwd[0] * p.headLen * 0.3, my = hy + fwd[1] * p.headLen * 0.3 + p.headH * 0.16;
      U.path(ctx, U.blob(mx, my, p.headLen * 0.62, p.headH * 0.5, 1, 24)); ctx.fill();
      ctx.globalAlpha = 1;
    }

    // hair
    if (p.hair > 0.02) {
      ctx.globalAlpha = p.hair;
      ctx.fillStyle = U.rgba(col.ink, 1);
      U.path(ctx, U.blob(hx, hy - p.headH * 0.36, p.headLen * 0.94, p.headH * 0.52, 0.5, 26));
      ctx.fill();
      // a little tuft at the front
      U.path(ctx, U.blob(hx + p.headLen * 0.36, hy - p.headH * 0.44, p.headLen * 0.3, p.headH * 0.24, 0.6, 16));
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ---------------------------------------------------------- face
    const eyeBaseX = hx + fwd[0] * p.eyeFwd, eyeBaseY = hy + fwd[1] * p.eyeFwd - p.headH * p.eyeUp;
    const gap = p.eyeGap / 2;
    ctx.strokeStyle = U.rgba(col.ink, 1);
    ctx.lineCap = 'round';
    ctx.lineWidth = p.eyeSize * 0.85;
    for (const side of [-1, 1]) {
      const ex = eyeBaseX + side * gap, ey = eyeBaseY;
      ctx.beginPath();
      ctx.arc(ex, ey, p.eyeSize, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    // mouth
    ctx.lineWidth = p.eyeSize * 0.6;
    ctx.beginPath();
    const mx = eyeBaseX + p.mouth * 0.04, my = eyeBaseY + p.eyeSize * 1.55;
    ctx.arc(mx, my, p.eyeSize * 0.85, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    ctx.restore(); // head group

    // ---------------------------------------------------------- flag
    const bodyFlagBase = [fwd[0] * p.torsoLen * p.flagS, fwd[1] * p.torsoLen * p.flagS - p.flagRise];
    const armFlagBase = armPos[1] || bodyFlagBase;
    const fx = U.lerp(bodyFlagBase[0], armFlagBase[0], p.armP1);
    const fy = U.lerp(bodyFlagBase[1], armFlagBase[1], p.armP1);
    M.drawFlag(ctx, fx, fy, p.flagLen, p.flagScale, time, p.flip);

    ctx.restore();
  };

  /* The flag: a black pole with a checkered banner that ripples.
   * The banner always trails toward -x in local space, which is behind the
   * creature whichever way it is facing. */
  M.drawFlag = function (ctx, x, y, len, scale, time) {
    const col = M.COL;
    const w = 0.05 * scale;
    // pole
    ctx.fillStyle = U.rgba(col.flagBlack, 1);
    ctx.fillRect(x - w / 2, y - len, w, len);
    // banner
    const bw = 0.52 * scale, bh = 0.36 * scale;
    const cols = 5, rows = 4;
    const cw = bw / cols, ch = bh / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ripple = Math.sin(time * 5.2 + c * 0.9 + r * 0.25) * 0.035 * scale * (c / cols);
        const px0 = x - w / 2 - (c + 1) * cw + ripple;
        const py0 = y - len + r * ch;
        ctx.fillStyle = ((r + c) % 2 === 0) ? U.rgba(col.flagBlack, 1) : U.rgba(col.flagWhite, 1);
        ctx.fillRect(px0, py0, cw + cw * 0.06, ch + ch * 0.06);
      }
    }
  };

  /* Screen-space chunk dissolve used for the extinction event. */
  M.DISSOLVE_CELLS = 26;
  M.dissolveGrid = function (seed, w, h) {
    const rnd = U.rng(seed);
    const n = M.DISSOLVE_CELLS;
    const g = [];
    for (let i = 0; i < n * n; i++) g.push(rnd());
    return { g, n, w, h };
  };
  M.clipDissolve = function (ctx, grid, amount) {
    ctx.beginPath();
    const cw = grid.w / grid.n, chh = grid.h / grid.n;
    for (let i = 0; i < grid.n; i++) {
      for (let j = 0; j < grid.n; j++) {
        if (grid.g[i * grid.n + j] < amount) {
          ctx.rect(i * cw, j * chh, cw + 1, chh + 1);
        }
      }
    }
    ctx.clip();
  };

  g.M = M;

  return g;
})(typeof window !== 'undefined' ? window : globalThis);
