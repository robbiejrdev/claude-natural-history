#!/usr/bin/env node
/**
 * build.mjs — turn the raw Fish Audio drama-3 line files into:
 *   1. audio/narration.mp3  (one master track, every line at its scheduled offset)
 *   2. timeline.js           (line start/duration + subtitle text, for the canvas to sync against)
 *
 * Steps per line: detect speech onset/offset -> trim dead air -> apply a global
 * atempo so the finished film lands inside the 60-90s window -> fade the edges.
 *
 * Run:  node build/build.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LINES = path.join(ROOT, 'audio', 'lines');
const WORK = path.join(ROOT, 'build', 'work');
const OUT = path.join(ROOT, 'audio', 'narration.mp3');

fs.mkdirSync(WORK, { recursive: true });

// ---------------------------------------------------------------- target timing
const TARGET_FILM = 84;      // seconds we want the finished film to be
const HEAD_GAP = 1.2;        // silence before the first line (title card breathes)
const TAIL_GAP = 2.6;        // silence after the last line (final card)
const LINE_GAP = 0.22;       // pause between lines

// ---------------------------------------------------------------- the script
const SCRIPT = [
  { id: 'L01', speaker: 'narrator', voice: 'Adrian',
    text: 'In the beginning, there was only the ocean, and in it, one small, determined tadpole.' },
  { id: 'L02', speaker: 'narrator', voice: 'Adrian',
    text: 'No legs. No lungs. No ambitions. Just a flag. Somehow, a flag.' },
  { id: 'L03', speaker: 'narrator', voice: 'Adrian',
    text: 'And then — a spine. A plan. The sea was no longer enough.' },
  { id: 'L04', speaker: 'narrator', voice: 'Adrian',
    text: 'There were shores out there. And on them, sun.' },
  { id: 'L05', speaker: 'narrator', voice: 'Adrian',
    text: 'The lizard grew. And grew.' },
  { id: 'L06', speaker: 'narrator', voice: 'Adrian',
    text: 'The great clay colossus. For a time, the world belonged to him.' },
  { id: 'L07', speaker: 'narrator', voice: 'Adrian',
    text: 'Which is, of course, when the universe developed an interest.' },
  { id: 'L08', speaker: 'narrator', voice: 'Adrian',
    text: 'Sixty-six million years later, a rock the size of a shopping mall arrived at four thousand miles per hour — and it took EVERYTHING, every magnificent — ARGH!' },
  { id: 'L09', speaker: 'narrator', voice: 'Adrian',
    text: 'And then… from the ash… something small. Something that would be us.' },
  { id: 'L10', speaker: 'narrator', voice: 'Adrian',
    text: 'It was a rat. A very small rat. With, inexplicably, the same flag.' },
  { id: 'L11', speaker: 'claude', voice: 'a2ksi',
    text: "Hi! Don't mind me. We're fine." },
  { id: 'L12', speaker: 'narrator', voice: 'Adrian',
    text: 'The rat became a monkey. The monkey stood up. And looked around.' },
  { id: 'L13', speaker: 'narrator', voice: 'Adrian',
    text: 'And one day, it saw another of itself.' },
  { id: 'L14', speaker: 'narrator', voice: 'Adrian',
    text: 'They met. They raised their hands, and brought them down together — the sound of two lives agreeing to begin.' },
  { id: 'L15', speaker: 'narrator', voice: 'Adrian',
    text: 'And the circle closed.' },
  { id: 'L16', speaker: 'claude', voice: 'a2ksi',
    text: "I've been a rat this whole time." },
  { id: 'L17', speaker: 'narrator', voice: 'Adrian',
    text: 'And that concludes the natural history of Claude.' },
  { id: 'L18', speaker: 'claude', voice: 'a2ksi',
    text: 'Back in the hole, then.' },
  { id: 'L19', speaker: 'narrator', voice: 'Adrian',
    text: 'Goodnight.' },
];

const ff = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args]);
const probe = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

// ---- 1. find where the speech actually starts/ends inside each mp3
function speechBounds(file) {
  const raw = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file,
    '-f', 's16le', '-acodec', 'pcm_s16le', '-ar', '22050', '-ac', '1', '-'], { maxBuffer: 1 << 28 });
  const n = raw.length / 2;
  let first = -1, last = -1;
  const THRESH = 400;
  for (let i = 0; i < n; i++) {
    const v = Math.abs(raw.readInt16LE(i * 2));
    if (v > THRESH) { if (first < 0) first = i; last = i; }
  }
  if (first < 0) return { start: 0, end: probe(file) };
  const sr = 22050;
  return { start: Math.max(0, first / sr - 0.05), end: Math.min(probe(file), last / sr + 0.08) };
}

// ---- 2. measure raw (untrimmed) speech length so we can solve for the tempo
const bounds = SCRIPT.map(l => {
  const f = path.join(LINES, `${l.id}.mp3`);
  if (!fs.existsSync(f)) throw new Error(`missing ${f}`);
  return speechBounds(f);
});
const rawSpeech = bounds.reduce((a, b) => a + (b.end - b.start), 0);

const gaps = (SCRIPT.length - 1) * LINE_GAP;
const speechBudget = TARGET_FILM - HEAD_GAP - TAIL_GAP - gaps;
let tempo = rawSpeech / speechBudget;
tempo = Math.min(1.5, Math.max(1.0, tempo));
console.log(`raw speech ${rawSpeech.toFixed(2)}s -> tempo ${tempo.toFixed(4)}`);

// ---- 3. trim + tempo + fade each line into build/work
const processed = [];
for (let i = 0; i < SCRIPT.length; i++) {
  const { id } = SCRIPT[i];
  const { start, end } = bounds[i];
  const out = path.join(WORK, `${id}.wav`);
  ff(['-y', '-i', path.join(LINES, `${id}.mp3`),
    '-af', `atrim=start=${start.toFixed(3)}:end=${end.toFixed(3)},atempo=${tempo.toFixed(5)},afade=t=in:st=0:d=0.012,afade=t=out:st=${Math.max(0, (end - start) / tempo - 0.02).toFixed(3)}:d=0.02,aresample=44100`,
    '-ac', '2', '-c:a', 'pcm_s16le', out]);
  processed.push({ id, file: out, dur: probe(out) });
}

// ---- 4. schedule
let cursor = HEAD_GAP;
const lines = processed.map((p, i) => {
  const line = { ...SCRIPT[i], start: cursor, dur: p.dur, index: i };
  cursor += p.dur + LINE_GAP;
  return line;
});
const filmDur = cursor - LINE_GAP + TAIL_GAP;
console.log(`scheduled film ${filmDur.toFixed(2)}s`);

// ---- 5. mix into one master track
const args = ['-y'];
for (const p of processed) args.push('-i', p.file);
const delays = processed.map((p, i) => {
  const ms = Math.round(lines[i].start * 1000);
  return `[${i}:a]adelay=${ms}:all=1[a${i}]`;
}).join(';');
const mixin = processed.map((_, i) => `[a${i}]`).join('');
const fc = `${delays};${mixin}amix=inputs=${processed.length}:normalize=0:duration=longest[mix];[mix]apad[out]`;
args.push('-filter_complex', fc, '-map', '[out]', '-t', filmDur.toFixed(3),
  '-c:a', 'libmp3lame', '-b:a', '192k', OUT);
ff(args);
const finalDur = probe(OUT);
console.log(`master ${OUT} ${finalDur.toFixed(2)}s`);

// ---- 6. emit timeline.js (a plain script so file:// can load it without CORS)
const payload = {
  generated: new Date().toISOString(),
  duration: +finalDur.toFixed(3),
  tempo: +tempo.toFixed(4),
  target: TARGET_FILM,
  lines: lines.map(l => ({
    i: l.index,
    id: l.id,
    speaker: l.speaker,
    voice: l.voice,
    text: l.text,
    start: +l.start.toFixed(3),
    dur: +l.dur.toFixed(3),
    end: +(l.start + l.dur).toFixed(3),
  })),
};
fs.writeFileSync(path.join(ROOT, 'timeline.js'),
  `// generated by build/build.mjs — do not edit by hand\nwindow.TIMELINE = ${JSON.stringify(payload, null, 2)};\n`);

console.log(`timeline.js written: ${lines.length} lines, ${payload.duration}s`);
