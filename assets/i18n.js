/* 三语切换 v7 - 稳定同步版
 * 目标：
 * 1) 永远以页面初始中文 textNode 为 source of truth；
 * 2) 切换语言同步完成，不排队、不异步残留，快速连点以最后一次点击为准；
 * 3) 字典未命中时保留原文，绝不输出任何统一占位文案。
 */
(function(){
  'use strict';

  const STORAGE_KEY = 'lang_68nm';
  const VALID = new Set(['zh-CN', 'en', 'zh-TW']);

  let dict = {};                  // data-i18n 字典
  let cur = VALID.has(localStorage.getItem(STORAGE_KEY)) ? localStorage.getItem(STORAGE_KEY) : 'zh-CN';
  let textNodes = [];             // { node, original }
  let textNodesCollected = false;

  function getTrans(){
    return window.__TRANSLATIONS__ || { en:{}, 'zh-TW':{} };
  }

  function t(key){
    const e = dict[key];
    if (!e) return key;
    return e[cur] || e['zh-CN'] || key;
  }

  function isInsideExcluded(node){
    let p = node.parentElement;
    while (p){
      if (
        p.tagName === 'SCRIPT' ||
        p.tagName === 'STYLE' ||
        p.tagName === 'NOSCRIPT' ||
        p.hasAttribute('data-i18n-skip') ||
        p.classList.contains('lang-switcher') ||
        p.classList.contains('glyph') ||
        p.id === 'site-bgm'
      ) return true;
      p = p.parentElement;
    }
    return false;
  }

  function collectTextNodes(){
    textNodes = [];
    if (!document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        if (isInsideExcluded(node)) return NodeFilter.FILTER_REJECT;
        const txt = node.textContent;
        if (!txt || !txt.trim()) return NodeFilter.FILTER_REJECT;
        // 只收中文原文节点：英文/数字/装饰符跳过
        if (!/[\u4e00-\u9fff]/.test(txt)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = walker.nextNode())){
      // 这里必须记录页面初始中文，后续永远不重写 original
      textNodes.push({ node: n, original: n.textContent });
    }
    textNodesCollected = true;
  }

  function translateText(original, lang){
    if (lang === 'zh-CN') return original;
    const table = lang === 'en' ? getTrans().en : getTrans()['zh-TW'];
    if (!table) return original;

    const lead = (original.match(/^\s*/) || [''])[0];
    const tail = (original.match(/\s*$/) || [''])[0];
    const trimmed = original.trim();

    if (Object.prototype.hasOwnProperty.call(table, trimmed)){
      return lead + table[trimmed] + tail;
    }
    // 绝不使用统一英文占位；漏翻译时保留原中文，避免展示事故。
    return lead + trimmed + tail;
  }

  function applyDataI18n(){
    document.documentElement.setAttribute('lang', cur);
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const val = t(el.getAttribute('data-i18n'));
      if (val.indexOf('<') >= 0) el.innerHTML = val;
      else el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-lang-switch]').forEach(b=>{
      b.classList.toggle('active', b.getAttribute('data-lang-switch') === cur);
      b.removeAttribute('aria-busy');
    });
  }

  function applyTextNodes(){
    if (!textNodesCollected) collectTextNodes();
    for (const item of textNodes){
      if (!item.node || !item.node.parentNode) continue;
      item.node.textContent = translateText(item.original, cur);
    }
  }

  function apply(){
    applyDataI18n();
    applyTextNodes();
  }

  function setLang(lang){
    if (!VALID.has(lang)) lang = 'zh-CN';
    cur = lang;
    try { localStorage.setItem(STORAGE_KEY, cur); } catch(e) {}
    // 同步完成，快速切换不会留下上一语言的异步任务
    apply();
    try { window.dispatchEvent(new CustomEvent('i18nchanged', { detail:{ lang: cur } })); } catch(e) {}
  }

  function register(d){
    Object.assign(dict, d || {});
    applyDataI18n();
  }

  function registerTranslations(){ /* 保留兼容老调用；主字典来自 translations.js */ }

  window.I18N = {
    setLang,
    register,
    registerTranslations,
    apply,
    refresh(){
      // 只在 DOM 结构大变时主动调用；会以当前 DOM 中文节点重建 source。
      // 正常语言切换不调用 refresh，避免把英文当 source。
      textNodesCollected = false;
      collectTextNodes();
      apply();
    },
    get current(){ return cur; },
    t
  };

  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-lang-switch]');
    if (!btn) return;
    e.preventDefault();
    // 不 stopPropagation：让 BGM 解锁监听也能收到同一次点击。
    setLang(btn.getAttribute('data-lang-switch'));
  }, true);

  function init(){
    collectTextNodes();
    apply();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();
