# Claude: A Natural History

An 84-second 2D cartoon about the evolution of the Claude mascot: a tadpole in
the ocean grows into a fish, a lizard, a dinosaur, is wiped out by an asteroid,
survives as a rat, becomes a monkey, a human — high-fives its mate — and the
mate immediately turns straight back into a rat.

**Everything is drawn in code.** There are no images, no sprites, no stock art
and no generated video in this project. Every frame is canvas primitives
(blobs, polygons, arcs, rects) built by `js/mascot.js` and `js/world.js`. The
music and every sound effect are synthesised at runtime with the Web Audio API
in `js/sfx.js`.

## Watch it online

**https://robbiejrdev.github.io/claude-natural-history/**

## How to watch it

Open **`index.html`** in a browser and press the orange button. That's it —
the narration is a local file in `audio/`, so it works offline from `file://`.

- **Play / pause:** the button, or the spacebar
- **Seek:** click anywhere on the bar at the bottom
- **Replay:** the *Watch again* button on the end card
- **Preview a single moment:** `index.html?t=71.5` jumps straight to that second
  (used for the storyboard stills in `build/`)

## The cast

| Character | Fish Audio voice | Voice id |
|---|---|---|
| Narrator | Adrian — "A steady and reliable narrator" | `bf322df2096a46f18c579d0baa36f41d` |
| Claude | a2ksi — "A high-pitched, energetic male voice perfect for animated characters" | `e9e9d36027424e55ac3faa620f78a72b` |

All 19 lines were generated with the **`drama-3`** model, each with its own
performance direction in square brackets. The narrator's delivery changes
mid-sentence on the asteroid line (calm → panicked → shouting); that was
verified by transcribing the finished track, which reports
`[shouting] [angry] Arg!` at the end of that line.

## Layout

```
index.html          the player: title card, play button, subtitles, progress bar
timeline.js         generated — each line's start/end time and subtitle text
audio/
  narration.mp3     the master track (all 19 lines mixed to one file)
  lines/L01..L19.mp3  the raw Fish Audio drama-3 output, one file per line
js/
  util.js           math + colour helpers
  mascot.js         the creature: 7 stage parameter sets, morphing, the flag
  world.js          sea, shore, jungle, ash and golden hour; asteroid, impact
  sfx.js            all sound, synthesised at runtime
  story.js          the score: which line drives which morph, camera and effect
  player.js         the frame loop; the narration track is the clock
build/
  build.mjs         trims the line files, sets the tempo, mixes the master
  shot.mjs          renders still frames of the film for visual checking
script.md           the script, with directions and timings
```

## Rebuilding the audio

```bash
node build/build.mjs
```

It re-reads `audio/lines/*.mp3`, trims the dead air off each one, applies a
single global tempo so the finished film lands inside the 60–90 second window,
mixes them into `audio/narration.mp3` at their scheduled offsets, and rewrites
`timeline.js`. The current build runs the narration at 1.4271×.

`build/shot.mjs` needs Playwright (`npm i playwright`); it is only used for
checking stills and is not needed to watch the film.
