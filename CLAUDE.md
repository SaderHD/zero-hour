# Working conventions for Zero Hour

Read this before you change code. The design lives in `docs/`, and the work order lives in `docs/PLAN.md`.

## Workflow
- Work on **one plan step at a time**, such as `PLAN 4.3`. When a step's "Done when" criteria pass, tick its checkbox in `docs/PLAN.md` in the same commit.
- Commit message format: `[4.3] Hitscan firing against static world`.
- If a step turns out to be too big, split it in `PLAN.md` (for example 4.3a and 4.3b) before you implement it.
- If a decision changes the architecture, add or modify an ADR in `docs/DECISIONS.md`.
- If a change alters a gameplay number or rule, update `docs/GAME_DESIGN.md` so the design doc stays accurate.

## Hard rules
1. **`packages/sim` must never import DOM, WebGL, `three`'s renderer, Preact or audio.** It runs in a Web Worker and in Node. It may import math and geometry from `three` (Vector3, Box3, BufferGeometry) and `three-mesh-bvh`.
2. **The server is authoritative.** The client never decides points, damage, purchases, spawns or RNG outcomes. It only predicts its own movement and cosmetic effects.
3. **Gameplay numbers belong in `packages/content`** and must not appear as literals inside systems. Formulas such as zombie health per round are pure functions with unit tests.
4. **Use seeded RNG only** (`sim/rng.ts`) inside the simulation. Never call `Math.random()` in `packages/sim`.
5. **Only original names, art and audio.** Never use trademarked names or assets from existing games.
6. Art comes from code: meshes are built in `packages/art` builders from the shared palette. Do not import model or texture files unless an ADR says otherwise.
7. Keep the 30 Hz tick budget. Sim systems are allocation-free in the hot path, so reuse vectors and use pools.

## Commands
- `pnpm dev`: client with an in-worker singleplayer server
- `pnpm dev:server`: multiplayer server
- `pnpm test`: Vitest
- `pnpm lint`: Biome
- `pnpm typecheck`: `tsc -b`
- `pnpm map:bake <map>`: regenerate the collision and navmesh binaries

## Style
- TypeScript strict. Prefer plain functions and data over classes, except for long-lived services such as Renderer and AudioEngine.
- System files follow `systems/<name>System.ts` and export `function <name>System(world: World, dt: number): void`.
- Components are plain data and live in `sim/components/`.
- File names are camelCase. Types and components are PascalCase.
