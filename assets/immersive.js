/* 68海里·两面 — Immersive Layer v1
 * 沉浸式视觉与交互增强
 * 模块：
 *   1) BGM 控制器（自动播放 + 用户友好的静音按钮 + 循环 + 浏览器 autoplay 兼容）
 *   2) 首屏 Hero WebGL/Canvas 海浪着色器（不依赖第三方库）
 *   3) 蓝眼泪粒子层（自动渲染到 #bluetears 节内 canvas）
 *   4) 滚动驱动的数字计数器
 *   5) 视差 + 进入视口的渐显动画
 *   6) iOS 毛玻璃 + 微交互（CSS 注入）
 */
(function () {
  'use strict';

  // ============ 0. 注入全局 CSS（毛玻璃 / 微交互 / 动画） ============
  const css = `
  :root{
    --aqua:#0e5267; --aqua-glow:#56b8d6; --pearl:#56e2e8;
    --tear:#7c5fff; --tear-glow:#b794ff;
  }
  /* 全站滚动平滑 */
  html{scroll-behavior:smooth}
  /* iOS 毛玻璃 utility */
  .glass{
    background:rgba(255,255,255,.62);
    -webkit-backdrop-filter:saturate(180%) blur(18px);
    backdrop-filter:saturate(180%) blur(18px);
    border:1px solid rgba(255,255,255,.5);
    box-shadow:0 12px 40px -8px rgba(20,30,50,.18);
  }
  .glass-dark{
    background:rgba(20,25,35,.55);
    -webkit-backdrop-filter:saturate(180%) blur(20px);
    backdrop-filter:saturate(180%) blur(20px);
    border:1px solid rgba(255,255,255,.12);
  }

  /* 视口进场动画 */
  .reveal{opacity:0;transform:translateY(28px);transition:opacity 1s cubic-bezier(.2,.8,.2,1), transform 1s cubic-bezier(.2,.8,.2,1)}
  .reveal.in{opacity:1;transform:translateY(0)}

  /* 卡片悬浮 */
  .role-card,.pkg,.b-block,.ai-cell,.num-it,.merch-card{transition:transform .55s cubic-bezier(.2,.8,.2,1), box-shadow .55s, background .3s}
  .role-card:hover,.pkg:hover,.ai-cell:hover,.merch-card:hover{transform:translateY(-6px);box-shadow:0 28px 60px -20px rgba(14,82,103,.35)}

  /* 按钮水波纹 */
  .cta,.primary,.solid,.line,.ghost,a.btn{position:relative;overflow:hidden;isolation:isolate}
  .cta::after,.primary::after,.solid::after,.line::after,.ghost::after,a.btn::after{
    content:'';position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,.45) 0%, transparent 45%);
    opacity:0;transition:opacity .4s
  }
  .cta:hover::after,.primary:hover::after,.solid:hover::after,.line:hover::after,.ghost:hover::after,a.btn:hover::after{opacity:1}

  /* CTA 主按钮发光脉冲 */
  .primary,a[class*='primary']{box-shadow:0 0 0 0 rgba(255,204,0,.0); animation:pulseY 3.6s ease-in-out infinite}
  @keyframes pulseY{
    0%,100%{box-shadow:0 6px 28px -10px rgba(255,204,0,.5)}
    50%{box-shadow:0 12px 50px -10px rgba(255,204,0,.85)}
  }

  /* hero 标题轻微浮动 */
  .hero h1{animation:floatY 6.5s ease-in-out infinite}
  @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

  /* 海浪 canvas 全屏 */
  #wave-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;mix-blend-mode:normal;opacity:.95}
  .hero{position:relative;isolation:isolate}
  .hero .frame, .hero .inner, .hero .scroll-tip{position:relative;z-index:4}

  /* 蓝眼泪粒子 */
  .tears-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:auto;cursor:crosshair}

  /* 滚动条美化 */
  ::-webkit-scrollbar{width:10px;height:10px}
  ::-webkit-scrollbar-track{background:rgba(0,0,0,.04)}
  ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#1a1612,#7a5a3a);border-radius:6px}

  /* BGM 浮窗 */
  .bgm-fab{position:fixed;right:18px;bottom:18px;width:48px;height:48px;border-radius:50%;
    background:rgba(20,25,35,.78);color:#ffcc00;border:1.5px solid rgba(255,204,0,.5);
    display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9999;
    -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
    box-shadow:0 8px 24px rgba(0,0,0,.25);transition:transform .3s, box-shadow .3s}
  .bgm-fab:hover{transform:scale(1.06);box-shadow:0 12px 30px rgba(0,0,0,.35)}
  .bgm-fab svg{width:22px;height:22px;fill:currentColor}
  .bgm-fab .bars{display:flex;gap:2px;align-items:flex-end;height:18px}
  .bgm-fab .bars i{display:block;width:3px;height:6px;background:#ffcc00;border-radius:2px;animation:bar 1.1s ease-in-out infinite}
  .bgm-fab .bars i:nth-child(2){animation-delay:.18s;height:14px}
  .bgm-fab .bars i:nth-child(3){animation-delay:.34s;height:9px}
  .bgm-fab .bars i:nth-child(4){animation-delay:.52s;height:16px}
  .bgm-fab.muted .bars i{animation:none;height:6px;opacity:.45}
  @keyframes bar{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1.1)}}
  .bgm-tip{position:fixed;right:78px;bottom:24px;background:rgba(20,25,35,.92);color:#fff;
    padding:8px 14px;font-size:12px;letter-spacing:1px;border-radius:24px;
    -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);z-index:9998;
    pointer-events:none;opacity:0;transform:translateX(8px);transition:opacity .35s,transform .35s}
  .bgm-tip.show{opacity:1;transform:translateX(0)}

  /* 数字计数器在视口内放大动效 */
  .num-it{transition:transform .8s cubic-bezier(.2,.8,.2,1)}
  .num-it.in .v{display:inline-block;animation:popN .8s cubic-bezier(.34,1.56,.64,1)}
  @keyframes popN{0%{transform:scale(.6);opacity:0}100%{transform:scale(1);opacity:1}}

  /* 减少动画偏好 */
  @media (prefers-reduced-motion: reduce){
    .hero h1{animation:none}
    .reveal{transition:none}
    .primary{animation:none}
  }
  `;
  const style = document.createElement('style');
  style.id = 'immersive-css';
  style.textContent = css;
  document.head.appendChild(style);

  // ============ 1. BGM 控制器（v3 · 静音段自动跳过 + 高可靠循环 + 跨平台）============
  function initBGM() {
    if (document.getElementById('site-bgm')) return;

    const SRC = 'assets/site_bgm.mp3?v=20260521-2220';
    const SILENCE_KEY = 'bgm_silence_offset_v3';   // v3：物理裁剪后重新检测，不读旧缓存
    const VOLUME = 0.36;
    const MUTE_KEY = 'bgm_muted_v3';

    const audio = document.createElement('audio');
    audio.id = 'site-bgm';
    audio.src = SRC;
    audio.loop = false;                // ⚠ 关键：不用原生 loop（会回到 0 触发静音段），改手动 seek
    audio.volume = VOLUME;
    // 微信内置浏览器：preload=metadata 减少初始下载与解码负载，避免与图片争带宽
    audio.preload = /micromessenger|wechat/i.test(navigator.userAgent) ? 'metadata' : 'auto';
    audio.crossOrigin = 'anonymous';   // 允许 Web Audio 解码（同源不影响）
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.setAttribute('x-webkit-airplay', 'allow');
    document.body.appendChild(audio);

    // 浮动按钮
    const fab = document.createElement('button');
    fab.className = 'bgm-fab';
    fab.setAttribute('aria-label', '背景音乐开关');
    fab.innerHTML = '<div class="bars"><i></i><i></i><i></i><i></i></div>';
    document.body.appendChild(fab);

    // 提示气泡
    const tip = document.createElement('div');
    tip.className = 'bgm-tip';
    tip.textContent = '点击页面任意处启动 BGM ♫';
    document.body.appendChild(tip);

    // 使用新 KEY，避免旧版本误把用户锁在静音状态；默认不静音。
    let userMuted = localStorage.getItem(MUTE_KEY) === '1';
    let unlocked = false;
    let watchdogTimer = null;
    // 起始 offset：mp3 已物理裁剪，默认 0；若后续检测到极小前导静音再自动更新。
    let startOffset = parseFloat(localStorage.getItem(SILENCE_KEY) || '0') || 0;
    if (!isFinite(startOffset) || startOffset < 0 || startOffset > 3) startOffset = 0;
    let endOffset = 0;          // 末尾"静音/淡出"裁剪点；0 = 自动用 audio.duration

    function syncFabUI() {
      const playing = !audio.paused && !audio.muted && audio.currentTime > 0;
      fab.classList.toggle('muted', !playing);
    }

    function showTip(text, duration) {
      tip.textContent = text || '♫ BGM 已启动';
      tip.classList.add('show');
      clearTimeout(showTip._t);
      showTip._t = setTimeout(() => tip.classList.remove('show'), duration || 2800);
    }

    function safePlay() {
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        return p.catch(() => false).then(() => true);
      }
      return Promise.resolve(true);
    }

    // 跳到起始位置（跳过前导静音）
    function seekToStart() {
      try {
        // 加一个小余量 0.05s，避免 seek 卡在 buffer 边界
        const target = startOffset > 0 ? startOffset + 0.02 : 0;
        if (Math.abs(audio.currentTime - target) > 0.1) {
          audio.currentTime = target;
        }
      } catch (e) {}
    }

    // 核心：手动循环 - 接近末尾时 seek 回起始
    function setupSmartLoop() {
      audio.addEventListener('timeupdate', () => {
        const dur = endOffset > 0 ? endOffset : (audio.duration || 0);
        if (!dur || !isFinite(dur)) return;
        // 距末尾 0.25s 内提前 seek 回起始（避免触发 ended 后短暂停顿）
        if (audio.currentTime >= dur - 0.25) {
          seekToStart();
          if (audio.paused && !userMuted) safePlay();
        }
      });
      // 兜底：如果还是 ended 了，立即 seek + 重播
      audio.addEventListener('ended', () => {
        seekToStart();
        if (!userMuted) safePlay();
      });
      // canplay 时立即 seek 到起始（不要从 0 开始播放静音）
      audio.addEventListener('loadedmetadata', () => {
        seekToStart();
      });
    }
    setupSmartLoop();

    // ============ Web Audio 静音段检测 ============
    // 仅在第一次没缓存或缓存为 0 时执行；解码完成后写 localStorage
    // 微信 / X5 / WKWebView 性能优化：跳过 Web Audio 解码（mp3 已物理裁剪静音段）
    const IS_WX = /micromessenger|wechat/i.test(navigator.userAgent);
    const IS_LOW_END = IS_WX || /Android.*(?:Chrome\/[1-7]\d\.|Mobile)/i.test(navigator.userAgent);

    function detectSilenceOffset() {
      if (IS_LOW_END) return;          // 微信/低端移动浏览器：跳过 Web Audio，减少 CPU 占用
      if (startOffset > 0) return;     // 已经有缓存，跳过
      if (!window.AudioContext && !window.webkitAudioContext) return;

      // 采用 fetch + decodeAudioData
      fetch(SRC)
        .then(r => r.ok ? r.arrayBuffer() : Promise.reject('fetch fail'))
        .then(buf => {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          const ctx = new Ctx();
          // decodeAudioData 在某些浏览器需要 Promise 风格
          return new Promise((resolve, reject) => {
            try {
              const p = ctx.decodeAudioData(buf, resolve, reject);
              if (p && typeof p.then === 'function') p.then(resolve, reject);
            } catch (e) { reject(e); }
          }).then(decoded => {
            // 算前导静音
            const sr = decoded.sampleRate;
            const ch0 = decoded.getChannelData(0);
            const ch1 = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : null;
            // 阈值：-50dB ≈ amplitude 0.003
            const THRESH = 0.005;
            const WINDOW = Math.floor(sr * 0.02);   // 20ms 窗口的 RMS
            let leadSec = 0;
            for (let i = 0; i + WINDOW < ch0.length; i += WINDOW) {
              let sum = 0;
              for (let j = 0; j < WINDOW; j++) {
                const a = ch0[i + j];
                const b = ch1 ? ch1[i + j] : a;
                sum += (a * a + b * b) * 0.5;
              }
              const rms = Math.sqrt(sum / WINDOW);
              if (rms > THRESH) {
                leadSec = i / sr;
                break;
              }
            }
            // 算尾部静音（避免循环时尾部空白）
            let tailSec = decoded.duration;
            for (let i = ch0.length - WINDOW; i > 0; i -= WINDOW) {
              let sum = 0;
              for (let j = 0; j < WINDOW; j++) {
                const a = ch0[i + j] || 0;
                const b = ch1 ? (ch1[i + j] || 0) : a;
                sum += (a * a + b * b) * 0.5;
              }
              const rms = Math.sqrt(sum / WINDOW);
              if (rms > THRESH) {
                tailSec = (i + WINDOW) / sr;
                break;
              }
            }
            // 应用结果
            if (leadSec >= 0.1 && leadSec < 30) {
              startOffset = Math.max(0, leadSec - 0.05);   // 留 50ms 余量避免削掉真起音
              try { localStorage.setItem(SILENCE_KEY, String(startOffset)); } catch (e) {}
              // 如果当前还在静音段播放，立即跳过去
              if (!audio.paused && audio.currentTime < startOffset) seekToStart();
              else if (audio.currentTime < startOffset) seekToStart();
            }
            if (tailSec > 0 && tailSec < decoded.duration - 0.05) {
              endOffset = tailSec + 0.05;
            }
            // 关闭 ctx 释放内存
            if (ctx.close) ctx.close().catch(() => {});
          });
        })
        .catch(() => { /* 静默失败，不影响播放 */ });
    }

    // 1. 初始尝试：先尝试有声自动播放（桌面端/已授权环境可直接响）。
    // 若浏览器拦截，再降级为静音预加载，等待首次用户手势立即解锁。
    audio.muted = userMuted;
    seekToStart();
    safePlay().then(() => {
      if (!audio.paused && !audio.muted) {
        unlocked = true;
        startWatchdog();
        syncFabUI();
      } else if (audio.paused) {
        audio.muted = true;
        safePlay();
      }
    });

    // 2. 用户手势解锁
    function tryUnlock() {
      if (unlocked) return;
      audio.muted = userMuted;
      seekToStart();
      safePlay().then(() => {
        if (!audio.paused) {
          unlocked = true;
          syncFabUI();
          if (!userMuted) showTip('♫ BGM 已启动 · 点击右下角可静音', 3200);
          unlockEvents.forEach(ev => document.removeEventListener(ev, tryUnlock, true));
          startWatchdog();
          // 解锁后才执行静音段检测（避免不必要的网络/CPU 开销）
          detectSilenceOffset();
        }
      });
    }

    const unlockEvents = ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'];
    unlockEvents.forEach(ev =>
      document.addEventListener(ev, tryUnlock, { capture: true, passive: true })
    );

    // 3. Watchdog
    function startWatchdog() {
      if (watchdogTimer) return;
      watchdogTimer = setInterval(() => {
        if (userMuted) { syncFabUI(); return; }
        if (!document.body.contains(audio)) {
          document.body.appendChild(audio);
        }
        if (audio.ended) {
          seekToStart();
        }
        if (audio.paused) {
          audio.muted = false;
          safePlay();
        }
        // 极端情况：currentTime 卡在 0 或静音段（如某些浏览器 seek 失败）
        if (!audio.paused && startOffset > 0 && audio.currentTime < startOffset - 0.1) {
          seekToStart();
        }
        syncFabUI();
      }, 1500);
    }

    // 4. visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (unlocked && !userMuted && audio.paused) {
        audio.muted = false;
        safePlay();
      }
      syncFabUI();
    });

    // 5. FAB 点击
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!unlocked) {
        userMuted = false;
        localStorage.setItem(MUTE_KEY, '0');
        audio.muted = false;
        seekToStart();
        safePlay().then(() => {
          unlocked = !audio.paused;
          syncFabUI();
          if (unlocked) {
            showTip('♫ BGM 已启动 · 再次点击可静音', 3000);
            startWatchdog();
            detectSilenceOffset();
          }
        });
        return;
      }
      userMuted = !userMuted;
      localStorage.setItem(MUTE_KEY, userMuted ? '1' : '0');
      audio.muted = userMuted;
      if (!userMuted) safePlay();
      showTip(userMuted ? '🔇 BGM 已静音' : '♫ BGM 恢复播放', 1800);
      syncFabUI();
    });

    // 6. i18n 切换钩子
    window.addEventListener('i18nchanged', () => {
      requestAnimationFrame(() => {
        if (unlocked && !userMuted && audio.paused) {
          audio.muted = false;
          safePlay();
        }
        syncFabUI();
      });
    });

    // 7. 网络错误重试
    audio.addEventListener('error', () => {
      setTimeout(() => {
        try { audio.load(); seekToStart(); safePlay(); } catch (e) {}
      }, 3000);
    });

    audio.addEventListener('playing', syncFabUI);
    audio.addEventListener('pause', syncFabUI);
    audio.addEventListener('volumechange', syncFabUI);

    syncFabUI();
  }

  // ============ 2. 首屏海浪 Canvas（全屏分层动态） ============
  function initWave() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'wave-canvas';
    hero.insertBefore(canvas, hero.firstChild);

    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 天空粒子（漂浮微光）
    const skyDots = [];
    function spawnSky(){
      skyDots.length = 0;
      const N = Math.max(40, Math.min(80, Math.floor(w * h / 22000)));
      for (let i = 0; i < N; i++) {
        skyDots.push({
          x: Math.random() * w,
          y: Math.random() * (h * 0.55),
          r: Math.random() * 1.4 + 0.4,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.08,
          a: Math.random() * 0.6 + 0.25,
          tw: Math.random() * Math.PI * 2
        });
      }
    }

    function resize() {
      const r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      spawnSky();
    }
    resize();
    window.addEventListener('resize', () => { dpr = Math.min(window.devicePixelRatio || 1, 2); resize(); });

    let mx = 0.5, my = 0.5;
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width;
      my = (e.clientY - r.top) / r.height;
    });

    // 5 层水波，由远（上方）到近（下方）覆盖整个海面
    const waves = [
      { amp: 6,  len: 380, speed: 0.014, y: 0.52, color: 'rgba(80, 165, 200, 0.20)' },
      { amp: 10, len: 300, speed: 0.018, y: 0.62, color: 'rgba(40, 130, 175, 0.30)' },
      { amp: 16, len: 260, speed: 0.022, y: 0.72, color: 'rgba(20, 95, 140, 0.42)' },
      { amp: 22, len: 220, speed: 0.026, y: 0.82, color: 'rgba(10, 60, 95, 0.55)' },
      { amp: 14, len: 480, speed: 0.010, y: 0.92, color: 'rgba(255, 215, 110, 0.10)' }
    ];

    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, w, h);

      // 上半区：夜空渐变
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, 'rgba(8, 14, 30, 0.0)');
      sky.addColorStop(1, 'rgba(20, 60, 95, 0.18)');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.6);

      // 漂浮的天空粒子（随时间闪烁）
      skyDots.forEach(d => {
        d.x += d.vx + (mx - 0.5) * 0.04;
        d.y += d.vy;
        d.tw += 0.04;
        if (d.x < -5) d.x = w + 5;
        if (d.x > w + 5) d.x = -5;
        if (d.y < 0) d.y = h * 0.55;
        if (d.y > h * 0.55) d.y = 0;
        const flick = (Math.sin(d.tw) + 1) * 0.5;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,224,160,${d.a * (0.6 + flick * 0.4)})`;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 海平线主光带
      const horizonY = h * 0.50;
      const hg = ctx.createLinearGradient(0, horizonY - 20, 0, horizonY + 20);
      hg.addColorStop(0, 'rgba(255,210,130,0)');
      hg.addColorStop(0.5, 'rgba(255,225,140,0.28)');
      hg.addColorStop(1, 'rgba(255,210,130,0)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, horizonY - 20, w, 40);

      // 月光反射（跟随鼠标）
      const moonX = w * (0.30 + (mx - 0.5) * 0.18);
      const moonY = h * (0.36 + (my - 0.5) * 0.08);
      const moon = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 280);
      moon.addColorStop(0, 'rgba(255, 235, 170, 0.38)');
      moon.addColorStop(0.4, 'rgba(255, 220, 130, 0.18)');
      moon.addColorStop(1, 'rgba(255, 200, 120, 0)');
      ctx.fillStyle = moon;
      ctx.fillRect(0, 0, w, h);

      // 月光垂直水面倒影（细长光柱）
      const refl = ctx.createLinearGradient(0, h * 0.5, 0, h);
      refl.addColorStop(0, 'rgba(255, 230, 150, 0.32)');
      refl.addColorStop(1, 'rgba(255, 230, 150, 0)');
      ctx.fillStyle = refl;
      const reflW = 60 + Math.sin(t * 0.04) * 8;
      ctx.fillRect(moonX - reflW / 2, h * 0.5, reflW, h * 0.5);

      // 多层水波
      waves.forEach(wv => {
        ctx.beginPath();
        ctx.moveTo(0, h);
        const offset = (mx - 0.5) * 60;
        for (let x = 0; x <= w; x += 5) {
          const y = h * wv.y
            + Math.sin((x + t * (1000 * wv.speed)) / wv.len * Math.PI * 2 + offset / 100) * wv.amp
            + Math.sin((x + t * (1000 * wv.speed * 0.7)) / (wv.len * 0.6) * Math.PI * 2) * wv.amp * 0.35;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = wv.color;
        ctx.fill();
      });

      // 海面闪光高光（随机点状）
      ctx.fillStyle = 'rgba(255, 255, 230, 0.8)';
      for (let i = 0; i < 6; i++) {
        const px = (t * 0.7 + i * 137) % w;
        const py = h * (0.55 + (i % 3) * 0.08) + Math.sin(t * 0.04 + i) * 6;
        const sz = (Math.sin(t * 0.06 + i * 1.3) + 1) * 0.8 + 0.3;
        if (sz > 0.8) {
          ctx.globalAlpha = (sz - 0.8) * 1.5;
          ctx.beginPath();
          ctx.arc(px, py, sz, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      t += 1;
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ============ 3. 蓝眼泪粒子层 ============
  function initTears() {
    const section = document.querySelector('#bluetears');
    if (!section) return;
    section.style.position = section.style.position || 'relative';
    const canvas = document.createElement('canvas');
    canvas.className = 'tears-canvas';
    section.insertBefore(canvas, section.firstChild);

    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const r = section.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const stars = [];
    function spawn(n, x, y, burst) {
      for (let i = 0; i < n; i++) {
        stars.push({
          x: x ?? Math.random() * w,
          y: y ?? Math.random() * h,
          vx: (Math.random() - 0.5) * (burst ? 3.5 : 0.4),
          vy: (Math.random() - 0.5) * (burst ? 3.5 : 0.4),
          r: Math.random() * 2 + 0.6,
          life: 1,
          color: Math.random() > 0.3
            ? `rgba(124,95,255,${0.6 + Math.random() * 0.4})`
            : `rgba(86,226,232,${0.6 + Math.random() * 0.4})`
        });
      }
    }
    spawn(120);

    canvas.addEventListener('click', (e) => {
      const r = canvas.getBoundingClientRect();
      spawn(28, e.clientX - r.left, e.clientY - r.top, true);
    });

    function step() {
      ctx.clearRect(0, 0, w, h);
      // 微弱底色
      ctx.fillStyle = 'rgba(0,0,0,0)';
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += s.vx; s.y += s.vy;
        s.vx *= 0.985; s.vy *= 0.985;
        s.life -= 0.0006;
        if (s.life <= 0 || s.x < -10 || s.x > w + 10 || s.y < -10 || s.y > h + 10) {
          if (stars.length < 200) { stars[i] = makeBg(); } else { stars.splice(i, 1); }
          continue;
        }
        ctx.beginPath();
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
        grad.addColorStop(0, s.color);
        grad.addColorStop(1, 'rgba(124,95,255,0)');
        ctx.fillStyle = grad;
        ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = s.life;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(step);
    }
    function makeBg() {
      return {
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.6, life: 1,
        color: Math.random() > 0.3
          ? `rgba(124,95,255,${0.6 + Math.random() * 0.4})`
          : `rgba(86,226,232,${0.6 + Math.random() * 0.4})`
      };
    }
    step();
  }

  // ============ 4. 滚动驱动数字计数器 + reveal ============
  function initScrollFx() {
    const counters = document.querySelectorAll('.num-it .v');
    const reveals = document.querySelectorAll('.sec-head, .sells, .nums, .pkgs, .pass, .ai-grid, .b-grid, .gallery, .role-card, .merch-card');
    reveals.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        // 计数动画
        if (en.target.matches('.num-it')) {
          const v = en.target.querySelector('.v');
          const target = (v.textContent || '').trim();
          const m = target.match(/^(\d+)([^\d].*)?$/);
          if (m) {
            const end = parseInt(m[1], 10);
            const tail = m[2] || '';
            let cur = 0;
            const dur = 1100;
            const t0 = performance.now();
            function tick(t) {
              const k = Math.min(1, (t - t0) / dur);
              const ease = 1 - Math.pow(1 - k, 3);
              cur = Math.round(end * ease);
              v.textContent = cur + tail;
              if (k < 1) requestAnimationFrame(tick);
              else v.textContent = target;
            }
            requestAnimationFrame(tick);
          }
        }
        io.unobserve(en.target);
      });
    }, { threshold: 0.18 });

    document.querySelectorAll('.num-it').forEach(el => { el.classList.add('reveal'); io.observe(el); });
    reveals.forEach(el => io.observe(el));
  }

  // ============ 5. 按钮水波纹定位 ============
  function initRipple() {
    document.addEventListener('mousemove', (e) => {
      const t = e.target.closest('.cta,.primary,.solid,.line,.ghost');
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      t.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  }

  // ============ DOM Ready 启动 ============
  function boot() {
    initBGM();
    initWave();
    initTears();
    initScrollFx();
    initRipple();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
