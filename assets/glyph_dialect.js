/* ================================================================
   字符特效 + 方言连续体音频波形背景
   - 自动扫描："厝、鼎、箸、泪、听"包裹为 .glyph[data-char]
   - "泪"悬停底部三点水蓝光滴落
   - #dialect 区背景画一条横贯潮汕暖橙→福州冷青的音频波形
   ================================================================ */
(function () {
  'use strict';

  // ---------- 1. 包裹特殊汉字 ----------
  var TARGET = ['厝', '鼎', '箸', '泪', '听'];
  function wrapGlyphs(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.parentNode) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        if (!p || p.nodeType !== 1) return NodeFilter.FILTER_REJECT;
        var tag = p.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CANVAS') return NodeFilter.FILTER_REJECT;
        if (p.classList && p.classList.contains('glyph')) return NodeFilter.FILTER_REJECT;
        // 跳过导航栏 / footer / sec-head 的英文等纯英文区
        if (p.closest && p.closest('.lang-switcher')) return NodeFilter.FILTER_REJECT;
        var hasTarget = TARGET.some(function (c) { return n.nodeValue.indexOf(c) !== -1; });
        return hasTarget ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], cur;
    while ((cur = walker.nextNode())) nodes.push(cur);
    nodes.forEach(function (textNode) {
      var txt = textNode.nodeValue;
      var frag = document.createDocumentFragment();
      var buf = '';
      for (var i = 0; i < txt.length; i++) {
        var ch = txt[i];
        if (TARGET.indexOf(ch) !== -1) {
          if (buf) { frag.appendChild(document.createTextNode(buf)); buf = ''; }
          var span = document.createElement('span');
          span.className = 'glyph';
          span.setAttribute('data-char', ch);
          span.textContent = ch;
          // 「泪」加水滴层
          if (ch === '泪') {
            var drops = document.createElement('span');
            drops.className = 'glyph-drops';
            drops.setAttribute('aria-hidden', 'true');
            drops.innerHTML =
              '<i class="d d1"></i><i class="d d2"></i><i class="d d3"></i>';
            span.appendChild(drops);
          }
          frag.appendChild(span);
        } else {
          buf += ch;
        }
      }
      if (buf) frag.appendChild(document.createTextNode(buf));
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  // ---------- 2. 方言连续体音频波形背景 ----------
  function setupDialectWave() {
    var sect = document.querySelector('#dialect');
    if (!sect) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'dialect-wave';
    canvas.setAttribute('aria-hidden', 'true');
    sect.insertBefore(canvas, sect.firstChild);
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    var t = 0;
    var visibility = 0; // 0~1，根据 IntersectionObserver

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

    // IntersectionObserver：根据可见比例驱动振幅
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { visibility = e.intersectionRatio; });
      }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });
      io.observe(sect);
    } else {
      visibility = 1;
    }

    // 多谐波叠加生成柔和波形
    function waveY(x, baseY, amp) {
      var k1 = 0.012, k2 = 0.026, k3 = 0.005;
      return baseY +
        Math.sin(x * k1 + t * 0.9) * amp +
        Math.sin(x * k2 + t * 1.4 + 1.3) * amp * 0.45 +
        Math.sin(x * k3 - t * 0.5 + 2.1) * amp * 0.7;
    }

    // 颜色：从潮汕暖橙 #ff8a3d -> 中段紫 #b06ad8 -> 福州冷青 #1f7a8c
    function buildGradient(alpha) {
      var g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(255,138,61,' + alpha + ')');
      g.addColorStop(0.5, 'rgba(176,106,216,' + alpha + ')');
      g.addColorStop(1, 'rgba(31,122,140,' + alpha + ')');
      return g;
    }

    function draw() {
      t += 0.018;
      ctx.clearRect(0, 0, W, H);

      // 背景渐变（柔和暖→冷的横向晕染）
      var bg = ctx.createLinearGradient(0, 0, W, 0);
      bg.addColorStop(0, 'rgba(255,138,61,0.08)');
      bg.addColorStop(0.5, 'rgba(176,106,216,0.05)');
      bg.addColorStop(1, 'rgba(31,122,140,0.10)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      var baseY = H * 0.5;
      var ampMax = Math.min(H * 0.18, 90);
      var amp = ampMax * (0.35 + visibility * 0.65); // 进入视口越多振幅越大

      // 4 条波，递减透明度
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

      // 主波下方：填充淡晕（模拟频谱下沉）
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

      requestAnimationFrame(draw);
    }
    draw();
  }

  // ---------- 启动 ----------
  function isCN() {
    var ls = (function () { try { return localStorage.getItem('lang_68nm'); } catch (e) { return null; } })();
    if (ls) return ls === 'zh-CN';
    var active = document.querySelector('[data-lang-switch].active');
    if (active) return active.getAttribute('data-lang-switch') === 'zh-CN';
    return true;
  }
  function unwrapGlyphs(root) {
    root.querySelectorAll('.glyph').forEach(function (g) {
      var ch = g.getAttribute('data-char') || g.textContent;
      var tn = document.createTextNode(ch);
      if (g.parentNode) g.parentNode.replaceChild(tn, g);
    });
  }
  function refreshGlyphs() {
    unwrapGlyphs(document.body);
    if (isCN()) {
      try { wrapGlyphs(document.body); } catch (e) { /* ignore */ }
    }
    // 通知 i18n 重新收集 textNode
    if (window.I18N && typeof window.I18N.refresh === 'function') {
      try { window.I18N.refresh(); } catch (e) { /* ignore */ }
    }
  }
  function init() {
    // 等 i18n 完成首次 apply 之后再包，给它一帧时间
    setTimeout(function () {
      refreshGlyphs();
      try { setupDialectWave(); } catch (e) { /* ignore */ }
    }, 50);

    // 语言切换：每次点切换按钮 250ms 后重建
    document.querySelectorAll('[data-lang-switch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTimeout(refreshGlyphs, 60);
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
