# Architecture Decision Records

Format: Context → Decision → Consequences. Add new ADRs at the bottom. Don't edit accepted ones; supersede them instead.

---

## ADR-001 — Browser + TypeScript + Three.js
**Context:** This is a personal project that wants singleplayer and multiplayer, art drawn in code, fast iteration, and zero install for friends joining co-op.
**Decision:** Build a browser game in TypeScript with Three.js for rendering and Vite for builds.
**Alternatives considered:** Godot 4 (great editor and built-in netcode, but GDScript or C#, an export step for web, and drawing meshes in code is more awkward); Unity (heavy, and the licensing is a concern); Babylon.js (fine, but Three has a bigger ecosystem: `three-mesh-bvh`, `postprocessing`).
**Consequences:** We write our own game loop, ECS and netcode, which gives full control. Browser limits apply: Pointer Lock, an audio unlock on the first click, and no raw UDP.

## ADR-002 — One simulation, run in a Worker (solo) or Node (multiplayer)
**Context:** Keeping separate singleplayer and multiplayer logic doubles the bugs.
**Decision:** `GameServer` in `packages/sim` is the only gameplay authority. Solo runs it in a Web Worker over a MessagePort transport.
**Consequences:** Solo play exercises multiplayer code all the time. The sim code has to stay free of DOM. The main thread stays free for rendering.

## ADR-003 — Authoritative server, client prediction for local movement only
**Decision:** The server owns all state. The client predicts its own movement and cosmetic weapon feedback, interpolates everything else 100 ms in the past, and the server lag-compensates hitscan.
**Consequences:** Movement and shooting feel responsive at 50–150 ms ping. Prediction and server must share the movement code, which means it has to be deterministic given the same inputs.

## ADR-004 — In-house minimal ECS
**Decision:** A small ECS with typed-array stores and per-component network schemas, instead of bitECS or miniplex.
**Consequences:** About 400 lines we own. Serialization and quantization fit our netcode directly. We give up some ecosystem tooling.

## ADR-005 — Recast/Detour via `recast-navigation` for nav and crowds
**Decision:** Navmesh generated at bake time, plus DetourCrowd for hordes. It's WASM and the same code runs in the browser and Node.
**Consequences:** Strong crowd behavior out of the box. Doors need tiled navmesh and area flags. The WASM adds about 400 KB.

## ADR-006 — WebSockets (TCP) for version 1 netcode
**Context:** UDP-like transports in the browser (WebRTC data channels, WebTransport) are more complex to host.
**Decision:** Use binary WebSockets. Input messages carry the last 3 commands for redundancy, and snapshots delta against acknowledged baselines.
**Consequences:** Head-of-line blocking stalls during packet loss, which is acceptable for co-op with at most 4 players. The `Transport` interface lets us switch to WebTransport later.

## ADR-007 — Procedural art and audio, no imported assets by default
**Decision:** Meshes come from code builders and SFX from ZzFX-style synthesis. Exceptions (original music tracks, fonts) need a note in the README credits.
**Consequences:** No asset pipeline and a tiny download. The visual quality depends on the builders and the lighting, so the art direction doc is binding.

## ADR-008 — Segmented rigid-part characters instead of skinned meshes
**Decision:** Characters are hierarchies of rigid parts, rendered as an InstancedMesh per part type.
**Consequences:** Dismemberment is cheap, there's no skinning cost, and about 20 draw calls cover the whole horde. Joints are visible, and the style embraces that.

## ADR-009 — Original names and content only
**Decision:** Every weapon, perk, machine, enemy and map has an original name and design. The game is inspired by the genre's mechanics, not copied from a specific product.
**Consequences:** Avoids trademark and copyright issues and gives the game its own identity.

## ADR-010 — pnpm workspaces monorepo, Biome, Vitest
**Decision:** pnpm workspaces with TS project references. Biome for lint and format, which is one fast tool. Vitest for tests, sharing Vite's config.
**Consequences:** Simple tooling. Biome's rule set is narrower than ESLint's, so custom import bans may need a small script (`tools/check-imports.ts`).
