/* sfx.js — every sound in the film is synthesised here with Web Audio.
 * No sample files: oscillators, noise buffers and filters only. */
(function (g) {
  const U = g.U;

  function SFX() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noise = null;
    this.started = false;
    this.pad = null;
    this.padFilter = null;
    this.musicOn = true;
    this._nextNote = 0;
    this._step = 0;
  }

  SFX.prototype.init = function () {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.0;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.55;
    this.sfxGain.connect(this.master);

    // one second of white noise, reused everywhere
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
  };

  SFX.prototype.resume = function () {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  SFX.prototype._noiseSrc = function () {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    return s;
  };

  // ------------------------------------------------------------- ambience
  SFX.prototype.startMusic = function () {
    if (!this.ctx || this.started) return;
    this.started = true;
    const c = this.ctx;
    this.padFilter = c.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 520;
    this.padFilter.Q.value = 0.8;
    this.padFilter.connect(this.musicGain);
    this.pad = [];
    for (const det of [-6, 0, 7]) {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = 98;
      o.detune.value = det;
      const gg = c.createGain();
      gg.gain.value = 0.34;
      o.connect(gg); gg.connect(this.padFilter);
      o.start();
      this.pad.push(o);
    }
    // slow filter movement
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain); lfoGain.connect(this.padFilter.frequency);
    lfo.start();
    this._nextNote = c.currentTime + 0.2;
  };

  SFX.prototype.setMusicLevel = function (v, time) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setTargetAtTime(v, t, 0.4);
  };

  SFX.prototype.setUnderwater = function (on) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.padFilter.frequency.setTargetAtTime(on ? 340 : 900, t, 0.6);
  };

  // called every frame; schedules the generative music bed
  SFX.prototype.tickMusic = function (mood) {
    if (!this.ctx || !this.started) return;
    const c = this.ctx;
    const now = c.currentTime;
    if (now < this._nextNote) return;
    const scale = mood === 'dark' ? [98, 116.5, 146.8, 196, 233] : [130.8, 164.8, 196, 261.6, 329.6];
    // arpeggio
    const n = scale[this._step % scale.length];
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = n;
    const gg = c.createGain();
    gg.gain.setValueAtTime(0, now);
    gg.gain.linearRampToValueAtTime(mood === 'dark' ? 0.055 : 0.045, now + 0.03);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + 1.5);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2200;
    o.connect(gg); gg.connect(lp); lp.connect(this.musicGain);
    o.start(now); o.stop(now + 1.6);
    this._step++;

    // soft heartbeat kick
    if (this._step % 2 === 0) {
      const k = c.createOscillator();
      k.type = 'sine';
      k.frequency.setValueAtTime(72, now);
      k.frequency.exponentialRampToValueAtTime(38, now + 0.16);
      const kg = c.createGain();
      kg.gain.setValueAtTime(0.13, now);
      kg.gain.exponentialRampToValueAtTime(0.0005, now + 0.34);
      k.connect(kg); kg.connect(this.musicGain);
      k.start(now); k.stop(now + 0.36);
    }
    this._nextNote = now + (mood === 'dark' ? 0.62 : 0.48);
  };

  // ------------------------------------------------------------- one-shots
  SFX.prototype.whoosh = function (strength) {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const s = this._noiseSrc();
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, now);
    bp.frequency.exponentialRampToValueAtTime(2600, now + 0.5);
    const gg = c.createGain();
    gg.gain.setValueAtTime(0, now);
    gg.gain.linearRampToValueAtTime(0.16 * (strength || 1), now + 0.12);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + 0.7);
    s.connect(bp); bp.connect(gg); gg.connect(this.sfxGain);
    s.start(now); s.stop(now + 0.75);
  };

  SFX.prototype.step = function (big) {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    const f0 = big ? 110 : 150;
    o.frequency.setValueAtTime(f0, now);
    o.frequency.exponentialRampToValueAtTime(big ? 32 : 48, now + 0.22);
    const gg = c.createGain();
    gg.gain.setValueAtTime(big ? 0.5 : 0.22, now);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + (big ? 0.55 : 0.3));
    o.connect(gg); gg.connect(this.sfxGain);
    o.start(now); o.stop(now + 0.6);
    if (big) {
      const s = this._noiseSrc();
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 500;
      const ng = c.createGain();
      ng.gain.setValueAtTime(0.2, now);
      ng.gain.exponentialRampToValueAtTime(0.0005, now + 0.4);
      s.connect(lp); lp.connect(ng); ng.connect(this.sfxGain);
      s.start(now); s.stop(now + 0.45);
    }
  };

  SFX.prototype.roar = function () {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(150, now);
    o.frequency.exponentialRampToValueAtTime(58, now + 0.9);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, now);
    lp.frequency.exponentialRampToValueAtTime(320, now + 0.9);
    const gg = c.createGain();
    gg.gain.setValueAtTime(0, now);
    gg.gain.linearRampToValueAtTime(0.3, now + 0.08);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + 1.1);
    const s = this._noiseSrc();
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.12, now);
    ng.gain.exponentialRampToValueAtTime(0.0005, now + 0.8);
    o.connect(lp); lp.connect(gg); gg.connect(this.sfxGain);
    s.connect(ng); ng.connect(this.sfxGain);
    o.start(now); o.stop(now + 1.2);
    s.start(now); s.stop(now + 0.9);
  };

  SFX.prototype.rumble = function (dur) {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const s = this._noiseSrc();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(160, now);
    lp.frequency.exponentialRampToValueAtTime(900, now + dur * 0.8);
    lp.frequency.exponentialRampToValueAtTime(120, now + dur);
    const gg = c.createGain();
    gg.gain.setValueAtTime(0.0005, now);
    gg.gain.exponentialRampToValueAtTime(0.3, now + dur * 0.75);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    s.connect(lp); lp.connect(gg); gg.connect(this.sfxGain);
    s.start(now); s.stop(now + dur + 0.1);
  };

  SFX.prototype.boom = function () {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, now);
    o.frequency.exponentialRampToValueAtTime(24, now + 1.6);
    const gg = c.createGain();
    gg.gain.setValueAtTime(0.85, now);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + 1.8);
    o.connect(gg); gg.connect(this.sfxGain);
    o.start(now); o.stop(now + 1.9);
    const s = this._noiseSrc();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4200, now);
    lp.frequency.exponentialRampToValueAtTime(160, now + 1.2);
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.7, now);
    ng.gain.exponentialRampToValueAtTime(0.0005, now + 1.4);
    s.connect(lp); lp.connect(ng); ng.connect(this.sfxGain);
    s.start(now); s.stop(now + 1.5);
  };

  SFX.prototype.squeak = function () {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(900, now);
    o.frequency.exponentialRampToValueAtTime(1750, now + 0.09);
    o.frequency.exponentialRampToValueAtTime(700, now + 0.22);
    const gg = c.createGain();
    gg.gain.setValueAtTime(0.12, now);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + 0.25);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 2;
    o.connect(bp); bp.connect(gg); gg.connect(this.sfxGain);
    o.start(now); o.stop(now + 0.3);
  };

  SFX.prototype.clap = function () {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const s = this._noiseSrc();
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 0.9;
    const gg = c.createGain();
    gg.gain.setValueAtTime(0.55, now);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + 0.18);
    s.connect(bp); bp.connect(gg); gg.connect(this.sfxGain);
    s.start(now); s.stop(now + 0.2);
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(420, now);
    o.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    const og = c.createGain();
    og.gain.setValueAtTime(0.3, now);
    og.gain.exponentialRampToValueAtTime(0.0005, now + 0.16);
    o.connect(og); og.connect(this.sfxGain);
    o.start(now); o.stop(now + 0.2);
  };

  SFX.prototype.blip = function (freq, dur, vol) {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(freq || 700, now);
    o.frequency.exponentialRampToValueAtTime((freq || 700) * 0.45, now + (dur || 0.18));
    const gg = c.createGain();
    gg.gain.setValueAtTime(vol || 0.1, now);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + (dur || 0.18));
    o.connect(gg); gg.connect(this.sfxGain);
    o.start(now); o.stop(now + (dur || 0.2));
  };

  SFX.prototype.pop = function () {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, now);
    o.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    const gg = c.createGain();
    gg.gain.setValueAtTime(0.2, now);
    gg.gain.exponentialRampToValueAtTime(0.0005, now + 0.16);
    o.connect(gg); gg.connect(this.sfxGain);
    o.start(now); o.stop(now + 0.2);
  };

  g.SFX = SFX;
})(typeof window !== 'undefined' ? window : globalThis);
