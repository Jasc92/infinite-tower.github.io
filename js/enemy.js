// ========================================
// ENEMY GENERATOR
// Implements enemy scaling and adaptive AI
// ========================================

class EnemyGenerator {
    constructor() {
        // Base enemy stats (Floor 1)
        this.baseEnemy = {
            attackSpeed: 0.9,
            attack: 8,
            critChance: 0.02,
            evasion: 0.0,
            defense: 4,
            maxHp: 85,
            currentHp: 85
        };

        // Archetype biases (exact from spec)
        this.archetypes = {
            BALANCED: { hp: 1.0, defense: 1.0, attack: 1.0, attackSpeed: 1.0, crit: 1.0 },
            TANK: { hp: 1.25, defense: 1.20, attack: 0.9, attackSpeed: 0.9, crit: 0.8 },
            GLASS: { hp: 0.8, defense: 0.8, attack: 1.25, attackSpeed: 1.20, crit: 1.1 }
        };
    }

    /**
     * Generate enemy for specific floor with difficulty and archetype
     * @param {number} floor - Current floor number
     * @param {number} difficultyMult - Difficulty multiplier (0.90, 1.00, 1.12)
     * @param {string} archetype - 'BALANCED', 'TANK', or 'GLASS'
     * @returns {Object} Enemy stats
     */
    generateEnemy(floor, difficultyMult, archetype) {
        const base = { ...this.baseEnemy };
        
        if (floor === 1) {
            base.currentHp = base.maxHp;
            return base;
        }

        const bias = this.archetypes[archetype];
        
        let hp = base.maxHp;
        let def = base.defense;
        let atk = base.attack;
        let atkSpd = base.attackSpeed;
        let crit = base.critChance;

        // Scale for each floor from 2 to current floor
        for (let f = 2; f <= floor; f++) {
            // Softer scaling for early floors (1-15)
            const earlyGameMult = f <= 15 ? 0.85 : 1.0;
            
            // HP scaling: HP += HP * (0.055 * diffMult * bias * earlyMult)
            hp += hp * (0.055 * difficultyMult * bias.hp * earlyGameMult);
            
            // Defense scaling: Def += max(1, round(Def * 0.045 * diffMult * bias * earlyMult))
            const defIncrease = Math.max(1, Math.round(def * 0.045 * difficultyMult * bias.defense * earlyGameMult));
            def += defIncrease;
            
            // Attack scaling: Atk += max(1, round(Atk * 0.040 * diffMult * bias * earlyMult))
            const atkIncrease = Math.max(1, Math.round(atk * 0.040 * difficultyMult * bias.attack * earlyGameMult));
            atk += atkIncrease;
            
            // Attack Speed scaling: AtkSpd = min(4.0, AtkSpd + (0.01 * diffMult * bias * earlyMult))
            atkSpd = Math.min(4.0, atkSpd + (0.01 * difficultyMult * bias.attackSpeed * earlyGameMult));
            
            // Critical scaling: Every 10 floors, +0.5% (max 35%)
            if (f % 10 === 0 && crit < 0.35) {
                crit += 0.005;
                if (crit > 0.35) crit = 0.35;
            }
        }

        return {
            attackSpeed: parseFloat(atkSpd.toFixed(2)),
            attack: Math.round(atk),
            critChance: parseFloat(crit.toFixed(4)),
            evasion: 0.0,
            defense: Math.round(def),
            maxHp: Math.round(hp),
            currentHp: Math.round(hp)
        };
    }

    /**
     * Determine archetype based on player build (Adaptive AI)
     * Evaluates every 3 floors
     * @param {Object} player - Player stats
     * @returns {string} 'BALANCED', 'TANK', or 'GLASS'
     */
    determineArchetype(player) {
        // Offense score: Attack + (AttackSpeed * 10) + (Crit% * 50)
        const offenseScore = player.attack + (player.attackSpeed * 10) + (player.critChance * 50);
        
        // Defense score: Defense + (HP / 10) + (Evasion% * 30)
        const defenseScore = player.defense + (player.maxHp / 10) + (player.evasion * 30);

        // Decision logic (exact from spec)
        if (offenseScore > defenseScore * 1.15) {
            return 'TANK'; // Counter offense with tank
        } else if (defenseScore > offenseScore * 1.15) {
            return 'GLASS'; // Counter defense with glass cannon
        } else {
            return 'BALANCED';
        }
    }

    /**
     * Get archetype display name
     */
    getArchetypeName(archetype) {
        const names = {
            BALANCED: 'Balanced',
            TANK: 'Tank',
            GLASS: 'Glass Cannon'
        };
        return names[archetype] || 'Balanced';
    }
}

