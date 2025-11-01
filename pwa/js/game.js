// ========================================
// GAME LOGIC
// Main game state and progression
// ========================================

class GameManager {
    constructor() {
        // Game engines
        this.combat = new CombatEngine();
        this.enemyGen = new EnemyGenerator();
        
        // Game state
        this.difficulty = 'normal';
        this.difficultyMultipliers = {
            easy: 0.90,
            normal: 1.00,
            hard: 1.12
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
        
        // Battle state
        this.battleActive = false;
        this.lastFrameTime = 0;
        
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
            evasion: 0.0,
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
    }

    /**
     * Apply stat point to player
     */
    applyStatPoint(statType) {
        switch (statType) {
            case 'attackSpeed':
                if (this.player.attackSpeed < 5.0) {
                    this.player.attackSpeed += 0.1;
                    if (this.player.attackSpeed > 5.0) this.player.attackSpeed = 5.0;
                }
                break;
            case 'attack':
                this.player.attack += 2;
                break;
            case 'crit':
                if (this.player.critChance < 0.75) {
                    this.player.critChance += 0.01;
                    if (this.player.critChance > 0.75) this.player.critChance = 0.75;
                }
                break;
            case 'evasion':
                if (this.player.evasion < 0.25) {
                    this.player.evasion += 0.01;
                    if (this.player.evasion > 0.25) this.player.evasion = 0.25;
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
     * Start battle for current floor
     */
    startBattle() {
        const diffMult = this.difficultyMultipliers[this.difficulty];
        this.enemy = this.enemyGen.generateEnemy(this.currentFloor, diffMult, this.currentArchetype);
        this.combat.reset();
        this.battleActive = true;
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
            this.availablePoints = 3;
            return true; // Needs stat allocation
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
        this.battleSpeed = this.battleSpeed === 1.0 ? 2.0 : 1.0;
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

