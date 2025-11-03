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
            lifesteal: 0.0,
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
     * @param {boolean} isBoss - Whether this is a boss enemy
     * @returns {Object} Enemy stats
     */
    generateEnemy(floor, difficultyMult, archetype, isBoss = false) {
        const base = { ...this.baseEnemy };
        
        if (floor === 1) {
            base.currentHp = base.maxHp;
            base.archetype = 'BALANCED';
            base.isBoss = false;
            return base;
        }

        // Bosses use BALANCED archetype (no counter)
        const actualArchetype = isBoss ? 'BALANCED' : archetype;
        const bias = this.archetypes[actualArchetype];
        
        let hp = base.maxHp;
        let def = base.defense;
        let atk = base.attack;
        let atkSpd = base.attackSpeed;
        let crit = base.critChance;

        // Scale for each floor from 2 to current floor (REBALANCED v2.1)
        for (let f = 2; f <= floor; f++) {
            // Improved early game scaling reduction
            let earlyGameMult = 1.0;
            if (f <= 10) {
                earlyGameMult = 0.70; // Much gentler floors 1-10
            } else if (f <= 20) {
                earlyGameMult = 0.80; // Still easier floors 11-20
            } else if (f <= 30) {
                earlyGameMult = 0.90; // Moderate floors 21-30
            }
            
            // Reduced HP scaling: HP += HP * (0.040 * diffMult * bias * earlyMult)
            hp += hp * (0.040 * difficultyMult * bias.hp * earlyGameMult);
            
            // Reduced Defense scaling: Def += max(1, round(Def * 0.030 * diffMult * bias * earlyMult))
            const defIncrease = Math.max(1, Math.round(def * 0.030 * difficultyMult * bias.defense * earlyGameMult));
            def += defIncrease;
            
            // Reduced Attack scaling: Atk += max(1, round(Atk * 0.035 * diffMult * bias * earlyMult))
            const atkIncrease = Math.max(1, Math.round(atk * 0.035 * difficultyMult * bias.attack * earlyGameMult));
            atk += atkIncrease;
            
            // Reduced Attack Speed scaling: AtkSpd = min(4.0, AtkSpd + (0.008 * diffMult * bias * earlyMult))
            atkSpd = Math.min(4.0, atkSpd + (0.008 * difficultyMult * bias.attackSpeed * earlyGameMult));
            
            // Critical scaling: Every 10 floors, +0.5% (max 35%)
            if (f % 10 === 0 && crit < 0.35) {
                crit += 0.005;
                if (crit > 0.35) crit = 0.35;
            }
        }

        // Apply boss multipliers (rebalanced)
        if (isBoss) {
            hp *= 1.3;  // Reduced from 1.4
            atk *= 1.15; // Reduced from 1.25
            def *= 1.2;  // Reduced from 1.3
            atkSpd *= 1.1; // Reduced from 1.2
        }

        return {
            attackSpeed: parseFloat(atkSpd.toFixed(2)),
            attack: Math.round(atk),
            critChance: parseFloat(crit.toFixed(4)),
            lifesteal: 0.0,
            defense: Math.round(def),
            maxHp: Math.round(hp),
            currentHp: Math.round(hp),
            archetype: actualArchetype,
            isBoss: isBoss
        };
    }

    /**
     * Determine archetype based on player build (Adaptive AI)
     * Evaluates every 3 floors
     * @param {Object} player - Player stats
     * @returns {string} 'BALANCED', 'TANK', or 'GLASS'
     */
    determineArchetype(player) {
        // Offense score: Attack + (AttackSpeed * 10) + (Crit% * 50) + (Lifesteal% * 25)
        const offenseScore = player.attack + (player.attackSpeed * 10) + (player.critChance * 50) + (player.lifesteal * 25);
        
        // Defense score: Defense + (HP / 10) + (Lifesteal% * 35 for sustain)
        const defenseScore = player.defense + (player.maxHp / 10) + (player.lifesteal * 35);

        // Decision logic
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

    /**
     * Get enemy image based on archetype
     */
    getEnemyImage(archetype, isDead = false) {
        const suffix = isDead ? '-dead' : '';
        const images = {
            BALANCED: `assets/enemy${suffix}.png`,
            TANK: `assets/tank-enemy${suffix}.png`,
            GLASS: `assets/atack-enemy${suffix}.png`
        };
        return images[archetype] || `assets/enemy${suffix}.png`;
    }
}

