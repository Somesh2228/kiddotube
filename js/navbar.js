(function () {
  const NAVBAR_PARTIAL = 'partials/navbar.html';
  let resolveNavbarReady = null;

  window.sharedNavbarReady = new Promise(resolve => {
    resolveNavbarReady = resolve;
  });

  function getSession() {
    return JSON.parse(localStorage.getItem('kiddotube_session') || 'null');
  }

  function getAccounts() {
    return JSON.parse(localStorage.getItem('kiddotube_accounts') || '{}');
  }

  function getCurrentAccount() {
    const session = getSession();
    const accounts = getAccounts();
    return session && accounts[session.name] ? accounts[session.name] : null;
  }

  function hasValidSession() {
    return Boolean(getCurrentAccount());
  }

  function buildLoginUrl(target, startTab) {
    const url = new URL('login.html', window.location.href);
    url.searchParams.set('next', target);
    if (startTab) {
      url.searchParams.set('tab', startTab);
    }
    return url.href;
  }

  function goToProtected(target, startTab) {
    if (startTab) {
      localStorage.setItem('startTab', startTab);
    } else {
      localStorage.removeItem('startTab');
    }

    if (hasValidSession()) {
      window.location.href = target;
      return;
    }

    window.location.href = buildLoginUrl(target, startTab);
  }

  window.goToProtected = function (event, target, startTab) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    goToProtected(target, startTab);
    return false;
  };

  window.buildKiddoTubeLoginUrl = buildLoginUrl;

  function setAvatar(root) {
    const avatarButton = root.querySelector('[data-nav-avatar]');
    if (!avatarButton) {
      return;
    }

    const account = getCurrentAccount();
    avatarButton.textContent = account?.avatar || '🐣';
  }

  function getConfig() {
    const data = document.body.dataset;
    return {
      page: data.navPage || '',
      homeHref: data.navHomeHref || 'index.html',
      brandHref: data.navBrandHref || data.navHomeHref || 'index.html',
      searchHref: data.navSearchHref || 'app.html',
      searchTab: data.navSearchTab || '',
      profileHref: data.navProfileHref || 'profile.html',
      profileTab: data.navProfileTab || '',
      mobileMenu: data.navMobileMenu || ''
    };
  }

  function applyNavbarOffsetState(hasMountedNavbar) {
    document.body.classList.toggle('shared-navbar-present', hasMountedNavbar);
    document.body.classList.toggle('shared-navbar-absent', !hasMountedNavbar);
    if (hasMountedNavbar) {
      document.body.style.removeProperty('--shared-navbar-h');
      return;
    }
    document.body.style.setProperty('--shared-navbar-h', '0px');
  }

  function wireSearch(root, config) {
    const searchWrap = root.querySelector('[data-nav-search-wrap]');
    const searchInput = root.querySelector('#search-input');
    const searchClear = root.querySelector('#search-clear');

    if (!searchWrap || !searchInput) {
      return;
    }

    if (config.page === 'app') {
      return;
    }

    if (searchClear) {
      searchClear.classList.add('hidden');
      searchClear.disabled = true;
    }

    searchInput.readOnly = true;
    searchInput.setAttribute('aria-readonly', 'true');

    const openSearchPage = event => {
      event.preventDefault();
      goToProtected(config.searchHref, config.searchTab);
    };

    searchWrap.addEventListener('click', openSearchPage);
    searchInput.addEventListener('focus', openSearchPage);
  }

  function wireAvatar(root, config) {
    const avatarButton = root.querySelector('[data-nav-avatar]');
    if (!avatarButton) {
      return;
    }

    avatarButton.addEventListener('click', () => {
      const useInlineAppProfile =
        config.page === 'app' &&
        config.profileHref === 'app.html' &&
        typeof window.goTab === 'function';

      if (useInlineAppProfile) {
        localStorage.setItem('startTab', 'profile');
        window.goTab('profile');
        return;
      }

      goToProtected(config.profileHref, config.profileTab);
    });
  }

  function wireBrandLinks(root, config) {
    const homeLink = root.querySelector('[data-nav-home]');
    const brandLink = root.querySelector('[data-nav-brand]');

    if (homeLink) {
      homeLink.setAttribute('href', config.homeHref);
    }
    if (brandLink) {
      brandLink.setAttribute('href', config.brandHref);
    }
  }

  function wireHomeButton(root, config) {
    const homeLink = root.querySelector('[data-nav-home]');
    if (!homeLink) {
      return;
    }

    homeLink.addEventListener('click', event => {
      const shouldToggleMobileMenu =
        config.mobileMenu === 'sidebar' &&
        window.innerWidth <= 639 &&
        typeof window.toggleMobileSidebar === 'function';

      if (!shouldToggleMobileMenu) {
        return;
      }

      event.preventDefault();
      window.toggleMobileSidebar();
    });
  }

  async function mountNavbar(root) {
    const response = await fetch(NAVBAR_PARTIAL);
    const html = await response.text();
    root.innerHTML = html;

    const config = getConfig();
    wireBrandLinks(root, config);
    wireHomeButton(root, config);
    setAvatar(root);
    wireSearch(root, config);
    wireAvatar(root, config);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const roots = Array.from(document.querySelectorAll('[data-site-navbar]'));
    if (!roots.length) {
      applyNavbarOffsetState(false);
      resolveNavbarReady();
      return;
    }

    try {
      await Promise.all(roots.map(root => mountNavbar(root)));
      applyNavbarOffsetState(true);
    } catch (error) {
      console.error('Navbar load failed:', error);
      applyNavbarOffsetState(false);
    } finally {
      resolveNavbarReady();
      document.dispatchEvent(new Event('shared-navbar-ready'));
    }
  });
})();
