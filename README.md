# PANDR-5

A self-contained web tracker for the **PANDR-5 model**: a five-day Push / Pull / Legs / Upper / Lower split with an abating RIR staircase, non-competing muscle pairs, and double progression. Built from the author's r/Biohackers post and the accompanying spreadsheet (v1.1.1), with the program, the fractional set allocation table, and all 18 research citations baked in.

> PPLUL, Abating, Non-competing, Double Progression, RIR, 5-day. Yes, it is overkill. That is the point.

## What it does

- **Program**: the full 7-day cycle, 35 exercise slots, with the RIR target per set. The underlined chip is the anchor set; the striped chip is a beyond-failure finisher.
- **Workout logging**: one load per exercise, reps and achieved RIR per set. The card shows what next session's load will be as you fill in the anchor set.
- **Double progression engine**: implements the post's rules exactly. Anchor set reaches the top of the range, add 2 to 5%. Misses the floor at 0 to 1 RIR, drop 2 to 3%. Inside the range, hold and chase reps. Beyond-failure sets never touch the decision. Progression is judged per day-slot, since the same exercise can carry a different rep range on Push and Upper.
- **Volume**: effective sets per muscle for the current cycle, using the sheet's fractional credit (primary 1, secondary 0.5, tertiary 0.25), against the sheet's full-cycle totals and the 10 to 20 band.
- **History**: every session, editable and deletable, plus a per-exercise view.
- **Settings**: lb or kg with conversion of stored loads, adjustable increase and decrease percentages, JSON export and import, clear all.
- **Research** and **About**: the citations and the author's own explanation, cross-linked.

Everything is stored in the browser's `localStorage`. There is no backend, no account, and no network call after the page loads.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run lint
npm run build      # static export to ./out
```

The build is a static export. Serve `out/` from any static host.

## Where things live

```
src/data/       the sheet, transcribed: exercises + multipliers, program, targets, research, post text
src/lib/        engines with no React: progression, volume, schedule, units, rir, store
src/components/ screens and UI
src/app/        Next.js App Router pages (static)
```

The multipliers in `src/data/exercises.ts` were reverse-derived from the sheet's per-muscle totals. `src/lib/volume.test.ts` asserts that one full cycle reproduces every number in the sheet's "Sets Per Muscle Group Per Week" table.

## Program changelog (from the sheet)

- **v1.1.1**: Lat Pullover rep range changed from 15-20 to 12-15. Incline Pushups reps changed from 15-20 to 10-20.
- **v1.1.0**: Introduced the Blank Fillout sheet and semantic versioning. Replaced sissy squats with Dumbbell Heel-Elevated Squat. Leg extensions moved to after it.

## Credit and disclaimer

The model, the program, the volume table, and the research notes are the author's work, published on r/Biohackers and in the public Google Sheet. This app is a faithful implementation, not an endorsement. In the author's words: this is a very experimental model. It is not medical advice.
