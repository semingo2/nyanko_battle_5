let money = 0, workerLv = 1, cannonCharge = 0, gameActive = false, gameTime = 0;
let playerHP = 2000, enemyHP = 2000, currentStage = null;
const playerUnits = [], enemyUnits = [], cooldowns = {};
let nekokan = 1000, ownedCats = { 'normal': 1 }, currentDeck = [];let unlockedStages = [0]; // 初期状態で最初のステージのみ解放const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches || ('ontouchstart' in window);

function loadGameData() {
    const savedN = localStorage.getItem('nekokan');
    nekokan = savedN ? parseInt(savedN) : 1000;
    const savedC = localStorage.getItem('ownedCats');
    if (savedC) {
        const parsed = JSON.parse(savedC);
        ownedCats = {};
        // 互換性: 古い形式（数値）から新しい形式（オブジェクト）に変換
        for (const [catId, data] of Object.entries(parsed)) {
            if (typeof data === 'number') {
                ownedCats[catId] = { lv: data, exp: 0 };
            } else if (typeof data === 'object' && data !== null) {
                // 既に新しい形式
                ownedCats[catId] = data;
            }
        }
    } else {
        ownedCats = { 'normal': { lv: 1, exp: 0 } };
    }
    const savedD = localStorage.getItem('currentDeck');
    currentDeck = savedD ? JSON.parse(savedD) : DEFAULT_DECK.slice();
    const savedS = localStorage.getItem('unlockedStages');
    unlockedStages = savedS ? JSON.parse(savedS) : [0];
    
    console.log('[DEBUG] loadGameData - ownedCats:', ownedCats);
    console.log('[DEBUG] loadGameData - unlockedStages:', unlockedStages);
    
    document.getElementById('nekokan-val').innerText = nekokan;
}

function saveDeck() {
    localStorage.setItem('currentDeck', JSON.stringify(currentDeck));
}

function resizeApp() {
    const app = document.getElementById('app');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // スマホ版: スケーリングなし（100%で画面全体使用）
        app.style.transform = 'scale(1)';
    } else {
        // PC版: 既存のスケーリングロジック
        const scale = Math.min(window.innerWidth / 1000, window.innerHeight / 720, 1);
        app.style.transform = `scale(${scale})`;
    }
}

function showStageSelect() {
    loadGameData(); // 最新のアンロック状態を読み込む
    document.getElementById('common-header').style.display = 'block';
    document.getElementById('home-menu').style.display = 'none';
    document.getElementById('stage-menu').style.display = 'flex';
    const container = document.getElementById('stage-list-container');
    container.innerHTML = '';
    STAGE_DATA.forEach(stage => {
        const isUnlocked = unlockedStages.includes(stage.id);
        const btn = document.createElement('div');
        btn.className = isUnlocked 
            ? 'w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded border-b-4 border-gray-900 active:border-b-0 active:translate-y-1 mb-2 cursor-pointer flex justify-between items-center transition-all'
            : 'w-full bg-gray-600 text-gray-400 font-bold py-3 px-4 rounded border-b-4 border-gray-700 mb-2 flex justify-between items-center cursor-not-allowed opacity-60';
        if (isUnlocked) {
            btn.onclick = () => initBattle(stage.id);
            btn.innerHTML = `<span>${stage.name}</span><span class="text-yellow-400 font-bold">出撃 ▶</span>`;
        } else {
            btn.innerHTML = `<span>${stage.name}</span><span class="text-gray-500 font-bold">🔒 未開放</span>`;
        }
        container.appendChild(btn);
    });
}

function showHome() {
    document.getElementById('common-header').style.display = 'block';
    document.getElementById('start-overlay').style.display = 'flex';
    document.getElementById('home-menu').style.display = 'flex';
    document.getElementById('stage-menu').style.display = 'none';
    document.getElementById('deck-menu').style.display = 'none';
    document.getElementById('result-overlay').style.display = 'none';
}

function showDeckEdit() {
    // ガチャ後の最新所持状況を編成画面に反映
    loadGameData();
    document.getElementById('common-header').style.display = 'block';
    document.getElementById('home-menu').style.display = 'none';
    document.getElementById('deck-menu').style.display = 'flex';
    
    // グローバルな編成配列を毎回再構築して表示を同期
    window.deck = new Array(10).fill(null);
    const ownedDeck = currentDeck.filter(catId => ownedCats[catId]);
    ownedDeck.forEach((catId, idx) => {
        if (idx < 10) window.deck[idx] = catId;
    });
    selectedSlotIndex = null;
    selectedCatId = null;
    
    renderDeck();
    renderCats();
}

function hideDeckEdit() {
    showHome();
}

// ===== ドラッグ&ドロップ機能 =====

let draggedCatId = null;
let draggedSlotIndex = null;
let selectedSlotIndex = null;
let selectedCatId = null;

function placeCatInSlot(catId, targetSlotIndex) {
    const prevIndex = window.deck.indexOf(catId);
    if (prevIndex === targetSlotIndex) return;
    if (prevIndex !== -1) window.deck[prevIndex] = null;
    window.deck[targetSlotIndex] = catId;
}

function handleSlotTap(slotIndex) {
    if (!isTouchDevice) return;

    if (selectedCatId) {
        placeCatInSlot(selectedCatId, slotIndex);
        selectedCatId = null;
        selectedSlotIndex = null;
        renderDeck();
        renderCats();
        return;
    }

    if (selectedSlotIndex === null) {
        selectedSlotIndex = slotIndex;
    } else {
        const temp = window.deck[selectedSlotIndex];
        window.deck[selectedSlotIndex] = window.deck[slotIndex];
        window.deck[slotIndex] = temp;
        selectedSlotIndex = null;
    }

    renderDeck();
}

function handleCatTap(catId) {
    if (!isTouchDevice) return;

    if (selectedSlotIndex !== null) {
        placeCatInSlot(catId, selectedSlotIndex);
        selectedSlotIndex = null;
        selectedCatId = null;
        renderDeck();
        renderCats();
        return;
    }

    const emptyIdx = window.deck.indexOf(null);
    if (emptyIdx !== -1) {
        placeCatInSlot(catId, emptyIdx);
        selectedCatId = null;
        renderDeck();
        renderCats();
        return;
    }

    selectedCatId = (selectedCatId === catId) ? null : catId;
    renderCats();
}

function renderDeck() {
    const deckEl = document.getElementById('deck');
    deckEl.innerHTML = '';
    
    for (let i = 0; i < 10; i++) {
        const slot = document.createElement('div');
        slot.className = 'formation-slot';
        slot.id = `slot-${i}`;
        slot.dataset.slotIndex = i;
        
        const catId = window.deck[i];
        if (catId) {
            const cat = CATS.find(c => c.id === catId);
            const catData = ownedCats[catId];
            const lv = catData ? catData.lv : 1;
            if (cat) {
                const img = document.createElement('img');
                img.src = cat.img;
                img.alt = cat.name;
                img.className = 'formation-slot-img';
                slot.appendChild(img);
                
                const lvTag = document.createElement('div');
                lvTag.className = 'formation-slot-lv';
                lvTag.textContent = `Lv.${lv}`;
                slot.appendChild(lvTag);
                
                slot.dataset.catId = catId;
            }
        } else {
            slot.classList.add('empty');
        }
        
        slot.addEventListener('click', () => handleSlotClick(i));
        deckEl.appendChild(slot);
    }
}

function renderCats() {
    const catListEl = document.getElementById('cat-list');
    catListEl.innerHTML = '';
    
    CATS.forEach(cat => {
        if (!ownedCats[cat.id]) return;
        
        const catData = ownedCats[cat.id];
        const lv = catData.lv || 1;
        
        const card = document.createElement('div');
        card.className = 'formation-list-item';
        card.dataset.catId = cat.id;
        
        if (selectedCatId === cat.id) {
            card.classList.add('selected');
        }
        
        const img = document.createElement('img');
        img.src = cat.img;
        img.alt = cat.name;
        card.appendChild(img);
        
        const cost = document.createElement('div');
        cost.className = 'formation-list-item-cost';
        cost.textContent = `${cat.cost}円`;
        card.appendChild(cost);
        
        card.addEventListener('click', () => handleCatSelect(cat.id, cat));
        catListEl.appendChild(card);
    });
}

function handleSlotClick(slotIndex) {
    // 選択キャラがいれば、スロットに配置
    if (selectedCatId) {
        placeCatInSlot(selectedCatId, slotIndex);
        selectedCatId = null;
        renderDeck();
        renderCats();
        return;
    }
    
    // それ以外は何もしない（本家のようにキャラ選択の後に配置）
}

function handleCatSelect(catId, cat) {
    selectedCatId = (selectedCatId === catId) ? null : catId;
    renderCats();
    
    if (selectedCatId) {
        updateDetailCard(cat);
    } else {
        const detailCard = document.getElementById('detail-card');
        detailCard.innerHTML = '<div class="detail-empty">キャラクターを選択してください</div>';
    }
}

function updateDetailCard(cat) {
    const detailCard = document.getElementById('detail-card');
    const catData = ownedCats[cat.id];
    const lv = catData ? catData.lv : 1;
    const cost = cat.cost;
    
    detailCard.innerHTML = `
        <div class="detail-content">
            <img src="${cat.img}" alt="${cat.name}" class="detail-img">
            <div class="detail-name">${cat.name}</div>
            <div class="detail-info">
                <div class="detail-row">
                    <span class="detail-label">Lv.</span>
                    <span class="detail-value">${lv}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">生産コスト</span>
                    <span class="detail-value">${cost}円</span>
                </div>
            </div>
        </div>
    `;
}

function placeCatInSlot(catId, targetSlotIndex) {
    const prevIndex = window.deck.indexOf(catId);
    if (prevIndex === targetSlotIndex) return;
    if (prevIndex !== -1) window.deck[prevIndex] = null;
    window.deck[targetSlotIndex] = catId;
}

function confirmDeck() {
    currentDeck = window.deck.filter(id => id !== null);
    
    if (currentDeck.length === 0) {
        alert('最低1体は編成してください');
        return;
    }
    
    saveDeck();
    showHome();
    showStageSelect();
}

function initBattle(stageId) {
    loadGameData();
    currentStage = JSON.parse(JSON.stringify(STAGE_DATA[stageId]));
    document.getElementById('common-header').style.display = 'none';
    document.getElementById('start-overlay').style.display = 'none';
    document.getElementById('battle-ui').style.display = 'flex';
    document.getElementById('game-container').style.background = currentStage.bg;
    enemyHP = currentStage.enemyBaseHp; playerHP = 2000; money = 0; workerLv = 1; gameTime = 0;
    playerUnits.length = 0; enemyUnits.length = 0;
    
    // バトルのたびにクールタイムをリセット
    CATS.forEach(cat => cooldowns[cat.id] = 0);

    document.getElementById('p-hp-text').innerText = `${playerHP} / 2000`;
    document.getElementById('e-hp-text').innerText = `${enemyHP} / ${currentStage.enemyBaseHp}`;
    
    document.querySelectorAll('.unit, .damage-pop').forEach(el => el.remove());
    gameActive = true;
    initDeckUI();
    updateLoop();
}

function updateLoop() {
    if (!gameActive) return;
    gameTime += 16;
    let maxM = 1000 + (workerLv * 1000);
    money = Math.min(maxM, money + (0.2 + workerLv * 0.3));
    document.getElementById('money').innerText = Math.floor(money);
    document.getElementById('max-m').innerText = maxM;
    const lvEl = document.getElementById('w-lv');
    if (lvEl) lvEl.innerText = workerLv;
    const costEl = document.getElementById('w-cost');
    if (costEl) costEl.innerText = workerLv < 8 ? `¥${workerLv * 250}` : "MAX";

    cannonCharge = Math.min(100, cannonCharge + 0.05);
    document.getElementById('cannon-fill').style.height = cannonCharge + "%";

    currentStage.schedule.forEach((task, i) => {
        if (task[0] === Math.floor(gameTime / 1000)) { createUnit(ENEMIES[task[1]], 'enemy'); currentStage.schedule.splice(i, 1); }
    });
    if (gameTime % 5000 < 16) {
        const p = currentStage.repeatSpawn;
        createUnit(ENEMIES[p[Math.floor(Math.random() * p.length)]], 'enemy');
    }

    // ★重要：ボタンの状態更新とクールタイムの減算
    CATS.forEach(cat => {
        if (!ownedCats[cat.id]) return;
        const btn = document.getElementById(`slot-${cat.id}`);
        const mask = document.getElementById(`mask-${cat.id}`);
        
        if (cooldowns[cat.id] > 0) {
            // 0以下にならないように制限して減算
            cooldowns[cat.id] = Math.max(0, cooldowns[cat.id] - 16);
            if (mask) mask.style.height = (cooldowns[cat.id] / cat.cd * 100) + "%";
        }
        
        if (btn) {
            // クールタイムが0以下、かつお金があれば有効化
            btn.disabled = (money < cat.cost || cooldowns[cat.id] > 0);
        }
    });

    moveAndAttack(playerUnits, enemyUnits, 'player');
    moveAndAttack(enemyUnits, playerUnits, 'enemy');

    document.getElementById('p-hp-bar').style.width = (playerHP / 2000 * 100) + "%";
    document.getElementById('e-hp-bar').style.width = Math.max(0, (enemyHP / currentStage.enemyBaseHp * 100)) + "%";
    document.getElementById('p-hp-text').innerText = `${Math.max(0, Math.floor(playerHP))} / 2000`;
    document.getElementById('e-hp-text').innerText = `${Math.max(0, Math.floor(enemyHP))} / ${currentStage.enemyBaseHp}`;

    if (enemyHP <= 0) endGame("勝利！ネコ缶+150", 150);
    else if (playerHP <= 0) endGame("敗北...", 0);
    else requestAnimationFrame(updateLoop);
}

function moveAndAttack(units, targets, side) {
    const enemyBase = document.getElementById('enemy-base');
    const playerBase = document.getElementById('player-base');
    const enemyBaseRight = enemyBase.offsetLeft + enemyBase.offsetWidth;
    const playerBaseLeft = playerBase.offsetLeft;
    const unitWidth = 80;

    for (let i = units.length - 1; i >= 0; i--) {
        const u = units[i];
        if (u.hp <= 0) { if (side === 'enemy') money += u.data.reward; u.el.remove(); units.splice(i, 1); continue; }
        if (u.kb > 0) { u.kb--; u.x += (side === 'player' ? 3 : -3); u.el.style.left = u.x + 'px'; continue; }
        let target = null;
        // すり抜け防止: 敵ユニットはユニットの右端(u.x+unitWidth)で城との距離を判定する
        if (side === 'player' && u.x <= enemyBaseRight + u.data.range) target = 'base';
        else if (side === 'enemy' && (u.x + unitWidth) >= playerBaseLeft - u.data.range) target = 'base';
        if (!target) target = targets.find(t => side === 'player' ? (u.x - t.x <= u.data.range && u.x > t.x) : (t.x - u.x <= u.data.range && t.x > u.x));
        
        if (target) {
            u.atkFrame = (u.atkFrame || 0) + 1;
            if (u.atkFrame >= 60) {
                if (target === 'base') { if (side === 'player') enemyHP -= u.atk; else playerHP -= u.atk; screenShake(side === 'player' ? 'enemy-base' : 'player-base'); }
                else { if (u.data.area) targets.forEach(t => { if (Math.abs(t.x - u.x) <= u.data.range + 50) applyDamage(t, u.atk); }); else applyDamage(target, u.atk); }
                u.atkFrame = 0;
            }
        } else {
            u.x += u.data.speed * (side === 'player' ? -1 : 1);
            // すり抜け防止: 城の境界を越えないようにクランプ
            if (side === 'player') u.x = Math.max(u.x, enemyBaseRight);
            else u.x = Math.min(u.x, playerBaseLeft - unitWidth);
            u.el.style.left = u.x + 'px';
        }
    }
}

function applyDamage(target, dmg) {
    target.hp -= dmg; popText(target.x, target.el.offsetTop, Math.floor(dmg));
    if (dmg > target.maxHp * 0.15) target.kb = 10;
}

function createUnit(data, side) {
    const el = document.createElement('div');
    el.className = 'unit';
    el.style.backgroundImage = `url('${data.img}')`;
    el.style.setProperty('--unit-scale', data.scale);
    el.style.transform = 'scale(var(--unit-scale))';
    el.style.bottom = (data.bottom || 40) + 'px';
    
    const unitWidth = 80;
    const enemyBase = document.getElementById('enemy-base');
    const playerBase = document.getElementById('player-base');
    // 城の中央付近からスポーン（城z-index=20 > ユニットz-index=15 のため城の裏に隠れて出てくる演出になる）
    const startX = side === 'player'
        ? playerBase.offsetLeft + Math.floor(playerBase.offsetWidth / 2) - Math.floor(unitWidth / 2)
        : enemyBase.offsetLeft + Math.floor(enemyBase.offsetWidth / 2) - Math.floor(unitWidth / 2);
    const catData = side === 'player' ? ownedCats[data.id] : null;
    const lv = side === 'player' && catData ? catData.lv : 1;
    const mult = 1 + (lv - 1) * 0.1;
    const obj = { el, data, side, hp: data.hp * mult, maxHp: data.hp * mult, atk: data.atk * mult, x: startX, kb: 0 };
    el.style.left = startX + 'px';
    document.getElementById('game-container').appendChild(el);
    (side === 'player' ? playerUnits : enemyUnits).push(obj);
}

function upgradeWorker() { let c = workerLv * 250; if (money >= c && workerLv < 8) { money -= c; workerLv++; } }
function fireCannon() { if (cannonCharge < 100) return; cannonCharge = 0; screenShake('game-container'); enemyUnits.forEach(u => { applyDamage(u, 500); u.kb = 30; }); }
function popText(x, y, txt) { const t = document.createElement('div'); t.className = 'damage-pop'; t.innerText = txt; t.style.left = x + 'px'; t.style.top = y + 'px'; document.getElementById('game-container').appendChild(t); setTimeout(() => t.remove(), 600); }
function screenShake(id) { const el = document.getElementById(id); if (el) { el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 200); } }
function endGame(msg, reward) { 
    gameActive = false;
    
    // 勝利時のリワード処理
    let xpReward = 0;
    if (reward > 0) {
        nekokan += reward;
        localStorage.setItem('nekokan', nekokan);
        // ステージ難易度に応じたXP報酬
        const difficulty = currentStage.id;
        xpReward = 50 + (difficulty * 30); // 難易度が高いほどXPが多い
        
        // 次のステージを解放
        if (currentStage.id + 1 < STAGE_DATA.length) {
            if (!unlockedStages.includes(currentStage.id + 1)) {
                unlockedStages.push(currentStage.id + 1);
                localStorage.setItem('unlockedStages', JSON.stringify(unlockedStages));
            }
        }
        
        // 編成キャラにXP配布
        currentDeck.forEach(catId => {
            if (ownedCats[catId]) {
                processLevelUp(catId, xpReward);
            }
        });
    }
    
    // リザルト画面を表示
    showResultScreen({
        isVictory: reward > 0,
        stageId: currentStage.id,
        stageName: currentStage.name,
        nekokanReward: reward,
        xpReward: xpReward
    });
}

// ===== 戦闘画面のデッキUI =====

function initDeckUI() {
    const grid = document.getElementById('deck-grid');
    grid.innerHTML = '';
    currentDeck.forEach(catId => {
        const cat = CATS.find(c => c.id === catId);
        if (!cat || !ownedCats[cat.id]) return;
        const catData = ownedCats[cat.id];
        const lv = catData.lv || 1;
        const btn = document.createElement('button');
        btn.className = 'relative bg-gray-700 border-2 border-gray-500 hover:border-yellow-400 rounded w-full h-full cursor-pointer overflow-hidden text-white transition-colors'; 
        btn.id = `slot-${cat.id}`;
        btn.onclick = () => { 
            // クールタイムが完全に0以下の場合のみ出撃
            if (money >= cat.cost && cooldowns[cat.id] <= 0) { 
                money -= cat.cost; 
                cooldowns[cat.id] = cat.cd; 
                createUnit(cat, 'player'); 
            } 
        };
        btn.innerHTML = `
            <div class="unit-level-tag absolute top-1 left-1 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded z-10">Lv.${lv}</div>
            <div class="w-full h-4/5 flex items-center justify-center" style="background:url('${cat.img}') center/contain no-repeat;transform:scale(${cat.scale});"></div>
            <div class="unit-cost-tag absolute bottom-0 w-full bg-black bg-opacity-80 text-xs md:text-sm font-bold text-center py-0.5">¥${cat.cost}</div>
            <div class="cd-mask absolute bottom-0 w-full bg-black bg-opacity-60 pointer-events-none" id="mask-${cat.id}" style="height:0%;"></div>
        `;
        grid.appendChild(btn);
    });
}

window.onload = () => { loadGameData(); resizeApp(); window.addEventListener('resize', resizeApp); };

// ===== レベルアップシステム =====

const MAX_LEVEL = 30;
const LEVEL_UP_RANGES = [100, 150, 200, 250, 300, 350, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 2000, 2400, 2800, 3500];

function getMaxExpForLevel(lv) {
    if (lv > LEVEL_UP_RANGES.length) return LEVEL_UP_RANGES[LEVEL_UP_RANGES.length - 1];
    return LEVEL_UP_RANGES[lv - 1] || 100;
}

function processLevelUp(catId, xpGain) {
    const cat = ownedCats[catId];
    if (!cat) return;
    
    cat.exp = (cat.exp || 0) + xpGain;
    
    while (cat.lv < MAX_LEVEL && cat.exp >= getMaxExpForLevel(cat.lv)) {
        cat.exp -= getMaxExpForLevel(cat.lv);
        cat.lv++;
    }
    
    localStorage.setItem('ownedCats', JSON.stringify(ownedCats));
}

function showResultScreen(result) {
    document.getElementById('battle-ui').style.display = 'none';
    document.getElementById('result-overlay').style.display = 'flex';
    
    const resultContent = document.getElementById('result-content');
    const isVictory = result.isVictory;
    
    // 次のステージ解放チェック
    let nextStageText = '';
    if (isVictory && result.stageId < STAGE_DATA.length - 1) {
        const nextStage = STAGE_DATA[result.stageId + 1];
        nextStageText = `<p class="result-next-stage">{{ nextStage.name }}が解放されました</p>`.replace('{{ nextStage.name }}', nextStage.name);
    }
    
    resultContent.innerHTML = `
        <div class="result-inner">
            ${isVictory 
                ? '<div class="victory-badge">VICTORY</div>' 
                : '<div class="defeat-badge">DEFEAT</div>'}
            <h2 class="result-title">${result.stageName}</h2>
            
            ${isVictory ? `
                <div class="reward-section">
                    <div class="reward-item">
                        <span class="reward-label">ネコ缶</span>
                        <span class="reward-value">+${result.nekokanReward}</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-label">経験値</span>
                        <span class="reward-value">+${result.xpReward}</span>
                    </div>
                </div>
                ${nextStageText}
            ` : `<p class="result-message">また挑戦しましょう</p>`}
            
            <div class="result-buttons">
                <button class="result-btn btn-home" onclick="showHome()">ホームへ戻る</button>
            </div>
        </div>
    `;
}