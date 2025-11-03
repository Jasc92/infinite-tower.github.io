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
            currentHp: 100
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
    }

    /**
     * Take a snapshot of base stats before allocation
     */
    snapshotBaseStats() {
        this.baseStatsSnapshot = {
            attackSpeed: this.player.attackSpeed,
            attack: this.player.attack,
            critChance: this.player.critChance,
            evasion: this.player.evasion,
            defense: this.player.defense,
            maxHp: this.player.maxHp,
            currentHp: this.player.currentHp
        };
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
        
        // Apply relic stat effects (creates a combat snapshot with bonuses)
        this.relicManager.applyStatEffects(this.player);
        
        this.combat.reset();
        this.combat.relics = this.relicManager.activeRelics; // Pass relics to combat engine
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
        
        // Check for stat points (every 5 floors)
        if (this.currentFloor % 5 === 0) {
            this.availablePoints = 5;
            this.baseStatsSnapshot = null; // Reset snapshot for new allocation
            
            // Grant random relic
            if (this.relicManager.activeRelics.length < 3) {
                const options = this.relicManager.getRandomRelics(1);
                if (options.length > 0) {
                    this.relicManager.addRelic(options[0]);
                }
            }
            
            return true; // Needs stat allocation
        }
        
        // Boss floor bonus points (11, 21, 31, ...)
        // Boss floors: every 10 floors + 1 (11, 21, 31...)
        if ((this.currentFloor - 1) % 10 === 0 && this.currentFloor > 1) {
            this.availablePoints += 3; // Bonus points from boss
        }
        
        return false; // Continue to next battle
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
            evade: parseFloat(this.player.evasion.toFixed(2)),
            def: this.player.defense,
            hp: this.player.maxHp
        };
    }

    /**
     * Toggle battle speed
     */
    toggleSpeed() {
        this.battleSpeed = this.battleSpeed === 1.0 ? 5.0 : 1.0;
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

