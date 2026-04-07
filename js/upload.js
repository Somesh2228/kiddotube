(function () {
  let previewUrl = '';

  function getSession() {
    return JSON.parse(localStorage.getItem('kiddotube_session') || 'null');
  }

  function getAccounts() {
    return JSON.parse(localStorage.getItem('kiddotube_accounts') || '{}');
  }

  function saveAccounts(accounts) {
    localStorage.setItem('kiddotube_accounts', JSON.stringify(accounts));
  }

  function buildLoginUrl() {
    if (typeof window.buildKiddoTubeLoginUrl === 'function') {
      return window.buildKiddoTubeLoginUrl('upload.html');
    }
    return 'login.html?next=upload.html';
  }

  function getCurrentAccount() {
    const session = getSession();
    const accounts = getAccounts();
    if (!session || !accounts[session.name]) {
      return null;
    }
    return { session, account: accounts[session.name] };
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
    ));
  }

  function formatSize(size) {
    if (!size) return '0 KB';
    if (size < 1024 * 1024) {
      return `${Math.max(1, Math.round(size / 1024))} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderPlaceholder(title, text, icon) {
    const preview = document.getElementById('upload-preview');
    if (!preview) return;
    preview.innerHTML = `
      <div class="upload-empty">
        <span class="upload-empty-icon">${icon}</span>
        <h3>${title}</h3>
        <p>${text}</p>
      </div>`;
  }

  function updateSummary(meta) {
    const latestName = document.getElementById('latest-upload-name');
    const latestMeta = document.getElementById('latest-upload-meta');
    const status = document.getElementById('upload-status');
    if (!latestName || !latestMeta || !status) return;

    if (!meta) {
      latestName.textContent = 'Nothing uploaded yet';
      latestMeta.textContent = 'Choose a file to save it to your account.';
      status.textContent = 'No file selected yet.';
      renderPlaceholder('Ready to upload', 'Select a file to preview it here and save it to this account.', '&#128228;');
      return;
    }

    const when = meta.updatedAt ? new Date(meta.updatedAt).toLocaleString() : 'Just now';
    latestName.textContent = meta.name;
    latestMeta.textContent = `${meta.type || 'file'} - ${formatSize(meta.size)} - ${when}`;
    status.textContent = `${meta.name} - ${formatSize(meta.size)} - ${when}`;
  }

  function renderSavedMeta() {
    const info = getCurrentAccount();
    if (!info) {
      return;
    }

    updateSummary(info.account.lastUpload || null);
  }

  function saveUploadMeta(meta) {
    const info = getCurrentAccount();
    if (!info) {
      return;
    }

    const accounts = getAccounts();
    accounts[info.session.name] = {
      ...accounts[info.session.name],
      lastUpload: meta,
    };
    saveAccounts(accounts);
    updateSummary(meta);
  }

  function clearUpload() {
    const input = document.getElementById('upload-file');
    if (input) {
      input.value = '';
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }

    const info = getCurrentAccount();
    if (info) {
      const accounts = getAccounts();
      delete accounts[info.session.name].lastUpload;
      saveAccounts(accounts);
    }

    updateSummary(null);
  }

  function renderFilePreview(file) {
    const preview = document.getElementById('upload-preview');
    if (!preview) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }

    const safeName = escapeHTML(file.name);
    const meta = {
      name: file.name,
      type: file.type || 'file',
      size: file.size,
      updatedAt: Date.now(),
    };

    if ((file.type || '').startsWith('image/') || (file.type || '').startsWith('video/')) {
      previewUrl = URL.createObjectURL(file);
    }

    if ((file.type || '').startsWith('image/')) {
      preview.innerHTML = `
        <div class="upload-preview-card">
          <img class="upload-media" src="${previewUrl}" alt="${safeName}">
          <div class="upload-preview-copy">
            <strong>${safeName}</strong>
            <span>Your image is ready and saved to your account.</span>
          </div>
        </div>`;
    } else if ((file.type || '').startsWith('video/')) {
      preview.innerHTML = `
        <div class="upload-preview-card">
          <video class="upload-media" src="${previewUrl}" controls preload="metadata"></video>
          <div class="upload-preview-copy">
            <strong>${safeName}</strong>
            <span>Your video is ready and saved to your account.</span>
          </div>
        </div>`;
    } else {
      renderPlaceholder(safeName, `Saved as ${escapeHTML(meta.type)}. You can see this file in your latest upload details.`, '&#128451;');
    }

    saveUploadMeta(meta);
  }

  function bindActions() {
    document.getElementById('upload-pick-btn')?.addEventListener('click', () => {
      document.getElementById('upload-file')?.click();
    });

    document.getElementById('upload-clear-btn')?.addEventListener('click', clearUpload);
    document.getElementById('upload-home-btn')?.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    document.getElementById('upload-profile-btn')?.addEventListener('click', () => {
      window.location.href = 'profile.html';
    });

    document.getElementById('upload-file')?.addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (!file) return;
      renderFilePreview(file);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const info = getCurrentAccount();
    if (!info) {
      window.location.replace(buildLoginUrl());
      return;
    }

    bindActions();
    renderSavedMeta();
  });
})();
