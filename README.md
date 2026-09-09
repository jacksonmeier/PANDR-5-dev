# PANDR-5

A self-contained web tracker for the **PANDR-5 model**: a five-day Push / Pull / Legs / Upper / Lower split with an abating RIR staircase, non-competing muscle pairs, and double progression. Built from the author's r/Biohackers post and the accompanying spreadsheet (v1.1.1), with the program, the fractional set allocation table, and all 18 research citations baked in.

> PPLUL, Abating, Non-competing, Double Progression, RIR, 5-day. Yes, it is overkill. That is the point.

## What it does

- **Program**: the full 7-day cycle, 35 exercise slots, with the RIR target per set. The underlined chip is the anchor set; the striped chip is a beyond-failure finisher.
- **Workout logging**: one load per exercise, reps and achieved RIR per set. The card shows what next session's load will be as you fill in the anchor set.
- **Double progression engine**: implements the post's rules exactly. Anchor set reaches the top of the range, add 2 to 5%. Misses the floor at 0 to 1 RIR, drop 2 to 3%. Inside the range, hold and chase reps. Beyond-failure sets never touch the decision. Progression is judged per day-slot, since the same exercise can carry a different rep range on Push and Upper.
- **Volume**: effective sets per muscle for the current cycle, using the sheet's fractional credit (primary 1, secondary 0.5, tertiary 0.25), against the sheet's full-cycle totals and the 10 to 20 band.
- **History**: every session, editable and deletable, plus a per-exercise view.
- **Settings**: appearance (below), lb or kg with conversion of stored loads, adjustable increase and decrease percentages, JSON export and import, clear all.

## Theming

Two colours and a mode drive the entire palette:

- **Accent** — buttons, the active tab, the anchor bar. Its hue and chroma are used.
- **Background tint** — only the hue and saturation are used. The lightness always comes
  from the mode, which is what keeps it a tint rather than a background colour.
- **Mode** — light, dark, or follow the device.

The palette is built in OKLCH rather than HSL, so a yellow accent and a blue accent at the
same ladder position read as equally light. A vivid pick is clamped to the sRGB gamut at the
accent lightness of *both* modes, so switching to light mode can never silently shift the
colour. Six presets are included; the default reproduces the original palette exactly.

Implementation: `src/lib/color.ts` (sRGB and OKLCH conversion, gamut clamp), `src/lib/theme.ts`
(the two picks to four CSS custom properties), and the ladders at the top of
`src/app/globals.css`. A small blocking script in `<head>` restores the saved theme before
first paint, so a light-mode user never sees a frame of the dark default.
- **Research** and **About**: the citations and the author's own explanation, cross-linked.

Everything is stored in the browser's `localStorage`. There is no backend, no account, and no
network call after the page loads: the fonts are self-hosted and every asset is same-origin.

## Install it on your phone

Open the deployed URL in Safari (iOS) or Chrome (Android), then **Share → Add to Home Screen**.

It launches full-screen with no browser chrome, and after one online visit it works **fully
offline** — every route, every font, every icon is precached, not just the pages you happened
to open. That is the point: gyms have no signal.

Two things worth knowing:

- **Install before you log real sessions.** Your training log lives in `localStorage`, which is
  scoped to the exact origin. Sessions logged in a Safari tab may not carry over into the
  installed app, and changing host or path later starts you empty. Use **Settings → Download
  JSON** before any move.
- **The home screen icon keeps its own colours.** iOS snapshots it at install time, so
  changing the theme does not restyle the icon on your home screen.
- **Updates apply on the next cold launch**, never mid-session. A new build is fetched in the
  background and parks until you fully close and reopen the app, so a deploy can't swap code
  out from under a workout you are logging.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 66 unit tests
npm run lint
npm run build        # static export to ./out, and generates out/sw.js
npm run icons        # regenerate public/ rasters from assets/icon/*.svg (needs sharp)
npm run verify:pwa   # check icon dimensions, alpha, and manifest discipline
```

`npm run build` runs `next build` and then `scripts/generate-sw.mjs`, which walks `out/`
and writes `out/sw.js` with an inlined precache list and a content hash. Serve `out/`
from any static host over **HTTPS** (service workers and Add to Home Screen both require it).

## Where things live

```
src/data/       the sheet, transcribed: exercises + multipliers, program, targets, research, post text
src/lib/        engines with no React: progression, volume, schedule, units, rir, color, theme, store
src/components/ screens and UI
src/app/        Next.js App Router pages (static)
assets/icon/    SVG icon SOURCES (pure geometry, no text — they must render without fonts)
scripts/        gen-icons.mjs, generate-sw.mjs + sw-template.js, verify-pwa-*.mjs
public/         committed build OUTPUTS: icons, favicon, manifest, .nojekyll
```

`public/*.png` are generated by `npm run icons` but are **committed on purpose**. `out/` is
gitignored, and `public/` is the only tree copied into the export, so those files are what
actually ship. Do not "clean them up". Regenerate them by editing `assets/icon/*.svg` and
re-running `npm run icons`.

## Hosting

The build is portable. One environment variable decides the path:

| Deploy | `NEXT_PUBLIC_BASE_PATH` | URL |
|---|---|---|
| Vercel, Netlify, any root host | unset | `https://host/` |
| GitHub Pages project site | `/PANDR-5-dev` | `https://user.github.io/PANDR-5-dev/` |

`.github/workflows/deploy-pages.yml` builds and deploys to GitHub Pages, reading the base path
from the Pages settings automatically. It needs Pages enabled with **Source: GitHub Actions**,
and note that GitHub Pages requires either a public repo or a paid plan.

The multipliers in `src/data/exercises.ts` were reverse-derived from the sheet's per-muscle totals. `src/lib/volume.test.ts` asserts that one full cycle reproduces every number in the sheet's "Sets Per Muscle Group Per Week" table.

## Program changelog (from the sheet)

- **v1.1.1**: Lat Pullover rep range changed from 15-20 to 12-15. Incline Pushups reps changed from 15-20 to 10-20.
- **v1.1.0**: Introduced the Blank Fillout sheet and semantic versioning. Replaced sissy squats with Dumbbell Heel-Elevated Squat. Leg extensions moved to after it.

## Credit and disclaimer

The model, the program, the volume table, and the research notes are the author's work, published on r/Biohackers and in the public Google Sheet. This app is a faithful implementation, not an endorsement. In the author's words: this is a very experimental model. It is not medical advice.
