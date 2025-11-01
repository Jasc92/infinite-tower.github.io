// ========================================
// COMBAT ENGINE
// Implements continuous-time auto-battle
// ========================================

class CombatEngine {
    constructor() {
        this.playerAttackTimer = 0;
        this.enemyAttackTimer = 0;
    }

    reset() {
        this.playerAttackTimer = 0;
        this.enemyAttackTimer = 0;
    }

    /**
     * Update combat state
     * @param {Object} player - Player stats
     * @param {Object} enemy - Enemy stats
     * @param {number} deltaTime - Time since last update (seconds)
     * @returns {string} 'ongoing', 'player_win', or 'player_loss'
     */
    update(player, enemy, deltaTime) {
        // Update attack timers
        this.playerAttackTimer -= deltaTime;
        this.enemyAttackTimer -= deltaTime;

        // Player attacks
        if (this.playerAttackTimer <= 0) {
            const damage = this.calculateDamage(
                player.attack,
                player.critChance,
                enemy.defense,
                enemy.evasion
            );
            enemy.currentHp -= damage;

            // Reset timer: 1 / attackSpeed
            this.playerAttackTimer = 1 / player.attackSpeed;

            if (enemy.currentHp <= 0) {
                return 'player_win';
            }
        }

        // Enemy attacks
        if (this.enemyAttackTimer <= 0) {
            const damage = this.calculateDamage(
                enemy.attack,
                enemy.critChance,
                player.defense,
                player.evasion
            );
            player.currentHp -= damage;

            // Reset timer: 1 / attackSpeed
            this.enemyAttackTimer = 1 / enemy.attackSpeed;

            if (player.currentHp <= 0) {
                return 'player_loss';
            }
        }

        return 'ongoing';
    }

    /**
     * Calculate damage following spec sequence:
     * 1. Evasion check → miss
     * 2. Critical check → double damage
     * 3. Subtract defense
     * 4. Minimum 1 damage
     */
    calculateDamage(attack, critChance, targetDefense, targetEvasion) {
        // 1. Evasion check
        if (Math.random() < targetEvasion) {
            return 0; // Miss
        }

        // 2. Critical check
        const isCrit = Math.random() < critChance;
        const rawDamage = isCrit 
            ? (attack * 2) - targetDefense 
            : attack - targetDefense;

        // 3. Minimum damage is 1
        return Math.max(1, rawDamage);
    }
}

