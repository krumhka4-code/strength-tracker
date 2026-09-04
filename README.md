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
