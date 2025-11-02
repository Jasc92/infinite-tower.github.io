# Infinite Tower - MVP Specification

## Game Overview
**Infinite Tower** is a roguelike auto-battler Progressive Web App (PWA) where players climb an endless tower, fighting increasingly difficult enemies. Success depends on strategic stat allocation and understanding the adaptive AI that counters player builds.

---

## Core Game Loop

### 1. Main Menu
- **PLAY** button to start a new run
- **TOP RUNS** section showing best 3 runs (Floor + Time)
- **Difficulty selector**: Easy, Normal, Hard

### 2. Stat Allocation Phase
- Player receives **5 stat points** at the start and after each floor
- Available stats:
  - **Attack Speed** (0.1 → 5.0 cap)
  - **Crit Chance** (up to 75%)
  - **Attack** (damage)
  - **Evasion** (up to 50%)
  - **Defense** (damage reduction)
  - **Max HP** (health pool)
- All points must be allocated before proceeding to battle

### 3. Battle Phase (Auto-Battle)
- Continuous-time combat system
- Player and enemy attack based on their Attack Speed stat
- Battle resolves automatically with no player input
- Visual display of both fighters with health bars and stats
- Combat speed toggle (1x / 5x)

### 4. Result Phase
- **Victory**: Advance to next floor, gain 5 stat points
- **Defeat**: Game Over, display final floor reached and total time
- Save run to Top Runs if it ranks in top 3

---

## Combat Mechanics

### Attack Speed
- Determines attacks per second
- Timer resets to `1 / attackSpeed` after each attack
- Example: 2.5 Attack Speed = attack every 0.4 seconds

### Damage Calculation Sequence
1. **Evasion Check**: Roll vs target's evasion → miss if successful
2. **Critical Hit**: Roll vs attacker's crit chance → double damage if successful
3. **Defense**: Subtract target's defense from damage
4. **Minimum**: Damage is always at least 1

### HP and Death
- Fighter with 0 or less HP loses
- HP does not regenerate between floors (carries over)

---

## Adaptive AI System

### Enemy Generation
Enemies are generated based on:
- **Floor number**: Scales base stats
- **Difficulty multiplier**: Easy (0.8), Normal (1.0), Hard (1.3)
- **Archetype bias**: Adjusts stat distribution

### Archetype Biases
Three archetypes counter different playstyles:

**BALANCED** (Default)
- Atk: 0.9, AtkSpd: 1.0, Crit: 1.0, Evade: 1.0, Def: 1.0, HP: 1.0

**TANK** (Counters high Attack Speed builds)
- Atk: 0.8, AtkSpd: 0.7, Crit: 0.8, Evade: 0.6, Def: 1.4, HP: 1.5

**GLASS CANNON** (Counters tanky/evasive builds)
- Atk: 1.3, AtkSpd: 1.2, Crit: 1.4, Evade: 0.7, Def: 0.6, HP: 0.8

### Archetype Selection
- First 3 floors: **BALANCED**
- Every 3 floors after: AI analyzes player's stat distribution
  - Highest stat determines counter archetype
  - Attack Speed → TANK
  - Defense/HP → GLASS CANNON
  - Otherwise → BALANCED

### Stat Scaling Formula
```
statValue = baseValue * (1 + floor * 0.15) * difficulty * archetypeBias
```

Where `baseValue` is:
- Attack: 10
- Attack Speed: 1.0
- Crit Chance: 0.1
- Evasion: 0.05
- Defense: 5
- Max HP: 50

---

## User Interface

### Mobile-First Design
- Responsive layout that works in both portrait and landscape
- No scrolling required during gameplay
- Touch-optimized controls
- Viewport fits content without overflow

### Battle Screen Layout
- **Top Bar**: Floor number, speed toggle button
- **Character Display**: Canvas with hero (left) and enemy (right) sprites
- **Stat Panels**: 
  - Hero stats (top left)
  - Enemy stats (top right)
  - Shows: ATK, SPD, CRIT, EVA, DEF, HP
- **Background**: Full-screen fantasy dungeon background with proper aspect ratio

### Visual Assets
- Hero sprite: Custom pixel art
- Enemy sprite: Custom pixel art  
- Background: Fantasy dungeon scene
- UI: Dark theme with accent colors (#16213e, #0f3460, #e94560, #f1a208)

---

## Data Persistence

### Local Storage
- **Top Runs**: Array of {floor, time, difficulty} objects (max 3)
- Sorted by floor (descending), then time (ascending)
- Persists across browser sessions

---

## Technical Requirements

### PWA Features
- **Manifest**: For app installation
- **Service Worker**: For offline play
- **Responsive**: Mobile and desktop compatible
- **Performance**: Smooth 60fps canvas rendering

### Technologies
- HTML5 Canvas for game rendering
- Vanilla JavaScript (no frameworks)
- CSS3 with modern responsive units (clamp, vh, vw)
- LocalStorage for data persistence

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari and Android Chrome optimization

---

## Gameplay Balance

### Difficulty Modifiers
- **Easy**: 0.8x enemy stats (learning mode)
- **Normal**: 1.0x enemy stats (standard experience)
- **Hard**: 1.3x enemy stats (expert challenge)

### Stat Caps
- **Attack Speed**: 5.0 (prevents degenerate strategies)
- **Crit Chance**: 75% (prevents full crit builds)
- **Evasion**: 50% (maintains combat engagement)

### Scaling Curve
Linear-exponential: Each floor adds 15% to base stats, creating natural difficulty curve that becomes increasingly challenging but remains theoretically infinite.

---

## Success Criteria

### Core Gameplay
- ✅ Complete runs from start to game over
- ✅ Strategic decisions matter (stat allocation affects outcome)
- ✅ Adaptive AI creates variety (counters player strategies)
- ✅ Increasing difficulty curve (playable but challenging)

### User Experience
- ✅ Intuitive controls and navigation
- ✅ Clear stat information and feedback
- ✅ Smooth performance on mobile devices
- ✅ No scrolling or zooming required

### Technical
- ✅ Works offline after first load
- ✅ Installable as PWA
- ✅ Data persists between sessions
- ✅ Clean, maintainable code structure

---

## Future Expansion Ideas
*(Not part of MVP)*
- Multiple hero classes
- Equipment/items system
- Boss floors every 10 levels
- Achievements and unlockables
- Sound effects and music
- Particle effects for attacks
- Skill tree system
- Multiplayer leaderboards

