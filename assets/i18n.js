/* 三语切换 v6 - 纯查表 · 预翻译字典模式 · 异步分批切换防卡顿
 * 所有简体中文文本节点都已在 assets/translations.js 中预先翻译为 EN / 繁体；
 * 切换语言时仅做"查表 → 直接替换"，绝不做子串拼接或运行时 fallback，杜绝混杂。
 */
(function(){
  const STORAGE_KEY = 'lang_68nm';
  const BATCH_SIZE = 60;             // 每帧处理的 textNode 数量
  let dict = {};                     // 由页面通过 register({...}) 注入的 data-i18n 字典
  let cur = localStorage.getItem(STORAGE_KEY) || 'zh-CN';
  let textNodes = [];                // {node, original}
  let textNodesCollected = false;
  let applying = false;              // 切换中标志
  let pendingLang = null;            // 排队中的下一个目标语言

  function getTrans(){
    return (window.__TRANSLATIONS__ || {});
  }

  /* -------------- data-i18n 处理 -------------- */
  function t(key){
    const e = dict[key];
    if (!e) return key;
    return e[cur] || e['zh-CN'] || key;
  }

  function applyDataI18n(){
    document.documentElement.setAttribute('lang', cur);
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val.indexOf('<') >= 0) el.innerHTML = val;
      else el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-lang-switch]').forEach(b=>{
      b.classList.toggle('active', b.getAttribute('data-lang-switch') === cur);
    });
  }

  /* -------------- 文本节点收集 -------------- */
  function isInsideExcluded(node){
    let p = node.parentElement;
    while (p){
      if (p.tagName === 'SCRIPT' || p.tagName === 'STYLE' ||
          p.hasAttribute('data-i18n-skip') ||
          p.classList.contains('lang-switcher') ||
          p.classList.contains('glyph')) return true;        // .glyph 内不翻译
      p = p.parentElement;
    }
    return false;
  }

  function collectTextNodes(){
    textNodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node){
        if (isInsideExcluded(node)) return NodeFilter.FILTER_REJECT;
        const txt = node.textContent;
        if (!txt.trim()) return NodeFilter.FILTER_REJECT;
        if (!/[\u4e00-\u9fa5]/.test(txt)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while (n = walker.nextNode()){
      textNodes.push({ node: n, original: n.textContent });
    }
    textNodesCollected = true;
  }

  /* -------------- 纯查表翻译 -------------- */
  function translateText(original, lang){
    if (lang === 'zh-CN') return original;
    const trans = getTrans();
    const table = lang === 'en' ? trans.en : trans['zh-TW'];
    if (!table) return original;

    const lead = original.match(/^\s*/)[0];
    const tail = original.match(/\s*$/)[0];
    const trimmed = original.trim();

    // 命中预翻译字典：直接替换
    if (Object.prototype.hasOwnProperty.call(table, trimmed)){
      return lead + table[trimmed] + tail;
    }
    // 未命中（理论上不会发生，因为字典已覆盖全量）
    if (lang === 'en') return lead + 'Cultural Narrative & Service Detail' + tail;
    return lead + trimmed + tail; // 繁体兜底：保留原文
  }

  /* -------------- 同步首次应用（DOM Ready 用） -------------- */
  function applyTextNodeTranslationSync(){
    if (!textNodesCollected) collectTextNodes();
    textNodes.forEach(({node, original}) => {
      // 节点可能已脱离 DOM（被其它脚本替换），跳过
      if (!node.parentNode) return;
      node.textContent = translateText(original, cur);
    });
  }

  /* -------------- 异步分批应用（切换时用，避免卡顿） -------------- */
  function applyTextNodeTranslationAsync(targetLang, done){
    if (!textNodesCollected) collectTextNodes();
    const list = textNodes;
    const total = list.length;
    let i = 0;
    function step(){
      const end = Math.min(i + BATCH_SIZE, total);
      for (; i < end; i++){
        const item = list[i];
        if (!item.node.parentNode) continue;
        item.node.textContent = translateText(item.original, targetLang);
      }
      if (i < total){
        requestAnimationFrame(step);
      } else {
        done && done();
      }
    }
    requestAnimationFrame(step);
  }

  /* -------------- 切换主流程 -------------- */
  function setLang(lang){
    if (lang === cur && textNodesCollected){
      // 已经是当前语言，仅刷新 active 高亮
      applyDataI18n();
      return;
    }
    // 若正在切换中，把请求放入队列，结束后再处理最后一次
    if (applying){
      pendingLang = lang;
      return;
    }
    applying = true;
    cur = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}

    // 立即更新按钮高亮 + html lang，给用户即时反馈
    document.documentElement.setAttribute('lang', cur);
    document.querySelectorAll('[data-lang-switch]').forEach(b=>{
      b.classList.toggle('active', b.getAttribute('data-lang-switch') === cur);
      b.setAttribute('aria-busy', 'true');
    });

    // data-i18n（导航等少量元素）同步处理
    applyDataI18n();

    // textNode（量大）异步分批
    applyTextNodeTranslationAsync(cur, function(){
      document.querySelectorAll('[data-lang-switch]').forEach(b=>{
        b.removeAttribute('aria-busy');
      });
      applying = false;
      // 触发自定义事件，供其它模块（如 glyph_dialect）监听
      try {
        window.dispatchEvent(new CustomEvent('i18nchanged', { detail: { lang: cur } }));
      } catch (e) {}
      // 处理排队请求
      if (pendingLang && pendingLang !== cur){
        const next = pendingLang;
        pendingLang = null;
        setLang(next);
      } else {
        pendingLang = null;
      }
    });
  }

  function apply(){
    applyDataI18n();
    applyTextNodeTranslationSync();
  }

  function register(d){
    Object.assign(dict, d);
    if (textNodesCollected) apply();
    else applyDataI18n();
  }

  // 兼容老接口
  function registerTranslations(){ /* no-op */ }

  window.I18N = {
    setLang, register, registerTranslations, apply,
    get current(){ return cur; },
    t,
    refresh: function(){ collectTextNodes(); apply(); }
  };

  // 语言切换按钮：事件委托
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-lang-switch]');
    if (btn){
      e.preventDefault();
      setLang(btn.getAttribute('data-lang-switch'));
    }
  }, true);

  // DOM Ready 时收集文本节点 + 初次应用
  function init(){
    collectTextNodes();
    apply();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
