## Active Ability Feature Proposal

### Summary
- **Goal**: Add a single active ability that the player can trigger during combat via a new UI button placed to the left of the current relic slots.
- **Scope**: Deliver an extensible system that supports one ability today but can grow to multiple skills without major refactors.
- **Pillar**: Preserve the game’s accessible auto-battler feel while giving players a moment-to-moment tactical lever.

---

### Proposed Active Abilities (12 concepts)
Each ability includes a suggested cooldown, effect, and a short note on intended synergies.

1. **Arcane Surge**  
   - *Cooldown*: 12s  
   - *Effect*: Instantly grants +50% attack speed and +30% damage for 4s.  
   - *Synergy*: Works well with `Rage Combo`, `Energy Surge`, and high-crit builds.

2. **Fortress Wall**  
   - *Cooldown*: 16s  
   - *Effect*: Gain a shield equal to 40% max HP; shield decays after absorbing 300 damage or 6s.  
   - *Synergy*: Complements `Diamond Shield`, `Shield Battery`, and defensive stat builds.

3. **Blood Transfusion**  
   - *Cooldown*: 18s  
   - *Effect*: Sacrifice 15% current HP to heal 45% of missing HP over 5s.  
   - *Synergy*: Amplifies `Vampire`, `Lifesteal` builds, and relics that trigger on low HP (`Last Stand`, `Spite`).

4. **Time Dilation**  
   - *Cooldown*: 20s  
   - *Effect*: Enemy attack speed reduced by 40% and damage by 25% for 6s.  
   - *Synergy*: Helps survive burst phases; stacks meaningfully with `Thick Skin` and `Iron Will`.

5. **Execution Protocol**  
   - *Cooldown*: 22s  
   - *Effect*: Next 3 attacks deal +200% damage to enemies below 35% HP.  
   - *Synergy*: Reinforces `Execute`, `Executioner`, and crit-focused relics.

6. **Blade Storm**  
   - *Cooldown*: 15s  
   - *Effect*: Perform 5 rapid strikes dealing 65% weapon damage each; cannot crit but ignore 50% defense.  
   - *Synergy*: Great with flat attack boosts, `Armor Piercing`, and attack-speed relics.

7. **Adrenal Boost**  
   - *Cooldown*: 14s  
   - *Effect*: Fully refills Energy Surge timer and grants +20% dodge chance for 4s.  
   - *Synergy*: Direct boost to `Energy Surge`, synergises with `Blink`, `Recycle`, high-speed builds.

8. **Bulwark Chant**  
   - *Cooldown*: 18s  
   - *Effect*: +40 defense and 20% damage reflection for 6s.  
   - *Synergy*: Works with tanky relics (`Fortify`, `Thorns`, `Battle Hardened`).

9. **Critical Focus**  
   - *Cooldown*: 12s  
   - *Effect*: Next 5 hits are guaranteed crits; crit damage reduced by 15% to avoid overkill spikes.  
   - *Synergy*: Supports relics like `Critical Mass`, `First Blood`, and crit-heavy stat allocations.

10. **Tactical Retreat**  
    - *Cooldown*: 20s  
    - *Effect*: Immediately dash back, avoiding all damage for 1s and healing 20% max HP.  
    - *Synergy*: Provides a panic button; interacts with `Potion Master` by mitigating HP loss.

11. **Overcharge Beam**  
    - *Cooldown*: 16s  
    - *Effect*: Fires a piercing beam dealing 250% attack damage, ignoring shields and applying `Bleed`.  
    - *Synergy*: Pairs with `Bleed`, `Weak Point`, and any defense-ignoring setups.

12. **Momentum Breaker**  
    - *Cooldown*: 14s  
    - *Effect*: Resets enemy combo stacks, removes buffs, and grants player +15% damage for 5s.  
    - *Synergy*: Counters heavy-hitting enemies, increases value of sustained offense builds.

---

### Technical Implementation Plan

#### 1. Data Model
- Introduce a new `ActiveAbility` definition (`abilities.js`):
  ```js
  {
    id: 'arcane_surge',
    name: 'Arcane Surge',
    cooldown: 12,
    icon: '🪄',
    description: 'Gain +50% attack speed and +30% damage for 4s.',
    onActivate(player, enemy, context) { ... }
  }
  ```
- Store base cooldown, icon, effect handler (function or scriptable trigger), and optional relic modifiers.
- Extend `GameManager` with:
  - `activeAbilityId`
  - `abilityCooldownRemaining`
  - `abilityState` (ready, casting, onCooldown)
  - `abilityHistory` (for analytics / debugging).

#### 2. UI Changes
- In `index.html`, inside the battle HUD:
  - Add a new button container left of the relic slots, respecting existing flex layout.
  - Button states: `ready`, `cooldown`, `disabled` (when ability not unlocked).
  - Display remaining cooldown as overlay text or radial fill.
- In `css/styles.css`:
  - Create `.ability-button`, `.ability-button.cooldown`, `.ability-button.disabled`.
  - Ensure hover/tap feedback consistent with existing style.

#### 3. Input Handling
- Add event listener in `js/app.js` to handle click/tap on the ability button.
- Integrate keyboard shortcut (optional, e.g., `Space` or `A`).
- Debounce to prevent double triggers while state updates propagate.

#### 4. Game Loop Integration
- Update combat loop (`combat.js` / `GameManager.updateBattle`) to tick ability cooldown: `cooldownRemaining = Math.max(0, cooldown - delta)`.
- When ability fires, push temporary modifiers into combat engine (e.g., `player.tempBuffs` array with expiration).
- Provide hooks for effects that need to run per frame (e.g., damage over time).

#### 5. Ability Effects
- Reuse existing combat modifiers where possible:
  - Attack speed/damage boosts -> apply to `player.attackSpeed`, `player.damageMultiplier` with timed rollback.
  - Shields -> same logic as `Diamond Shield` but flagged as ability-generated.
  - Direct damage -> call `combat.applyDamage(enemy, amount, { source: 'ability' })`.
  - Crowd control (slow, stun) -> extend enemy state to support temporary debuffs.
- Add a generic `registerTimedEffect({ apply, rollback, duration })` utility to centralize start/end logic.

#### 6. Persistence & Unlocks
- Initially unlocked by default.
- Future-ready: store chosen ability in save data, allow unlocking via relics or milestones.

#### 7. Testing Strategy
- Unit tests for ability cooldown logic.
- Simulation tests ensuring ability effects stack correctly with relics (e.g., double buff stacking).
- UI tests for button state transitions.

---

### Feature Assessment

| Criteria | Assessment |
| --- | --- |
| **Gameplay Value** | Adds a skill expression layer without overwhelming players; one-button design keeps the flow accessible. |
| **Complexity** | Moderate. Biggest tasks are UI integration, combat hooks, and ability script architecture. Our existing relic and buff systems provide many reusable patterns. |
| **Risks** | Balancing ability power vs. relic combos; ensuring cooldown visuals remain clear on small screens; need to avoid ability spam breaking auto-battler pacing. |
| **Extensibility** | High. The proposed data-driven approach enables future abilities, relic synergies (e.g., relic reduces ability cooldown), or even enemy abilities. |
| **Performance** | Negligible impact if effects are pooled and modifiers are cleaned up promptly. |

**Verdict**: The feature aligns with the game’s design goals. It introduces a single, skill-based input that rewards situational awareness, leverages existing buff/debuff systems, and sets a foundation for future expansions (multiple abilities, relic modifiers, talent trees). Proceeding with implementation is recommended.
