# Zero Hour — Architecture

## 1. Big picture

```
┌──────────────────────────── Browser ─────────────────────────────┐
│  apps/client                                                     │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐   │
│  │  Input   │→ │ Prediction│→ │ Render   │  │  UI (Preact)  │   │
│  │ sampler  │  │ (local    │  │ (Three)  │  │  HUD / menus  │   │
│  └────┬─────┘  │  player)  │  └────▲─────┘  └──────▲────────┘   │
│       │        └─────┬─────┘       │               │            │
│       │   commands   │  snapshots / events          │            │
│       ▼              ▼     ┌──────────────────┐      │            │
│   ┌──────────── Transport (interface) ────────┴──────┴─┐         │
│   │  WorkerTransport (MessagePort)  |  WsTransport      │         │
│   └──────────┬──────────────────────┴─────────┬─────────┘         │
│              │ singleplayer                   │ multiplayer       │
│   ┌──────────▼──────────┐                     │                   │
│   │ Web Worker          │                     │                   │
│   │  packages/sim       │                     │                   │
│   │  GameServer (same   │                     │                   │
│   │  code as Node)      │                     │                   │
│   └─────────────────────┘                     │                   │
└───────────────────────────────────────────────┼───────────────────┘
                                                │ WebSocket (binary)
                                   ┌────────────▼────────────┐
                                   │ apps/server (Node 24)   │
                                   │  Lobby + Rooms          │
                                   │  GameServer × N         │
                                   │  (packages/sim)         │
                                   └─────────────────────────┘
```

**Key idea:** there is exactly **one** game simulation, `GameServer` in `packages/sim`. Singleplayer runs it in a Web Worker and multiplayer runs it in Node. The client always talks to it through a `Transport`, so solo play goes through the multiplayer code path every time, and netcode bugs show up early.

## 2. Packages

| Package | Depends on | Responsibility |
|---|---|---|
| `packages/sim` | `three` (math/geometry only), `three-mesh-bvh`, `recast-navigation`, `content`, `maps` (data) | ECS, all gameplay systems, `GameServer`, protocol codecs, seeded RNG, collision queries, nav |
| `packages/content` | — | Pure data plus formula functions: weapons, perks, enemies, rounds, power-ups, prices |
| `packages/maps` | `content` | Map definitions (TS), quest scripts, a bake CLI that writes `*.collision.bin` and `*.nav.bin` |
| `packages/art` | `three` | Palette, primitives, builders (kit, characters, weapons, props), animation clips |
| `apps/client` | all of the above | Bootstrapping, renderer, entity views, input, prediction, interpolation, audio, UI, menus |
| `apps/server` | `sim`, `content`, `maps` | WebSocket server, lobby, room lifecycle, the tick loop for each room |
| `tools/*` | varies | `balance-sim` (headless round simulator), `bot-client` (load testing), `map-viewer` |

TypeScript project references (`tsc -b`) enforce the dependency direction. A lint rule bans `document`, `window` and the `three` renderer imports inside `sim`.

## 3. Simulation

### 3.1 Tick
- A **fixed 30 Hz tick** (`DT = 1/30`). The server tick loop uses an accumulator with `setImmediate`/`setTimeout` in Node and a `setInterval` drift-corrected loop in the worker.
- Snapshots go to clients at **20 Hz** (sent on 2 of every 3 ticks). On the worker transport they go out every tick (30 Hz).
- A tick runs: `applyInputs → systems in fixed order → collect events → build snapshots`.

### 3.2 ECS (in-house, about 400 LOC)
- An entity is an integer id with a generation counter. Components live in **typed stores**. Numeric components use struct-of-arrays (`Float32Array`), and rare or complex data uses `Map<Entity, T>`.
- Queries are cached archetype bitmasks. The API:
  ```ts
  const q = defineQuery([Transform, Zombie, Health]);
  for (const e of q(world)) { … }
  ```
- Each component has a **network schema**: which fields replicate, how they are quantized (for example position as 16-bit fixed point per map bounds, yaw as 8 bits), and a priority.
- The reasons for building it ourselves instead of using a library are in ADR-004: control over serialization, no dependency churn, and it's tiny.

### 3.3 Core components (initial set)
`Transform{pos, yaw, pitch}`, `Velocity`, `Collider{capsule r,h}`, `Health{hp,max}`, `Player{slot, points, state}`, `Inventory{weapons[], active, ammo[]}`, `PerkSet{bits}`, `Zombie{type, speedTier, state, target}`, `NavAgent{agentIdx}`, `Hitboxes{set}`, `Projectile{kind, owner, ttl}`, `Interactable{kind, cost, radius, holdTime, enabled}`, `Barricade{boards}`, `Door{zoneA, zoneB, open}`, `Spawner{zone, kind}`, `PowerUp{kind, ttl}`, `Crate{locationIdx, state}`, `Trap{state, timer}`, `StatusEffects{burn, frost, shock}`, `Replicated{priority}`.

### 3.4 System order (per tick)
1. `inputSystem`: apply the queued player commands (movement, look, buttons).
2. `playerMovementSystem`: the kinematic capsule controller (shared with client prediction).
3. `interactionSystem`: hold-to-use, purchase validation, repair, revive.
4. `weaponSystem`: fire, reload, swap, melee, hitscan with lag compensation, spawning projectiles.
5. `projectileSystem`: integrate projectiles, collide, explode.
6. `damageSystem`: apply the queued damage, hit zones, points, deaths, dismemberment events.
7. `statusEffectSystem`: burn, frost and shock ticks, and augment procs.
8. `directorSystem`: round state machine, spawn queue, zone activation, recycling.
9. `zombieAISystem`: state machine, nav targets, barricade logic, attacks.
10. `navCrowdSystem`: step the Detour crowd and write positions back.
11. `specialEnemySystem`: Howler and Warden behavior.
12. `powerUpSystem`, `crateSystem`, `forgeSystem`, `perkSystem`, `trapSystem`, `zipline system`, `questSystem`.
13. `downedSystem`: bleedout, revive progress, game over.
14. `cleanupSystem`: destroy entities flagged for removal, and recycle pools.

### 3.5 RNG
`sim/rng.ts` is a seeded PRNG (sfc32 or mulberry32). The game seed is set when the room is created. There are separate streams for `crate`, `drops`, `spawns`, `ai` and `cosmetic`, so a change in one area doesn't shift the results of another. Tests can pin seeds.

### 3.6 Events
Systems push typed **events** (`ZombieKilled`, `PointsAwarded`, `RoundStarted`, `CrateOpened`, `PerkBought`, `PowerOn`, `PlayerDowned`, `Sound`, …) to an event bus. Inside the sim, systems react to them (for example the quest listens for `ZombieKilled` near a coil). Network-relevant events are sent to clients **reliably and in order**, and drive SFX, VFX and UI.

## 4. Networking

### 4.1 Transport
```ts
interface Transport {
  send(msg: ArrayBuffer, reliable: boolean): void;
  onMessage(cb: (msg: ArrayBuffer) => void): void;
  close(): void;
}
```
- **WorkerTransport:** a `MessagePort` with transferable ArrayBuffers. It reports zero latency, and an optional fake lag and loss shim (`?netsim=120,2`) lets you test netcode in solo.
- **WsTransport:** a binary WebSocket. Version 1 accepts TCP head-of-line blocking because it's co-op with at most 4 players (ADR-006). WebTransport could replace it later behind the same interface.

### 4.2 Protocol (binary, `sim/net/protocol.ts`)
Messages start with a 1-byte type. A tiny `BitWriter`/`BitReader` codec is generated from the component net schemas.

| Msg | Dir | Contents |
|---|---|---|
| `Hello` | C→S | Protocol version, name, room code, reconnect token |
| `Welcome` | S→C | Player slot, seed, map id, tick rate, initial full snapshot |
| `Input` | C→S | The last 3 commands (for redundancy), each with seq, tick, move axes, yaw/pitch, button bits, weapon slot |
| `Snapshot` | S→C | Server tick, last processed input seq, and entity deltas against the client's acknowledged baseline |
| `Ack` | C→S | The latest snapshot tick received (for the delta baseline) |
| `Events` | S→C | Reliable batch of game events |
| `Chat`/`Ping`/`Pong` | both | Ping is used for lag compensation and the scoreboard |

The bandwidth target is **≤ 12 KB/s downstream per client** at 42 zombies.

### 4.3 Client prediction & reconciliation (local player only)
- The client runs `playerMovementSystem` (the same function, imported from `sim`) on its own commands right away, and keeps a ring buffer of `(seq, command, resultingState)`.
- Each snapshot includes `lastProcessedSeq`. The client resets to the server state, replays the unacknowledged commands, and smooths any remaining error visually over about 100 ms.
- **Predicted cosmetics:** muzzle flash, recoil, ammo count, tracers and the start of the reload animation. **Server-confirmed:** hitmarkers, points, kills, purchases and pickups.

### 4.4 Interpolation (everyone else)
Remote entities render **100 ms in the past** (2 snapshots), interpolating between buffered snapshots. Extrapolation is capped at 150 ms when packets are lost.

### 4.5 Lag compensation
- The server stores **1 s of hitbox history** (30 ticks) for every zombie, using a compact capsule set (head, torso, limbs) per tick.
- A fire command carries the client's interpolation tick. The server rewinds the zombie hitboxes to that tick, raycasts, and applies damage at the current tick. The rewind is capped at 250 ms.
- Static world occlusion is always tested at the current geometry, since doors only ever open.

### 4.6 Rooms & lobby (apps/server)
- HTTP `POST /rooms` returns `{code}`. Codes are 5 characters with no ambiguous letters. `GET /rooms/:code` checks whether a room exists. The WebSocket upgrade to `/play?code=…` joins a room.
- A room is one `GameServer` with 1–4 slots, a host flag, a lobby state (pick the map, ready up) and an in-game state. An empty room closes after 30 s.
- **Reconnect:** a token is stored in sessionStorage. The slot stays reserved for 60 s, and points and inventory are restored.
- **Hosting:** any small VM or container platform (Fly.io, Railway, a VPS). A Dockerfile ships with the server. One Node process should handle 20+ rooms. If load grows, rooms can be spread across worker threads later.

### 4.7 Trust model
The server validates everything: movement speed is clamped, interaction range is checked, costs are checked against server points, fire rate is enforced against weapon RPM, and rewind is capped. This is a co-op game, so the aim is to stop griefing and accidental desyncs, not to build a full anti-cheat.

## 5. Collision & physics
- **Static world:** the map bake merges every collidable brush into one triangle mesh and builds a `MeshBVH`. The result is serialized to `*.collision.bin` and loaded by both the sim and the client.
- **Player controller:** a kinematic capsule. Each tick it uses BVH `shapecast` to move and slide (up to 4 iterations), step up 0.4 m, snap to slopes up to 45°, and check whether it's on the ground. The code is deterministic, has no allocations, and is shared with prediction.
- **Dynamic blockers:** closed doors and barricade windows are toggleable AABB colliders that live beside the BVH (a small list that's cheap to test). Opening a door removes its blocker and enables its nav link.
- **Zombies don't collide with the world through physics.** The Detour crowd keeps them on the navmesh, and the crowd's separation handles zombie-vs-zombie. Zombie-vs-player overlap is resolved by a cheap capsule push.
- **Hit detection:** first a ray against the BVH (world), then a broadphase against zombie bounding spheres, then the narrowphase against the capsule hitboxes. The nearest hit wins, and penetration continues through zombies.
- **Projectiles and gibs:** simple ballistic integration with BVH raycast sweeps. Gibs are client-only cosmetics.

## 6. AI & navigation

### 6.1 Navmesh
- `recast-navigation` generates the navmesh at bake time from the walkable geometry. It uses **tiled** navmesh so doors can toggle areas.
- **Area flags:** `DOOR_CLOSED` (disabled until the door opens), `WINDOW` (an off-mesh connection from outside the window to inside, used by the climb animation), `TUNNEL`, `JUMP` (an off-mesh link for Warden leaps).
- Zombie spawn points outside windows sit on small exterior nav islands that only connect inward through the window link.

### 6.2 Crowd
A `DetourCrowd` with up to 64 agents and separation turned on. Each tick, the AI system decides an agent's target, which can be a window's outside point, a barricade, the nearest reachable player, or a lure such as the Chatterbox or the Singularity.

### 6.3 Zombie state machine
```
Spawning ─► ToWindow ─► TearingBoards ─► Climbing ─► Chasing ◄─► Attacking
   │                                           ▲          │
   └──── (riser spawn) ────────────────────────┘          ▼
                                       Lured · Stunned · Frozen · Dying
```
- **Target choice:** the nearest player measured along the path, with re-evaluation spread out over ticks (each zombie re-checks every 0.5–1.0 s at a different offset). Downed players are ignored if anyone else is still standing.
- **Path cost control:** the crowd only does a full repath when the target moves more than 2 m, which keeps the cost down.

### 6.4 Rendering zombies at scale
Every part type (head variant, torso, arm…) is one `InstancedMesh`. Each frame the client evaluates every visible zombie's pose (clip sampling plus procedural layers) into per-instance matrices. With 42 zombies × 14 parts the draw-call count stays at about 20.

## 7. Rendering (apps/client)
- `Renderer` service: a Three `WebGLRenderer` with `powerPreference: high-performance`, a pixel-ratio cap from settings, `postprocessing` `EffectComposer` (bloom, vignette, LUT, noise) and a separate viewmodel pass.
- **Scene graph layout:** `world` (merged static chunks, instanced foliage), `entities` (views), `vfx` (pooled particles), `viewmodel` (separate scene).
- **Entity views:** a `ViewRegistry` maps each replicated entity kind to a `View` class with `create`, `update(interpState, dt)` and `dispose`. Views are pooled.
- **Quality presets:** Low (no shadows, no bloom, 0.75 render scale), Medium, High (shadows, bloom, outline pass).
- **Asset generation at boot:** every builder runs once behind a loading screen (target under 2 s). Results are cached in memory, and the same builders feed the map bake for collision-shaped props.

## 8. Audio (apps/client)
- `AudioEngine` sits on Web Audio. It has buses for master, sfx, music, voice/announcer and ui, plus a compressor on master.
- **SFX:** ZzFX-style parameter sets generated at boot into `AudioBuffer`s, with 3–5 variations per sound by jittering the parameters. Positional audio uses `PannerNode` (HRTF on High), with occlusion approximated as a lowpass when a ray to the listener hits world geometry.
- **Music:** generated stingers for round start and end, perk jingles as short procedurally sequenced melodies (one motif per perk), and an ambient drone bed per zone. Original full songs (such as the quest's Tape Deck song) can be added later as `.ogg` files, which ADR-007 allows.
- **Voice:** none in version 1. "Announcer" lines for power-ups are synthesized stingers and UI text instead.

## 9. UI (apps/client/ui)
- Preact components rendered into an overlay `<div>`. Game state reaches the UI through **signals** that the client updates from snapshots and events. There's no per-frame re-render: signals update only the DOM nodes that changed.
- **Screens:** Boot/Loading → Main Menu (Solo, Host, Join, Settings, Stats) → Lobby → In-game HUD → Pause/Settings → Game Over (stats table).
- **Input:** Pointer Lock plus keyboard and mouse, with Gamepad API support planned. Bindings come from a remappable settings table.

## 10. Content as data (`packages/content`)
```ts
export const viperSmg = defineWeapon({
  id: 'viper_smg', name: 'Viper SMG', class: 'smg',
  damage: { near: 35, far: 22, nearRange: 12, farRange: 35 },
  headMult: 2.0, penetration: 1, rpm: 750, fireMode: 'auto',
  mag: 30, reserve: 150, reloadTime: 2.1, swapTime: 0.6,
  spread: { hip: 4.5, ads: 0.8, move: 2.0 }, recoil: { kick: 0.9, pattern: 'viper' },
  wallCost: 1000, crateWeight: 10,
  forged: { id: 'venom_strike', name: 'Venom Strike', damageMult: 2.2, mag: 45, reserve: 270, augmentBias: 'frost' },
  art: { builder: 'smgCompact', seed: 3 }, sfx: { fire: 'smgLight' },
});
```
- `defineX` helpers give strong types. A unit test validates every content entry: ids are unique, referenced builders and sfx exist, and number ranges are sane.
- Formulas are plain exported functions with tests: `zombieHealth`, `totalZombies`, `spawnDelay`, `crateJesterChance`, and the others.

## 11. Map format & bake (`packages/maps`)
```ts
export default defineMap({
  id: 'blackwater', name: 'Blackwater Station', bounds: {...},
  terrain: { size: [260, 220], seed: 7, stamps: [...] },
  brushes: [ wall({...}), floorSlab({...}), stairs({...}), ... ],   // kit builders
  props:   [ prop('truck', {pos, yaw, seed}), ... ],
  zones:   [ { id: 'Z0', name: 'Gatehouse', volumes: [box(...)] }, ... ],
  doors:   [ { id: 'd_z0_z1', zones: ['Z0','Z1'], cost: 750, style: 'sliding', blocker: box(...) } ],
  windows: [ { id: 'w_z0_1', zone: 'Z0', frame: {...}, outsideSpawn: v3(...) } ],
  risers:  [ { zone: 'Z1', pos: v3(...) } ],
  wallBuys:[ { weapon: 'ranger_carbine', pos, yaw } ],
  perks:   [ { perk: 'second_wind', pos, yaw, needsPower: false } ],
  crateSpots: [...], forge: {...}, powerSwitch: {...}, traps: [...], zipline: {...},
  lights:  [...], playerSpawns: [...], quest: blackwaterQuest,
});
```
- **`pnpm map:bake blackwater`:**
  1. Runs every builder and merges collidable geometry.
  2. Builds the BVH and writes `collision.bin`.
  3. Generates the tiled navmesh with door and window areas and off-mesh links, and writes `nav.bin`.
  4. Bakes vertex AO and writes `render-chunks.bin` (optional cache).
  5. Validates the map: every zone has spawners, every door connects two zones, every window has a reachable outside spawn, all player spawns are on the navmesh, and every zone is reachable once all doors are open.
- **Dev:** the client hot-reloads map TS changes and runs a fast in-browser bake (without AO) so you can iterate quickly.

## 12. Testing strategy
| Layer | Tool | Examples |
|---|---|---|
| Formulas & content | Vitest | Health and count curves, crate odds, content validation |
| Systems | Vitest + headless `GameServer` | "Buying a door activates spawners", "a down with no perk in solo ends the game", "the Jester relocates the crate" |
| Simulation soak | `tools/balance-sim` | Bot players (aim-assisted AI) simulate rounds 1–30 and report the time to kill and the economy curve |
| Netcode | Vitest | Codec round-trips, delta correctness, prediction replay converging under simulated loss and lag |
| E2E | Playwright | Boot → solo → survive round 1. Two browser contexts join one room and both see each other. |
| Perf | Built-in perf HUD + scripted benchmark scene | 42 zombies, every effect firing, ≥ 60 FPS on the mid-tier target |

CI (GitHub Actions) runs lint, typecheck, unit tests, the map bake check and a headless Playwright smoke test.

## 13. Performance budgets
| Budget | Target |
|---|---|
| Sim tick (42 zombies, 4 players) | ≤ 4 ms in Node, ≤ 6 ms in the worker |
| Client frame (mid laptop, iGPU) | 60 FPS at 1080p Medium: ≤ 250 draw calls, ≤ 600k triangles |
| Boot to menu | ≤ 3 s (asset generation ≤ 2 s) |
| JS bundle | ≤ 1.5 MB gzipped including the WASM |
| Memory | ≤ 400 MB tab |
| Network | ≤ 12 KB/s down, ≤ 3 KB/s up per client |

## 14. Debug tooling
- A `lil-gui` panel (`~` key): spawn zombie, set round, give points, give weapon or perk, toggle power, god mode, timescale, show navmesh, show hitboxes, show zones, net stats.
- **Perf overlay:** FPS, frame time, draw calls, triangles, tick time, ping, snapshot size.
- **URL flags:** `?map=`, `?round=`, `?seed=`, `?netsim=lat,loss`, `?debug=1`.
- **Server console** commands, through stdin, to do the same things in multiplayer rooms (dev builds only).
