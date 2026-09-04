'use strict';

const { DEFAULT_SETTINGS, LANGUAGES, REGIONAL_VARIETIES, RARE_INDIGENOUS_LANGUAGES, FICTIONAL_LANGUAGES, HISTORICAL_LANGUAGES, COMPUTER_LANGUAGES, MATHEMATICAL_SYSTEMS, SIGNAL_SYSTEMS, effectiveSettings, languageName, historicalEraName, historicalEraKey, isHistoricalLanguage, isComputerLanguage, isMathematicalSystem, isSignalSystem, isGeminiOnlyLanguage } = HT;
let uiLanguage = DEFAULT_SETTINGS.uiLanguage;
const t = (key, substitutions) => LL_I18N.getMessage(key, uiLanguage, substitutions);

function geminiOnlyPair(settings) {
  return isGeminiOnlyLanguage(settings.targetLanguage) || (settings.sourceLanguage !== 'auto' && isGeminiOnlyLanguage(settings.sourceLanguage));
}

function computerPair(settings) {
  return isComputerLanguage(settings.targetLanguage) || isMathematicalSystem(settings.targetLanguage) || isSignalSystem(settings.targetLanguage) || (settings.sourceLanguage !== 'auto' && (isComputerLanguage(settings.sourceLanguage) || isMathematicalSystem(settings.sourceLanguage) || isSignalSystem(settings.sourceLanguage)));
}

function localize() {
  LL_I18N.localizeDocument(uiLanguage);
  document.title = t('extensionName');
}

const LANGUAGE_GROUPS = [
  { id: 'standard', labelKey: 'languageGroupStandard', match: code => !Object.prototype.hasOwnProperty.call(REGIONAL_VARIETIES, code) && !Object.prototype.hasOwnProperty.call(RARE_INDIGENOUS_LANGUAGES, code) && !Object.prototype.hasOwnProperty.call(FICTIONAL_LANGUAGES, code) && !Object.prototype.hasOwnProperty.call(HISTORICAL_LANGUAGES, code) && !Object.prototype.hasOwnProperty.call(COMPUTER_LANGUAGES, code) && !Object.prototype.hasOwnProperty.call(MATHEMATICAL_SYSTEMS, code) && !Object.prototype.hasOwnProperty.call(SIGNAL_SYSTEMS, code) },
  { id: 'regional', labelKey: 'languageGroupRegional', match: code => Object.prototype.hasOwnProperty.call(REGIONAL_VARIETIES, code) },
  { id: 'historical', labelKey: 'languageGroupHistorical', match: code => Object.prototype.hasOwnProperty.call(HISTORICAL_LANGUAGES, code) },
  { id: 'rare', labelKey: 'languageGroupRare', match: code => Object.prototype.hasOwnProperty.call(RARE_INDIGENOUS_LANGUAGES, code) },
  { id: 'fictional', labelKey: 'languageGroupFictional', match: code => Object.prototype.hasOwnProperty.call(FICTIONAL_LANGUAGES, code) },
  { id: 'computer', labelKey: 'languageGroupComputer', match: code => Object.prototype.hasOwnProperty.call(COMPUTER_LANGUAGES, code) },
  { id: 'mathematical', labelKey: 'languageGroupMathematical', match: code => Object.prototype.hasOwnProperty.call(MATHEMATICAL_SYSTEMS, code) },
  { id: 'signals', labelKey: 'languageGroupSignals', match: code => Object.prototype.hasOwnProperty.call(SIGNAL_SYSTEMS, code) }
];

function languageCategory(code) {
  if (!code || code === 'auto') return 'standard';
  return LANGUAGE_GROUPS.find(group => group.match(code))?.id || 'standard';
}

function fillLanguageCategories(select, selectedCategory) {
  select.replaceChildren();
  for (const group of LANGUAGE_GROUPS) {
    const opt = document.createElement('option');
    opt.value = group.id;
    opt.textContent = t(group.labelKey);
    select.appendChild(opt);
  }
  select.value = LANGUAGE_GROUPS.some(group => group.id === selectedCategory) ? selectedCategory : 'standard';
  select.title = t('languageCategoryLabel');
  select.setAttribute('aria-label', t('languageCategoryLabel'));
}

function fillLanguages(select, includeAuto, category, selectedValue) {
  select.replaceChildren();
  if (includeAuto) {
    const opt = document.createElement('option');
    opt.value = 'auto'; opt.textContent = t('autoDetect'); select.appendChild(opt);
  }
  const locale = uiLanguage === 'pl' ? 'pl-PL' : 'en-US';
  const group = LANGUAGE_GROUPS.find(item => item.id === category) || LANGUAGE_GROUPS[0];
  const items = LANGUAGES
    .filter(([code]) => group.match(code))
    .map(([code]) => [code, languageName(code, locale)])
    .sort((a,b)=>a[1].localeCompare(b[1], locale));
  for (const [code, name] of items) {
    const opt = document.createElement('option');
    opt.value = code; opt.textContent = name; select.appendChild(opt);
  }
  if (selectedValue != null && [...select.options].some(option => option.value === selectedValue)) {
    select.value = selectedValue;
  }
}

function fillHistoricalEra(select, languageCode, selectedValue) {
  select.replaceChildren();
  const entry = HISTORICAL_LANGUAGES[languageCode];
  if (!entry) return '';
  const locale = uiLanguage === 'pl' ? 'pl-PL' : 'en-US';
  for (const key of Object.keys(entry.eras || {})) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = historicalEraName(languageCode, key, locale);
    select.appendChild(opt);
  }
  const value = historicalEraKey(languageCode, selectedValue);
  select.value = value;
  return value;
}

function updateHistoricalEraFields(settings = {}) {
  const sourceCode = document.getElementById('sourceLanguage').value;
  const targetCode = document.getElementById('targetLanguage').value;
  const sourceField = document.getElementById('sourceEraField');
  const targetField = document.getElementById('targetEraField');
  const sourceSelect = document.getElementById('sourceHistoricalEra');
  const targetSelect = document.getElementById('targetHistoricalEra');
  const sourceHistorical = sourceCode !== 'auto' && isHistoricalLanguage(sourceCode);
  const targetHistorical = isHistoricalLanguage(targetCode);
  sourceField.classList.toggle('hidden', !sourceHistorical);
  targetField.classList.toggle('hidden', !targetHistorical);
  if (sourceHistorical) fillHistoricalEra(sourceSelect, sourceCode, settings.sourceHistoricalEra || sourceSelect.value);
  else sourceSelect.replaceChildren();
  if (targetHistorical) fillHistoricalEra(targetSelect, targetCode, settings.targetHistoricalEra || targetSelect.value);
  else targetSelect.replaceChildren();
}

async function load() {
  const settings = effectiveSettings(await browser.storage.local.get(DEFAULT_SETTINGS));
  uiLanguage = settings.uiLanguage;
  localize();
  const sourceCategory = languageCategory(settings.sourceLanguage);
  const targetCategory = languageCategory(settings.targetLanguage);
  fillLanguageCategories(document.getElementById('sourceCategory'), sourceCategory);
  fillLanguageCategories(document.getElementById('targetCategory'), targetCategory);
  fillLanguages(document.getElementById('sourceLanguage'), true, sourceCategory, settings.sourceLanguage);
  fillLanguages(document.getElementById('targetLanguage'), false, targetCategory, settings.targetLanguage);
  updateHistoricalEraFields(settings);
  for (const key of ['enabled','hoverEnabled','actionMode','engine','translationQuality','sourceLanguage','targetLanguage','sourceHistoricalEra','targetHistoricalEra']) {
    const el = document.getElementById(key);
    if (el.type === 'checkbox') el.checked = Boolean(settings[key]); else el.value = settings[key];
  }
  updateModeVisibility(settings);
  await updateWarnings(settings);
  document.getElementById('stateText').textContent = settings.enabled ? t('enabledState') : t('disabledState');
  const shortcut = await browser.runtime.sendMessage({ type: 'get-shortcut' });
  document.getElementById('shortcutValue').textContent = shortcut?.shortcut || t('notSet');
  try {
    const userSettings = await browser.action.getUserSettings();
    document.getElementById('pinSuggestion').classList.toggle('hidden', userSettings?.isOnToolbar !== false);
  } catch (_) {}
}

function updateModeVisibility(settings) {
  updateHistoricalEraFields(settings);
  const aiTask = settings.actionMode !== 'translate';
  const engineField = document.getElementById('engineField');
  const engineSelect = document.getElementById('engine');
  const qualityField = document.getElementById('qualityField');
  const geminiOnly = settings.actionMode === 'translate' && geminiOnlyPair(settings);
  if (engineField) engineField.classList.toggle('hidden', aiTask);
  if (engineSelect) {
    engineSelect.disabled = geminiOnly;
    if (geminiOnly) engineSelect.value = 'gemini';
  }
  if (qualityField) qualityField.classList.toggle('hidden', aiTask || settings.engine !== 'gemini' || computerPair(settings));
  const targetLabel = document.getElementById('targetLanguageLabel');
  if (targetLabel) {
    const key = settings.actionMode === 'summary' ? 'summaryTargetLanguage'
      : (settings.actionMode === 'explain' || settings.actionMode === 'explain_context') ? 'explainTargetLanguage'
      : settings.actionMode === 'poem' ? 'poemTargetLanguage'
      : settings.actionMode === 'language_analysis' ? 'analysisTargetLanguage'
      : settings.actionMode === 'proofread' ? 'proofreadTargetLanguage'
      : 'targetLanguage';
    targetLabel.textContent = t(key);
  }
}


async function currentSettings() {
  return effectiveSettings(await browser.storage.local.get(DEFAULT_SETTINGS));
}

async function updateWarnings(settings) {
  const same = document.getElementById('sameLanguageWarning');
  const sameHistoricalDifferentEra = settings.sourceLanguage !== 'auto' && settings.sourceLanguage === settings.targetLanguage && isHistoricalLanguage(settings.sourceLanguage) &&
    historicalEraKey(settings.sourceLanguage, settings.sourceHistoricalEra) !== historicalEraKey(settings.targetLanguage, settings.targetHistoricalEra);
  same.classList.toggle('hidden', settings.actionMode !== 'translate' || !(settings.sourceLanguage !== 'auto' && settings.sourceLanguage === settings.targetLanguage && !sameHistoricalDifferentEra));
  const api = document.getElementById('apiWarning');
  let text = '';
  if (settings.actionMode !== 'translate' && !settings.geminiApiKey) {
    text = t(settings.actionMode === 'summary' ? 'summaryGeminiKeyMissing' : settings.actionMode === 'poem' ? 'poemGeminiKeyMissing' : 'explainGeminiKeyMissing');
  } else if (settings.actionMode === 'translate' && geminiOnlyPair(settings) && !settings.geminiApiKey) {
    text = t('fictionalLanguageGeminiKeyMissing');
  } else if (settings.engine === 'gemini' && !settings.geminiApiKey) {
    text = t(settings.fallbackEnabled ? 'geminiKeyMissingFallback' : 'geminiKeyMissingNoFallback');
  }
  else if (settings.engine === 'deepl' && !settings.deepLApiKey) {
    text = t(settings.fallbackEnabled ? 'deepLKeyMissingFallback' : 'deepLKeyMissingNoFallback');
  }
  api.textContent = text;
  api.classList.toggle('hidden', !text);

  const warning = document.getElementById('geminiModelWarning');
  const stored = await browser.storage.local.get(['geminiModelLifecycle','geminiModelCatalog']);
  const lifecycle = stored.geminiModelLifecycle;
  const catalog = stored.geminiModelCatalog;
  const activeGeminiModel = settings.geminiModelMode === 'manual' ? settings.geminiModel : (catalog?.resolvedModel || catalog?.autoModel || settings.geminiModel);
  const stage = String(lifecycle?.stage || '').toUpperCase();
  const needsAttention = (settings.actionMode !== 'translate' || settings.engine === 'gemini') && lifecycle?.model === activeGeminiModel && ['LEGACY','DEPRECATED','RETIRED'].includes(stage);
  if (needsAttention) {
    const suffix = lifecycle.recommendedModel ? ` → ${lifecycle.recommendedModel}` : '';
    warning.textContent = t('geminiModelWarningPopup', `${lifecycle.model} — ${stage}${suffix}`);
  } else {
    warning.textContent = '';
  }
  warning.classList.toggle('hidden', !needsAttention);
}

async function saveField(key, value) {
  await browser.storage.local.set({ [key]: value });
  let settings = await currentSettings();
  if (key === 'sourceLanguage' || key === 'targetLanguage') {
    const eraPatch = {};
    if (key === 'sourceLanguage') eraPatch.sourceHistoricalEra = settings.sourceHistoricalEra;
    if (key === 'targetLanguage') eraPatch.targetHistoricalEra = settings.targetHistoricalEra;
    await browser.storage.local.set(eraPatch);
    settings = await currentSettings();
  }
  uiLanguage = settings.uiLanguage;
  // effectiveSettings may force Gemini for fictional or rare/indigenous languages.
  document.getElementById('engine').value = settings.engine;
  updateModeVisibility(settings);
  await updateWarnings(settings);
  document.getElementById('stateText').textContent = settings.enabled ? t('enabledState') : t('disabledState');
}

document.addEventListener('DOMContentLoaded', async () => {
  await load();
  document.getElementById('enabled').addEventListener('change', e => saveField('enabled', e.target.checked));
  document.getElementById('hoverEnabled').addEventListener('change', e => saveField('hoverEnabled', e.target.checked));
  document.getElementById('actionMode').addEventListener('change', e => saveField('actionMode', e.target.value));
  document.getElementById('engine').addEventListener('change', e => saveField('engine', e.target.value));
  document.getElementById('translationQuality').addEventListener('change', e => saveField('translationQuality', e.target.value));
  document.getElementById('sourceCategory').addEventListener('change', async e => {
    const select = document.getElementById('sourceLanguage');
    const previous = select.value;
    fillLanguages(select, true, e.target.value, previous === 'auto' ? 'auto' : null);
    if (previous !== 'auto') {
      const firstLanguage = [...select.options].find(option => option.value !== 'auto');
      if (firstLanguage) { select.value = firstLanguage.value; await saveField('sourceLanguage', select.value); }
    } else {
      updateHistoricalEraFields(await currentSettings());
    }
  });
  document.getElementById('targetCategory').addEventListener('change', async e => {
    const select = document.getElementById('targetLanguage');
    fillLanguages(select, false, e.target.value, null);
    if (select.value) await saveField('targetLanguage', select.value);
  });
  document.getElementById('sourceLanguage').addEventListener('change', e => saveField('sourceLanguage', e.target.value));
  document.getElementById('targetLanguage').addEventListener('change', e => saveField('targetLanguage', e.target.value));
  document.getElementById('sourceHistoricalEra').addEventListener('change', e => saveField('sourceHistoricalEra', e.target.value));
  document.getElementById('targetHistoricalEra').addEventListener('change', e => saveField('targetHistoricalEra', e.target.value));
  document.getElementById('optionsBtn').addEventListener('click', () => browser.runtime.openOptionsPage());
  document.getElementById('shortcutBtn').addEventListener('click', () => browser.runtime.sendMessage({ type: 'open-shortcuts' }));
  document.getElementById('apiWarning').addEventListener('click', () => browser.runtime.openOptionsPage());
  document.getElementById('geminiModelWarning').addEventListener('click', () => browser.runtime.openOptionsPage());
});
