(function () {
  const GAME_KEY = 'puzzle-pals';
  const LEVELS = [
    { id: 1, name: 'The Kitty', difficulty: 'Very Easy', emoji: '🐱', label: 'Kitty Meadow', grid: { cols: 2, rows: 2 }, colors: ['#8fd8ff', '#fff1d7'], stars: [20, 40] },
    { id: 2, name: 'Happy Frog', difficulty: 'Easy', emoji: '🐸', label: 'Frog Pond', grid: { cols: 3, rows: 3 }, colors: ['#c9f5a6', '#6ecf95'], stars: [40, 80] },
    { id: 3, name: 'Clever Fox', difficulty: 'Medium', emoji: '🦊', label: 'Fox Sunset', grid: { cols: 4, rows: 4 }, colors: ['#ffd85c', '#ff7f3f'], stars: [70, 140] },
    { id: 4, name: 'Panda Fun', difficulty: 'Hard', emoji: '🐼', label: 'Panda Forest', grid: { cols: 5, rows: 5 }, colors: ['#dff7c2', '#97d56e'], stars: [120, 240] }
  ];

  const STATE = {
    currentLevel: null,
    pieces: [],
    totalPieces: 0,
    solvedCount: 0,
    startTime: 0,
    elapsedSec: 0,
    timerHandle: null,
    score: 0,
    levelScores: {},
    dragPiece: null,
    imageCanvas: null
  };

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  let dragEl = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let floatEl = null;
  let overPiece = null;

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

  function updateSaveNote() {
    const note = document.getElementById('save-note');
    const session = getSession();
    if (!note) {
      return;
    }
    if (getCurrentAccount()) {
      note.textContent = `Hi ${session.name}! Your stars and completed levels save automatically here.`;
      return;
    }
    note.textContent = 'Play now, or log in to save stars and completed levels in your profile.';
  }

  function loadSavedProgress() {
    STATE.levelScores = {};
    const bucket = getCurrentAccount()?.gameProgress?.[GAME_KEY] || {};
    Object.keys(bucket).forEach(levelId => {
      const item = bucket[levelId];
      if (!item) {
        return;
      }
      STATE.levelScores[Number(levelId)] = {
        stars: item.stars || 0,
        time: item.time || 0,
        score: item.score || 0
      };
    });
  }

  function saveLevelProgress(levelId, stars, time, score) {
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
    const previous = bucket[levelId] || {};
    const bestStars = Math.max(previous.stars || 0, stars);
    const bestTime = previous.time ? Math.min(previous.time, time) : time;
    const bestScore = Math.max(previous.score || 0, score);
    const starGain = Math.max(0, bestStars - (previous.stars || 0));

    bucket[levelId] = {
      ...previous,
      completed: true,
      stars: bestStars,
      time: bestTime,
      score: bestScore,
      lastPlayedAt: Date.now()
    };

    account.gameProgress[GAME_KEY] = bucket;
    account.stars = (account.stars || 0) + starGain;
    if (!previous.completed) {
      account.gamesPlayed = (account.gamesPlayed || 0) + 1;
    }
    account.lastActivity = { game: 'Puzzle Pals', level: levelId, timestamp: Date.now() };
    accounts[session.name] = account;
    saveAccounts(accounts);

    STATE.levelScores[levelId] = { stars: bestStars, time: bestTime, score: bestScore };
  }

  function ensureAudio() {
    if (!audioCtx && AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }

  function playPlaceSound() {
    if (!AudioCtx) {
      return;
    }
    ensureAudio();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.12);
  }

  function playWinSound() {
    if (!AudioCtx) {
      return;
    }
    ensureAudio();
    [523, 659, 784, 1047].forEach((freq, index) => {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const at = audioCtx.currentTime + index * 0.13;
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.45, at + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.32);
      oscillator.start(at);
      oscillator.stop(at + 0.34);
    });
  }

  function generateScene(level) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, level.colors[0]);
    gradient.addColorStop(1, level.colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 400);

    for (let index = 0; index < 10; index += 1) {
      ctx.fillStyle = `rgba(255,255,255,${0.12 + Math.random() * 0.14})`;
      ctx.beginPath();
      ctx.arc(30 + index * 38, 48 + (index % 3) * 22, 14 + (index % 4) * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.26)';
    ctx.beginPath();
    ctx.arc(330, 86, 54, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.fillRect(0, 285, 400, 115);

    ctx.font = '700 28px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(45,45,45,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(level.label, 200, 320);

    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(90, 336);
    ctx.lineTo(310, 336);
    ctx.quadraticCurveTo(330, 336, 330, 356);
    ctx.lineTo(330, 358);
    ctx.quadraticCurveTo(330, 378, 310, 378);
    ctx.lineTo(90, 378);
    ctx.quadraticCurveTo(70, 378, 70, 358);
    ctx.lineTo(70, 356);
    ctx.quadraticCurveTo(70, 336, 90, 336);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = '800 20px Nunito, sans-serif';
    ctx.fillStyle = '#5a4957';
    ctx.fillText(`${level.grid.cols}x${level.grid.rows} puzzle`, 200, 364);

    ctx.font = '200 160px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.fillText(level.emoji, 200, 230);

    return canvas;
  }

  function getBoardSize() {
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--shared-navbar-h'), 10) || 78;
    const maxByWidth = Math.min(window.innerWidth - 40, 500);
    const maxByHeight = Math.min(window.innerHeight - navHeight - 220, 500);
    return Math.max(200, Math.min(maxByWidth, maxByHeight));
  }

  function shuffle(array) {
    for (let index = array.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
    }
  }

  function buildShuffledIndices(total) {
    const indices = Array.from({ length: total }, (_, index) => index);
    do {
      shuffle(indices);
    } while (indices.every((value, index) => value === index));
    return indices;
  }

  function updateProgress() {
    const percent = Math.round((STATE.solvedCount / STATE.totalPieces) * 100);
    document.getElementById('progress-fill').style.width = `${percent}%`;
    document.getElementById('progress-label').textContent = `${percent}% Done`;
  }

  function tickTimer() {
    STATE.elapsedSec = Math.floor((Date.now() - STATE.startTime) / 1000);
    const minutes = Math.floor(STATE.elapsedSec / 60);
    const seconds = String(STATE.elapsedSec % 60).padStart(2, '0');
    document.getElementById('hud-timer').textContent = `${minutes}:${seconds}`;
  }

  function initLevel(level) {
    STATE.currentLevel = level;
    STATE.pieces = [];
    STATE.solvedCount = 0;
    STATE.score = 0;
    STATE.elapsedSec = 0;
    STATE.dragPiece = null;

    if (STATE.timerHandle) {
      clearInterval(STATE.timerHandle);
    }

    STATE.totalPieces = level.grid.cols * level.grid.rows;
    STATE.imageCanvas = generateScene(level);

    const boardSize = getBoardSize();
    const pieceWidth = Math.floor(boardSize / level.grid.cols);
    const pieceHeight = Math.floor(boardSize / level.grid.rows);
    const board = document.getElementById('puzzle-board');
    const preview = document.getElementById('preview-img');
    const imageUrl = STATE.imageCanvas.toDataURL();
    const indices = buildShuffledIndices(STATE.totalPieces);

    document.getElementById('hud-level').textContent = String(level.id);
    document.getElementById('hud-timer').textContent = '0:00';
    document.getElementById('hud-score').textContent = '0';
    preview.src = imageUrl;

    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${level.grid.cols}, ${pieceWidth}px)`;
    board.style.gridTemplateRows = `repeat(${level.grid.rows}, ${pieceHeight}px)`;
    board.style.width = `${pieceWidth * level.grid.cols}px`;
    board.style.height = `${pieceHeight * level.grid.rows}px`;

    indices.forEach((correctIndex, slotIndex) => {
      const sourceCol = correctIndex % level.grid.cols;
      const sourceRow = Math.floor(correctIndex / level.grid.cols);
      const piece = document.createElement('div');
      piece.className = 'piece';
      piece.style.width = `${pieceWidth}px`;
      piece.style.height = `${pieceHeight}px`;
      piece.style.backgroundImage = `url(${imageUrl})`;
      piece.style.backgroundSize = `${pieceWidth * level.grid.cols}px ${pieceHeight * level.grid.rows}px`;
      piece.style.backgroundPosition = `-${sourceCol * pieceWidth}px -${sourceRow * pieceHeight}px`;
      piece.style.backgroundRepeat = 'no-repeat';
      piece.dataset.correctIndex = String(correctIndex);
      piece.dataset.currentIndex = String(slotIndex);
      piece.addEventListener('mousedown', onDragStart, { passive: false });
      piece.addEventListener('touchstart', onDragStart, { passive: false });

      STATE.pieces.push({
        el: piece,
        correctIndex,
        currentIndex: slotIndex,
        solved: slotIndex === correctIndex
      });

      if (slotIndex === correctIndex) {
        piece.classList.add('correct');
        STATE.solvedCount += 1;
      }

      board.appendChild(piece);
    });

    updateProgress();
    STATE.startTime = Date.now();
    STATE.timerHandle = window.setInterval(tickTimer, 1000);
  }

  function moveFloat(clientX, clientY) {
    if (!floatEl) {
      return;
    }
    floatEl.style.left = `${clientX - dragOffsetX}px`;
    floatEl.style.top = `${clientY - dragOffsetY}px`;
  }

  function onDragStart(event) {
    event.preventDefault();
    const point = event.touches ? event.touches[0] : event;
    dragEl = event.currentTarget;
    const pieceIndex = STATE.pieces.findIndex(piece => piece.el === dragEl);
    if (pieceIndex === -1 || STATE.pieces[pieceIndex].solved) {
      return;
    }

    STATE.dragPiece = pieceIndex;
    const rect = dragEl.getBoundingClientRect();
    dragOffsetX = point.clientX - rect.left;
    dragOffsetY = point.clientY - rect.top;

    floatEl = dragEl.cloneNode(true);
    floatEl.style.position = 'fixed';
    floatEl.style.pointerEvents = 'none';
    floatEl.style.zIndex = '9999';
    floatEl.style.width = `${dragEl.offsetWidth}px`;
    floatEl.style.height = `${dragEl.offsetHeight}px`;
    floatEl.style.opacity = '0.88';
    floatEl.style.borderRadius = '8px';
    floatEl.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)';
    floatEl.style.transform = 'rotate(5deg) scale(1.08)';
    document.body.appendChild(floatEl);

    dragEl.style.opacity = '0.25';
    moveFloat(point.clientX, point.clientY);

    document.addEventListener('mousemove', onDragMove, { passive: false });
    document.addEventListener('mouseup', onDragEnd, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd, { passive: false });
  }

  function onDragMove(event) {
    event.preventDefault();
    const point = event.touches ? event.touches[0] : event;
    moveFloat(point.clientX, point.clientY);

    const target = document.elementFromPoint(point.clientX, point.clientY)?.closest('.piece') || null;
    if (overPiece && overPiece !== dragEl) {
      overPiece.classList.remove('drag-over');
    }
    overPiece = null;
    if (target && target !== dragEl && !target.classList.contains('correct')) {
      target.classList.add('drag-over');
      overPiece = target;
    }
  }

  function onDragEnd() {
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);

    if (floatEl) {
      floatEl.remove();
      floatEl = null;
    }
    if (dragEl) {
      dragEl.style.opacity = '';
    }
    if (overPiece) {
      overPiece.classList.remove('drag-over');
    }

    if (STATE.dragPiece !== null && overPiece && !overPiece.classList.contains('correct')) {
      const targetIndex = STATE.pieces.findIndex(piece => piece.el === overPiece);
      if (targetIndex !== -1) {
        swapPieces(STATE.dragPiece, targetIndex);
      }
    }

    STATE.dragPiece = null;
    dragEl = null;
    overPiece = null;
  }

  function swapPieces(sourceIndex, targetIndex) {
    const source = STATE.pieces[sourceIndex];
    const target = STATE.pieces[targetIndex];
    const board = document.getElementById('puzzle-board');
    const marker = document.createElement('div');

    board.insertBefore(marker, source.el);
    board.insertBefore(source.el, target.el);
    board.insertBefore(target.el, marker);
    marker.remove();

    [source.currentIndex, target.currentIndex] = [target.currentIndex, source.currentIndex];
    source.el.dataset.currentIndex = String(source.currentIndex);
    target.el.dataset.currentIndex = String(target.currentIndex);

    let gained = false;
    [source, target].forEach(piece => {
      if (piece.currentIndex === piece.correctIndex && !piece.solved) {
        piece.solved = true;
        piece.el.classList.add('correct');
        STATE.solvedCount += 1;
        gained = true;
      }
    });

    if (gained) {
      playPlaceSound();
      const bonus = Math.max(0, 10 - STATE.elapsedSec);
      STATE.score += 10 + Math.floor(bonus / 2);
      document.getElementById('hud-score').textContent = String(STATE.score);
    }

    updateProgress();
    if (STATE.solvedCount === STATE.totalPieces) {
      onPuzzleComplete();
    }
  }

  function getStarCount(level, elapsed) {
    if (elapsed <= level.stars[0]) {
      return 3;
    }
    if (elapsed <= level.stars[1]) {
      return 2;
    }
    return 1;
  }

  function onPuzzleComplete() {
    clearInterval(STATE.timerHandle);
    STATE.timerHandle = null;
    const stars = getStarCount(STATE.currentLevel, STATE.elapsedSec);
    saveLevelProgress(STATE.currentLevel.id, stars, STATE.elapsedSec, STATE.score);
    window.setTimeout(() => {
      playWinSound();
      showWinScreen(stars);
    }, 350);
  }

  function showWinScreen(stars) {
    const starsBox = document.getElementById('stars-display');
    const nextLevel = LEVELS.find(level => level.id === STATE.currentLevel.id + 1);
    const minutes = Math.floor(STATE.elapsedSec / 60);
    const seconds = String(STATE.elapsedSec % 60).padStart(2, '0');

    starsBox.innerHTML = '';
    for (let index = 1; index <= 3; index += 1) {
      const icon = document.createElement('span');
      icon.className = 'star-icon';
      icon.textContent = index <= stars ? '⭐' : '☆';
      starsBox.appendChild(icon);
    }

    document.getElementById('win-stats').textContent = `⏱ ${minutes}:${seconds}  |  🏆 ${STATE.score} pts`;
    document.getElementById('win-img').src = STATE.imageCanvas.toDataURL();
    document.getElementById('btn-next-level').style.display = nextLevel ? 'inline-block' : 'none';

    const burst = document.getElementById('confetti-burst');
    burst.innerHTML = '';
    ['#ffd93d', '#ff6b35', '#ff85a1', '#a259ff', '#4ecdc4', '#6bcb77'].forEach((color, group) => {
      for (let index = 0; index < 10; index += 1) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.background = color;
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.top = `${Math.random() * 40}%`;
        piece.style.width = `${8 + Math.random() * 10}px`;
        piece.style.height = `${8 + Math.random() * 10}px`;
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.animationDelay = `${group * 0.05 + Math.random() * 0.5}s`;
        piece.style.animationDuration = `${0.9 + Math.random() * 0.7}s`;
        burst.appendChild(piece);
      }
    });

    buildLevelCards();
    showScreen('screen-win');
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.toggle('active', screen.id === id);
    });
  }

  function refreshCardStars() {
    LEVELS.forEach(level => {
      const starsBox = document.getElementById(`card-stars-${level.id}`);
      const saved = STATE.levelScores[level.id];
      if (starsBox) {
        starsBox.textContent = saved ? `${'⭐'.repeat(saved.stars)}${'☆'.repeat(3 - saved.stars)}` : '';
      }
    });
  }

  function buildLevelCards() {
    const container = document.getElementById('level-cards');
    const diffClass = ['diff-easy', 'diff-easy', 'diff-medium', 'diff-hard'];
    container.innerHTML = '';
    LEVELS.forEach((level, index) => {
      const card = document.createElement('div');
      card.className = `level-card lc-${level.id}`;
      card.innerHTML = `
        <span class="lc-emoji">${level.emoji}</span>
        <div class="lc-name">${level.name}</div>
        <div class="lc-grid">${level.grid.cols}x${level.grid.rows} Grid</div>
        <span class="lc-diff ${diffClass[index]}">${level.difficulty}</span>
        <div class="lc-stars" id="card-stars-${level.id}"></div>
      `;
      card.addEventListener('click', () => startLevel(level));
      container.appendChild(card);
    });
    refreshCardStars();
  }

  function startLevel(level) {
    showScreen('screen-game');
    window.setTimeout(() => initLevel(level), 40);
  }

  function bindButtons() {
    document.getElementById('btn-start').addEventListener('click', () => startLevel(LEVELS[0]));
    document.getElementById('btn-levels').addEventListener('click', () => {
      loadSavedProgress();
      refreshCardStars();
      showScreen('screen-levels');
    });
    document.getElementById('btn-back-home').addEventListener('click', () => showScreen('screen-home'));
    document.getElementById('btn-back-levels').addEventListener('click', () => {
      clearInterval(STATE.timerHandle);
      STATE.timerHandle = null;
      loadSavedProgress();
      refreshCardStars();
      showScreen('screen-levels');
    });
    document.getElementById('btn-next-level').addEventListener('click', () => {
      const nextLevel = LEVELS.find(level => level.id === STATE.currentLevel.id + 1);
      if (nextLevel) {
        startLevel(nextLevel);
      }
    });
    document.getElementById('btn-win-menu').addEventListener('click', () => {
      loadSavedProgress();
      refreshCardStars();
      showScreen('screen-levels');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateSaveNote();
    loadSavedProgress();
    buildLevelCards();
    bindButtons();
    showScreen('screen-home');

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const gameScreen = document.getElementById('screen-game');
        if (STATE.currentLevel && gameScreen.classList.contains('active')) {
          const elapsed = STATE.elapsedSec;
          initLevel(STATE.currentLevel);
          STATE.elapsedSec = elapsed;
          STATE.startTime = Date.now() - elapsed * 1000;
          tickTimer();
        }
      }, 250);
    });
  });
})();
