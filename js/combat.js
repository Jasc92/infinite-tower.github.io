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
        
        // NEW RELIC MECHANICS - Modular counters and timers
        this.rageComboHits = 0; // Rage Combo: consecutive hits
        this.weakPointHits = 0; // Weak Point: defense ignore scaling
        this.battleHardenedHits = 0; // Battle Hardened: defense stacking
        this.retaliateCount = 0; // Retaliate: counter-attack count
        this.shieldRegenTimer = 0; // Shield Battery: shield regeneration timer
        this.energySurgeTimer = 0; // Energy Surge: cooldown timer
        this.energySurgeReady = false; // Energy Surge: ready state
        this.recycleBoostTimer = 0; // Recycle: speed boost timer
        this.recycleBoostActive = false; // Recycle: boost active state
    }

    reset() {
        this.playerAttackTimer = 0;
        this.enemyAttackTimer = 0;
        this.floatingTexts = [];
        this.combatTime = 0;
        this.firstHit = true;
        this.bleedDamageTimer = 0;
        this.regenTimer = 0;
        
        // Reset new relic mechanics
        this.rageComboHits = 0;
        this.weakPointHits = 0;
        this.battleHardenedHits = 0;
        this.retaliateCount = 0;
        this.shieldRegenTimer = 0;
        
        // Energy Surge: Initialize timer to interval so it waits 4 seconds before first surge
        const energySurge = this.relics.find(r => r.id === 'energy_surge');
        if (energySurge) {
            this.energySurgeTimer = energySurge.surgeInterval; // Start with full interval (4.0)
        } else {
            this.energySurgeTimer = 0;
        }
        this.energySurgeReady = false;
        
        this.recycleBoostTimer = 0;
        this.recycleBoostActive = false;
        
        // Reset relic states
        this.relics.forEach(relic => {
            if (relic.id === 'second_wind') relic.used = false;
            if (relic.id === 'last_stand') relic.survived = false;
        });
    }
    
    /**
     * Reset damage tracking for fighters (for shake effect)
     */
    resetDamageTracking(player, enemy) {
        if (player) {
            player.lastDamageTime = undefined;
            player.lastDamageAmount = undefined;
            player.lastDamageIsCrit = undefined;
        }
        if (enemy) {
            enemy.lastDamageTime = undefined;
            enemy.lastDamageAmount = undefined;
            enemy.lastDamageIsCrit = undefined;
        }
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
        this.shieldRegenTimer -= deltaTime;
        this.energySurgeTimer -= deltaTime;
        this.recycleBoostTimer -= deltaTime;
        
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
                text: `💚+${healAmount}` // Compact spacing
            }, 'player');
            this.regenTimer = 1.0; // Tick every second
        }
        
        // Potion Master: heal 3% max HP every 3 seconds (separate timer)
        const potionMaster = this.relics.find(r => r.id === 'potion_master');
        if (potionMaster) {
            // Use regenTimer for Potion Master if no Regeneration relic
            if (!regenRelic && this.regenTimer <= 0) {
                const healAmount = Math.round(player.maxHp * potionMaster.healPercent);
                player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
                this.addFloatingText({
                    damage: healAmount,
                    isMiss: false,
                    isCrit: false,
                    isHeal: true,
                    text: `⚗️+${healAmount}`
                }, 'player');
                this.regenTimer = potionMaster.healInterval;
            }
        }
        
        // Shield Battery: regenerate shield every 5 seconds (if shield is broken)
        const shieldBattery = this.relics.find(r => r.id === 'shield_battery');
        if (shieldBattery && player.shield <= 0 && this.shieldRegenTimer <= 0) {
            const regenAmount = Math.round(player.maxHp * shieldBattery.shieldRegenPercent);
            player.shield = Math.min(player.maxShield || regenAmount, regenAmount);
            player.maxShield = Math.max(player.maxShield || 0, player.shield);
            if (player.shield > 0) {
                console.log(`🔄 Shield Battery: Regenerated ${player.shield} shield`);
            }
            this.shieldRegenTimer = shieldBattery.shieldRegenInterval;
        }
        
        // Energy Surge: cooldown timer (every 4 seconds)
        const energySurge = this.relics.find(r => r.id === 'energy_surge');
        if (energySurge && this.energySurgeTimer <= 0) {
            this.energySurgeReady = true;
            this.energySurgeTimer = energySurge.surgeInterval;
        }
        
        // Recycle: speed boost timer (3 seconds)
        if (this.recycleBoostActive && this.recycleBoostTimer <= 0) {
            this.recycleBoostActive = false;
        }
        
        // Recycle: update timer
        if (this.recycleBoostActive) {
            this.recycleBoostTimer -= deltaTime;
        }

        // Player attacks
        if (this.playerAttackTimer <= 0) {
            // Check Adrenaline for attack speed boost
            let effectivePlayerSpeed = player.attackSpeed;
            const adrenaline = this.relics.find(r => r.id === 'adrenaline');
            if (adrenaline && (player.currentHp / player.maxHp) < adrenaline.threshold) {
                effectivePlayerSpeed *= (1 + adrenaline.speedBoost);
            }
            
            // Recycle: speed boost if active
            if (this.recycleBoostActive) {
                const recycle = this.relics.find(r => r.id === 'recycle');
                if (recycle) {
                    effectivePlayerSpeed *= (1 + recycle.speedBoost);
                }
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
            
            // Track damage for visual feedback (shake effect)
            if (damageInfo.damage > 0 && !damageInfo.isMiss) {
                enemy.lastDamageTime = this.combatTime;
                enemy.lastDamageAmount = damageInfo.damage;
                enemy.lastDamageIsCrit = damageInfo.isCrit; // Track if it was a crit
                
                // Rage Combo: increment hits on successful hit
                const rageCombo = this.relics.find(r => r.id === 'rage_combo');
                if (rageCombo) {
                    this.rageComboHits++;
                }
                
                // Weak Point: increment hits on successful hit
                const weakPoint = this.relics.find(r => r.id === 'weak_point');
                if (weakPoint) {
                    this.weakPointHits++;
                }
            } else if (damageInfo.isMiss) {
                // Rage Combo: reset on miss
                const rageCombo = this.relics.find(r => r.id === 'rage_combo');
                if (rageCombo) {
                    this.rageComboHits = 0;
                }
            }

            // Lifesteal healing
            if (player.lifesteal > 0 && damageInfo.damage > 0 && !damageInfo.isMiss) {
                const healAmount = Math.round(damageInfo.damage * player.lifesteal);
                player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
                
                // Add heal floating text (only number in green)
                if (healAmount > 0) {
                    this.addFloatingText({
                        damage: healAmount,
                        isMiss: false,
                        isCrit: false,
                        isHeal: true,
                        text: `+${healAmount}`
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
                
                // Track damage for visual feedback (shake effect)
                if (bonusDamageInfo.damage > 0 && !bonusDamageInfo.isMiss) {
                    enemy.lastDamageTime = this.combatTime;
                    enemy.lastDamageAmount = bonusDamageInfo.damage;
                    enemy.lastDamageIsCrit = bonusDamageInfo.isCrit; // Track if it was a crit
                }
                
                this.addFloatingText(bonusDamageInfo, 'enemy');
            }
            
            this.firstHit = false; // Mark first hit as done

            // Reset timer: 1 / attackSpeed (with adrenaline bonus if applicable)
            this.playerAttackTimer = 1 / effectivePlayerSpeed;

            // Check win condition AFTER damage application (accounting for speed multiplier)
            if (enemy.currentHp <= 0) {
                enemy.currentHp = 0; // Clamp to 0
                return 'player_win';
            }
        }
        
        // Bleed damage over time
        if (enemy.bleedDuration > 0 && this.bleedDamageTimer <= 0) {
            const tickDamage = Math.round(enemy.bleedDamage / 3); // 3 ticks over 3 seconds
            enemy.currentHp -= tickDamage;
            enemy.bleedDuration -= 1;
            
            // Track damage for visual feedback (shake effect)
            if (tickDamage > 0) {
                enemy.lastDamageTime = this.combatTime;
                enemy.lastDamageAmount = tickDamage;
                enemy.lastDamageIsCrit = false; // Bleed ticks are never crits
            }
            
            this.addFloatingText({
                damage: tickDamage,
                isMiss: false,
                isCrit: false,
                isHeal: false,
                text: `🩸${tickDamage}` // Compact spacing
            }, 'enemy');
            this.bleedDamageTimer = 1.0; // Tick every second
            
            // Check win condition AFTER bleed damage (accounting for speed multiplier)
            if (enemy.currentHp <= 0) {
                enemy.currentHp = 0; // Clamp to 0
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
            
            // SHIELD SYSTEM: If player has shield, prevent critical hits
            // While shield is active, critical hits are treated as normal damage
            if (player.shield > 0 && damageInfo.isCrit) {
                // Convert crit to normal damage (shield prevents crits)
                damageInfo.isCrit = false;
                // Recalculate damage as normal hit (2x becomes 1x)
                const baseDamage = enemy.attack - player.defense;
                damageInfo.damage = Math.max(1, baseDamage);
                damageInfo.text = `${damageInfo.damage}`;
            }
            
            // Blink: 20% chance to dodge completely
            const blink = this.relics.find(r => r.id === 'blink');
            if (blink && Math.random() < blink.dodgeChance) {
                damageInfo.damage = 0;
                damageInfo.isMiss = true;
                damageInfo.text = 'DODGE!';
                
                // Recycle: trigger on dodge
                const recycle = this.relics.find(r => r.id === 'recycle');
                if (recycle) {
                    this.recycleBoostActive = true;
                    this.recycleBoostTimer = recycle.boostDuration;
                }
            }
            
            // Thick Skin (damage reduction) - check if player has this relic
            const thickSkin = this.relics.find(r => r.id === 'thick_skin');
            if (thickSkin && damageInfo.damage > 0 && !damageInfo.isMiss) {
                const originalDamage = damageInfo.damage;
                damageInfo.damage = Math.round(damageInfo.damage * (1 - thickSkin.damageReduction));
                console.log(`🐘 Thick Skin: ${originalDamage} → ${damageInfo.damage} (-${Math.round((1 - (damageInfo.damage / originalDamage)) * 100)}%)`);
            }
            
            // Iron Will: -10% damage from critical hits, +20 Defense (already applied via flatEffects)
            const ironWill = this.relics.find(r => r.id === 'iron_will');
            if (ironWill && damageInfo.isCrit && damageInfo.damage > 0 && !damageInfo.isMiss) {
                const originalDamage = damageInfo.damage;
                damageInfo.damage = Math.round(damageInfo.damage * (1 - ironWill.critDamageReduction));
            }
            
            // Battle Hardened: +1 defense per hit taken (max +20, resets on heal above 80% HP)
            const battleHardened = this.relics.find(r => r.id === 'battle_hardened');
            if (battleHardened && damageInfo.damage > 0 && !damageInfo.isMiss) {
                // Check if we should reset (healed above 80% HP)
                if ((player.currentHp / player.maxHp) > battleHardened.resetThreshold) {
                    this.battleHardenedHits = 0;
                } else {
                    this.battleHardenedHits = Math.min(battleHardened.defenseMax, this.battleHardenedHits + battleHardened.defensePerHit);
                    player.defense += battleHardened.defensePerHit; // Temporary bonus
                }
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
                    text: `🌬️+${healAmount}` // Compact spacing
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
                    text: `⚔️SURVIVED` // Compact spacing, removed exclamation
                }, 'player');
            } else {
                // SHIELD SYSTEM: Absorb damage with shield first
                if (player.shield > 0 && damageInfo.damage > 0 && !damageInfo.isMiss) {
                    const shieldAbsorbed = Math.min(player.shield, damageInfo.damage);
                    player.shield -= shieldAbsorbed;
                    const remainingDamage = damageInfo.damage - shieldAbsorbed;
                    
                    if (remainingDamage > 0) {
                        player.currentHp -= remainingDamage;
                    }
                    
                    // Track damage for visual feedback (shake effect)
                    player.lastDamageTime = this.combatTime;
                    player.lastDamageAmount = damageInfo.damage;
                    player.lastDamageIsCrit = false; // Shield absorbs as normal damage
                } else {
                    player.currentHp -= damageInfo.damage;
                    
                    // Track damage for visual feedback (shake effect)
                    if (damageInfo.damage > 0 && !damageInfo.isMiss) {
                        player.lastDamageTime = this.combatTime;
                        player.lastDamageAmount = damageInfo.damage;
                        player.lastDamageIsCrit = damageInfo.isCrit; // Track if it was a crit
                    }
                }
            }
            
            // Retaliate: counter-attack first 5 hits received
            const retaliate = this.relics.find(r => r.id === 'retaliate');
            if (retaliate && this.retaliateCount < retaliate.maxCounters && damageInfo.damage > 0 && !damageInfo.isMiss) {
                this.retaliateCount++;
                const counterDamage = Math.round(player.attack * retaliate.counterDamage);
                const counterDamageInfo = this.calculateDamage(
                    counterDamage,
                    player.critChance,
                    enemy.defense,
                    player,
                    enemy,
                    true
                );
                enemy.currentHp -= counterDamageInfo.damage;
                
                // Track damage for visual feedback
                if (counterDamageInfo.damage > 0) {
                    enemy.lastDamageTime = this.combatTime;
                    enemy.lastDamageAmount = counterDamageInfo.damage;
                    enemy.lastDamageIsCrit = counterDamageInfo.isCrit;
                }
                
                this.addFloatingText({
                    damage: counterDamageInfo.damage,
                    isMiss: false,
                    isCrit: counterDamageInfo.isCrit,
                    isHeal: false,
                    text: `⚔️${counterDamageInfo.damage}`
                }, 'enemy');
                
                // Check win condition after retaliate
                if (enemy.currentHp <= 0) {
                    enemy.currentHp = 0;
                    return 'player_win';
                }
            }

            // Thorns (reflect damage)
            const thorns = this.relics.find(r => r.id === 'thorns');
            if (thorns && damageInfo.damage > 0 && !damageInfo.isMiss) {
                const reflectDamage = Math.round(damageInfo.damage * thorns.reflectPercent);
                enemy.currentHp -= reflectDamage;
                
                // Track damage for visual feedback (shake effect)
                if (reflectDamage > 0) {
                    enemy.lastDamageTime = this.combatTime;
                    enemy.lastDamageAmount = reflectDamage;
                    enemy.lastDamageIsCrit = false; // Thorns damage is never crits
                }
                
                this.addFloatingText({
                    damage: reflectDamage,
                    isMiss: false,
                    isCrit: false,
                    isHeal: false,
                    text: `🌵${reflectDamage}` // Compact spacing
                }, 'enemy');
                
                // Check win condition AFTER thorns damage (accounting for speed multiplier)
                if (enemy.currentHp <= 0) {
                    enemy.currentHp = 0; // Clamp to 0
                    return 'player_win';
                }
            }

            // Add floating text for player
            this.addFloatingText(damageInfo, 'player');

            // Reset timer: 1 / attackSpeed
            this.enemyAttackTimer = 1 / enemy.attackSpeed;

            // Check loss condition AFTER damage application (accounting for speed multiplier)
            if (player.currentHp <= 0) {
                player.currentHp = 0; // Clamp to 0
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
            isHeal: damageInfo.isHeal || false, // Include isHeal property
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
        
        // NEW RELIC MECHANICS - Apply before calculating damage
        
        // Rage Combo: +5% damage per consecutive hit (max 50%, resets on miss)
        if (isPlayerAttacking) {
            const rageCombo = this.relics.find(r => r.id === 'rage_combo');
            if (rageCombo) {
                const comboBonus = Math.min(this.rageComboHits * rageCombo.comboDamagePerHit, rageCombo.comboMaxDamage);
                modifiedAttack = Math.round(modifiedAttack * (1 + comboBonus));
            }
            
            // Spite: +60% damage below 30% HP
            const spite = this.relics.find(r => r.id === 'spite');
            if (spite && (attacker.currentHp / attacker.maxHp) < spite.lowHpThreshold) {
                modifiedAttack = Math.round(modifiedAttack * (1 + spite.lowHpDamageBoost));
            }
            
            // Weak Point: ignore more defense per hit (max 60%)
            const weakPoint = this.relics.find(r => r.id === 'weak_point');
            if (weakPoint) {
                const ignoreBonus = Math.min(this.weakPointHits * weakPoint.defenseIgnorePerHit, weakPoint.defenseIgnoreMax);
                effectiveDefense = Math.round(effectiveDefense * (1 - ignoreBonus));
            }
            
            // Executioner: +50% damage to enemies below 40% HP (stacks with Execute)
            const executioner = this.relics.find(r => r.id === 'executioner');
            if (executioner && (target.currentHp / target.maxHp) < executioner.executeThreshold) {
                modifiedAttack = Math.round(modifiedAttack * executioner.executeDamage);
            }
            
            // Precision Strike: cannot miss but -10% damage
            const precisionStrike = this.relics.find(r => r.id === 'precision_strike');
            if (precisionStrike) {
                modifiedAttack = Math.round(modifiedAttack * (1 - precisionStrike.damageReduction));
            }
            
            // Energy Surge: 2.5x damage if ready
            const energySurge = this.relics.find(r => r.id === 'energy_surge');
            if (energySurge && this.energySurgeReady) {
                modifiedAttack = Math.round(modifiedAttack * energySurge.surgeMultiplier);
                this.energySurgeReady = false; // Consume the surge
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
        
        // Precision Strike: cannot miss
        let isMiss = false;
        if (isPlayerAttacking) {
            const precisionStrike = this.relics.find(r => r.id === 'precision_strike');
            if (precisionStrike) {
                isMiss = false; // Cannot miss
            }
        }
        
        // Energy Surge: cannot miss when ready
        if (isPlayerAttacking) {
            const energySurge = this.relics.find(r => r.id === 'energy_surge');
            if (energySurge && this.energySurgeReady) {
                isMiss = false; // Cannot miss
            }
        }
        
        return {
            damage: finalDamage,
            isMiss: isMiss,
            isCrit: isCrit,
            isHeal: false,
            text: isCrit ? `${finalDamage} CRIT!` : `${finalDamage}`
        };
    }
}

