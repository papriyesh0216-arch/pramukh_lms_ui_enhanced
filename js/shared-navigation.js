(function () {
  'use strict';

  const instances = new Map();

  function icon(name) {
    return '<i class="fas ' + name + '" style="width: 12px; color: inherit"></i>';
  }

  function renderItem(item) {
    if (item.type === 'title') return '<div class="nav-group-title">' + item.label + '</div>';
    if (item.type === 'submenu') {
      return [
        '<div class="nav-subitem" data-submenu="' + item.id + '">',
          icon(item.icon), item.label,
          '<i class="fas fa-chevron-down" style="font-size:8px;margin-left:8px;color:var(--sidebar-text)" data-shared-chevron></i>',
        '</div>',
        '<div class="nav-submenu" id="' + item.id + '" style="max-height:0">',
          item.items.map(child => renderItem(Object.assign({}, child, { subitem: true }))).join(''),
        '</div>'
      ].join('');
    }

    const tag = item.href ? 'a' : 'div';
    const classes = item.subitem ? 'nav-sub-subitem' : 'nav-subitem';
    const attrs = [
      item.screen ? 'data-screen="' + item.screen + '"' : '',
      item.action ? 'data-shared-action="' + item.action + '"' : '',
      item.href ? 'href="' + item.href + '"' : '',
      item.newTab ? 'target="_blank" rel="noopener"' : '',
      item.permission ? 'data-navigation-permission="' + item.permission + '"' : ''
    ].filter(Boolean).join(' ');
    return '<' + tag + ' class="' + classes + '" ' + attrs + '>' +
      (item.icon ? icon(item.icon) : '') + '<span>' + item.label + '</span></' + tag + '>';
  }

  function updateCollapseButton(config, collapsed) {
    const button = document.getElementById(config.collapseButtonId);
    if (!button) return;
    const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = collapsed
      ? '<i class="fas fa-angles-right"></i><span>Expand Sidebar</span>'
      : '<i class="fas fa-angles-left"></i><span>Collapse Sidebar</span>';
  }

  function setCollapsed(config, collapsed) {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    updateCollapseButton(config, collapsed);
    try { localStorage.setItem(config.collapseStorageKey, collapsed ? '1' : '0'); } catch (error) {}
  }

  function setupSearch(sidebar) {
    const input = sidebar.querySelector('[data-shared-nav-search]');
    if (!input) return;
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      sidebar.querySelectorAll('.nav-subitem, .nav-sub-subitem').forEach(item => {
        item.hidden = Boolean(query) && !item.textContent.toLowerCase().includes(query);
      });
    });
  }

  function closeResponsiveMenu() {
    document.body.classList.remove('mobile-nav-open');
    const button = document.getElementById('mobile-menu-btn');
    if (button) {
      button.setAttribute('aria-label', 'Open navigation');
      button.innerHTML = '<i class="fas fa-bars"></i>';
    }
  }

  function setupResponsiveShell(sidebar) {
    let menuButton = document.getElementById('mobile-menu-btn');
    let backdrop = document.querySelector('.mobile-nav-backdrop');
    if (!menuButton) {
      menuButton = document.createElement('button');
      menuButton.id = 'mobile-menu-btn';
      menuButton.className = 'mobile-menu-btn';
      menuButton.type = 'button';
      menuButton.setAttribute('aria-label', 'Open navigation');
      menuButton.innerHTML = '<i class="fas fa-bars"></i>';
      document.body.appendChild(menuButton);
    }
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'mobile-nav-backdrop';
      document.body.appendChild(backdrop);
    }
    if (menuButton.dataset.sharedNavigationBound !== '1') {
      menuButton.dataset.sharedNavigationBound = '1';
      menuButton.addEventListener('click', () => {
        const open = document.body.classList.toggle('mobile-nav-open');
        menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
        menuButton.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
      });
      backdrop.addEventListener('click', closeResponsiveMenu);
      window.addEventListener('resize', () => {
        if (window.innerWidth > 980) closeResponsiveMenu();
      });
    }
    sidebar.addEventListener('click', event => {
      if (event.target.closest('[data-screen], a, [data-account-settings]')) closeResponsiveMenu();
    });
  }

  function mount(config) {
    const sidebar = document.querySelector(config.sidebarSelector || '.sidebar');
    if (!sidebar) return null;
    sidebar.dataset.navigationModule = config.module;
    sidebar.setAttribute('aria-label', config.ariaLabel || config.module + ' navigation');
    sidebar.innerHTML = [
      '<div class="sidebar-logo"><div class="logo-mark"><img src="assets/Logo-04.png" alt="Pramukh Academy" style="width:44px;height:44px;object-fit:contain" /></div>',
        '<div class="logo-text">Pramukh Academy<span>' + config.suiteLabel + '</span></div></div>',
      '<div class="sidebar-search"><div class="sidebar-search-wrap"><i class="fas fa-search search-icon"></i>',
        '<input class="sidebar-search-input" data-shared-nav-search placeholder="' + config.searchPlaceholder + '" aria-label="Search ' + config.module + ' navigation" /></div></div>',
      '<nav class="sidebar-nav"><div class="nav-group">',
        config.menuItems.filter(item => !item.permission || config.permissions?.[item.permission] !== false).map(renderItem).join(''),
      '</div></nav>',
      '<div class="sidebar-account">',
        '<button type="button" class="sidebar-collapse-btn" id="' + config.collapseButtonId + '"><i class="fas fa-angles-left"></i><span>Collapse Sidebar</span></button>',
        config.onAccountSettings ? '<div class="nav-subitem account-settings-trigger" data-account-settings><i class="fas fa-user-cog" style="width:12px;color:inherit"></i><span>Account Settings</span></div>' : '',
      '</div>',
      '<div class="sidebar-footer"><div class="sidebar-help"><div class="help-icon"><i class="fas fa-headset"></i></div>',
        '<div class="help-text"><div class="help-title">Need Help?</div><div class="help-sub">' + config.supportLabel + '</div></div></div></div>'
    ].join('');

    sidebar.querySelectorAll('[data-submenu]').forEach(item => {
      item.addEventListener('click', event => {
        event.stopPropagation();
        const submenu = document.getElementById(item.dataset.submenu);
        if (!submenu) return;
        const open = !submenu.classList.contains('open');
        submenu.classList.toggle('open', open);
        item.classList.toggle('open', open);
        submenu.style.maxHeight = open ? '240px' : '0';
        const chevron = item.querySelector('[data-shared-chevron]');
        if (chevron) chevron.style.transform = open ? 'rotate(180deg)' : '';
      });
    });
    sidebar.querySelectorAll('[data-screen]').forEach(item => {
      item.addEventListener('click', event => {
        event.stopPropagation();
        config.onScreen?.(item.dataset.screen);
      });
    });
    sidebar.querySelectorAll('[data-shared-action]').forEach(item => {
      item.addEventListener('click', () => config.actions?.[item.dataset.sharedAction]?.());
    });
    sidebar.querySelector('[data-account-settings]')?.addEventListener('click', config.onAccountSettings);
    sidebar.querySelector('#' + config.collapseButtonId)?.addEventListener('click', () => {
      setCollapsed(config, !document.body.classList.contains('sidebar-collapsed'));
    });
    let collapsed = false;
    try { collapsed = localStorage.getItem(config.collapseStorageKey) === '1'; } catch (error) {}
    setCollapsed(config, collapsed);
    setupSearch(sidebar);
    setupResponsiveShell(sidebar);
    instances.set(config.module, { config, sidebar });
    setActive(config.module, config.activeScreen);
    return sidebar;
  }

  function setActive(module, screen) {
    const instance = instances.get(module);
    if (!instance) return;
    instance.sidebar.querySelectorAll('[data-screen]').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screen);
    });
    instance.sidebar.querySelectorAll('[data-submenu]').forEach(parent => {
      const submenu = document.getElementById(parent.dataset.submenu);
      const containsActive = Boolean(submenu?.querySelector('[data-screen="' + screen + '"]'));
      parent.classList.toggle('active', containsActive);
      parent.classList.toggle('open', containsActive);
      if (submenu) {
        submenu.classList.toggle('open', containsActive);
        submenu.style.maxHeight = containsActive ? '240px' : '0';
      }
    });
  }

  function renderBottomNav(options) {
    const nav = document.getElementById(options.targetId || 'mobile-bottom-nav');
    if (!nav) return;
    nav.classList.toggle('mobile-bottom-nav--compact', options.compact !== false);
    nav.innerHTML = options.items.map(item => {
      const active = item.id === options.activeId ? ' active' : '';
      return '<button class="mobile-bottom-nav__item' + active + '" type="button" data-shared-mobile="' + item.id + '">' +
        '<i class="fas ' + item.icon + '"></i><span>' + item.label + '</span></button>';
    }).join('') + (options.includeMenu ? '<button class="mobile-bottom-nav__item mobile-bottom-nav__item--menu" type="button" data-shared-mobile-menu><i class="fas fa-bars-staggered"></i><span>Menu</span></button>' : '');
    nav.querySelectorAll('[data-shared-mobile]').forEach(button => {
      button.addEventListener('click', () => options.onSelect?.(button.dataset.sharedMobile));
    });
    nav.querySelector('[data-shared-mobile-menu]')?.addEventListener('click', () => {
      if (document.body.classList.contains('mobile-nav-open')) closeResponsiveMenu();
      else document.getElementById('mobile-menu-btn')?.click();
    });
  }

  window.SharedNavigation = { mount, setActive, renderBottomNav, closeResponsiveMenu, setupResponsiveShell };
})();
