/* =============================================
   ShapeMatch! — Game Logic
   ============================================= */

// ── Shape Definitions ──────────────────────────
const GAME_KEY = 'shape-match';
const saveNote = document.getElementById('save-note');

const SHAPE_DEFS = {
  circle: {
    label: 'Circle',
    color: '#FF6B6B',
    darkColor: '#b33a3a',
    svgPath: `<circle cx="45" cy="45" r="40" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '🔴'
  },
  square: {
    label: 'Square',
    color: '#6ECFFF',
    darkColor: '#2a7ab3',
    svgPath: `<rect x="5" y="5" width="80" height="80" rx="8" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '🟦'
  },
  triangle: {
    label: 'Triangle',
    color: '#FFD43B',
    darkColor: '#b39a00',
    svgPath: `<polygon points="45,5 88,85 2,85" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '🔺'
  },
  star: {
    label: 'Star',
    color: '#FFA94D',
    darkColor: '#a86200',
    svgPath: `<polygon points="45,5 56,35 88,35 63,55 72,85 45,65 18,85 27,55 2,35 34,35" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '⭐'
  },
  diamond: {
    label: 'Diamond',
    color: '#B197FC',
    darkColor: '#6d40d4',
    svgPath: `<polygon points="45,2 88,45 45,88 2,45" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '💎'
  },
  heart: {
    label: 'Heart',
    color: '#FF8DC7',
    darkColor: '#b33a7a',
    svgPath: `<path d="M45 80 C45 80 5 50 5 28 C5 14 15 5 28 8 C36 10 42 17 45 22 C48 17 54 10 62 8 C75 5 85 14 85 28 C85 50 45 80 45 80Z" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '❤️'
  },
  rectangle: {
    label: 'Rectangle',
    color: '#63E6BE',
    darkColor: '#1e8a67',
    svgPath: `<rect x="2" y="20" width="86" height="50" rx="8" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '🟩'
  },
  pentagon: {
    label: 'Pentagon',
    color: '#5BE584',
    darkColor: '#2e8a50',
    svgPath: `<polygon points="45,3 87,32 72,78 18,78 3,32" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '⬠'
  },
  hexagon: {
    label: 'Hexagon',
    color: '#F06595',
    darkColor: '#a0305a',
    svgPath: `<polygon points="45,3 83,23 83,67 45,87 7,67 7,23" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '⬡'
  },
  oval: {
    label: 'Oval',
    color: '#74C0FC',
    darkColor: '#1971c2',
    svgPath: `<ellipse cx="45" cy="45" rx="42" ry="27" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '🥚'
  },
  arrow: {
    label: 'Arrow',
    color: '#FF922B',
    darkColor: '#a84200',
    svgPath: `<polygon points="5,30 55,30 55,10 85,45 55,80 55,60 5,60" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '➡️'
  },
  cross: {
    label: 'Cross',
    color: '#E64980',
    darkColor: '#8a1a40',
    svgPath: `<path d="M32 5 h26 v27 h27 v26 h-27 v27 h-26 v-27 h-27 v-26 h27 Z" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '✚'
  },
  crescent: {
    label: 'Crescent',
    color: '#9775FA',
    darkColor: '#5a30b5',
    svgPath: `<path d="M60 10 A38 38 0 1 0 60 80 A25 25 0 1 1 60 10Z" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '🌙'
  },
  parallelogram: {
    label: 'Parallelogram',
    color: '#20C997',
    darkColor: '#0d6e50',
    svgPath: `<polygon points="25,15 87,15 65,75 3,75" fill="currentColor"/>`,
    viewBox: '0 0 90 90',
    emoji: '▱'
  }
};

// ── Level Configuration (15 levels) ───────────
const LEVELS = [
  // Tier 1 — Beginner (Levels 1–3)
  { shapes: ['circle', 'square', 'triangle'],                                        time: 40, label: '⭐ Beginner' },
  { shapes: ['circle', 'square', 'triangle', 'star'],                                time: 45, label: '⭐ Beginner' },
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond'],                    time: 45, label: '⭐ Beginner' },

  // Tier 2 — Explorer (Levels 4–6)
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond', 'heart'],           time: 50, label: '🌟 Explorer' },
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond', 'heart', 'rectangle'], time: 50, label: '🌟 Explorer' },
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond', 'heart', 'rectangle', 'pentagon'], time: 55, label: '🌟 Explorer' },

  // Tier 3 — Challenger (Levels 7–9)
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond', 'heart', 'rectangle', 'pentagon', 'hexagon'], time: 55, label: '🔥 Challenger' },
  { shapes: ['square', 'triangle', 'star', 'diamond', 'heart', 'rectangle', 'pentagon', 'hexagon', 'oval', 'arrow'], time: 60, label: '🔥 Challenger' },
  { shapes: ['circle', 'triangle', 'star', 'diamond', 'heart', 'pentagon', 'hexagon', 'oval', 'arrow', 'cross'], time: 60, label: '🔥 Challenger' },

  // Tier 4 — Expert (Levels 10–12)
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond', 'heart', 'hexagon', 'oval', 'arrow', 'cross', 'crescent'], time: 65, label: '💎 Expert' },
  { shapes: ['square', 'triangle', 'star', 'diamond', 'heart', 'rectangle', 'pentagon', 'hexagon', 'oval', 'arrow', 'cross', 'crescent'], time: 65, label: '💎 Expert' },
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond', 'heart', 'rectangle', 'pentagon', 'hexagon', 'oval', 'cross', 'crescent', 'parallelogram'], time: 70, label: '💎 Expert' },

  // Tier 5 — Master (Levels 13–15)
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond', 'heart', 'rectangle', 'pentagon', 'hexagon', 'oval', 'arrow', 'cross', 'crescent', 'parallelogram'], time: 70, label: '🏆 Master' },
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond', 'heart', 'rectangle', 'pentagon', 'hexagon', 'oval', 'arrow', 'cross', 'crescent', 'parallelogram'], time: 60, label: '🏆 Master' },
  { shapes: ['circle', 'square', 'triangle', 'star', 'diamond', 'heart', 'rectangle', 'pentagon', 'hexagon', 'oval', 'arrow', 'cross', 'crescent', 'parallelogram'], time: 45, label: '🏆 Master' },
];

// ── Game State ─────────────────────────────────
let state = {
  level: 0,
  score: 0,
  matchedCount: 0,
  totalShapes: 0,
  timerInterval: null,
  timeLeft: 0,
  draggedShape: null,
  audioCtx: null,
};

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
    saveNote.textContent = 'Log in to save your matched levels and stars.';
    return;
  }
  const done = completedCount(accounts[session.name].gameProgress?.[GAME_KEY]);
  saveNote.textContent = `${session.name}, you have cleared ${done} / 15 shape levels.`;
}

function getLevelStars() {
  const maxTime = LEVELS[state.level].time;
  const ratio = maxTime ? state.timeLeft / maxTime : 0;
  if (ratio >= 0.55) return 3;
  if (ratio >= 0.25) return 2;
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
  const stars = Math.max(existing.stars || 0, getLevelStars());
  const isFirstCompletion = !existing.completed;

  bucket[levelNumber] = {
    completed: true,
    stars,
    score: state.score,
    updatedAt: Date.now(),
  };

  if (isFirstCompletion) {
    account.stars = (account.stars || 0) + stars;
    account.gamesPlayed = (account.gamesPlayed || 0) + 1;
  }

  account.lastActivity = {
    game: 'Shape Match',
    level: levelNumber,
    timestamp: Date.now(),
  };

  account.gameProgress[GAME_KEY] = bucket;
  accounts[session.name] = account;
  saveAccounts(accounts);
  updateSaveNote();
}

// ── Audio (Web Audio API tones) ────────────────
function getAudioCtx() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return state.audioCtx;
}

function playTone(frequency, type = 'sine', duration = 0.25, vol = 0.3) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* silent if audio unavailable */ }
}

function playCorrectSound() {
  playTone(523, 'sine', 0.15);
  setTimeout(() => playTone(659, 'sine', 0.15), 120);
  setTimeout(() => playTone(784, 'sine', 0.25), 240);
}

function playWrongSound() {
  playTone(300, 'sawtooth', 0.12);
  setTimeout(() => playTone(250, 'sawtooth', 0.18), 100);
}

function playLevelUpSound() {
  [523, 587, 659, 698, 784].forEach((f, i) => {
    setTimeout(() => playTone(f, 'sine', 0.2, 0.25), i * 100);
  });
}

// ── Build SVG for a shape ──────────────────────
function buildShapeSVG(key, size = 72, extraClass = '') {
  const def = SHAPE_DEFS[key];
  return `<svg class="shape-svg ${extraClass}" width="${size}" height="${size}"
    viewBox="${def.viewBox}" xmlns="http://www.w3.org/2000/svg"
    style="color:${def.color}">
    ${def.svgPath}
  </svg>`;
}

// ── Build outline SVG (lighter) for drop zone ──
function buildOutlineSVG(key, size = 54) {
  const def = SHAPE_DEFS[key];
  return `<svg class="zone-outline" width="${size}" height="${size}"
    viewBox="${def.viewBox}" xmlns="http://www.w3.org/2000/svg"
    style="color:${def.color}">
    ${def.svgPath}
  </svg>`;
}

// ── Render shapes panel ────────────────────────
function renderShapes(shapeKeys) {
  const panel = document.getElementById('shapes-panel');
  panel.innerHTML = '';
  const shuffled = [...shapeKeys].sort(() => Math.random() - 0.5);

  shuffled.forEach((key, idx) => {
    const def = SHAPE_DEFS[key];
    const item = document.createElement('div');
    item.className = 'shape-item';
    item.draggable = true;
    item.dataset.shape = key;
    item.style.animationDelay = `${idx * 0.08}s`;
    item.innerHTML = buildShapeSVG(key, 72) +
      `<span class="shape-label">${def.label}</span>`;

    // Desktop drag
    item.addEventListener('dragstart', onDragStart);
    item.addEventListener('dragend', onDragEnd);

    // Touch drag
    item.addEventListener('touchstart', onTouchStart, { passive: false });
    item.addEventListener('touchmove', onTouchMove, { passive: false });
    item.addEventListener('touchend', onTouchEnd);

    panel.appendChild(item);
  });
}

// ── Render drop zones ──────────────────────────
function renderDropZones(shapeKeys) {
  const panel = document.getElementById('dropzones-panel');
  panel.innerHTML = '';
  const shuffled = [...shapeKeys].sort(() => Math.random() - 0.5);

  shuffled.forEach(key => {
    const def = SHAPE_DEFS[key];
    const zone = document.createElement('div');
    zone.className = 'drop-zone';
    zone.dataset.accepts = key;
    zone.innerHTML =
      buildOutlineSVG(key, 52) +
      `<span class="zone-name">${def.label}</span>` +
      `<span class="zone-check">✅</span>`;

    zone.addEventListener('dragover',  onDragOver);
    zone.addEventListener('dragleave', onDragLeave);
    zone.addEventListener('drop',      onDrop);

    panel.appendChild(zone);
  });
}

// ── Desktop Drag Handlers ──────────────────────
function onDragStart(e) {
  state.draggedShape = e.currentTarget.dataset.shape;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', state.draggedShape);
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const zone = e.currentTarget;
  zone.classList.remove('drag-over');
  const dragged = e.dataTransfer.getData('text/plain') || state.draggedShape;
  processMatch(zone, dragged);
}

// ── Touch Drag Handlers ────────────────────────
let touchClone = null;
let touchOrigin = null;

function onTouchStart(e) {
  const item = e.currentTarget;
  state.draggedShape = item.dataset.shape;
  touchOrigin = item;
  const touch = e.touches[0];

  // Create floating clone
  touchClone = item.cloneNode(true);
  touchClone.style.cssText = `
    position:fixed; left:${touch.clientX - 45}px; top:${touch.clientY - 45}px;
    width:90px; pointer-events:none; z-index:999; opacity:0.85;
    transform:scale(1.1) rotate(-5deg); transition:none;
  `;
  document.body.appendChild(touchClone);
  item.classList.add('dragging');
}

function onTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  if (touchClone) {
    touchClone.style.left = `${touch.clientX - 45}px`;
    touchClone.style.top  = `${touch.clientY - 45}px`;
  }
  // Highlight zone under finger
  document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const zone = el?.closest('.drop-zone');
  if (zone) zone.classList.add('drag-over');
}

function onTouchEnd(e) {
  if (touchClone) { touchClone.remove(); touchClone = null; }
  if (touchOrigin) touchOrigin.classList.remove('dragging');
  document.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('drag-over'));

  const touch = e.changedTouches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const zone = el?.closest('.drop-zone');
  if (zone) processMatch(zone, state.draggedShape);
  state.draggedShape = null;
  touchOrigin = null;
}

// ── Core Match Logic ───────────────────────────
function processMatch(zone, draggedKey) {
  if (!draggedKey) return;
  if (zone.classList.contains('correct')) return; // already matched

  const accepts = zone.dataset.accepts;

  if (accepts === draggedKey) {
    handleCorrect(zone, draggedKey);
  } else {
    handleWrong(zone);
  }
}

function handleCorrect(zone, key) {
  playCorrectSound();

  // Mark zone as correct
  zone.classList.add('correct');
  zone.classList.remove('drag-over');

  // Remove shape from panel
  const shapeEl = document.querySelector(`.shape-item[data-shape="${key}"]`);
  if (shapeEl) shapeEl.classList.add('matched');

  // Score
  const bonus = Math.ceil(state.timeLeft / 5);
  state.score += 10 + bonus;
  state.matchedCount++;
  updateHUD();

  showFeedback(getRandom(CORRECT_MSGS), 'correct-msg');
  spawnConfetti();

  // Check level complete
  if (state.matchedCount >= state.totalShapes) {
    setTimeout(onLevelComplete, 600);
  }
}

function handleWrong(zone) {
  playWrongSound();
  zone.classList.add('wrong');
  setTimeout(() => zone.classList.remove('wrong'), 500);
  state.score = Math.max(0, state.score - 2);
  updateHUD();
  showFeedback(getRandom(WRONG_MSGS), 'wrong-msg');
}

// ── Messages ───────────────────────────────────
const CORRECT_MSGS = [
  '🎉 Awesome! Perfect match!',
  '⭐ Great job! Keep going!',
  '🥳 You nailed it!',
  '🌟 Superstar move!',
  '🎊 Brilliant! Well done!',
];
const WRONG_MSGS = [
  '❌ Oops! Try again!',
  '😬 Not quite! Look carefully!',
  '🔄 Wrong box! Keep trying!',
  '💪 Almost! Don\'t give up!',
];
const getRandom = arr => arr[Math.floor(Math.random() * arr.length)];

// ── Feedback ───────────────────────────────────
let feedbackTimer;
function showFeedback(msg, cls) {
  const el = document.getElementById('feedback');
  el.textContent = msg;
  el.className = `feedback ${cls}`;
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    el.textContent = '';
    el.className = 'feedback';
  }, 2000);
}

// ── HUD Update ─────────────────────────────────
function updateHUD() {
  document.getElementById('score').textContent = state.score;
  document.getElementById('level-display').textContent = state.level + 1;
  const timerEl = document.getElementById('timer');
  timerEl.textContent = state.timeLeft;
  const timerHud = timerEl.closest('.hud-item');
  timerHud.classList.toggle('danger', state.timeLeft <= 10);
}

// ── Progress Bar ───────────────────────────────
function updateProgress() {
  const pct = ((state.level) / (LEVELS.length - 1)) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${state.level + 1} / 15`;
}


function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateHUD();
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      onTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
}

// ── Level Up ───────────────────────────────────
function onLevelComplete() {
  stopTimer();
  playLevelUpSound();
  spawnConfetti(60);
  saveLevelProgress(state.level + 1);

  const isLastLevel = state.level >= LEVELS.length - 1;
  const overlay = document.getElementById('level-overlay');
  const nextLvlNum = state.level + 2;
  const nextTier = !isLastLevel ? LEVELS[state.level + 1].label : '';

  document.getElementById('overlay-emoji').textContent  = isLastLevel ? '🏆' : state.level >= 11 ? '💎' : state.level >= 6 ? '🔥' : '🎉';
  document.getElementById('overlay-title').textContent  = isLastLevel ? 'ULTIMATE CHAMPION!' : `Level ${state.level + 1} Complete!`;
  document.getElementById('overlay-msg').textContent    = isLastLevel
    ? '🎊 You conquered ALL 15 levels! You\'re a Shape Master!'
    : `Amazing! Up next: Level ${nextLvlNum}/15 — ${nextTier}`;
  document.getElementById('overlay-score').textContent  = state.score;

  const nextBtn = document.getElementById('overlay-next-btn');
  if (isLastLevel) {
    nextBtn.textContent = '🔄 Play Again';
    nextBtn.onclick = resetGame;
  } else {
    nextBtn.textContent = 'Next Level ➡️';
    nextBtn.onclick = () => { overlay.style.display = 'none'; nextLevel(); };
  }
  overlay.style.display = 'flex';
}

function onTimeUp() {
  playWrongSound();
  document.getElementById('gameover-score').textContent = state.score;
  document.getElementById('gameover-overlay').style.display = 'flex';
}

// ── Navigation ─────────────────────────────────
function nextLevel() {
  if (state.level < LEVELS.length - 1) {
    state.level++;
  }
  document.getElementById('level-overlay').style.display = 'none';
  document.getElementById('next-btn').style.display = 'none';
  startLevel();
}

function resetLevel() {
  document.getElementById('level-overlay').style.display = 'none';
  document.getElementById('gameover-overlay').style.display = 'none';
  startLevel();
}

function resetGame() {
  state.level = 0;
  state.score = 0;
  document.getElementById('level-overlay').style.display = 'none';
  document.getElementById('gameover-overlay').style.display = 'none';
  startLevel();
}

// ── Start Level ────────────────────────────────
function startLevel() {
  stopTimer();
  state.matchedCount = 0;
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';
  document.getElementById('next-btn').style.display = 'none';

  const lvl = LEVELS[state.level];
  state.totalShapes = lvl.shapes.length;
  state.timeLeft    = lvl.time;

  document.getElementById('instruction-bar').textContent =
    `Level ${state.level + 1}/15 — ${lvl.label}: Drag shapes to the right box! 🚀`;

  renderShapes(lvl.shapes);
  renderDropZones(lvl.shapes);
  updateHUD();
  updateProgress();
  updateSaveNote();
  startTimer();
}

// ── Confetti ───────────────────────────────────
const CONFETTI_COLORS = ['#FF6B6B','#FFD43B','#6ECFFF','#5BE584','#B197FC','#FF8DC7','#FFA94D','#63E6BE'];

function spawnConfetti(count = 30) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left: ${Math.random() * 100}vw;
        top: -12px;
        background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
        width: ${6 + Math.random() * 10}px;
        height: ${6 + Math.random() * 10}px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        animation-duration: ${0.8 + Math.random() * 0.8}s;
        animation-delay: 0s;
      `;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 1400);
    }, Math.random() * 400);
  }
}

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateSaveNote();
  startLevel();
});
