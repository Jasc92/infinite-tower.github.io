// ========================================
// APP INITIALIZATION & UI CONTROLLER
// ========================================

let game = null;
let topRuns = null;
let currentScreen = 'menu';
let animationFrame = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
    setupPWA();
});

function initializeGame() {
    game = new GameManager();
    topRuns = new TopRunsManager();
    
    // Setup battle canvas (combat rendering)
    game.canvas = document.getElementById('battle-canvas');
    game.ctx = game.canvas.getContext('2d');
    
    // Setup UI canvas (HP bars and stats)
    game.uiCanvas = document.getElementById('battle-ui-canvas');
    game.uiCtx = game.uiCanvas.getContext('2d');
    
    // Load sprites
    loadSprites();
    
    // Show menu screen
    showScreen('menu');
}

function loadSprites() {
    // Hero sprites
    game.sprites.hero = new Image();
    game.sprites.hero.src = 'assets/hero.png';
    game.sprites.heroDead = new Image();
    game.sprites.heroDead.src = 'assets/hero-dead.png';
    
    // Enemy sprites (all variations)
    game.sprites.enemy = new Image();
    game.sprites.enemy.src = 'assets/enemy.png';
    game.sprites.enemyDead = new Image();
    game.sprites.enemyDead.src = 'assets/enemy-dead.png';
    
    game.sprites.tankEnemy = new Image();
    game.sprites.tankEnemy.src = 'assets/tank-enemy.png';
    game.sprites.tankEnemyDead = new Image();
    game.sprites.tankEnemyDead.src = 'assets/tank-enemy-dead.png';
    
    game.sprites.atackEnemy = new Image();
    game.sprites.atackEnemy.src = 'assets/atack-enemy.png';
    game.sprites.atackEnemyDead = new Image();
    game.sprites.atackEnemyDead.src = 'assets/atack-enemy-dead.png';
    
    game.sprites.criticalEnemy = new Image();
    game.sprites.criticalEnemy.src = 'assets/critical-enemy.png';
    game.sprites.criticalEnemyDead = new Image();
    game.sprites.criticalEnemyDead.src = 'assets/critical-enemy-dead.png';
    
    game.sprites.fastEnemy = new Image();
    game.sprites.fastEnemy.src = 'assets/fast-enemy.png';
    game.sprites.fastEnemyDead = new Image();
    game.sprites.fastEnemyDead.src = 'assets/fast-enemy-dead.png';
    
    game.sprites.boss = new Image();
    game.sprites.boss.src = 'assets/boss.png';
    game.sprites.bossDead = new Image();
    game.sprites.bossDead.src = 'assets/boss-dead.png';
    
    // Background
    game.sprites.background = new Image();
    game.sprites.background.src = 'assets/background.png';
}

// Helper to get correct enemy sprite
function getEnemySprite(isDead = false) {
    if (!game.enemy || !game.enemy.archetype) {
        return isDead ? game.sprites.enemyDead : game.sprites.enemy;
    }
    
    // Boss takes priority over archetype
    if (game.enemy.isBoss) {
        return isDead ? game.sprites.bossDead : game.sprites.boss;
    }
    
    const archetype = game.enemy.archetype;
    if (archetype === 'TANK') {
        return isDead ? game.sprites.tankEnemyDead : game.sprites.tankEnemy;
    } else if (archetype === 'GLASS') {
        return isDead ? game.sprites.atackEnemyDead : game.sprites.atackEnemy;
    } else {
        return isDead ? game.sprites.enemyDead : game.sprites.enemy;
    }
}

// ========================================
// SCREEN MANAGEMENT
// ========================================

function showScreen(screenName) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Show requested screen
    const screen = document.getElementById(`screen-${screenName}`);
    if (screen) {
        screen.classList.add('active');
        currentScreen = screenName;
        
        // Initialize screen content
        switch (screenName) {
            case 'menu':
                updateTopRunsDisplay();
                break;
            case 'stats':
                updateStatsScreen();
                break;
            case 'relic':
                updateRelicScreen();
                break;
            case 'battle':
                startBattleScreen();
                break;
            case 'result':
                updateResultScreen();
                break;
        }
    }
}

// ========================================
// MENU SCREEN
// ========================================

function updateTopRunsDisplay() {
    const runs = topRuns.loadTopRuns();
    const listEl = document.getElementById('top-runs-list');
    
    if (runs.length === 0) {
        listEl.innerHTML = '<p style="text-align:center;color:var(--text-dim);">No runs yet!</p>';
    } else {
        listEl.innerHTML = runs.map((run, index) => `
            <div class="top-run-item">
                <h4>#${index + 1} - Floor ${run.floor}</h4>
                <p>Difficulty: ${capitalize(run.difficulty)}</p>
                <p>Duration: ${run.durationSec}s</p>
                <p>ATK: ${run.build.atk} | SPD: ${run.build.atkSpd} | CRT: ${Math.round(run.build.crit * 100)}% | LS: ${Math.round((run.build.lifesteal || 0) * 100)}%</p>
            </div>
        `).join('');
    }
}

// ========================================
// STAT ALLOCATION SCREEN
// ========================================

function updateStatsScreen() {
    const title = document.getElementById('stats-title');
    title.textContent = game.currentFloor === 1 ? 'Initial Build' : `Floor ${game.currentFloor} - Level Up!`;
    
    // Update active relics display
    updateStatsRelicsDisplay();
    
    // Ensure baseStatsWithoutRelics exists before taking snapshot
    // CRITICAL: When entering stats screen, player stats may have relics applied
    // We need to ensure baseStatsWithoutRelics reflects stats WITHOUT relic effects
    if (!game.baseStatsWithoutRelics) {
        // If basePlayerStats exists, it has relics applied, so we need to reverse-calculate
        // Otherwise, if no relics, current stats are base
        if (game.relicManager.activeRelics.length === 0) {
            // No relics, current stats are base
            game.baseStatsWithoutRelics = {
                attack: game.player.attack,
                attackSpeed: game.player.attackSpeed,
                critChance: game.player.critChance,
                lifesteal: game.player.lifesteal,
                defense: game.player.defense,
                maxHp: game.player.maxHp
            };
        } else {
            // Has relics - need to restore player to basePlayerStats first, then remove relics
            // Restore player to basePlayerStats (which includes relic effects)
            if (game.basePlayerStats) {
                game.player.attack = game.basePlayerStats.attack;
                game.player.attackSpeed = game.basePlayerStats.attackSpeed;
                game.player.critChance = game.basePlayerStats.critChance;
                game.player.lifesteal = game.basePlayerStats.lifesteal;
                game.player.defense = game.basePlayerStats.defense;
                game.player.maxHp = game.basePlayerStats.maxHp;
            }
            
            // Now calculate base by removing relic effects
            // We'll use applyRelicEffectsToBaseStats logic in reverse
            // Save current player stats (with relics)
            const statsWithRelics = {
                attack: game.player.attack,
                attackSpeed: game.player.attackSpeed,
                critChance: game.player.critChance,
                lifesteal: game.player.lifesteal,
                defense: game.player.defense,
                maxHp: game.player.maxHp
            };
            
            // Calculate multipliers from relics
            let attackMult = 1.0;
            let defenseMult = 1.0;
            let maxHpMult = 1.0;
            let attackSpeedMult = 1.0;
            let critChanceMult = 1.0;
            let lifestealMult = 1.0;
            
            game.relicManager.activeRelics.forEach(relic => {
                if (relic.percentageEffects) {
                    if (relic.percentageEffects.attack) attackMult *= relic.percentageEffects.attack;
                    if (relic.percentageEffects.defense) defenseMult *= relic.percentageEffects.defense;
                    if (relic.percentageEffects.maxHp) maxHpMult *= relic.percentageEffects.maxHp;
                    if (relic.percentageEffects.attackSpeed) attackSpeedMult *= relic.percentageEffects.attackSpeed;
                    if (relic.percentageEffects.critChance) critChanceMult *= relic.percentageEffects.critChance;
                    if (relic.percentageEffects.lifesteal) lifestealMult *= relic.percentageEffects.lifesteal;
                }
            });
            
            // Reverse percentage effects first (divide)
            let baseAfterPercent = {
                attack: Math.round(statsWithRelics.attack / attackMult),
                defense: Math.round(statsWithRelics.defense / defenseMult),
                maxHp: Math.round(statsWithRelics.maxHp / maxHpMult),
                attackSpeed: statsWithRelics.attackSpeed / attackSpeedMult,
                critChance: statsWithRelics.critChance / critChanceMult,
                lifesteal: statsWithRelics.lifesteal / lifestealMult
            };
            
            // Then reverse flat effects (subtract)
            game.relicManager.activeRelics.forEach(relic => {
                if (relic.flatEffects) {
                    if (relic.flatEffects.attack) baseAfterPercent.attack -= relic.flatEffects.attack;
                    if (relic.flatEffects.defense) baseAfterPercent.defense -= relic.flatEffects.defense;
                    if (relic.flatEffects.maxHp) baseAfterPercent.maxHp -= relic.flatEffects.maxHp;
                    if (relic.flatEffects.attackSpeed) baseAfterPercent.attackSpeed = Math.max(0.1, baseAfterPercent.attackSpeed - relic.flatEffects.attackSpeed);
                    if (relic.flatEffects.lifesteal) baseAfterPercent.lifesteal = Math.max(0, baseAfterPercent.lifesteal - relic.flatEffects.lifesteal);
                }
            });
            
            // Save base stats without relics
            game.baseStatsWithoutRelics = {
                attack: baseAfterPercent.attack,
                attackSpeed: baseAfterPercent.attackSpeed,
                critChance: baseAfterPercent.critChance,
                lifesteal: baseAfterPercent.lifesteal,
                defense: baseAfterPercent.defense,
                maxHp: baseAfterPercent.maxHp
            };
            
            // Restore player stats with relics applied
            game.applyRelicEffectsToBaseStats();
        }
    }
    
    // Take snapshot if we haven't yet (for comparison when removing points)
    // CRITICAL: Snapshot should capture base stats WITHOUT relics, not stats with relics
    if (!game.baseStatsSnapshot) {
        // Save base stats WITHOUT relics to snapshot
        game.baseStatsSnapshot = {
            attackSpeed: game.baseStatsWithoutRelics.attackSpeed,
            attack: game.baseStatsWithoutRelics.attack,
            critChance: game.baseStatsWithoutRelics.critChance,
            lifesteal: game.baseStatsWithoutRelics.lifesteal,
            defense: game.baseStatsWithoutRelics.defense,
            maxHp: game.baseStatsWithoutRelics.maxHp,
            currentHp: game.player.currentHp
        };
        console.log('=== SNAPSHOT BASE STATS (without relics) ===', game.baseStatsSnapshot);
    }
    
    // Update stat displays (show BASE and TOTAL)
    updateStatDisplay('attackSpeed', 
        game.baseStatsWithoutRelics ? game.baseStatsWithoutRelics.attackSpeed.toFixed(1) : game.player.attackSpeed.toFixed(1),
        game.player.attackSpeed.toFixed(1),
        game.player.attackSpeed >= 6.0);
    updateStatDisplay('attack',
        game.baseStatsWithoutRelics ? game.baseStatsWithoutRelics.attack : game.player.attack,
        game.player.attack,
        false);
    updateStatDisplay('crit',
        game.baseStatsWithoutRelics ? Math.round(game.baseStatsWithoutRelics.critChance * 100) : Math.round(game.player.critChance * 100),
        Math.round(game.player.critChance * 100),
        game.player.critChance >= 0.75);
    updateStatDisplay('lifesteal',
        game.baseStatsWithoutRelics ? Math.round(game.baseStatsWithoutRelics.lifesteal * 100) : Math.round(game.player.lifesteal * 100),
        Math.round(game.player.lifesteal * 100),
        game.player.lifesteal >= 0.40);
    updateStatDisplay('defense',
        game.baseStatsWithoutRelics ? game.baseStatsWithoutRelics.defense : game.player.defense,
        game.player.defense,
        false);
    updateStatDisplay('hp',
        game.baseStatsWithoutRelics ? game.baseStatsWithoutRelics.maxHp : game.player.maxHp,
        game.player.maxHp,
        false);
    
    // Update start button
    const btn = document.getElementById('btn-start-battle');
    if (game.availablePoints === 0) {
        btn.disabled = false;
        btn.textContent = '⚔️ START BATTLE';
    } else {
        btn.disabled = true;
        btn.textContent = `Allocate ${game.availablePoints} points first`;
    }
}

function updateStatDisplay(stat, baseValue, totalValue, isMax) {
    // Update base value display
    const baseEl = document.getElementById(`stat-${stat}-base`);
    if (baseEl) {
        if (stat === 'attackSpeed') {
            baseEl.textContent = typeof baseValue === 'string' ? baseValue : baseValue.toFixed(1);
        } else if (stat === 'crit' || stat === 'lifesteal') {
            baseEl.textContent = baseValue;
        } else {
            baseEl.textContent = baseValue;
        }
    }
    
    // Update total value display
    const totalEl = document.getElementById(`stat-${stat}-total`);
    if (totalEl) {
        if (stat === 'attackSpeed') {
            totalEl.textContent = typeof totalValue === 'string' ? totalValue : totalValue.toFixed(1);
        } else if (stat === 'crit' || stat === 'lifesteal') {
            totalEl.textContent = totalValue;
        } else {
            totalEl.textContent = totalValue;
        }
    }
    
    // Update max indicator
    const maxEl = document.querySelector(`[data-stat="${stat}"] .stat-max`);
    if (maxEl) {
        maxEl.textContent = isMax ? '(MAX)' : '';
    }
    
    // Update plus button state
    const plusBtn = document.querySelector(`.btn-stat-plus[data-stat="${stat}"]`);
    if (plusBtn) {
        plusBtn.disabled = isMax || game.availablePoints === 0;
    }
    
    // Update minus button state - only enable if we have points to remove
    // CRITICAL: Compare base stats (without relics) to snapshot base stats
    const minusBtn = document.querySelector(`.btn-stat-minus[data-stat="${stat}"]`);
    if (minusBtn && game.baseStatsSnapshot && game.baseStatsWithoutRelics) {
        let canRemove = false;
        let currentBaseValue;
        let snapshotValue;
        
        switch (stat) {
            case 'attackSpeed':
                currentBaseValue = game.baseStatsWithoutRelics.attackSpeed;
                snapshotValue = game.baseStatsSnapshot.attackSpeed;
                break;
            case 'attack':
                currentBaseValue = game.baseStatsWithoutRelics.attack;
                snapshotValue = game.baseStatsSnapshot.attack;
                break;
            case 'crit':
                currentBaseValue = game.baseStatsWithoutRelics.critChance;
                snapshotValue = game.baseStatsSnapshot.critChance;
                break;
            case 'lifesteal':
                currentBaseValue = game.baseStatsWithoutRelics.lifesteal;
                snapshotValue = game.baseStatsSnapshot.lifesteal;
                break;
            case 'defense':
                currentBaseValue = game.baseStatsWithoutRelics.defense;
                snapshotValue = game.baseStatsSnapshot.defense;
                break;
            case 'hp':
                currentBaseValue = game.baseStatsWithoutRelics.maxHp;
                snapshotValue = game.baseStatsSnapshot.maxHp;
                break;
        }
        
        // Compare base stats (without relics) to snapshot
        canRemove = currentBaseValue > snapshotValue;
        minusBtn.disabled = !canRemove;
    }
}

function updateStatsRelicsDisplay() {
    const relicsContainer = document.getElementById('stats-relics');
    if (!relicsContainer) return;
    
    relicsContainer.innerHTML = '';
    
    const relics = game.relicManager.activeRelics;
    
    if (relics.length === 0) {
        // Show empty state
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'font-size: clamp(9px, 2.2vw, 11px); color: var(--text-dim); text-align: center; padding: 8px;';
        emptyMsg.textContent = 'No relics equipped';
        relicsContainer.appendChild(emptyMsg);
        return;
    }
    
    // Create title
    const title = document.createElement('h4');
    title.textContent = '⚡ Active Relics';
    relicsContainer.appendChild(title);
    
    // Create slots container
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'stats-relics-slots';
    
    // Create 3 slots
    for (let i = 0; i < 3; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'stats-relic-slot';
        
        if (i < relics.length) {
            const relic = relics[i];
            slotDiv.textContent = relic.icon;
            slotDiv.classList.add('active');
            slotDiv.title = `${relic.name}: ${relic.description}`;
            
            // Show tooltip on tap/click
            slotDiv.onclick = (e) => {
                e.stopPropagation();
                showRelicTooltip(relic);
            };
            
            // Touch support
            slotDiv.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                slotDiv.classList.add('touching');
            });
            
            slotDiv.addEventListener('touchend', (e) => {
                e.stopPropagation();
                slotDiv.classList.remove('touching');
                showRelicTooltip(relic);
            });
        } else {
            slotDiv.classList.add('empty');
        }
        
        slotsContainer.appendChild(slotDiv);
    }
    
    relicsContainer.appendChild(slotsContainer);
}

function allocateStatPoint(statType) {
    console.log(`=== ALLOCATE STAT POINT: ${statType} ===`);
    console.log('Available points:', game.availablePoints);
    
    // CRITICAL: Must work on base stats without relics
    // First, restore player to base stats (without relic effects)
    if (!game.baseStatsWithoutRelics) {
        // Initialize base stats from current player stats
        // But we need to remove relic effects first
        if (game.relicManager.activeRelics.length > 0) {
            // Temporarily remove all relics, get base stats, then reapply
            const tempRelics = [...game.relicManager.activeRelics];
            game.relicManager.activeRelics = [];
            
            // Save current stats (now without relic effects)
            game.baseStatsWithoutRelics = {
                attack: game.player.attack,
                attackSpeed: game.player.attackSpeed,
                critChance: game.player.critChance,
                lifesteal: game.player.lifesteal,
                defense: game.player.defense,
                maxHp: game.player.maxHp
            };
            
            // Restore relics
            game.relicManager.activeRelics = tempRelics;
        } else {
            // No relics, current stats are base stats
            game.baseStatsWithoutRelics = {
                attack: game.player.attack,
                attackSpeed: game.player.attackSpeed,
                critChance: game.player.critChance,
                lifesteal: game.player.lifesteal,
                defense: game.player.defense,
                maxHp: game.player.maxHp
            };
        }
    }
    
    // Restore player to base stats (without relics) before applying point
    game.player.attack = game.baseStatsWithoutRelics.attack;
    game.player.attackSpeed = game.baseStatsWithoutRelics.attackSpeed;
    game.player.critChance = game.baseStatsWithoutRelics.critChance;
    game.player.lifesteal = game.baseStatsWithoutRelics.lifesteal;
    game.player.defense = game.baseStatsWithoutRelics.defense;
    game.player.maxHp = game.baseStatsWithoutRelics.maxHp;
    
    // Get current base value (without relics)
    let currentBaseValue;
    if (statType === 'attackSpeed') {
        currentBaseValue = game.baseStatsWithoutRelics.attackSpeed;
    } else if (statType === 'attack') {
        currentBaseValue = game.baseStatsWithoutRelics.attack;
    } else if (statType === 'crit') {
        currentBaseValue = game.baseStatsWithoutRelics.critChance;
    } else if (statType === 'lifesteal') {
        currentBaseValue = game.baseStatsWithoutRelics.lifesteal;
    } else if (statType === 'defense') {
        currentBaseValue = game.baseStatsWithoutRelics.defense;
    } else if (statType === 'hp') {
        currentBaseValue = game.baseStatsWithoutRelics.maxHp;
    } else {
        currentBaseValue = game.baseStatsWithoutRelics.attackSpeed;
    }
    console.log('Current base value (without relics):', currentBaseValue);
    
    if (game.availablePoints > 0) {
        const canAllocate = checkStatCap(statType);
        if (canAllocate) {
            // Apply to player stats (which are now base stats without relics)
            game.applyStatPoint(statType);
            game.availablePoints--;
            
            // Update baseStatsWithoutRelics with new value
            // Handle special cases for stat types
            if (statType === 'attackSpeed') {
                game.baseStatsWithoutRelics.attackSpeed = game.player.attackSpeed;
            } else if (statType === 'attack') {
                game.baseStatsWithoutRelics.attack = game.player.attack;
            } else if (statType === 'crit') {
                game.baseStatsWithoutRelics.critChance = game.player.critChance;
            } else if (statType === 'lifesteal') {
                game.baseStatsWithoutRelics.lifesteal = game.player.lifesteal;
            } else if (statType === 'defense') {
                game.baseStatsWithoutRelics.defense = game.player.defense;
            } else if (statType === 'hp') {
                game.baseStatsWithoutRelics.maxHp = game.player.maxHp;
            }
            
            // Reapply relic effects to get final stats
            game.applyRelicEffectsToBaseStats();
            
            // Get the actual value for logging
            let actualValue;
            if (statType === 'attackSpeed') {
                actualValue = game.player.attackSpeed;
            } else if (statType === 'attack') {
                actualValue = game.player.attack;
            } else if (statType === 'crit') {
                actualValue = game.player.critChance;
            } else if (statType === 'lifesteal') {
                actualValue = game.player.lifesteal;
            } else if (statType === 'defense') {
                actualValue = game.player.defense;
            } else if (statType === 'hp') {
                actualValue = game.player.maxHp;
            } else {
                actualValue = game.player.attackSpeed;
            }
            console.log('After allocation:', actualValue);
            console.log('Remaining points:', game.availablePoints);
            updateStatsScreen();
        } else {
            // Still reapply relics even if can't allocate
            game.applyRelicEffectsToBaseStats();
            console.log('Cannot allocate: stat at cap');
        }
    } else {
        // Still reapply relics even if no points
        game.applyRelicEffectsToBaseStats();
        console.log('Cannot allocate: no points available');
    }
}

function removeStatPoint(statType) {
    console.log(`=== REMOVE STAT POINT: ${statType} ===`);
    console.log('Available points:', game.availablePoints);
    
    // Work on base stats without relics
    if (!game.baseStatsWithoutRelics) {
        // If no base stats yet, can't remove
        console.log('Cannot remove: no base stats');
        return;
    }
    
    // Get current base value (without relics)
    let currentBaseValue;
    let snapshotValue = null;
    if (statType === 'attackSpeed') {
        currentBaseValue = game.baseStatsWithoutRelics.attackSpeed;
        snapshotValue = game.baseStatsSnapshot ? game.baseStatsSnapshot.attackSpeed : null;
    } else if (statType === 'attack') {
        currentBaseValue = game.baseStatsWithoutRelics.attack;
        snapshotValue = game.baseStatsSnapshot ? game.baseStatsSnapshot.attack : null;
    } else if (statType === 'crit') {
        currentBaseValue = game.baseStatsWithoutRelics.critChance;
        snapshotValue = game.baseStatsSnapshot ? game.baseStatsSnapshot.critChance : null;
    } else if (statType === 'lifesteal') {
        currentBaseValue = game.baseStatsWithoutRelics.lifesteal;
        snapshotValue = game.baseStatsSnapshot ? game.baseStatsSnapshot.lifesteal : null;
    } else if (statType === 'defense') {
        currentBaseValue = game.baseStatsWithoutRelics.defense;
        snapshotValue = game.baseStatsSnapshot ? game.baseStatsSnapshot.defense : null;
    } else if (statType === 'hp') {
        currentBaseValue = game.baseStatsWithoutRelics.maxHp;
        snapshotValue = game.baseStatsSnapshot ? game.baseStatsSnapshot.maxHp : null;
    } else {
        currentBaseValue = game.baseStatsWithoutRelics.attackSpeed;
        snapshotValue = game.baseStatsSnapshot ? game.baseStatsSnapshot.attackSpeed : null;
    }
    
    console.log('Current base value (without relics):', currentBaseValue);
    console.log('Snapshot value:', snapshotValue || 'NO SNAPSHOT');
    
    // Restore player to base stats first
    game.player.attack = game.baseStatsWithoutRelics.attack;
    game.player.attackSpeed = game.baseStatsWithoutRelics.attackSpeed;
    game.player.critChance = game.baseStatsWithoutRelics.critChance;
    game.player.lifesteal = game.baseStatsWithoutRelics.lifesteal;
    game.player.defense = game.baseStatsWithoutRelics.defense;
    game.player.maxHp = game.baseStatsWithoutRelics.maxHp;
    
    const removed = game.removeStatPoint(statType);
    if (removed) {
        game.availablePoints++;
        
        // Update baseStatsWithoutRelics with new value
        // Handle special cases for stat types
        if (statType === 'attackSpeed') {
            game.baseStatsWithoutRelics.attackSpeed = game.player.attackSpeed;
        } else if (statType === 'attack') {
            game.baseStatsWithoutRelics.attack = game.player.attack;
        } else if (statType === 'crit') {
            game.baseStatsWithoutRelics.critChance = game.player.critChance;
        } else if (statType === 'lifesteal') {
            game.baseStatsWithoutRelics.lifesteal = game.player.lifesteal;
        } else if (statType === 'defense') {
            game.baseStatsWithoutRelics.defense = game.player.defense;
        } else if (statType === 'hp') {
            game.baseStatsWithoutRelics.maxHp = game.player.maxHp;
        }
        
        // Reapply relic effects to get final stats
        game.applyRelicEffectsToBaseStats();
        
        // Get the actual value for logging
        let actualValue;
        if (statType === 'attackSpeed') {
            actualValue = game.player.attackSpeed;
        } else if (statType === 'attack') {
            actualValue = game.player.attack;
        } else if (statType === 'crit') {
            actualValue = game.player.critChance;
        } else if (statType === 'lifesteal') {
            actualValue = game.player.lifesteal;
        } else if (statType === 'defense') {
            actualValue = game.player.defense;
        } else if (statType === 'hp') {
            actualValue = game.player.maxHp;
        } else {
            actualValue = game.player.attackSpeed;
        }
        console.log('After removal:', actualValue);
        console.log('Remaining points:', game.availablePoints);
        updateStatsScreen();
    } else {
        console.log('Cannot remove: already at base value or no snapshot');
        // Still reapply relics even if removal failed
        game.applyRelicEffectsToBaseStats();
        updateStatsScreen();
    }
}

function checkStatCap(statType) {
    switch (statType) {
        case 'attackSpeed': return game.player.attackSpeed < 6.0;
        case 'crit': return game.player.critChance < 0.75;
        case 'lifesteal': return game.player.lifesteal < 0.40;
        default: return true;
    }
}

// ========================================
// RELIC SELECTION SCREEN
// ========================================

function showRelicTooltip(relic) {
    const tooltip = document.getElementById('relic-tooltip');
    const overlay = document.getElementById('relic-tooltip-overlay');
    
    document.getElementById('tooltip-icon').innerHTML = relic.icon;
    document.getElementById('tooltip-name').textContent = relic.name;
    document.getElementById('tooltip-description').textContent = relic.description;
    
    tooltip.classList.add('visible');
    overlay.classList.add('visible');
    
    // Auto-hide after 5 seconds (optional, user can still close manually)
    clearTimeout(window.tooltipTimeout);
    window.tooltipTimeout = setTimeout(() => {
        hideRelicTooltip();
    }, 5000);
}

function hideRelicTooltip() {
    clearTimeout(window.tooltipTimeout);
    document.getElementById('relic-tooltip').classList.remove('visible');
    document.getElementById('relic-tooltip-overlay').classList.remove('visible');
}

function showRelicConfirmation(relic, isReplaceMode, replaceIndex, onConfirm) {
    const modal = document.getElementById('relic-confirmation-modal');
    const confirmIcon = document.getElementById('confirm-icon');
    const confirmName = document.getElementById('confirm-name');
    const confirmDescription = document.getElementById('confirm-description');
    const replaceInfo = document.getElementById('relic-confirm-replace-info');
    
    confirmIcon.innerHTML = relic.icon;
    confirmName.textContent = relic.name;
    confirmDescription.textContent = relic.description;
    
    if (isReplaceMode && replaceIndex !== null) {
        const oldRelic = game.relicManager.activeRelics[replaceIndex];
        replaceInfo.innerHTML = `<strong>⚠️ Replacing:</strong><br>${oldRelic.icon} ${oldRelic.name}`;
        replaceInfo.classList.remove('hidden');
    } else {
        replaceInfo.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
    
    // Store callback
    window.relicConfirmCallback = onConfirm;
}

function showHomeConfirmation(onConfirm) {
    const modal = document.getElementById('home-confirmation-modal');
    modal.classList.remove('hidden');
    
    // Store callback
    window.homeConfirmCallback = onConfirm;
}

function updateRelicScreen() {
    console.log('=== UPDATE RELIC SCREEN ===');
    console.log('Active relics:', game.relicManager.activeRelics.length);
    
    // Show current relics at bottom (like in battle)
    const currentRelicsContainer = document.getElementById('current-relics');
    currentRelicsContainer.innerHTML = '';
    currentRelicsContainer.className = 'current-relics';
    
    const isReplaceMode = game.relicManager.activeRelics.length >= 3;
    
    if (game.relicManager.activeRelics.length > 0) {
        // Create title
        const title = document.createElement('h4');
        title.style.cssText = 'font-size: clamp(10px, 3vw, 14px); color: #d4af37; margin-bottom: 8px; text-align: center;';
        title.textContent = '⚡ Current Relics';
        currentRelicsContainer.appendChild(title);
        
        // Create slots container (horizontal layout like result screen)
        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'final-relics-slots'; // Use same class as result screen
        slotsContainer.style.cssText = 'display: flex; gap: clamp(8px, 2vw, 12px); justify-content: center; align-items: center;';
        
        // Create slots similar to result screen
        for (let i = 0; i < 3; i++) {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'final-relic-slot'; // Use same class as result screen
            
            if (i < game.relicManager.activeRelics.length) {
                const relic = game.relicManager.activeRelics[i];
                slotDiv.textContent = relic.icon;
                slotDiv.classList.add('active');
                slotDiv.title = relic.name;
                
                // Show tooltip on tap/click (when not in replace mode or not selected)
                slotDiv.onclick = (e) => {
                    e.stopPropagation();
                    if (isReplaceMode) {
                        // In replace mode, clicking current relic selects it for replacement
                        selectRelicToReplace(i);
                    } else {
                        // Otherwise just show tooltip
                        showRelicTooltip(relic);
                    }
                };
                
                // Touch support
                slotDiv.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    if (isReplaceMode) {
                        slotDiv.classList.add('touching');
                    }
                });
                
                slotDiv.addEventListener('touchend', (e) => {
                    e.stopPropagation();
                    slotDiv.classList.remove('touching');
                    if (isReplaceMode) {
                        selectRelicToReplace(i);
                    } else {
                        showRelicTooltip(game.relicManager.activeRelics[i]);
                    }
                });
            } else {
                slotDiv.classList.add('empty');
            }
            
            slotsContainer.appendChild(slotDiv);
        }
        
        currentRelicsContainer.appendChild(slotsContainer);
        
        // Add instruction text in replace mode
        if (isReplaceMode) {
            const instruction = document.createElement('div');
            instruction.className = 'relic-replace-instruction';
            instruction.textContent = 'Tap a relic above to replace it, then select a new one below';
            instruction.style.cssText = 'font-size: clamp(10px, 2.5vw, 12px); color: #ffcc00; text-align: center; margin-top: 8px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);';
            currentRelicsContainer.appendChild(instruction);
        }
    }
    
    const container = document.getElementById('relic-options');
    container.innerHTML = '';
    
    // Reset selectedReplaceIndex when screen updates
    selectedReplaceIndex = null;
    
    const isReplaceModeForCards = game.relicManager.activeRelics.length >= 3;
    console.log('Replace mode:', isReplaceModeForCards);
    
    // Get 3 random relics
    const relicOptions = game.relicManager.getRandomRelics(3);
    console.log('Relic options:', relicOptions.length, relicOptions);
    
    if (relicOptions.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #f4e4c1; padding: 20px;">No relics available</div>';
        return;
    }
    
    // Track selected relic
    let selectedRelic = null;
    let isSelecting = false;
    
    // Update select button visibility
    function updateSelectButton() {
        const selectBtn = document.getElementById('btn-select-relic');
        const selectedNameSpan = document.getElementById('selected-relic-name');
        
        if (!selectBtn) return; // Safety check
        
        if (selectedRelic) {
            selectBtn.classList.remove('hidden');
            selectedNameSpan.textContent = selectedRelic.name;
            console.log('Select button shown for:', selectedRelic.name);
        } else {
            selectBtn.classList.add('hidden');
            console.log('Select button hidden');
        }
    }
    
    // Function to actually apply the selected relic
    function applySelectedRelic() {
        if (!selectedRelic || isSelecting) return;
        
        isSelecting = true;
        console.log('Applying relic:', selectedRelic.name);
        
        // Disable all cards
        document.querySelectorAll('.relic-card').forEach(c => {
            c.style.pointerEvents = 'none';
            c.style.opacity = '0.5';
        });
        
        // Apply relic (add or replace)
        if (isReplaceModeForCards) {
            // Remove effects of old relic first
            const oldRelic = game.relicManager.activeRelics[selectedReplaceIndex];
            removeRelicEffects(oldRelic);
            
            // Replace the relic
            game.relicManager.replaceRelic(selectedReplaceIndex, selectedRelic);
            
            console.log(`Replaced relic at index ${selectedReplaceIndex}: ${oldRelic.name} -> ${selectedRelic.name}`);
        } else {
            game.relicManager.addRelic(selectedRelic);
        }
        
        // Ensure we have baseStatsWithoutRelics (stats without relic effects)
        if (!game.baseStatsWithoutRelics) {
            // If this is the first relic, use current player stats as base
            game.baseStatsWithoutRelics = {
                attack: game.player.attack,
                attackSpeed: game.player.attackSpeed,
                critChance: game.player.critChance,
                lifesteal: game.player.lifesteal,
                defense: game.player.defense,
                maxHp: game.player.maxHp
            };
        }
        
        // Now apply ALL active relic effects (including the new/replaced one)
        // This ensures effects are applied only once, in the correct order
        console.log('=== APPLYING ALL RELIC EFFECTS ===');
        console.log('Active relics:', game.relicManager.activeRelics.map(r => r.name));
        console.log('Base stats WITHOUT relics:', game.baseStatsWithoutRelics);
        
        // Apply relic effects to base stats (recalculates percentage effects)
        game.applyRelicEffectsToBaseStats();
        
        console.log('Player stats AFTER relic effect:', {
            atk: game.player.attack,
            hp: game.player.maxHp,
            def: game.player.defense,
            lifesteal: game.player.lifesteal,
            atkSpd: game.player.attackSpeed
        });
        console.log('Active relics after selection:', game.relicManager.activeRelics.length);
        console.log('Navigating to stats in 300ms...');
        
        // Continue to stats allocation
        setTimeout(() => {
            console.log('Calling showScreen(stats)...');
            showScreen('stats');
        }, 300);
    }
    
    // Set up select button listener (only once per screen update)
    const selectBtn = document.getElementById('btn-select-relic');
    // Remove old listeners by cloning
    const newSelectBtn = selectBtn.cloneNode(true);
    selectBtn.parentNode.replaceChild(newSelectBtn, selectBtn);
    newSelectBtn.addEventListener('click', () => {
        applySelectedRelic();
    });
    
    relicOptions.forEach((relic, index) => {
        console.log(`Creating card ${index} for relic:`, relic.name);
        
        const card = document.createElement('div');
        card.className = 'relic-card' + (isReplaceModeForCards && selectedReplaceIndex === null ? ' replace-mode-waiting' : '');
        card.innerHTML = `
            <div class="relic-card-header">
                <div class="relic-icon">${relic.icon}</div>
                <div class="relic-name">${relic.name}</div>
            </div>
            <div class="relic-description">${relic.description}</div>
        `;
        
        // Handler to select relic (visual selection only)
        const selectRelicVisual = (e) => {
            if (isSelecting) {
                console.log('Already applying, ignoring');
                return;
            }
            
            // In replace mode, must select a current relic first
            if (isReplaceModeForCards && selectedReplaceIndex === null) {
                console.log('Must select a current relic to replace first');
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle selection
            if (selectedRelic === relic) {
                // Deselect
                selectedRelic = null;
                card.classList.remove('selected');
            } else {
                // Deselect previous
                document.querySelectorAll('.relic-card').forEach(c => {
                    c.classList.remove('selected');
                });
                // Select this one
                selectedRelic = relic;
                card.classList.add('selected');
            }
            
            updateSelectButton();
        };
        
        // Store relic reference
        card._relic = relic;
        
        // Add click/touch to select relic visually - SIMPLE, NO TOOLTIPS
        card.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isSelecting) {
                selectRelicVisual(e);
            }
        });
        
        // Touch support for mobile
        card.addEventListener('touchstart', (e) => {
            if (!isSelecting) {
                e.stopPropagation();
                card.classList.add('touching');
            }
        });
        
        card.addEventListener('touchend', (e) => {
            if (!isSelecting) {
                e.preventDefault();
                e.stopPropagation();
                card.classList.remove('touching');
                selectRelicVisual(e);
            }
        });
        
        container.appendChild(card);
        console.log(`Card ${index} appended to container`);
    });
    
    // Initialize select button as hidden
    updateSelectButton();
    
    // Reset selectedReplaceIndex when screen updates
    selectedReplaceIndex = null;
    
    console.log('Total cards in container:', container.children.length);
    
    // Always show skip button with appropriate text
    const skipBtn = document.getElementById('btn-skip-relic');
    skipBtn.style.display = 'block';
    
    if (isReplaceMode) {
        skipBtn.textContent = 'Skip (Keep Current 3)';
    } else {
        skipBtn.textContent = 'Skip (Continue Without Relic)';
    }
    
    console.log('=== RELIC SCREEN READY ===');
}

// Global variable to track which current relic is selected for replacement
let selectedReplaceIndex = null;

function selectRelicToReplace(index) {
    selectedReplaceIndex = index;
    const selectedRelic = game.relicManager.activeRelics[index];
    console.log('Selected relic to replace:', index, selectedRelic.name);
    
    // Update UI to show which relic is selected for replacement
    // Support both old class name and new class name
    const slots = document.querySelectorAll('.relic-selection-slot, .final-relic-slot');
    slots.forEach((slot, i) => {
        if (i === index && i < game.relicManager.activeRelics.length) {
            slot.classList.add('selected-for-replace');
        } else {
            slot.classList.remove('selected-for-replace');
        }
    });
    
    // Show tooltip with the selected relic's description
    showRelicTooltip(selectedRelic);
    
    // Enable new relic cards
    document.querySelectorAll('.relic-card').forEach(card => {
        card.classList.remove('replace-mode-waiting');
    });
    
    // Update new relic cards to show they're ready to be selected
    const cards = document.querySelectorAll('.relic-card');
    cards.forEach(card => {
        card.classList.remove('replace-mode-waiting');
        if (card._selectRelic) {
            // Enable selection
            card.style.pointerEvents = 'auto';
            card.style.opacity = '1';
        }
    });
}

// Function to remove relic effects (inverse of applying them)
function removeRelicEffects(relic) {
    console.log('=== REMOVING RELIC EFFECTS ===', relic.name);
    
    // Restore player to base stats without relics
    if (game.baseStatsWithoutRelics) {
        game.player.attack = game.baseStatsWithoutRelics.attack;
        game.player.attackSpeed = game.baseStatsWithoutRelics.attackSpeed;
        game.player.critChance = game.baseStatsWithoutRelics.critChance;
        game.player.lifesteal = game.baseStatsWithoutRelics.lifesteal;
        game.player.defense = game.baseStatsWithoutRelics.defense;
        game.player.maxHp = game.baseStatsWithoutRelics.maxHp;
    }
    
    // Remove this specific relic from active list temporarily
    const relicIndex = game.relicManager.activeRelics.indexOf(relic);
    if (relicIndex >= 0) {
        game.relicManager.activeRelics.splice(relicIndex, 1);
        
        // Reapply all remaining relics
        game.relicManager.applyStatEffects(game.player);
        
        // Put relic back (will be replaced shortly)
        game.relicManager.activeRelics.splice(relicIndex, 0, relic);
    }
    
    console.log('Relic effects removed, stats reset to base');
}

// ========================================
// BATTLE SCREEN
// ========================================

function startBattleScreen() {
    // Setup canvas size
    resizeCanvas();
    
    // Initial render of UI canvas
    renderBattleUI();
    
    // Update UI
    document.getElementById('current-floor').textContent = game.currentFloor;
    
    // Show boss indicator or archetype
    if (game.isBossFloor()) {
        document.getElementById('archetype-name').textContent = '⚔️ BOSS FLOOR ⚔️';
        document.getElementById('archetype-name').style.color = '#ffd700'; // Gold
    } else {
        document.getElementById('archetype-name').textContent = game.enemyGen.getArchetypeName(game.currentArchetype);
        document.getElementById('archetype-name').style.color = ''; // Reset
    }
    
    document.getElementById('btn-speed-toggle').textContent = `${game.battleSpeed}x`;
    
    // Update relic display
    updateBattleRelicDisplay();
    
    // Start battle
    game.startBattle();
    updateBattleUI();
    
    // Start animation loop
    if (animationFrame) cancelAnimationFrame(animationFrame);
    battleLoop();
}

function updateBattleRelicDisplay() {
    const slots = document.querySelectorAll('.battle-relic-slot');
    const relics = game.relicManager.activeRelics;
    
    console.log('=== UPDATE BATTLE RELIC DISPLAY ===');
    console.log('Active relics:', relics.length, relics);
    
    slots.forEach((slot, index) => {
        slot.classList.remove('active', 'empty');
        
        if (index < relics.length) {
            const relic = relics[index];
            slot.textContent = relic.icon;
            slot.classList.add('active');
            slot.title = relic.name;
            console.log(`Slot ${index}: ${relic.name} (${relic.icon})`);
        } else {
            slot.textContent = '';
            slot.classList.add('empty');
            console.log(`Slot ${index}: empty`);
        }
    });
}

function battleLoop() {
    // If showing battle result overlay, just render and wait
    if (game.battleResult) {
        renderBattle();
        renderBattleUI();
        animationFrame = requestAnimationFrame(battleLoop);
        return;
    }
    
    const result = game.updateBattle(performance.now());
    
    updateBattleUI();
    renderBattle();
    renderBattleUI();
    
    if (result === 'win') {
        // Set battle result and show overlay, keep rendering for 2 seconds
        game.battleResult = 'win';
        setTimeout(() => {
            cancelAnimationFrame(animationFrame);
            game.battleResult = null;
            handleBattleWin();
        }, 2000);
    } else if (result === 'loss') {
        // Set battle result and show overlay, keep rendering for 2 seconds
        game.battleResult = 'lose';
        setTimeout(() => {
            cancelAnimationFrame(animationFrame);
            game.battleResult = null;
            handleBattleLoss();
        }, 2000);
    }
    
    animationFrame = requestAnimationFrame(battleLoop);
}

function updateBattleUI() {
    // This function is now just a placeholder - UI is rendered in canvas
    // Data is already in game.player and game.enemy
}

function renderBattleUI() {
    const ctx = game.uiCtx;
    const canvas = game.uiCanvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!game.player || !game.enemy) return;
    
    // Panel dimensions
    const panelPadding = 8;
    const panelWidth = (canvas.width - panelPadding * 3) / 2;
    const panelHeight = canvas.height - panelPadding * 2;
    const panelX1 = panelPadding;
    const panelX2 = panelWidth + panelPadding * 2;
    const panelY = panelPadding;
    
    // Draw both panels
    drawFighterPanel(ctx, panelX1, panelY, panelWidth, panelHeight, game.player, 'HERO', '#4caf50');
    drawFighterPanel(ctx, panelX2, panelY, panelWidth, panelHeight, game.enemy, 'ENEMY', '#f44336');
}

function drawFighterPanel(ctx, x, y, width, height, fighter, title, titleColor) {
    // Panel background
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, 'rgba(42, 31, 24, 0.95)');
    gradient.addColorStop(1, 'rgba(26, 19, 14, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // Border
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    
    // Title (compact)
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, x + width / 2, y + 6);
    
    // Calculate shake effect based on recent damage
    let shakeX = 0;
    let shakeY = 0;
    let damageFlash = false;
    const shakeDuration = 0.3; // 300ms shake duration (increased for visibility)
    const currentTime = game.combat ? game.combat.combatTime : 0;
    
    if (fighter.lastDamageTime !== undefined && fighter.lastDamageAmount !== undefined) {
        const timeSinceDamage = currentTime - fighter.lastDamageTime;
        if (timeSinceDamage >= 0 && timeSinceDamage < shakeDuration) {
            const isCrit = fighter.lastDamageIsCrit === true;
            
            // Different shake intensity for crits vs normal hits
            // Crits: full shake (8px max), normal: reduced shake (3px max)
            const maxShake = isCrit ? 8 : 3;
            const shakeIntensity = Math.min(1.0, (fighter.lastDamageAmount / 30.0)) * maxShake;
            const decayFactor = 1.0 - (timeSinceDamage / shakeDuration); // Linear decay
            const finalShake = shakeIntensity * decayFactor;
            
            // Random shake direction (changes every frame for vibration effect)
            shakeX = (Math.random() - 0.5) * 2 * finalShake;
            shakeY = (Math.random() - 0.5) * 2 * finalShake;
            
            // Flash effect for first 0.1 seconds (only for crits)
            if (timeSinceDamage < 0.1 && isCrit) {
                damageFlash = true;
            }
        }
    }
    
    // HP Bar (compact - moved up)
    const hpBarY = y + 20;
    const hpBarHeight = 10;
    const hpBarWidth = width - 12;
    const hpBarX = x + 6;
    
    // Apply shake to HP bar position
    const shakenHpBarX = hpBarX + shakeX;
    const shakenHpBarY = hpBarY + shakeY;
    
    // HP Bar background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(shakenHpBarX, shakenHpBarY, hpBarWidth, hpBarHeight);
    
    // Damage flash effect (red overlay)
    if (damageFlash) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Red flash overlay
        ctx.fillRect(shakenHpBarX, shakenHpBarY, hpBarWidth, hpBarHeight);
    }
    
    // SHIELD SYSTEM: Draw HP bar with shield color when shield is active
    const hasShield = fighter.shield !== undefined && fighter.shield > 0 && fighter.maxShield !== undefined && fighter.maxShield > 0;
    
    const hpPercent = Math.max(0, Math.min(1, fighter.currentHp / fighter.maxHp));
    const hpFillWidth = hpBarWidth * hpPercent;
    
    if (hpPercent > 0) {
        const hpGradient = ctx.createLinearGradient(shakenHpBarX, shakenHpBarY, shakenHpBarX, shakenHpBarY + hpBarHeight);
        
        if (title === 'HERO') {
            // HERO: Change color when shield is active
            if (hasShield) {
                // Shield active: Blue/cyan gradient (brighter, more vibrant)
                hpGradient.addColorStop(0, '#03a9f4'); // Bright cyan-blue
                hpGradient.addColorStop(1, '#0288d1'); // Darker cyan-blue
            } else {
                // No shield: Normal green gradient
                hpGradient.addColorStop(0, '#4caf50'); // Green
                hpGradient.addColorStop(1, '#8bc34a'); // Light green
            }
        } else {
            // ENEMY: Always red gradient
            hpGradient.addColorStop(0, '#f44336');
            hpGradient.addColorStop(1, '#ff5722');
        }
        
        ctx.fillStyle = hpGradient;
        ctx.fillRect(shakenHpBarX, shakenHpBarY, hpFillWidth, hpBarHeight);
    }
    
    // Draw shield bar on top of HP bar (if shield is active and broken)
    // The shield bar shows the remaining shield as a separate blue layer
    if (hasShield && title === 'HERO') {
        const totalPool = (fighter.maxHp || 0) + (fighter.maxShield || 0);
        const shieldPercent = fighter.shield / totalPool;
        const shieldFillWidth = hpBarWidth * shieldPercent;
        
        // Draw shield bar on top (blue gradient, slightly transparent)
        const shieldGradient = ctx.createLinearGradient(shakenHpBarX, shakenHpBarY, shakenHpBarX, shakenHpBarY + hpBarHeight);
        shieldGradient.addColorStop(0, 'rgba(33, 150, 243, 0.6)'); // Light blue, semi-transparent
        shieldGradient.addColorStop(1, 'rgba(25, 118, 210, 0.6)'); // Dark blue, semi-transparent
        ctx.fillStyle = shieldGradient;
        ctx.fillRect(shakenHpBarX, shakenHpBarY, shieldFillWidth, hpBarHeight);
    }
    
    const isDead = fighter.currentHp <= 0;
    
    // HP Bar border
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    ctx.strokeRect(shakenHpBarX, shakenHpBarY, hpBarWidth, hpBarHeight);
    
    // Draw cracks when HP is 0 (broken bar effect) - more visible
    if (isDead) {
        ctx.save();
        // Use a seed for consistent crack pattern (based on fighter maxHp for uniqueness)
        const seed = fighter.maxHp * 1000;
        
        // Draw multiple crack lines - more visible
        const crackCount = 6 + Math.floor((seed % 3)); // 6-8 cracks
        ctx.strokeStyle = '#000000'; // Pure black for maximum visibility
        ctx.lineWidth = 2.5; // Thicker lines
        
        for (let i = 0; i < crackCount; i++) {
            // Use seed to make cracks consistent (not random every frame)
            const pseudoRandom1 = ((seed + i * 73) % 1000) / 1000;
            const pseudoRandom2 = ((seed + i * 137) % 1000) / 1000;
            const pseudoRandom3 = ((seed + i * 211) % 1000) / 1000;
            const pseudoRandom4 = ((seed + i * 317) % 1000) / 1000;
            
            const startX = shakenHpBarX + pseudoRandom1 * hpBarWidth;
            const startY = shakenHpBarY + pseudoRandom2 * hpBarHeight;
            const endX = startX + (pseudoRandom3 - 0.5) * 15; // Longer cracks
            const endY = startY + (pseudoRandom4 - 0.5) * 15;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Add branch crack (more likely)
            if (pseudoRandom1 > 0.3) {
                const branchX = ((seed + i * 419) % 1000) / 1000;
                const branchY = ((seed + i * 521) % 1000) / 1000;
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(endX + (branchX - 0.5) * 8, endY + (branchY - 0.5) * 8);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    // HP Text (much larger font) - Show shield if active
    ctx.font = '13px "Press Start 2P", monospace'; // Increased from 10px to 13px
    ctx.fillStyle = '#a0a0a0';
    ctx.textAlign = 'center';
    
    // Show HP+Shield format if shield is active (only for player)
    if (hasShield && title === 'HERO') {
        ctx.fillText(`${Math.max(0, Math.round(fighter.currentHp))}+${Math.round(fighter.shield)} / ${fighter.maxHp}`, x + width / 2, hpBarY + hpBarHeight + 5);
    } else {
        ctx.fillText(`${Math.max(0, Math.round(fighter.currentHp))} / ${fighter.maxHp}`, x + width / 2, hpBarY + hpBarHeight + 5);
    }
    
    // Stats (separated from HP bar, larger font)
    const statsY = hpBarY + hpBarHeight + 22; // Increased spacing from HP text (was 14, now 22)
    ctx.font = '11px "Press Start 2P", monospace'; // Increased from 9px to 11px
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e0e0e0';
    
    const stats = [
        `ATK: ${fighter.attack}`,
        `SPD: ${fighter.attackSpeed.toFixed(1)}/s`,
        `CRT: ${Math.round(fighter.critChance * 100)}%`,
        `DEF: ${fighter.defense}`,
        `LS: ${Math.round((fighter.lifesteal || 0) * 100)}%`
    ];
    
    // Calculate spacing to minimize empty space - tighter spacing
    const lineHeight = 11; // Font size (updated to match)
    const lineSpacing = 3; // Small spacing between lines
    const totalStatsHeight = (stats.length - 1) * (lineHeight + lineSpacing) + lineHeight;
    const availableHeight = height - (statsY - y);
    const spacing = availableHeight > totalStatsHeight ? lineHeight + lineSpacing : Math.floor(availableHeight / stats.length);
    
    stats.forEach((stat, index) => {
        ctx.fillText(stat, x + 6, statsY + index * spacing);
    });
}

function renderBattle() {
    const ctx = game.ctx;
    const canvas = game.canvas;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background with proper aspect ratio (cover effect)
    if (game.sprites.background.complete) {
        const bgWidth = game.sprites.background.width;
        const bgHeight = game.sprites.background.height;
        const canvasRatio = canvas.width / canvas.height;
        const bgRatio = bgWidth / bgHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (canvasRatio > bgRatio) {
            // Canvas is wider than background - fit to width
            drawWidth = canvas.width;
            drawHeight = canvas.width / bgRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            // Canvas is taller than background - fit to height
            drawWidth = canvas.height * bgRatio;
            drawHeight = canvas.height;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        }
        
        ctx.drawImage(game.sprites.background, offsetX, offsetY, drawWidth, drawHeight);
    } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Position sprites centered horizontally and vertically
    const heroXPos = canvas.width * 0.25;  // 25% from left (más centrado)
    const enemyXPos = canvas.width * 0.75; // 75% from left (más centrado)
    const verticalCenter = canvas.height * 0.55; // Un poco abajo del centro
    
    // Determine which sprites to use (alive or dead)
    const heroSprite = game.player.currentHp <= 0 ? game.sprites.heroDead : game.sprites.hero;
    const enemySprite = game.enemy.currentHp <= 0 ? getEnemySprite(true) : getEnemySprite(false);
    
    // Draw hero (centered, sin escalar - usa tamaño original)
    if (heroSprite && heroSprite.complete) {
        const heroW = heroSprite.width;
        const heroH = heroSprite.height;
        const heroX = heroXPos - heroW / 2;
        const heroY = verticalCenter - heroH / 2;
        ctx.drawImage(heroSprite, heroX, heroY, heroW, heroH);
    }
    
    // Draw enemy (centered, sin escalar - usa tamaño original)
    if (enemySprite && enemySprite.complete) {
        const enemyW = enemySprite.width;
        const enemyH = enemySprite.height;
        const enemyX = enemyXPos - enemyW / 2;
        const enemyY = verticalCenter - enemyH / 2;
        ctx.drawImage(enemySprite, enemyX, enemyY, enemyW, enemyH);
    }
    
    // Draw WIN/LOSE overlay if battle ended
    if (game.battleResult) {
        ctx.save();
        
        // Semi-transparent background (más transparente)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Result text (más abajo, sin signos de exclamación)
        let resultText = game.battleResult === 'win' ? 'VICTORY' : 'DEFEAT';
        let resultColor = game.battleResult === 'win' ? '#4caf50' : '#f44336';
        
        // Special text for boss wins
        if (game.battleResult === 'win' && game.enemy && game.enemy.isBoss) {
            resultText = 'BOSS DEFEATED';
            resultColor = '#ffd700'; // Gold
        }
        
        ctx.font = `bold ${canvas.width * 0.06}px 'Press Start 2P', monospace`; // Smaller font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Position text at 85% down (más abajo para no tapar personajes)
        const textY = canvas.height * 0.85;
        
        // Text outline (más grueso para mejor visibilidad)
        ctx.lineWidth = 10;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.strokeText(resultText, canvas.width / 2, textY);
        
        // Text fill
        ctx.fillStyle = resultColor;
        ctx.fillText(resultText, canvas.width / 2, textY);
        
        ctx.restore();
    }
    
    // Draw floating combat text (render last so it's on top)
    if (game.combat && game.combat.floatingTexts && game.combat.floatingTexts.length > 0) {
        // Save context state
        ctx.save();
        
        game.combat.floatingTexts.forEach(floatText => {
            // Calculate position based on target with pre-generated offset
            const baseX = floatText.target === 'player' ? heroXPos : enemyXPos;
            const baseY = verticalCenter - 80; // Position well above sprite
            
            // Calculate current position with offset and movement
            const currentY = baseY - floatText.offsetY - (1.5 - floatText.lifetime) * 60;
            const currentX = baseX + floatText.offsetX;
            
            // Set font and style - reduced size for better visibility
            const fontSize = floatText.isCrit ? 18 : 14;
            ctx.font = `bold ${fontSize}px 'Press Start 2P', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw text with strong outline for visibility
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(0, 0, 0, ' + (floatText.opacity * 0.9) + ')';
            ctx.globalAlpha = floatText.opacity;
            
            // Set color based on type
            if (floatText.isHeal) {
                ctx.fillStyle = '#4caf50'; // Green for heals
            } else if (floatText.isMiss) {
                ctx.fillStyle = '#bdbdbd';
            } else if (floatText.isCrit) {
                ctx.fillStyle = '#ffd700';
            } else {
                ctx.fillStyle = '#ff5252';
            }
            
            // Draw outline then fill
            ctx.strokeText(floatText.text, currentX, currentY);
            ctx.fillText(floatText.text, currentX, currentY);
        });
        
        // Restore context state
        ctx.restore();
    }
}

function handleBattleWin() {
    cancelAnimationFrame(animationFrame);
    
    const nextAction = game.nextFloor();
    
    if (nextAction === 'relic') {
        // Relic selection (Floor 1, or every 10 floors: 10, 20, 30...)
        setTimeout(() => showScreen('relic'), 500);
    } else if (nextAction === 'stats') {
        // Stat allocation (every 5 floors: 5, 10, 15, 20, 25, 30...)
        setTimeout(() => showScreen('stats'), 500);
    } else {
        // Continue to next floor (no stat allocation, no relic selection)
        setTimeout(() => startBattleScreen(), 500);
    }
}

function handleBattleLoss() {
    cancelAnimationFrame(animationFrame);
    setTimeout(() => showScreen('result'), 1000);
}

function resizeCanvas() {
    // Resize battle canvas (combat rendering)
    const canvas = game.canvas;
    const container = canvas.parentElement; // .battle-arena
    const uiCanvas = game.uiCanvas;
    
    // Resize UI canvas first (fixed height from CSS)
    uiCanvas.width = container.clientWidth;
    const uiCanvasComputedHeight = parseInt(getComputedStyle(uiCanvas).height);
    uiCanvas.height = uiCanvasComputedHeight || 120;
    
    // Battle canvas takes remaining space (flex: 1)
    // Calculate available height: container height minus UI canvas height
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight - uiCanvas.height;
}

// ========================================
// RESULT SCREEN
// ========================================

function updateResultScreen() {
    console.log('=== UPDATE RESULT SCREEN ===');
    console.log('Current floor:', game.currentFloor);
    console.log('Run start time:', game.runStartTime);
    console.log('Current time:', Date.now());
    
    const floor = game.currentFloor;
    const duration = game.getRunDuration();
    console.log('Duration:', duration);
    
    const isTop = topRuns.isTopRun(floor, duration);
    
    // Save if top run
    if (isTop) {
        const build = game.createBuildSnapshot();
        topRuns.saveTopRun(floor, duration, game.difficulty, build);
    }
    
    // Update display
    document.getElementById('result-floor').textContent = floor;
    document.getElementById('result-duration').textContent = `${duration}s`;
    document.getElementById('result-difficulty').textContent = capitalize(game.difficulty);
    
    // Show top run badge
    const badge = document.getElementById('top-run-badge');
    badge.classList.toggle('hidden', !isTop);
    
    // Show final build
    const build = game.createBuildSnapshot();
    console.log('Build snapshot:', build);
    
    document.getElementById('final-build-stats').innerHTML = `
        <div>Attack: ${build.atk}</div>
        <div>Attack Speed: ${build.atkSpd}/s</div>
        <div>Critical: ${Math.round(build.crit * 100)}%</div>
        <div>Lifesteal: ${Math.round(build.lifesteal * 100)}%</div>
        <div>Defense: ${build.def}</div>
        <div>HP: ${build.hp}</div>
    `;
    
    // Show final relics
    const slotsContainer = document.getElementById('final-relics-slots');
    const relics = game.relicManager.activeRelics;
    
    console.log('=== UPDATING RESULT RELICS ===');
    console.log('Active relics:', relics.length, relics.map(r => ({ name: r.name, icon: r.icon })));
    console.log('Slots container found:', slotsContainer ? 'YES' : 'NO');
    
    if (!slotsContainer) {
        console.error('final-relics-slots container not found!');
        return;
    }
    
    // Clear existing slots
    slotsContainer.innerHTML = '';
    
    // Create 3 slots
    for (let i = 0; i < 3; i++) {
        const slot = document.createElement('div');
        slot.className = 'final-relic-slot';
        
        if (i < relics.length) {
            const relic = relics[i];
            console.log(`Slot ${i}: Setting relic ${relic.name} with icon: ${relic.icon}`);
            
            // Set icon using innerHTML for emoji support
            slot.innerHTML = relic.icon;
            slot.classList.add('active');
            slot.title = relic.name;
            
            // Add click/touch handlers for tooltip
            slot.onclick = (e) => {
                e.stopPropagation();
                showRelicTooltip(relic);
            };
            
            // Touch support for mobile
            slot.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            });
            
            slot.addEventListener('touchend', (e) => {
                e.stopPropagation();
                showRelicTooltip(relic);
            });
        } else {
            slot.classList.add('empty');
        }
        
        slotsContainer.appendChild(slot);
    }
    
    console.log('Result screen updated');
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Menu screen
    document.getElementById('btn-play').addEventListener('click', () => {
        game.resetRun();
        showScreen('relic'); // Start with relic selection first
    });
    
    document.getElementById('btn-how-to-play').addEventListener('click', () => {
        document.getElementById('how-to-play-modal').classList.remove('hidden');
    });
    
    document.getElementById('btn-close-guide').addEventListener('click', () => {
        document.getElementById('how-to-play-modal').classList.add('hidden');
    });
    
    // Close modal when clicking outside content
    document.getElementById('how-to-play-modal').addEventListener('click', (e) => {
        if (e.target.id === 'how-to-play-modal') {
            document.getElementById('how-to-play-modal').classList.add('hidden');
        }
    });
    
    document.getElementById('btn-top-runs').addEventListener('click', () => {
        const panel = document.getElementById('top-runs-panel');
        panel.classList.toggle('hidden');
        updateTopRunsDisplay();
    });
    
    // Difficulty buttons
    document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            game.difficulty = btn.dataset.difficulty;
        });
    });
    
    // Stat allocation
    document.querySelectorAll('.btn-stat-plus').forEach(btn => {
        btn.addEventListener('click', () => {
            allocateStatPoint(btn.dataset.stat);
        });
    });
    
    document.querySelectorAll('.btn-stat-minus').forEach(btn => {
        btn.addEventListener('click', () => {
            removeStatPoint(btn.dataset.stat);
        });
    });
    
    document.getElementById('btn-start-battle').addEventListener('click', () => {
        // Update basePlayerStats after stat allocation (before battle starts)
        game.updateBasePlayerStats();
        showScreen('battle');
    });
    
    // Home button from stats screen
    document.getElementById('btn-stats-home').addEventListener('click', () => {
        showHomeConfirmation(() => {
            showScreen('menu');
        });
    });
    
    // Relic screen
    document.getElementById('btn-skip-relic').addEventListener('click', () => {
        showScreen('stats');
    });
    
    // Home button from relic screen
    document.getElementById('btn-relic-home').addEventListener('click', () => {
        showHomeConfirmation(() => {
            showScreen('menu');
        });
    });
    
    // Relic tooltip overlay
    document.getElementById('relic-tooltip-overlay').addEventListener('click', () => {
        hideRelicTooltip();
    });
    
    document.getElementById('relic-tooltip').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Close tooltip button
    document.getElementById('btn-close-tooltip').addEventListener('click', () => {
        hideRelicTooltip();
    });
    
    // Relic confirmation modal
    document.getElementById('btn-relic-confirm').addEventListener('click', () => {
        const modal = document.getElementById('relic-confirmation-modal');
        modal.classList.add('hidden');
        if (window.relicConfirmCallback) {
            window.relicConfirmCallback();
            window.relicConfirmCallback = null;
        }
    });
    
    document.getElementById('btn-relic-cancel').addEventListener('click', () => {
        const modal = document.getElementById('relic-confirmation-modal');
        modal.classList.add('hidden');
        window.relicConfirmCallback = null;
    });
    
    // Close modal on overlay click
    document.getElementById('relic-confirmation-modal').addEventListener('click', (e) => {
        if (e.target.id === 'relic-confirmation-modal') {
            document.getElementById('relic-confirmation-modal').classList.add('hidden');
            window.relicConfirmCallback = null;
        }
    });
    
    // Home confirmation modal
    document.getElementById('btn-home-confirm').addEventListener('click', () => {
        const modal = document.getElementById('home-confirmation-modal');
        modal.classList.add('hidden');
        if (window.homeConfirmCallback) {
            window.homeConfirmCallback();
            window.homeConfirmCallback = null;
        }
    });
    
    document.getElementById('btn-home-cancel').addEventListener('click', () => {
        const modal = document.getElementById('home-confirmation-modal');
        modal.classList.add('hidden');
        window.homeConfirmCallback = null;
    });
    
    // Close home modal on overlay click
    document.getElementById('home-confirmation-modal').addEventListener('click', (e) => {
        if (e.target.id === 'home-confirmation-modal') {
            document.getElementById('home-confirmation-modal').classList.add('hidden');
            window.homeConfirmCallback = null;
        }
    });
    
    // Battle screen
    document.getElementById('btn-speed-toggle').addEventListener('click', () => {
        const speed = game.toggleSpeed();
        document.getElementById('btn-speed-toggle').textContent = `${speed}x`;
    });
    
    document.getElementById('btn-abandon').addEventListener('click', () => {
        // Pause battle and show confirmation
        game.battleActive = false;
        cancelAnimationFrame(animationFrame);
        document.getElementById('abandon-modal').classList.remove('hidden');
    });
    
    document.getElementById('btn-abandon-confirm').addEventListener('click', () => {
        // Hide modal
        document.getElementById('abandon-modal').classList.add('hidden');
        // Force end battle properly
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        game.battleActive = false;
        // Go to result screen
        showScreen('result');
    });
    
    document.getElementById('btn-abandon-cancel').addEventListener('click', () => {
        // Hide modal and resume battle
        document.getElementById('abandon-modal').classList.add('hidden');
        game.battleActive = true;
        game.lastFrameTime = performance.now();
        battleLoop();
    });
    
    // Result screen
    document.getElementById('btn-restart').addEventListener('click', () => {
        game.resetRun();
        showScreen('relic'); // Start with relic selection first
    });
    
    document.getElementById('btn-back-menu').addEventListener('click', () => {
        showScreen('menu');
    });
    
    // Resize canvas on window resize
    window.addEventListener('resize', () => {
        if (currentScreen === 'battle') {
            resizeCanvas();
            renderBattle();
            renderBattleUI();
        }
    });
}

// ========================================
// PWA SETUP
// ========================================

function setupPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
    
    // Install prompt
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install prompt
        const prompt = document.getElementById('install-prompt');
        prompt.classList.remove('hidden');
        
        document.getElementById('btn-install').addEventListener('click', async () => {
            prompt.classList.add('hidden');
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Install outcome: ${outcome}`);
            deferredPrompt = null;
        });
        
        document.getElementById('btn-dismiss').addEventListener('click', () => {
            prompt.classList.add('hidden');
        });
    });
}

// ========================================
// UTILITIES
// ========================================

function capitalize(str) {
    const map = {
        'easy': 'Easy',
        'normal': 'Normal',
        'hard': 'Hard'
    };
    return map[str] || str;
}

