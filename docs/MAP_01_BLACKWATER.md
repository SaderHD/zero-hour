# Map 01 — Blackwater Station

> A Cold-War radar and research outpost cut into a pine forest beside a black lake. It's night with heavy fog. Something in the lab got out, and the station's last broadcast was cut off mid-sentence.

## 1. Goals for this map
- **Large but readable.** There are 12 zones, about 240 × 200 m including the woods, and roughly 9,000 m² of walkable space. It takes 15–20 minutes of play to open everything.
- **Teach, then test.** Spawn is tight and safe. The middle of the map gives the player choices. The late areas are wide training grounds.
- **Two routes to the hub** (the Courtyard), so a co-op team can split up.
- **Three good training areas:** the Courtyard ring, the Hangar floor and the Lakeside meadow. There are also two deliberate death traps: the Service Tunnels and the upper floor of the Barracks.
- **Everything buildable in code** from a small kit of pieces (see `ART_DIRECTION.md` §5).

## 2. Coordinate conventions
- Units are meters. +Y is up. The map origin is at the Gatehouse spawn. +X is east and −Z is north (Three.js forward).
- Interior floor height is 0. The Barracks upper floor is +3.5. The tunnels are at −4.0. The Observatory hill is at +12.
- Doors are 1.4 m wide and 2.4 m tall. Windows are 1.6 m wide with the sill at 0.9 m. Corridors are at least 2.4 m wide, so two players and a zombie can pass.

## 3. Layout (top-down, north up)

```
                                   ┌───────────────────┐
           ~~~~~~~~ LAKE ~~~~~~~~  │ Z11 OBSERVATORY   │  (hill, +12m)
         ~~~~~~~~~~~~~~~~~~~~~~~~  └────────┬──────────┘
        ┌──────────────────────────────────┴───────────────┐
        │  Z10 LAKESIDE & PINE WOODS (outdoor loop)        │
        │   boathouse · dock · campfire meadow · zipline end│
        └───┬─────────────────────────────────────────┬────┘
            │ hangar doors 1500                lab yard│ 1500
     ┌──────┴──────┐   1000   ┌──────────┐ 1000  ┌────┴───────┐
     │  Z9 HANGAR  ├──────────┤Z7 TUNNELS├───────┤ Z8 LAB WING│
     └──────┬──────┘          └────┬─────┘       └────┬───────┘
       1500 │                hatch │ 1000             │ 1500
     ┌──────┴──────┐  1250   ┌─────┴──────┐  1250 ┌───┴────────┐
     │Z5 GENERATOR ├─────────┤Z4 COURTYARD├───────┤Z6 RADIO RM │══ zipline ══► Z10
     │  (POWER)    │         │  (hub)     │       │ comms tower│
     └─────────────┘         └──┬──────┬──┘       └────────────┘
                           1250 │      │ 1250 (upper walkway)
                     ┌──────────┴┐   ┌─┴──────────┐
                     │Z3 MESS    ├───┤Z2 BARRACKS │ (2 floors)
                     │  HALL     │1000│            │
                     └─────┬─────┘   └─────┬──────┘
                       1000│               │ 750 (debris)
                     ┌─────┴─────┐  750  ┌─┴──────────┐
                     │Z1 MOTOR   ├───────┤Z0 GATEHOUSE│ ◄ SPAWN
                     │  POOL     │       │            │
                     └───────────┘       └────────────┘
```

Opening every door costs about 19,250 points in total.

## 4. Zone specs

Each zone becomes one `ZoneDef` in `packages/maps/blackwater/zones.ts`. "Win" is the number of barricaded windows, and "Riser" is the number of ground spawners.

| ID | Zone | Size (approx) | Win | Riser | Contents |
|---|---|---|---|---|---|
| Z0 | **Gatehouse** (spawn) | 14×12 m, 1 floor | 4 | 0 | Wall buys: Ranger Carbine 500 and Thresher Pump 500. Perk: **Second Wind Soda** (works without power). The guard booth has a radio that plays the intro. |
| Z1 | **Motor Pool** | 26×18 m garage | 3 | 2 | Wall buy: Viper SMG 1000. Crate location **C1** (possible starting location). Trucks act as cover and as small training loops. |
| Z2 | **Barracks** | 20×12 m × 2 floors | 5 | 0 | Wall buy upstairs: Marksman DMR 1500. Perk: **Quickhand Tonic**. Crate location **C2** upstairs (possible starting location). The upper walkway leads to the Courtyard. |
| Z3 | **Mess Hall** | 22×16 m | 4 | 1 | Wall buy: Twin Fang 1200. Perk: **Ironhide Stout**, in the kitchen. Long tables slow zombies down. |
| Z4 | **Courtyard** (hub) | 40×34 m outdoor | 0 | 6 | Crate location **C3**. Perk: **Long Stride Seltzer**. **Flame vent trap** (1000) on the south path. A ring-shaped planter around the flagpole makes a training loop. The tunnel hatch is here. |
| Z5 | **Generator House** | 18×14 m, catwalk | 3 | 1 | **POWER SWITCH** on the catwalk. Wall buy: Kestrel AR 1400. Perk: **Twin Trigger Tonic**. |
| Z6 | **Radio Room / Comms Tower** | 14×14 m + tower | 3 | 1 | Wall buy: Tempest SMG 1300. Perk: **Steady Eye Elixir**. Radio console (quest). Tower stairs lead to the **zipline start**. |
| Z7 | **Service Tunnels** | 3 m-wide corridors, ~120 m total | 0 | 4 | Wall buy: Hunting Blade 3000. **Electric fence trap** (1000) at the junction. Dark, narrow and dangerous. |
| Z8 | **Laboratory Wing** | 30×20 m + cells | 4 | 2 | **THE FORGE** (needs power). **Workbench** (Cryo Lance). Perk: **Static Spark Soda**. Crate location **C4**. Containment cells serve as quest set dressing. |
| Z9 | **Hangar** | 36×28 m, 10 m roof | 4 | 4 | Crate location **C5**. Perk: **Blast Shield Bitters**. Wall buy: Tripwire Mine 1000. **Turbine fan trap** (1000). A wrecked cargo plane sits in the middle and makes a training loop. |
| Z10 | **Lakeside & Pine Woods** | about 160×40 m strip | 0 | 10 | Perk: **Pack Mule Malt**, in the boathouse. Crate location **C6**, by the campfire. Wall buy: Kestrel AR 1400 on the boathouse wall, for ammo. Zipline end on the dock. The meadow is the main late-game training area. |
| Z11 | **Observatory** | 20 m dome on a hill | 2 | 3 | Opens with a 2000 gate after power is on, and the gate is reached by a switchback path. Telescope dome for the quest finale. It's the Warden's favorite arena. |

### Connections (`DoorDef`s)
| From ↔ To | Type | Cost | Notes |
|---|---|---|---|
| Z0 ↔ Z1 | Sliding garage door | 750 | |
| Z0 ↔ Z2 | Debris (sandbags) | 750 | |
| Z1 ↔ Z3 | Door | 1000 | |
| Z2 ↔ Z3 | Door | 1000 | |
| Z3 ↔ Z4 | Double door | 1250 | Route A to the hub |
| Z2(upper) ↔ Z4 | Debris (walkway) | 1250 | Route B. You can drop down into the Courtyard from it. |
| Z4 ↔ Z5 | Door | 1250 | |
| Z4 ↔ Z6 | Door | 1250 | |
| Z4 ↔ Z7 | Hatch | 1000 | A ladder down to −4 m |
| Z5 ↔ Z9 | Door | 1500 | |
| Z6 ↔ Z8 | Security door | 1500 | |
| Z7 ↔ Z8 | Debris | 1000 | |
| Z7 ↔ Z9 | Debris | 1000 | |
| Z9 ↔ Z10 | Hangar bay doors | 1500 | Opening them is a big moment: fog rolls in |
| Z8 ↔ Z10 | Lab yard gate | 1500 | |
| Z10 ↔ Z11 | Observatory gate | 2000 | Needs power |
| Z6 → Z10 | Zipline (one-way) | 250/ride | Needs power |

## 5. Crate locations
C1 Motor Pool, C2 Barracks upper floor, C3 Courtyard, C4 Lab Wing, C5 Hangar, C6 Lakeside campfire. The first location is C1 or C2, chosen at random.

## 6. Flow & pacing targets

| Phase | Rounds | Expected state |
|---|---|---|
| Opening | 1–3 | Players hold the Gatehouse with the pistol and the 500-point wall buys. They open Motor Pool or Barracks by round 2–3. |
| Expansion | 4–8 | They reach the Courtyard, hit the first crate, buy Ironhide Stout around round 6–8 once power is on. The first Howler round comes on 5–7. |
| Power | 6–10 | Generator power, perks, a first look at the Forge. |
| Build-up | 10–15 | Cryo Lance parts, Forge upgrades, the first Warden around round 12. Players move to the Hangar or Lakeside to train. |
| Quest | 15–25 | The main quest steps, with the Observatory finale. |
| Endless | 25+ | High-round survival in the Lakeside meadow or on the Hangar floor. |

## 7. Atmosphere & lighting

| State | Look |
|---|---|
| Power OFF | Cold moonlight (blue-grey), red emergency strobes indoors, flickering bulbs, perk machines dark. |
| Power ON | A cascade of sodium-orange lamps from the Generator House outward, perk machines lit and humming, searchlights sweeping from the Comms Tower. |
| Howler round | Thick fog, red ambient grade, distant howling, lightning flashes. |
| Warden spawn | A bell tolls, the lights flicker map-wide, and a lantern glow approaches. |

Fog goes from 12 m near to 70 m far outdoors and from 8 m to 40 m indoors. The **skybox** is a gradient dome with procedural stars and a big pale moon. A low-poly pine ring on the outer boundary hides the edge of the map.

## 8. Main quest — "Last Broadcast"

Every step is server-authoritative and is driven by a state machine in `packages/maps/blackwater/quest.ts`. The steps must be done in order, and each one gives clear audio and visual feedback when it completes.

1. **Restore power.** Throw the switch in Z5.
2. **Build the Cryo Lance.** Three parts each spawn at one of three candidate spots chosen by seeded RNG: the **Cooling Coil** (Motor Pool, Mess Hall kitchen, Tunnels), the **Emitter Crystal** (Lab cells, Generator catwalk, Hangar cockpit), and the **Stock Frame** (Barracks locker, Radio Room shelf, Boathouse). Bring all three to the Lab **Workbench**, which turns into the Cryo Lance pedestal. Each player can take one Cryo Lance per game.
3. **Find the insulators.** Shoot three glowing blue insulators: one on the Comms Tower mast, one on the Hangar roof (seen through the skylight), and one on the Observatory path's power pole. Each one sparks when hit, and the radio crackles louder.
4. **Tune the frequency.** The Radio Room console plays a numbers-station broadcast that reads out one of four frequencies, chosen at random per game. The same sequence also blinks on the tower beacon. Players set the three-dial console to match. A wrong setting gives static and spawns a Howler pack.
5. **Charge the condensers.** Three condenser coils (Courtyard, Hangar, Lakeside) each need **12 zombies frozen and shattered** nearby with the Cryo Lance. Each coil glows brighter as it fills.
6. **Align the telescope.** Inside the Observatory, three crank stations rotate the dome. Each crank is a hold-to-use that takes 10 s and can be interrupted. A Warden spawns at the start of this step no matter what round it is.
7. **Send the signal.** A 120 s holdout in the Observatory: the zombie spawn rate goes up, two Howler bursts arrive, and the transmission meter fills. Ending: a cutscene camera on the dish as the beam fires into the clouds, plus the reward listed in GDD §13.

**Side secrets:** the Jester plush (shoot 3 hidden plushes to get a free crate spin), the Tape Deck (collect 3 cassettes to play an original song), and a dog tag on the dock that leaves a message from the station's last radio operator.

## 9. Build order for this map
The map is greyboxed first and dressed later. The steps are in `PLAN.md` milestones **M12** (greybox, collision, nav, gameplay placement) and **M17** (art pass by zone).
