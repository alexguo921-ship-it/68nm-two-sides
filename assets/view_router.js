/* ================================================================
   视图路由器 - 把 nav 锚点跳转改为 Tab 切换式视图
   - 同 URL 不同视觉：每次只显示与当前 view 相关的 section 组
   - 保留 hero 在每个 view 顶部（缩略版），让用户始终能看到品牌
   - 回顶部按钮：滚动 > 400px 显示
   ================================================================ */
(function () {
  'use strict';

  // -------- 1. section ID -> view 映射 --------
  // 每个 view 包含的 section ID 列表（hero / entry 自动归 home）
  const VIEW_MAP = {
    home: { sections: [], navText: '首页' },
    story: { sections: ['story', 'dialect'], navText: '缘起' },
    packages: { sections: ['packages'], navText: '套餐' },
    pass: { sections: ['pass'], navText: 'PASS 卡' },
    bluetears: { sections: ['bluetears'], navText: '蓝眼泪' },
    merch: { sections: ['merch'], navText: '文创' },
    ai: { sections: ['yutu'], navText: 'AI 平台' },
    operator: { sections: ['operator'], navText: '合作机构' },
    about: { sections: ['about'], navText: '关于' }
  };

  // nav 链接 #xxx -> view 名
  const NAV_TO_VIEW = {
    '#story': 'story',
    '#packages': 'packages',
    '#pass': 'pass',
    '#bluetears': 'bluetears',
    '#merch': 'merch',
    '#yutu': 'ai',
    '#operator': 'operator',
    '#about': 'about'
  };

  // -------- 2. 给所有 section 自动打 data-view-group 标签 --------
  function tagSections() {
    // hero 和 entry 是 home（HTML 中可能已标记，再次确认）
    document.querySelectorAll('.hero, #entry').forEach(s => {
      if (!s.hasAttribute('data-view-group')) s.setAttribute('data-view-group', 'home');
    });

    // 按映射给指定 ID 的 section 打 view 标签
    Object.keys(VIEW_MAP).forEach(viewName => {
      VIEW_MAP[viewName].sections.forEach(sid => {
        const el = document.getElementById(sid);
        if (el) el.setAttribute('data-view-group', viewName);
      });
    });

    // 没有 ID 的 section（关键数字、石厝美学、AI原型 demos、真实风光、双角色入口里）
    // 把它们按 DOM 顺序归到上一个有 view 的 section 同组
    let lastView = 'home';
    document.querySelectorAll('section').forEach(s => {
      const v = s.getAttribute('data-view-group');
      if (v) { lastView = v; return; }
      // sec.b-block 也算
      s.setAttribute('data-view-group', lastView);
    });
    // .b-block 单独处理（operator）
    document.querySelectorAll('.b-block').forEach(s => {
      if (!s.getAttribute('data-view-group')) s.setAttribute('data-view-group', 'operator');
    });
  }

  // -------- 3. 切换视图 --------
  function setView(view, options) {
    options = options || {};
    if (!VIEW_MAP[view]) view = 'home';

    document.body.setAttribute('data-view', view);

    // home view = 显示所有 section（保留首页长滚动总览体验）
    // 其它 view = 仅显示 home 组（hero + entry 起到品牌+入口的作用）+ 该 view 组
    document.querySelectorAll('[data-view-group]').forEach(s => {
      const g = s.getAttribute('data-view-group');
      let visible;
      if (view === 'home') {
        visible = true;       // 全部显示，长滚动
      } else {
        visible = (g === 'home' && options.includeHero !== false) || (g === view);
      }
      s.classList.toggle('match-view', visible);
    });

    // 高亮 nav active
    document.querySelectorAll('.nav .links a').forEach(a => {
      const targetView = NAV_TO_VIEW[a.getAttribute('href')] || 'home';
      a.classList.toggle('view-active', targetView === view);
    });

    if (options.scrollTop !== false) {
      window.scrollTo({ top: 0, behavior: options.smooth === false ? 'auto' : 'smooth' });
    }

    try { window.dispatchEvent(new CustomEvent('viewchanged', { detail: { view } })); } catch (e) {}
    setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 50);
  }

  // -------- 4. 点击 nav 链接 -> 切视图 --------
  function bindNav() {
    document.addEventListener('click', function (e) {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (href === '#') return;

      // 如果是 nav 链接（在顶部 nav 内）→ 切换 view
      const inNav = a.closest('.nav');
      const view = NAV_TO_VIEW[href];

      if (inNav && view) {
        e.preventDefault();
        setView(view);
        return;
      }

      // hero CTAs / 角色卡 CTAs 等也可能用锚点 → 走 view 切换 + 滚到该 section
      if (view) {
        e.preventDefault();
        setView(view, { includeHero: false, smooth: true });
        // 滚到该 section
        setTimeout(() => {
          const target = document.querySelector(href);
          if (target) {
            const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }, 100);
        return;
      }

      // 其它锚点（页内的 #) 不拦截，浏览器自己处理
    });

    // 点 logo 回 home
    document.querySelectorAll('.nav .brand').forEach(b => {
      b.style.cursor = 'pointer';
      b.addEventListener('click', () => setView('home'));
    });
  }

  // -------- 5. 回顶部按钮 --------
  function setupBackTop() {
    const btn = document.createElement('button');
    btn.className = 'back-top-fab';
    btn.setAttribute('aria-label', '返回顶部');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="6 14 12 8 18 14"/></svg>';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const show = window.pageYOffset > 400;
        btn.classList.toggle('show', show);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // -------- 6. 初始化 --------
  function init() {
    tagSections();
    bindNav();
    setupBackTop();
    // 默认 home view（不滚动到顶，保留进入位置）
    setView('home', { scrollTop: false, smooth: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
