(function () {
  const PROFILE_TARGET = 'profile.html';

  function getSession() {
    return JSON.parse(localStorage.getItem('kiddotube_session') || 'null');
  }

  function getAccounts() {
    return JSON.parse(localStorage.getItem('kiddotube_accounts') || '{}');
  }

  function buildProfileLoginUrl() {
    if (typeof window.buildKiddoTubeLoginUrl === 'function') {
      return window.buildKiddoTubeLoginUrl(PROFILE_TARGET);
    }
    return `login.html?next=${encodeURIComponent(PROFILE_TARGET)}`;
  }

  function guardSession() {
    const session = getSession();
    const accounts = getAccounts();
    if (!session || !accounts[session.name]) {
      window.location.replace(buildProfileLoginUrl());
      return null;
    }
    return { session, account: accounts[session.name] };
  }

  function timeAgo(timestamp) {
    if (!timestamp) return 'never';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 2) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'today';
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function completedCount(bucket) {
    return Object.values(bucket || {}).filter(item => item && item.completed).length;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
    ));
  }

  function goToSection(target, tab) {
    if (tab) {
      localStorage.setItem('startTab', tab);
    } else {
      localStorage.removeItem('startTab');
    }
    window.location.href = target;
  }

  function bindActions() {
    document.getElementById('profile-home')?.addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    document.getElementById('profile-library')?.addEventListener('click', () => {
      goToSection('app.html', 'home');
    });

    document.getElementById('profile-logout')?.addEventListener('click', () => {
      localStorage.removeItem('kiddotube_session');
      window.location.href = 'login.html';
    });

    document.querySelectorAll('.quick-link').forEach(button => {
      button.addEventListener('click', () => {
        goToSection(button.dataset.target || 'app.html', button.dataset.tab || '');
      });
    });
  }

  function fillProgress(account) {
    const progressList = document.getElementById('progress-list');
    if (!progressList) {
      return;
    }

    const gameProgress = account.gameProgress || {};
    const items = [
      {
        title: 'Puzzle Pals',
        value: `${completedCount(gameProgress['puzzle-pals'])} / 4 levels completed`,
      },
      {
        title: 'Memory Match 15',
        value: `${completedCount(gameProgress['memory-match-15'])} / 15 levels completed`,
      },
      {
        title: 'Balloon Pop Party',
        value: `${completedCount(gameProgress['balloon-pop-party'])} / 15 levels completed`,
      },
      {
        title: 'Shape Match',
        value: `${completedCount(gameProgress['shape-match'])} / 15 levels completed`,
      },
      {
        title: 'Cartoon Puzzle',
        value: `${completedCount(gameProgress['cartoon-puzzle'])} / 10 levels completed`,
      },
      {
        title: 'Animal and Number Quizzes',
        value: `${completedCount(gameProgress['quiz-animals']) + completedCount(gameProgress['quiz-numbers']) + completedCount(gameProgress['quiz-colors']) + completedCount(gameProgress['quiz-shapes'])} quiz levels finished`,
      },
      {
        title: 'Memory Match',
        value: `${completedCount(gameProgress['memory-1'])} memory levels cleared`,
      },
      {
        title: 'Drawing Board',
        value: `${completedCount(gameProgress['draw-1'])} drawing sessions saved`,
      },
    ];

    progressList.innerHTML = items.map(item => `
      <div class="progress-item">
        <strong>${item.title}</strong>
        <span>${item.value}</span>
      </div>`).join('');
  }

  function fillMeta(session, account) {
    const accountMeta = document.getElementById('account-meta');
    if (!accountMeta) {
      return;
    }

    const uploadText = account.lastUpload
      ? `${escapeHTML(account.lastUpload.name)} (${escapeHTML(account.lastUpload.type || 'file')})`
      : 'Nothing uploaded yet';

    accountMeta.innerHTML = `
      <div class="meta-card">
        <strong>Account Details</strong>
        <span>Created: ${formatDate(account.createdAt)}</span>
        <span>Last login: ${timeAgo(account.lastLogin || session.loginTime)}</span>
      </div>
      <div class="meta-card">
        <strong>Latest Upload</strong>
        <span>${uploadText}</span>
      </div>`;
  }

  function fillProfile(session, account) {
    setText('profile-avatar', account.avatar || '🐣');
    setText('profile-name', session.name);
    setText('profile-email', `${session.name.toLowerCase().replace(/\s/g, '')}@kiddotube.fun`);
    setText('profile-member', `Member since ${formatDate(account.createdAt)}`);

    setText('profile-stars', account.stars || 0);
    setText('profile-watched', account.videosWatched || 0);
    setText('profile-tasks', account.tasksDone || 0);
    setText('profile-games', account.gamesPlayed || 0);

    const lastActivity = account.lastActivity
      ? `${account.lastActivity.game || 'Game'} - Level ${account.lastActivity.level || 1} (${timeAgo(account.lastActivity.timestamp)})`
      : 'No games played yet.';
    const lastUpload = account.lastUpload
      ? `${account.lastUpload.name} - ${timeAgo(account.lastUpload.updatedAt)}`
      : 'No upload yet.';
    const lastLogin = account.lastLogin
      ? `Last login ${timeAgo(account.lastLogin)}.`
      : 'Last login just now.';

    setText('profile-last-activity', lastActivity);
    setText('profile-last-upload', lastUpload);
    setText('profile-last-login', lastLogin);

    fillProgress(account);
    fillMeta(session, account);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const result = guardSession();
    if (!result) {
      return;
    }

    fillProfile(result.session, result.account);
    bindActions();
  });
})();
