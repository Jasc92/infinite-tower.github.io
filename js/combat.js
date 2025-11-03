// ========================================
// COMBAT ENGINE
// Implements continuous-time auto-battle
// ========================================

class CombatEngine {
    constructor() {
        this.playerAttackTimer = 0;
        this.enemyAttackTimer = 0;
        this.floatingTexts = []; // Store active floating text
    }

    reset() {
        this.playerAttackTimer = 0;
        this.enemyAttackTimer = 0;
        this.floatingTexts = [];
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
            const damageInfo = this.calculateDamage(
                player.attack,
                player.critChance,
                enemy.defense,
                enemy.evasion
            );
            enemy.currentHp -= damageInfo.damage;

            // Add floating text for enemy
            this.addFloatingText(damageInfo, 'enemy');

            // Reset timer: 1 / attackSpeed
            this.playerAttackTimer = 1 / player.attackSpeed;

            if (enemy.currentHp <= 0) {
                return 'player_win';
            }
        }

        // Enemy attacks
        if (this.enemyAttackTimer <= 0) {
            const damageInfo = this.calculateDamage(
                enemy.attack,
                enemy.critChance,
                player.defense,
                player.evasion
            );
            player.currentHp -= damageInfo.damage;

            // Add floating text for player
            this.addFloatingText(damageInfo, 'player');

            // Reset timer: 1 / attackSpeed
            this.enemyAttackTimer = 1 / enemy.attackSpeed;

            if (player.currentHp <= 0) {
                return 'player_loss';
            }
        }

        // Update floating texts
        this.floatingTexts = this.floatingTexts.filter(text => {
            text.lifetime -= deltaTime;
            // Fade out in the last 0.5 seconds
            text.opacity = text.lifetime < 0.5 ? text.lifetime / 0.5 : 1.0;
            return text.lifetime > 0;
        });

        return 'ongoing';
    }

    addFloatingText(damageInfo, target) {
        // Generate random offset immediately to avoid stacking
        const randomOffsetX = (Math.random() - 0.5) * 80;
        const randomOffsetY = Math.random() * 30;
        
        this.floatingTexts.push({
            text: damageInfo.text,
            damage: damageInfo.damage,
            isCrit: damageInfo.isCrit,
            isMiss: damageInfo.isMiss,
            target: target, // 'player' or 'enemy'
            offsetX: randomOffsetX,
            offsetY: randomOffsetY,
            lifetime: 1.5, // seconds - increased for better visibility
            opacity: 1.0
        });
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
            return {
                damage: 0,
                isMiss: true,
                isCrit: false,
                text: 'MISS!'
            };
        }

        // 2. Critical check
        const isCrit = Math.random() < critChance;
        const rawDamage = isCrit 
            ? (attack * 2) - targetDefense 
            : attack - targetDefense;

        // 3. Minimum damage is 1
        const finalDamage = Math.max(1, rawDamage);
        
        return {
            damage: finalDamage,
            isMiss: false,
            isCrit: isCrit,
            text: isCrit ? `${finalDamage} CRIT!` : `${finalDamage}`
        };
    }
}

