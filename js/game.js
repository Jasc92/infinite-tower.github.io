// ========================================
// GAME LOGIC
// Main game state and progression
// ========================================

class GameManager {
    constructor() {
        // Game engines
        this.combat = new CombatEngine();
        this.enemyGen = new EnemyGenerator();
        this.relicManager = new RelicManager();
        this.abilityManager = new AbilityManager();
        
        // Game state
        this.difficulty = 'normal';
        this.difficultyMultipliers = {
            easy: 0.85,   // Softer enemies
            normal: 1.00, // Balanced
            hard: 1.15    // Harder enemies
        };
        
        // Player stats (base)
        this.player = this.createBasePlayer();
        
        // Enemy stats
        this.enemy = null;
        
        // Run state
        this.currentFloor = 1;
        this.availablePoints = 5;
        this.runStartTime = null;
        this.currentArchetype = 'BALANCED';
        this.floorsUntilArchetypeCheck = 3;
        this.battleSpeed = 1.0;
        
        // Stat allocation tracking
        this.baseStatsSnapshot = null;
        
        // Battle state
        this.battleActive = false;
        this.lastFrameTime = 0;
        this.battleResult = null; // 'win', 'lose', or null
        
        // Sprites and canvas
        this.canvas = null;
        this.ctx = null;
        this.sprites = {
            hero: null,
            enemy: null,
            background: null
        };

        // Pending screens queue
        this.pendingScreens = [];
        
        // Ability state
        this.activeAbilityId = null;
        this.abilityCooldownRemaining = 0;
        this.abilityEffectRemaining = 0;
        this.abilityState = 'locked'; // locked, ready, active, cooldown
        this.abilityModifiers = {
            player: this.createEmptyAbilityModifiers(),
            enemy: this.createEmptyEnemyAbilityModifiers()
        };
        this.nextAbilityFloor = 15;
        this.abilityStacks = {
            critGuarantee: 0
        };
        this.abilityHealing = {
            healPerSecond: 0,
            remaining: 0
        };
    }

    /**
     * Create base player stats (exact from spec)
     */
    createBasePlayer() {
        return {
            attackSpeed: 1.0,
            attack: 10,
            critChance: 0.05,
            lifesteal: 0.0,
            defense: 5,
            maxHp: 100,
            currentHp: 100,
            shield: 0, // Shield system (absorbs damage, prevents crits while active)
            maxShield: 0 // Maximum shield for this battle
        };
    }

    createEmptyAbilityModifiers() {
        return {
            attackMult: 1,
            attackSpeedMult: 1,
            damageMult: 1,
            dodgeBonus: 0,
            defenseFlat: 0,
            reflectPercent: 0,
            ignoreShield: false,
            applyBleed: false,
            bleedPercent: 0,
            shieldPercent: 0,
            invulnerable: false
        };
    }

    createEmptyEnemyAbilityModifiers() {
        return {
            attackSpeedMult: 1,
            damageMult: 1
        };
    }

    /**
     * Reset game state for new run
     */
    resetRun() {
        this.player = this.createBasePlayer();
        this.enemy = null;
        this.currentFloor = 1;
        this.availablePoints = 5;
        this.runStartTime = Date.now();
        this.currentArchetype = 'BALANCED';
        this.floorsUntilArchetypeCheck = 3;
        this.battleSpeed = 1.0;
        this.battleActive = false;
        this.relicManager.reset();
        this.pendingScreens = [];
        
        // Ability reset
        this.activeAbilityId = null;
        this.abilityCooldownRemaining = 0;
        this.abilityEffectRemaining = 0;
        this.abilityState = 'locked';
        this.nextAbilityFloor = 15;
        this.abilityModifiers.player = this.createEmptyAbilityModifiers();
        this.abilityModifiers.enemy = this.createEmptyEnemyAbilityModifiers();
        this.abilityStacks = { critGuarantee: 0 };
        this.abilityHealing = { healPerSecond: 0, remaining: 0 };
        
        // Save base stats (before any relic effects) for clean relic application
        this.basePlayerStats = {
            attack: this.player.attack,
            attackSpeed: this.player.attackSpeed,
            critChance: this.player.critChance,
            lifesteal: this.player.lifesteal,
            defense: this.player.defense,
            maxHp: this.player.maxHp
        };
        // Also track stats without relic effects (for percentage recalculation)
        this.baseStatsWithoutRelics = { ...this.basePlayerStats };
    }

    /**
     * Take a snapshot of base stats before allocation
     */
    snapshotBaseStats() {
        this.baseStatsSnapshot = {
            attackSpeed: this.player.attackSpeed,
            attack: this.player.attack,
            critChance: this.player.critChance,
            lifesteal: this.player.lifesteal,
            defense: this.player.defense,
            maxHp: this.player.maxHp,
            currentHp: this.player.currentHp
        };
        console.log('=== SNAPSHOT BASE STATS ===', this.baseStatsSnapshot);
    }

    /**
     * Apply stat point to player
     */
    applyStatPoint(statType) {
        switch (statType) {
            case 'attackSpeed':
                if (this.player.attackSpeed < 6.0) {
                    // Balanced: +0.12 per point, max 6.0
                    this.player.attackSpeed += 0.12;
                    if (this.player.attackSpeed > 6.0) this.player.attackSpeed = 6.0;
                }
                break;
            case 'attack':
                this.player.attack += 2;
                break;
            case 'crit':
                if (this.player.critChance < 0.75) {
                    // Improved: +2% per point
                    this.player.critChance += 0.02;
                    if (this.player.critChance > 0.75) this.player.critChance = 0.75;
                }
                break;
            case 'lifesteal':
                if (this.player.lifesteal < 0.40) {
                    // New: +2% lifesteal per point, max 40%
                    this.player.lifesteal += 0.02;
                    if (this.player.lifesteal > 0.40) this.player.lifesteal = 0.40;
                }
                break;
            case 'defense':
                this.player.defense += 2;
                break;
            case 'hp':
                this.player.maxHp += 10;
                this.player.currentHp += 10;
                break;
        }
    }

    /**
     * Remove stat point from player
     * NOTE: This function expects player stats to already be restored to baseStatsWithoutRelics
     * It compares against baseStatsSnapshot to determine if a point can be removed
     */
    removeStatPoint(statType) {
        if (!this.baseStatsSnapshot || !this.baseStatsWithoutRelics) return false;
        
        // Get snapshot value (the value when we entered stats screen)
        let snapshotValue;
        let currentBaseValue;
        
        switch (statType) {
            case 'attackSpeed':
                snapshotValue = this.baseStatsSnapshot.attackSpeed;
                currentBaseValue = this.baseStatsWithoutRelics.attackSpeed;
                if (currentBaseValue > snapshotValue) {
                    this.player.attackSpeed = Math.max(snapshotValue, currentBaseValue - 0.12);
                    return true;
                }
                break;
            case 'attack':
                snapshotValue = this.baseStatsSnapshot.attack;
                currentBaseValue = this.baseStatsWithoutRelics.attack;
                if (currentBaseValue > snapshotValue) {
                    this.player.attack = Math.max(snapshotValue, currentBaseValue - 2);
                    return true;
                }
                break;
            case 'crit':
                snapshotValue = this.baseStatsSnapshot.critChance;
                currentBaseValue = this.baseStatsWithoutRelics.critChance;
                if (currentBaseValue > snapshotValue) {
                    this.player.critChance = Math.max(snapshotValue, currentBaseValue - 0.02);
                    return true;
                }
                break;
            case 'lifesteal':
                snapshotValue = this.baseStatsSnapshot.lifesteal;
                currentBaseValue = this.baseStatsWithoutRelics.lifesteal;
                if (currentBaseValue > snapshotValue) {
                    this.player.lifesteal = Math.max(snapshotValue, currentBaseValue - 0.02);
                    return true;
                }
                break;
            case 'defense':
                snapshotValue = this.baseStatsSnapshot.defense;
                currentBaseValue = this.baseStatsWithoutRelics.defense;
                if (currentBaseValue > snapshotValue) {
                    this.player.defense = Math.max(snapshotValue, currentBaseValue - 2);
                    return true;
                }
                break;
            case 'hp':
                snapshotValue = this.baseStatsSnapshot.maxHp;
                currentBaseValue = this.baseStatsWithoutRelics.maxHp;
                if (currentBaseValue > snapshotValue) {
                    const hpReduction = Math.min(10, currentBaseValue - snapshotValue);
                    this.player.maxHp = currentBaseValue - hpReduction;
                    this.player.currentHp = Math.max(1, this.player.currentHp - hpReduction);
                    return true;
                }
                break;
        }
        return false;
    }

    /**
     * Update basePlayerStats to current player stats
     * This is called after stat allocation (before relic effects)
     * IMPORTANT: Must be called AFTER removing relic effects from player stats
     * Saves stats WITHOUT relic effects, then applies relics to get final stats
     */
    updateBasePlayerStats() {
        // CRITICAL: Player stats should already be without relic effects at this point
        // If they're not, we need to restore them first
        if (this.baseStatsWithoutRelics) {
            // Restore player stats to base (without relics) before saving
            this.player.attack = this.baseStatsWithoutRelics.attack;
            this.player.attackSpeed = this.baseStatsWithoutRelics.attackSpeed;
            this.player.critChance = this.baseStatsWithoutRelics.critChance;
            this.player.lifesteal = this.baseStatsWithoutRelics.lifesteal;
            this.player.defense = this.baseStatsWithoutRelics.defense;
            this.player.maxHp = this.baseStatsWithoutRelics.maxHp;
        }
        
        // Now save current stats (which should be without relic effects)
        this.baseStatsWithoutRelics = {
            attack: this.player.attack,
            attackSpeed: this.player.attackSpeed,
            critChance: this.player.critChance,
            lifesteal: this.player.lifesteal,
            defense: this.player.defense,
            maxHp: this.player.maxHp
        };
        
        // Now apply relic effects to get final stats (with percentage effects recalculated)
        this.applyRelicEffectsToBaseStats();
        
        console.log('=== UPDATED BASE PLAYER STATS ===');
        console.log('Without relics:', this.baseStatsWithoutRelics);
        console.log('With relics:', this.basePlayerStats);
    }

    /**
     * Apply relic effects to base stats (recalculates percentage effects)
     * This ensures percentage effects scale with current stat values
     */
    applyRelicEffectsToBaseStats() {
        // Restore player stats from base (without relics)
        if (!this.baseStatsWithoutRelics) {
            this.baseStatsWithoutRelics = { ...this.basePlayerStats };
        }
        
        // Copy base stats without relics to player
        this.player.attack = this.baseStatsWithoutRelics.attack;
        this.player.attackSpeed = this.baseStatsWithoutRelics.attackSpeed;
        this.player.critChance = this.baseStatsWithoutRelics.critChance;
        this.player.lifesteal = this.baseStatsWithoutRelics.lifesteal;
        this.player.defense = this.baseStatsWithoutRelics.defense;
        this.player.maxHp = this.baseStatsWithoutRelics.maxHp;
        
        // Apply relic effects (flat first, then percentage)
        this.relicManager.applyStatEffects(this.player);
        
        // Save final stats with relic effects
        this.basePlayerStats = {
            attack: this.player.attack,
            attackSpeed: this.player.attackSpeed,
            critChance: this.player.critChance,
            lifesteal: this.player.lifesteal,
            defense: this.player.defense,
            maxHp: this.player.maxHp
        };
    }

    /**
     * Check if current floor is a boss floor
     */
    isBossFloor() {
        // Boss floors: 11, 21, 31, 41...
        return (this.currentFloor - 1) % 10 === 0 && this.currentFloor > 1;
    }

    /**
     * Start battle for current floor
     */
    startBattle() {
        const diffMult = this.difficultyMultipliers[this.difficulty];
        const isBoss = this.isBossFloor();
        this.enemy = this.enemyGen.generateEnemy(this.currentFloor, diffMult, this.currentArchetype, isBoss);
        
        // Restore base stats (which already include relic stat effects applied once)
        if (this.basePlayerStats) {
            this.player.attack = this.basePlayerStats.attack;
            this.player.attackSpeed = this.basePlayerStats.attackSpeed;
            this.player.critChance = this.basePlayerStats.critChance;
            this.player.lifesteal = this.basePlayerStats.lifesteal;
            this.player.defense = this.basePlayerStats.defense;
            this.player.maxHp = this.basePlayerStats.maxHp;
            this.player.currentHp = this.player.maxHp; // Full HP for new battle
        }
        
        // Reset shield for new battle
        this.player.shield = 0;
        this.player.maxShield = 0;
        
        // Apply Diamond Shield relic (if active)
        const diamondShield = this.relicManager.activeRelics.find(r => r.id === 'diamond_shield');
        if (diamondShield) {
            this.player.maxShield = Math.round(this.player.maxHp * diamondShield.shieldPercent);
            this.player.shield = this.player.maxShield;
            console.log(`💎 Diamond Shield: ${this.player.shield}/${this.player.maxShield} shield`);
        }
        
        // Apply Potion Master HP loss per floor (if active)
        const potionMaster = this.relicManager.activeRelics.find(r => r.id === 'potion_master');
        if (potionMaster && this.currentFloor > 1) {
            const hpLoss = Math.round(this.player.maxHp * potionMaster.hpLossPerFloor);
            this.player.maxHp = Math.max(10, this.player.maxHp - hpLoss); // Minimum 10 HP
            this.player.currentHp = Math.min(this.player.currentHp, this.player.maxHp);
            console.log(`⚗️ Potion Master: Lost ${hpLoss} max HP (now ${this.player.maxHp})`);
        }
        
        // Apply Power Spike (if active) - permanent stat boost every 5 floors
        const powerSpike = this.relicManager.activeRelics.find(r => r.id === 'power_spike');
        if (powerSpike && this.currentFloor % powerSpike.floorInterval === 0) {
            const boost = 1 + powerSpike.statBoost;
            this.player.attack = Math.round(this.player.attack * boost);
            this.player.attackSpeed = Math.min(6.0, this.player.attackSpeed * boost);
            this.player.critChance = Math.min(0.75, this.player.critChance * boost);
            this.player.lifesteal = Math.min(0.40, this.player.lifesteal * boost);
            this.player.defense = Math.round(this.player.defense * boost);
            this.player.maxHp = Math.round(this.player.maxHp * boost);
            this.player.currentHp = Math.min(this.player.currentHp, this.player.maxHp);
            console.log(`⚡ Power Spike: +${powerSpike.statBoost * 100}% to all stats`);
        }
        
        // NOTE: Relic stat effects (effect()) are NO LONGER applied here
        // They are applied ONCE when relics are selected, and basePlayerStats is updated
        // Only combat effects (critMultiplier, armorPierce, etc.) are checked in combat.js
        
        // Reset ability timers when entering battle (cooldowns carry over)
        this.combat.reset();
        this.combat.relics = this.relicManager.activeRelics; // Pass relics to combat engine
        this.applyAbilityStateToCombat();
        console.log('Relics passed to combat engine:', this.combat.relics.length);
        
        this.battleActive = true;
        this.battleResult = null; // Reset battle result
        this.lastFrameTime = performance.now();
    }

    /**
     * Update battle (call in animation loop)
     */
    updateBattle(timestamp) {
        if (!this.battleActive || !this.enemy) return 'ongoing';

        const deltaTime = (timestamp - this.lastFrameTime) / 1000 * this.battleSpeed;
        this.lastFrameTime = timestamp;

        this.updateAbilityTimers(deltaTime);
        const result = this.combat.update(this.player, this.enemy, deltaTime);
        this.abilityStacks.critGuarantee = this.combat.abilityPlayerMods.critGuarantee;
        
        if (result === 'player_win') {
            this.battleActive = false;
            return 'win';
        } else if (result === 'player_loss') {
            this.battleActive = false;
            return 'loss';
        }
        
        return 'ongoing';
    }

    /**
     * Proceed to next floor
     */
    nextFloor() {
        this.currentFloor++;
        const actions = [];
        
        // Check for archetype change (every 3 floors)
        this.floorsUntilArchetypeCheck--;
        if (this.floorsUntilArchetypeCheck <= 0) {
            this.currentArchetype = this.enemyGen.determineArchetype(this.player);
            this.floorsUntilArchetypeCheck = 3;
        }
        
        // Restore player HP
        this.player.currentHp = this.player.maxHp;
        
        // Boss floor bonus points (11, 21, 31, ...)
        if ((this.currentFloor - 1) % 10 === 0 && this.currentFloor > 1) {
            this.availablePoints += 3;
        }
        
        const isRelicFloor = this.currentFloor === 1 || ((this.currentFloor - 1) % 10 === 0 && this.currentFloor > 1);
        const isStatFloor = (this.currentFloor - 1) % 5 === 0 && this.currentFloor > 1;
        const isAbilityFloor = (this.currentFloor - 1) % 15 === 0 && this.currentFloor > 1;
        
        if (isRelicFloor) {
            if (this.currentFloor === 1) {
                this.availablePoints = 5;
            } else {
                this.availablePoints += 5;
            }
            this.baseStatsSnapshot = null;
            actions.push('relic');
        }
        
        if (isAbilityFloor) {
            actions.push('ability');
        }
        
        if (isStatFloor) {
            this.availablePoints += 5;
            this.baseStatsSnapshot = null;
            actions.push('stats');
        }
        
        if (actions.length === 0) {
            this.pendingScreens = [];
            return 'battle';
        }
        
        this.pendingScreens = actions.slice(1);
        return actions[0];
    }

    getNextPendingScreen() {
        if (this.pendingScreens.length === 0) {
            return 'battle';
        }
        return this.pendingScreens.shift();
    }

    equipAbility(abilityId) {
        this.activeAbilityId = abilityId;
        this.abilityCooldownRemaining = 0;
        this.abilityEffectRemaining = 0;
        this.abilityState = abilityId ? 'ready' : 'locked';
        this.abilityModifiers.player = this.createEmptyAbilityModifiers();
        this.abilityModifiers.enemy = this.createEmptyEnemyAbilityModifiers();
        this.abilityStacks = { critGuarantee: 0 };
        this.abilityHealing = { healPerSecond: 0, remaining: 0 };
        this.applyAbilityStateToCombat();
    }

    getActiveAbility() {
        return this.activeAbilityId ? this.abilityManager.getAbilityById(this.activeAbilityId) : null;
    }

    hasPendingScreens() {
        return this.pendingScreens.length > 0;
    }

    applyAbilityStateToCombat() {
        this.combat.setAbilityModifiers(
            { ...this.abilityModifiers.player, critGuarantee: this.abilityStacks.critGuarantee },
            { ...this.abilityModifiers.enemy }
        );
    }

    activateAbility() {
        if (this.abilityState !== 'ready' || !this.activeAbilityId) return false;
        const ability = this.abilityManager.getAbilityById(this.activeAbilityId);
        if (!ability) return false;
        console.log('Activating ability:', ability.name);
        this.abilityState = ability.duration > 0 ? 'active' : 'cooldown';
        this.abilityEffectRemaining = ability.duration || 0;
        this.abilityCooldownRemaining = ability.cooldown;
        this.applyAbility(ability);
        this.applyAbilityStateToCombat();
        return true;
    }

    applyAbility(ability) {
        const data = ability.data || {};
        const playerMods = this.abilityModifiers.player;
        const enemyMods = this.abilityModifiers.enemy;

        switch (ability.type) {
            case 'buff':
                if (data.attackSpeedMult) playerMods.attackSpeedMult *= data.attackSpeedMult;
                if (data.damageMult) playerMods.damageMult *= data.damageMult;
                if (data.attackMult) playerMods.attackMult *= data.attackMult;
                if (data.dodgeBonus) playerMods.dodgeBonus += data.dodgeBonus;
                if (data.defenseFlat) playerMods.defenseFlat += data.defenseFlat;
                if (data.reflectPercent) playerMods.reflectPercent += data.reflectPercent;
                if (data.refreshEnergySurge) {
                    this.combat.energySurgeTimer = 0;
                    this.combat.energySurgeReady = true;
                }
                if (data.resetEnemyCombos) {
                    this.combat.rageComboHits = 0;
                    this.combat.weakPointHits = 0;
                }
                break;
            case 'shield':
                const shieldAmount = Math.round(this.player.maxHp * data.shieldPercent);
                this.player.shield = Math.max(this.player.shield || 0, shieldAmount);
                this.player.maxShield = Math.max(this.player.maxShield || 0, this.player.shield);
                playerMods.shieldPercent = data.shieldPercent;
                break;
            case 'heal_over_time':
                const cost = Math.round(this.player.currentHp * data.costPercentCurrent);
                this.player.currentHp = Math.max(1, this.player.currentHp - cost);
                const missingHp = Math.max(0, this.player.maxHp - this.player.currentHp);
                const totalHeal = Math.round(missingHp * data.healPercentMissing);
                const duration = data.duration || 5;
                this.abilityHealing.healPerSecond = totalHeal / duration;
                this.abilityHealing.remaining = duration;
                break;
            case 'enemy_debuff':
                if (data.enemyAttackSpeedMult) enemyMods.attackSpeedMult *= data.enemyAttackSpeedMult;
                if (data.enemyDamageMult) enemyMods.damageMult *= data.enemyDamageMult;
                break;
            case 'execute_buff':
                playerMods.damageMult *= data.damageMult || 1;
                playerMods.executeThreshold = data.threshold || 0.35;
                playerMods.executeDamageMult = data.damageMult || 3;
                break;
            case 'burst_damage':
                this.performBurstDamage(data);
                break;
            case 'crit_buff':
                this.abilityStacks.critGuarantee = data.critHits || 5;
                playerMods.critDamageMult = data.critDamageMult || 1;
                break;
            case 'invulnerability':
                playerMods.invulnerable = true;
                if (data.healPercentMax) {
                    const healAmt = Math.round(this.player.maxHp * data.healPercentMax);
                    this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + healAmt);
                }
                break;
            default:
                break;
        }
    }

    performBurstDamage(data) {
        const enemy = this.enemy;
        if (!enemy) return;
        let totalDamage = 0;
        const hits = data.hits || 1;
        for (let i = 0; i < hits; i++) {
            const damage = Math.round(this.player.attack * (data.damagePercent || 1));
            let effectiveDamage = damage;
            if (!data.ignoreShield && enemy.shield && enemy.shield > 0) {
                const shieldAbsorb = Math.min(enemy.shield, effectiveDamage);
                enemy.shield -= shieldAbsorb;
                effectiveDamage -= shieldAbsorb;
            }
            if (effectiveDamage > 0) {
                const defenseFactor = data.defenseIgnore ? (1 - data.defenseIgnore) : 1;
                const defense = Math.round(enemy.defense * defenseFactor);
                const finalDamage = Math.max(1, effectiveDamage - defense);
                enemy.currentHp -= finalDamage;
                totalDamage += finalDamage;
                enemy.lastDamageTime = this.combat.combatTime;
                enemy.lastDamageAmount = finalDamage;
                enemy.lastDamageIsCrit = false;
            }
        }
        if (data.applyBleed) {
            enemy.bleedDamage = Math.round(enemy.maxHp * (data.bleedPercent || 0.05));
            enemy.bleedDuration = 3;
        }
        if (totalDamage > 0) {
            this.combat.addFloatingText({
                damage: totalDamage,
                isMiss: false,
                isCrit: false,
                isHeal: false,
                text: `${totalDamage}`
            }, 'enemy');
        }
        if (enemy.currentHp <= 0) {
            enemy.currentHp = 0;
        }
    }

    expireAbility(ability) {
        const playerMods = this.abilityModifiers.player;
        const enemyMods = this.abilityModifiers.enemy;

        this.abilityModifiers.player = this.createEmptyAbilityModifiers();
        this.abilityModifiers.enemy = this.createEmptyEnemyAbilityModifiers();
        this.abilityStacks.critGuarantee = 0;
        this.abilityHealing = { healPerSecond: 0, remaining: 0 };
        this.applyAbilityStateToCombat();
    }

    updateAbilityTimers(deltaTime) {
        if (!this.activeAbilityId || this.abilityState === 'locked') return;

        const ability = this.abilityManager.getAbilityById(this.activeAbilityId);
        if (!ability) return;

        if (this.abilityState === 'active') {
            if (this.abilityHealing.remaining > 0 && this.abilityHealing.healPerSecond > 0) {
                const healTick = Math.min(this.abilityHealing.healPerSecond * deltaTime, this.abilityHealing.healPerSecond * this.abilityHealing.remaining);
                this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + healTick);
                this.abilityHealing.remaining = Math.max(0, this.abilityHealing.remaining - deltaTime);
            }

            this.abilityEffectRemaining -= deltaTime;
            if (this.abilityEffectRemaining <= 0) {
                this.expireAbility(ability);
                this.abilityState = 'cooldown';
                this.abilityEffectRemaining = 0;
            }
        }

        if (this.abilityState === 'cooldown') {
            this.abilityCooldownRemaining -= deltaTime;
            if (this.abilityCooldownRemaining <= 0) {
                this.abilityCooldownRemaining = 0;
                this.abilityState = 'ready';
            }
        }

        if (this.abilityState === 'active' || this.abilityState === 'cooldown') {
            if (this.abilityState !== 'active') {
                this.abilityModifiers.player.invulnerable = false;
            }
        }
    }

    /**
     * Get run duration in seconds
     */
    getRunDuration() {
        return Math.floor((Date.now() - this.runStartTime) / 1000);
    }

    /**
     * Create build snapshot for top runs
     */
    createBuildSnapshot() {
        return {
            atk: this.player.attack,
            atkSpd: parseFloat(this.player.attackSpeed.toFixed(1)),
            crit: parseFloat(this.player.critChance.toFixed(2)),
            lifesteal: parseFloat(this.player.lifesteal.toFixed(2)),
            def: this.player.defense,
            hp: this.player.maxHp,
            ability: this.activeAbilityId
        };
    }

    /**
     * Toggle battle speed: 1x -> 3x -> 5x -> 1x
     */
    toggleSpeed() {
        if (this.battleSpeed === 1.0) {
            this.battleSpeed = 3.0;
        } else if (this.battleSpeed === 3.0) {
            this.battleSpeed = 5.0;
        } else {
            this.battleSpeed = 1.0;
        }
        return this.battleSpeed;
    }
}

// ========================================
// TOP RUNS MANAGER
// LocalStorage persistence
// ========================================

class TopRunsManager {
    constructor() {
        this.storageKey = 'infinite_tower_top_runs';
    }

    /**
     * Load top runs from LocalStorage
     */
    loadTopRuns() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading top runs:', e);
            return [];
        }
    }

    /**
     * Save a new run if it's in top 3
     */
    saveTopRun(floor, duration, difficulty, build) {
        try {
            const runs = this.loadTopRuns();
            
            runs.push({
                floor,
                durationSec: duration,
                difficulty,
                build
            });
            
            // Sort: floor descending, then duration ascending
            runs.sort((a, b) => {
                if (b.floor !== a.floor) return b.floor - a.floor;
                return a.durationSec - b.durationSec;
            });
            
            // Keep only top 3
            const topThree = runs.slice(0, 3);
            
            localStorage.setItem(this.storageKey, JSON.stringify(topThree));
            
            return true;
        } catch (e) {
            console.error('Error saving top run:', e);
            return false;
        }
    }

    /**
     * Check if run qualifies for top 3
     */
    isTopRun(floor, duration) {
        const runs = this.loadTopRuns();
        
        if (runs.length < 3) return true;
        
        const worstRun = runs[runs.length - 1];
        return floor > worstRun.floor || (floor === worstRun.floor && duration < worstRun.durationSec);
    }
}

