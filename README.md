# Ember Bistro — Sizzle, Chop, Serve

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/zetinhere/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/zetinhere/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A fast, original 2D cooking game: run a one-chef bistro through a 180-second dinner rush. Grab ingredients from the crates, chop veg on the board, grill patties before they burn, build dishes on the assembly counter, and serve them at the window before the order tickets run out. Serve fast to earn time bonuses; serve in a row to build a combo multiplier. Built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network — every file the game loads lives under `game/`.

## How to play

- **WASD / arrow keys** to run — or click a spot on the floor to walk there.
- **E** (or click a station) to grab, chop, grill and serve.
- **Chopping board**: lettuce and tomato chop in ~1.4s while you stand by.
- **Grill**: patties are done at 6s and burnt at 12s — pull them off in the window.
- **Assembly counter**: put a plate down, stack its ingredients, pick it back up.
- **Serving window**: serve a plate that matches an open order ticket.
- **Trash**: dump a burnt patty or a wrong ingredient.

Four recipes, from Garden Salad to the five-item Ember Deluxe. Orders pay a base price plus a speed bonus, multiplied by your combo. At the end of the shift you get a rank — Dishwasher, Line Cook, Sous Chef or Head Chef.

## Layout

- `game/` — the game itself, plain static files: `index.html` plus `src/` (one clear job per file: `config`, `random`, `input`, `state`, `world`, `render`, `audio`, `shots`, `main`). All art is drawn in canvas; all sounds are procedural WebAudio.
- `screenshots/` — four captures of the real game: mid-rush cover, title, the rush, shift-end rank.
- `shots.json` — the `?shot=` scenes each screenshot was taken from.
- `main.ts` — the entrypoint the grader runs; copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
- `serve.ts` — a tiny static server for local play.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=jc69fpy6&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
