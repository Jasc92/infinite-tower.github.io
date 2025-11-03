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
    
    // Setup canvas
    game.canvas = document.getElementById('battle-canvas');
    game.ctx = game.canvas.getContext('2d');
    
    // Load sprites
    loadSprites();
    
    // Show menu screen
    showScreen('menu');
}

function loadSprites() {
    // Hero sprite
    game.sprites.hero = new Image();
    game.sprites.hero.src = 'assets/hero.png';
    
    // Enemy sprite
    game.sprites.enemy = new Image();
    game.sprites.enemy.src = 'assets/enemy.png';
    
    // Background
    game.sprites.background = new Image();
    game.sprites.background.src = 'assets/background.png';
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
                <p>ATK: ${run.build.atk} | SPD: ${run.build.atkSpd} | CRT: ${Math.round(run.build.crit * 100)}%</p>
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
    
    // Take snapshot if we haven't yet
    if (!game.baseStatsSnapshot) {
        game.snapshotBaseStats();
    }
    
    document.getElementById('points-available').textContent = game.availablePoints;
    
    // Update stat displays
    updateStatDisplay('attackSpeed', game.player.attackSpeed.toFixed(1), game.player.attackSpeed >= 5.0);
    updateStatDisplay('attack', game.player.attack, false);
    updateStatDisplay('crit', Math.round(game.player.critChance * 100), game.player.critChance >= 0.75);
    updateStatDisplay('evasion', Math.round(game.player.evasion * 100), game.player.evasion >= 0.35);
    updateStatDisplay('defense', game.player.defense, false);
    updateStatDisplay('hp', game.player.maxHp, false);
    
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

function updateStatDisplay(stat, value, isMax) {
    const el = document.getElementById(`stat-${stat}`);
    if (el) el.textContent = value;
    
    const maxEl = el.parentElement.querySelector('.stat-max');
    if (maxEl) {
        maxEl.textContent = isMax ? '(MAX)' : '';
    }
    
    // Update plus button state
    const plusBtn = document.querySelector(`.btn-stat-plus[data-stat="${stat}"]`);
    if (plusBtn) {
        plusBtn.disabled = isMax || game.availablePoints === 0;
    }
    
    // Update minus button state - only enable if we have points to remove
    const minusBtn = document.querySelector(`.btn-stat-minus[data-stat="${stat}"]`);
    if (minusBtn && game.baseStatsSnapshot) {
        let canRemove = false;
        switch (stat) {
            case 'attackSpeed':
                canRemove = game.player.attackSpeed > game.baseStatsSnapshot.attackSpeed;
                break;
            case 'attack':
                canRemove = game.player.attack > game.baseStatsSnapshot.attack;
                break;
            case 'crit':
                canRemove = game.player.critChance > game.baseStatsSnapshot.critChance;
                break;
            case 'evasion':
                canRemove = game.player.evasion > game.baseStatsSnapshot.evasion;
                break;
            case 'defense':
                canRemove = game.player.defense > game.baseStatsSnapshot.defense;
                break;
            case 'hp':
                canRemove = game.player.maxHp > game.baseStatsSnapshot.maxHp;
                break;
        }
        minusBtn.disabled = !canRemove;
    }
}

function allocateStatPoint(statType) {
    if (game.availablePoints > 0) {
        const canAllocate = checkStatCap(statType);
        if (canAllocate) {
            game.applyStatPoint(statType);
            game.availablePoints--;
            updateStatsScreen();
        }
    }
}

function removeStatPoint(statType) {
    const removed = game.removeStatPoint(statType);
    if (removed) {
        game.availablePoints++;
        updateStatsScreen();
    }
}

function checkStatCap(statType) {
    switch (statType) {
        case 'attackSpeed': return game.player.attackSpeed < 5.0;
        case 'crit': return game.player.critChance < 0.75;
        case 'evasion': return game.player.evasion < 0.35;
        default: return true;
    }
}

// ========================================
// BATTLE SCREEN
// ========================================

function startBattleScreen() {
    // Setup canvas size
    resizeCanvas();
    
    // Update UI
    document.getElementById('current-floor').textContent = game.currentFloor;
    document.getElementById('archetype-name').textContent = game.enemyGen.getArchetypeName(game.currentArchetype);
    document.getElementById('btn-speed-toggle').textContent = `${game.battleSpeed}x`;
    
    // Start battle
    game.startBattle();
    updateBattleUI();
    
    // Start animation loop
    if (animationFrame) cancelAnimationFrame(animationFrame);
    battleLoop();
}

function battleLoop() {
    const result = game.updateBattle(performance.now());
    
    updateBattleUI();
    renderBattle();
    
    if (result === 'win') {
        handleBattleWin();
    } else if (result === 'loss') {
        handleBattleLoss();
    } else {
        animationFrame = requestAnimationFrame(battleLoop);
    }
}

function updateBattleUI() {
    // Player stats
    document.getElementById('player-hp-current').textContent = Math.max(0, Math.round(game.player.currentHp));
    document.getElementById('player-hp-max').textContent = game.player.maxHp;
    document.getElementById('player-hp-fill').style.width = `${(game.player.currentHp / game.player.maxHp) * 100}%`;
    document.getElementById('player-atk').textContent = game.player.attack;
    document.getElementById('player-spd').textContent = game.player.attackSpeed.toFixed(1);
    document.getElementById('player-crt').textContent = Math.round(game.player.critChance * 100);
    document.getElementById('player-def').textContent = game.player.defense;
    document.getElementById('player-eva').textContent = Math.round(game.player.evasion * 100);
    
    // Enemy stats
    if (game.enemy) {
        document.getElementById('enemy-hp-current').textContent = Math.max(0, Math.round(game.enemy.currentHp));
        document.getElementById('enemy-hp-max').textContent = game.enemy.maxHp;
        document.getElementById('enemy-hp-fill').style.width = `${(game.enemy.currentHp / game.enemy.maxHp) * 100}%`;
        document.getElementById('enemy-atk').textContent = game.enemy.attack;
        document.getElementById('enemy-spd').textContent = game.enemy.attackSpeed.toFixed(1);
        document.getElementById('enemy-crt').textContent = Math.round(game.enemy.critChance * 100);
        document.getElementById('enemy-def').textContent = game.enemy.defense;
        document.getElementById('enemy-eva').textContent = Math.round(game.enemy.evasion * 100);
    }
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
    
    // Draw hero (centered, sin escalar - usa tamaño original)
    if (game.sprites.hero.complete) {
        const heroW = game.sprites.hero.width;
        const heroH = game.sprites.hero.height;
        const heroX = heroXPos - heroW / 2;
        const heroY = verticalCenter - heroH / 2;
        ctx.drawImage(game.sprites.hero, heroX, heroY, heroW, heroH);
    }
    
    // Draw enemy (centered, sin escalar - usa tamaño original)
    if (game.sprites.enemy.complete) {
        const enemyW = game.sprites.enemy.width;
        const enemyH = game.sprites.enemy.height;
        const enemyX = enemyXPos - enemyW / 2;
        const enemyY = verticalCenter - enemyH / 2;
        ctx.drawImage(game.sprites.enemy, enemyX, enemyY, enemyW, enemyH);
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
            if (floatText.isMiss) {
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
    
    const needsStats = game.nextFloor();
    
    if (needsStats) {
        // Every 5 floors: stat allocation
        setTimeout(() => showScreen('stats'), 500);
    } else {
        // Continue to next floor
        setTimeout(() => startBattleScreen(), 500);
    }
}

function handleBattleLoss() {
    cancelAnimationFrame(animationFrame);
    setTimeout(() => showScreen('result'), 1000);
}

function resizeCanvas() {
    const canvas = game.canvas;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// ========================================
// RESULT SCREEN
// ========================================

function updateResultScreen() {
    const floor = game.currentFloor;
    const duration = game.getRunDuration();
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
    document.getElementById('final-build-stats').innerHTML = `
        <div>Attack: ${build.atk}</div>
        <div>Attack Speed: ${build.atkSpd}/s</div>
        <div>Critical: ${Math.round(build.crit * 100)}%</div>
        <div>Evasion: ${Math.round(build.evade * 100)}%</div>
        <div>Defense: ${build.def}</div>
        <div>HP: ${build.hp}</div>
    `;
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Menu screen
    document.getElementById('btn-play').addEventListener('click', () => {
        game.resetRun();
        showScreen('stats');
    });
    
    document.getElementById('btn-how-to-play').addEventListener('click', () => {
        const panel = document.getElementById('how-to-play-panel');
        panel.classList.toggle('hidden');
        // Close other panels
        document.getElementById('top-runs-panel').classList.add('hidden');
    });
    
    document.getElementById('btn-top-runs').addEventListener('click', () => {
        const panel = document.getElementById('top-runs-panel');
        panel.classList.toggle('hidden');
        updateTopRunsDisplay();
        // Close other panels
        document.getElementById('how-to-play-panel').classList.add('hidden');
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
        showScreen('battle');
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
        showScreen('stats');
    });
    
    document.getElementById('btn-back-menu').addEventListener('click', () => {
        showScreen('menu');
    });
    
    // Resize canvas on window resize
    window.addEventListener('resize', () => {
        if (currentScreen === 'battle') {
            resizeCanvas();
            renderBattle();
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

