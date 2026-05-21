/* ================================================================
   方言连续体 · 音频波形背景（v2 - 不再触碰 textNode 与 i18n）
   注：原"厝/鼎/箸/泪/听"字符特效因为会拆分 textNode 与 i18n 收集冲突，
   导致切换语言卡顿、不刷新就不生效，已彻底移除该功能。
   保留方言连续体板块的滚动响应式音频波形背景。
   ================================================================ */
(function () {
  'use strict';

  function setupDialectWave() {
    var sect = document.querySelector('#dialect');
    if (!sect) return;
    // 防重入
    if (sect.querySelector(':scope > .dialect-wave')) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'dialect-wave';
    canvas.setAttribute('aria-hidden', 'true');
    sect.insertBefore(canvas, sect.firstChild);
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    var t = 0;
    var visibility = 0;

    function resize() {
      var rect = sect.getBoundingClientRect();
      W = Math.max(rect.width, 1);
      H = Math.max(rect.height, 1);
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visibility = e.intersectionRatio; });
      }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
      io.observe(sect);
    } else {
      visibility = 1;
    }

    function waveY(x, baseY, amp) {
      var k1 = 0.012, k2 = 0.026, k3 = 0.005;
      return baseY +
        Math.sin(x * k1 + t * 0.9) * amp +
        Math.sin(x * k2 + t * 1.4 + 1.3) * amp * 0.45 +
        Math.sin(x * k3 - t * 0.5 + 2.1) * amp * 0.7;
    }

    function buildGradient(alpha) {
      var g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(255,138,61,' + alpha + ')');
      g.addColorStop(0.5, 'rgba(176,106,216,' + alpha + ')');
      g.addColorStop(1, 'rgba(31,122,140,' + alpha + ')');
      return g;
    }

    var rafId = null;
    function draw() {
      t += 0.018;
      ctx.clearRect(0, 0, W, H);

      var bg = ctx.createLinearGradient(0, 0, W, 0);
      bg.addColorStop(0, 'rgba(255,138,61,0.08)');
      bg.addColorStop(0.5, 'rgba(176,106,216,0.05)');
      bg.addColorStop(1, 'rgba(31,122,140,0.10)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      var baseY = H * 0.5;
      var ampMax = Math.min(H * 0.18, 90);
      var amp = ampMax * (0.35 + visibility * 0.65);

      var lines = [
        { off: 0, alpha: 0.55, w: 2.2, scale: 1.0 },
        { off: 18, alpha: 0.32, w: 1.6, scale: 0.85 },
        { off: -22, alpha: 0.28, w: 1.4, scale: 1.15 },
        { off: 36, alpha: 0.18, w: 1.0, scale: 0.7 }
      ];

      lines.forEach(function (ln, idx) {
        ctx.beginPath();
        var step = 4;
        for (var x = 0; x <= W; x += step) {
          var y = waveY(x + idx * 30, baseY + ln.off, amp * ln.scale);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = ln.w;
        ctx.strokeStyle = buildGradient(ln.alpha);
        ctx.shadowColor = 'rgba(176,106,216,' + (ln.alpha * 0.6) + ')';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      ctx.beginPath();
      var step2 = 6;
      for (var x2 = 0; x2 <= W; x2 += step2) {
        var y2 = waveY(x2, baseY, amp);
        if (x2 === 0) ctx.moveTo(x2, y2);
        else ctx.lineTo(x2, y2);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      var fillG = ctx.createLinearGradient(0, baseY, 0, H);
      fillG.addColorStop(0, 'rgba(176,106,216,0.10)');
      fillG.addColorStop(1, 'rgba(31,122,140,0.0)');
      ctx.fillStyle = fillG;
      ctx.fill();

      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame(draw);
  }

  /* -------- 字符特效（仅 hover 视觉，不拆 textNode）--------
     用 CSS-only 方案：data-glyph 属性触发；本脚本仅作为占位，不再 wrap textNode。
     如需字符艺术特效，请在 HTML 中手动给关键字符加 <span class="glyph" data-char="泪">泪</span>。
  */

  function init() {
    try { setupDialectWave(); } catch (e) { /* ignore */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
