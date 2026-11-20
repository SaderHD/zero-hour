# Zero Hour — Implementation Plan

## How to use this plan
- The work is split into **milestones**, then **sessions**, then **steps**.
  - A **step** is the smallest unit of work. It has a **Done when** check that someone can verify, and gets one commit.
  - A **session** is a group of related steps that fits in one Claude Code session without quality dropping. Most have 2–4 steps, focus and art sessions have 1, and setup-heavy sessions such as M0-A have more small ones. There are **91 sessions**.
- **Starting a session:** open a fresh Claude Code session and say:
  > Do session **M5-C** from `docs/PLAN.md`.

  Claude reads `CLAUDE.md` and the relevant docs, implements the steps in that session in order, commits each step, ticks the boxes, and stops.
- **Session tags:**
  - 🎯 **focus session:** a hard or foundational step that gets a session to itself (controller, prediction, instancing, nav, netcode). Don't add extra work to these.
  - 🖼️ **art session:** visual iteration. Expect to go back and forth with screenshots, and commit a screenshot to `docs/screens/`.
  - 🎮 **playable checkpoint:** play for 10+ minutes, write down what feels bad, and fix the worst item before moving on.
- **End a session early** if Claude starts re-reading files it already read or forgetting decisions made earlier in the session. Commit, then continue in a fresh session from the first unticked step.
- **Combining is fine** for small adjacent sessions (for example M10-C + M10-D), but **never combine 🎯 sessions** with anything else.
- Do the work **in order within a milestone**. Milestones mostly depend on the one before. The places where you can deviate are noted below.
- Tick `[x]` and reference the step id in your commit, for example `[5.4] Navmesh bake for arena`.
- If a step grows past its session, split it into `5.4a`, `5.4b` in this file before you start.

**Global definition of done for every step:** `pnpm lint`, `pnpm typecheck` and `pnpm test` pass. Any new formula or system rule has a unit test. No literal gameplay numbers appear outside `packages/content`.

### Milestone overview
| # | Milestone | Outcome | Sessions |
|---|---|---|---|
| M0 | Foundation | Monorepo, tooling, CI | 1 |
| M1 | Render sandbox | A low-poly scene you can walk around in | 2 |
| M2 | Simulation core | ECS, tick loop, Worker transport | 2 |
| M3 | Player movement | Server-authoritative FPS movement with collision | 4 |
| M4 | Weapons v1 | Hitscan guns with viewmodels, reload, ammo | 3 |
| M5 | Zombies v1 | Navmesh AI zombies that chase, attack, take hits and die | 6 |
| M6 | Core loop | Rounds, points, barricades, downs: 🎮 **vertical slice** | 4 |
| M7 | Multiplayer | Online co-op with prediction, interpolation, lag compensation, lobby | 8 |
| M8 | Economy & map logic | Wall buys, doors, zones, power | 5 |
| M9 | Mystery Crate | The full crate system | 3 |
| M10 | Perks | All 9 perks | 4 |
| M11 | Power-ups | All 6 drops | 2 |
| M12 | Map 01 greybox | All of Blackwater, playable in grey | 9 |
| M13 | The Forge | Upgrades and augments | 3 |
| M14 | Special enemies | Howler rounds and the Warden | 3 |
| M15 | Wonder weapons & equipment | Ion Blaster, Arc Caster, Singularity, Cryo Lance, mines, Chatterbox | 5 |
| M16 | Traps & zipline | 3 traps and the zipline | 2 |
| M17 | Map 01 art pass | A dressing pass on each zone | 12 |
| M18 | Audio | The full soundscape | 3 |
| M19 | UI, menus, settings | A shippable front end | 3 |
| M20 | Main quest | "Last Broadcast" | 3 |
| M21 | Polish & release | Performance, balance, deployment | 4 |

**Possible parallel tracks:** after M6, art builder work (M17's kit pieces) can start in parallel with M7–M11. Audio (M18) can start any time after M4.

---

## M0 — Foundation

#### Session M0-A — Repo, tooling & CI (0.1–0.9)

- [x] **0.1 Monorepo skeleton.** Set up pnpm workspaces with `apps/client`, `apps/server`, `packages/{sim,content,maps,art}` and a root `package.json` with scripts. *Done when:* `pnpm install` works and each package has an `index.ts` that builds.
- [x] **0.2 TypeScript config.** Add a base `tsconfig` (strict, ES2022, bundler resolution) plus project references that enforce the dependency direction from ARCHITECTURE §2. *Done when:* `pnpm typecheck` passes, and importing `apps/client` from `sim` fails to compile.
- [x] **0.3 Biome lint and format.** Add the config and the `pnpm lint` / `pnpm format` scripts. *Done when:* lint runs clean across the repo.
- [x] **0.4 Import guard script.** Write `tools/check-imports.ts`, which fails if `packages/sim` imports DOM globals, `three/examples` renderers, `preact` or audio. *Done when:* a deliberately bad import fails the check and lint calls it.
- [x] **0.5 Vitest.** Add the workspace Vitest config and one sample test in `content`. *Done when:* `pnpm test` runs and passes.
- [x] **0.6 Vite client app.** Create an empty page with a full-window canvas and HMR working. *Done when:* `pnpm dev` serves a black canvas that resizes correctly.
- [x] **0.7 Server app stub.** A Node 24 + `tsx` watch script that starts an HTTP server on 7777 with a `/health` route. *Done when:* `pnpm dev:server` and `curl /health` return `ok`.
- [x] **0.8 CI workflow.** A GitHub Actions workflow running install, lint, typecheck and test on every push and PR. *Done when:* it shows green on the branch.
- [x] **0.9 Editor and docs hygiene.** Add `.editorconfig`, `.gitignore` and `.nvmrc`, and make sure the README's getting-started commands match the real scripts. *Done when:* a fresh clone works by following the README.

## M1 — Render sandbox

#### Session M1-A — Renderer, palette, primitives, materials (1.1–1.5)

- [x] **1.1 Renderer service.** `WebGLRenderer`, a resize handler, a pixel-ratio cap, and a render loop on `requestAnimationFrame`. *Done when:* a spinning cube renders at the display refresh rate.
- [x] **1.2 Palette module.** `packages/art/palette.ts` with the named colors from ART_DIRECTION §3, plus `color(name)`. *Done when:* a test confirms every name resolves and there are no duplicates.
- [x] **1.3 Primitive builders.** `box`, `wedge`, `cylinder`, `cone`, `icosphere` producing non-indexed geometry with flat normals and vertex colors. *Done when:* a debug scene shows each primitive flat-shaded in palette colors.
- [x] **1.4 Builder operators.** `translate/rotate/scale`, `merge`, `mirrorX`, `colorize`, seeded `jitter`. *Done when:* a "test crate" made from merged boxes renders as a single draw call.
- [x] **1.5 Shared materials.** A flat Lambert vertex-color material, plus an emissive variant that uses a per-vertex emissive mask attribute. *Done when:* a lamp prop glows while its post stays matte.

#### Session M1-B — Lighting, debug camera, post, perf overlay, arena (1.6–1.10)

- [x] **1.6 Lighting rig and fog.** A hemisphere light plus a moon directional light and exponential fog, with parameters exposed in `lil-gui`. *Done when:* you can tune the scene mood live.
- [x] **1.7 Free-fly debug camera.** WASD plus mouse look through Pointer Lock (client-only and temporary). *Done when:* you can fly around a test plane with scattered props.
- [x] **1.8 Post-processing.** Wire `postprocessing` with bloom (threshold on emissives), vignette and noise. *Done when:* the effects toggle on and off and emissives bloom.
- [ ] **1.9 Perf overlay.** FPS, frame ms, draw calls and triangles in a corner overlay. *Done when:* it's visible with `?debug=1`.
- [ ] **1.10 Test arena map (code-built).** A 40×40 m walled arena with a few boxes, a ramp and stairs, made from kit builders `wall`, `floorSlab`, `stairs`. *Done when:* you can fly through the arena and it looks on-style.

## M2 — Simulation core

#### Session M2-A — RNG, ECS, events, GameServer tick (2.1–2.5)

- [ ] **2.1 Seeded RNG.** `sim/rng.ts` with named streams. *Done when:* tests prove determinism and that the streams are independent.
- [ ] **2.2 ECS: entities and stores.** Entity allocation with generations, SoA numeric stores and map stores. *Done when:* tests cover create, destroy, reuse and stale-handle detection.
- [ ] **2.3 ECS: queries.** Cached archetype queries with `defineQuery`. *Done when:* tests show queries update correctly after component add and remove, and iterating 10k entities is benchmarked.
- [ ] **2.4 Event bus.** Typed events, per-tick drain, and a "net-relevant" flag. *Done when:* tests show events are delivered in order within a tick and cleared afterward.
- [ ] **2.5 GameServer and fixed tick.** `GameServer` with `tick()`, the system pipeline and a drift-corrected 30 Hz loop helper. *Done when:* a headless test runs 300 ticks and the tick counter is exact.

#### Session M2-B — Worker transport, codec, snapshots, view registry (2.6–2.9)

- [ ] **2.6 Transport interface and WorkerTransport.** Boot the sim in a Web Worker from the client and exchange ping and pong. *Done when:* the client logs round-trip times from the worker.
- [ ] **2.7 Bit codec.** `BitWriter`/`BitReader` with quantized floats, varints and angle packing. *Done when:* round-trip property tests pass.
- [ ] **2.8 Component net schemas and full snapshot.** Serialize every `Replicated` entity in full. The client decodes into a mirror world. *Done when:* a moving test entity in the worker shows up and moves on the client.
- [ ] **2.9 Client entity view registry.** `ViewRegistry` with pooled views per entity kind. *Done when:* spawning and despawning test entities in the sim creates and removes meshes on the client.

## M3 — Player movement

#### Session M3-A — Collision bake & input sampler (3.1–3.2)

- [ ] **3.1 Collision bake (arena).** Merge collidable arena geometry into a BVH, serialize it and load it in both the sim and the client. *Done when:* a debug raycast from the camera hits walls on the client using the loaded BVH.
- [ ] **3.2 Input sampler.** Keyboard and mouse into a `PlayerCommand` (axes, yaw/pitch, button bits, seq) at the tick rate. *Done when:* the commands stream to the worker, and the debug panel shows them.

#### Session M3-B — Kinematic capsule controller (3.3–3.4) · 🎯 focus session

- [ ] **3.3 Kinematic capsule controller.** Shapecast move-and-slide, gravity and ground detection in `sim/movement.ts`. *Done when:* a server-side player capsule walks the arena and can't pass through walls (shown by a debug capsule mesh).
- [ ] **3.4 Steps, slopes and jump.** Step up 0.4 m, slope limit 45°, jump to a 1.0 m apex. *Done when:* the player climbs the arena stairs and ramp and jumps onto a 0.9 m crate.

#### Session M3-C — Sprint/crouch & first-person camera (3.5–3.6)

- [ ] **3.5 Sprint, crouch and stamina.** Speeds and stamina from `content/player.ts`. *Done when:* sprint runs out after 4 s and crouch lowers the camera and capsule.
- [ ] **3.6 First-person camera.** The camera follows the replicated player, with a head bob and landing dip. *Done when:* walking the arena feels like an FPS (the free-fly camera is now debug-only).

#### Session M3-D — Client prediction & movement tuning (3.7–3.9) · 🎯 focus session

- [ ] **3.7 Local prediction.** The client runs the same movement function and reconciles against `lastProcessedSeq`. *Done when:* with `?netsim=150,0` movement still feels instant and reconciles without visible snapping.
- [ ] **3.8 Prediction tests.** Feed recorded commands through server and client paths and check the final state matches within epsilon. *Done when:* the test passes with simulated 5% loss.
- [ ] **3.9 Movement tuning pass.** Expose acceleration, friction and air control in `lil-gui`, then save the good values to content. *Done when:* the values are committed and you've played with them for 10 minutes.

## M4 — Weapons v1

#### Session M4-A — Weapon data, inventory, hitscan, spread, reload (4.1–4.5)

- [ ] **4.1 Weapon content schema.** `defineWeapon` types plus three entries: P-11, Ranger Carbine, Viper SMG. *Done when:* the content validation test passes.
- [ ] **4.2 Inventory component.** Slots, active index, mag and reserve ammo, swap timing. *Done when:* the 1/2/scroll keys swap with the swap delay, and the HUD debug text shows ammo.
- [ ] **4.3 Hitscan firing against the world.** Fire-rate gate, ray from the eye, hit on the BVH, impact event. *Done when:* shooting walls spawns a dust puff at the hit point (client effect driven by the event).
- [ ] **4.4 Fire modes, spread and recoil.** Semi and auto, hip/ADS/move spread cones, a recoil pattern applied to the view. *Done when:* the SMG sprays a learnable pattern and ADS tightens the spread.
- [ ] **4.5 Reload and ammo rules.** A reload timer, cancelling a reload by swapping, auto-reload on an empty mag. *Done when:* ammo counts are right in every edge case (unit tests).

#### Session M4-B — Viewmodels & weapon animation (4.6–4.9)

- [ ] **4.6 Viewmodel pass.** A second scene, its own FOV, depth cleared, and a builder for the P-11 viewmodel. *Done when:* the pistol renders and never clips into walls.
- [ ] **4.7 Viewmodel procedural animation.** Sway, bob, recoil spring, ADS lerp, sprint tilt. *Done when:* the pistol feels alive and ADS lines up the sights at screen center.
- [ ] **4.8 Reload and swap clips.** A keyframe clip system for viewmodel parts, with mag-drop and raise/lower clips. *Done when:* the reload visibly removes and inserts the magazine, synced to the reload time.
- [ ] **4.9 Weapon builders: Ranger and Viper.** Two more viewmodels and world models using sockets. *Done when:* all three starting weapons render as viewmodels and as world models.

#### Session M4-C — VFX, placeholder SFX, melee, grenades (4.10–4.13)

- [ ] **4.10 Muzzle flash, tracers and impacts.** Pooled VFX with a flash light pulse. *Done when:* firing has strong visual feedback, and 100 tracers per second is still under 1 ms.
- [ ] **4.11 Placeholder SFX.** A ZzFX-backed `AudioEngine` stub with fire, reload, dry-fire and impact sounds. *Done when:* every weapon action makes a sound and the audio unlocks on the first click.
- [ ] **4.12 Melee.** A knife slash (short cone check, 150 dmg) with a viewmodel swing. *Done when:* melee hits a debug target dummy.
- [ ] **4.13 Frag grenades.** Cook, throw arc, bounce, explosion radius with falloff, a self-damage hook. *Done when:* a cooked grenade explodes at the right time and damages a dummy by distance.

## M5 — Zombies v1

#### Session M5-A — Zombie rig & animation clips (5.1–5.2)

- [ ] **5.1 Zombie part builders.** A segmented rig (14 parts) from primitives, with seeded variety (height, head, clothing colors). *Done when:* 10 different zombies stand in a lineup.
- [ ] **5.2 Animation clip format and walk cycle.** Part rotation curves as data, a sampler, and `walk` and `idle` clips. *Done when:* a zombie walks in place convincingly.

#### Session M5-B — Instanced part rendering (5.3) · 🎯 focus session

- [ ] **5.3 Instanced part rendering.** One InstancedMesh per part type, with poses written to instance matrices. *Done when:* 42 animated zombies render in about 20 draw calls at 60 FPS.

#### Session M5-C — Navmesh bake & Detour crowd (5.4–5.5) · 🎯 focus session

- [ ] **5.4 Navmesh bake (arena).** Recast generation in the bake script, a binary written out, and loading in the sim. *Done when:* a navmesh debug overlay renders over the arena.
- [ ] **5.5 Detour crowd in the sim.** Add and remove agents, set targets, write positions back to `Transform`. *Done when:* debug-spawned zombies walk to a clicked point while avoiding each other.

#### Session M5-D — Chase/attack AI, player health, hitboxes (5.6–5.8)

- [ ] **5.6 Chase and attack AI.** Target the nearest player along the path, staggered repaths, attack windup, damage event. *Done when:* zombies chase the player and hit for 50 with the attack animation.
- [ ] **5.7 Player health and regen.** Damage, the regen delay, a red-edge damage vignette. *Done when:* two hits takes the player to 0 (handled as a debug "dead" log until M6).
- [ ] **5.8 Hitboxes and hit zones.** A capsule set per zombie that follows the animated pose, with zone multipliers. *Done when:* the debug view shows the hitboxes, and headshots deal the multiplied damage (unit tested).

#### Session M5-E — Death, hit reactions, dismemberment (5.9–5.11)

- [ ] **5.9 Zombie damage and death.** Health from content, a death event, a death clip into ragdoll-lite, and a fade-out. *Done when:* shooting a zombie kills it and the body tumbles and then fades.
- [ ] **5.10 Hit reactions and blood.** A stumble additive, blood particles, decals. *Done when:* hits read clearly at 20 m.
- [ ] **5.11 Dismemberment.** Arm and leg detach on threshold damage or explosions. Losing the legs switches the zombie to the crawler state. *Done when:* a grenade can turn a zombie into a crawler that keeps chasing.

#### Session M5-F — Speed tiers & overlap push (5.12–5.13)

- [ ] **5.12 Speed tiers.** Walk, run and sprint clips plus speed values from the round formula input. *Done when:* the debug panel can spawn each tier and they look different.
- [ ] **5.13 Player and zombie overlap push.** Cheap capsule separation so players can't stand inside zombies. *Done when:* a horde physically body-blocks the player.

## M6 — Core loop (🎮 vertical slice)

#### Session M6-A — Round formulas, director, spawners, barricades (sim) (6.1–6.4)

- [ ] **6.1 Round formulas.** `zombieHealth`, `totalZombies`, `maxAlive`, `spawnDelay`, `speedRoll` in content, with table tests. *Done when:* the tests match the GDD §4.2 sample values.
- [ ] **6.2 Director round state machine.** Pre-round, active, round-end and break states, plus round events. *Done when:* the console logs the round flow while debug-killing zombies.
- [ ] **6.3 Spawn queue and spawners.** Ground risers with the `riseFromGround` clip, respecting the max-alive cap and spawn delay. *Done when:* round 1 spawns exactly 6 zombies through risers.
- [ ] **6.4 Barricade windows (sim).** A board count, a tear timer, a zombie state that goes to the window, and the climb as a nav off-mesh link. *Done when:* zombies spawn outside, tear down all 6 boards and climb in.

#### Session M6-B — Barricade visuals/repair, points, HUD (6.5–6.8)

- [ ] **6.5 Barricade visuals.** Board sockets, a tear-off animation (the board flies off), the climb clip. *Done when:* window assaults look correct.
- [ ] **6.6 Barricade repair.** A hold-to-repair interaction, the per-board timer, the slam stun chance. *Done when:* the player can rebuild boards while zombies are tearing them.
- [ ] **6.7 Points system.** The award table, Double Pay hook, repair cap, and `PointsAwarded` events. *Done when:* each kill type gives the right points (unit tests) and "+N" pops up.
- [ ] **6.8 Minimal HUD.** Round counter, points, ammo, interact prompt (Preact and signals). *Done when:* the HUD updates live without per-frame renders.

#### Session M6-C — Downs, recycling, round transitions, restart (6.9–6.12)

- [ ] **6.9 Downed state (solo).** At 0 HP the player goes down, gets the last-stand pistol and crawls, and in solo without Second Wind the game ends. *Done when:* dying shows a Game Over panel with the round reached.
- [ ] **6.10 Zombie recycling and last-zombie rule.** Stranded zombies are despawned and requeued, and the last zombies are forced to run. *Done when:* a test confirms the round can't soft-lock.
- [ ] **6.11 Round transition presentation.** Counter animation, a stinger SFX placeholder, frag refill. *Done when:* moving from one round to the next feels like an event.
- [ ] **6.12 Restart flow.** Game Over leads to Restart, which reseeds and resets the world. *Done when:* you can play 5 games in a row without reloading the page or leaking memory (check the heap).

#### Session M6-D — 🎮 Vertical slice playtest & fixes (6.13)

- [ ] **6.13 🎮 Vertical slice playtest.** Arena, pistol plus 2 guns placed on the floor as debug pickups, rounds 1–10. *Done when:* written playtest notes exist, and the top 3 issues are fixed or ticketed in this plan.

## M7 — Multiplayer

#### Session M7-A — Server loop, rooms API, WebSocket join, WsTransport (7.1–7.4)

- [ ] **7.1 Server tick loop.** Run `GameServer` in Node with the 30 Hz loop and a per-room instance. *Done when:* a headless room ticks with stable timing (logged jitter under 2 ms).
- [ ] **7.2 Room HTTP API.** `POST /rooms` and `GET /rooms/:code`, with room codes. *Done when:* curl can create and look up rooms.
- [ ] **7.3 WebSocket join flow.** `Hello`/`Welcome`, slot assignment, full initial snapshot. *Done when:* a browser can join a room and render the world.
- [ ] **7.4 WsTransport on the client.** The same interface as WorkerTransport, chosen by game mode. *Done when:* the same client build plays solo in the worker or online by URL flag.

#### Session M7-B — Multiple players & remote player view (7.5–7.6)

- [ ] **7.5 Multiple players in the sim.** Up to 4 player entities and per-player command queues. *Done when:* two browser tabs move independently and can see each other.
- [ ] **7.6 Remote player view.** Third-person low-poly survivor model (rigid parts), animation state from velocity, a held world weapon. *Done when:* the other player visibly walks, runs, crouches and aims.

#### Session M7-C — Snapshot interpolation (7.7) · 🎯 focus session

- [ ] **7.7 Snapshot interpolation.** Buffer snapshots and render remote entities 100 ms behind. *Done when:* remote players and zombies move smoothly under `netsim 120,2`.

#### Session M7-D — Delta snapshots & reliable events (7.8–7.9) · 🎯 focus session

- [ ] **7.8 Delta snapshots and acks.** Baseline tracking per client and changed-fields-only encoding. *Done when:* the logged downstream rate is ≤ 12 KB/s with 42 zombies.
- [ ] **7.9 Reliable event channel.** Ordered event batches with acks and resend on reconnect. *Done when:* no point popups or sounds are lost under simulated loss.

#### Session M7-E — Lag-compensated hitscan (7.10) · 🎯 focus session

- [ ] **7.10 Lag-compensated hitscan.** A hitbox history ring and rewind to the client interp tick, capped at 250 ms. *Done when:* at 150 ms simulated ping, shots on a strafing zombie register where they were aimed (manual test plus a unit test).

#### Session M7-F — Co-op scaling, downs & revives, indicators (7.11–7.13)

- [ ] **7.11 Co-op scaling.** Player count feeds into zombie count, max alive and Warden health. *Done when:* the formula tests cover p = 1..4.
- [ ] **7.12 Co-op downs and revives.** Bleedout timer, hold-to-revive, points penalty, death, spectating, respawn next round, game over when everyone is down. *Done when:* the full down/revive/die cycle works with 2 tabs.
- [ ] **7.13 Downed indicators.** World and edge-of-screen icons, bleedout ring, revive progress UI. *Done when:* you can find a downed teammate anywhere on the map.

#### Session M7-G — Lobby UI & reconnect (7.14–7.15)

- [ ] **7.14 Lobby UI.** Host gives a code, join takes a code, a ready-up list, the host starts the game. *Done when:* two people on different machines start a game together.
- [ ] **7.15 Reconnect.** Token, slot held for 60 s, state restored. *Done when:* refreshing mid-game rejoins with the same points and weapons.

#### Session M7-H — Server validation, deploy, 🎮 co-op playtest (7.16–7.17)

- [ ] **7.16 Server validation.** Speed clamp, interaction range, fire-rate enforcement, cost checks. *Done when:* tests send malicious commands and the server rejects them.
- [ ] **7.17 Deploy a test server.** A Dockerfile and a one-command deploy to a small host. *Done when:* friends can join over the internet. 🎮 Run a co-op playtest of the arena slice.

## M8 — Economy & map logic

#### Session M8-A — Interactables, zones, doors (sim) (8.1–8.3)

- [ ] **8.1 Interactable framework.** A component with prompt, cost, radius, hold time, enabled, and a server purchase transaction (check points → deduct → effect → event). *Done when:* a debug "buy box" interactable works in solo and multiplayer.
- [ ] **8.2 Zone system.** Zone volumes, tracking which zone each player is in, an active-zone calculation. *Done when:* the debug overlay colors active zones as players move.
- [ ] **8.3 Doors and debris (sim).** A door connects two zones. Buying it removes the blocker collider, enables the nav area and activates the zone. *Done when:* zombies only path through doors that have been bought.

#### Session M8-B — Door visuals & zone-driven spawning (8.4–8.5)

- [ ] **8.4 Door visuals.** Sliding, swing, double and hatch animations, and the debris dust collapse. *Done when:* each style animates in the arena test build.
- [ ] **8.5 Zone-driven spawning.** The director only picks spawners in active zones, weighted against the ones nearest the player. *Done when:* a test confirms no spawns from closed zones.

#### Session M8-C — Wall buys & chalk decals (8.6–8.7)

- [ ] **8.6 Wall buys (sim).** Buy a weapon or its ammo, with the full-slots replacement rule. *Done when:* the rules are unit tested, including ammo rebuys and Forged ammo prices.
- [ ] **8.7 Chalk outline decal.** Generate a wall decal from the weapon silhouette, plus the pop-out animation on purchase. *Done when:* wall buys look on-style and readable.

#### Session M8-D — Weapon roster parts 1 & 2 (8.8–8.9)

- [ ] **8.8 Fill out the weapon roster (data plus builders, part 1).** Thresher Pump, Twin Fang (shotgun pellets), Tempest SMG. *Done when:* each weapon is usable with a correct viewmodel and stats.
- [ ] **8.9 Weapon roster part 2.** Kestrel AR, Marksman DMR (penetration), Hunting Blade. *Done when:* the same.

#### Session M8-E — Power switch & light cascade (8.10–8.11)

- [ ] **8.10 Power switch and global power state.** The lever interaction, the `PowerOn` event, and `needsPower` gating on interactables. *Done when:* power-gated debug machines turn on when the switch is thrown.
- [ ] **8.11 Power-on light cascade.** Light groups turn on in sequence, emissives change, the fog/LUT shifts. *Done when:* throwing the switch is a visual moment in the arena test.

## M9 — Mystery Crate

#### Session M9-A — Crate odds & state machine (9.1–9.2)

- [ ] **9.1 Crate odds module.** The pool filter, weights, wonder weapon pity, the Jester chance curve, as pure functions. *Done when:* a statistical test over 100k rolls matches the GDD §10 expectations.
- [ ] **9.2 Crate locations and state machine.** Idle, rolling, presenting, taken or expired, Jester, moving. *Done when:* headless tests cover the whole lifecycle.

#### Session M9-B — Crate visuals, roll, take/expire, Jester (9.3–9.6)

- [ ] **9.3 Crate model and beacon.** Builder (gold-trimmed crate), the lid animation, a light pillar at the active location. *Done when:* you can see the crate from across the arena.
- [ ] **9.4 Roll presentation.** Weapon silhouettes cycle above the crate, then the result floats and bobs with a 12 s timer. *Done when:* a roll looks and sounds exciting.
- [ ] **9.5 Take and expire rules.** Only the buyer can take it, it expires after 12 s, the slot rules apply. *Done when:* the co-op ownership test passes.
- [ ] **9.6 Jester and relocation.** The Jester animation, the refund, the crate flies away, it reappears somewhere new after 8 s. *Done when:* moves happen within the expected use counts.

#### Session M9-C — Crate-only weapons (9.7–9.8)

- [ ] **9.7 Crate-only weapons batch 1.** Bulldog .44, Hornet PDW, Brute LMG. *Done when:* they're in the pool and usable.
- [ ] **9.8 Crate-only weapons batch 2.** Hailstorm, Longshot (bolt cycling plus scope overlay), Boomer GL (projectile). *Done when:* they're in the pool and usable.

## M10 — Perks

#### Session M10-A — Perk framework, machines, HUD caps (10.1–10.3)

- [ ] **10.1 Perk framework.** `PerkSet` bits, the perk limit, buy validation, the drink animation (no firing for 2.5 s), loss on down. *Done when:* unit tests cover limit and loss.
- [ ] **10.2 Perk machine builder.** A parameterized machine: color, silhouette variant, emblem glyph, lit/unlit states. *Done when:* all 9 machines render distinctly.
- [ ] **10.3 HUD perk caps.** SVG caps in the perk colors. *Done when:* bought perks appear in the HUD.

#### Session M10-B — Ironhide, Quickhand, Second Wind, Twin Trigger, Long Stride (10.4–10.6)

- [ ] **10.4 Ironhide Stout and Quickhand Tonic.** Max HP 250, faster reload and swap. *Done when:* the effects are measurable in tests.
- [ ] **10.5 Second Wind Soda.** Co-op revive speed, solo self-revive with 3 uses. *Done when:* the solo self-revive flow works and the 4th down ends the game.
- [ ] **10.6 Twin Trigger Tonic and Long Stride Seltzer.** Fire rate +33%, unlimited sprint plus speed. *Done when:* tested.

#### Session M10-C — Blast Shield, Pack Mule, Steady Eye (10.7–10.9)

- [ ] **10.7 Blast Shield Bitters.** Explosion and fall immunity, and the slide-dive blast (adds a slide move to the controller). *Done when:* own grenades do no damage and a slide off a ledge triggers the blast.
- [ ] **10.8 Pack Mule Malt.** A third slot, with the third weapon lost on down. *Done when:* tested.
- [ ] **10.9 Steady Eye Elixir.** Reduced hip spread, headshot bonus, aim snap to the head when ADS. *Done when:* tested.

#### Session M10-D — Static Spark & perk jingles (10.10–10.11)

- [ ] **10.10 Static Spark Soda.** A reload shock pulse scaled by how empty the mag was, with a cooldown. *Done when:* tested, and the VFX reads clearly.
- [ ] **10.11 Perk jingles (placeholder).** A short generated motif per machine when nearby or when bought. *Done when:* each machine has its own sound.

## M11 — Power-ups

#### Session M11-A — Drop logic, pickups, first 3 power-ups (11.1–11.3)

- [ ] **11.1 Drop logic.** 2% chance, the per-round cap, the shuffled bag, the pity rule, no Purge in early rounds. *Done when:* statistical and unit tests pass.
- [ ] **11.2 Drop pickup entity and visuals.** A spinning glyph, light beam, ground ring, blink at the end, 25 s lifetime. *Done when:* drops are readable and collectable by walking over them.
- [ ] **11.3 Full Resupply, Double Pay and One Shot.** Effects plus HUD timers. *Done when:* tested.

#### Session M11-B — Purge, Rebuild, Clearance, stingers (11.4–11.6)

- [ ] **11.4 Purge and Rebuild.** Kill all with a screen flash and points, repair all barricades. *Done when:* tested, including that Purge kills don't count toward kill stats.
- [ ] **11.5 Clearance.** Every crate location active at 10 points, no Jester. *Done when:* tested, and the presentation is clear.
- [ ] **11.6 Power-up announcer stingers.** A distinct generated stinger for each drop. *Done when:* each drop sounds different.

## M12 — Map 01 greybox (Blackwater Station)

All of these steps build in grey with the kit builders and no dressing. Follow MAP_01 §3–4 for layout and contents.

#### Session M12-A — Map module, bake validation, terrain (12.1–12.3)

- [ ] **12.1 Map module and bake CLI.** `packages/maps/blackwater` scaffold, `pnpm map:bake blackwater`, map selection with `?map=`. *Done when:* an empty Blackwater loads.
- [ ] **12.2 Map validation pass in the bake.** The checks from ARCHITECTURE §11, step 5. *Done when:* a broken door reference fails the bake with a clear message.
- [ ] **12.3 Terrain heightfield.** Simplex terrain, flatten/path stamps, slope-blended vertex colors, collision and nav included. *Done when:* the site footprint is flattened and the observatory hill exists.

#### Session M12-B — Greybox Z0–Z2 (12.4–12.5)

- [ ] **12.4 Greybox Z0 Gatehouse.** Walls, 4 windows, spawn points, wall buy spots, Second Wind spot. *Done when:* round 1 is playable inside Z0.
- [ ] **12.5 Greybox Z1 Motor Pool and Z2 Barracks (both floors).** Including the 750 doors and debris, plus stairs. *Done when:* both zones open from Z0 and zombies path into them.

#### Session M12-C — Greybox Z3–Z4 (12.6–12.7)

- [ ] **12.6 Greybox Z3 Mess Hall.** Tables as obstacles, kitchen, doors from Z1 and Z2. *Done when:* it's playable, and both routes into Z3 work.
- [ ] **12.7 Greybox Z4 Courtyard.** Outdoor hub, flagpole ring planter, 6 risers, upper walkway drop from Z2. *Done when:* both Route A and Route B reach the hub.

#### Session M12-D — Greybox Z5–Z7 (12.8–12.9)

- [ ] **12.8 Greybox Z5 Generator House and Z6 Radio Room.** Catwalk, power switch, tower stairs to the zipline start. *Done when:* power can be turned on in the real map.
- [ ] **12.9 Greybox Z7 Service Tunnels.** The −4 m tunnel network, hatch ladder from the Courtyard, links to Z8 and Z9. *Done when:* you can walk the tunnels and zombies path through them.

#### Session M12-E — Greybox Z8–Z9 (12.10–12.11)

- [ ] **12.10 Greybox Z8 Laboratory Wing.** Main hall, cells, Forge spot, workbench spot. *Done when:* it's reachable via Z6 and Z7.
- [ ] **12.11 Greybox Z9 Hangar.** Big interior, plane wreck blockout, roof skylight, bay doors to Z10. *Done when:* it's playable, and the plane loop works for training.

#### Session M12-F — Greybox Z10–Z11 (12.12–12.13)

- [ ] **12.12 Greybox Z10 Lakeside & Pine Woods.** Meadow, boathouse, dock, lake edge kill/blocker volume, boundary pine ring. *Done when:* a full outdoor loop from the Hangar to the Lab yard works.
- [ ] **12.13 Greybox Z11 Observatory.** Switchback path, gated entrance, dome interior with crank spots. *Done when:* it opens from Z10 after power for 2000.

#### Session M12-G — Place all gameplay entities & spawn tuning (12.14–12.15)

- [ ] **12.14 Place all gameplay entities.** Wall buys, perks, crate spots C1–C6, doors with costs, windows, risers as in the MAP_01 tables. *Done when:* a bake report lists counts that match the doc.
- [ ] **12.15 Zone adjacency and spawn tuning.** Make sure zone activation feels right on the real map: no spawns in view, no long empty walks. *Done when:* a solo run to round 10 with written notes.

#### Session M12-H — Navmesh quality pass (12.16) · 🎯 focus session

- [ ] **12.16 Navmesh quality pass.** Fix stuck spots, bad off-mesh links, tunnel ladders, stairs. *Done when:* a 30-minute automated bot soak shows zero stuck-zombie recycles caused by nav errors.

#### Session M12-I — 🎮 Greybox full playtest & fixes (12.17)

- [ ] **12.17 🎮 Greybox full playtest (solo and co-op).** Open the whole map, compare against the MAP_01 §6 pacing targets. *Done when:* playtest notes exist and costs and layouts are adjusted.

## M13 — The Forge

#### Session M13-A — Forge machine, data, model, forged look (13.1–13.4)

- [ ] **13.1 Forge state machine.** Insert, working (3 s), ready (15 s), owner-only pickup, power gate. *Done when:* tested.
- [ ] **13.2 Forged weapon data.** A `forged` block on every weapon, applied stat multipliers, renamed variants. *Done when:* the content validation test requires every gun to have a forged block.
- [ ] **13.3 Forge model and animation.** An anvil-press machine with glowing coals, a hammering cycle, the weapon sliding out. *Done when:* using it looks great.
- [ ] **13.4 Forged weapon look.** Palette swap, emissive seams, muzzle embers. *Done when:* forged weapons are recognizable at a glance in first and third person.

#### Session M13-B — Augment framework, Shock & Fire (13.5–13.6)

- [ ] **13.5 Augment framework.** Proc chance, per-player cooldown, augment selection with bias. *Done when:* tested.
- [ ] **13.6 Augments: Shock and Fire.** Arc chains, ground fire areas with VFX. *Done when:* each works and stays within budget at 42 zombies.

#### Session M13-C — Frost & Blast augments, reroll (13.7–13.8)

- [ ] **13.7 Augments: Frost and Blast.** Slow and freeze stacks, explosion procs. *Done when:* the same.
- [ ] **13.8 Reroll.** Pay 2500 to reroll to a guaranteed different augment. *Done when:* tested.

## M14 — Special enemies

#### Session M14-A — Howler rounds (14.1–14.4)

- [ ] **14.1 Special round scheduling.** First Howler round on 5–7, then every 4–6, decided by the seeded RNG. *Done when:* tested.
- [ ] **14.2 Howler builder and animation.** A lean quadruped rig with a run cycle and lunge. *Done when:* a pack of 12 runs smoothly.
- [ ] **14.3 Howler AI.** Fast chase, flanking offsets, lunge attack, ignoring barricades. *Done when:* a Howler round is dangerous and fair.
- [ ] **14.4 Howler round presentation.** Fog and LUT shift, lightning arrival strikes, a howl SFX, a guaranteed Full Resupply at the end. *Done when:* the round feels distinct from normal rounds.

#### Session M14-B — Warden model, scheduling, combat (14.5–14.7)

- [ ] **14.5 Warden builder and animations.** Armored brute, lantern-hammer, slam, charge, leap clips. *Done when:* the model reads as a threat from 30 m.
- [ ] **14.6 Warden spawn scheduling and health.** First on round 12 ± 2, then every 5–8 rounds, health formula, breakable helmet. *Done when:* tested.
- [ ] **14.7 Warden combat.** Slam AoE with slow, leap through JUMP links. *Done when:* the fight works in multiple zones.

#### Session M14-C — Warden machine disable & presentation (14.8–14.9)

- [ ] **14.8 Warden machine disable.** Charges at powered machines, disables them for 60 s, paid relight. *Done when:* tested for perks, the Forge and traps.
- [ ] **14.9 Warden spawn and death presentation.** Bell toll, light flicker, guaranteed drop plus 500 points. *Done when:* it feels like a boss moment.

## M15 — Wonder weapons & equipment

#### Session M15-A — Ion Blaster & Arc Caster (15.1–15.2)

- [ ] **15.1 Ion Blaster.** Projectile bolts, splash, self-damage, Forged variant. *Done when:* usable from the crate.
- [ ] **15.2 Arc Caster.** Chain-target selection, lightning ribbon VFX, the round-25 falloff rule. *Done when:* chains hit up to 6 targets and the Forged variant hits 10.

#### Session M15-B — Singularity Launcher (15.3–15.4)

- [ ] **15.3 Singularity Launcher (sim).** Orb projectile, vortex pull force on zombies (nav override), kill on contact, player pushback. *Done when:* tested.
- [ ] **15.4 Singularity VFX.** Black sphere, rim glow, particle spiral, optional distortion. *Done when:* it's a highlight moment.

#### Session M15-C — Tripwire Mine & Chatterbox (15.5–15.6)

- [ ] **15.5 Tripwire Mine.** Placement validation, 2 placed max, trigger radius, refill. *Done when:* tested.
- [ ] **15.6 Chatterbox.** Throwable, lure state for zombies within 25 m, music, explosion. *Done when:* it can save a player who's cornered.

#### Session M15-D — Cryo Lance (15.7–15.9)

- [ ] **15.7 Cryo Lance parts and workbench (sim).** Seeded part spawns, pickup (shared in co-op), workbench crafting state. *Done when:* tested.
- [ ] **15.8 Cryo Lance weapon.** Channel beam cone, slow-to-freeze, shatter rules, self-recharge. *Done when:* usable and balanced against the Arc Caster.
- [ ] **15.9 Frost VFX.** Crystal growth on frozen zombies, shatter shards. *Done when:* it reads clearly with 20 frozen zombies on screen.

#### Session M15-E — Wonder weapon Forge upgrades (15.10)

- [ ] **15.10 Wonder weapon Forge upgrades.** Ion Storm, Arc Tempest, Event Horizon, Absolute Zero. *Done when:* each one upgrades with its distinct behavior.

## M16 — Traps & zipline

#### Session M16-A — Trap framework & 3 traps (16.1–16.4)

- [ ] **16.1 Trap framework.** Activation cost, active and cooldown timers, kill volume, power gate, the Ironhide damage rule. *Done when:* tested.
- [ ] **16.2 Electric fence trap (Z7).** Arcing VFX, a buzz sound. *Done when:* it works on Blackwater.
- [ ] **16.3 Turbine fan trap (Z9).** A spinning blade, gibs zombies, pushes players back. *Done when:* it works on Blackwater.
- [ ] **16.4 Flame vent trap (Z4).** Fire jets plus burn status. *Done when:* it works on Blackwater.

#### Session M16-B — Zipline (16.5–16.6)

- [ ] **16.5 Zipline (sim).** A spline ride, mount and dismount, can shoot while riding, costs 250 with power. *Done when:* a player can ride from Z6 to Z10 in solo and multiplayer.
- [ ] **16.6 Zipline presentation.** Cable mesh, trolley, camera tilt, whirring SFX. *Done when:* the ride feels good.

## M17 — Map 01 art pass

Each step dresses one or two zones to ART_DIRECTION standards. Each one is done when the zone hits its triangle budget, has its lighting placed, and has a screenshot committed to `docs/screens/`.

#### Session M17-A — Kit v2 & prop builders (17.1–17.3)

- [ ] **17.1 Kit builders v2.** Bevel-lite, jitter, trim pieces, windows with frames, doors with detail. *Done when:* the kit gallery scene looks on-style.
- [ ] **17.2 Prop builders batch 1.** Crate, barrel, sandbags, table, bunk, locker, lamp variants. *Done when:* they're in the gallery.
- [ ] **17.3 Prop builders batch 2.** Truck, generator, console desk, fence, rock, pine tree variants, boat, dish, plane wreck. *Done when:* they're in the gallery.

#### Session M17-B — Vertex AO, chunking/instancing, sky & water (17.4–17.6)

- [ ] **17.4 Vertex AO bake.** Added to the map bake. *Done when:* a before/after screenshot shows grounded geometry.
- [ ] **17.5 Static chunk merging and foliage instancing.** *Done when:* the whole map stays within ARCHITECTURE §13 budgets with greybox plus foliage.
- [ ] **17.6 Sky dome, stars, moon, lake water shader** (a simple vertex wave plus a fresnel tint). *Done when:* the outdoor mood matches the map doc.

#### Session M17-C — Dress Z0–Z1 (17.7) · 🖼️ art session

- [ ] **17.7 Dress Z0 Gatehouse and Z1 Motor Pool.**

#### Session M17-D — Dress Z2–Z3 (17.8) · 🖼️ art session

- [ ] **17.8 Dress Z2 Barracks and Z3 Mess Hall.**

#### Session M17-E — Dress Z4 (17.9) · 🖼️ art session

- [ ] **17.9 Dress Z4 Courtyard.**

#### Session M17-F — Dress Z5–Z6 (17.10) · 🖼️ art session

- [ ] **17.10 Dress Z5 Generator House and Z6 Radio Room/Comms Tower.**

#### Session M17-G — Dress Z7 (17.11) · 🖼️ art session

- [ ] **17.11 Dress Z7 Service Tunnels.**

#### Session M17-H — Dress Z8 (17.12) · 🖼️ art session

- [ ] **17.12 Dress Z8 Laboratory Wing.**

#### Session M17-I — Dress Z9 (17.13) · 🖼️ art session

- [ ] **17.13 Dress Z9 Hangar.**

#### Session M17-J — Dress Z10 (17.14) · 🖼️ art session

- [ ] **17.14 Dress Z10 Lakeside & Pine Woods.**

#### Session M17-K — Dress Z11 (17.15) · 🖼️ art session

- [ ] **17.15 Dress Z11 Observatory.**

#### Session M17-L — Lighting states & survivor polish (17.16–17.17)

- [ ] **17.16 Lighting states.** Power off and power on light groups for every zone, plus the Howler and Warden overrides. *Done when:* all states have been checked in every zone.
- [ ] **17.17 Survivor character polish.** Four distinct player characters (colors and silhouettes) for co-op readability. *Done when:* you can tell each player apart at 30 m.

## M18 — Audio

#### Session M18-A — AudioEngine, weapon SFX, zombie vocals (18.1–18.3)

- [ ] **18.1 AudioEngine v1.** Buses, compressor, positional panners, a voice cap with priorities. *Done when:* 64 simultaneous sounds don't clip or stutter.
- [ ] **18.2 Weapon SFX set.** Fire, reload parts and tails for each class, plus a Forged layer. *Done when:* every weapon has its own sound.
- [ ] **18.3 Zombie vocals.** Procedural groans, screams, attack and death sounds, with per-zombie pitch variety. *Done when:* a horde sounds like a horde, but is capped.

#### Session M18-B — Footsteps, occlusion, UI SFX (18.4–18.6)

- [ ] **18.4 Footsteps and surfaces.** Per-material footsteps (concrete, metal, wood, grass, water edge). *Done when:* the map's surfaces sound different.
- [ ] **18.5 Occlusion.** A ray-based lowpass for sounds behind walls. *Done when:* zombies behind walls sound muffled.
- [ ] **18.6 UI and economy SFX.** Purchase, can't afford, points tick, interact. *Done when:* every UI action has feedback.

#### Session M18-C — Stingers, ambience, jingles, mix (18.7–18.10)

- [ ] **18.7 Round stingers.** Generated start and end music for normal rounds, plus special-round variants. *Done when:* the transitions are recognizable.
- [ ] **18.8 Ambient beds.** Wind, forest, hum and tunnel drips per zone, crossfading by zone. *Done when:* walking the map, the ambience changes smoothly.
- [ ] **18.9 Perk jingles v2 and the crate music box.** *Done when:* they're memorable.
- [ ] **18.10 Mix pass.** Loudness balance, ducking (stingers duck SFX), settings sliders. *Done when:* a 30-minute session is comfortable on headphones.

## M19 — UI, menus, settings

#### Session M19-A — Main menu, loading, settings (19.1–19.4)

- [ ] **19.1 Terminal-style main menu.** Solo, Host, Join, Settings, Stats, Credits. *Done when:* you can navigate it with mouse and keyboard.
- [ ] **19.2 Loading screen.** Asset generation progress and tips. *Done when:* boot under 3 s with progress shown.
- [ ] **19.3 Settings: controls.** Sensitivity, ADS sensitivity, invert, FOV, key rebinding. *Done when:* settings persist and apply live.
- [ ] **19.4 Settings: graphics and audio.** Presets, pixel ratio, shadows, bloom, outlines, volume sliders. *Done when:* they persist and apply live.

#### Session M19-B — HUD polish, scoreboard, pause, game over (19.5–19.8)

- [ ] **19.5 HUD polish.** Brush round counter, point colors per player, power-up timers, hitmarkers, damage direction. *Done when:* it matches GDD §14.
- [ ] **19.6 Scoreboard (Tab).** Points, kills, headshots, downs, revives, ping. *Done when:* the values are correct in co-op.
- [ ] **19.7 Pause menu.** Pause in solo only, menu overlay in co-op. *Done when:* solo actually stops the worker sim.
- [ ] **19.8 Game Over screen.** Round reached, per-player stats, time survived, restart or menu. *Done when:* done.

#### Session M19-C — Stats, accessibility, gamepad (19.9–19.11)

- [ ] **19.9 Local stats page.** Best round per map, totals, quest completion (localStorage). *Done when:* it persists across sessions.
- [ ] **19.10 Accessibility.** Colorblind-safe drop and perk palette option, subtitle-style text for important audio cues, a screen shake toggle. *Done when:* each option works.
- [ ] **19.11 Gamepad support.** Gamepad API mapping, a light aim assist, and menus navigable with the pad. *Done when:* you can play a full game on a controller.

## M20 — Main quest "Last Broadcast"

#### Session M20-A — Quest framework & steps 1–3 (20.1–20.3)

- [ ] **20.1 Quest state machine framework.** Steps, replicated progress, quest events, debug skip. *Done when:* tested.
- [ ] **20.2 Steps 1–2.** Hook into power, and turn Cryo Lance building into quest progress. *Done when:* the quest advances.
- [ ] **20.3 Step 3: insulators.** Shootable hidden targets with feedback. *Done when:* done.

#### Session M20-B — Quest steps 4–6 (20.4–20.6)

- [ ] **20.4 Step 4: frequency.** A numbers-station audio sequence generated from the seed, a blinking beacon, the three-dial console, Howlers on failure. *Done when:* done.
- [ ] **20.5 Step 5: condensers.** Count Cryo kills by area, with coil glow progress. *Done when:* done.
- [ ] **20.6 Step 6: telescope cranks.** Interruptible holds and the forced Warden spawn. *Done when:* done.

#### Session M20-C — Holdout, ending, side secrets (20.7–20.8)

- [ ] **20.7 Step 7: holdout and ending.** A 120 s scripted defense, the cutscene camera, the reward, continuing to play. *Done when:* a full quest run is completed in solo and in co-op.
- [ ] **20.8 Side secrets.** Jester plushes, Tape Deck song, dog tag message. *Done when:* done.

## M21 — Polish & release

#### Session M21-A — Balance sim & balance pass (21.1–21.2)

- [ ] **21.1 Balance simulator.** `tools/balance-sim` headless bot runs, giving an economy and time-to-kill report. *Done when:* the report is generated in CI as an artifact.
- [ ] **21.2 Balance pass.** Tune weapon damage curves, prices and round scaling against the report and playtests. *Done when:* updated values in content and the GDD.

#### Session M21-B — Performance & load testing (21.3–21.5)

- [ ] **21.3 Performance pass, client.** Profile, fix hot spots, verify the budgets on a mid-tier laptop. *Done when:* 60 FPS at Medium in the worst-case scene.
- [ ] **21.4 Performance pass, server.** 20 concurrent bot rooms on one process. *Done when:* tick time under 4 ms per room.
- [ ] **21.5 Bot load test.** `tools/bot-client` connects 4 bots to each room for a 1-hour soak. *Done when:* no memory growth or desyncs.

#### Session M21-C — E2E, error reporting, production hosting (21.6–21.8)

- [ ] **21.6 Playwright E2E suite.** Solo boot to round 1, a 2-context co-op join, reconnect. *Done when:* it runs in CI.
- [ ] **21.7 Error reporting and logs.** Client error overlay in dev, structured server logs, crash-safe room teardown. *Done when:* done.
- [ ] **21.8 Production build and hosting.** Static client on a CDN host (Cloudflare Pages, Netlify), game server container, environment config. *Done when:* a public URL works end to end.

#### Session M21-D — Credits & 🎮 1.0 release playtest (21.9–21.10)

- [ ] **21.9 Credits and legal page.** Originality statement, fonts and libraries with their licenses. *Done when:* done.
- [ ] **21.10 🎮 1.0 release playtest.** A group co-op session to round 30+ and a full quest. *Done when:* the critical bugs are zero, then tag `v1.0.0`.

---

## Backlog (after 1.0)
- Online leaderboards (best round per map, by player count).
- Custom-game modifiers: starting round, extra-health zombies, no perks, crate-only weapons.
- Map 02, reusing the kit with a new biome, with these docs used as the template.
- WebTransport transport behind the existing interface.
- Controller-first aim assist tuning, and touch controls (experimental).
- Spectator / replay recording from snapshot streams.
- A prestige-style cosmetic unlock track (weapon tints, survivor outfits).
