// ========================================
// COMBAT ENGINE
// Implements continuous-time auto-battle
// ========================================

class CombatEngine {
    constructor() {
        this.playerAttackTimer = 0;
        this.enemyAttackTimer = 0;
        this.floatingTexts = []; // Store active floating text
        this.relics = []; // Active relics for this battle
        this.combatTime = 0; // Track combat duration for Momentum
        this.firstHit = true; // Track first hit for First Blood
        this.bleedDamageTimer = 0; // Timer for bleed ticks
        this.regenTimer = 0; // Timer for regen ticks
    }

    reset() {
        this.playerAttackTimer = 0;
        this.enemyAttackTimer = 0;
        this.floatingTexts = [];
        this.combatTime = 0;
        this.firstHit = true;
        this.bleedDamageTimer = 0;
        this.regenTimer = 0;
        // Reset relic states
        this.relics.forEach(relic => {
            if (relic.id === 'second_wind') relic.used = false;
            if (relic.id === 'last_stand') relic.survived = false;
        });
    }

    /**
     * Update combat state
     * @param {Object} player - Player stats
     * @param {Object} enemy - Enemy stats
     * @param {number} deltaTime - Time since last update (seconds)
     * @returns {string} 'ongoing', 'player_win', or 'player_loss'
     */
    update(player, enemy, deltaTime) {
        // Track combat time for Momentum
        this.combatTime += deltaTime;
        
        // Update attack timers
        this.playerAttackTimer -= deltaTime;
        this.enemyAttackTimer -= deltaTime;
        
        // Update relic timers
        this.bleedDamageTimer -= deltaTime;
        this.regenTimer -= deltaTime;
        
        // Regeneration relic (heal 2% max HP per second)
        const regenRelic = this.relics.find(r => r.id === 'regeneration');
        if (regenRelic && this.regenTimer <= 0) {
            const healAmount = Math.round(player.maxHp * regenRelic.regenPercent);
            player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
            this.addFloatingText({
                damage: healAmount,
                isMiss: false,
                isCrit: false,
                isHeal: true,
                text: `💚 +${healAmount}`
            }, 'player');
            this.regenTimer = 1.0; // Tick every second
        }

        // Player attacks
        if (this.playerAttackTimer <= 0) {
            // Check Adrenaline for attack speed boost
            let effectivePlayerSpeed = player.attackSpeed;
            const adrenaline = this.relics.find(r => r.id === 'adrenaline');
            if (adrenaline && (player.currentHp / player.maxHp) < adrenaline.threshold) {
                effectivePlayerSpeed *= (1 + adrenaline.speedBoost);
            }
            
            const damageInfo = this.calculateDamage(
                player.attack,
                player.critChance,
                enemy.defense,
                player,
                enemy,
                true // isPlayer attacking
            );
            enemy.currentHp -= damageInfo.damage;

            // Lifesteal healing
            if (player.lifesteal > 0 && damageInfo.damage > 0 && !damageInfo.isMiss) {
                const healAmount = Math.round(damageInfo.damage * player.lifesteal);
                player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
                
                // Add heal floating text with heart icon
                if (healAmount > 0) {
                    this.addFloatingText({
                        damage: healAmount,
                        isMiss: false,
                        isCrit: false,
                        isHeal: true,
                        text: `💚 +${healAmount}`
                    }, 'player');
                }
            }
            
            // Bleed application
            const bleedRelic = this.relics.find(r => r.id === 'bleed');
            if (bleedRelic && damageInfo.damage > 0 && !damageInfo.isMiss) {
                const bleedDamage = Math.round(enemy.maxHp * bleedRelic.bleedPercent);
                enemy.bleedDamage = bleedDamage;
                enemy.bleedDuration = bleedRelic.bleedDuration;
            }

            // Add floating text for enemy
            this.addFloatingText(damageInfo, 'enemy');
            
            // Double Strike relic
            const doubleStrike = this.relics.find(r => r.id === 'double_strike');
            if (doubleStrike && Math.random() < doubleStrike.doubleStrikeChance) {
                const bonusDamageInfo = this.calculateDamage(
                    player.attack,
                    player.critChance,
                    enemy.defense,
                    player,
                    enemy,
                    true
                );
                enemy.currentHp -= bonusDamageInfo.damage;
                this.addFloatingText(bonusDamageInfo, 'enemy');
            }
            
            this.firstHit = false; // Mark first hit as done

            // Reset timer: 1 / attackSpeed (with adrenaline bonus if applicable)
            this.playerAttackTimer = 1 / effectivePlayerSpeed;

            if (enemy.currentHp <= 0) {
                return 'player_win';
            }
        }
        
        // Bleed damage over time
        if (enemy.bleedDuration > 0 && this.bleedDamageTimer <= 0) {
            const tickDamage = Math.round(enemy.bleedDamage / 3); // 3 ticks over 3 seconds
            enemy.currentHp -= tickDamage;
            enemy.bleedDuration -= 1;
            this.addFloatingText({
                damage: tickDamage,
                isMiss: false,
                isCrit: false,
                isHeal: false,
                text: `🩸 ${tickDamage}`
            }, 'enemy');
            this.bleedDamageTimer = 1.0; // Tick every second
            
            if (enemy.currentHp <= 0) {
                return 'player_win';
            }
        }

        // Enemy attacks
        if (this.enemyAttackTimer <= 0) {
            let damageInfo = this.calculateDamage(
                enemy.attack,
                enemy.critChance,
                player.defense,
                enemy,
                player,
                false // enemy attacking
            );
            
            // Thick Skin (damage reduction)
            const thickSkin = this.relics.find(r => r.id === 'thick_skin');
            if (thickSkin) {
                const originalDamage = damageInfo.damage;
                damageInfo.damage = Math.round(damageInfo.damage * (1 - thickSkin.damageReduction));
                console.log(`🐘 Thick Skin: ${originalDamage} → ${damageInfo.damage} (-${Math.round((1 - (damageInfo.damage / originalDamage)) * 100)}%)`);
            }
            
            // Second Wind check
            const secondWind = this.relics.find(r => r.id === 'second_wind');
            if (secondWind && !secondWind.used && 
                player.currentHp > 0 && 
                (player.currentHp - damageInfo.damage) < (player.maxHp * secondWind.triggerThreshold)) {
                const healAmount = Math.round(player.maxHp * secondWind.healPercent);
                player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
                secondWind.used = true;
                this.addFloatingText({
                    damage: healAmount,
                    isMiss: false,
                    isCrit: false,
                    isHeal: true,
                    text: `🌬️ +${healAmount}`
                }, 'player');
            }
            
            // Last Stand check
            const lastStand = this.relics.find(r => r.id === 'last_stand');
            if (lastStand && !lastStand.survived && 
                (player.currentHp - damageInfo.damage) <= 0 && 
                player.currentHp > 0) {
                player.currentHp = 1;
                lastStand.survived = true;
                damageInfo.damage = player.currentHp - 1; // Reduce to not kill
                this.addFloatingText({
                    damage: 0,
                    isMiss: false,
                    isCrit: false,
                    isHeal: false,
                    text: `⚔️ SURVIVED!`
                }, 'player');
            } else {
                player.currentHp -= damageInfo.damage;
            }

            // Thorns (reflect damage)
            const thorns = this.relics.find(r => r.id === 'thorns');
            if (thorns && damageInfo.damage > 0 && !damageInfo.isMiss) {
                const reflectDamage = Math.round(damageInfo.damage * thorns.reflectPercent);
                enemy.currentHp -= reflectDamage;
                this.addFloatingText({
                    damage: reflectDamage,
                    isMiss: false,
                    isCrit: false,
                    isHeal: false,
                    text: `🌵 ${reflectDamage}`
                }, 'enemy');
                
                if (enemy.currentHp <= 0) {
                    return 'player_win';
                }
            }

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
     * Calculate damage with relic modifications
     */
    calculateDamage(attack, critChance, targetDefense, attacker, target, isPlayerAttacking) {
        let modifiedAttack = attack;
        let modifiedCritChance = critChance;
        let critMultiplier = 2.0;
        
        if (isPlayerAttacking) {
            // Momentum: +1% damage per second of combat (max 30%)
            const momentum = this.relics.find(r => r.id === 'momentum');
            if (momentum) {
                const stacks = Math.min(momentum.maxStacks, Math.floor(this.combatTime));
                const bonus = stacks * momentum.damagePerSecond;
                modifiedAttack = Math.round(attack * (1 + bonus));
                if (stacks > 0) {
                    console.log(`📈 Momentum: +${Math.round(bonus * 100)}% (${stacks}s)`);
                }
            }
            
            // Adrenaline: +25% attack speed below 50% HP (affects damage calc timing, not damage directly)
            // Last Stand buff: +50% damage for 5s after surviving
            const lastStand = this.relics.find(r => r.id === 'last_stand');
            if (lastStand && lastStand.survived && this.combatTime < 5) {
                modifiedAttack = Math.round(modifiedAttack * (1 + lastStand.buffDamage));
            }
            
            // Critical Mass: 2.5x crit instead of 2x
            const critMass = this.relics.find(r => r.id === 'critical_mass');
            if (critMass) {
                critMultiplier = critMass.critMultiplier;
            }
            
            // First Blood: first hit always crits
            const firstBlood = this.relics.find(r => r.id === 'first_blood');
            if (firstBlood && this.firstHit) {
                modifiedCritChance = 1.0;
            }
        }
        
        // Critical check
        const isCrit = Math.random() < modifiedCritChance;
        
        // Armor Piercing: ignore 30% of defense
        let effectiveDefense = targetDefense;
        if (isPlayerAttacking) {
            const armorPierce = this.relics.find(r => r.id === 'armor_piercing');
            if (armorPierce) {
                effectiveDefense = Math.round(targetDefense * (1 - armorPierce.armorPierce));
            }
        }
        
        const rawDamage = isCrit 
            ? (modifiedAttack * critMultiplier) - effectiveDefense 
            : modifiedAttack - effectiveDefense;

            // Execute: 3x damage to enemies below 20% HP
            let finalDamage = Math.max(1, rawDamage);
            if (isPlayerAttacking) {
                const execute = this.relics.find(r => r.id === 'execute');
                if (execute && (target.currentHp / target.maxHp) < execute.executeThreshold) {
                    const preExecute = finalDamage;
                    finalDamage = Math.round(finalDamage * execute.executeDamage);
                    console.log(`☠️ Execute: ${preExecute} → ${finalDamage} (3x)`);
                }
            }
        
        return {
            damage: finalDamage,
            isMiss: false,
            isCrit: isCrit,
            isHeal: false,
            text: isCrit ? `${finalDamage} CRIT!` : `${finalDamage}`
        };
    }
}

