# Strength Tracker

A standalone six-tab progressive web app for Nick's Program. Vanilla JS, no build step,
no dependencies. Data stays on the device: localStorage wrapped in try/catch with an
in-memory fallback, and a service worker so it works with no signal in the gym.

**Live:** https://krumhka4-code.github.io/strength-tracker/

| Tab | What it does |
|---|---|
| Lift | Targets computed from the intensity wave, set logging with RIR, per-day checklist |
| Warm | Guided timed warm-up with audio and vibration cues |
| Recover | Guided nightly corrective, plus the gymnastics core routine |
| Fuel | Macros, meal pattern, baked-oats recipe, checkable shopping list, weigh-in log |
| Breathe | Visual breathing pacer for the three programs |
| Stats | 1RMs, estimated 1RM from logged sets, volume, bodyweight trend, CSV export |

## Files

`index.html` · `manifest.json` · `sw.js` · `icon-192.png` · `icon-512.png`

## The program is data, not code

`PROGRAM`, `WAVE`, `WARMUP`, `RECOVER`, `CORE`, `BREATH` and the nutrition constants are
all plain objects near the top of the script in `index.html`. Changing the program is a
data edit. Days 2, 3 and 4 carry only the movements that are actually confirmed from
logged sessions and are marked incomplete in the app; nothing was invented to fill them.

## Deploying a change

Push to `main`. GitHub Pages serves from the repo root. **Bump `CACHE` in `sw.js`** or
phones will keep serving the cached old version.

## Tests

See `_dev/README.md`. 35 checks run against the real page in headless Chrome.

## Programs

The app ships two, switchable at the top of the Lift tab. Sessions record which
program they belong to, and drafts, custom exercises and history are kept separate.

**Re-entry Block** (default from 2026-09-07). Four weeks, three days a week, full
body, built for the restart after roughly five weeks off. It is **not** percentage
loaded: the squat 1RM it would have keyed off was contested before the layoff and
is stale now, and percentages off a wrong max is how people get hurt coming back.
Effort is capped by reps in reserve instead, 4/3/3/2 across the four weeks, and the
block ends by recalibrating from what actually got logged. Core is programmed
*before* the lifts because the logs say the back half of a session is what gets cut.
Day B opens with a light RDL as an explicit hamstring re-test.

**Nick's Program.** The original 12-week percentage-driven cycle. Unchanged.
