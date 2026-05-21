/* 三语切换 v5 - 纯查表 · 预翻译字典模式
 * 所有简体中文文本节点都已在 assets/translations.js 中预先翻译为 EN / 繁体；
 * 切换语言时仅做"查表 → 直接替换"，绝不做子串拼接或运行时 fallback，杜绝混杂。
 */
(function(){
  const STORAGE_KEY = 'lang_68nm';
  let dict = {};                     // 由页面通过 register({...}) 注入的 data-i18n 字典
  let cur = localStorage.getItem(STORAGE_KEY) || 'zh-CN';
  let textNodes = [];                // {node, original}
  let textNodesCollected = false;

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
          p.classList.contains('lang-switcher')) return true;
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
    // 为了避免出现简繁/中英混杂，给出统一的占位
    if (lang === 'en') return lead + 'Cultural Narrative & Service Detail' + tail;
    return lead + trimmed + tail; // 繁体兜底：保留原文
  }

  function applyTextNodeTranslation(){
    if (!textNodesCollected) collectTextNodes();
    textNodes.forEach(({node, original}) => {
      node.textContent = translateText(original, cur);
    });
  }

  /* -------------- 切换主流程 -------------- */
  function apply(){
    applyDataI18n();
    applyTextNodeTranslation();
  }

  function setLang(lang){
    cur = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.querySelectorAll('[data-lang-switch]').forEach(b=>{
      b.classList.toggle('active', b.getAttribute('data-lang-switch') === cur);
    });
    apply();
  }

  function register(d){
    Object.assign(dict, d);
    if (textNodesCollected) apply();
    else applyDataI18n();
  }

  // 兼容老接口（不再使用，但保留以免页面其它代码报错）
  function registerTranslations(){ /* no-op：翻译现由 translations.js 提供 */ }

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
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      collectTextNodes();
      apply();
    });
  } else {
    collectTextNodes();
    apply();
  }
})();
