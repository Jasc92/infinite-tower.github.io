// ========================================
// RELIC SYSTEM
// Implements relic collection and effects
// ========================================

class RelicManager {
    constructor() {
        // Relic pool - 20 unique relics
        this.relicPool = [
            // OFFENSIVE (7)
            {
                id: 'berserker_rage',
                name: 'Berserker Rage',
                description: '+15% Attack, -10% Max HP',
                icon: '⚔️',
                percentageEffects: {
                    attack: 1.15,
                    maxHp: 0.9
                }
            },
            {
                id: 'critical_mass',
                name: 'Critical Mass',
                description: 'Crits deal 2.5x damage instead of 2x',
                icon: '💥',
                critMultiplier: 2.5
            },
            {
                id: 'first_blood',
                name: 'First Blood',
                description: 'First hit always crits',
                icon: '🎯',
                firstHitCrit: true
            },
            {
                id: 'armor_piercing',
                name: 'Armor Piercing',
                description: 'Ignore 30% of enemy defense',
                icon: '🔪',
                armorPierce: 0.3
            },
            {
                id: 'double_strike',
                name: 'Double Strike',
                description: '15% chance to attack twice',
                icon: '⚡',
                doubleStrikeChance: 0.15
            },
            {
                id: 'execute',
                name: 'Execute',
                description: 'Deal 3x damage to enemies below 20% HP',
                icon: '☠️',
                executeDamage: 3.0,
                executeThreshold: 0.2
            },
            {
                id: 'bleed',
                name: 'Bleed',
                description: 'Attacks apply 5% max HP bleed over 3s',
                icon: '🩸',
                bleedPercent: 0.05,
                bleedDuration: 3
            },
            
            // DEFENSIVE (7)
            {
                id: 'second_wind',
                name: 'Second Wind',
                description: 'Heal 25% HP when dropping below 30% (once per battle)',
                icon: '🌬️',
                healPercent: 0.25,
                triggerThreshold: 0.3,
                used: false
            },
            {
                id: 'thorns',
                name: 'Thorns',
                description: 'Reflect 20% of damage taken',
                icon: '🌵',
                reflectPercent: 0.2
            },
            {
                id: 'fortify',
                name: 'Fortify',
                description: '+50 flat HP',
                icon: '🛡️',
                flatEffects: {
                    maxHp: 50
                }
            },
            {
                id: 'shield_wall',
                name: 'Shield Wall',
                description: '+15 Defense, -15% Attack Speed',
                icon: '🏰',
                flatEffects: {
                    defense: 15
                },
                percentageEffects: {
                    attackSpeed: 0.85
                }
            },
            {
                id: 'regeneration',
                name: 'Regeneration',
                description: 'Heal 2% max HP per second',
                icon: '💚',
                regenPercent: 0.02
            },
            {
                id: 'last_stand',
                name: 'Last Stand',
                description: 'Survive lethal damage once at 1 HP, gain +50% damage for 5s',
                icon: '⚔️',
                survived: false,
                buffDuration: 5,
                buffDamage: 0.5
            },
            {
                id: 'thick_skin',
                name: 'Thick Skin',
                description: 'Take 15% less damage from all sources',
                icon: '🐘',
                damageReduction: 0.15
            },
            
            // UTILITY/HYBRID (6)
            {
                id: 'vampire',
                name: 'Vampire',
                description: '+15% Lifesteal (flat)',
                icon: '🧛',
                flatEffects: {
                    lifesteal: 0.15
                }
            },
            {
                id: 'haste',
                name: 'Haste',
                description: '+0.5 Attack Speed',
                icon: '💨',
                flatEffects: {
                    attackSpeed: 0.5
                }
            },
            {
                id: 'momentum',
                name: 'Momentum',
                description: 'Deal 1% more damage per second of combat (max 30%)',
                icon: '📈',
                maxStacks: 30,
                damagePerSecond: 0.01
            },
            {
                id: 'blood_pact',
                name: 'Blood Pact',
                description: 'Lose 10% max HP, gain +20% damage and +10% lifesteal',
                icon: '🩸',
                percentageEffects: {
                    maxHp: 0.9,
                    attack: 1.2
                },
                flatEffects: {
                    lifesteal: 0.10
                }
            },
            {
                id: 'adrenaline',
                name: 'Adrenaline',
                description: 'Below 50% HP, gain +25% attack speed',
                icon: '💪',
                speedBoost: 0.25,
                threshold: 0.5
            },
            {
                id: 'balanced_stance',
                name: 'Balanced Stance',
                description: '+5% to all stats',
                icon: '⚖️',
                percentageEffects: {
                    attack: 1.05,
                    attackSpeed: 1.05,
                    critChance: 1.05,
                    lifesteal: 1.05,
                    defense: 1.05,
                    maxHp: 1.05
                }
            },
            
            // NEW RELICS (15)
            // SHIELD SYSTEM (2)
            {
                id: 'diamond_shield',
                name: 'Diamond Shield',
                description: 'Gain a shield equal to 25% max HP at battle start. Shield prevents critical hits and absorbs damage first',
                icon: '💎',
                shieldPercent: 0.25
            },
            {
                id: 'shield_battery',
                name: 'Shield Battery',
                description: 'Shield regenerates 10% of max HP every 5 seconds (if shield is broken)',
                icon: '🔄',
                shieldRegenPercent: 0.10,
                shieldRegenInterval: 5.0
            },
            
            // OFFENSIVE (5)
            {
                id: 'rage_combo',
                name: 'Rage Combo',
                description: 'Each consecutive hit increases damage by 5% (max 50%, resets on miss)',
                icon: '⚔️',
                comboDamagePerHit: 0.05,
                comboMaxDamage: 0.50
            },
            {
                id: 'weak_point',
                name: 'Weak Point',
                description: 'Each attack ignores 2% more of enemy defense (max 60%)',
                icon: '🎯',
                defenseIgnorePerHit: 0.02,
                defenseIgnoreMax: 0.60
            },
            {
                id: 'spite',
                name: 'Spite',
                description: 'Below 30% HP, deal +60% damage',
                icon: '🔥',
                lowHpDamageBoost: 0.60,
                lowHpThreshold: 0.30
            },
            {
                id: 'executioner',
                name: 'Executioner',
                description: 'Deal +50% damage to enemies below 40% HP',
                icon: '⚔️',
                executeDamage: 1.50,
                executeThreshold: 0.40
            },
            {
                id: 'precision_strike',
                name: 'Precision Strike',
                description: 'Attacks cannot miss, but deal -10% damage',
                icon: '🎯',
                cannotMiss: true,
                damageReduction: 0.10
            },
            
            // DEFENSIVE (4)
            {
                id: 'battle_hardened',
                name: 'Battle Hardened',
                description: 'Each hit taken increases defense by 1 (max +20, resets on heal above 80% HP)',
                icon: '🛡️',
                defensePerHit: 1,
                defenseMax: 20,
                resetThreshold: 0.80
            },
            {
                id: 'blink',
                name: 'Blink',
                description: '20% chance to dodge any attack completely',
                icon: '💫',
                dodgeChance: 0.20
            },
            {
                id: 'iron_will',
                name: 'Iron Will',
                description: 'Take 10% less damage from critical hits, +20 Defense',
                icon: '🛡️',
                critDamageReduction: 0.10,
                flatEffects: {
                    defense: 20
                }
            },
            {
                id: 'retaliate',
                name: 'Retaliate',
                description: 'First 5 hits received, counter-attack immediately for 40% of normal damage',
                icon: '⚔️',
                counterDamage: 0.40,
                maxCounters: 5
            },
            
            // UTILITY/HYBRID (4)
            {
                id: 'power_spike',
                name: 'Power Spike',
                description: 'Every 5 floors, gain +10% to all stats (permanent)',
                icon: '⚡',
                floorInterval: 5,
                statBoost: 0.10
            },
            {
                id: 'potion_master',
                name: 'Potion Master',
                description: 'Heal 3% max HP every 3 seconds, but lose 1% max HP permanently each floor',
                icon: '⚗️',
                healPercent: 0.03,
                healInterval: 3.0,
                hpLossPerFloor: 0.01
            },
            {
                id: 'recycle',
                name: 'Recycle',
                description: 'When you dodge or miss, gain +15% attack speed for 3 seconds',
                icon: '🔄',
                speedBoost: 0.15,
                boostDuration: 3.0
            },
            {
                id: 'soul_collector',
                name: 'Soul Collector',
                description: 'Each floor completed, gain +1 Attack and +5 Max HP permanently',
                icon: '👻',
                attackPerFloor: 1,
                hpPerFloor: 5
            },
            {
                id: 'frenzy',
                name: 'Frenzy',
                description: 'Each successful hit increases attack speed by 5% (max +50%, resets on taking damage)',
                icon: '⚡',
                speedPerHit: 0.05,
                maxSpeedBoost: 0.50
            }
        ];
        
        this.activeRelics = []; // Max 3
    }

    /**
     * Get 3 random relics (excluding already owned)
     */
    getRandomRelics(count = 3) {
        const ownedIds = this.activeRelics.map(r => r.id);
        const available = this.relicPool.filter(r => !ownedIds.includes(r.id));
        
        // Shuffle and take count
        const shuffled = available.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    /**
     * Add relic to active relics
     */
    addRelic(relic) {
        if (this.activeRelics.length >= 3) {
            return false; // Full, need to replace
        }
        
        // Clone relic to avoid shared state
        this.activeRelics.push({ ...relic });
        return true;
    }

    /**
     * Replace relic at index
     */
    replaceRelic(index, newRelic) {
        if (index < 0 || index >= this.activeRelics.length) return false;
        
        this.activeRelics[index] = { ...newRelic };
        return true;
    }

    /**
     * Apply FLAT effects only (applied once, additive)
     */
    applyFlatEffects(player) {
        this.activeRelics.forEach(relic => {
            if (relic.flatEffects) {
                if (relic.flatEffects.attack) player.attack += relic.flatEffects.attack;
                if (relic.flatEffects.defense) player.defense += relic.flatEffects.defense;
                if (relic.flatEffects.maxHp) {
                    player.maxHp += relic.flatEffects.maxHp;
                    player.currentHp += relic.flatEffects.maxHp;
                }
                if (relic.flatEffects.attackSpeed) {
                    player.attackSpeed = Math.min(6.0, player.attackSpeed + relic.flatEffects.attackSpeed);
                }
                if (relic.flatEffects.lifesteal) {
                    player.lifesteal = Math.max(0, Math.min(0.40, (player.lifesteal || 0) + relic.flatEffects.lifesteal));
                }
            }
        });
    }

    /**
     * Apply PERCENTAGE effects (recalculated each time based on current value)
     */
    applyPercentageEffects(player) {
        // Calculate multipliers from all percentage effects
        let attackMult = 1.0;
        let defenseMult = 1.0;
        let maxHpMult = 1.0;
        let attackSpeedMult = 1.0;
        let critChanceMult = 1.0;
        let lifestealMult = 1.0;

        this.activeRelics.forEach(relic => {
            if (relic.percentageEffects) {
                if (relic.percentageEffects.attack) attackMult *= relic.percentageEffects.attack;
                if (relic.percentageEffects.defense) defenseMult *= relic.percentageEffects.defense;
                if (relic.percentageEffects.maxHp) maxHpMult *= relic.percentageEffects.maxHp;
                if (relic.percentageEffects.attackSpeed) attackSpeedMult *= relic.percentageEffects.attackSpeed;
                if (relic.percentageEffects.critChance) critChanceMult *= relic.percentageEffects.critChance;
                if (relic.percentageEffects.lifesteal) lifestealMult *= relic.percentageEffects.lifesteal;
            }
        });

        // Apply multipliers
        player.attack = Math.round(player.attack * attackMult);
        player.defense = Math.round(player.defense * defenseMult);
        player.maxHp = Math.round(player.maxHp * maxHpMult);
        player.currentHp = Math.min(player.currentHp, player.maxHp); // Ensure HP doesn't exceed max
        
        player.attackSpeed = Math.min(6.0, player.attackSpeed * attackSpeedMult);
        player.critChance = Math.min(0.75, player.critChance * critChanceMult);
        player.lifesteal = Math.min(0.40, player.lifesteal * lifestealMult);
    }

    /**
     * Apply all relic stat effects to player
     * First applies flat effects, then percentage effects
     */
    applyStatEffects(player) {
        // Apply flat effects first (additive)
        this.applyFlatEffects(player);
        // Then apply percentage effects (multiplicative on updated values)
        this.applyPercentageEffects(player);
    }

    /**
     * Get relic by ID
     */
    getRelicById(id) {
        return this.relicPool.find(r => r.id === id);
    }

    /**
     * Reset relics for new run
     */
    reset() {
        this.activeRelics = [];
        // Reset any relic states
        this.relicPool.forEach(relic => {
            if (relic.used !== undefined) relic.used = false;
            if (relic.survived !== undefined) relic.survived = false;
        });
    }
}

