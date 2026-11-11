/* player.js — playback, subtitles and the frame loop.
 * The narration track is the clock: the canvas reads audio.currentTime. */
(function () {
  const TL = window.TIMELINE;
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const audio = document.getElementById('narration');
  const overlay = document.getElementById('overlay');
  const playBtn = document.getElementById('play');
  const subsEl = document.getElementById('subs');
  const bar = document.getElementById('bar');
  const fill = document.getElementById('fill');
  const endcard = document.getElementById('endcard');
  const replayBtn = document.getElementById('replay');

  const story = window.STORY.build(TL);
  const sfx = new window.SFX();

  const state = {
    playing: false,
    t: 0,
    lastT: 0,
    fired: 0,
    ended: false,
    frozen: false,
  };

  const params = new URLSearchParams(location.search);
  let previewT = params.has('t') ? parseFloat(params.get('t')) : null;

  // ---------------------------------------------------------------- burst mark
  function burstSVG(size) {
    const rays = [];
    const n = 13;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const len = size * (0.3 + 0.1 * Math.abs(Math.sin(i * 2.3)));
      const w = size * 0.032;
      const x1 = size / 2 + Math.cos(a) * size * 0.17;
      const y1 = size / 2 + Math.sin(a) * size * 0.17;
      const x2 = size / 2 + Math.cos(a) * (size * 0.17 + len);
      const y2 = size / 2 + Math.sin(a) * (size * 0.17 + len);
      const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
      rays.push(`<path d="M${x1 + nx} ${y1 + ny} L${x2} ${y2} L${x1 - nx} ${y1 - ny} Z"/>`);
    }
    const c = size / 2, r = size * 0.19;
    const tri = `M${c - r * 0.55} ${c - r} L${c + r * 0.85} ${c} L${c - r * 0.55} ${c + r} Z`;
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">` +
      `<g fill="#D97757">${rays.join('')}</g>` +
      `<circle cx="${c}" cy="${c}" r="${r * 1.5}" fill="#1A1210"/>` +
      `<path d="${tri}" fill="#FDFAF3"/></svg>`;
  }
  playBtn.insertAdjacentHTML('afterbegin', burstSVG(64));

  // ---------------------------------------------------------------- drawing
  function drawCreature(ctx, p, t, dissolveInfo) {
    const motion = p.__motion || 'idle';
    const walkPhase = t * (motion === 'walk' ? 5.2 : motion === 'swim' ? 3.4 : 0);
    if (dissolveInfo) {
      const { from, to, u, grid } = dissolveInfo;
      ctx.save();
      M.clipDissolve(ctx, grid, 1 - u);
      M.drawMascot(ctx, from, t, { motion: 'walk', walkPhase });
      ctx.restore();
      ctx.save();
      M.clipDissolve(ctx, grid, u);
      M.drawMascot(ctx, to, t, { motion: 'walk', walkPhase });
      ctx.restore();
    } else {
      M.drawMascot(ctx, p, t, { motion, walkPhase });
    }
  }

  function headPos(p) {
    const s = p.scale;
    return [
      p.px + Math.cos(p.spine) * p.headOff * s * p.flip,
      p.py + Math.sin(p.spine) * p.headOff * s,
    ];
  }

  function bubble(ctx, x, y, text, alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '700 30px "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
    const w = ctx.measureText(text).width + 46;
    const h = 62;
    const bx = x - w / 2, by = y - h - 42;
    ctx.fillStyle = '#FBF7F0';
    ctx.strokeStyle = '#1A1210';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const r = 16;
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + w - r, by);
    ctx.quadraticCurveTo(bx + w, by, bx + w, by + r);
    ctx.lineTo(bx + w, by + h - r);
    ctx.quadraticCurveTo(bx + w, by + h, bx + w - r, by + h);
    ctx.lineTo(bx + w * 0.56, by + h);
    ctx.lineTo(bx + w * 0.44, by + h + 26);
    ctx.lineTo(bx + w * 0.36, by + h);
    ctx.lineTo(bx + r, by + h);
    ctx.quadraticCurveTo(bx, by + h, bx, by + h - r);
    ctx.lineTo(bx, by + r);
    ctx.quadraticCurveTo(bx, by, bx + r, by);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1A1210';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, by + h / 2 + 2);
    ctx.restore();
  }

  function questionMark(ctx, x, y, alpha, t) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y + Math.sin(t * 4) * 5);
    ctx.rotate(Math.sin(t * 2.2) * 0.12);
    ctx.font = '800 78px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#1A1210';
    ctx.strokeText('?', 0, 0);
    ctx.fillStyle = '#F6EFE4';
    ctx.fillText('?', 0, 0);
    ctx.restore();
  }

  function shakeAt(t) {
    const I = story.IMPACT;
    let s = 0;
    if (t > story.MATE_IN - 6 && t < I) {
      s = Math.max(s, Math.min(0.9, (t - (I - 6)) / 6) * 0.5);
    }
    if (t >= I && t < I + 2.2) {
      s = Math.max(s, 1.6 * Math.pow(1 - (t - I) / 2.2, 2));
    }
    if (t > story.CRAP - 0.2 && t < story.CRAP + 0.4) s = Math.max(s, 0.25);
    return s;
  }

  function draw(t) {
    const env = story.envAt(t);
    const cam = story.cameraAt(t);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, 1920, 1080);

    const sh = shakeAt(t);
    const sx = sh ? (Math.random() - 0.5) * sh * 26 : 0;
    const sy = sh ? (Math.random() - 0.5) * sh * 26 : 0;

    ctx.save();
    ctx.translate(960 + cam.x + sx, 540 + cam.y + sy);
    ctx.scale(cam.z, cam.z);
    ctx.translate(-960, -540);

    W.drawSky(ctx, env, t);
    W.drawHills(ctx, env, t);
    const ast = story.asteroidAt(t);
    if (ast) W.drawAsteroid(ctx, ast);
    W.drawFoliage(ctx, env, t);
    W.drawGround(ctx, env, t);

    // holes in the ground
    const L = TL.lines;
    const holeA = U.clamp01((t - (story.IMPACT + 0.9)) / 0.45) * U.clamp01((53.5 - t) / 1.4);
    if (holeA > 0.01) {
      ctx.save(); ctx.globalAlpha = holeA;
      W.drawHole(ctx, 930, 780, 58, t);
      ctx.restore();
    }
    const holeB = U.clamp01((t - L[15].start) / 0.4) * U.clamp01((L[18].start + 1.3 - t) / 0.7);
    if (holeB > 0.01) {
      ctx.save(); ctx.globalAlpha = holeB;
      W.drawHole(ctx, 1158, 780, 54, t);
      ctx.restore();
    }

    // the creature
    const segs = story.segmentsAt(t);
    let dis = null;
    for (const s of segs) {
      if (s.dissolve) {
        const u = U.clamp01((t - s.t0) / Math.max(1e-6, s.t1 - s.t0));
        const from = Object.assign({}, s.from); from.__motion = 'walk';
        const to = Object.assign({}, s.to); to.__motion = 'walk';
        dis = { from, to, u, grid: story.dissolveGrid };
      }
    }
    const p = story.creatureAt(t);
    drawCreature(ctx, p, t, dis);

    // the mate
    const mate = story.mateAt(t);
    if (mate) {
      M.drawMascot(ctx, mate, t, { motion: mate.__motion || 'walk', walkPhase: t * 5.2 });
    }

    W.drawWater(ctx, env, t);
    W.drawBubbles(ctx, env, t);
    W.drawAsh(ctx, env, t);

    const imp = story.impactAt(t);
    if (imp) W.drawImpact(ctx, imp);

    // speech bubbles + reaction
    for (const b of story.bubbles) {
      const line = TL.lines[b.i];
      const a = U.clamp01((t - (line.start - 0.12)) / 0.14) * U.clamp01((line.end + 0.12 - t) / 0.14);
      if (a > 0.01) bubble(ctx, b.x, b.y, b.text, a);
    }
    const l16 = TL.lines[16];
    const qa = U.clamp01((t - (l16.start - 0.2)) / 0.3) * U.clamp01((l16.end + 0.3 - t) / 0.3);
    if (qa > 0.01) {
      const hp = headPos(p);
      questionMark(ctx, hp[0] + 70, hp[1] - 90, qa, t);
    }

    ctx.restore();

    updateOverlays(t);
  }

  // ---------------------------------------------------------------- overlays
  function updateOverlays(t) {
    // subtitles
    let active = null;
    for (const l of TL.lines) {
      if (t >= l.start - 0.08 && t <= l.end + 0.12) { active = l; break; }
    }
    if (active) {
      const who = active.speaker === 'claude' ? 'CLAUDE' : 'NARRATOR';
      subsEl.innerHTML = `<span class="who ${active.speaker}">${who}</span> ${active.text}`;
      subsEl.classList.add('on');
    } else {
      subsEl.classList.remove('on');
    }
    // progress
    fill.style.width = (U.clamp01(t / TL.duration) * 100) + '%';
    // title card
    const titleA = U.clamp01((t - story.titleIn) / 0.4) * U.clamp01((story.titleOut - t) / 0.4);
    document.getElementById('titlecard').style.opacity = titleA;
    // end card
    const endA = U.clamp01((t - story.endCardIn) / 0.6);
    endcard.style.opacity = endA;
    endcard.style.pointerEvents = endA > 0.6 ? 'auto' : 'none';
  }

  // ---------------------------------------------------------------- loop
  function loop() {
    requestAnimationFrame(loop);
    if (state.frozen) return;
    if (state.playing) {
      state.t = audio.currentTime;
      if (state.t >= TL.duration - 0.05 && !state.ended) {
        state.ended = true;
        endcard.style.opacity = 1;
        endcard.style.pointerEvents = 'auto';
      }
    } else if (previewT !== null) {
      state.t = previewT;
    }
    // sound cues
    for (let i = 0; i < story.cues.length; i++) {
      const c = story.cues[i];
      if (state.t >= c.t && state.lastT < c.t) {
        try { c.fn(sfx); } catch (e) { /* audio may not be ready */ }
      }
    }
    // music mood
    if (state.playing) {
      const mood = state.t < story.IMPACT ? 'calm' : (state.t > L_end() ? 'warm' : 'dark');
      sfx.tickMusic(mood);
      sfx.setUnderwater(state.t < 20);
    }
    state.lastT = state.t;
    draw(state.t);
  }

  function L_end() { return TL.lines[12].start; }

  // ---------------------------------------------------------------- controls
  function start() {
    sfx.init();
    sfx.resume();
    sfx.startMusic();
    sfx.setMusicLevel(0.5);
    overlay.classList.add('gone');
    state.playing = true;
    state.lastT = audio.currentTime;
    audio.play().catch(() => { /* autoplay blocked: the canvas still animates */ });
  }

  playBtn.addEventListener('click', start);
  replayBtn.addEventListener('click', () => {
    audio.currentTime = 0;
    state.t = 0; state.lastT = 0; state.ended = false;
    state.playing = true;
    endcard.style.opacity = 0;
    endcard.style.pointerEvents = 'none';
    audio.play();
  });
  audio.addEventListener('ended', () => {
    state.ended = true;
    endcard.style.opacity = 1;
    endcard.style.pointerEvents = 'auto';
  });
  bar.addEventListener('click', (e) => {
    const r = bar.getBoundingClientRect();
    const x = U.clamp01((e.clientX - r.left) / r.width);
    audio.currentTime = x * TL.duration;
    state.t = audio.currentTime;
    state.lastT = state.t;
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!state.playing) start();
      else if (audio.paused) audio.play();
      else audio.pause();
    }
  });

  // make sure the canvas matches the element size
  let DPR = 1;
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(1920 * DPR);
    canvas.height = Math.round(1080 * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // small public handle for debugging / embedding
  window.CLAUDE_FILM = {
    sfx, story, timeline: TL, state,
    renderAt: (t) => {
      state.frozen = true;
      state.t = t; state.lastT = t;
      draw(t);
    },
  };

  // preview mode without audio (used for screenshot checks)
  if (previewT !== null) {
    overlay.classList.add('gone');
    document.body.classList.add('preview');
  }

  loop();
})();
