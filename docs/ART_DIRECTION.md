# Art Direction — "Low-poly in code"

## 1. The style in one sentence
**Chunky flat-shaded low-poly shapes, a limited palette in vertex colors, soft fog and a few strong colored lights**, in the spirit of a moody diorama. No textures. Every model is built in TypeScript from primitives.

### Why this style
- **Cheap to make:** a weapon is about 15 boxes and cylinders, and a zombie is about 14 rigid parts. No external tools or asset pipeline.
- **Cheap to render:** flat shading with vertex colors means one material per palette, lots of merged geometry, and low triangle counts.
- **Readable:** silhouettes and color coding carry the information, and fog hides how few triangles there are.
- **Ages well:** stylized looks avoid the uncanny valley and don't date.

## 2. Rendering look
- `MeshLambertMaterial` (or a custom stylized shader later) with `flatShading: true` and `vertexColors: true`. There is one shared material, plus an **emissive** variant for anything that glows.
- **Light:** a hemisphere light (sky/ground) plus a dim directional "moon" light with one shadow-casting cascade on Medium or higher, plus up to 8 point lights at once. Point lights are pooled and assigned to the nearest emitters.
- **Baked vertex AO:** at map build time, each vertex gets a darkening value from short-ray occlusion that is multiplied into its vertex color. This makes the scene feel grounded at no runtime cost.
- **Fog:** exponential fog, with a separate color for each zone or state (see the map doc).
- **Post:** bloom (for emissives only, using a threshold), vignette, a subtle film grain, and a color grading LUT made in code (each LUT is a function from color to color, baked to a 32³ 3D texture). Special rounds swap the LUT.
- **Optional, behind a setting:** an outline pass, either an inverted-hull "ink" outline on characters only or a depth-based edge pass.
- **Viewmodel:** rendered in a second pass with its own FOV (60°) after clearing depth, so it never clips into walls.

## 3. Palette (`packages/art/palette.ts`)
About 32 named colors grouped into ramps. Every builder picks colors by name, never as hex literals.

| Group | Swatches (names) | Use |
|---|---|---|
| Concrete | `concrete0..3` | Walls, floors (grey-green) |
| Rust/metal | `metal0..3`, `rust0..2` | Doors, machines, weapons |
| Wood | `wood0..3` | Boards, crates, tables, gun stocks |
| Foliage | `pine0..2`, `grass0..1` | Woods, ground |
| Water/night | `lake0..1`, `sky0..2`, `moon` | Environment |
| Flesh/rot | `rot0..3` | Zombie skin (sickly green-grey) |
| Cloth | `cloth{worker,soldier,lab,cook}` | Zombie variants |
| Accent | `blood`, `ember`, `ion`, `frost`, `shock`, `gold` | VFX, Forge, drops |
| Perk colors | One per perk (see GDD §11) | Machines, bottle caps, HUD |

Rules: the environment is desaturated and cool. **Anything interactive gets a warm or saturated accent** (chalk-white wall buys, gold-trimmed crate, lit perk machines). Zombie eyes are emissive amber, and the Forge's ember glow is applied to upgraded weapons.

## 4. Procedural builder system (`packages/art`)

```ts
// Every builder is a pure function: params → merged BufferGeometry (+ optional bone map)
type Builder<P> = (p: P, rng: Rng) => BuiltMesh;

interface BuiltMesh {
  geometry: BufferGeometry;      // position, normal, color (+ emissive mask attr)
  parts?: Record<string, Object3D>; // named sockets: "muzzle", "magazine", "head" …
}
```

- **Primitives:** `box`, `wedge`, `cylinder(n=6..10)`, `cone`, `icosphere(lod 0–1)`, `prism`, `extrudeShape(path2d)`, `lathe(profile)`.
- **Operators:** `translate/rotate/scale`, `bevelLite` (chamfers edges by inset), `jitter(amount)` (adds a hand-made wobble to vertices, seeded), `colorize(paletteKey | perFace fn)`, `merge`, `mirrorX`.
- **Determinism:** builders take a seeded RNG, so the same seed always gives the same mesh. That gives zombie variety without storing assets.
- **Caching:** build once per (builder, params, seed) key and share the geometry.

### Budgets
| Thing | Triangles |
|---|---|
| Zombie (all parts) | ≤ 600 |
| Howler | ≤ 500 |
| Warden | ≤ 1200 |
| Viewmodel weapon | ≤ 1500 (it fills the screen) |
| World weapon / wall chalk | ≤ 300 / a decal quad |
| Perk machine | ≤ 800 |
| Whole visible map (merged chunks) | ≤ 400k |

## 5. Environment kit
Maps are put together from a parameterized kit. Each piece is a builder.

- **Structure:** `wall(len, h, thick, style)`, `wallWithDoor`, `wallWithWindow`, `floorSlab`, `stairs(rise, run, w)`, `ramp`, `pillar`, `roofGable`, `catwalk`, `ladder`, `railing`.
- **Openings:** `barricadeWindow` (frame plus 6 board sockets), `buyDoor(style: sliding|swing|double|hatch)`, `debrisPile(seed)`.
- **Props:** `crate`, `barrel`, `sandbags`, `table`, `bunk`, `locker`, `truck`, `generator`, `consoleDesk`, `lamp(post|wall|ceiling)`, `fence`, `pineTree(seed)`, `rock(seed)`, `planeWreck`, `dish`, `boat`.
- **Terrain:** a heightfield from simplex noise plus hand-placed "flatten" and "path" stamps. Vertex colors are blended by slope and height (grass, dirt, rock).
- **Foliage:** pines drawn with `InstancedMesh`, 3 to 4 seeded variants, with a LOD sprite impostor past 60 m.
- **Chunking:** static geometry is merged into ~20 m chunks for each material so frustum culling stays effective.

## 6. Characters

### Segmented rigid-part rigs
Characters are **hierarchies of rigid parts** (head, torso, pelvis, upper and lower arms, hands, upper and lower legs, feet) instead of skinned meshes.
- No skinning cost. A whole zombie is about 14 draw items, and parts are instanced per type across all zombies (see ARCHITECTURE §6.4).
- **Dismemberment is free:** detach the part and give it physics (a simple ballistic tumble).
- The chunky look fits the style.

### Procedural animation
- Animations are keyframe clips written as data (part → rotation curves): `walk`, `run`, `sprint`, `crawl`, `attack`, `climbWindow`, `tearBoard`, `riseFromGround`, `hitReact`, `death{1..3}`.
- **Procedural layers** go on top of the clips: head tracks the target, a lean on turns, a random limp offset per zombie, and a "stumble" additive on hits.
- **Deaths:** a short canned clip blended into a cheap ragdoll-lite. Parts become independent rigid bodies with simple constraints, freeze after 2 s, and fade after 8 s. The number of bodies is capped.

### Zombie variety
Each zombie rolls variations from a seed: height (0.92–1.08), shoulder width, head shape (box/wedge/round), clothing color set (worker, soldier, lab, cook), missing jaw or arm decorations, posture hunch, and eye glow intensity.

## 7. Weapons
- Each weapon is a builder made from boxes, cylinders and extrusions, with named sockets: `muzzle`, `mag`, `bolt`, `sight`, `grip_r`, `grip_l`.
- **Viewmodel animation is procedural:** sway (from mouse delta), bob (from velocity), recoil spring, ADS lerp, and sprint tilt. Reloads are short keyframe clips that move the `mag` socket (the magazine drops out and a new one comes up).
- **Forged look:** the palette is swapped toward dark metal with glowing `ember` or augment-colored seams, and emissive particles trail from the muzzle.
- **Wall buys:** a chalk-outline decal generated from the weapon's silhouette. The weapon mesh is projected flat and drawn as white lines. When bought, the 3D weapon "pops" out of the wall.

## 8. VFX (all procedural)
- **Muzzle flash:** 2 crossed emissive quads with random rotation, plus a point light pulse lasting 50 ms.
- **Tracers:** stretched emissive billboards. Impacts are dust puffs on the world and blood bursts of low-poly chunks on flesh.
- **Blood:** short-lived instanced tetrahedron particles, plus pooled flat decals (projected quads, maximum 64).
- **Explosions:** an expanding emissive icosphere with a smoke puff cluster and a camera shake.
- **Lightning:** jagged polyline ribbons regenerated every 2 frames (Arc Caster, Howler arrivals).
- **Singularity:** a dark sphere with an inverted-normal rim glow, a spiraling particle sheet and screen distortion (an optional radial blur pass).
- **Frost:** ice crystal prisms grow on frozen zombies, and shattering spawns instanced shards.
- **Power-ups:** a spinning low-poly icon (each one gets its own glyph mesh), a vertical light beam and a floor glow ring.
- **Crate:** a beacon light pillar while the crate is at a location, cycling weapon silhouettes when it opens, and the Jester (a jack-in-the-box head on a spring) when it moves.

## 9. UI art
- An HTML/CSS overlay. The fonts are a condensed stencil face for numbers and a hand-drawn brush style for the round counter. The brush look comes from SVG stroke filters.
- HUD icons are inline SVGs drawn in code, so perk caps, power-ups and equipment need no raster assets.
- Menus are set in a diegetic CRT terminal ("BLACKWATER STATION — TERMINAL 7"), with scanlines done in CSS.
