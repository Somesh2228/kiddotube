(function () {
  const GAME_KEY = 'memory-match-15';
  const ALL_CARDS = [
    { emoji: '🦊', label: 'Fox' },
    { emoji: '🐼', label: 'Panda' },
    { emoji: '🦄', label: 'Unicorn' },
    { emoji: '🐬', label: 'Dolphin' },
    { emoji: '🦋', label: 'Butterfly' },
    { emoji: '🐙', label: 'Octopus' },
    { emoji: '🦁', label: 'Lion' },
    { emoji: '🐸', label: 'Frog' },
    { emoji: '🐨', label: 'Koala' },
    { emoji: '🦜', label: 'Parrot' },
    { emoji: '🐡', label: 'Blowfish' },
    { emoji: '🦩', label: 'Flamingo' },
    { emoji: '🐲', label: 'Dragon' },
    { emoji: '🐠', label: 'Fish' },
    { emoji: '🦝', label: 'Raccoon' }
  ];

  const LEVELS = [
    { pairs: 2, cols: 2, flip: 2.0 },
    { pairs: 3, cols: 3, flip: 2.0 },
    { pairs: 4, cols: 4, flip: 1.5 },
    { pairs: 4, cols: 4, flip: 1.3 },
    { pairs: 5, cols: 4, flip: 1.5 },
    { pairs: 6, cols: 4, flip: 1.5 },
    { pairs: 6, cols: 3, flip: 1.2 },
    { pairs: 7, cols: 4, flip: 1.2 },
    { pairs: 8, cols: 4, flip: 1.0 },
    { pairs: 9, cols: 3, flip: 1.0 },
    { pairs: 10, cols: 4, flip: 1.0 },
    { pairs: 11, cols: 4, flip: 0.9 },
    { pairs: 12, cols: 4, flip: 0.8 },
    { pairs: 13, cols: 4, flip: 0.8 },
    { pairs: 15, cols: 5, flip: 0.7 }
  ];

  const TIER_START = { easy: 0, medium: 5, hard: 10 };
  const CONFETTI_COLORS = ['#ff7eb3', '#ffe66d', '#6df5c8', '#c07cf8', '#ff9f43', '#a8edff', '#6c63ff'];

  let audioCtx = null;
  let state = {
    currentLevel: 0,
    cards: [],
    flipped: [],
    matched: new Set(),
    score: 0,
    totalScore: 0,
    moves: 0,
    seconds: 0,
    timerID: null,
    locked: false
  };

  const board = document.getElementById('board');
  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('timer');
  const movesEl = document.getElementById('moves');
  const restartBtn = document.getElementById('restart-btn');
  const modal = document.getElementById('modal');
  const modalStars = document.querySelector('.modal-stars');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalPlay = document.getElementById('modal-play-again');
  const levelBtns = document.querySelectorAll('.level-btn');
  const levelText = document.getElementById('level-text');
  const levelFill = document.getElementById('level-fill');
  const saveNote = document.getElementById('save-note');

  function getSession() {
    return JSON.parse(localStorage.getItem('kiddotube_session') || 'null');
  }

  function getAccounts() {
    return JSON.parse(localStorage.getItem('kiddotube_accounts') || '{}');
  }

  function saveAccounts(accounts) {
    localStorage.setItem('kiddotube_accounts', JSON.stringify(accounts));
  }

  function getCurrentAccount() {
    const session = getSession();
    const accounts = getAccounts();
    return session && accounts[session.name] ? accounts[session.name] : null;
  }

  function completedCount(bucket) {
    return Object.values(bucket || {}).filter(item => item && item.completed).length;
  }

  function updateSaveNote() {
    const account = getCurrentAccount();
    if (!saveNote) {
      return;
    }
    if (!account) {
      saveNote.textContent = 'Play now, or log in to save cleared levels and stars.';
      return;
    }
    const done = completedCount(account.gameProgress?.[GAME_KEY]);
    saveNote.textContent = `${getSession().name}, you have cleared ${done} / 15 levels here.`;
  }

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) {
        return null;
      }
      audioCtx = new AudioCtor();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, gainValue) {
    try {
      const ctx = getAudioCtx();
      if (!ctx) {
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  }

  function playMatchSound() {
    playTone(660, 'triangle', 0.15, 0.3);
    setTimeout(() => playTone(880, 'triangle', 0.2, 0.3), 130);
  }

  function playFlipSound() {
    playTone(400, 'sine', 0.08, 0.15);
  }

  function playWrongSound() {
    playTone(220, 'sawtooth', 0.15, 0.2);
  }

  function playLevelUpSound() {
    playTone(784, 'triangle', 0.12, 0.3);
    setTimeout(() => playTone(1047, 'triangle', 0.18, 0.3), 150);
  }

  function playMasterSound() {
    [523, 659, 784, 1047, 1319].forEach((freq, index) => {
      setTimeout(() => playTone(freq, 'triangle', 0.28, 0.35), index * 120);
    });
  }

  function shuffle(list) {
    const copy = [...list];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
  }

  function startTimer() {
    clearInterval(state.timerID);
    state.timerID = setInterval(() => {
      state.seconds += 1;
      timerEl.textContent = `${state.seconds}s`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerID);
    state.timerID = null;
  }

  function buildDeck(levelIdx) {
    const pairs = LEVELS[levelIdx].pairs;
    const selected = shuffle(ALL_CARDS).slice(0, pairs);
    const deck = [];

    selected.forEach((card, pairID) => {
      deck.push({ ...card, pairID, id: `${pairID}-a` });
      deck.push({ ...card, pairID, id: `${pairID}-b` });
    });

    return shuffle(deck);
  }

  function updateLevelUI() {
    const levelNum = state.currentLevel + 1;
    levelText.textContent = `Level ${levelNum} / 15`;
    levelFill.style.width = `${((levelNum - 1) / 14) * 100}%`;

    if (levelNum <= 5) {
      levelFill.style.background = 'linear-gradient(90deg,#6df5c8,#6c63ff)';
    } else if (levelNum <= 10) {
      levelFill.style.background = 'linear-gradient(90deg,#ffe66d,#ff9f43)';
    } else {
      levelFill.style.background = 'linear-gradient(90deg,#ff7eb3,#c07cf8)';
    }

    const tier = levelNum <= 5 ? 'easy' : levelNum <= 10 ? 'medium' : 'hard';
    levelBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.level === tier));
  }

  function renderBoard() {
    const level = LEVELS[state.currentLevel];
    board.innerHTML = '';
    board.className = `board cols-${level.cols}`;

    state.cards.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'card';
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Card ${idx + 1}`);
      el.setAttribute('tabindex', '0');
      el.style.animationDelay = `${idx * 0.04}s`;
      el.innerHTML = `
        <div class="card-inner">
          <div class="card-back"></div>
          <div class="card-front">
            <span class="emoji">${card.emoji}</span>
            <span class="label">${card.label}</span>
          </div>
        </div>`;

      el.addEventListener('click', () => onCardClick(idx));
      el.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onCardClick(idx);
        }
      });
      board.appendChild(el);
    });
  }

  function onCardClick(idx) {
    if (state.locked || state.matched.has(idx) || state.flipped.includes(idx) || state.flipped.length === 2) {
      return;
    }

    if (state.moves === 0 && state.flipped.length === 0) {
      startTimer();
    }

    playFlipSound();
    board.children[idx].classList.add('flipped');
    state.flipped.push(idx);

    if (state.flipped.length === 2) {
      state.moves += 1;
      movesEl.textContent = String(state.moves);
      evaluatePair();
    }
  }

  function evaluatePair() {
    state.locked = true;
    const [a, b] = state.flipped;
    const cardA = state.cards[a];
    const cardB = state.cards[b];
    const elA = board.children[a];
    const elB = board.children[b];

    if (cardA.pairID === cardB.pairID) {
      state.matched.add(a);
      state.matched.add(b);
      state.score += 10;
      scoreEl.textContent = String(state.totalScore + state.score);
      playMatchSound();
      elA.classList.add('matched');
      elB.classList.add('matched');
      elA.setAttribute('aria-label', `${cardA.label} matched`);
      elB.setAttribute('aria-label', `${cardB.label} matched`);
      state.flipped = [];
      state.locked = false;

      if (state.matched.size === state.cards.length) {
        setTimeout(onLevelComplete, 500);
      }
      return;
    }

    playWrongSound();
    elA.classList.add('wrong');
    elB.classList.add('wrong');
    setTimeout(() => {
      elA.classList.remove('flipped', 'wrong');
      elB.classList.remove('flipped', 'wrong');
      state.flipped = [];
      state.locked = false;
    }, LEVELS[state.currentLevel].flip * 1000);
  }

  function calculateStars() {
    const pairs = LEVELS[state.currentLevel].pairs;
    if (state.moves <= pairs * 2) {
      return 3;
    }
    if (state.moves <= pairs * 3) {
      return 2;
    }
    return 1;
  }

  function saveLevelProgress(levelNumber, stars) {
    const session = getSession();
    const accounts = getAccounts();
    if (!session || !accounts[session.name]) {
      return;
    }

    const account = accounts[session.name];
    if (!account.gameProgress) {
      account.gameProgress = {};
    }

    const bucket = account.gameProgress[GAME_KEY] || {};
    const previous = bucket[levelNumber] || {};
    const bestStars = Math.max(previous.stars || 0, stars);
    const bestScore = Math.max(previous.score || 0, state.totalScore);
    const bestMoves = previous.moves ? Math.min(previous.moves, state.moves) : state.moves;
    const bestTime = previous.time ? Math.min(previous.time, state.seconds) : state.seconds;
    const starGain = Math.max(0, bestStars - (previous.stars || 0));

    bucket[levelNumber] = {
      ...previous,
      completed: true,
      stars: bestStars,
      score: bestScore,
      moves: bestMoves,
      time: bestTime,
      updatedAt: Date.now()
    };

    account.gameProgress[GAME_KEY] = bucket;
    account.stars = (account.stars || 0) + starGain;
    if (!previous.completed) {
      account.gamesPlayed = (account.gamesPlayed || 0) + 1;
    }
    account.lastActivity = { game: 'Memory Match 15', level: levelNumber, timestamp: Date.now() };
    accounts[session.name] = account;
    saveAccounts(accounts);
    updateSaveNote();
  }

  function onLevelComplete() {
    stopTimer();
    const isFinal = state.currentLevel === LEVELS.length - 1;
    const pairs = LEVELS[state.currentLevel].pairs;
    const bonus = Math.max(0, (pairs * 2 - state.moves) * 5) + Math.max(0, 60 - state.seconds) * 2;
    const stars = calculateStars();

    state.score += bonus;
    state.totalScore += state.score;
    scoreEl.textContent = String(state.totalScore);
    saveLevelProgress(state.currentLevel + 1, stars);

    if (isFinal) {
      playMasterSound();
      spawnConfetti(160);
      showModal(
        'Champion!',
        `You cleared all 15 levels!<br>Total score: <strong>${state.totalScore}</strong><br><small style="opacity:.7">You are a Memory Master!</small>`,
        '🔁 Play Again',
        true,
        stars
      );
      return;
    }

    playLevelUpSound();
    spawnConfetti(60);
    showModal(
      `Level ${state.currentLevel + 1} Clear!`,
      `Bonus: <strong>+${bonus} pts</strong> | Total: <strong>${state.totalScore}</strong><br>Time: <strong>${state.seconds}s</strong> · Moves: <strong>${state.moves}</strong>`,
      `▶ Level ${state.currentLevel + 2}`,
      false,
      stars
    );
  }

  function showModal(title, body, buttonLabel, fullReset, stars) {
    modalTitle.textContent = title;
    modalStars.textContent = '⭐'.repeat(stars);
    modalBody.innerHTML = body;
    modalPlay.textContent = buttonLabel;
    modalPlay.dataset.fullReset = fullReset ? '1' : '0';
    modal.classList.add('show');
  }

  function startLevel(idx) {
    modal.classList.remove('show');
    state.currentLevel = Math.max(0, Math.min(LEVELS.length - 1, idx));
    state.cards = buildDeck(state.currentLevel);
    state.flipped = [];
    state.matched = new Set();
    state.score = 0;
    state.moves = 0;
    state.seconds = 0;
    state.locked = false;

    stopTimer();
    scoreEl.textContent = String(state.totalScore);
    timerEl.textContent = '0s';
    movesEl.textContent = '0';

    updateLevelUI();
    renderBoard();
  }

  function fullReset() {
    state.totalScore = 0;
    startLevel(0);
  }

  function spawnConfetti(count) {
    for (let i = 0; i < count; i += 1) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'confetti';
        el.style.cssText = `
          left:${Math.random() * 100}vw;
          top:-10px;
          background:${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
          width:${6 + Math.random() * 8}px;
          height:${6 + Math.random() * 8}px;
          border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
          animation-duration:${1.5 + Math.random() * 2}s;`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
      }, i * 30);
    }
  }

  restartBtn.addEventListener('click', fullReset);

  modalPlay.addEventListener('click', () => {
    if (modalPlay.dataset.fullReset === '1') {
      fullReset();
      return;
    }
    startLevel(state.currentLevel + 1);
  });

  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.totalScore = 0;
      startLevel(TIER_START[btn.dataset.level]);
    });
  });

  updateSaveNote();
  fullReset();
})();
