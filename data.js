const CATS = [
    { id: 'normal', name: 'ねこ', cost: 50, hp: 110, atk: 18, speed: 2.2, range: 45, cd: 2000, area: false, img: 'normal.png', scale: 0.8, bottom: 30 },
    { id: 'wall', name: 'かべ', cost: 150, hp: 1000, atk: 5, speed: 1.4, range: 30, cd: 4000, area: false, img: 'wall.png', scale: 1.35, bottom: 40 },
    { id: 'battle', name: 'バトル', cost: 200, hp: 300, atk: 50, speed: 2.5, range: 50, cd: 5000, area: false, img: 'battle.png', scale: 1.35, bottom: 40 },
    { id: 'kimo', name: 'キモ', cost: 400, hp: 450, atk: 110, speed: 1.2, range: 250, cd: 8000, area: false, img: 'kimo.png', scale: 1.65, bottom: 40 },
    { id: 'giraffe', name: '牛', cost: 500, hp: 400, atk: 35, speed: 5.5, range: 40, cd: 6000, area: false, img: 'giraffe.png', scale: 1.5, bottom: 40 },
    { id: 'bird', name: 'とり', cost: 650, hp: 250, atk: 160, speed: 1.8, range: 180, cd: 12000, area: true, img: 'bird.png', scale: 1.35, bottom: 80 },
    { id: 'fish', name: 'さかな', cost: 800, hp: 800, atk: 220, speed: 2.0, range: 60, cd: 15000, area: false, img: 'fish.png', scale: 1.35, bottom: 40 },
    { id: 'tokage', name: 'トカゲ', cost: 1000, hp: 700, atk: 380, speed: 1.5, range: 100, cd: 18000, area: false, img: 'tokage.png', scale: 1.5, bottom: 40 },
    { id: 'gian', name: '巨人', cost: 1300, hp: 2000, atk: 450, speed: 1.0, range: 70, cd: 25000, area: true, img: 'gian.png', scale: 1.8, bottom: 40 },
    { id: 'hopping', name: 'ホッピング', cost: 350, hp: 600, atk: 120, speed: 3.5, range: 140, cd: 7000, area: false, img: 'hopping.png', scale: 1.35, bottom: 40 },
    { id: 'ruga1', name: 'ネコルガ', cost: 3000, hp: 4500, atk: 1000, speed: 0.8, range: 50, cd: 40000, area: true, img: 'ruga1.png', scale: 2.1, bottom: 40 },
    { id: 'shirasu', name: 'ラスボース', cost: 4500, hp: 9000, atk: 3500, speed: 1.2, range: 50, cd: 60000, area: true, img: 'shirasu.png', scale: 2.5, bottom: 100 }
];

const ENEMIES = {
    dog:  { name: 'わんこ', hp: 90,  atk: 12,  speed: 1.8, range: 40, reward: 30, img: 'dog.png', scale: 1.2, bottom: 25 },
    snk:  { name: 'にょろ', hp: 60,  atk: 6,   speed: 3.5, range: 35, reward: 20, img: 'snk.png', scale: 1.05, bottom: 35 },
    pig:  { name: 'メェメェ', hp: 500, atk: 40, speed: 1.5, range: 50, reward: 150, img: 'pig.png', scale: 2, bottom: 40 },
    hippo:{ name: 'カバちゃん', hp: 1800, atk: 90, speed: 1.0, range: 60, reward: 400, img: 'hippo.png', scale: 1.7, bottom: 30 },
    gori: { name: 'ゴリさん', hp: 4500, atk: 160, speed: 2.2, range: 55, reward: 650, img: 'gori.png', scale: 1.6, bottom: 30 },
    seal: { name: 'アザラシ', hp: 200, atk: 10, speed: 1.2, range: 55, reward: 1000, img: 'seal.png', scale: 1.6, bottom: 33 }
};

const STAGE_DATA = [
    { id: 0, name: "第1章：長崎県", enemyBaseHp: 2000, bg: "#4facfe", schedule: [[5, 'dog'], [12, 'dog']], repeatSpawn: ['dog', 'snk'], difficulty: "★" },
    { id: 1, name: "第1章：佐賀県", enemyBaseHp: 5500, bg: "#ff9a9e", schedule: [[5, 'pig'], [20, 'hippo']], repeatSpawn: ['dog', 'pig'], difficulty: "★★" },
    { id: 2, name: "第1章：福岡県", enemyBaseHp: 12000, bg: "#6a11cb", schedule: [[2, 'snk'], [10, 'gori']], repeatSpawn: ['hippo', 'gori'], difficulty: "★★★" },
    { id: 3, name: "第1章：東京都", enemyBaseHp: 120, bg: "#f8ef00", schedule: [[2, 'snk'], [10, 'seal']], repeatSpawn: ['seal', 'seal'], difficulty: "☆" },
    { id: 4, name: "第1章：大阪府", enemyBaseHp: 120, bg: "#f87800", schedule: [[2, 'pig'], [10, 'gori']], repeatSpawn: ['gori', 'seal'], difficulty: "★★" },
    { id: 5, name: "第1章：北海道", enemyBaseHp: 20000, bg: "#11cb9c", schedule: [[5, 'dog'], [10, 'gori']], repeatSpawn: ['hippo', 'gori'], difficulty: "★★★★★" }
];

// 編成設定：最大10体まで選択
const MAX_DECK_SIZE = 10;
const DEFAULT_DECK = ['normal', 'wall', 'battle', 'kimo', 'giraffe', 'bird', 'fish', 'tokage', 'gian', 'hopping'];