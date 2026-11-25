# The Golden Ladle — Hearth Rush v2

[![Make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/SARIP-afk/best-cooking-game-20261125-0137-entry-v2/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/SARIP-afk/best-cooking-game-20261125-0137-entry-v2/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete timed cooking game for the Make the best cooking game bounty
(best-cooking-game-20261125-0137). Original art, sounds, names and code —
no library, no network request, plain static files.

## What's new in v2

v1 finished rank 238/648 in round 1, outside the paid zone. v2 adds the
depth and feel the judge's criteria ask for:

- **Chopping board** (`game/src/prep.js`): lettuce, tomato and egg must be
  chopped — click the board twice per item — before they can go on the
  plate. A progress ring fills and the chopped piece flies to the plate.
  Chopping adds a real sequencing decision: chop now, or grill first?
- **Rush Hour** (`game/src/events.js`): every 60 seconds a 15-second rush —
  orders spawn twice as fast, every serve pays double, a golden banner and
  a glowing screen edge make the rush read in a glance.
- **Golden VIP orders**: every ~45 seconds one order arrives with a golden
  frame and pays double. Serve the VIP first, or the order about to expire?
- **3 grill slots** (was 2) for more parallel grill management.
- **9 recipes** (was 5): Breakfast Stack, Spicy Stack, Veggie Delight and
  Triple Crown join the book. **8 customers** (was 6): Basil and Clover.
- **Level-up every 4 serves** (was 5), so level 4 is reachable in one shift.
- **Final 30 seconds**: a pulsing red vignette, a "FINAL 30 SECONDS" banner
  and a tick every second, so the timer is felt, not just seen.

## Play

Open `game/index.html` in desktop Chrome (or serve `game/` with any static
server). Keyboard + mouse.

You run the coziest bistro in town. Orders appear on the order board with a
patience bar. Click an order to select it, then build its dish on the
assembly plate:

- Click ingredient bins (or press 1–6) to add Bun and Cheese straight to the
  plate. Patties go to the grill first: they sizzle for 6 seconds, then click
  the cooked patty to plate it (3 grill slots now). Leave one too long and it
  burns. Lettuce, Tomato and Egg go to the chopping board: click the board
  twice (or press C) to chop each one onto the plate.
- When the plate matches the selected order, hit SERVE (or Space) before
  patience runs out. Fast serves earn a patience bonus; serving streaks
  multiply your coins (combo up to x5). Golden VIP orders and Rush Hour
  serves pay double.
- Every 4 dishes served you level up: orders arrive faster and new recipes
  unlock (Garden Stack and Spicy Stack at level 2, Veggie Delight and Double
  Trouble at level 3, Triple Crown at level 4).
- A shift lasts 3:00. Serve as many hungry customers as you can.

Sounds are synthesized with WebAudio (sizzle, chops, dings, rush fanfares) —
no audio files. Mute with M. Pause with P or Esc.

## Screenshots

`screenshots/` holds 4 real renders of the game's own code, staged with
`?shot=start|play|chop|serve|end&seed=7`: the cover is a Rush Hour scene
with a golden VIP order, chopping in progress and all three grill slots
busy; then the chopping board mid-chop, a golden VIP serve, and an S-grade
end screen.

## Hand in

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json` via `vendor/makefun-game.ts`
(the kit's copy, unchanged).
