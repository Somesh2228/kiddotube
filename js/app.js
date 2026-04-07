/* ═══════════════════════════════════════════════════════════════
   app.js  —  KiddoTube
   Includes: Stars animation + full app logic
   Data is read from HTML data-* attributes (no data.js needed)
═══════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   1. STARS CANVAS  (exported as initStars)
───────────────────────────────────────── */
function initStars() {
  const canvas = document.getElementById('stars-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  const EMOJIS = ['⭐','🌟','✨','💫'];

  const stars = Array.from({ length: 22 }, () => ({
    x:     Math.random() * window.innerWidth,
    y:     Math.random() * window.innerHeight,
    size:  12 + Math.random() * 12,
    phase: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 0.6,
    em:    EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    dx:    (Math.random() - 0.5) * 0.25,
    dy:    (Math.random() - 0.5) * 0.25,
  }));

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      ctx.globalAlpha = 0.1 + 0.12 * Math.sin(s.phase + t * s.speed * 0.001);
      ctx.font = `${s.size}px serif`;
      ctx.fillText(s.em, s.x, s.y);
      s.x += s.dx; s.y += s.dy;
      if (s.x < -20)    s.x = W + 20;
      if (s.x > W + 20) s.x = -20;
      if (s.y < -20)    s.y = H + 20;
      if (s.y > H + 20) s.y = -20;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

/* Auto-start stars if canvas exists on page load */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('stars-canvas')) initStars();

  /* ── Read HTML data-* stores and build JS arrays ── */
  if (document.getElementById('data-cats'))   loadDataFromHTML();
});

/* ─────────────────────────────────────────
   2. LOAD DATA FROM HTML data-* ELEMENTS
───────────────────────────────────────── */
let CATS = [], VIDEOS = [], TASKS_RAW = [], HW_RAW = [], GAMES = [];
let QUIZ_DATA = {};

function sortVideosForDisplay(items) {
  return [...items].sort((a, b) => {
    const aHasMedia = a.src ? 1 : 0;
    const bHasMedia = b.src ? 1 : 0;
    if (aHasMedia !== bHasMedia) return bHasMedia - aHasMedia;
    return a.id - b.id;
  });
}

function loadDataFromHTML() {
  /* Categories */
  CATS = [...document.querySelectorAll('#data-cats [data-id]')].map(el => ({
    id:    el.dataset.id,
    label: el.dataset.label,
    color: el.dataset.color,
  }));

  /* Videos */
  VIDEOS = [...document.querySelectorAll('#data-videos [data-id]')].map(el => ({
    id:    parseInt(el.dataset.id),
    title: el.dataset.title,
    emoji: el.dataset.emoji,
    dur:   el.dataset.dur,
    views: el.dataset.views,
    cat:   el.dataset.cat,
    short: el.dataset.short === 'true',
    bg:    el.dataset.bg,
    src:   el.dataset.src || '',
  }));

  /* Tasks */
  TASKS_RAW = [...document.querySelectorAll('#data-tasks [data-id]')].map(el => ({
    id:   parseInt(el.dataset.id),
    t:    el.dataset.t,
    s:    el.dataset.s,
    emoji:el.dataset.emoji,
    done: el.dataset.done === 'true',
  }));

  /* Homework */
  HW_RAW = [...document.querySelectorAll('#data-hw [data-id]')].map(el => ({
    id:   parseInt(el.dataset.id),
    t:    el.dataset.t,
    s:    el.dataset.s,
    emoji:el.dataset.emoji,
    done: el.dataset.done === 'true',
  }));

  /* Quiz questions grouped by topic */
  document.querySelectorAll('#data-quiz [data-topic]').forEach(el => {
    const topic = el.dataset.topic;
    if (!QUIZ_DATA[topic]) QUIZ_DATA[topic] = [];
    QUIZ_DATA[topic].push({
      q:    el.dataset.q,
      emoji:el.dataset.emoji,
      opts: JSON.parse(el.dataset.opts),
      ans:  parseInt(el.dataset.ans),
    });
  });

  /* Games list */
  GAMES = [...document.querySelectorAll('#data-games [data-id]')].map(el => ({
    id:    el.dataset.id,
    title: el.dataset.title,
    emoji: el.dataset.emoji,
    badge: el.dataset.badge,
    type:  el.dataset.type,
    topic: el.dataset.topic,
    path:  el.dataset.path || '',
  }));

  /* Initialise mutable state from raw data */
  state.tasks      = TASKS_RAW.map(t => ({ ...t }));
  state.hw         = HW_RAW.map(h => ({ ...h }));
  state.shortQueue = sortVideosForDisplay(VIDEOS.filter(v => v.short));
}

/* ─────────────────────────────────────────
   3. APP STATE
───────────────────────────────────────── */
let state = {
  avatar:         '🐣',
  userName:       '',
  activeCat:      'all',
  currentShort:   0,
  shortQueue:     [],
  currentVideoId: null,
  isVideoPlaying: false,
  isVideoMuted:   false,
  videoElapsed:   0,
  videoDuration:  0,
  videoTimer:     null,
  currentGame:    null,
  tasks:          [],
  hw:             [],
  stickers:       [],
  latestSticker:  '',
  voiceSearchActive: false,
  lastUploadMeta: null,
  uploadPreviewUrl: '',
  videoOrientationLocked: false,
};

/* ─────────────────────────────────────────
   4. UTILITIES
───────────────────────────────────────── */
function escapeHTML(v) {
  return String(v).replace(/[&<>"']/g, ch =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
}
function getSearchInput()  { return document.getElementById('search-input'); }
function getSearchQuery()  { return (getSearchInput()?.value || '').trim().toLowerCase(); }

const SURPRISE_VIDEO_HINTS = ['jadui', 'dinosaur', 'story', 'song', 'numbers', 'vowels'];
const PREVIEW_CLIP_MS = 3000;
let voiceRecognition = null;
let voiceSearchResetTimer = null;
const previewPlaybackTimers = new WeakMap();
const reelWheelState = new WeakMap();

const STICKER_REWARDS = ['🌟', '🏆', '🍭', '🦄', '🚀', '🎈'];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCurrentAccountContext() {
  try {
    const session = JSON.parse(localStorage.getItem('kiddotube_session') || 'null');
    const accounts = JSON.parse(localStorage.getItem('kiddotube_accounts') || '{}');
    if (!session || !accounts[session.name]) {
      return null;
    }
    return {
      session,
      accounts,
      account: accounts[session.name],
    };
  } catch (error) {
    console.error('Failed to read current account:', error);
    return null;
  }
}

function updateCurrentAccount(mutator) {
  const ctx = getCurrentAccountContext();
  if (!ctx) return null;

  mutator(ctx.account);
  ctx.accounts[ctx.session.name] = ctx.account;
  localStorage.setItem('kiddotube_accounts', JSON.stringify(ctx.accounts));
  return ctx.account;
}

function hydrateLearningProgress() {
  const ctx = getCurrentAccountContext();
  if (!ctx) return;

  const completedTaskIds = new Set(ctx.account.completedTaskIds || []);
  const completedHomeworkIds = new Set(ctx.account.completedHomeworkIds || []);
  state.tasks = TASKS_RAW.map(task => ({ ...task, done: completedTaskIds.has(task.id) || task.done }));
  state.hw = HW_RAW.map(item => ({ ...item, done: completedHomeworkIds.has(item.id) || item.done }));
  state.stickers = Array.isArray(ctx.account.stickers) ? ctx.account.stickers.filter(Boolean) : [];
  state.latestSticker = ctx.account.activeSticker || state.stickers[state.stickers.length - 1] || '';
}

function persistLearningProgress(extraMutator) {
  return updateCurrentAccount(account => {
    account.completedTaskIds = state.tasks.filter(task => task.done).map(task => task.id);
    account.completedHomeworkIds = state.hw.filter(item => item.done).map(item => item.id);
    account.tasksDone = account.completedTaskIds.length + account.completedHomeworkIds.length;
    account.stickers = [...state.stickers];
    account.activeSticker = state.latestSticker || '';
    if (typeof extraMutator === 'function') {
      extraMutator(account);
    }
  });
}

function ensureProfileStickerShelf() {
  const hero = document.querySelector('.profile-hero');
  if (!hero) return null;

  let shelf = document.getElementById('profile-sticker-shelf');
  if (!shelf) {
    shelf = document.createElement('div');
    shelf.id = 'profile-sticker-shelf';
    shelf.className = 'profile-sticker-shelf';
    hero.appendChild(shelf);
  }
  return shelf;
}

function syncRewardBadgeUI() {
  const sticker = state.latestSticker || '';
  ['topbar-avatar', 'sb-user-icon', 'p-emoji'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.sticker = sticker;
    el.classList.toggle('has-sticker', !!sticker);
  });

  const shelf = ensureProfileStickerShelf();
  if (shelf) {
    if (state.stickers.length) {
      const chips = state.stickers.slice(-5).map(item =>
        `<span class="profile-sticker-chip">${escapeHTML(item)}</span>`).join('');
      shelf.innerHTML = `<span class="profile-sticker-label">Sticker Shelf</span>${chips}`;
    } else {
      shelf.innerHTML = `<span class="profile-sticker-label">Finish your learning tasks to collect stickers.</span>`;
    }
  }

  const ctx = getCurrentAccountContext();
  const stars = ctx?.account?.stars || 0;
  const starsEl = document.getElementById('stat-stars');
  if (starsEl) starsEl.textContent = `⭐${stars}`;
}

function ensureTaskCelebrationOverlay() {
  if (document.getElementById('task-reward-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'task-reward-overlay';
  overlay.className = 'task-reward-overlay hidden';
  overlay.innerHTML = `
    <div class="task-reward-card">
      <div class="task-reward-mascot">🐣</div>
      <div class="task-reward-title">You Did It!</div>
      <div class="task-reward-copy" id="task-reward-copy">Amazing job finishing your learning video.</div>
      <div class="task-reward-sticker" id="task-reward-sticker">🌟</div>
      <button class="task-reward-button" type="button" onclick="closeTaskRewardOverlay()">Yay!</button>
    </div>`;
  document.body.appendChild(overlay);
}

let taskRewardOverlayTimer = null;

function closeTaskRewardOverlay() {
  const overlay = document.getElementById('task-reward-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  document.body.classList.remove('task-reward-open');
  if (taskRewardOverlayTimer) {
    clearTimeout(taskRewardOverlayTimer);
    taskRewardOverlayTimer = null;
  }
}

window.closeTaskRewardOverlay = closeTaskRewardOverlay;

function showTaskRewardOverlay(task, video, sticker) {
  ensureTaskCelebrationOverlay();
  const overlay = document.getElementById('task-reward-overlay');
  const copy = document.getElementById('task-reward-copy');
  const reward = document.getElementById('task-reward-sticker');
  if (!overlay || !copy || !reward) return;

  copy.textContent = `${task.t} is complete. ${video.title} earned you a shiny sticker!`;
  reward.textContent = sticker;
  overlay.classList.remove('hidden');
  document.body.classList.add('task-reward-open');
  confetti();

  if (taskRewardOverlayTimer) clearTimeout(taskRewardOverlayTimer);
  taskRewardOverlayTimer = setTimeout(closeTaskRewardOverlay, 3200);
}

function findPendingTaskForVideo(video) {
  if (!video) return null;
  return state.tasks.find(task => {
    if (task.done) return false;
    const taskText = normalizeText(`${task.t} ${task.s}`);
    if (taskText.includes('abc')) return video.cat === 'abc';
    if (taskText.includes('count') || taskText.includes('math') || taskText.includes('number')) return video.cat === 'numbers';
    if (taskText.includes('poem')) return video.cat === 'poems';
    return normalizeText(video.title).includes(normalizeText(task.t));
  }) || null;
}

function rewardTaskFromVideo(video) {
  const task = findPendingTaskForVideo(video);
  if (!task) return;

  task.done = true;
  const sticker = STICKER_REWARDS[state.stickers.length % STICKER_REWARDS.length];
  state.stickers.push(sticker);
  state.latestSticker = sticker;

  persistLearningProgress(account => {
    account.stars = (account.stars || 0) + 5;
    account.lastRewardedVideoId = video.id;
  });

  renderTasks();
  syncRewardBadgeUI();
  if (typeof window.refreshProfilePanel === 'function') {
    window.refreshProfilePanel();
  }
  showTaskRewardOverlay(task, video, sticker);
}

function ensureVoiceSearchButton() {
  const wrap = document.querySelector('[data-nav-search-wrap]');
  if (!wrap) return null;

  let button = document.getElementById('search-voice');
  if (!button) {
    button = document.createElement('button');
    button.id = 'search-voice';
    button.type = 'button';
    button.className = 'shared-navbar-voice';
    button.setAttribute('aria-label', 'Start voice search');
    button.title = 'Start voice search';
    button.innerHTML = '&#127908;';
    const clear = document.getElementById('search-clear');
    if (clear) {
      wrap.insertBefore(button, clear);
    } else {
      wrap.appendChild(button);
    }
  }

  return button;
}

function setVoiceSearchButtonState(active, message) {
  const input = getSearchInput();
  const button = ensureVoiceSearchButton();
  state.voiceSearchActive = !!active;

  if (voiceSearchResetTimer) {
    clearTimeout(voiceSearchResetTimer);
    voiceSearchResetTimer = null;
  }

  if (button) {
    const label = active ? 'Stop voice search' : 'Start voice search';
    button.classList.toggle('is-listening', !!active);
    button.setAttribute('aria-label', label);
    button.title = message || label;
  }

  if (!input) return;

  if (active) {
    input.placeholder = 'Listening... say a video name';
    return;
  }

  input.placeholder = message || 'Search videos...';
  if (message) {
    voiceSearchResetTimer = setTimeout(() => {
      input.placeholder = 'Search videos...';
      if (button) button.title = 'Start voice search';
    }, 2200);
  }
}

function stopVoiceSearch() {
  if (!voiceRecognition) return;

  const activeRecognition = voiceRecognition;
  voiceRecognition = null;
  activeRecognition.onresult = null;
  activeRecognition.onerror = null;
  activeRecognition.onstart = null;
  activeRecognition.onend = null;
  activeRecognition.abort();
  setVoiceSearchButtonState(false);
}

function startVoiceSearch() {
  const input = getSearchInput();
  const button = ensureVoiceSearchButton();
  if (!input || !button) return;

  const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!RecognitionCtor) {
    input.focus();
    setVoiceSearchButtonState(false, 'Voice search is not supported on this device');
    return;
  }

  if (voiceRecognition) {
    stopVoiceSearch();
    return;
  }

  const recognition = new RecognitionCtor();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    voiceRecognition = recognition;
    input.focus();
    setVoiceSearchButtonState(true);
  };

  recognition.onresult = event => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (!transcript) return;
    input.value = transcript;
    filterContent();
    recognition._statusMessage = `Showing results for "${transcript}"`;
  };

  recognition.onerror = event => {
    const errorKey = event?.error || 'default';
    const messages = {
      'not-allowed': 'Microphone permission was blocked',
      'audio-capture': 'No microphone was found',
      'no-speech': 'No speech heard. Try again',
      default: 'Voice search could not start',
    };
    recognition._statusMessage = messages[errorKey] || messages.default;
  };

  recognition.onend = () => {
    const statusMessage = recognition._statusMessage || '';
    if (voiceRecognition === recognition) {
      voiceRecognition = null;
    }
    setVoiceSearchButtonState(false, statusMessage);
  };

  recognition.start();
}

function pickSurpriseVideo() {
  const playableLongVideos = sortVideosForDisplay(VIDEOS.filter(video => !video.short && video.src));
  const featuredPool = playableLongVideos.filter(video =>
    SURPRISE_VIDEO_HINTS.some(hint => normalizeText(video.title).includes(hint)));
  const pool = featuredPool.length ? featuredPool : (playableLongVideos.length ? playableLongVideos : getLongVideoQueue());
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function openSurpriseVideo() {
  const surpriseVideo = pickSurpriseVideo();
  if (!surpriseVideo) return;
  confetti();
  openVideoDetail(surpriseVideo.id);
}

function ensureMagicSurpriseButton() {
  const panel = document.getElementById('panel-home');
  if (!panel) return;

  let banner = document.getElementById('magic-pick-band');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'magic-pick-band';
    banner.className = 'magic-pick-band';
    banner.innerHTML = `
      <div class="magic-pick-copy">
        <strong>Magic Pick</strong>
        <span>Tap the mystery button for a happy random lesson.</span>
      </div>
      <button class="magic-pick-button" id="magic-pick-button" type="button">
        <span class="magic-pick-icon" aria-hidden="true">&#127873;</span>
        <span>Surprise Me</span>
      </button>`;
    panel.insertBefore(banner, panel.firstElementChild || null);
  }

  const button = document.getElementById('magic-pick-button');
  if (button && !button.dataset.boundToApp) {
    button.dataset.boundToApp = 'true';
    button.addEventListener('click', openSurpriseVideo);
  }
}

function clearPreviewTimer(media) {
  const timer = previewPlaybackTimers.get(media);
  if (timer) {
    clearTimeout(timer);
    previewPlaybackTimers.delete(media);
  }
}

function stopPreviewClip(media) {
  if (!media) return;
  clearPreviewTimer(media);
  try {
    media.pause();
    media.currentTime = 0;
  } catch (error) {
    void error;
  }
  const card = media.closest('.reel-card, .vid-card, .rel-item');
  if (card) card.classList.remove('is-previewing');
}

function startPreviewClip(media) {
  if (!media) return;

  document.querySelectorAll('[data-preview-media="true"]').forEach(node => {
    if (node !== media) stopPreviewClip(node);
  });

  const card = media.closest('.reel-card, .vid-card, .rel-item');
  if (!card) return;

  clearPreviewTimer(media);
  card.classList.add('is-previewing');
  media.muted = true;
  media.loop = false;

  try {
    media.currentTime = 0;
  } catch (error) {
    void error;
  }

  const playPromise = media.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }

  const stopTimer = setTimeout(() => stopPreviewClip(media), PREVIEW_CLIP_MS);
  previewPlaybackTimers.set(media, stopTimer);
}

function bindPreviewMedia() {
  document.querySelectorAll('[data-preview-media="true"]').forEach(media => {
    if (media.dataset.previewBound) return;
    media.dataset.previewBound = 'true';
    media.muted = true;
    media.loop = false;
    media.controls = false;

    const card = media.closest('.reel-card, .vid-card, .rel-item');
    if (!card) return;

    card.addEventListener('pointerenter', () => {
      if (!window.matchMedia('(hover: hover)').matches) return;
      startPreviewClip(media);
    });
    card.addEventListener('pointerleave', () => stopPreviewClip(media));
    card.addEventListener('focusin', () => startPreviewClip(media));
    card.addEventListener('focusout', () => stopPreviewClip(media));
    card.addEventListener('click', () => stopPreviewClip(media));
  });
}

function upgradeVideoControlFrame() {
  const controls = document.querySelector('.vd-controls');
  const progressRow = document.querySelector('.vd-progress-row');
  if (!controls || !progressRow || controls.dataset.frameStyleReady) return;

  progressRow.innerHTML = `
    <div class="vd-progress-track" role="slider" aria-label="Video progress" onclick="seekVideo(event)">
      <div class="vd-progress-fill" id="vd-progress-fill"></div>
    </div>`;

  controls.innerHTML = `
    <div class="vd-controls-left">
      <button class="vd-control" id="vd-play-control" type="button" onclick="playVideo()">&#9654;</button>
      <button class="vd-control" id="vd-prev-control" type="button" onclick="playPreviousVideo()">&#9198;</button>
      <button class="vd-control" id="vd-next-control" type="button" onclick="playNextVideo()">&#9197;</button>
      <button class="vd-control" id="vd-mute-control" type="button" onclick="toggleMuteVideo()">&#128266;</button>
      <button class="vd-control vd-control-hidden" id="vd-pause-control" type="button" onclick="pauseVideo()">&#10074;&#10074;</button>
      <div class="vd-time-inline">
        <span class="vd-time" id="vd-time-current">0:00</span>
        <span class="vd-time-sep">/</span>
        <span class="vd-time" id="vd-time-total">0:00</span>
      </div>
      <button class="vd-context-pill" type="button">In this video &#8250;</button>
    </div>
    <div class="vd-controls-right">
      <button class="vd-control vd-control-ghost" id="vd-captions-control" type="button">CC</button>
      <button class="vd-control vd-control-ghost" id="vd-settings-control" type="button">&#9881;</button>
      <button class="vd-control" id="vd-pip-control" type="button" onclick="toggleVideoPictureInPicture()">PiP</button>
      <button class="vd-control" id="vd-restart-control" type="button" onclick="restartVideo()">&#8635;</button>
      <button class="vd-control" id="vd-fullscreen-control" type="button" onclick="toggleVideoFullscreen()">&#x26F6;</button>
    </div>`;

  controls.dataset.frameStyleReady = 'true';
}

function seekVideo(event) {
  const track = event?.currentTarget;
  if (!track || !state.videoDuration) return;

  const rect = track.getBoundingClientRect();
  if (!rect.width) return;
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const nextTime = ratio * state.videoDuration;
  const media = document.getElementById('vd-player-media');

  state.videoElapsed = nextTime;
  if (media) {
    try {
      media.currentTime = nextTime;
    } catch (error) {
      void error;
    }
  }
  syncVideoPlaybackUI();
}

async function toggleVideoPictureInPicture() {
  const media = document.getElementById('vd-player-media');
  if (!media || typeof document === 'undefined') return;

  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture().catch(() => {});
    return;
  }

  if (document.pictureInPictureEnabled && typeof media.requestPictureInPicture === 'function') {
    await media.requestPictureInPicture().catch(() => {});
  }
}

function bindAppTopbar() {
  const input = getSearchInput();
  const clear = document.getElementById('search-clear');
  const voice = ensureVoiceSearchButton();

  if (input && !input.dataset.boundToApp) {
    input.dataset.boundToApp = 'true';
    input.addEventListener('input', filterContent);
  }

  if (clear && !clear.dataset.boundToApp) {
    clear.dataset.boundToApp = 'true';
    clear.addEventListener('click', clearSearch);
  }

  if (voice && !voice.dataset.boundToApp) {
    voice.dataset.boundToApp = 'true';
    voice.addEventListener('click', startVoiceSearch);
  }
}

function getNearestReelCardIndex(row, cards) {
  const left = row.scrollLeft;
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  cards.forEach((card, index) => {
    const distance = Math.abs(card.offsetLeft - left);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function scrollReelRowByCard(row, direction) {
  const cards = Array.from(row.querySelectorAll('.reel-card'));
  if (!cards.length) return;

  const currentIndex = getNearestReelCardIndex(row, cards);
  const nextIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
  row.scrollTo({
    left: cards[nextIndex].offsetLeft,
    behavior: 'smooth',
  });
}

function highlightReelNavigation(row, direction) {
  const shell = row.closest('.reels-shell');
  if (!shell) return;

  const prevBtn = shell.querySelector('[data-reels-nav="prev"]');
  const nextBtn = shell.querySelector('[data-reels-nav="next"]');
  const activeBtn = direction > 0 ? nextBtn : prevBtn;

  if (!activeBtn) return;

  clearTimeout(activeBtn._pulseTimer);
  if (prevBtn && prevBtn !== activeBtn) prevBtn.classList.remove('is-active');
  if (nextBtn && nextBtn !== activeBtn) nextBtn.classList.remove('is-active');
  activeBtn.classList.add('is-active');
  activeBtn._pulseTimer = setTimeout(() => {
    activeBtn.classList.remove('is-active');
  }, 260);
}

function updateReelNavigationState(row) {
  const shell = row.closest('.reels-shell');
  if (!shell) return;

  const prevBtn = shell.querySelector('[data-reels-nav="prev"]');
  const nextBtn = shell.querySelector('[data-reels-nav="next"]');
  const canScroll = row.scrollWidth > row.clientWidth + 4;
  const maxScrollLeft = Math.max(0, row.scrollWidth - row.clientWidth);

  shell.classList.toggle('has-scroll', canScroll);
  if (prevBtn) prevBtn.disabled = !canScroll || row.scrollLeft <= 4;
  if (nextBtn) nextBtn.disabled = !canScroll || row.scrollLeft >= maxScrollLeft - 4;
}

function ensureReelNavigationShells() {
  document.querySelectorAll('.reels-row').forEach(row => {
    let shell = row.closest('.reels-shell');
    if (!shell) {
      shell = document.createElement('div');
      shell.className = 'reels-shell';
      row.parentNode.insertBefore(shell, row);
      shell.appendChild(row);
    }

    let prevBtn = shell.querySelector('[data-reels-nav="prev"]');
    if (!prevBtn) {
      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'reels-nav reels-nav-prev';
      prevBtn.dataset.reelsNav = 'prev';
      prevBtn.setAttribute('aria-label', 'Previous reels');
      prevBtn.innerHTML = '&#8249;';
      shell.insertBefore(prevBtn, row);
    }

    let nextBtn = shell.querySelector('[data-reels-nav="next"]');
    if (!nextBtn) {
      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'reels-nav reels-nav-next';
      nextBtn.dataset.reelsNav = 'next';
      nextBtn.setAttribute('aria-label', 'Next reels');
      nextBtn.innerHTML = '&#8250;';
      shell.appendChild(nextBtn);
    }

    if (!shell.dataset.boundNav) {
      shell.dataset.boundNav = 'true';
      prevBtn.addEventListener('click', () => scrollReelRowByCard(row, -1));
      nextBtn.addEventListener('click', () => scrollReelRowByCard(row, 1));

      let scrollTimer = null;
      row.addEventListener('scroll', () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => updateReelNavigationState(row), 24);
      }, { passive: true });

      window.addEventListener('resize', () => updateReelNavigationState(row));
    }

    updateReelNavigationState(row);
  });
}

function bindReelScrollRows() {
  document.querySelectorAll('.reels-row').forEach(row => {
    if (row.dataset.boundWheelScroll) return;
    row.dataset.boundWheelScroll = 'true';
    row.addEventListener('wheel', event => {
      const canScrollHorizontally = row.scrollWidth > row.clientWidth;
      const deltaY = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const deltaX = event.deltaMode === 1 ? event.deltaX * 16 : event.deltaX;

      if (!canScrollHorizontally || Math.abs(deltaY) < 12 || Math.abs(deltaX) > Math.abs(deltaY)) return;

      let stateForRow = reelWheelState.get(row);
      if (!stateForRow) {
        stateForRow = {
          delta: 0,
          locked: false,
          resetTimer: null,
          unlockTimer: null,
        };
        reelWheelState.set(row, stateForRow);
      }

      event.preventDefault();
      if (stateForRow.locked) return;

      stateForRow.delta += deltaY;
      if (stateForRow.resetTimer) clearTimeout(stateForRow.resetTimer);
      stateForRow.resetTimer = setTimeout(() => {
        stateForRow.delta = 0;
      }, 140);

      if (Math.abs(stateForRow.delta) < 48) return;

      const direction = stateForRow.delta > 0 ? 1 : -1;
      stateForRow.delta = 0;
      stateForRow.locked = true;
      highlightReelNavigation(row, direction);
      scrollReelRowByCard(row, direction);

      if (stateForRow.unlockTimer) clearTimeout(stateForRow.unlockTimer);
      stateForRow.unlockTimer = setTimeout(() => {
        stateForRow.locked = false;
      }, 420);

      setTimeout(() => updateReelNavigationState(row), 420);
    }, { passive: false });
  });
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

/* ─────────────────────────────────────────
   5. CONFETTI
───────────────────────────────────────── */
function confetti() {
  const colors = ['#FF6B6B','#FF9F43','#FECA57','#48DBFB','#FF9FF3','#1DD1A1'];
  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const x = 40 + Math.random() * (window.innerWidth - 80);
    const y = 40 + Math.random() * (window.innerHeight / 2);
    el.style.cssText = `left:${x}px;top:${y}px;` +
      `background:${colors[Math.floor(Math.random()*colors.length)]};` +
      `border-radius:${Math.random()>0.5?'50%':'2px'};` +
      `--dx:${(Math.random()-0.5)*260}px;` +
      `--dy:${80+Math.random()*200}px;` +
      `--rot:${Math.random()*720}deg;` +
      `--dur:${0.8+Math.random()*0.7}s;` +
      `width:${8+Math.random()*8}px;height:${8+Math.random()*8}px;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
}

/* ─────────────────────────────────────────
   6. BOOK → LOGIN
───────────────────────────────────────── */
function openBook() {
  const overlay = document.getElementById('opening-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('page-book').classList.remove('active');
    overlay.classList.add('hidden');
    showPage('page-login');
  }, 1300);
}

/* ─────────────────────────────────────────
   7. AVATAR & LOGIN
───────────────────────────────────────── */
function pickAvatar(el) {
  document.querySelectorAll('.avatar-opt').forEach(e => e.classList.remove('sel'));
  el.classList.add('sel');
  state.avatar = el.dataset.av;
  const disp = document.getElementById('login-avatar-display');
  if (disp) disp.textContent = state.avatar;
}

function doLogin() {
  const nameEl = document.getElementById('login-name');
  state.userName = (nameEl?.value || '').trim() || 'Little Star';
  const card = document.getElementById('login-card');
  if (card) card.classList.add('flip-out');
  setTimeout(() => { showPage('page-app'); initApp(); }, 700);
}

document.addEventListener('DOMContentLoaded', () => {
  const n = document.getElementById('login-name');
  const p = document.getElementById('login-pass');
  if (n) n.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  if (p) p.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});

/* ─────────────────────────────────────────
   8. LOGOUT
───────────────────────────────────────── */
function doLogout() {
  stopVoiceSearch();
  const defaultAv = document.querySelector('.avatar-opt')?.dataset.av || '🐣';
  state = {
    avatar: defaultAv, userName: '', activeCat: 'all',
    currentShort: 0, shortQueue: sortVideosForDisplay(VIDEOS.filter(v => v.short)),
    currentVideoId: null, isVideoPlaying: false, isVideoMuted: false, videoElapsed: 0, videoDuration: 0, videoTimer: null, currentGame: null,
    tasks: TASKS_RAW.map(t => ({ ...t })),
    hw:    HW_RAW.map(h => ({ ...h })),
    stickers:       [],
    latestSticker:  '',
    voiceSearchActive: false,
    lastUploadMeta: null,
    uploadPreviewUrl: '',
    videoOrientationLocked: false,
  };
  const loginName  = document.getElementById('login-name');
  const loginPass  = document.getElementById('login-pass');
  const searchInp  = document.getElementById('search-input');
  const searchClr  = document.getElementById('search-clear');
  if (loginName) loginName.value = '';
  if (loginPass) loginPass.value = '';
  if (searchInp) searchInp.value = '';
  if (searchClr) searchClr.classList.add('hidden');
  document.querySelectorAll('.avatar-opt').forEach(e => e.classList.remove('sel'));
  const first = document.querySelector('.avatar-opt');
  if (first) { first.classList.add('sel'); }
  const disp = document.getElementById('login-avatar-display');
  if (disp) disp.textContent = defaultAv;
  const card = document.getElementById('login-card');
  if (card) { card.classList.remove('flip-out'); void card.offsetWidth; }
  showPage('page-login');
}

/* ─────────────────────────────────────────
   9. INIT APP
───────────────────────────────────────── */
function initApp() {
  upgradeVideoControlFrame();
  ensureReelNavigationShells();
  bindAppTopbar();
  bindReelScrollRows();
  ensureTaskCelebrationOverlay();
  ensureMagicSurpriseButton();
  hydrateLearningProgress();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('topbar-avatar',  state.avatar);
  set('sb-user-icon',   state.avatar);
  set('sb-user-name',   state.userName);
  set('p-emoji',        state.avatar);
  set('p-name',         state.userName);
  set('p-email',        state.userName.toLowerCase().replace(/\s/g,'') + '@kiddotube.fun');
  buildCats();
  renderAll();
  renderTasks();
  renderHW();
  renderGames();
  renderUploadPanel();
  syncRewardBadgeUI();
  goTab('home');
}

/* ─────────────────────────────────────────
   10. CATEGORY PILLS
───────────────────────────────────────── */
function buildCats() {
  const row = document.getElementById('cat-scroll');
  if (!row) return;
  row.innerHTML = '';
  CATS.forEach(c => {
    const el = document.createElement('div');
    el.className = 'cat-pill' + (state.activeCat === c.id ? ' active' : '');
    el.textContent = c.label;
    if (state.activeCat === c.id) el.style.background = c.color;
    el.onclick = () => { state.activeCat = c.id; buildCats(); renderAll(); };
    row.appendChild(el);
  });
}

/* ─────────────────────────────────────────
   11. VIDEO FILTERS & RENDERING
───────────────────────────────────────── */
function getFilteredVideos(short) {
  const q = getSearchQuery();
  return sortVideosForDisplay(VIDEOS.filter(v =>
    v.short === short &&
    (state.activeCat === 'all' || v.cat === state.activeCat) &&
    (!q || `${v.title} ${v.cat}`.toLowerCase().includes(q))
  ));
}

function emptyState(title, text) {
  const hasFilters = state.activeCat !== 'all' || !!getSearchQuery();
  return `<div class="empty-state">
    <h3>${title}</h3><p>${text}</p>
    ${hasFilters ? '<button class="empty-reset" type="button" onclick="resetFilters()">Clear filters</button>' : ''}
  </div>`;
}

function previewFallbackMarkup(className, emoji) {
  return `<span class="${className} media-fallback">${escapeHTML(emoji || '🎬')}</span>`;
}

function previewVideoMarkup(className, src) {
  return `<video class="${className}" src="${escapeHTML(src)}" muted playsinline preload="metadata" data-preview-media="true" onloadeddata="handlePreviewMediaState(this,true)" onerror="handlePreviewMediaState(this,false)"></video>`;
}

function handlePreviewMediaState(media, isReady) {
  const wrap = media?.parentElement;
  if (!wrap) return;
  wrap.classList.toggle('media-ready', !!isReady);
  media.classList.toggle('hidden', !isReady);
  if (!isReady) {
    try {
      media.pause();
    } catch (error) {
      void error;
    }
  }
}

window.handlePreviewMediaState = handlePreviewMediaState;

function reelCard(v) {
  return `<div class="reel-card" style="background:${v.bg}" onclick="openShort(${v.id})">
    <div class="reel-thumb">
      ${previewFallbackMarkup('reel-fallback', v.emoji)}
      ${v.src ? previewVideoMarkup('reel-media', v.src) : ''}
    </div>
    <div class="reel-grad"><div class="reel-title">${v.title}</div><div class="reel-dur">⏱ ${v.dur}</div></div>
    <div class="reel-play-badge">▶</div>
  </div>`;
}

function vidCard(v) {
  return `<div class="vid-card" onclick="openVideoDetail(${v.id})">
    <div class="vid-thumb" style="background:${v.bg}">
      ${previewFallbackMarkup('vid-fallback', v.emoji)}
      ${v.src ? previewVideoMarkup('vid-media', v.src) : ''}
      <div class="vid-dur">${v.dur}</div>
    </div>
    <div class="vid-info"><div class="vid-title">${v.title}</div><div class="vid-views">👁 ${v.views}</div></div>
  </div>`;
}

function renderList(id, items, renderer, fallback) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = items.length ? items.map(renderer).join('') : fallback;
}

function updateResultsBars(shortCount, longCount) {
  const q      = getSearchQuery();
  const clrBtn = document.getElementById('search-clear');
  if (clrBtn) clrBtn.classList.toggle('hidden', !q);
  const activeCat = CATS.find(c => c.id === state.activeCat);
  const notes = [];
  if (state.activeCat !== 'all' && activeCat) notes.push(activeCat.label);
  if (q) notes.push(`"${escapeHTML(q)}"`);
  const summary = notes.length ? `Filtered by ${notes.join(' / ')}` : 'Showing all videos';
  const setBar = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  setBar('results-bar-home',   `<span>${summary}</span><strong>${shortCount} reels &middot; ${longCount} long videos</strong>`);
  setBar('results-bar-shorts', `<span>${summary}</span><strong>${shortCount} reels</strong>`);
  setBar('results-bar-long',   `<span>${summary}</span><strong>${longCount} long videos</strong>`);
}

function renderAll() {
  const fshorts = getFilteredVideos(true);
  const flongs  = getFilteredVideos(false);
  state.shortQueue = fshorts.length ? [...fshorts] : sortVideosForDisplay(VIDEOS.filter(v => v.short));
  renderList('reels-row',        fshorts, reelCard, emptyState('No reels found',        'Try a different search or clear the filter.'));
  renderList('home-long-grid',   flongs,  vidCard,  emptyState('No long videos found',  'Change the search or clear the filter.'));
  renderList('shorts-reels-row', fshorts, reelCard, emptyState('No reels yet',          'Another search word should bring some back.'));
  renderList('shorts-long-grid', flongs,  vidCard,  emptyState('No long videos found',  'Try a broader search or reset the category.'));
  renderList('long-grid',        flongs,  vidCard,  emptyState('Nothing matches',        'Clear filters to see the full library.'));
  updateResultsBars(fshorts.length, flongs.length);
  ensureReelNavigationShells();
  document.querySelectorAll('.reels-row').forEach(updateReelNavigationState);
  bindPreviewMedia();
}

function filterContent() { renderAll(); }

function clearSearch() {
  const input = getSearchInput();
  if (!input) return;
  input.value = '';
  filterContent();
  input.focus();
}

function resetFilters() {
  state.activeCat = 'all';
  const input = getSearchInput();
  if (input) input.value = '';
  buildCats();
  filterContent();
}

/* ─────────────────────────────────────────
   12. TAB NAVIGATION
───────────────────────────────────────── */
const PANELS = ['home','shorts','long','upload','profile','tasks','homework','games'];

function goTab(tab) {
  document.querySelectorAll('.sb-item').forEach(el =>
    el.classList.toggle('active', el.dataset.tab === tab));
  document.querySelectorAll('.bn-btn').forEach(el =>
    el.classList.toggle('active', el.dataset.tab === tab));
  PANELS.forEach(id => {
    const p = document.getElementById('panel-' + id);
    if (p) p.classList.toggle('visible', id === tab);
  });
  if (tab === 'upload') {
    renderUploadPanel();
  }
  closeMobileSidebar();
}

function isMobileSidebarMode() {
  return window.innerWidth <= 639;
}

function isMobileVideoMode() {
  return window.matchMedia('(max-width: 760px)').matches;
}

function toggleMobileSidebar() {
  if (!isMobileSidebarMode()) {
    window.location.href = 'app.html';
    return;
  }
  document.body.classList.toggle('mobile-sidebar-open');
}

function closeMobileSidebar() {
  document.body.classList.remove('mobile-sidebar-open');
}

window.addEventListener('resize', () => {
  if (!isMobileSidebarMode()) {
    closeMobileSidebar();
  }
});

function openLearnPage() {
  closeMobileSidebar();
  window.location.href = 'Learn.html';
}

function openUploadPage() {
  closeMobileSidebar();
  window.location.href = 'upload.html';
}

function openProfilePage() {
  closeMobileSidebar();
  window.location.href = 'profile.html';
}

function getStoredUploadMeta() {
  try {
    const session = JSON.parse(localStorage.getItem('kiddotube_session') || 'null');
    const accounts = JSON.parse(localStorage.getItem('kiddotube_accounts') || '{}');
    if (!session || !accounts[session.name]) {
      return null;
    }
    return accounts[session.name].lastUpload || null;
  } catch (error) {
    console.error('Failed to read upload metadata:', error);
    return null;
  }
}

function saveStoredUploadMeta(meta) {
  try {
    const session = JSON.parse(localStorage.getItem('kiddotube_session') || 'null');
    const accounts = JSON.parse(localStorage.getItem('kiddotube_accounts') || '{}');
    if (!session || !accounts[session.name]) {
      return;
    }
    if (meta) {
      accounts[session.name].lastUpload = meta;
    } else {
      delete accounts[session.name].lastUpload;
    }
    localStorage.setItem('kiddotube_accounts', JSON.stringify(accounts));
  } catch (error) {
    console.error('Failed to save upload metadata:', error);
  }
}

function formatUploadSize(size) {
  if (!size) return '0 KB';
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function renderUploadPanel() {
  const preview = document.getElementById('upload-preview');
  const status = document.getElementById('upload-status');
  const lastSaved = state.lastUploadMeta || getStoredUploadMeta();
  if (!preview || !status) {
    return;
  }

  if (!lastSaved) {
    status.textContent = 'No file selected yet. Pick something fun to upload.';
    preview.innerHTML = `
      <div class="upload-preview-empty">
        <span class="upload-preview-icon">&#128228;</span>
        <h3>Ready to upload</h3>
        <p>Choose an image, video, worksheet, or project file from your device.</p>
      </div>`;
    return;
  }

  const updated = lastSaved.updatedAt ? new Date(lastSaved.updatedAt).toLocaleString() : 'Just now';
  status.textContent = `${lastSaved.name} - ${formatUploadSize(lastSaved.size)} - ${updated}`;

  if (state.uploadPreviewUrl) {
    const safeName = escapeHTML(lastSaved.name);
    if ((lastSaved.type || '').startsWith('image/')) {
      preview.innerHTML = `
        <div class="upload-preview-card">
          <img class="upload-preview-media" src="${state.uploadPreviewUrl}" alt="${safeName}">
          <div class="upload-preview-copy">
            <strong>${safeName}</strong>
            <p>Your image is ready in the upload area.</p>
          </div>
        </div>`;
      return;
    }

    if ((lastSaved.type || '').startsWith('video/')) {
      preview.innerHTML = `
        <div class="upload-preview-card">
          <video class="upload-preview-media" src="${state.uploadPreviewUrl}" controls preload="metadata"></video>
          <div class="upload-preview-copy">
            <strong>${safeName}</strong>
            <p>Your video is loaded and ready to review.</p>
          </div>
        </div>`;
      return;
    }
  }

  preview.innerHTML = `
    <div class="upload-preview-empty">
      <span class="upload-preview-icon">&#128451;</span>
      <h3>${escapeHTML(lastSaved.name)}</h3>
      <p>Last uploaded file type: ${escapeHTML(lastSaved.type || 'file')}</p>
    </div>`;
}

function triggerUploadPicker() {
  document.getElementById('upload-input')?.click();
}

function handleUploadSelection(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (state.uploadPreviewUrl) {
    URL.revokeObjectURL(state.uploadPreviewUrl);
    state.uploadPreviewUrl = '';
  }

  state.lastUploadMeta = {
    name: file.name,
    size: file.size,
    type: file.type || 'file',
    updatedAt: Date.now(),
  };

  if ((file.type || '').startsWith('image/') || (file.type || '').startsWith('video/')) {
    state.uploadPreviewUrl = URL.createObjectURL(file);
  }

  saveStoredUploadMeta(state.lastUploadMeta);
  renderUploadPanel();
}

function clearUploadSelection() {
  const input = document.getElementById('upload-input');
  if (input) {
    input.value = '';
  }

  if (state.uploadPreviewUrl) {
    URL.revokeObjectURL(state.uploadPreviewUrl);
    state.uploadPreviewUrl = '';
  }

  state.lastUploadMeta = null;
  saveStoredUploadMeta(null);
  renderUploadPanel();
}

/* ─────────────────────────────────────────
   13. VIDEO DETAIL
───────────────────────────────────────── */
function openVideoDetail(id) {
  stopVideoPlayback(true);
  state.currentVideoId = parseInt(id);
  state.isVideoPlaying = false;
  state.isVideoMuted = false;
  const video = VIDEOS.find(x => x.id === state.currentVideoId);
  state.videoDuration = video ? parseDurationToSeconds(video.dur) : 0;
  renderVideoDetail();
  showPage('page-viddetail');
  if (video?.src && isMobileVideoMode()) {
    maybeOpenVideoInMobileTheater();
    playVideo();
  }
}

function renderVideoDetail() {
  const v = VIDEOS.find(x => x.id === state.currentVideoId);
  if (!v) return;
  const player = document.getElementById('vd-player');
  player.style.background = v.src
    ? '#050505'
    : `linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.36)),${v.bg}`;
  player.innerHTML = `
    <div class="media-badge" id="vd-status-badge">${state.isVideoPlaying ? 'Now Playing' : state.videoElapsed > 0 ? 'Paused' : 'Ready to Play'}</div>
    ${v.src
      ? `<video class="vd-player-media" id="vd-player-media" src="${escapeHTML(v.src)}" playsinline preload="metadata"></video>`
      : `<span class="vd-emoji">${v.emoji}</span>`}
    <div class="vd-player-copy">
      <div>
        <strong>${escapeHTML(v.title)}</strong>
        <span>${isMobileVideoMode() ? 'Tap the screen to pause or play' : 'Lesson player on the left with related videos on the right'}</span>
      </div>
      <span>${escapeHTML(v.dur)}</span>
    </div>
    <div class="play-circle" id="vd-play-btn">${state.isVideoPlaying ? '&#10074;&#10074;' : '&#9654;'}</div>`;
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('vd-title', v.title);
  setEl('vd-info',  `Views ${v.views} · Time ${v.dur} · ${state.isVideoPlaying ? 'Playing now' : state.videoElapsed > 0 ? 'Paused' : 'Ready to start'}`);
  setEl('vd-time-total', formatVideoTime(state.videoDuration));
  setEl('vd-channel-avatar', state.avatar || '🐣');
  setEl('vd-channel-name', `${v.cat.toUpperCase()} Fun on KiddoTube`);
  const nextCard = document.getElementById('vd-sidebar-next');
  const mobileNextCard = document.getElementById('vd-mobile-next');
  const rel = sortVideosForDisplay(VIDEOS.filter(x => !x.short && x.id !== v.id)).slice(0, 7);
  if (nextCard) {
    const upcoming = rel[0];
    nextCard.innerHTML = upcoming ? `
      <strong>Next: ${escapeHTML(upcoming.title)}</strong>
      <span>Views ${escapeHTML(upcoming.views)} · Time ${escapeHTML(upcoming.dur)}</span>
    ` : `
      <strong>No next video</strong>
      <span>Choose another lesson from the library.</span>
    `;
    if (upcoming) {
      nextCard.onclick = () => openVideoDetail(upcoming.id);
      nextCard.style.cursor = 'pointer';
    } else {
      nextCard.onclick = null;
      nextCard.style.cursor = 'default';
    }
    nextCard.innerHTML = nextCard.innerHTML.replace(/\u00C2\u00B7/g, '&middot;');
  }
  if (mobileNextCard) {
    const upcoming = rel[0];
    mobileNextCard.innerHTML = upcoming ? `
      <strong>Next: ${escapeHTML(upcoming.title)}</strong>
      <span>Views ${escapeHTML(upcoming.views)} &middot; Time ${escapeHTML(upcoming.dur)}</span>
    ` : `
      <strong>No next video</strong>
      <span>Choose another lesson from the library.</span>
    `;
    if (upcoming) {
      mobileNextCard.onclick = () => openVideoDetail(upcoming.id);
      mobileNextCard.style.cursor = 'pointer';
    } else {
      mobileNextCard.onclick = null;
      mobileNextCard.style.cursor = 'default';
    }
  }
  const relEl = document.getElementById('vd-related');
  if (relEl) relEl.innerHTML =
    (rel.length ? rel.map(r => `
      <div class="rel-item" onclick="openVideoDetail(${r.id})">
        <div class="rel-thumb" style="background:${r.bg}">
          ${previewFallbackMarkup('rel-fallback', r.emoji)}
          ${r.src ? previewVideoMarkup('rel-media', r.src) : ''}
        </div>
        <div class="rel-info"><div class="rel-title">${r.title}</div><div class="rel-views">Views ${r.views} · Time ${r.dur}</div></div>
      </div>`).join('') : emptyState('No related videos','Clear filters for more.'));
  bindPreviewMedia();
  const media = document.getElementById('vd-player-media');
  if (media) {
    media.muted = state.isVideoMuted;
    if (state.videoElapsed > 0) {
      try {
        media.currentTime = state.videoElapsed;
      } catch (error) {
        void error;
      }
    }
    media.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(media.duration) && media.duration > 0) {
        state.videoDuration = Math.floor(media.duration);
        syncVideoPlaybackUI();
      }
    });
    media.addEventListener('timeupdate', () => {
      state.videoElapsed = media.currentTime || 0;
      if (Number.isFinite(media.duration) && media.duration > 0) {
        state.videoDuration = Math.floor(media.duration);
      }
      syncVideoPlaybackUI();
    });
    media.addEventListener('play', () => {
      state.isVideoPlaying = true;
      syncVideoPlaybackUI();
    });
    media.addEventListener('pause', () => {
      state.isVideoPlaying = false;
      state.videoElapsed = media.currentTime || state.videoElapsed;
      syncVideoPlaybackUI();
    });
    media.addEventListener('ended', () => {
      state.isVideoPlaying = false;
      state.videoElapsed = state.videoDuration || Math.floor(media.duration || 0);
      syncVideoPlaybackUI();
      rewardTaskFromVideo(v);
    });
  }
  syncVideoPlaybackUI();
}

function toggleVideoPlay() {
  if (!state.currentVideoId) return;
  if (state.isVideoPlaying) pauseVideo();
  else playVideo();
}

function closeVideoDetail() {
  exitVideoFullscreen();
  stopVideoPlayback(true);
  showPage('page-app');
}

function parseDurationToSeconds(dur) {
  const parts = String(dur || '').split(':').map(Number);
  if (parts.length === 2) return (parts[0] * 60) + parts[1];
  if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  return 0;
}

function formatVideoTime(totalSeconds) {
  const secs = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(secs / 60);
  const seconds = String(secs % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function syncVideoPlaybackUI() {
  const player = document.getElementById('vd-player');
  const media = document.getElementById('vd-player-media');
  const playBtn = document.getElementById('vd-play-control');
  const pauseBtn = document.getElementById('vd-pause-control');
  const prevBtn = document.getElementById('vd-prev-control');
  const nextBtn = document.getElementById('vd-next-control');
  const muteBtn = document.getElementById('vd-mute-control');
  const badge = document.getElementById('vd-status-badge');
  const circle = document.getElementById('vd-play-btn');
  const current = document.getElementById('vd-time-current');
  const total = document.getElementById('vd-time-total');
  const fill = document.getElementById('vd-progress-fill');
  const progressTrack = document.querySelector('.vd-progress-track');
  const info = document.getElementById('vd-info');
  const pipBtn = document.getElementById('vd-pip-control');
  const video = VIDEOS.find(x => x.id === state.currentVideoId);
  const queue = getLongVideoQueue();
  const index = queue.findIndex(item => item.id === state.currentVideoId);
  if (media) {
    state.isVideoMuted = media.muted;
    state.videoElapsed = media.currentTime || 0;
    if (Number.isFinite(media.duration) && media.duration > 0) {
      state.videoDuration = Math.floor(media.duration);
    }
  }
  const ratio = state.videoDuration ? Math.min(100, (state.videoElapsed / state.videoDuration) * 100) : 0;

  if (player) player.classList.toggle('playing', state.isVideoPlaying);
  if (playBtn) {
    const playLabel = state.isVideoPlaying ? 'Pause video' : 'Play video';
    playBtn.innerHTML = state.isVideoPlaying ? '&#10074;&#10074;' : '&#9654;';
    playBtn.setAttribute('aria-label', playLabel);
    playBtn.title = playLabel;
    playBtn.onclick = toggleVideoPlay;
  }
  if (pauseBtn) {
    pauseBtn.hidden = true;
  }
  if (prevBtn) {
    prevBtn.disabled = index <= 0;
    prevBtn.innerHTML = '&#9198;';
    prevBtn.setAttribute('aria-label', 'Previous video');
    prevBtn.title = 'Previous video';
  }
  if (nextBtn) {
    nextBtn.disabled = index === -1 || index >= queue.length - 1;
    nextBtn.innerHTML = '&#9197;';
    nextBtn.setAttribute('aria-label', 'Next video');
    nextBtn.title = 'Next video';
  }
  if (muteBtn) {
    const soundLabel = state.isVideoMuted ? 'Unmute video' : 'Mute video';
    muteBtn.innerHTML = state.isVideoMuted ? '&#128263;' : '&#128266;';
    muteBtn.setAttribute('aria-label', soundLabel);
    muteBtn.title = soundLabel;
  }
  const restartBtn = document.getElementById('vd-restart-control');
  if (restartBtn) {
    restartBtn.innerHTML = '&#8635;';
    restartBtn.setAttribute('aria-label', 'Restart video');
    restartBtn.title = 'Restart video';
  }
  if (pipBtn) {
    const pipSupported = !!(media && document.pictureInPictureEnabled && typeof media.requestPictureInPicture === 'function');
    pipBtn.disabled = !pipSupported;
    pipBtn.textContent = 'PiP';
    pipBtn.setAttribute('aria-label', 'Picture in picture');
    pipBtn.title = pipSupported ? 'Picture in picture' : 'Picture in picture is not available';
  }
  if (badge) badge.textContent = state.isVideoPlaying ? 'Now Playing' : state.videoElapsed >= state.videoDuration && state.videoDuration ? 'Finished' : state.videoElapsed > 0 ? 'Paused' : 'Ready to Play';
  if (circle) circle.innerHTML = state.isVideoPlaying ? '&#10074;&#10074;' : '&#9654;';
  if (current) current.textContent = formatVideoTime(state.videoElapsed);
  if (total) total.textContent = formatVideoTime(state.videoDuration);
  if (fill) fill.style.width = `${ratio}%`;
  if (progressTrack) {
    progressTrack.setAttribute('aria-valuemin', '0');
    progressTrack.setAttribute('aria-valuemax', String(Math.floor(state.videoDuration || 0)));
    progressTrack.setAttribute('aria-valuenow', String(Math.floor(state.videoElapsed || 0)));
  }
  if (info && video) {
    info.textContent = `Views ${video.views} · Time ${video.dur} · ${state.isVideoPlaying ? 'Playing now' : state.videoElapsed >= state.videoDuration && state.videoDuration ? 'Finished' : state.videoElapsed > 0 ? 'Paused' : 'Ready to start'}`;
  }
  syncVideoFullscreenState();
}

function stopVideoPlayback(resetProgress) {
  const media = document.getElementById('vd-player-media');
  if (media) {
    media.pause();
    if (resetProgress) {
      try {
        media.currentTime = 0;
      } catch (error) {
        void error;
      }
    }
  }
  if (state.videoTimer) {
    clearInterval(state.videoTimer);
    state.videoTimer = null;
  }
  state.isVideoPlaying = false;
  if (resetProgress) {
    state.videoElapsed = 0;
  }
  syncVideoPlaybackUI();
}

function playVideo() {
  if (!state.currentVideoId) return;
  const activeVideo = VIDEOS.find(x => x.id === state.currentVideoId);
  const media = document.getElementById('vd-player-media');
  if (media) {
    if (media.duration && media.currentTime >= media.duration) {
      media.currentTime = 0;
    }
    media.muted = state.isVideoMuted;
    state.isVideoPlaying = true;
    syncVideoPlaybackUI();
    const playPromise = media.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        state.isVideoPlaying = false;
        syncVideoPlaybackUI();
      });
    }
    return;
  }
  if (state.videoElapsed >= state.videoDuration && state.videoDuration) {
    state.videoElapsed = 0;
  }
  if (state.videoTimer) {
    clearInterval(state.videoTimer);
  }
  state.isVideoPlaying = true;
  syncVideoPlaybackUI();
  state.videoTimer = setInterval(() => {
    state.videoElapsed += 1;
    if (state.videoElapsed >= state.videoDuration) {
      state.videoElapsed = state.videoDuration;
      stopVideoPlayback(false);
      rewardTaskFromVideo(activeVideo);
      return;
    }
    syncVideoPlaybackUI();
  }, 1000);
}

function pauseVideo() {
  const media = document.getElementById('vd-player-media');
  if (media) {
    media.pause();
    state.isVideoPlaying = false;
    syncVideoPlaybackUI();
    return;
  }
  stopVideoPlayback(false);
}

function restartVideo() {
  const media = document.getElementById('vd-player-media');
  if (media) {
    media.currentTime = 0;
    state.videoElapsed = 0;
    if (state.isVideoPlaying) {
      media.play().catch(() => {});
    }
    syncVideoPlaybackUI();
    return;
  }
  state.videoElapsed = 0;
  syncVideoPlaybackUI();
  if (state.isVideoPlaying) {
    playVideo();
  }
}

function toggleMuteVideo() {
  const media = document.getElementById('vd-player-media');
  if (media) {
    media.muted = !media.muted;
    state.isVideoMuted = media.muted;
    syncVideoPlaybackUI();
    return;
  }
  state.isVideoMuted = !state.isVideoMuted;
  syncVideoPlaybackUI();
}

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

async function lockVideoOrientationLandscape() {
  if (!isMobileVideoMode()) return false;
  const orientationApi = screen.orientation;
  if (!orientationApi || typeof orientationApi.lock !== 'function') return false;
  try {
    await orientationApi.lock('landscape');
    state.videoOrientationLocked = true;
    return true;
  } catch (error) {
    void error;
    state.videoOrientationLocked = false;
    return false;
  }
}

function unlockVideoOrientation() {
  const orientationApi = screen.orientation;
  if (orientationApi && typeof orientationApi.unlock === 'function') {
    try {
      orientationApi.unlock();
    } catch (error) {
      void error;
    }
  }
  state.videoOrientationLocked = false;
}

function updateMobileVideoTheaterState() {
  const target = document.getElementById('vd-player-panel') || document.getElementById('vd-player');
  if (!target) return;
  const active = !!getFullscreenElement() || target.classList.contains('is-fallback-fullscreen');
  const shouldRotate = active && isMobileVideoMode() && window.innerHeight > window.innerWidth && !state.videoOrientationLocked;
  target.classList.toggle('is-rotated-mobile-fullscreen', shouldRotate);
  document.body.classList.toggle('video-mobile-theater-open', active && isMobileVideoMode());
}

function syncVideoFullscreenState() {
  const target = document.getElementById('vd-player-panel') || document.getElementById('vd-player');
  const btn = document.getElementById('vd-fullscreen-control');
  const isFallback = !!target?.classList.contains('is-fallback-fullscreen');
  const active = !!getFullscreenElement() || isFallback;
  if (btn) {
    const fullLabel = active ? 'Exit full screen' : 'Enter full screen';
    btn.innerHTML = active ? '&#10548;' : '&#x26F6;';
    btn.setAttribute('aria-label', fullLabel);
    btn.title = fullLabel;
  }
  if (!active) unlockVideoOrientation();
  updateMobileVideoTheaterState();
}

function requestVideoFullscreen(target, options = {}) {
  const { lockLandscape = false } = options;
  const request =
    target.requestFullscreen ||
    target.webkitRequestFullscreen ||
    target.msRequestFullscreen;

  const finalizeEnter = () => {
    syncVideoFullscreenState();
    updateMobileVideoTheaterState();
    if (lockLandscape) {
      lockVideoOrientationLandscape().finally(updateMobileVideoTheaterState);
    }
  };

  if (!request) {
    target.classList.add('is-fallback-fullscreen');
    finalizeEnter();
    return;
  }

  const result = request.call(target);
  if (result && typeof result.catch === 'function') {
    result.catch(() => {
      target.classList.add('is-fallback-fullscreen');
      finalizeEnter();
    }).then(() => {
      if (!target.classList.contains('is-fallback-fullscreen')) {
        finalizeEnter();
      }
    });
    return;
  }
  finalizeEnter();
}

function exitVideoFullscreen() {
  const target = document.getElementById('vd-player-panel') || document.getElementById('vd-player');
  if (target) {
    target.classList.remove('is-fallback-fullscreen');
    target.classList.remove('is-rotated-mobile-fullscreen');
  }
  document.body.classList.remove('video-mobile-theater-open');
  unlockVideoOrientation();

  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen;

  if (getFullscreenElement() && exit) {
    exit.call(document);
    return;
  }

  syncVideoFullscreenState();
}

function toggleVideoFullscreen() {
  const target = document.getElementById('vd-player-panel') || document.getElementById('vd-player');
  if (!target) return;
  const active = !!getFullscreenElement() || target.classList.contains('is-fallback-fullscreen');
  if (!active) {
    requestVideoFullscreen(target, { lockLandscape: isMobileVideoMode() });
  } else {
    exitVideoFullscreen();
  }
}

function maybeOpenVideoInMobileTheater() {
  if (!isMobileVideoMode()) return;
  const target = document.getElementById('vd-player-panel') || document.getElementById('vd-player');
  if (!target) return;
  const active = !!getFullscreenElement() || target.classList.contains('is-fallback-fullscreen');
  if (active) {
    lockVideoOrientationLandscape().finally(updateMobileVideoTheaterState);
    return;
  }
  requestVideoFullscreen(target, { lockLandscape: true });
}

function getLongVideoQueue() {
  const filtered = getFilteredVideos(false);
  return filtered.length ? filtered : sortVideosForDisplay(VIDEOS.filter(v => !v.short));
}

function playPreviousVideo() {
  const queue = getLongVideoQueue();
  const index = queue.findIndex(item => item.id === state.currentVideoId);
  if (index > 0) {
    openVideoDetail(queue[index - 1].id);
  }
}

function playNextVideo() {
  const queue = getLongVideoQueue();
  const index = queue.findIndex(item => item.id === state.currentVideoId);
  if (index >= 0 && index < queue.length - 1) {
    openVideoDetail(queue[index + 1].id);
  }
}

['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(eventName => {
  document.addEventListener(eventName, syncVideoFullscreenState);
});
window.addEventListener('resize', updateMobileVideoTheaterState);

/* ─────────────────────────────────────────
   14. SHORTS
───────────────────────────────────────── */
function openShort(id) {
  const all = getFilteredVideos(true);
  state.shortQueue = all.length ? [...all] : sortVideosForDisplay(VIDEOS.filter(v => v.short));
  const idx = state.shortQueue.findIndex(v => v.id === parseInt(id));
  state.currentShort = idx >= 0 ? idx : 0;
  showPage('page-short');
  renderShort();
}

function stopShortMedia(clearSource) {
  const media = document.getElementById('short-media');
  const screen = document.getElementById('short-screen');
  if (!media) return;
  media.pause();
  if (clearSource) {
    media.removeAttribute('src');
    media.load();
  }
  if (screen) screen.classList.remove('has-media');
}

function renderShort() {
  if (!state.shortQueue.length) state.shortQueue = sortVideosForDisplay(VIDEOS.filter(v => v.short));
  const v = state.shortQueue[state.currentShort];
  if (!v) return;
  const screen = document.getElementById('short-screen');
  const em = document.getElementById('short-emoji');
  const media = document.getElementById('short-media');
  stopShortMedia(false);
  if (screen) {
    screen.style.background = `linear-gradient(180deg,rgba(8,8,18,0.06),rgba(8,8,18,0.24)),${v.bg}`;
    screen.classList.remove('has-media');
  }
  if (em) {
    em.textContent = v.emoji;
    em.style.display = '';
  }
  if (v.src && media) {
    media.classList.remove('hidden');
    media.onloadeddata = () => {
      if (screen) screen.classList.add('has-media');
      if (em) em.style.display = 'none';
      media.classList.remove('hidden');
    };
    media.onerror = () => {
      if (screen) screen.classList.remove('has-media');
      media.classList.add('hidden');
      media.removeAttribute('src');
      media.load();
      if (em) em.style.display = '';
    };
    media.src = v.src;
    media.currentTime = 0;
    media.controls = true;
    media.muted = false;
    const playResult = media.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {
        media.muted = true;
        media.play().catch(() => {});
      });
    }
  } else if (media) {
    media.classList.add('hidden');
    media.removeAttribute('src');
    media.load();
    media.onloadeddata = null;
    media.onerror = null;
  }
  if (em) {
    if (!v.src) {
      em.style.transform = 'scale(0.86)';
      setTimeout(() => { em.style.transform = 'scale(1)'; }, 70);
    }
  }
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('short-ttl',     v.title);
  setEl('short-views',   `Views ${v.views} · Time ${v.dur}`);
  setEl('short-counter', `${state.currentShort + 1} / ${state.shortQueue.length}`);
  const progress = document.getElementById('short-progress-fill');
  if (progress) {
    progress.style.width = `${((state.currentShort + 1) / Math.max(state.shortQueue.length, 1)) * 100}%`;
  }
}

let shortNavLockedUntil = 0;
let shortTransitionTimer = null;

function animateShortTransition(direction) {
  const screen = document.getElementById('short-screen');
  if (!screen) return;
  const nextClass = direction > 0 ? 'short-transition-next' : 'short-transition-prev';
  screen.classList.remove('short-transition-next', 'short-transition-prev');
  void screen.offsetWidth;
  screen.classList.add(nextClass);
  if (shortTransitionTimer) clearTimeout(shortTransitionTimer);
  shortTransitionTimer = setTimeout(() => {
    screen.classList.remove('short-transition-next', 'short-transition-prev');
  }, 340);
}

function moveShort(step) {
  const nextIndex = state.currentShort + step;
  if (nextIndex < 0 || nextIndex >= state.shortQueue.length) return;
  if (Date.now() < shortNavLockedUntil) return;
  shortNavLockedUntil = Date.now() + 360;
  state.currentShort = nextIndex;
  renderShort();
  animateShortTransition(step);
}

function prevShort() { moveShort(-1); }
function nextShort() { moveShort(1); }
function closeShort() { stopShortMedia(true); showPage('page-app'); }

// Touch swipe
(function() {
  let startY = 0;
  document.addEventListener('touchstart', e => {
    if (document.getElementById('page-short')?.classList.contains('active'))
      startY = e.touches[0].clientY;
  });
  document.addEventListener('touchend', e => {
    if (!document.getElementById('page-short')?.classList.contains('active')) return;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dy) > 50) { dy < 0 ? nextShort() : prevShort(); }
  });
})();

// Mouse wheel / trackpad vertical navigation for shorts
(function() {
  let wheelDelta = 0;
  let resetTimer = null;
  let wheelLocked = false;
  let unlockTimer = null;
  document.addEventListener('wheel', event => {
    const shortPage = document.getElementById('page-short');
    if (!shortPage?.classList.contains('active')) return;
    if (event.ctrlKey) return;
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;

    event.preventDefault();
    if (wheelLocked) return;

    wheelDelta += event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;

    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { wheelDelta = 0; }, 140);

    if (Math.abs(wheelDelta) < 48) return;

    const direction = wheelDelta;
    wheelDelta = 0;
    wheelLocked = true;
    if (direction < 0) nextShort();
    else prevShort();

    if (unlockTimer) clearTimeout(unlockTimer);
    unlockTimer = setTimeout(() => {
      wheelLocked = false;
    }, 420);
  }, { passive: false });
})();

/* ─────────────────────────────────────────
   15. TASKS & HOMEWORK
───────────────────────────────────────── */
function renderTasks() {
  const list = document.getElementById('task-list');
  if (list) list.innerHTML = state.tasks.map(t => taskHTML(t, 'tasks')).join('');
  const stat = document.getElementById('stat-tasks');
  if (stat) stat.textContent =
    state.tasks.filter(t => t.done).length + state.hw.filter(h => h.done).length;
}

function renderHW() {
  const list = document.getElementById('hw-list');
  if (list) list.innerHTML = state.hw.map(h => taskHTML(h, 'hw')).join('');
}

function taskHTML(t, type) {
  return `<div class="task-item${t.done?' done':''}" onclick="toggleTask(${t.id},'${type}')">
    <div class="task-check${t.done?' done':''}">✓</div>
    <span class="task-emoji">${t.emoji}</span>
    <div class="task-text"><div class="task-t">${t.t}</div><div class="task-s">${t.s}</div></div>
  </div>`;
}

function toggleTask(id, type) {
  const list = type === 'tasks' ? state.tasks : state.hw;
  const item = list.find(x => x.id === id);
  if (!item) return;
  item.done = !item.done;
  if (item.done) confetti();
  persistLearningProgress();
  renderTasks();
  renderHW();
  syncRewardBadgeUI();
  if (typeof window.refreshProfilePanel === 'function') {
    window.refreshProfilePanel();
  }
}

/* ─────────────────────────────────────────
   16. GAMES — Panel
───────────────────────────────────────── */
function renderGames() {
  const grid = document.getElementById('games-grid');
  if (!grid) return;
  grid.innerHTML = GAMES.map(g => `
    <div class="game-card" onclick="openGame('${g.id}')">
      <div class="game-card-emoji">${g.emoji}</div>
      <div class="game-card-title">${g.title}</div>
      <div class="game-card-badge ${g.badge}">${g.badge}</div>
    </div>`).join('');
}

function openGame(id) {
  const g = GAMES.find(x => x.id === id);
  if (!g) return;
  if (g.type === 'link' && g.path) {
    window.location.href = g.path;
    return;
  }
  state.currentGame = g;
  const setEl = (elId, val) => { const el = document.getElementById(elId); if (el) el.textContent = val; };
  setEl('game-title-bar', g.title);
  setEl('game-score-bar', '⭐ 0');
  showPage('page-game');
  if (g.type === 'quiz')   startQuiz(g.topic);
  if (g.type === 'memory') startMemory();
  if (g.type === 'draw')   startDraw();
}

function closeGame() {
  showPage('page-app');
  goTab('games');
}

/* Helper — returns the active game content container
   (works for both in-app page-game and games.html overlay) */
function getGameContentEl() {
  return document.getElementById('go-content') ||
         document.getElementById('game-content');
}

function setGameScore(n) {
  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('game-score-bar', `⭐ ${n}`);
  setEl('go-score',       `⭐ ${n}`);
}

/* ─────────────────────────────────────────
   17. QUIZ GAME
───────────────────────────────────────── */
let quizState = { questions:[], current:0, score:0, answered:false };

function startQuiz(topic) {
  const qs = (QUIZ_DATA[topic] || []).sort(() => Math.random() - 0.5);
  quizState = { questions: qs, current: 0, score: 0, answered: false };
  renderQuiz();
}

function renderQuiz() {
  const gc = getGameContentEl();
  if (!gc) return;
  const { questions, current } = quizState;

  if (current >= questions.length) {
    gc.innerHTML = `
      <div class="quiz-emoji">🏆</div>
      <div class="quiz-question">You scored ${quizState.score} / ${questions.length}!</div>
      <div class="quiz-feedback" style="color:var(--green)">Great job, ${state.userName||'champ'}! 🎉</div>
      <button class="quiz-next" onclick="openGame('${state.currentGame?.id}')">Play Again 🔄</button>
      <button class="quiz-next" style="background:var(--purple);margin-top:8px" onclick="closeGame?closeGame():closeGameOverlay()">Back to Games</button>`;
    confetti();
    return;
  }

  const q = questions[current];
  gc.innerHTML = `
    <div class="quiz-emoji" id="q-emoji">${q.emoji}</div>
    <div class="quiz-question">${q.q}</div>
    <div class="quiz-options" id="quiz-opts">
      ${q.opts.map((o,i) => `<button class="quiz-opt" id="qopt-${i}" onclick="answerQuiz(${i})">${o}</button>`).join('')}
    </div>
    <div class="quiz-feedback" id="quiz-fb"></div>`;
}

function answerQuiz(idx) {
  if (quizState.answered) return;
  quizState.answered = true;
  const q = quizState.questions[quizState.current];
  const correct = idx === q.ans;
  document.getElementById(`qopt-${idx}`)?.classList.add(correct ? 'correct' : 'wrong');
  if (!correct) document.getElementById(`qopt-${q.ans}`)?.classList.add('correct');
  const fb = document.getElementById('quiz-fb');
  if (fb) {
    fb.textContent = correct ? '✅ Correct! Amazing!' : `❌ Oops! It was: ${q.opts[q.ans]}`;
    fb.style.color  = correct ? 'var(--green)' : 'var(--red)';
  }
  if (correct) { quizState.score++; confetti(); }
  setGameScore(quizState.score);
  setTimeout(() => { quizState.current++; quizState.answered = false; renderQuiz(); }, 1500);
}

/* ─────────────────────────────────────────
   18. MEMORY MATCH GAME
───────────────────────────────────────── */
let memState = { cards:[], flipped:[], matched:0, lock:false, moves:0 };
const MEM_EMOJIS = ['🐶','🐱','🦊','🐸','🦄','🐼','🌈','⭐'];

function startMemory() {
  const pairs = [...MEM_EMOJIS, ...MEM_EMOJIS].sort(() => Math.random() - 0.5);
  memState = {
    cards:   pairs.map((e, i) => ({ id:i, emoji:e, flipped:false, matched:false })),
    flipped: [], matched:0, lock:false, moves:0,
  };
  renderMemory();
}

function renderMemory() {
  const gc = getGameContentEl();
  if (!gc) return;
  gc.innerHTML = `
    <div class="mem-info" id="mem-info">🃏 Moves: ${memState.moves} &nbsp; ✅ Pairs: ${memState.matched}/8</div>
    <div class="memory-grid" id="mem-grid">
      ${memState.cards.map(c => `
        <div class="mem-card${c.flipped?' flipped':''}${c.matched?' matched':''}" id="mc-${c.id}" onclick="flipCard(${c.id})">
          <span class="card-back">❓</span>
          <span class="card-front">${c.emoji}</span>
        </div>`).join('')}
    </div>`;
}

function flipCard(id) {
  if (memState.lock) return;
  const card = memState.cards[id];
  if (card.flipped || card.matched) return;
  card.flipped = true;
  memState.flipped.push(id);
  renderMemory();

  if (memState.flipped.length === 2) {
    memState.lock = true;
    memState.moves++;
    const [a, b] = memState.flipped;
    if (memState.cards[a].emoji === memState.cards[b].emoji) {
      memState.cards[a].matched = memState.cards[b].matched = true;
      memState.matched++;
      memState.flipped = [];
      memState.lock    = false;
      setGameScore(memState.matched);
      renderMemory();
      if (memState.matched === MEM_EMOJIS.length) {
        setTimeout(() => {
          const gc = getGameContentEl();
          if (gc) gc.innerHTML = `
            <div class="quiz-emoji">🏆</div>
            <div class="quiz-question">All pairs found in ${memState.moves} moves!</div>
            <button class="quiz-next" onclick="startMemory()">Play Again 🔄</button>
            <button class="quiz-next" style="background:var(--purple);margin-top:8px" onclick="closeGame?closeGame():closeGameOverlay()">Back to Games</button>`;
          confetti();
        }, 600);
      }
    } else {
      setTimeout(() => {
        memState.cards[a].flipped = memState.cards[b].flipped = false;
        memState.flipped = [];
        memState.lock    = false;
        renderMemory();
      }, 900);
    }
  }
}

/* ─────────────────────────────────────────
   19. DRAWING GAME
───────────────────────────────────────── */
const DRAW_COLORS = ['#FF6B6B','#FF9F43','#FECA57','#1DD1A1','#48DBFB','#A29BFE','#333344','#ffffff'];
let drawState = { color:'#FF6B6B', size:8, drawing:false };

function startDraw() {
  const gc = getGameContentEl();
  if (!gc) return;
  gc.innerHTML = `
    <canvas id="draw-canvas" width="340" height="280"></canvas>
    <div class="draw-controls">
      ${DRAW_COLORS.map(c => `<div class="draw-color${c===drawState.color?' sel':''}" style="background:${c}" onclick="setDrawColor('${c}')"></div>`).join('')}
      <button class="draw-btn" onclick="clearCanvas()">🗑 Clear</button>
    </div>`;
  initCanvas();
}

function setDrawColor(c) {
  drawState.color = c;
  document.querySelectorAll('.draw-color').forEach(el => {
    const bg = el.style.backgroundColor || el.style.background;
    // convert hex to compare
    el.classList.toggle('sel', el.getAttribute('style').includes(c));
  });
}

function clearCanvas() {
  const cv = document.getElementById('draw-canvas');
  if (!cv) return;
  cv.getContext('2d').clearRect(0, 0, cv.width, cv.height);
}

function initCanvas() {
  const cv = document.getElementById('draw-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  function pos(e) {
    const r  = cv.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    return { x: pt.clientX - r.left, y: pt.clientY - r.top };
  }
  function start(e) {
    e.preventDefault();
    drawState.drawing = true;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    ctx.strokeStyle = drawState.color;
    ctx.lineWidth   = drawState.size;
  }
  function move(e) {
    e.preventDefault();
    if (!drawState.drawing) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  function stop() { drawState.drawing = false; }

  cv.addEventListener('mousedown',  start);
  cv.addEventListener('mousemove',  move);
  cv.addEventListener('mouseup',    stop);
  cv.addEventListener('mouseleave', stop);
  cv.addEventListener('touchstart', start, { passive:false });
  cv.addEventListener('touchmove',  move,  { passive:false });
  cv.addEventListener('touchend',   stop);
}

/* ─────────────────────────────────────────
   20. KEYBOARD SHORTCUTS
───────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (document.getElementById('page-short')?.classList.contains('active')) {
    if (e.key === 'ArrowUp')   prevShort();
    if (e.key === 'ArrowDown') nextShort();
    if (e.key === 'Escape')    closeShort();
  }
  if (document.getElementById('page-viddetail')?.classList.contains('active')) {
    if (e.key === 'Escape') closeVideoDetail();
  }
  if (document.getElementById('page-game')?.classList.contains('active')) {
    if (e.key === 'Escape') closeGame();
  }
});
