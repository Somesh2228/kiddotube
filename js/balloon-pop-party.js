/* ══════════════════════════════════════════
   🎈  BALLOON POP PARTY — script.js (v2 — 15 Levels)
══════════════════════════════════════════ */

// ── DOM refs ──
const GAME_KEY        = 'balloon-pop-party';
const gameArea        = document.getElementById('gameArea');
const scoreEl         = document.getElementById('score');
const timerEl         = document.getElementById('timer');
const startScreen     = document.getElementById('startScreen');
const gameOverScreen  = document.getElementById('gameOverScreen');
const levelUpScreen   = document.getElementById('levelUpScreen');
const startBtn        = document.getElementById('startBtn');
const restartBtn      = document.getElementById('restartBtn');
const levelUpBtn      = document.getElementById('levelUpBtn');
const finalScoreEl    = document.getElementById('finalScore');
const finalLevelEl    = document.getElementById('finalLevel');
const finalMessageEl  = document.getElementById('finalMessage');
const resultEmoji     = document.getElementById('resultEmoji');
const popupsEl        = document.getElementById('popups');
const starsEl         = document.getElementById('stars');
const levelDisplay    = document.getElementById('levelDisplay');
const levelBarFill    = document.getElementById('levelBarFill');
const levelBarText    = document.getElementById('levelBarText');
const newLevelNum     = document.getElementById('newLevelNum');
const levelUpEmoji    = document.getElementById('levelUpEmoji');
const levelUpDesc     = document.getElementById('levelUpDesc');
const levelUpPerks    = document.getElementById('levelUpPerks');
const saveNote        = document.getElementById('save-note');

// ── Level Definitions (1–15) ──
const LEVELS = [
  null, // index 0 unused
  { popsToNext:  5, timePerLevel: 30, spawnStart: 1000, spawnMin: 750, bombWeight:  5, fastWeight: 15, balloonSpeed: [6, 9],  desc: "Let's warm up! Pop those balloons!",          emoji: '🎈', perks: [] },
  { popsToNext:  7, timePerLevel: 30, spawnStart:  900, spawnMin: 680, bombWeight:  7, fastWeight: 18, balloonSpeed: [5, 8],  desc: "A little faster now. Stay sharp!",            emoji: '🚀', perks: ['Faster balloons'] },
  { popsToNext:  9, timePerLevel: 30, spawnStart:  820, spawnMin: 620, bombWeight:  9, fastWeight: 20, balloonSpeed: [5, 8],  desc: "More bombs incoming! Watch out!",              emoji: '💣', perks: ['More bombs', 'Faster spawn'] },
  { popsToNext: 11, timePerLevel: 30, spawnStart:  750, spawnMin: 560, bombWeight: 10, fastWeight: 22, balloonSpeed: [4, 7],  desc: "Balloons are speeding up!",                    emoji: '⚡', perks: ['Balloon speed ↑', 'Faster spawn'] },
  { popsToNext: 13, timePerLevel: 30, spawnStart:  700, spawnMin: 500, bombWeight: 11, fastWeight: 25, balloonSpeed: [4, 7],  desc: "Halfway there! Don't slow down!",              emoji: '🏅', perks: ['Even faster', 'More fast balloons'] },
  { popsToNext: 15, timePerLevel: 30, spawnStart:  640, spawnMin: 460, bombWeight: 12, fastWeight: 27, balloonSpeed: [3, 6],  desc: "Things are heating up! Focus!",                emoji: '🔥', perks: ['Speed up', 'More bombs'] },
  { popsToNext: 17, timePerLevel: 28, spawnStart:  580, spawnMin: 420, bombWeight: 13, fastWeight: 29, balloonSpeed: [3, 6],  desc: "Speed demon mode! Keep clicking!",             emoji: '🌪️', perks: ['Shorter level time', 'Speed ↑'] },
  { popsToNext: 19, timePerLevel: 28, spawnStart:  520, spawnMin: 380, bombWeight: 14, fastWeight: 31, balloonSpeed: [3, 5],  desc: "Madness! Balloons everywhere!",                emoji: '😱', perks: ['Spawn rate ↑', 'More chaos'] },
  { popsToNext: 21, timePerLevel: 26, spawnStart:  470, spawnMin: 340, bombWeight: 15, fastWeight: 33, balloonSpeed: [2, 5],  desc: "You're incredible! Don't stop now!",           emoji: '🌟', perks: ['Shorter time', 'Hyper speed'] },
  { popsToNext: 23, timePerLevel: 26, spawnStart:  430, spawnMin: 300, bombWeight: 16, fastWeight: 35, balloonSpeed: [2, 4],  desc: "Double digits! Legendary territory!",          emoji: '💫', perks: ['Ultra fast', 'More bombs'] },
  { popsToNext: 25, timePerLevel: 25, spawnStart:  390, spawnMin: 270, bombWeight: 17, fastWeight: 37, balloonSpeed: [2, 4],  desc: "Expert popper status unlocked!",               emoji: '🏆', perks: ['Expert mode', 'Speed ↑↑'] },
  { popsToNext: 27, timePerLevel: 25, spawnStart:  360, spawnMin: 250, bombWeight: 18, fastWeight: 39, balloonSpeed: [2, 4],  desc: "Almost there — the peak awaits!",              emoji: '🎯', perks: ['Precision required', 'Bombs ↑'] },
  { popsToNext: 29, timePerLevel: 24, spawnStart:  330, spawnMin: 230, bombWeight: 19, fastWeight: 41, balloonSpeed: [1, 3],  desc: "Only 2 levels left! Insane speed!",            emoji: '🚨', perks: ['Insane speed', 'Short time'] },
  { popsToNext: 31, timePerLevel: 24, spawnStart:  300, spawnMin: 210, bombWeight: 20, fastWeight: 43, balloonSpeed: [1, 3],  desc: "FINAL CHALLENGE! Prove yourself!",             emoji: '👑', perks: ['Max difficulty', 'Ultimate test'] },
  { popsToNext: 999,timePerLevel: 24, spawnStart:  270, spawnMin: 190, bombWeight: 22, fastWeight: 45, balloonSpeed: [1, 3],  desc: "MAX LEVEL! You are a LEGEND!",                 emoji: '🌈', perks: ['LEGENDARY', 'MAX LEVEL REACHED'] },
];
const MAX_LEVEL = 15;

// ── State ──
let score         = 0;
let level         = 1;
let popsThisLevel = 0;
let timeLeft      = 30;
let gameActive    = false;
let levelPaused   = false;
let timerInterval = null;
let spawnTimeout  = null;
let spawnDelay    = 1000;
let balloonId     = 0;
const activeBalloons = new Map();

// ── Audio Engine ──
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getSession() {
  return JSON.parse(localStorage.getItem('kiddotube_session') || 'null');
}

function getAccounts() {
  return JSON.parse(localStorage.getItem('kiddotube_accounts') || '{}');
}

function saveAccounts(accounts) {
  localStorage.setItem('kiddotube_accounts', JSON.stringify(accounts));
}

function completedCount(bucket) {
  return Object.values(bucket || {}).filter(item => item && item.completed).length;
}

function updateSaveNote() {
  if (!saveNote) return;
  const session = getSession();
  const accounts = getAccounts();
  if (!session || !accounts[session.name]) {
    saveNote.textContent = 'Log in to save your level wins and stars.';
    return;
  }
  const done = completedCount(accounts[session.name].gameProgress?.[GAME_KEY]);
  saveNote.textContent = `${session.name}, you have cleared ${done} / 15 balloon levels.`;
}

function getLevelStars(levelNumber) {
  if (levelNumber >= 11) return 3;
  if (levelNumber >= 6) return 2;
  return 1;
}

function saveLevelProgress(levelNumber) {
  const session = getSession();
  const accounts = getAccounts();
  if (!session || !accounts[session.name]) return;

  const account = accounts[session.name];
  account.gameProgress = account.gameProgress || {};
  const bucket = account.gameProgress[GAME_KEY] || {};
  const existing = bucket[levelNumber] || {};
  const stars = Math.max(existing.stars || 0, getLevelStars(levelNumber));
  const isFirstCompletion = !existing.completed;

  bucket[levelNumber] = {
    completed: true,
    stars,
    score,
    updatedAt: Date.now(),
  };

  if (isFirstCompletion) {
    account.stars = (account.stars || 0) + stars;
    account.gamesPlayed = (account.gamesPlayed || 0) + 1;
  }

  account.lastActivity = {
    game: 'Balloon Pop Party',
    level: levelNumber,
    timestamp: Date.now(),
  };

  account.gameProgress[GAME_KEY] = bucket;
  accounts[session.name] = account;
  saveAccounts(accounts);
  updateSaveNote();
}

function ensureAudio() {
  if (!AudioCtx) return;
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function playPop(type) {
  if (!ensureAudio()) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  if (type === 'bomb') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.start(); osc.stop(audioCtx.currentTime + 0.35);
  } else {
    osc.type = 'sine';
    const freq = type === 'fast' ? 700 : 480;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.start(); osc.stop(audioCtx.currentTime + 0.18);
  }
}

function playLevelUpSound() {
  if (!ensureAudio()) return;
  [392, 523, 659, 784, 1047].forEach((freq, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'sine';
    const t = audioCtx.currentTime + i * 0.13;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.start(t); o.stop(t + 0.18);
  });
}

function playGameOverSound() {
  if (!ensureAudio()) return;
  [523, 466, 392, 349].forEach((freq, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'sine';
    const t = audioCtx.currentTime + i * 0.22;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.start(t); o.stop(t + 0.25);
  });
}

// ── Background Music ──
let bgNodes = [];
function startBgMusic() {
  if (!ensureAudio()) return;
  stopBgMusic();
  playMusicLoop();
}
function stopBgMusic() { bgNodes.forEach(n => { try { n.stop(); } catch(e){} }); bgNodes = []; }
function playMusicLoop() {
  if (!audioCtx) return;
  if (!gameActive) return;
  const tempo = Math.max(0.16, 0.28 - (level - 1) * 0.008);
  const notes  = [261, 293, 329, 349, 392, 440, 493, 523];
  const melody = [0, 2, 4, 7, 4, 2, 5, 4, 2, 0, 2, 4, 7, 5, 4, 2];
  let time = audioCtx.currentTime;
  melody.forEach(ni => {
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(notes[ni], time);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.07, time + 0.05);
    gain.gain.linearRampToValueAtTime(0.05, time + tempo * 0.6);
    gain.gain.linearRampToValueAtTime(0, time + tempo * 0.8);
    osc.start(time); osc.stop(time + tempo * 0.8);
    bgNodes.push(osc);
    time += tempo;
  });
  setTimeout(() => { if (gameActive && !levelPaused) playMusicLoop(); }, melody.length * tempo * 1000);
}

// ── Stars / Clouds ──
function createStars() {
  starsEl.innerHTML = '';
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 3 + 1;
    s.style.cssText = `width:${size}px;height:${size}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--dur:${(Math.random()*2+1).toFixed(1)}s;animation-delay:${(Math.random()*3).toFixed(1)}s;`;
    starsEl.appendChild(s);
  }
}
function createClouds() {
  document.querySelectorAll('.cloud').forEach(c => c.remove());
  for (let i = 0; i < 5; i++) {
    const c = document.createElement('div');
    c.className = 'cloud';
    c.textContent = '☁️';
    const dur = 20 + Math.random() * 30;
    c.style.cssText = `top:${10+Math.random()*50}%;animation-duration:${dur}s;animation-delay:${-Math.random()*dur}s;font-size:${60+Math.random()*60}px;`;
    document.body.appendChild(c);
  }
}

// ── Balloon Colors ──
const BALLOON_COLORS = ['#e63678','#ff6b6b','#ff9f43','#a29bfe','#fd79a8','#badc58','#6ab04c','#00cec9','#fdcb6e','#e17055'];

function pickType() {
  const cfg = LEVELS[level];
  const r = Math.random() * 100;
  if (r < cfg.bombWeight) return 'bomb';
  if (r < cfg.bombWeight + cfg.fastWeight) return 'fast';
  return 'normal';
}

function spawnBalloon() {
  if (!gameActive || levelPaused) return;
  const cfg  = LEVELS[level];
  const type = pickType();
  const id   = ++balloonId;
  const leftPct = 4 + Math.random() * 86;
  const [sMin, sMax] = cfg.balloonSpeed;
  const dur = sMin + Math.random() * (sMax - sMin);

  const el = document.createElement('div');
  el.className = `balloon ${type}`;
  el.dataset.id = id;

  const body = document.createElement('div');
  body.className = 'balloon-body';

  if (type === 'normal') {
    const col = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
    body.style.background = `radial-gradient(circle at 35% 35%, ${lighten(col, 40)}, ${col})`;
    body.style.setProperty('--knot-color', darken(col, 30));
  }

  const knot = document.createElement('div'); knot.className = 'balloon-knot';
  const str  = document.createElement('div'); str.className  = 'balloon-string';
  el.appendChild(body); el.appendChild(knot); el.appendChild(str);

  if (type === 'bomb') {
    const lbl = document.createElement('div');
    lbl.style.cssText = 'position:absolute;top:18px;left:50%;transform:translateX(-50%);font-size:24px;z-index:3;';
    lbl.textContent = '💣';
    el.appendChild(lbl);
  }

  el.style.cssText += `left:${leftPct}%;animation-duration:${dur}s;`;
  el.addEventListener('click', e => popBalloon(e, el, type, id));
  gameArea.appendChild(el);
  activeBalloons.set(id, el);
  el.addEventListener('animationend', () => {
    if (activeBalloons.has(id)) { activeBalloons.delete(id); el.remove(); }
  });
}

// ── Pop ──
function popBalloon(e, el, type, id) {
  e.stopPropagation();
  if (!gameActive || levelPaused || !activeBalloons.has(id)) return;
  activeBalloons.delete(id);

  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;

  const burst = document.createElement('div');
  burst.className = 'pop-burst';
  burst.textContent = type === 'bomb' ? '💥' : type === 'fast' ? '⚡' : '🎉';
  burst.style.cssText = `left:${cx-20}px;top:${cy-20}px;`;
  document.body.appendChild(burst);
  burst.addEventListener('animationend', () => burst.remove());

  el.style.animation = 'none';
  el.style.opacity   = '0';
  el.style.transform = 'scale(0)';
  el.style.transition = 'opacity 0.1s,transform 0.1s';
  setTimeout(() => el.remove(), 120);

  const points = type === 'bomb' ? -3 : type === 'fast' ? 2 : 1;
  score = Math.max(0, score + points);
  scoreEl.textContent = score;
  showScorePopup(cx, cy, points);
  playPop(type);

  if (points > 0) {
    popsThisLevel++;
    updateLevelBar();
    const cfg = LEVELS[level];
    if (popsThisLevel >= cfg.popsToNext && level < MAX_LEVEL) {
      triggerLevelUp();
    }
  }
}

// ── Level Bar ──
function updateLevelBar() {
  const cfg = LEVELS[level];
  const pct = Math.min(100, (popsThisLevel / cfg.popsToNext) * 100);
  levelBarFill.style.width = pct + '%';
  levelBarText.textContent = `${Math.min(popsThisLevel, cfg.popsToNext)}/${cfg.popsToNext}`;
}

// ── Level Up ──
function triggerLevelUp() {
  saveLevelProgress(level);
  levelPaused = true;
  clearInterval(timerInterval);
  clearTimeout(spawnTimeout);
  stopBgMusic();
  playLevelUpSound();

  activeBalloons.forEach(el => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  });
  activeBalloons.clear();

  const nextLevel = level + 1;
  const nextCfg   = LEVELS[nextLevel];

  newLevelNum.textContent  = nextLevel;
  levelUpEmoji.textContent = nextCfg.emoji;
  levelUpDesc.textContent  = nextCfg.desc;

  levelUpPerks.innerHTML = '';
  nextCfg.perks.forEach(p => {
    const chip = document.createElement('div');
    chip.className = 'perk-chip';
    chip.textContent = p;
    levelUpPerks.appendChild(chip);
  });

  setTimeout(() => levelUpScreen.classList.remove('hidden'), 350);
}

function advanceLevel() {
  level++;
  popsThisLevel = 0;
  levelDisplay.textContent = level;

  levelDisplay.classList.remove('level-flash');
  void levelDisplay.offsetWidth;
  levelDisplay.classList.add('level-flash');
  setTimeout(() => levelDisplay.classList.remove('level-flash'), 600);

  updateLevelBar();
  levelUpScreen.classList.add('hidden');
  levelPaused = false;

  const cfg = LEVELS[level];
  timeLeft = cfg.timePerLevel;
  timerEl.textContent = timeLeft;
  timerEl.classList.remove('urgent');
  spawnDelay = cfg.spawnStart;

  if (level === MAX_LEVEL) showMaxLevelToast();

  startTimer();
  startSpawning();
  startBgMusic();
}

function showMaxLevelToast() {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;top:90px;left:50%;transform:translateX(-50%);
    background:linear-gradient(135deg,#f9c74f,#f8961e);color:#2d1b6b;
    font-family:'Fredoka One',cursive;font-size:18px;padding:10px 28px;
    border-radius:50px;z-index:400;box-shadow:0 4px 20px rgba(249,199,79,0.6);
    animation:popUp 2.5s ease-out forwards;white-space:nowrap;
  `;
  t.textContent = '👑 MAX LEVEL 15 — LEGENDARY MODE!';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ── Timer ──
function startTimer() {
  timerEl.classList.remove('urgent');
  timerInterval = setInterval(() => {
    if (levelPaused) return;
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 8) timerEl.classList.add('urgent');
    if (timeLeft <= 0) endGame();
  }, 1000);
}

// ── Spawning ──
function startSpawning() {
  const cfg = LEVELS[level];
  spawnDelay = cfg.spawnStart;
  scheduleSpawn();
}
function scheduleSpawn() {
  if (!gameActive || levelPaused) return;
  spawnBalloon();
  const cfg = LEVELS[level];
  spawnDelay = Math.max(cfg.spawnMin, spawnDelay - 5);
  spawnTimeout = setTimeout(scheduleSpawn, spawnDelay);
}

// ── Game Lifecycle ──
function startGame() {
  ensureAudio();
  score = 0; level = 1; popsThisLevel = 0;
  scoreEl.textContent      = '0';
  levelDisplay.textContent = '1';
  timerEl.classList.remove('urgent');
  levelBarFill.style.width = '0%';
  levelBarText.textContent = `0/${LEVELS[1].popsToNext}`;

  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  levelUpScreen.classList.add('hidden');
  gameArea.classList.add('active');

  activeBalloons.forEach(el => el.remove());
  activeBalloons.clear();
  gameArea.innerHTML = '';

  levelPaused = false;
  gameActive  = true;

  const cfg = LEVELS[1];
  timeLeft = cfg.timePerLevel;
  timerEl.textContent = timeLeft;
  updateSaveNote();

  startTimer();
  startSpawning();
  startBgMusic();
}

function endGame() {
  gameActive  = false;
  levelPaused = false;
  clearInterval(timerInterval);
  clearTimeout(spawnTimeout);
  stopBgMusic();
  gameArea.classList.remove('active');

  activeBalloons.forEach(el => el.remove());
  activeBalloons.clear();

  if (level === MAX_LEVEL) {
    saveLevelProgress(MAX_LEVEL);
  }

  playGameOverSound();

  finalScoreEl.textContent = score;
  finalLevelEl.textContent = level;
  const msg = getMessage(score, level);
  finalMessageEl.textContent = msg.text;
  resultEmoji.textContent    = msg.emoji;

  setTimeout(() => gameOverScreen.classList.remove('hidden'), 300);
}

function getMessage(s, lv) {
  if (lv >= 15) return { emoji: '🌈', text: 'LEGENDARY! You reached MAX LEVEL 15!' };
  if (lv >= 12) return { emoji: '🏆', text: 'INCREDIBLE! Master balloon popper!' };
  if (lv >= 9)  return { emoji: '🎊', text: "Amazing! You're an expert!" };
  if (lv >= 6)  return { emoji: '🎉', text: 'Great job! Keep climbing levels!' };
  if (lv >= 3)  return { emoji: '😊', text: 'Nice! Can you reach level 10?' };
  return { emoji: '💪', text: 'Keep going — the real fun starts at level 5!' };
}

// ── Score Popup ──
function showScorePopup(x, y, val) {
  const p = document.createElement('div');
  p.className = 'score-popup ' + (val > 1 ? 'plus2' : val > 0 ? 'plus' : 'minus');
  p.textContent = val > 0 ? `+${val}` : `${val}`;
  p.style.cssText = `left:${x-20}px;top:${y-20}px;`;
  popupsEl.appendChild(p);
  p.addEventListener('animationend', () => p.remove());
}

// ── Colour Helpers ──
function hexToRgb(hex) { return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]; }
function rgbToHex(r,g,b) { return '#'+[r,g,b].map(v=>Math.min(255,Math.max(0,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
function lighten(hex,a) { const [r,g,b]=hexToRgb(hex); return rgbToHex(r+a,g+a,b+a); }
function darken(hex,a)  { const [r,g,b]=hexToRgb(hex); return rgbToHex(r-a,g-a,b-a); }

// ── Events ──
startBtn.addEventListener('click',   startGame);
restartBtn.addEventListener('click', startGame);
levelUpBtn.addEventListener('click', advanceLevel);

// ── Init ──
createStars();
createClouds();
updateSaveNote();
