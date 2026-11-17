# Zero Hour — Game Design Document

> Every number in this document is a **starting value for tuning**. The values that actually ship are the ones in `packages/content`. When you change one there, update it here too.

## 1. Pillars

1. **"One more round."** The tension rises slowly. Early rounds teach the map and the economy, and late rounds test everything you've built.
2. **Spend to survive.** Every point is a choice between doors, guns, perks, the crate and upgrades. A greedy spend can kill you.
3. **The map is a puzzle.** You learn which routes are good for training zombies, where the choke points are, where the crate tends to show up, and the hidden quest.
4. **Readable chaos.** Low-poly art with strong silhouettes and color coding means that 24+ zombies, effects and drops stay legible.
5. **Co-op stories.** Clutch revives, arguments over who takes the crate gun, and the person who spent all the points on the crate.

## 2. Core loop

```
Round starts ─► Zombies spawn from active zones ─► Kill / survive / earn points
     ▲                                                     │
     │                                                     ▼
Round break (10 s) ◄── Last zombie dies ◄── Spend: doors, guns, perks, crate, Forge
```

Moment-to-moment, players do these things:
- Shoot zombies, aiming for the head for more points and more damage.
- Repair barricades during quiet moments.
- **Train** zombies, meaning kite them in a loop so they bunch up, then turn and shoot.
- Push the map open, turn on the power, buy upgrades and hunt for quest pieces.

Session goals: survive as long as possible (high round), solve the main quest, and post a top score.

## 3. Player

| Stat | Value |
|---|---|
| Max health | 100. Ironhide Stout raises it to 250. |
| Health regen | Starts 3.0 s after the last damage, then fills completely in 1.5 s |
| Zombie hit damage | 50 per hit, so 2 hits down a player without perks |
| Walk speed | 4.6 m/s. The weapon you hold can change this by ±10%. |
| Sprint speed | 7.0 m/s for 4 s, then a 2 s recovery. Long Stride makes sprint unlimited. |
| Crouch speed | 2.3 m/s. Crouching shrinks the hitbox and tightens spread. |
| Jump | 1.0 m apex |
| Weapon slots | 2. Pack Mule Malt adds a 3rd. |
| Melee | Knife: 150 dmg, 0.6 s. Hunting Blade: 1000 dmg, 0.45 s. |
| Lethal grenades | Frag: start with 2, gain +2 at each round start, max 4 |
| Tactical | None by default. The Chatterbox comes from the crate. |
| Starting loadout | P-11 Service Pistol (8/32), 2 frags, knife, **500 points** |

### 3.1 Downed / Last Stand
- When health reaches 0 the player is **downed**. They switch to the P-11 (or the best pistol they own) with a full magazine and can crawl at 1.2 m/s.
- **Bleedout** takes 45 s. A teammate holds Interact for **4.0 s** to revive (1.5 s with Second Wind Soda).
- On going down, the player **loses all perks**. In co-op they also lose 10% of their points, rounded down to 10. Points lost this way are not given to the reviver.
- A revive pays the reviver **0 points**. Reviving is its own reward, which stops revive farming.
- If bleedout finishes, the player is **dead**. They spectate until the next round starts, then respawn with the starting loadout and keep whatever points they had left.
- **Solo:** without Second Wind Soda, going down ends the game. With it, the player revives themselves after 10 s. This works 3 times per game, and each use consumes the perk.
- **Game over** happens when every player is downed or dead at the same moment.

## 4. Rounds & zombie scaling

### 4.1 Round flow
1. **Round start:** a music stinger plays, the round counter animates, and frags refill.
2. **Spawning:** the director spawns zombies one at a time with a delay between each, up to the round's total. It never exceeds the cap on live zombies.
3. **Round end:** the last zombie dies, the end stinger plays, and a **10 s** break follows. The first round starts after 3 s.

### 4.2 Formulas (`content/rounds.ts`)

```
zombieHealth(r)    = r < 10 ? 150 + 100*(r-1)            // r1=150 … r9=950
                            : 950 * 1.1^(r-9)             // r10≈1045, r20≈2709, r30≈7026
totalZombies(r,p)  = round(base(r) * (1 + 0.75*(p-1)))
  base(r)          = r <= 5 ? [6, 8, 13, 18, 24][r-1]
                            : 0.09*r² + 0.6*r + 20        // r6≈27, r10≈35, r20≈68, r30≈119
maxAlive(p)        = min(24 + 6*(p-1), 42)
spawnDelay(r)      = max(2.0 * 0.95^(r-1), 0.10) seconds
speedRoll(r)       = clamp(r*8 + rand(0..35), 0, 100)
                     <40 walk (1.6 m/s) · <70 run (3.8 m/s) · ≥70 sprint (5.6 m/s, unlocked r≥8)
```

- Zombies that end up stranded get **recycled**. A zombie counts as stranded when it is more than 45 m from every player for 8 s, or has no valid path. It despawns and goes back into the spawn queue. Recycling does not count as a kill.
- **Last-zombie rule:** when 1–2 zombies remain, each is forced to at least run speed so rounds don't stall.

### 4.3 Special rounds
- **Howler rounds** replace a normal round. The first happens on round 5, 6 or 7 (chosen by seeded RNG), and each one after that comes 4–6 rounds later.
- The **Warden** joins normal rounds. See §8.3.

## 5. Points economy

| Action | Points |
|---|---|
| Non-lethal bullet hit | +10 |
| Kill (body) | +60 |
| Kill (neck) | +70 |
| Kill (head) | +100 |
| Melee kill | +130 |
| Repair one barricade board | +10. Each player can earn at most 500 per round from repairs. |
| Purge power-up | +400 to every player |
| Rebuild power-up | +200 to every player |
| Howler kill | +50. Clearing the whole round awards a Full Resupply. |
| Warden kill | +500 to everyone, plus a guaranteed drop |

Double Pay doubles every point gain. Points are a server-owned integer per player, and the scoreboard tracks lifetime points earned.

### 5.1 Price list (Map 01 defaults)

| Item | Cost |
|---|---|
| Doors / debris | 750 – 2000 |
| Wall weapon | 500 – 3000 |
| Wall ammo (weapon owned) | Half the weapon price. A Forged weapon's ammo costs 4500 at the wall. |
| Mystery Crate | 950. During Clearance it costs 10. |
| Perks | 1500 – 4000 |
| Forge upgrade | 5000. Rerolling the augment costs 2500. |
| Trap activation | 1000 |
| Zipline ride | 250 |

## 6. Weapons

### 6.1 Rules
- Hitscan for bullets, simulated projectiles for launchers, grenades and most wonder weapons.
- **Hit zones:** head ×(weapon head multiplier), neck ×1.5, torso ×1.0, limbs ×0.8. Explosions, wonder weapons and melee ignore the zone multipliers.
- **Penetration:** each weapon has a value from 0 to 3. Each zombie a bullet passes through cuts its damage by 30%.
- **Damage falloff:** full damage up to the near range, then a linear drop to the minimum at the far range.
- **Recoil:** a vertical kick plus a horizontal pattern, so it can be learned. **Spread** has a hip-fire cone, an ADS cone and a move penalty.
- You can only hold one copy of a weapon. Buying from a wall when you already own that weapon buys ammo instead.
- **Swap behavior:** buying a weapon with every slot full replaces the weapon in your hands.

### 6.2 Roster

`W` = wall buy, `C` = crate, `Q` = quest. Damage values are per bullet or pellet at near range.

| Weapon | Class | Source | Cost | Dmg | RPM | Mag/Reserve | Head× | Forge name / augment bias |
|---|---|---|---|---|---|---|---|---|
| P-11 Service Pistol | Pistol | Start | — | 40 | 400 semi | 8/80 | 3.0 | P-11 Overclock: explosive rounds, 12/120 |
| Bulldog .44 | Revolver | C | — | 160 | 180 semi | 6/48 | 3.0 | Mad Dog: Shock |
| Ranger Carbine | Rifle | W | 500 | 100 | 360 semi | 8/96 | 3.5 | Ranger Elite: 3-round burst |
| Thresher Pump | Shotgun | W | 500 | 8×55 | 70 pump | 6/48 | 1.5 | Grim Thresher: Fire |
| Viper SMG | SMG | W/C | 1000 | 35 | 750 auto | 30/150 | 2.0 | Venom Strike: Frost |
| Twin Fang | Shotgun (2-barrel) | W/C | 1200 | 8×70 | 2-shot | 2/60 | 1.5 | Twin Inferno: Fire |
| Tempest SMG | SMG | W/C | 1300 | 30 | 900 auto | 40/200 | 2.0 | Hurricane: Shock |
| Kestrel AR | Assault rifle | W/C | 1400 | 55 | 650 auto | 30/180 | 2.5 | Peregrine: Blast |
| Marksman DMR | Marksman | W/C | 1500 | 140 | 300 semi | 10/80 | 4.0 | Deadeye: penetration 3 |
| Hornet PDW | SMG | C | — | 40 | 850 auto | 50/250 | 2.0 | Swarm: Shock |
| Brute LMG | LMG | C | — | 90 | 600 auto | 100/400 | 2.0 | Juggernaut Saw: Blast |
| Hailstorm | Auto-shotgun | C | — | 8×60 | 240 auto | 12/72 | 1.5 | Blizzard: Frost |
| Longshot | Bolt sniper | C | — | 600 | 45 bolt | 5/40 | 5.0 | Widowmaker: Blast |
| Boomer GL | Grenade launcher | C | — | 600 splash | 70 | 1/24 | — | Big Boomer: cluster bomblets |
| Ion Blaster | Wonder-lite pistol | C | — | 1000 splash | 180 | 20/160 | — | Ion Storm: bigger splash, 40/200 |
| Arc Caster | **Wonder** | C | — | Chain lightning | 60 | 3/9 | — | Arc Tempest: 10-zombie chains |
| Singularity Launcher | **Wonder** | C | — | Black hole | 30 | 1/6 | — | Event Horizon: longer pull, gibs |
| Cryo Lance | **Wonder** | Q (Map 01) | — | Freeze beam | — | Charge | — | Absolute Zero: shatter AoE |
| Combat Knife | Melee | Start | — | 150 | — | — | — | — |
| Hunting Blade | Melee | W | 3000 | 1000 | — | — | — | — |

### 6.3 Equipment
| Item | Source | Notes |
|---|---|---|
| Frag Grenade | Start | 2.5 s cook fuse, 6 m radius. You can cook it, and holding too long blows it up in your hand. |
| Tripwire Mine | W 1000 | Up to 2 placed at once. Triggers on zombies within 2 m. Refills 2 per round. |
| Chatterbox | C | A wind-up radio that plays music, pulls in every zombie within 25 m for 8 s, then explodes. Holds 3 per refill. |

### 6.4 Wonder weapon behavior
- **Arc Caster:** fires a bolt that hits the first zombie and then chains to up to 6 more within 6 m of each other. Chained zombies die instantly until round 25. After that each link deals 25% of the target's health.
- **Singularity Launcher:** a slow orb. When it hits it makes a 4 s vortex that pulls zombies in from up to 10 m and kills them. Players caught near it are pushed back but take no damage.
- **Ion Blaster:** fast green bolts with a 1.5 m splash. Self-damage is 20 per bolt unless the player has Blast Shield Bitters.
- **Cryo Lance:** hold to channel a cone beam. Zombies in it slow down over 1.5 s and then freeze solid. Frozen zombies shatter when hit by melee or by another zombie. It recharges itself and needs no ammo.

## 7. Map interaction systems

### 7.1 Barricades (windows)
- Each window has 6 boards. A zombie at the window pulls off one board every 1.0 s, then climbs through in 1.2 s once no boards are left.
- Repairing means holding Interact. Each board takes 0.6 s to replace and pays out under the per-round cap. A board that slams into place has a 25% chance to stun nearby zombies.

### 7.2 Doors & debris
- Buying a door or debris opens a connection between two zones. A door slides or swings open, and debris collapses into dust. It costs the price shown and stays open for the rest of the game.
- Every zone has a set of **entry windows** and **ground risers** (spawners).

### 7.3 Zone activation (spawn logic)
- The map is split into zones. A zone is **active** when a player is inside it, or when it is opened and directly connected to an occupied zone.
- The director only spawns zombies from spawners inside active zones. It weights them so the spawners closest to players are used less, which keeps zombies from popping up right on top of someone.

### 7.4 Power
- A power switch is a lever that needs a 1.5 s hold. Throwing it starts a map-wide event: the lights come on in sequence, the perk machines play their jingles, and the Forge powers up.
- Before power is on, only these work: wall buys, the crate, doors, and the one perk next to the spawn zone, which on Map 01 is Second Wind Soda.

### 7.5 Traps
- Each trap costs 1000. It runs for 25 s and then needs 60 s to cool down. It kills zombies and downs players outright, unless the player has Ironhide Stout, in which case it deals 100 damage per second.
- On Map 01: the electric fence in the Service Tunnels, the turbine fan in the Hangar, and the flame vents in the Courtyard.

### 7.6 Zipline
- Costs 250 and needs power. It carries a rider from the top of the Comms Tower to the Lakeside dock in 6 s. The rider can shoot while riding.

## 8. Enemies

### 8.1 Walker (standard zombie)
- Uses the round's health and speed tier. Attack: a 0.8 s windup, then a 1.3 m reach for 50 damage.
- **Dismemberment:** explosive or high-damage hits can remove an arm, which is cosmetic only, or the legs. A zombie that loses its legs becomes a **Crawler** at 1.0 m/s. Crawlers keep the round alive, so players can deliberately leave one alive to stall.
- **States:** Spawn (rises from the ground or climbs in a window) → Path to a barricade or player → Tear boards → Enter → Chase → Attack → Die.
- **Variants** are cosmetic only: worker, soldier, scientist, cook. Each is a recolored set of segmented body parts.

### 8.2 Howler (special round enemy)
- A fast, lean quadruped. Health is 300 + 50 × round, capped at 6000. Speed is 7.5 m/s, and it lunges for 30 damage.
- A Howler round has 8 Howlers per player plus the round number divided by 4, with no more than 12 alive at once. They arrive inside lightning strikes near players, after a warning: thick fog and a red ambient tint.
- When it dies it bursts into embers. Killing the last one guarantees a Full Resupply where it fell.

### 8.3 The Warden (mini-boss)
- An armored brute with a lantern-hammer. It first appears on round 12 (±2), then again every 5–8 rounds after that, in normal rounds alongside regular zombies.
- Health: 2000 × number of players + 500 × round. It has a **helmet**: headshots break the helmet off first, then deal 4× damage.
- Abilities:
  - Hammer slam: an area attack that deals 80 damage and slows players.
  - Lantern charge: when it reaches a powered machine (a perk, the Forge or a trap) it **disables it for 60 s** until a player pays to "relight" it for 500.
  - Leap: it can jump between floors.
- When it dies it drops a guaranteed power-up and gives every player 500 points.

## 9. Power-ups (drops)

| Power-up | Effect | Duration |
|---|---|---|
| Full Resupply | Refills ammo for every weapon and every player, including frags | Instant |
| One Shot | Every zombie dies in one hit. The Warden takes 4× damage instead. | 30 s |
| Double Pay | Doubles all point gains | 30 s |
| Purge | Kills every live zombie (they don't count as yours) and gives +400 to everyone | Instant |
| Rebuild | Repairs every barricade and gives +200 to everyone | Instant |
| Clearance | Opens the crate at every crate location for 10 points | 30 s |

- **Drop rules:** each zombie kill has a 2% chance to drop a power-up. The total number of drops in a round is capped at 4 + the number of players. Drops come from a **shuffled bag**: the six types are shuffled, handed out in that order, and reshuffled when the bag is empty. As a pity rule, if no drop has happened for 1.5 rounds' worth of kills, the next kill always drops.
- A drop floats and spins for 25 s. It blinks for the last 5 s, then vanishes. Purge cannot drop during the first two rounds.

## 10. Mystery Crate

- 950 points. The lid opens, weapon models flicker past for 4 s, and the result floats above the crate for **12 s**. Only the player who bought it can take it, and if they don't, it is lost.
- **Pool:** every weapon flagged `inCrate`. The pool leaves out any weapon the buyer already owns. In co-op it also leaves out a wonder weapon if another player currently holds that same one.
- **Weights:** normal weapons 10, LMG/sniper/launcher 7, Ion Blaster 4, Arc Caster and Singularity Launcher 2, Chatterbox 6. Every 10 crate uses without getting a wonder weapon adds +1 to the wonder weapon weights. This resets when one appears.
- **Jester (moving the crate):** the crate always works at least 4 times at a location. After that, each use has a cumulative chance of the Jester appearing instead of a weapon. The chance grows 8% per use and reaches 100% by the 12th use. When the Jester appears, the buyer is refunded 950, the crate flies off, and it reappears at a random different location after 8 s. Locations are marked with a glowing beacon of light while the crate is there.
- **Clearance:** every crate location becomes active, nothing costs more than 10, and the Jester cannot appear.
- The first crate location is picked at random from 2 early-zone candidates.

## 11. Perks ("tonics")

Each perk is a vending machine with its own color, silhouette, jingle and bottle model. The **perk limit is 4**. Map 01's quest raises it to 5. Drinking takes 2.5 s, and the player can't fire during that time.

| Perk | Cost | Effect | Color |
|---|---|---|---|
| Ironhide Stout | 2500 | Max health 250 | Crimson |
| Quickhand Tonic | 3000 | Reloads 50% faster, swaps 25% faster | Lime |
| Second Wind Soda | 1500 (co-op) / 500 (solo) | Co-op: revive teammates 2.5× faster. Solo: self-revive, up to 3 uses. | Cyan |
| Twin Trigger Tonic | 2000 | Fire rate +33% | Amber |
| Long Stride Seltzer | 2000 | Unlimited sprint, +7% move speed, faster ADS out of sprint | Sky blue |
| Blast Shield Bitters | 2000 | No damage from explosions or falls. A slide-to-dive releases a 3 m blast. | Violet |
| Pack Mule Malt | 4000 | A third weapon slot. If you go down, the third weapon is lost. | Olive |
| Steady Eye Elixir | 1500 | Less hip spread, headshot damage +25%, aim snaps to the head | Bone white |
| Static Spark Soda | 2000 | Reloading releases a shock pulse. A bigger pulse when the mag was emptier. 4 s cooldown. | Electric yellow |

## 12. The Forge (upgrade machine)

- Needs power. Costs 5000 and takes 3 s to work: you insert the weapon, the machine runs an animation while it hammers, and the upgraded weapon comes back out. You have 15 s to pick it up, and only you can.
- An upgraded weapon has these changes:
  - A new name and a tinted "forged" look: a glowing palette swap with ember particles on the muzzle.
  - ×2.0 to ×2.5 damage, a bigger magazine, and more reserve ammo.
  - One **augment**, chosen at random with the weapon's bias weighted ×3:
    - **Shock:** 15% chance per hit to arc to 3 nearby zombies.
    - **Fire:** 10% chance per hit to ignite a 3 m area for 4 s.
    - **Frost:** 15% chance per hit to slow by 60%, or freeze after 3 stacks.
    - **Blast:** 8% chance per hit for a 2.5 m explosion.
  - Augments have a cooldown of 1 proc per 0.5 s per player, which keeps performance under control.
- Using the Forge again on an upgraded weapon costs 2500 and rerolls the augment. It is guaranteed to be different from the one you had.
- Wonder weapons can be forged too. Each one has its own named upgrade.

## 13. Main quest (Map 01)

The whole quest is in `MAP_01_BLACKWATER.md` §8. The ending reward is: a permanent perk limit of 5 for this game, every perk given for free, and a 2-minute "victory" state with an ending cutscene. After that, the round continues for players who want to keep going.

## 14. HUD & feedback

- **Bottom-left:** the round counter, drawn as stylized hash marks for rounds 1–5 and as numerals after that, painted in a red brush style.
- **Points:** in co-op, every player's points are shown in their own color. Gains float up in small "+60" popups.
- **Bottom-right:** weapon name, magazine / reserve, grenade icons, equipment.
- **Perk row:** above the points. Each perk shows as a small colored bottle cap.
- **Power-up row:** bottom-center. Icons blink as their timers run out.
- **Interact prompt:** center. For example: "Hold F to buy Kestrel AR [1400]" or "Hold F to repair barricade".
- **Hitmarkers:** white normally, red on a kill, with a special sound for headshots.
- **Damage feedback:** red edges and a heartbeat at low health, plus directional damage indicators.
- **Scoreboard (Tab):** points, kills, headshots, downs, revives and ping for each player.
- **Downed teammates** show as icons in the world and at the edge of the screen, with a bleedout ring. A reviver sees a progress ring.

## 15. Modes & meta

- **Solo:** can be paused. Second Wind works as a self-revive.
- **Co-op (2–4):** online with a room code. The host can kick players. A player who disconnects for more than 60 s is removed, and their points are kept if they rejoin.
- **Settings:** FOV (70–110), mouse sensitivity, separate ADS sensitivity, invert Y, volume sliders, graphics preset, pixel-ratio cap, and colorblind-safe drop colors.
- **Local stats** (localStorage): highest round reached on each map, total kills, whether the quest was completed.
- **Later (post-1.0):** online leaderboards, custom-game modifiers (start at round 10, etc.), more maps.

## 16. Glossary

- **Training:** kiting zombies in a loop so they bunch up behind you.
- **Crawler:** a zombie with no legs. People leave one alive between rounds to buy time.
- **Zone:** a gameplay volume that controls which spawners are allowed to activate.
- **Augment:** the elemental bonus a Forged weapon gets.
- **Proc:** one random activation of an effect.
