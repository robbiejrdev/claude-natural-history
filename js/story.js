/* story.js — the score.
 *
 * Maps the narration timeline onto the creature, the world, the camera and the
 * sound. Every change of form is a morph that happens on screen while the line
 * that describes it is being spoken; the only dissolve in the film is the
 * extinction event, where the dino breaks apart and the rat assembles out of
 * the same pieces.
 */
(function (g) {
  const U = g.U;
  const M = g.M;
  const W = g.W;
  const STORY = {};

  // ---------------------------------------------------------------- environments
  const OCEAN = {
    waterY: -400, wet: 1,
    skyTop: U.hex('#0B3157'), skyBot: U.hex('#1B6FA3'),
    groundY: 880, groundCol: U.hex('#12405E'), hillCol: U.hex('#0C2E49'),
    foliage: 0, foliageCol: U.hex('#1B4A38'), wipe: 0,
    ash: 0, sunAmt: 0.12, sunX: 1460, sunY: 170, sunCol: U.hex('#BFE6FF'),
    warm: 0, starAmt: 0, haze: 0.4, grassCol: U.hex('#2E6B4F'),
  };
  const SHORE = {
    waterY: 1220, wet: 0.12,
    skyTop: U.hex('#2C6FA6'), skyBot: U.hex('#A8D6EC'),
    groundY: 790, groundCol: U.hex('#D9C398'), hillCol: U.hex('#6E9CB4'),
    foliage: 0.42, foliageCol: U.hex('#3E7A52'), wipe: 0,
    ash: 0, sunAmt: 0.7, sunX: 1500, sunY: 205, sunCol: U.hex('#FFE7B0'),
    warm: 0.15, starAmt: 0, haze: 0.22, grassCol: U.hex('#3E8C58'),
  };
  const JUNGLE = {
    waterY: 1400, wet: 0,
    skyTop: U.hex('#2E7FC0'), skyBot: U.hex('#BFE4F2'),
    groundY: 770, groundCol: U.hex('#4E8A46'), hillCol: U.hex('#3C7C5C'),
    foliage: 1, foliageCol: U.hex('#215C3C'), wipe: 0,
    ash: 0, sunAmt: 0.85, sunX: 1520, sunY: 185, sunCol: U.hex('#FFF0C4'),
    warm: 0.2, starAmt: 0, haze: 0.18, grassCol: U.hex('#2E7A45'),
  };
  const OMINOUS = {
    waterY: 1400, wet: 0,
    skyTop: U.hex('#243848'), skyBot: U.hex('#6E5A62'),
    groundY: 770, groundCol: U.hex('#456F45'), hillCol: U.hex('#356050'),
    foliage: 1, foliageCol: U.hex('#1E5236'), wipe: 0,
    ash: 0, sunAmt: 0.45, sunX: 1560, sunY: 240, sunCol: U.hex('#E8B278'),
    warm: 0.3, starAmt: 0, haze: 0.35, grassCol: U.hex('#2A6A40'),
  };
  const DOOM = {
    waterY: 1400, wet: 0,
    skyTop: U.hex('#6A5460'), skyBot: U.hex('#D0906A'),
    groundY: 770, groundCol: U.hex('#6E665C'), hillCol: U.hex('#5C5049'),
    foliage: 0, foliageCol: U.hex('#2A2A26'), wipe: 1,
    ash: 0.8, sunAmt: 0.5, sunX: 1560, sunY: 300, sunCol: U.hex('#F0A870'),
    warm: 0.45, starAmt: 0, haze: 0.5, grassCol: U.hex('#4A443C'),
  };
  const AFTER = {
    waterY: 1400, wet: 0,
    skyTop: U.hex('#6E7E8C'), skyBot: U.hex('#D6C7AC'),
    groundY: 770, groundCol: U.hex('#6B6E5E'), hillCol: U.hex('#546056'),
    foliage: 0.5, foliageCol: U.hex('#33604A'), wipe: 0,
    ash: 0.42, sunAmt: 0.5, sunX: 1540, sunY: 255, sunCol: U.hex('#E8C08A'),
    warm: 0.35, starAmt: 0, haze: 0.42, grassCol: U.hex('#456B48'),
  };
  const GOLDEN = {
    waterY: 1400, wet: 0,
    skyTop: U.hex('#E09256'), skyBot: U.hex('#F8DCA8'),
    groundY: 770, groundCol: U.hex('#6E8A4A'), hillCol: U.hex('#7E7A4E'),
    foliage: 0.95, foliageCol: U.hex('#3B6B42'), wipe: 0,
    ash: 0.16, sunAmt: 0.95, sunX: 1460, sunY: 440, sunCol: U.hex('#FFD98A'),
    warm: 0.8, starAmt: 0, haze: 0.3, grassCol: U.hex('#4C7C3E'),
  };

  // ---------------------------------------------------------------- the score
  STORY.build = function (TL) {
    const L = TL.lines;
    const at = (i) => L[i].start;
    const dur = (i) => L[i].dur;
    const end = (i) => L[i].start + L[i].dur;
    const D = M.STAGE;

    const IMPACT = at(7) + dur(7) * 0.92;     // the ARGH lands here
    const CLAP = at(13) + dur(13) * 0.72;     // the high-five lands here

    // --- creature track: morphs, holds, and the one dissolve ---
    const track = [
      { t0: 0, t1: at(2), params: D.TADPOLE, motion: 'swim' },
      { t0: at(2), t1: at(2) + dur(2) * 0.66, from: D.TADPOLE, to: D.FISH, motion: 'swim' },
      { t0: at(2) + dur(2) * 0.66, t1: at(3) + dur(3) * 0.42, params: D.FISH, motion: 'swim' },
      { t0: at(3) + dur(3) * 0.42, t1: end(3), from: D.FISH, to: D.LIZARD, motion: 'walk' },
      { t0: end(3), t1: at(4), params: D.LIZARD, motion: 'walk' },
      { t0: at(4), t1: at(4) + dur(4) * 0.94, from: D.LIZARD, to: D.DINO, motion: 'walk' },
      { t0: at(4) + dur(4) * 0.94, t1: IMPACT, params: D.DINO, motion: 'walk' },
      { t0: IMPACT, t1: IMPACT + 1.7, from: D.DINO, to: D.RAT, dissolve: true },
      { t0: IMPACT + 1.7, t1: at(11), params: D.RAT, motion: 'walk' },
      { t0: at(11), t1: at(11) + dur(11) * 0.72, from: D.RAT, to: D.MONKEY, motion: 'walk' },
      { t0: at(11) + dur(11) * 0.72, t1: at(12), params: D.MONKEY, motion: 'walk' },
      { t0: at(12), t1: at(12) + dur(12) * 0.93, from: D.MONKEY, to: D.HUMAN, motion: 'walk' },
      { t0: at(12) + dur(12) * 0.93, t1: TL.duration, params: D.HUMAN, motion: 'stand' },
    ];

    // --- environment keyframes ---
    const envKeys = [
      { t: 0, e: OCEAN },
      { t: at(3), e: OCEAN },
      { t: at(3) + dur(3) * 0.45, e: SHORE },
      { t: at(4), e: SHORE },
      { t: at(4) + dur(4) * 0.9, e: JUNGLE },
      { t: at(6) + dur(6) * 0.5, e: OMINOUS },
      { t: IMPACT, e: OMINOUS },
      { t: IMPACT + 1.1, e: DOOM },
      { t: at(9), e: DOOM },
      { t: at(10), e: DOOM },
      { t: at(11), e: AFTER },
      { t: at(12) + dur(12) * 0.8, e: GOLDEN },
      { t: TL.duration, e: GOLDEN },
    ];

    // --- camera ---
    const camKeys = [
      { t: 0, z: 1.0, x: 0, y: 0 },
      { t: at(1), z: 1.24, x: -30, y: -20 },
      { t: at(2), z: 1.0, x: 0, y: 0 },
      { t: at(4), z: 0.96, x: 0, y: 10 },
      { t: at(4) + dur(4) * 0.95, z: 0.8, x: 20, y: 40 },
      { t: at(6), z: 0.84, x: 30, y: 30 },
      { t: IMPACT - 0.4, z: 0.9, x: 0, y: 20 },
      { t: IMPACT, z: 1.0, x: 0, y: 10 },
      { t: IMPACT + 0.18, z: 1.26, x: 0, y: 0 },
      { t: IMPACT + 1.4, z: 1.0, x: 0, y: 10 },
      { t: at(11), z: 1.06, x: 0, y: 0 },
      { t: at(12) + dur(12) * 0.9, z: 1.0, x: 0, y: 0 },
      { t: CLAP - 0.5, z: 1.1, x: 0, y: -10 },
      { t: CLAP + 0.4, z: 1.04, x: 0, y: 0 },
      { t: at(18), z: 0.84, x: 0, y: 30 },
      { t: TL.duration, z: 0.8, x: 0, y: 40 },
    ];

    // --- field tracks: small animated bits on top of the base params ---
    const fieldTracks = [
      // Claude raises the high-five arm
      { field: 'armA0', from: at(12), to: TL.duration, keys: [
        { t: at(12), v: Math.PI * 0.62 },
        { t: CLAP - 1.5, v: Math.PI * 0.62 },
        { t: CLAP - 0.55, v: -0.36 },
        { t: CLAP - 0.12, v: -0.42 },
        { t: CLAP + 0.25, v: -0.38 },
        { t: TL.duration, v: -0.5 },
      ] },
      // the flag arm stays up
      { field: 'armA1', from: at(12), to: TL.duration, keys: [
        { t: at(12), v: Math.PI * 0.88 },
        { t: at(12) + dur(12) * 0.9, v: Math.PI * 1.18 },
        { t: TL.duration, v: Math.PI * 1.18 },
      ] },
      // Claude leans over, baffled, when the rat speaks
      { field: 'tilt', from: at(15), to: TL.duration, keys: [
        { t: at(15), v: 0 },
        { t: at(16), v: 0.16 },
        { t: at(17), v: 0.16 },
        { t: at(18), v: 0.02 },
        { t: TL.duration, v: 0 },
      ] },
    ];

    function evalField(ft, t) {
      const ks = ft.keys;
      if (!ks.length) return null;
      if (t <= ks[0].t) return ks[0].v;
      for (let i = 0; i < ks.length - 1; i++) {
        if (t >= ks[i].t && t <= ks[i + 1].t) {
          const u = U.smooth((t - ks[i].t) / Math.max(1e-6, ks[i + 1].t - ks[i].t));
          return U.lerp(ks[i].v, ks[i + 1].v, u);
        }
      }
      return ks[ks.length - 1].v;
    }

    function applyFields(p, t) {
      for (const ft of fieldTracks) {
        if (t < ft.from || t > ft.to) continue;
        const v = evalField(ft, t);
        if (v !== null && v !== undefined) p[ft.field] = v;
      }
      return p;
    }

    // --- environment evaluation ---
    function envAt(t) {
      let i = 0;
      while (i < envKeys.length - 1 && t > envKeys[i + 1].t) i++;
      const a = envKeys[i], b = envKeys[Math.min(i + 1, envKeys.length - 1)];
      if (a === b) return Object.assign({}, a.e);
      const u = U.smooth((t - a.t) / Math.max(1e-6, b.t - a.t));
      return W.lerpEnv(a.e, b.e, u);
    }

    function cameraAt(t) {
      let i = 0;
      while (i < camKeys.length - 1 && t > camKeys[i + 1].t) i++;
      const a = camKeys[i], b = camKeys[Math.min(i + 1, camKeys.length - 1)];
      if (a === b) return { z: a.z, x: a.x, y: a.y };
      const u = U.smooth((t - a.t) / Math.max(1e-6, b.t - a.t));
      return { z: U.lerp(a.z, b.z, u), x: U.lerp(a.x, b.x, u), y: U.lerp(a.y, b.y, u) };
    }

    // --- creature evaluation ---
    const dissolveGrid = M.dissolveGrid(1337, 1920, 1080);

    function creatureAt(t) {
      let seg = track[track.length - 1];
      for (const s of track) { if (t >= s.t0) seg = s; else break; }
      let p, motion = seg.motion || 'idle';
      if (seg.params) {
        p = Object.assign({}, seg.params);
      } else {
        const u = U.smooth((t - seg.t0) / Math.max(1e-6, seg.t1 - seg.t0));
        p = M.lerpParams(seg.from, seg.to, u);
      }
      applyFields(p, t);
      // a slow swim/stride bob, phase-locked to the animation
      p.__motion = motion;
      return p;
    }

    function segmentsAt(t) {
      const out = [];
      for (const s of track) {
        if (t >= s.t0 && t <= s.t1) out.push(s);
      }
      return out;
    }

    // --- the mate: arrives as a monkey, becomes a human, becomes a rat again ---
    const MATE_IN = at(12) + dur(12) * 0.2;
    const MATE_ARRIVE = CLAP - 1.0;

    function mateAt(t) {
      if (t < MATE_IN) return null;
      let p;
      if (t < at(12) + dur(12) * 0.9) {
        const u = U.smooth((t - MATE_IN) / Math.max(1e-6, (at(12) + dur(12) * 0.9) - MATE_IN));
        p = M.lerpParams(D.MONKEY, D.HUMAN, u);
        p.px = U.lerp(1580, 1420, u);
        p.py = U.lerp(640, 525, u);
        p.scale = U.lerp(170, 235, u);
        p.armA1 = U.lerp(-0.85, Math.PI * 1.18, u);
      } else if (t < at(14)) {
        p = Object.assign({}, D.HUMAN);
        const u = U.smooth((t - (at(12) + dur(12) * 0.9)) / Math.max(1e-6, MATE_ARRIVE - (at(12) + dur(12) * 0.9)));
        p.px = U.lerp(1440, 1158, u);
        p.py = 525;
        p.scale = 250;
        p.armA0 = U.lerp(Math.PI * 0.62, -0.36, u);
        p.armA1 = Math.PI * 1.18;
      } else if (t < at(14) + dur(14) * 0.92) {
        p = Object.assign({}, D.HUMAN);
        const u = U.smooth((t - MATE_ARRIVE) / Math.max(1e-6, CLAP - MATE_ARRIVE));
        p.px = 1158; p.py = 525; p.scale = 250;
        p.armA0 = U.lerp(Math.PI * 0.62, -0.42, u);
        p.armA1 = Math.PI * 1.18;
      } else if (t < at(15)) {
        p = Object.assign({}, D.HUMAN);
        p.px = 1158; p.py = 525; p.scale = 250;
        p.armA0 = -0.42; p.armA1 = Math.PI * 1.18;
      } else if (t < at(15) + dur(15) * 0.85) {
        const u = U.smooth((t - at(15)) / Math.max(1e-6, dur(15) * 0.85));
        p = M.lerpParams(Object.assign({}, D.HUMAN, { armA0: -0.42 }), D.RAT, u);
        p.px = 1158; p.py = 674; p.scale = 200;
      } else {
        p = Object.assign({}, D.RAT);
        p.px = 1158; p.py = 674; p.scale = 200;
        // scurries into the hole
        if (t > at(17)) {
          const u = U.smooth((t - at(17)) / Math.max(1e-6, dur(17) * 0.8));
          p.py = 674 + u * 120;
        }
      }
      p.flip = -1;
      return p;
    }

    // --- effects ---
    function asteroidAt(t) {
      if (t < at(6) + dur(6) * 0.55 || t > IMPACT + 0.05) return null;
      const t0 = at(6) + dur(6) * 0.55;
      const u = U.clamp01((t - t0) / (IMPACT - t0));
      const ease = u * u * (0.25 + 0.75 * u);
      const r = U.lerp(44, 250, ease);
      return {
        x: U.lerp(2180, 1010, ease),
        y: U.lerp(-260, 540, ease),
        r,
        ang: Math.atan2(540 - (-260), 1010 - 2180),
        rot: t * 1.1,
        fade: 1,
      };
    }

    function impactAt(t) {
      if (t < IMPACT || t > IMPACT + 3.2) return null;
      return { t: (t - IMPACT) / 3.2, x: 1010, y: 540, seed: 4242 };
    }

    // --- sound cues ---
    const cues = [
      { t: at(2), fn: (s) => s.whoosh(1) },
      { t: at(3) + dur(3) * 0.42, fn: (s) => s.whoosh(1) },
      { t: at(4), fn: (s) => { s.whoosh(1.3); s.roar(); } },
      { t: at(6) + dur(6) * 0.55, fn: (s) => s.rumble(IMPACT - (at(6) + dur(6) * 0.55)) },
      { t: IMPACT, fn: (s) => { s.boom(); s.roar(); } },
      { t: at(9) + dur(9) * 0.55, fn: (s) => s.pop() },
      { t: at(10) - 0.05, fn: (s) => s.squeak() },
      { t: at(11), fn: (s) => s.whoosh(1) },
      { t: at(12), fn: (s) => s.whoosh(1) },
      { t: CLAP - 0.5, fn: (s) => s.step(false) },
      { t: CLAP, fn: (s) => s.clap() },
      { t: at(15) - 0.06, fn: (s) => s.squeak() },
      { t: at(17), fn: (s) => s.pop() },
    ];

    // --- speech bubbles for the lines the character delivers ---
    const bubbles = [
      { i: 10, text: "Hi! Don't mind me.", x: 960, y: 596 },
      { i: 15, text: "I've been a rat this whole time.", x: 1158, y: 600 },
      { i: 17, text: 'Back in the hole, then.', x: 1158, y: 600 },
    ];

    // --- titles ---
    const titleIn = 0.15, titleOut = at(0) - 0.15;
    const endCardIn = at(18) + dur(18) * 0.6;

    return {
      IMPACT, CLAP: CLAP, CRAP: CLAP, MATE_IN, MATE_ARRIVE,
      creatureAt, mateAt, envAt, cameraAt, asteroidAt, impactAt,
      segmentsAt, dissolveGrid, cues, bubbles,
      titleIn, titleOut, endCardIn,
      duration: TL.duration,
    };
  };

  g.STORY = STORY;
})(typeof window !== 'undefined' ? window : globalThis);
