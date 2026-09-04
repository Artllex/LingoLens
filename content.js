'use strict';

(() => {
  const {
    DEFAULT_SETTINGS,
    normalizeLanguageCode,
    languageName,
    isHistoricalLanguage,
    isComputerLanguage,
    isMathematicalSystem,
    isSignalSystem,
    historicalEraKey,
    historicalEraName,
    formatMs,
    effectiveSettings
  } = HT;

  const t = (key, substitutions) => LL_I18N.getMessage(key, settings.uiLanguage, substitutions);

  let settings = { ...DEFAULT_SETTINGS };
  let cache = new Map();
  let currentBlock = null;
  let hoverTimer = null;
  let selectionTimer = null;
  let requestId = 0;
  let lastTranslationShownAt = 0;
  let selectionModeActive = false;
  let lastSelectedText = '';
  let mouseX = 0;
  let mouseY = 0;
  let currentDisplayedResult = null;
  let currentDisplayedDetection = null;
  let ctrlHeld = false;
  let altHeld = false;
  let showingRejectedResult = false;

  function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function normalizeSelectedText(text) {
    return String(text || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\t\f\v ]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function getTranslatingDisplayMs() {
    const now = Date.now();
    if (lastTranslationShownAt && now - lastTranslationShownAt <= settings.fastTranslationWindowMs) {
      return settings.translatingDisplayMsFast;
    }
    return settings.translatingDisplayMsDefault;
  }

  function isEditable(el) {
    if (!(el instanceof Element)) return false;
    return Boolean(el.closest('input,textarea,select,[contenteditable="true"],[contenteditable=""]'));
  }

  function isExcludedArea(el) {
    if (!(el instanceof Element)) return true;
    if (el.closest('#hover-translator-tooltip,#hover-translator-toast')) return true;
    return Boolean(el.closest([
      'nav','header','footer','menu',
      '[role="navigation"]','[role="menu"]','[role="menubar"]',
      '[aria-label*="breadcrumb" i]','[class*="breadcrumb" i]','[id*="breadcrumb" i]',
      '[class*="navbar" i]','[id*="navbar" i]','[class*="main-menu" i]','[id*="main-menu" i]'
    ].join(',')));
  }

  function textNodeFromPoint(x, y) {
    let node = null;
    if (document.caretPositionFromPoint) node = document.caretPositionFromPoint(x, y)?.offsetNode || null;
    else if (document.caretRangeFromPoint) node = document.caretRangeFromPoint(x, y)?.startContainer || null;
    if (!node || node.nodeType !== Node.TEXT_NODE || !normalizeText(node.nodeValue)) return null;
    const range = document.createRange();
    range.selectNodeContents(node);
    const tolerance = 2;
    const over = [...range.getClientRects()].some(rect =>
      x >= rect.left - tolerance && x <= rect.right + tolerance && y >= rect.top - tolerance && y <= rect.bottom + tolerance
    );
    return over ? { node } : null;
  }

  function validBlock(el) {
    if (!el) return null;
    const text = normalizeText(el.innerText || el.textContent);
    if (text.length < settings.minHoverTextLength || text.length > settings.maxHoverTextLength) return null;
    return el;
  }

  function findTextBlock(x, y) {
    const hit = textNodeFromPoint(x, y);
    if (!hit) return null;
    const start = hit.node.parentElement;
    if (!start || isEditable(start) || isExcludedArea(start)) return null;
    const semantic = start.closest('p,blockquote,li,dd,dt,figcaption,[role="paragraph"]');
    if (semantic && !isExcludedArea(semantic)) return validBlock(semantic);
    let el = start;
    for (let level = 0; level < 5 && el; level++, el = el.parentElement) {
      if (isExcludedArea(el)) return null;
      if (!['DIV','ARTICLE','SECTION'].includes(el.tagName)) continue;
      const text = normalizeText(el.innerText || el.textContent);
      if (text.length < settings.minHoverTextLength || text.length > settings.maxHoverTextLength) continue;
      if (el.querySelectorAll('p,blockquote,li,[role="paragraph"]').length > 1) continue;
      return el;
    }
    return null;
  }

  function getDeclaredLanguage(block) {
    let el = block;
    while (el && el !== document.documentElement) {
      const lang = normalizeLanguageCode(el.getAttribute?.('lang'));
      if (lang) return lang;
      el = el.parentElement;
    }
    return normalizeLanguageCode(document.documentElement.getAttribute('lang'));
  }

  const WORD_SETS = {
    en: new Set('the a an and or but this that these those is are was were be been have has had do does did can could will would should may might must to of in on at for from with without about by as it its you your we our they their not there here what when where why how who which more most some any all each other another also very only new now product products available unavailable price order shipping delivery seller item items'.split(' ')),
    pl: new Set('i oraz albo ale że to ten ta te jest są był była były być mam ma mają do od w we na za z ze dla przy przez jako nie tak co kiedy gdzie jak kto który która które więcej bardzo tylko teraz produkt produkty dostępny dostępna niedostępny cena zamówienie wysyłka dostawa sprzedawca'.split(' ')),
    de: new Set('der die das den dem des ein eine einer eines und oder aber ist sind war waren sein haben hat hatte nicht zu von in im auf für mit ohne über bei als auch nur noch hier dort was wann wo wie wer welche dieser diese dieses mehr sehr jetzt produkt preis versand lieferung verkäufer'.split(' ')),
    fr: new Set('le la les un une des du de et ou mais est sont était étaient être avoir a ont pas ne dans sur pour avec sans par comme aussi seulement encore ici là ce cette ces qui que quoi quand où comment plus très maintenant produit prix livraison vendeur'.split(' ')),
    es: new Set('el la los las un una unos unas de del y o pero es son era eran ser haber ha han no en sobre para con sin por como también solo aquí allí este esta estos estas que quien cuando donde cómo más muy ahora producto precio envío entrega vendedor'.split(' ')),
    it: new Set('il lo la i gli le un una uno di del della e o ma è sono era erano essere avere ha hanno non in su per con senza da come anche solo qui lì questo questa questi queste che chi quando dove come più molto ora prodotto prezzo spedizione consegna venditore'.split(' ')),
    pt: new Set('o a os as um uma uns umas de do da e ou mas é são era eram ser ter tem têm não em sobre para com sem por como também só aqui ali este esta estes estas que quem quando onde como mais muito agora produto preço envio entrega vendedor'.split(' ')),
    nl: new Set('de het een en of maar is zijn was waren hebben heeft had niet te van in op voor met zonder over bij als ook alleen nog hier daar dit dat deze die wat wanneer waar hoe wie welke meer zeer nu product prijs verzending levering verkoper'.split(' ')),
    cs: new Set('a nebo ale že to ten ta ty je jsou byl byla byly být má mají do od v ve na za z pro při přes jako ne ano co kdy kde jak kdo který která které více velmi jen nyní produkt cena doprava doručení prodejce'.split(' ')),
    sk: new Set('a alebo ale že to ten tá tie je sú bol bola boli byť má majú do od v vo na za z pre pri cez ako nie áno čo kedy kde kto ktorý ktorá ktoré viac veľmi len teraz produkt cena doprava doručenie predajca'.split(' ')),
    ro: new Set('și sau dar este sunt era erau fi are au nu în pe pentru cu fără de ca aici acolo acest această care cine când unde cum mai foarte acum produs preț livrare vânzător'.split(' ')),
    hu: new Set('és vagy de hogy ez az van vannak volt voltak lenni nem a az egy ban ben on en ért val vel nélkül mint is csak itt ott mi mikor hol hogyan ki mely több nagyon most termék ár szállítás eladó'.split(' ')),
    sv: new Set('och eller men är var vara har hade inte att av i på för med utan om som också bara här där detta den det vad när var hur vem vilken mer mycket nu produkt pris frakt leverans säljare'.split(' ')),
    da: new Set('og eller men er var være har havde ikke at af i på for med uden om som også kun her der dette den det hvad hvornår hvor hvordan hvem hvilken mere meget nu produkt pris fragt levering sælger'.split(' ')),
    no: new Set('og eller men er var være har hadde ikke å av i på for med uten om som også bare her der dette den det hva når hvor hvordan hvem hvilken mer mye nå produkt pris frakt levering selger'.split(' ')),
    fi: new Set('ja tai mutta on oli olla ovat ei että kun se tämä nämä ne joka kuka mitä milloin missä miten varten kanssa ilman myös vain täällä siellä enemmän hyvin nyt tuote hinta toimitus myyjä'.split(' ')),
    tr: new Set('ve veya ama bu şu o bir de da için ile olmadan gibi da değil var vardı olmak ne kim ne zaman nerede nasıl daha çok şimdi ürün fiyat gönderim teslimat satıcı'.split(' '))
  };

  const DIACRITIC_HINTS = [
    ['pl', /[ąćęłńóśźż]/i, 5], ['de', /[äöüß]/i, 5], ['fr', /[àâçéèêëîïôùûüÿœæ]/i, 4],
    ['es', /[áéíóúñ¿¡]/i, 4], ['pt', /[ãõáâàçéêíóôú]/i, 3], ['cs', /[čďěňřšťůž]/i, 5],
    ['sk', /[äčďĺľňôŕšťž]/i, 5], ['ro', /[ăâîșț]/i, 5], ['hu', /[őű]/i, 5],
    ['sv', /[åäö]/i, 3], ['da', /[æøå]/i, 4], ['no', /[æøå]/i, 4], ['tr', /[ğış]/i, 5]
  ];

  function tokenizeLatin(text) {
    try { return text.toLocaleLowerCase().match(/[\p{L}]+(?:['’][\p{L}]+)?/gu) || []; }
    catch (_) { return text.toLowerCase().match(/[a-zà-ž]+(?:['’][a-zà-ž]+)?/gi) || []; }
  }

  function detectLatinLanguage(text) {
    const words = tokenizeLatin(text);
    if (words.length < 3) return { code: '', confidence: 0 };
    const scores = Object.fromEntries(Object.keys(WORD_SETS).map(code => [code, 0]));
    for (const word of words) for (const [code, set] of Object.entries(WORD_SETS)) if (set.has(word)) scores[code]++;
    for (const [code, re, bonus] of DIACRITIC_HINTS) if (re.test(text)) scores[code] += bonus;
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [bestCode, bestScore] = ranked[0] || ['', 0];
    const secondScore = ranked[1]?.[1] || 0;
    const minScore = words.length <= 7 ? 2 : 3;
    if (bestScore < minScore || bestScore === secondScore) return { code: '', confidence: 0 };
    return { code: bestCode, confidence: Math.min(1, (bestScore - secondScore + bestScore / Math.max(4, words.length)) / 5) };
  }

  function detectLanguage(text, contextElement) {
    if (settings.sourceLanguage !== 'auto') {
      return { detectedLanguage: normalizeLanguageCode(settings.sourceLanguage), fixed: true, confidence: 1 };
    }
    let code = '';
    if (/[іїєґ]/i.test(text)) code = 'uk';
    else if (/[ъѝ]/i.test(text) && /\b(на|за|със|това|как|не|е|са)\b/iu.test(text)) code = 'bg';
    else if (/[\u0400-\u04FF]/.test(text)) code = 'ru';
    else if (/[\u0370-\u03FF]/.test(text)) code = 'el';
    else if (/[\u0590-\u05FF]/.test(text)) code = 'he';
    else if (/[\u0600-\u06FF]/.test(text)) code = 'ar';
    else if (/[\u0900-\u097F]/.test(text)) code = 'hi';
    else if (/[\u0E00-\u0E7F]/.test(text)) code = 'th';
    else if (/[\uAC00-\uD7AF]/.test(text)) code = 'ko';
    else if (/[\u3040-\u30FF]/.test(text)) code = 'ja';
    else if (/[\u4E00-\u9FFF]/.test(text)) code = 'zh';
    // For Latin-script text, prefer the text itself over the page's declared language.
    // This makes ignore-language rules (for example English) work even on mixed-language pages.
    if (!code) code = detectLatinLanguage(text).code;
    if (!code) code = getDeclaredLanguage(contextElement);
    return { detectedLanguage: normalizeLanguageCode(code), fixed: false };
  }

  function shouldSkipLanguage(code) {
    const source = normalizeLanguageCode(code);
    const target = normalizeLanguageCode(settings.targetLanguage);
    if (!source) return Boolean(settings.skipUnknown);
    if (source === target) {
      const historicalEraDiffers = isHistoricalLanguage(source) &&
        historicalEraKey(source, settings.sourceHistoricalEra) !== historicalEraKey(target, settings.targetHistoricalEra);
      if (!historicalEraDiffers) return true;
    }
    if (Array.isArray(settings.ignoredLanguages) && settings.ignoredLanguages.includes(source)) return true;
    return false;
  }

  function displayLanguage(code) {
    const normalized = normalizeLanguageCode(code);
    if (!normalized) return t('unknownLanguage');
    const base = languageName(normalized, navigator.language);
    if (isHistoricalLanguage(normalized)) {
      const era = historicalEraName(normalized, settings.sourceHistoricalEra, settings.uiLanguage === 'pl' ? 'pl-PL' : 'en-US');
      if (era) return `${base} — ${era} (${normalized})`;
    }
    return `${base} (${normalized})`;
  }

  function selectionTextFromRange(range) {
    const fragment = range.cloneContents();
    const wrapper = document.createElement('div');
    wrapper.append(fragment);
    const parts = [];
    const paragraphTags = new Set(['P','BLOCKQUOTE','LI','DT','DD','FIGCAPTION','H1','H2','H3','H4','H5','H6','TR']);
    const lineTags = new Set(['DIV','SECTION','ARTICLE','ADDRESS','PRE']);
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) { parts.push(node.nodeValue || ''); return; }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.tagName === 'BR') { parts.push('\n'); return; }
      if ((node.tagName === 'TD' || node.tagName === 'TH') && parts.length && !/[\n\t ]$/.test(parts.at(-1) || '')) parts.push('\t');
      for (const child of node.childNodes || []) walk(child);
      if (paragraphTags.has(node.tagName)) parts.push('\n\n');
      else if (lineTags.has(node.tagName)) parts.push('\n');
    }
    walk(wrapper);
    return normalizeSelectedText(parts.join(''));
  }

  function getSelectedPayload() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    const range = selection.getRangeAt(0);
    const text = selectionTextFromRange(range) || normalizeSelectedText(selection.toString());
    if (text.length < settings.minSelectionTextLength) return null;
    let contextElement = range.commonAncestorContainer;
    if (contextElement.nodeType === Node.TEXT_NODE) contextElement = contextElement.parentElement;
    return { text, contextElement: contextElement instanceof Element ? contextElement : document.body };
  }

  const tooltip = document.createElement('div');
  tooltip.id = 'hover-translator-tooltip';
  tooltip.style.cssText = `position:fixed;z-index:2147483647;display:none;pointer-events:none;max-width:min(760px,calc(100vw - 24px));padding:12px 16px;background:rgba(25,25,25,.97);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:9px;box-shadow:0 5px 22px rgba(0,0,0,.42);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;line-height:1.5;white-space:normal;overflow-wrap:anywhere;`;
  document.documentElement.appendChild(tooltip);

  function hideTooltip() {
    tooltip.style.display = 'none';
    currentDisplayedResult = null;
    currentDisplayedDetection = null;
    showingRejectedResult = false;
  }

  function showLoading(detection) {
    currentDisplayedResult = null;
    currentDisplayedDetection = null;
    showingRejectedResult = false;
    tooltip.replaceChildren();
    const body = document.createElement('div');
    const loadingKey = settings.actionMode === 'summary' ? 'summarizing' : settings.actionMode === 'language_analysis' ? 'analyzingLanguage' : settings.actionMode === 'proofread' ? 'proofreading' : (settings.actionMode === 'explain' || settings.actionMode === 'explain_context') ? 'explaining' : settings.actionMode === 'poem' ? 'versifying' : 'translating';
    body.textContent = t(loadingKey);
    body.style.cssText = 'font-size:14px;line-height:1.5;';
    const footer = document.createElement('div');
    const prefix = detection.fixed ? t('sourceLanguageLabel') : t('detectedLanguageLabel');
    footer.textContent = `${prefix}: ${displayLanguage(detection.detectedLanguage)}`;
    footer.style.cssText = 'margin-top:7px;padding-top:6px;border-top:1px solid rgba(255,255,255,.10);font-size:10px;opacity:.55;';
    tooltip.append(body, footer);
    tooltip.style.display = 'block';
  }

  function providerLabel(result) {
    if (result.engine === 'gemini') return `Gemini — ${result.model || settings.geminiModel}`;
    if (result.engine === 'deepl') return 'DeepL';
    return 'Google Translate';
  }

  function fallbackReasonLabel(fallback) {
    if (!fallback?.reasonCode) return t('fallbackReason_provider_error');
    const key = `fallbackReason_${fallback.reasonCode}`;
    const translated = t(key);
    const reason = translated === key ? t('fallbackReason_provider_error') : translated;
    return fallback.reasonDetail ? `${reason} (${fallback.reasonDetail})` : reason;
  }

  function lifecycleStageLabel(stage) {
    const normalized = String(stage || '').toUpperCase();
    const map = {
      STABLE: 'geminiStatusStable',
      PREVIEW: 'geminiStatusPreview',
      EXPERIMENTAL: 'geminiStatusExperimental',
      UNSTABLE_EXPERIMENTAL: 'geminiStatusExperimental',
      LEGACY: 'geminiStatusLegacy',
      DEPRECATED: 'geminiStatusDeprecated',
      RETIRED: 'geminiStatusRetired'
    };
    return t(map[normalized] || 'geminiStatusUnknown');
  }

  function lifecycleNeedsWarning(lifecycle) {
    return ['LEGACY', 'DEPRECATED', 'RETIRED'].includes(String(lifecycle?.stage || '').toUpperCase());
  }

  function formatLifecycleDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return value;
    try {
      return new Intl.DateTimeFormat(settings.uiLanguage === 'pl' ? 'pl-PL' : 'en-US', { dateStyle: 'medium' }).format(date);
    } catch (_) {
      return date.toISOString().slice(0, 10);
    }
  }

  function formatUsageCount(value) {
    const number = Math.max(0, Number(value) || 0);
    try { return new Intl.NumberFormat(settings.uiLanguage === 'pl' ? 'pl-PL' : 'en-US').format(number); }
    catch (_) { return String(Math.round(number)); }
  }

  function resultTotalTokens(value) {
    if (!value) return 0;
    return Math.max(0, Number(value.totalTokens) || ((Number(value.promptTokens) || 0) + (Number(value.outputTokens) || 0) + (Number(value.thinkingTokens) || 0)));
  }

  function rejectedGeminiResult(result) {
    const rejected = result?.fallback?.rejectedResult;
    return rejected?.translated && rejected.engine === 'gemini' ? rejected : null;
  }

  function renderResult(result, detection, rejectedMode = false) {
    tooltip.replaceChildren();
    const rejected = rejectedMode ? rejectedGeminiResult(result) : null;
    const visible = rejected || result;
    const body = document.createElement('div');
    body.textContent = visible.translated;
    const computerOutput = isComputerLanguage(settings.targetLanguage) || isMathematicalSystem(settings.targetLanguage) || isSignalSystem(settings.targetLanguage);
    body.style.cssText = `font-size:14px;line-height:${computerOutput ? '1.42' : '1.5'};white-space:pre-wrap;max-height:min(55vh,520px);overflow:auto;${computerOutput ? 'font-family:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",Menlo,monospace;' : ''}`;
    body.dataset.resultBody = 'true';

    const sourceCode = normalizeLanguageCode(visible.detectedSourceLanguage || result.detectedSourceLanguage || detection.detectedLanguage);
    const prefix = detection.fixed ? t('sourceLanguageLabel') : t('detectedLanguageLabel');
    const footerBits = [];

    if (rejected) {
      footerBits.push(`${prefix}: ${displayLanguage(sourceCode)}`);
      footerBits.push(`Gemini — ${rejected.model || settings.geminiModel}`);
      footerBits.push(t('rejectedResultLabel'));
      footerBits.push(`${t('translationTimeLabel')}: ${formatMs(rejected.translationMs)}`);
      const rejectedTokens = resultTotalTokens(rejected);
      if (rejectedTokens) footerBits.push(`${t('tokensLabel')}: ${formatUsageCount(rejectedTokens)}`);
      footerBits.push(`${t('fallbackReasonLabel')}: ${fallbackReasonLabel(result.fallback)}`);
    } else {
      footerBits.push(`${prefix}: ${displayLanguage(sourceCode)}`);
      footerBits.push(providerLabel(result));
      const timeKey = result.mode === 'summary' ? 'summaryTimeLabel' : (result.mode === 'explain' || result.mode === 'explain_context') ? 'explanationTimeLabel' : result.mode === 'poem' ? 'poemTimeLabel' : 'translationTimeLabel';
      footerBits.push(`${t(timeKey)}: ${formatMs(result.translationMs)}`);
      const totalTokens = resultTotalTokens(result);
      if (result.engine === 'gemini' && totalTokens) footerBits.push(`${t('tokensLabel')}: ${formatUsageCount(totalTokens)}`);
      if (result.engine === 'deepl' && Number(result.inputCharacters) > 0) footerBits.push(`${t('charactersLabel')}: ${formatUsageCount(result.inputCharacters)}`);

      if (result.modelFallback) {
        footerBits.push(`${t('modelFallbackLabel')}: ${result.modelFallback.from} → ${result.modelFallback.to}`);
      }
      if (result.fallback) {
        footerBits.push(`${t('fallbackLabel')}: ${result.fallback.from} → ${result.fallback.to}`);
        if (rejectedGeminiResult(result)) footerBits.push('(Press: Ctrl+Alt)');
      }
      if (lifecycleNeedsWarning(result.modelLifecycle)) {
        const lifecycleBits = [lifecycleStageLabel(result.modelLifecycle.stage)];
        if (result.modelLifecycle.retirementTime) lifecycleBits.push(`${t('geminiRetirementLabel')}: ${formatLifecycleDate(result.modelLifecycle.retirementTime)}`);
        if (result.modelLifecycle.recommendedModel) lifecycleBits.push(`${t('geminiRecommendedLabel')}: ${result.modelLifecycle.recommendedModel}`);
        footerBits.push(lifecycleBits.join(' · '));
      }
    }

    const footer = document.createElement('div');
    footer.textContent = footerBits.join(' • ');
    footer.style.cssText = 'margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.10);font-size:10px;opacity:.52;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    tooltip.append(body, footer);
    tooltip.style.display = 'block';
    requestAnimationFrame(() => {
      if (body.scrollHeight > body.clientHeight) footer.textContent += ` • ${t('scrollHint')}`;
    });
  }

  function showResult(result, detection) {
    currentDisplayedResult = result;
    currentDisplayedDetection = detection;
    showingRejectedResult = false;
    renderResult(result, detection, false);
    updateRejectedResultPreview();
  }

  function updateRejectedResultPreview() {
    if (!currentDisplayedResult || !currentDisplayedDetection || tooltip.style.display === 'none') return;
    const shouldShow = ctrlHeld && altHeld && !showingRejectedResult && rejectedGeminiResult(currentDisplayedResult);
    if (shouldShow) {
      showingRejectedResult = true;
      renderResult(currentDisplayedResult, currentDisplayedDetection, true);
      placeTooltip();
      return;
    }
    if (showingRejectedResult && !(ctrlHeld && altHeld)) {
      showingRejectedResult = false;
      renderResult(currentDisplayedResult, currentDisplayedDetection, false);
      placeTooltip();
    }
  }

  function placeTooltip() {
    if (tooltip.style.display === 'none') return;
    const margin = 12, offset = 16;
    let left = mouseX + offset, top = mouseY + offset;
    const rect = tooltip.getBoundingClientRect();
    if (left + rect.width > innerWidth - margin) left = mouseX - rect.width - offset;
    if (top + rect.height > innerHeight - margin) top = mouseY - rect.height - offset;
    if (top < margin) top = margin;
    tooltip.style.left = `${Math.max(margin, left)}px`;
    tooltip.style.top = `${Math.max(margin, top)}px`;
  }

  function showToast(message) {
    let toast = document.getElementById('hover-translator-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hover-translator-toast';
      toast.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:2147483647;background:rgba(25,25,25,.96);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:10px 14px;font:13px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.35);pointer-events:none;';
      document.documentElement.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 1600);
  }

  function contextSignature(value) {
    const text = String(value || '');
    if (!text) return '';
    return `${text.length}:${text.slice(0,240)}:${text.slice(-240)}`;
  }

  function pageContextForSelection(selectedText, contextElement, maxChars = settings.explainContextMaxChars || 16000) {
    const limit = Math.max(2000, Math.min(30000, Number(maxChars) || 16000));
    const selected = normalizeSelectedText(selectedText || '');
    const pageText = normalizeSelectedText(document.body?.innerText || '');
    if (!pageText) return '';
    if (pageText.length <= limit) return pageText;

    let index = selected ? pageText.indexOf(selected) : -1;
    if (index < 0 && selected) {
      const needle = selected.slice(0, Math.min(160, selected.length));
      index = needle ? pageText.indexOf(needle) : -1;
    }
    if (index < 0 && contextElement) {
      const local = normalizeSelectedText(contextElement.innerText || contextElement.textContent || '').slice(0, 160);
      index = local ? pageText.indexOf(local) : -1;
    }
    if (index < 0) index = 0;

    const selectedSpan = Math.min(selected.length, limit);
    const available = Math.max(0, limit - selectedSpan);
    const before = Math.floor(available * 0.45);
    let start = Math.max(0, index - before);
    if (start + limit > pageText.length) start = Math.max(0, pageText.length - limit);
    return pageText.slice(start, start + limit).trim();
  }

  async function processText(text, contextElement, id, sourceKind) {
    const normalized = sourceKind === 'selection' ? normalizeSelectedText(text) : normalizeText(text);
    if (!settings.enabled || !normalized) return hideTooltip();
    if (settings.actionMode !== 'translate' && sourceKind === 'hover') return hideTooltip();
    if (sourceKind === 'hover' && !settings.hoverEnabled) return;
    if (sourceKind === 'selection' && !settings.selectionEnabled) return;

    const detection = detectLanguage(normalized, contextElement);
    const aiTaskMode = settings.actionMode !== 'translate';
    if (!aiTaskMode && shouldSkipLanguage(detection.detectedLanguage)) {
      hideTooltip();
      return;
    }

    const sourceForApi = detection.detectedLanguage || (aiTaskMode ? 'auto' : (settings.skipUnknown ? '' : 'auto'));
    if (!sourceForApi) return hideTooltip();
    const pageContext = settings.actionMode === 'explain_context' && sourceKind === 'selection'
      ? pageContextForSelection(normalized, contextElement)
      : '';
    const cacheKey = [settings.actionMode, settings.engine, settings.fallbackEnabled, settings.sourceLanguage, settings.targetLanguage, (settings.ignoredLanguages || []).join(','), settings.geminiModelMode, settings.geminiModel, settings.translationQuality, settings.geminiCustomPrompt, settings.geminiPromptPlacement, settings.geminiMinimalThinking, settings.geminiCompactHoverPrompt, settings.sourceHistoricalEra, settings.targetHistoricalEra, sourceKind, sourceForApi, contextSignature(pageContext), normalized].join('\n');
    const cached = cache.get(cacheKey);
    if (cached) {
      if (id !== requestId) return;
      if (cached.skip) return hideTooltip();
      showResult(cached, detection);
      placeTooltip();
      lastTranslationShownAt = Date.now();
      return;
    }

    showLoading(detection);
    placeTooltip();
    const minDisplay = getTranslatingDisplayMs();
    const started = Date.now();
    const response = await browser.runtime.sendMessage({
      type: 'translate', text: normalized, sourceLanguage: sourceForApi,
      targetLanguage: settings.targetLanguage, sourceHistoricalEra: settings.sourceHistoricalEra, targetHistoricalEra: settings.targetHistoricalEra, sourceKind, actionMode: settings.actionMode, pageContext
    });
    const elapsed = Date.now() - started;
    if (elapsed < minDisplay) await new Promise(resolve => setTimeout(resolve, minDisplay - elapsed));
    if (id !== requestId) return;
    if (!response?.ok) {
      console.warn('[LingoLens]', response?.error || 'Translation failed');
      hideTooltip();
      return;
    }
    const result = response.result || {};
    cache.set(cacheKey, result);
    if (cache.size > 300) cache.delete(cache.keys().next().value);
    if (result.skip || !result.translated) return hideTooltip();
    showResult(result, detection);
    placeTooltip();
    lastTranslationShownAt = Date.now();
  }

  function cancelHover() {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = null;
    currentBlock = null;
  }

  function cancelSelectionTimer() {
    if (selectionTimer) clearTimeout(selectionTimer);
    selectionTimer = null;
  }

  function isNearWholePageSelection(text) {
    const total = normalizeText(document.body?.innerText || '').length;
    if (total < 100) return false;
    return text.length / total >= 0.8;
  }

  function scheduleSelection() {
    cancelSelectionTimer();
    selectionTimer = setTimeout(() => {
      const payload = getSelectedPayload();
      if (!payload) {
        if (selectionModeActive) { requestId++; hideTooltip(); }
        selectionModeActive = false;
        lastSelectedText = '';
        return;
      }
      if (isNearWholePageSelection(payload.text)) {
        // Whole-page translation is intentionally not triggered by text selection.
        // Use the LingoLens context menu instead.
        selectionModeActive = true;
        lastSelectedText = payload.text;
        cancelHover();
        requestId++;
        hideTooltip();
        return;
      }
      if (payload.text === lastSelectedText) return;
      selectionModeActive = true;
      lastSelectedText = payload.text;
      cancelHover();
      requestId++;
      const id = requestId;
      processText(payload.text, payload.contextElement, id, 'selection').catch(() => hideTooltip());
    }, 45);
  }

  document.addEventListener('mousemove', event => {
    mouseX = event.clientX; mouseY = event.clientY; placeTooltip();
    if (!settings.enabled || settings.actionMode !== 'translate' || !settings.hoverEnabled || selectionModeActive || window.getSelection()?.toString()) return;
    const block = findTextBlock(mouseX, mouseY);
    if (block === currentBlock) return;
    currentBlock = block;
    requestId++;
    const id = requestId;
    if (hoverTimer) clearTimeout(hoverTimer);
    hideTooltip();
    if (!block) return;
    hoverTimer = setTimeout(() => processText(normalizeText(block.innerText || block.textContent), block, id, 'hover').catch(() => hideTooltip()), settings.hoverDelayMs);
  }, { passive: true });

  document.addEventListener('mouseup', event => {
    mouseX = event.clientX; mouseY = event.clientY;
    if (settings.enabled && settings.selectionEnabled) scheduleSelection();
  }, true);

  document.addEventListener('keydown', event => {
    // AltGr is reported as Ctrl+Alt on some keyboard layouts; never use it for diagnostics.
    if (event.getModifierState?.('AltGraph')) return;
    if (event.key === 'Control') ctrlHeld = true;
    if (event.key === 'Alt') altHeld = true;
    updateRejectedResultPreview();
    if (event.altKey && !event.ctrlKey && !event.shiftKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      const body = tooltip.querySelector('[data-result-body="true"]');
      if (body && body.scrollHeight > body.clientHeight) {
        event.preventDefault();
        body.scrollBy({ top: event.key === 'ArrowDown' ? 120 : -120, behavior: 'smooth' });
      }
    }
  }, true);

  document.addEventListener('keyup', event => {
    if (event.key === 'Control') ctrlHeld = false;
    if (event.key === 'Alt') altHeld = false;
    updateRejectedResultPreview();
    if (!settings.enabled || !settings.selectionEnabled || isEditable(event.target)) return;
    if (event.key.startsWith('Arrow') && event.shiftKey) scheduleSelection();
  }, true);

  window.addEventListener('blur', () => {
    ctrlHeld = false;
    altHeld = false;
    updateRejectedResultPreview();
  });

  document.addEventListener('selectionchange', () => {
    const text = normalizeSelectedText(window.getSelection()?.toString() || '');
    if (!text && selectionModeActive) {
      selectionModeActive = false;
      lastSelectedText = '';
      requestId++;
      hideTooltip();
    }
  });

  document.addEventListener('mouseleave', () => {
    if (!selectionModeActive) { requestId++; cancelHover(); hideTooltip(); }
  });

  browser.runtime.onMessage.addListener(message => {
    if (message?.type === 'translator-toggled') {
      settings.enabled = Boolean(message.enabled);
      requestId++;
      cancelHover(); cancelSelectionTimer(); hideTooltip();
      showToast(settings.enabled ? t('translatorEnabledToast') : t('translatorDisabledToast'));
    }
    if (message?.type === 'hover-toggled') {
      settings.hoverEnabled = Boolean(message.hoverEnabled);
      requestId++; cancelHover(); hideTooltip();
      showToast(t(settings.hoverEnabled ? 'hoverEnabledToast' : 'hoverDisabledToast'));
    }
    if (message?.type === 'copy-current-result') {
      const rejected = showingRejectedResult ? rejectedGeminiResult(currentDisplayedResult) : null;
      const value = rejected?.translated || currentDisplayedResult?.translated || '';
      if (!value) { showToast(t('nothingToCopy')); return; }
      navigator.clipboard.writeText(value).then(() => showToast(t('resultCopied'))).catch(() => showToast(t('copyFailed')));
    }
    if (message?.type === 'clear-cache') {
      cache.clear(); lastTranslationShownAt = 0;
    }
  });

  browser.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local') return;

    // Only actual user-facing settings may invalidate an in-flight translation.
    // Internal extension state (usageStats, Gemini model catalog/lifecycle metadata,
    // telemetry, etc.) is also stored in storage.local, but must never bump
    // requestId or the completed provider response would be discarded while the
    // tooltip remains stuck on "Translating...".
    const settingKeys = new Set(Object.keys(DEFAULT_SETTINGS));
    const hasSettingChange = Object.keys(changes).some(key => settingKeys.has(key));
    if (!hasSettingChange) return;

    settings = effectiveSettings(await browser.storage.local.get(DEFAULT_SETTINGS));
    cache.clear();
    requestId++;
    if (!settings.enabled) hideTooltip();
  });

  browser.storage.local.get(DEFAULT_SETTINGS).then(raw => { settings = effectiveSettings(raw); }).catch(() => {});
})();
