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
     */
    removeStatPoint(statType) {
        if (!this.baseStatsSnapshot) return false;
        
        switch (statType) {
            case 'attackSpeed':
                if (this.player.attackSpeed > this.baseStatsSnapshot.attackSpeed) {
                    this.player.attackSpeed -= 0.12;
                    if (this.player.attackSpeed < this.baseStatsSnapshot.attackSpeed) {
                        this.player.attackSpeed = this.baseStatsSnapshot.attackSpeed;
                    }
                    return true;
                }
                break;
            case 'attack':
                if (this.player.attack > this.baseStatsSnapshot.attack) {
                    this.player.attack -= 2;
                    return true;
                }
                break;
            case 'crit':
                if (this.player.critChance > this.baseStatsSnapshot.critChance) {
                    this.player.critChance -= 0.02;
                    if (this.player.critChance < this.baseStatsSnapshot.critChance) {
                        this.player.critChance = this.baseStatsSnapshot.critChance;
                    }
                    return true;
                }
                break;
            case 'lifesteal':
                if (this.player.lifesteal > this.baseStatsSnapshot.lifesteal) {
                    this.player.lifesteal -= 0.02;
                    if (this.player.lifesteal < this.baseStatsSnapshot.lifesteal) {
                        this.player.lifesteal = this.baseStatsSnapshot.lifesteal;
                    }
                    return true;
                }
                break;
            case 'defense':
                if (this.player.defense > this.baseStatsSnapshot.defense) {
                    this.player.defense -= 2;
                    return true;
                }
                break;
            case 'hp':
                if (this.player.maxHp > this.baseStatsSnapshot.maxHp) {
                    this.player.maxHp -= 10;
                    this.player.currentHp -= 10;
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
        
        this.combat.reset();
        this.combat.relics = this.relicManager.activeRelics; // Pass relics to combat engine
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

        const result = this.combat.update(this.player, this.enemy, deltaTime);
        
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
        
        // Check for archetype change (every 3 floors)
        this.floorsUntilArchetypeCheck--;
        if (this.floorsUntilArchetypeCheck <= 0) {
            this.currentArchetype = this.enemyGen.determineArchetype(this.player);
            this.floorsUntilArchetypeCheck = 3;
        }
        
        // Restore player HP
        this.player.currentHp = this.player.maxHp;
        
        // Boss floor bonus points (11, 21, 31, ...)
        // Boss floors: every 10 floors + 1 (11, 21, 31...)
        if ((this.currentFloor - 1) % 10 === 0 && this.currentFloor > 1) {
            this.availablePoints += 3; // Bonus points from boss
        }
        
        // NEW RELIC SYSTEM: 1 at start, then every 10 floors (10, 20, 30, ...) BEFORE boss floors
        // Floor 1 (start): relic selection
        // Floor 10 (before boss 11): relic selection
        // Floor 20 (before boss 21): relic selection
        // etc.
        if (this.currentFloor === 1 || (this.currentFloor % 10 === 0 && this.currentFloor > 1)) {
            // Add stat points (5 at start, 5 every floor)
            if (this.currentFloor === 1) {
                this.availablePoints = 5; // Start with 5 points
            } else {
                this.availablePoints += 5; // Add 5 points each floor
            }
            this.baseStatsSnapshot = null; // Reset snapshot for new allocation
            
            return 'relic'; // Relic selection
        }
        
        // Every other floor: stat allocation
        this.availablePoints += 5; // ADD points instead of resetting
        this.baseStatsSnapshot = null; // Reset snapshot for new allocation
        
        return 'stats'; // Stat allocation
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
            hp: this.player.maxHp
        };
    }

    /**
     * Toggle battle speed
     */
    toggleSpeed() {
        this.battleSpeed = this.battleSpeed === 1.0 ? 3.0 : 1.0;
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

