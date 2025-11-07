class AbilityManager {
    constructor() {
        this.abilityPool = [
            {
                id: 'arcane_surge',
                name: 'Arcane Surge',
                icon: '🪄',
                cooldown: 12,
                duration: 4,
                description: '+50% attack speed and +30% damage for 4s.',
                type: 'buff',
                data: {
                    attackSpeedMult: 1.5,
                    damageMult: 1.3
                }
            },
            {
                id: 'fortress_wall',
                name: 'Fortress Wall',
                icon: '🛡️',
                cooldown: 16,
                duration: 6,
                description: 'Gain a shield equal to 40% max HP for 6s.',
                type: 'shield',
                data: {
                    shieldPercent: 0.4
                }
            },
            {
                id: 'blood_transfusion',
                name: 'Blood Transfusion',
                icon: '🩸',
                cooldown: 18,
                duration: 5,
                description: 'Lose 15% current HP to heal 45% missing HP over 5s.',
                type: 'heal_over_time',
                data: {
                    costPercentCurrent: 0.15,
                    healPercentMissing: 0.45,
                    duration: 5
                }
            },
            {
                id: 'time_dilation',
                name: 'Time Dilation',
                icon: '⏳',
                cooldown: 20,
                duration: 6,
                description: 'Enemy attack speed -40% and damage -25% for 6s.',
                type: 'enemy_debuff',
                data: {
                    enemyAttackSpeedMult: 0.6,
                    enemyDamageMult: 0.75
                }
            },
            {
                id: 'execution_protocol',
                name: 'Execution Protocol',
                icon: '⚔️',
                cooldown: 22,
                duration: 8,
                description: 'Deal +200% damage to low HP enemies for 8s.',
                type: 'execute_buff',
                data: {
                    threshold: 0.35,
                    damageMult: 3.0
                }
            },
            {
                id: 'blade_storm',
                name: 'Blade Storm',
                icon: '🌀',
                cooldown: 15,
                duration: 0,
                description: 'Perform a flurry of strikes for heavy damage ignoring 50% defense.',
                type: 'burst_damage',
                data: {
                    hits: 5,
                    damagePercent: 0.65,
                    defenseIgnore: 0.5
                }
            },
            {
                id: 'adrenal_boost',
                name: 'Adrenal Boost',
                icon: '💥',
                cooldown: 14,
                duration: 4,
                description: 'Refills Energy Surge and grants +20% dodge for 4s.',
                type: 'buff',
                data: {
                    dodgeBonus: 0.20,
                    refreshEnergySurge: true
                }
            },
            {
                id: 'bulwark_chant',
                name: 'Bulwark Chant',
                icon: '🛡️',
                cooldown: 18,
                duration: 6,
                description: '+40 defense and 20% reflect for 6s.',
                type: 'buff',
                data: {
                    defenseFlat: 40,
                    reflectPercent: 0.20
                }
            },
            {
                id: 'critical_focus',
                name: 'Critical Focus',
                icon: '🎯',
                cooldown: 12,
                duration: 6,
                description: 'Guaranteed crits for 5 hits (crit damage -15%).',
                type: 'crit_buff',
                data: {
                    critHits: 5,
                    critDamageMult: 0.85
                }
            },
            {
                id: 'tactical_retreat',
                name: 'Tactical Retreat',
                icon: '🏃',
                cooldown: 20,
                duration: 1,
                description: 'Avoid damage for 1s and heal 20% max HP.',
                type: 'invulnerability',
                data: {
                    duration: 1,
                    healPercentMax: 0.2
                }
            },
            {
                id: 'overcharge_beam',
                name: 'Overcharge Beam',
                icon: '🔆',
                cooldown: 16,
                duration: 0,
                description: 'Deal massive shield-piercing damage and apply bleed.',
                type: 'burst_damage',
                data: {
                    hits: 1,
                    damagePercent: 2.5,
                    ignoreShield: true,
                    applyBleed: true,
                    bleedPercent: 0.08
                }
            },
            {
                id: 'momentum_breaker',
                name: 'Momentum Breaker',
                icon: '💣',
                cooldown: 14,
                duration: 5,
                description: 'Reset enemy buffs and gain +15% damage for 5s.',
                type: 'buff',
                data: {
                    damageMult: 1.15,
                    resetEnemyCombos: true
                }
            }
        ];
    }

    getRandomAbilities(count = 3, excludeIds = []) {
        const available = this.abilityPool.filter(ability => !excludeIds.includes(ability.id));
        if (available.length <= count) {
            return [...available];
        }
        const options = [];
        const poolCopy = [...available];
        for (let i = 0; i < count && poolCopy.length > 0; i++) {
            const idx = Math.floor(Math.random() * poolCopy.length);
            options.push(poolCopy.splice(idx, 1)[0]);
        }
        return options;
    }

    getAbilityById(id) {
        return this.abilityPool.find(ability => ability.id === id) || null;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { AbilityManager };
}
