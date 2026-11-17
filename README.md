# Zero Hour

A wave-survival zombies game for the browser, made in the spirit of the classic round-based zombies modes from the late 2000s and early 2010s. You start with a pistol in a room with boarded windows, and the undead come in rounds that never stop getting harder. You spend points to open the map, buy guns off the walls, gamble at the Mystery Crate, drink perks, upgrade weapons at the Forge and build wonder weapons, then see how long you last.

- **Singleplayer** and **online co-op for 1–4 players**. Both use the same authoritative simulation.
- **Low-poly, flat-shaded art** made entirely in code. There are no textures and no imported models, and every mesh comes from a procedural builder.
- **Runs in the browser.** You open a link and play, and there is nothing to install.

> Status: **pre-production.** These docs describe the plan. The work is laid out step by step in [`docs/PLAN.md`](docs/PLAN.md).

---

## Feature targets

| System | Summary |
|---|---|
| Rounds | Rounds without end. Zombie count, health and speed scale up every round. A short break between rounds. |
| Points economy | You earn points for hits, kills, headshots, melee kills and repairing barricades. You spend them on everything else. |
| Barricades | Windows hold 6 boards. Zombies tear boards off and players repair them for points. |
| Doors & debris | Buyable doors and debris open new zones. Opening a zone turns on its zombie spawners. |
| Power | A power switch deep in the map turns on perks, the Forge, traps and the zipline. |
| Wall buys | Guns drawn in chalk on the walls. You can rebuy ammo for a weapon you own. |
| Mystery Crate | 950 points for a random weapon. Sometimes the Jester appears and the crate moves somewhere else. |
| Perks | 9 tonic machines, with a perk limit you can raise. You lose all perks when downed. |
| The Forge | The upgrade machine. Weapons get a new name, more damage, more ammo and an elemental augment. |
| Power-ups | Drops from killed zombies: Full Resupply, One Shot, Double Pay, Purge, Rebuild, Clearance. |
| Special rounds | Howler rounds (packs of fast beasts), plus the Warden, an armored mini-boss. |
| Wonder weapons | Ion Blaster, Arc Caster, Singularity Launcher, and the Cryo Lance, which is built on Map 01. |
| Traps | Electric fence, turbine fan and flame vents, each costing points. |
| Down & revive | Last stand with a pistol, co-op revives, and a self-revive perk in solo. |
| Main quest | A multi-step easter egg on Map 01 with an ending and a reward. |
| Map 01 | **Blackwater Station**: a Cold-War radar outpost by a lake at night. It has 12 zones. |

---

## Tech stack (summary)

| Concern | Choice |
|---|---|
| Language | TypeScript (strict) everywhere |
| Monorepo | pnpm workspaces |
| Client build | Vite |
| Rendering | Three.js (WebGL2), plus `postprocessing` for bloom, vignette and grading |
| Collision / raycasts | `three-mesh-bvh` over the static map, with capsule hitboxes for characters |
| Navigation / crowds | `recast-navigation` (Recast/Detour in WASM, runs in both browser and Node) |
| Simulation | In-house mini ECS, a fixed 30 Hz tick, and code shared by the client and the server |
| Singleplayer | The server simulation runs in a **Web Worker** on the player's machine |
| Multiplayer | An authoritative Node server using `ws` WebSockets, with binary snapshots, client prediction and lag compensation |
| UI | Preact + signals, as an HTML overlay for the HUD and menus |
| Audio | Web Audio, procedural SFX via ZzFX, and generated music stingers |
| Tests | Vitest for simulation and content, Playwright for smoke and multiplayer tests |
| Lint/format | Biome |
| CI | GitHub Actions |

The reasoning behind each choice is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Repository layout (target)

```
zero-hour/
├─ apps/
│  ├─ client/          # Browser game: rendering, input, audio, UI, prediction
│  └─ server/          # Node authoritative multiplayer server + lobby
├─ packages/
│  ├─ sim/             # Shared simulation: ECS, systems, protocol (no DOM, no WebGL)
│  ├─ content/         # Data: weapons, perks, zombies, rounds, power-ups
│  ├─ maps/            # Map definitions + bake script (collision, navmesh)
│  └─ art/             # Procedural mesh builders + palette (client only)
├─ tools/              # Dev tools (map viewer, balance sim, bot clients)
└─ docs/               # Design + engineering docs (start here)
```

## Getting started (once Milestone 0 lands)

```bash
pnpm install
```

```bash
pnpm dev          # client at http://localhost:5173 (singleplayer works offline)
```

```bash
pnpm dev:server   # multiplayer server at ws://localhost:7777
```

```bash
pnpm test         # sim + content unit tests
```

```bash
pnpm map:bake blackwater   # rebuild collision + navmesh for Map 01
```

Requires Node 24 LTS and pnpm 10 or newer.

## Controls (default)

| Action | Key |
|---|---|
| Move / Sprint / Crouch | WASD / Shift / Ctrl |
| Jump | Space |
| Fire / Aim | LMB / RMB |
| Reload | R |
| Interact (buy, repair, revive) | F (hold) |
| Melee | V |
| Lethal / Tactical grenade | G / Q |
| Swap weapon | 1 / 2 / 3 or mouse wheel |
| Scoreboard | Tab |
| Pause (solo only) / Menu | Esc |

---

## Documentation

| Doc | What's in it |
|---|---|
| [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md) | The full design: core loop, formulas, every system, content tables |
| [`docs/MAP_01_BLACKWATER.md`](docs/MAP_01_BLACKWATER.md) | The first map: zones, layout, flow, item placement, quest |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Code structure, simulation, netcode, rendering, AI, data formats |
| [`docs/ART_DIRECTION.md`](docs/ART_DIRECTION.md) | The low-poly-in-code style guide: palette, builders, lighting, VFX |
| [`docs/PLAN.md`](docs/PLAN.md) | Milestones broken into small, concrete, checkable steps |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architecture decision records (ADRs) |
| [`CLAUDE.md`](CLAUDE.md) | Working conventions for AI-assisted development sessions |

## Legal / originality

Zero Hour is an original, non-commercial fan project. It is *inspired by* the round-based zombies genre but uses **only original names, art, audio and code**. Do not add assets, names, logos, music or sound effects from any existing game.
