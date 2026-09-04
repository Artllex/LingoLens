'use strict';

const { DEFAULT_SETTINGS, DEFAULT_GEMINI_CUSTOM_PROMPT, LANGUAGES, REGIONAL_VARIETIES, RARE_INDIGENOUS_LANGUAGES, FICTIONAL_LANGUAGES, HISTORICAL_LANGUAGES, COMPUTER_LANGUAGES, MATHEMATICAL_SYSTEMS, SIGNAL_SYSTEMS, effectiveSettings, languageName, historicalEraName, historicalEraKey, isHistoricalLanguage, isComputerLanguage, isMathematicalSystem, isSignalSystem, isGeminiOnlyLanguage } = HT;
let uiLanguage = DEFAULT_SETTINGS.uiLanguage;
let geminiLifecycle = null;
let geminiCatalog = null;
let ignoredLanguages = [...DEFAULT_SETTINGS.ignoredLanguages];
const t = (key, substitutions) => LL_I18N.getMessage(key, uiLanguage, substitutions);
function geminiOnlyPairFromForm(){
  const source=document.getElementById('sourceLanguage')?.value||'auto';
  const target=document.getElementById('targetLanguage')?.value||'';
  return isGeminiOnlyLanguage(target)||(source!=='auto'&&isGeminiOnlyLanguage(source));
}
const booleanKeys = [
  'enabled','hoverEnabled','selectionEnabled','skipUnknown','fallbackEnabled',
  'geminiMinimalThinking','geminiCompactHoverPrompt'
];
const selectKeys = ['actionMode','engine','translationQuality','sourceLanguage','targetLanguage','sourceHistoricalEra','targetHistoricalEra','deepLPlan','uiLanguage','geminiPromptPlacement'];
const numberKeys = [];

function localize(){
  LL_I18N.localizeDocument(uiLanguage);
  document.title=t('extensionName');
}

function sortedLanguages(category='standard'){
  const locale=uiLanguage==='pl'?'pl-PL':'en-US';
  const group=LANGUAGE_GROUPS.find(item=>item.id===category)||LANGUAGE_GROUPS[0];
  return LANGUAGES.filter(([code])=>group.match(code)).map(([code])=>[code,languageName(code,locale)]).sort((a,b)=>a[1].localeCompare(b[1],locale));
}

const LANGUAGE_GROUPS = [
  {id:'standard',labelKey:'languageGroupStandard',match:code=>!Object.prototype.hasOwnProperty.call(REGIONAL_VARIETIES,code)&&!Object.prototype.hasOwnProperty.call(RARE_INDIGENOUS_LANGUAGES,code)&&!Object.prototype.hasOwnProperty.call(FICTIONAL_LANGUAGES,code)&&!Object.prototype.hasOwnProperty.call(HISTORICAL_LANGUAGES,code)&&!Object.prototype.hasOwnProperty.call(COMPUTER_LANGUAGES,code)&&!Object.prototype.hasOwnProperty.call(MATHEMATICAL_SYSTEMS,code)&&!Object.prototype.hasOwnProperty.call(SIGNAL_SYSTEMS,code)},
  {id:'regional',labelKey:'languageGroupRegional',match:code=>Object.prototype.hasOwnProperty.call(REGIONAL_VARIETIES,code)},
  {id:'historical',labelKey:'languageGroupHistorical',match:code=>Object.prototype.hasOwnProperty.call(HISTORICAL_LANGUAGES,code)},
  {id:'rare',labelKey:'languageGroupRare',match:code=>Object.prototype.hasOwnProperty.call(RARE_INDIGENOUS_LANGUAGES,code)},
  {id:'fictional',labelKey:'languageGroupFictional',match:code=>Object.prototype.hasOwnProperty.call(FICTIONAL_LANGUAGES,code)},
  {id:'computer',labelKey:'languageGroupComputer',match:code=>Object.prototype.hasOwnProperty.call(COMPUTER_LANGUAGES,code)},
  {id:'mathematical',labelKey:'languageGroupMathematical',match:code=>Object.prototype.hasOwnProperty.call(MATHEMATICAL_SYSTEMS,code)},
  {id:'signals',labelKey:'languageGroupSignals',match:code=>Object.prototype.hasOwnProperty.call(SIGNAL_SYSTEMS,code)}
];

function languageCategory(code){
  if(!code||code==='auto')return 'standard';
  return LANGUAGE_GROUPS.find(group=>group.match(code))?.id||'standard';
}

function fillLanguageCategories(select,selectedCategory){
  select.replaceChildren();
  for(const group of LANGUAGE_GROUPS){const o=document.createElement('option');o.value=group.id;o.textContent=t(group.labelKey);select.appendChild(o);}
  select.value=LANGUAGE_GROUPS.some(group=>group.id===selectedCategory)?selectedCategory:'standard';
  select.title=t('languageCategoryLabel');
  select.setAttribute('aria-label',t('languageCategoryLabel'));
}

function fillLanguages(select,includeAuto,category,selectedValue){
  select.replaceChildren();
  if(includeAuto){const o=document.createElement('option');o.value='auto';o.textContent=t('autoDetect');select.appendChild(o);}
  for(const [code,name] of sortedLanguages(category)){const o=document.createElement('option');o.value=code;o.textContent=name;select.appendChild(o);}
  if(selectedValue!=null&&[...select.options].some(o=>o.value===selectedValue))select.value=selectedValue;
}

function fillHistoricalEra(select,languageCode,selectedValue){
  select.replaceChildren();
  const entry=HISTORICAL_LANGUAGES[languageCode];
  if(!entry)return '';
  const locale=uiLanguage==='pl'?'pl-PL':'en-US';
  for(const key of Object.keys(entry.eras||{})){
    const o=document.createElement('option');o.value=key;o.textContent=historicalEraName(languageCode,key,locale);select.appendChild(o);
  }
  const value=historicalEraKey(languageCode,selectedValue);select.value=value;return value;
}
function updateHistoricalEraFields(settings={}){
  const source=document.getElementById('sourceLanguage').value;
  const target=document.getElementById('targetLanguage').value;
  const sourceHistorical=source!=='auto'&&isHistoricalLanguage(source);
  const targetHistorical=isHistoricalLanguage(target);
  const sourceSelect=document.getElementById('sourceHistoricalEra');
  const targetSelect=document.getElementById('targetHistoricalEra');
  document.getElementById('sourceEraOptionField').classList.toggle('hidden',!sourceHistorical);
  document.getElementById('targetEraOptionField').classList.toggle('hidden',!targetHistorical);
  if(sourceHistorical)fillHistoricalEra(sourceSelect,source,settings.sourceHistoricalEra||sourceSelect.value);else sourceSelect.replaceChildren();
  if(targetHistorical)fillHistoricalEra(targetSelect,target,settings.targetHistoricalEra||targetSelect.value);else targetSelect.replaceChildren();
}

function relocalizeLanguageLists(){
  const source=document.getElementById('sourceLanguage');
  const target=document.getElementById('targetLanguage');
  const sourceCategory=document.getElementById('sourceCategory');
  const targetCategory=document.getElementById('targetCategory');
  const ignoredCategory=document.getElementById('ignoredLanguageCategory');
  const sourceValue=source.value;
  const targetValue=target.value;
  const sourceCategoryValue=sourceCategory.value||languageCategory(sourceValue);
  const targetCategoryValue=targetCategory.value||languageCategory(targetValue);
  const ignoredCategoryValue=ignoredCategory.value||'standard';
  fillLanguageCategories(sourceCategory,sourceCategoryValue);
  fillLanguageCategories(targetCategory,targetCategoryValue);
  fillLanguageCategories(ignoredCategory,ignoredCategoryValue);
  fillLanguages(source,true,sourceCategoryValue,sourceValue);
  fillLanguages(target,false,targetCategoryValue,targetValue);
  updateHistoricalEraFields({sourceHistoricalEra:document.getElementById('sourceHistoricalEra').value,targetHistoricalEra:document.getElementById('targetHistoricalEra').value});
  renderIgnoredLanguages();
}

function fillIgnoredLanguageSelect(){
  const select=document.getElementById('ignoredLanguageSelect');
  const category=document.getElementById('ignoredLanguageCategory')?.value||'standard';
  const previous=select.value;
  select.replaceChildren();
  for(const [code,name] of sortedLanguages(category)){
    if(ignoredLanguages.includes(code))continue;
    const o=document.createElement('option');o.value=code;o.textContent=name;select.appendChild(o);
  }
  if([...select.options].some(o=>o.value===previous))select.value=previous;
  document.getElementById('addIgnoredLanguageBtn').disabled=select.options.length===0;
}

function renderIgnoredLanguages(){
  const chips=document.getElementById('ignoredLanguageChips');
  chips.replaceChildren();
  const locale=uiLanguage==='pl'?'pl-PL':'en-US';
  const ordered=[...ignoredLanguages].sort((a,b)=>languageName(a,locale).localeCompare(languageName(b,locale),locale));
  if(!ordered.length){
    const empty=document.createElement('span');empty.className='emptyLanguages';empty.textContent=t('noIgnoredLanguages');chips.appendChild(empty);
  }else{
    for(const code of ordered){
      const chip=document.createElement('span');chip.className='languageChip';
      const label=document.createElement('span');label.textContent=languageName(code,locale);
      const remove=document.createElement('button');remove.type='button';remove.className='chipRemove';remove.textContent='×';remove.title=t('removeLanguage');remove.setAttribute('aria-label',`${t('removeLanguage')}: ${label.textContent}`);
      remove.addEventListener('click',()=>{ignoredLanguages=ignoredLanguages.filter(value=>value!==code);renderIgnoredLanguages();});
      chip.append(label,remove);chips.appendChild(chip);
    }
  }
  fillIgnoredLanguageSelect();
}

function showToast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.remove('hidden');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.add('hidden'),1800);}

function formatUsageNumber(value){
  const n=Math.max(0,Number(value)||0);
  try{return new Intl.NumberFormat(uiLanguage==='pl'?'pl-PL':'en-US').format(n);}catch(_){return String(Math.round(n));}
}
function renderUsageStats(stats){
  const value=stats||{};
  const gemini=value.gemini||{};const deepl=value.deepl||{};const google=value.google||{};
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=formatUsageNumber(v);};
  set('usageGeminiRequests',gemini.requests);set('usageGeminiPromptTokens',gemini.promptTokens);set('usageGeminiOutputTokens',gemini.outputTokens);set('usageGeminiThinkingTokens',gemini.thinkingTokens);set('usageGeminiTotalTokens',gemini.totalTokens);
  set('usageDeepLRequests',deepl.requests);set('usageDeepLCharacters',deepl.characters);set('usageGoogleRequests',google.requests);
  const since=document.getElementById('usageSince');
  if(since){const ts=Number(value.startedAt)||Date.now();let date='';try{date=new Intl.DateTimeFormat(uiLanguage==='pl'?'pl-PL':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(ts));}catch(_){date=new Date(ts).toLocaleString();}since.textContent=t('usageSince',date);}
}
async function refreshUsageStats(){
  try{const response=await browser.runtime.sendMessage({type:'get-usage-stats'});if(response?.ok)renderUsageStats(response.stats);}catch(_){ }
}
async function resetUsageStats(){
  if(!confirm(t('resetUsageStatsConfirm')))return;
  try{const response=await browser.runtime.sendMessage({type:'reset-usage-stats'});if(response?.ok){renderUsageStats(response.stats);showToast(t('usageStatsReset'));}}catch(_){ }
}
function updateModeVisibility(){
  updateHistoricalEraFields();
  const mode=document.getElementById('actionMode').value;
  const aiTask=mode!=='translate';
  const geminiOnly=mode==='translate'&&geminiOnlyPairFromForm();
  const engine=document.getElementById('engine');
  document.getElementById('engineOptionField').classList.toggle('hidden',aiTask);
  if(engine){engine.disabled=geminiOnly;if(geminiOnly)engine.value='gemini';}
  document.getElementById('fictionalLanguageNotice').classList.toggle('hidden',!geminiOnly);
  document.getElementById('qualityOptionField').classList.toggle('hidden',aiTask);
  document.getElementById('qualityHelp').classList.toggle('hidden',aiTask);
  document.getElementById('summaryModeHelp').classList.toggle('hidden',mode!=='summary');
  document.getElementById('explainModeHelp').classList.toggle('hidden',mode!=='explain');
  document.getElementById('explainContextModeHelp').classList.toggle('hidden',mode!=='explain_context');
  document.getElementById('poemModeHelp').classList.toggle('hidden',mode!=='poem');
  document.getElementById('ignoreLanguagesBlock').classList.toggle('hidden',aiTask);
  document.getElementById('skipUnknownRow').classList.toggle('hidden',aiTask);
  document.getElementById('targetLanguageOptionsLabel').textContent=t(mode==='summary'?'summaryTargetLanguage':((mode==='explain'||mode==='explain_context')?'explainTargetLanguage':(mode==='poem'?'poemTargetLanguage':'targetLanguage')));
  updateSameWarning();
}
function updateSameWarning(){const mode=document.getElementById('actionMode').value;const source=document.getElementById('sourceLanguage').value;const target=document.getElementById('targetLanguage').value;const sourceEra=document.getElementById('sourceHistoricalEra').value;const targetEra=document.getElementById('targetHistoricalEra').value;const sameHistoricalDifferentEra=source!=='auto'&&source===target&&isHistoricalLanguage(source)&&historicalEraKey(source,sourceEra)!==historicalEraKey(target,targetEra);document.getElementById('sameLanguageWarning').classList.toggle('hidden',mode!=='translate'||!(source!=='auto'&&source===target&&!sameHistoricalDifferentEra));}


function catalogModelById(id){
  return (geminiCatalog?.models||[]).find(model=>model.id===id)||null;
}

function geminiModelLabel(model){
  const id=String(model?.id||'');
  const name=String(model?.displayName||id).trim()||id;
  const flags=[];
  const description=String(model?.description||'').toLowerCase();
  if(/translat/.test(description))flags.push(t('geminiModelTranslationOptimized'));
  if(model?.preview)flags.push(t('geminiModelPreviewTag'));
  return flags.length?`${name} — ${flags.join(', ')}`:name;
}

function automaticReasonText(reason){
  const map={
    google_recommended:'geminiAutoReasonGoogleRecommended',
    translation_optimized:'geminiAutoReasonTranslation',
    lightest:'geminiAutoReasonLightest',
    bootstrap:'geminiAutoReasonBootstrap'
  };
  return t(map[reason]||'geminiAutoReasonLightest');
}

function fillGeminiModelSelect(settings, preferredValue=null){
  const select=document.getElementById('geminiModel');
  if(!select)return;
  const intended=preferredValue||(settings.geminiModelMode==='manual'?settings.geminiModel:'auto');
  select.replaceChildren();
  const auto=document.createElement('option');
  auto.value='auto';
  const autoModel=geminiCatalog?.resolvedModel||geminiCatalog?.autoModel||settings.geminiModel||DEFAULT_SETTINGS.geminiModel;
  const autoEntry=catalogModelById(autoModel);
  auto.textContent=`${t('geminiModelAutomatic')} — ${autoEntry?.displayName||autoModel}`;
  select.appendChild(auto);
  const models=[...(geminiCatalog?.models||[])];
  for(const model of models){
    const opt=document.createElement('option');
    opt.value=model.id;
    opt.textContent=geminiModelLabel(model);
    select.appendChild(opt);
  }
  if(intended!=='auto'&&![...select.options].some(option=>option.value===intended)){
    const missing=document.createElement('option');
    missing.value=intended;
    missing.textContent=`${intended} — ${t('geminiModelUnavailableTag')}`;
    select.appendChild(missing);
  }
  select.value=[...select.options].some(option=>option.value===intended)?intended:'auto';
}

function renderGeminiCatalogMeta(){
  const meta=document.getElementById('geminiCatalogMeta');
  if(!meta)return;
  if(!geminiCatalog?.models?.length){meta.textContent=t('geminiCatalogUnavailable');return;}
  const count=geminiCatalog.models.length;
  let text=t('geminiCatalogCount',String(count));
  if(geminiCatalog.source==='api'&&geminiCatalog.fetchedAt){
    const date=new Date(geminiCatalog.fetchedAt);
    if(Number.isFinite(date.getTime())){
      try{text+=` • ${t('geminiCatalogUpdated')}: ${new Intl.DateTimeFormat(uiLanguage==='pl'?'pl-PL':'en-US',{dateStyle:'short',timeStyle:'short'}).format(date)}`;}catch(_){}
    }
  }else if(geminiCatalog.source==='bootstrap')text+=` • ${t('geminiCatalogBootstrap')}`;
  meta.textContent=text;
}

async function refreshGeminiCatalog(force=false){
  const apiKey=document.getElementById('geminiApiKey')?.value.trim()||'';
  const response=await browser.runtime.sendMessage({type:force?'refresh-gemini-model-catalog':'get-gemini-model-catalog',apiKey});
  if(response?.ok&&response.catalog){
    const previous=document.getElementById('geminiModel')?.value||null;
    geminiCatalog=response.catalog;
    const settings=effectiveSettings(await browser.storage.local.get(DEFAULT_SETTINGS));
    fillGeminiModelSelect(settings,previous);
    renderGeminiCatalogMeta();
    renderGeminiModelStatus();
  }
  return response;
}

function geminiStageMessage(stage){
  const map={
    STABLE:'geminiStatusStable',PREVIEW:'geminiStatusPreview',EXPERIMENTAL:'geminiStatusExperimental',UNSTABLE_EXPERIMENTAL:'geminiStatusExperimental',
    LEGACY:'geminiStatusLegacy',DEPRECATED:'geminiStatusDeprecated',RETIRED:'geminiStatusRetired'
  };
  return t(map[String(stage||'').toUpperCase()]||'geminiStatusUnknown');
}

function formatLifecycleDate(value){
  if(!value)return '';
  const date=new Date(value);
  if(!Number.isFinite(date.getTime()))return value;
  try{return new Intl.DateTimeFormat(uiLanguage==='pl'?'pl-PL':'en-US',{dateStyle:'medium'}).format(date);}catch(_){return date.toISOString().slice(0,10);}
}

function renderGeminiModelStatus(){
  const box=document.getElementById('geminiModelStatus');
  if(!box)return;
  const selectedValue=document.getElementById('geminiModel').value;
  const selected=selectedValue==='auto'?(geminiCatalog?.resolvedModel||geminiCatalog?.autoModel||DEFAULT_SETTINGS.geminiModel):selectedValue;
  box.replaceChildren();
  box.className='modelStatus';

  if(selectedValue==='auto'){
    box.classList.add('ok');
    const title=document.createElement('div');
    title.className='statusTitle';
    title.textContent=`${t('geminiAutomaticSelectionLabel')}: ${catalogModelById(selected)?.displayName||selected}`;
    box.appendChild(title);
    const line=document.createElement('div');
    line.className='statusMeta';
    line.textContent=automaticReasonText(geminiCatalog?.autoReason||'lightest');
    box.appendChild(line);
  }

  if(!geminiLifecycle||geminiLifecycle.model!==selected){
    if(selectedValue!=='auto'){
      box.classList.add('info');
      const entry=catalogModelById(selected);
      box.textContent=entry?`${entry.displayName} • ${entry.inputTokenLimit?`${Math.round(entry.inputTokenLimit/1000)}k input tokens`:t('geminiStatusWaiting')}`:t('geminiStatusWaiting');
    }
    return;
  }
  const stage=String(geminiLifecycle.stage||'').toUpperCase();
  if(selectedValue!=='auto'){
    if(stage==='STABLE')box.classList.add('ok');
    else if(['LEGACY'].includes(stage))box.classList.add('warning');
    else if(['DEPRECATED','RETIRED'].includes(stage))box.classList.add('critical');
    else box.classList.add('info');
  }else if(['LEGACY'].includes(stage))box.className='modelStatus warning';
  else if(['DEPRECATED','RETIRED'].includes(stage))box.className='modelStatus critical';

  const title=document.createElement('div');
  title.className='statusTitle';
  title.textContent=geminiStageMessage(stage);
  box.appendChild(title);
  const meta=[];
  if(geminiLifecycle.retirementTime)meta.push(`${t('geminiRetirementLabel')}: ${formatLifecycleDate(geminiLifecycle.retirementTime)}`);
  if(geminiLifecycle.recommendedModel)meta.push(`${t('geminiRecommendedLabel')}: ${geminiLifecycle.recommendedModel}`);
  if(meta.length){const line=document.createElement('div');line.className='statusMeta';line.textContent=meta.join(' • ');box.appendChild(line);}
  if(['RETIRED'].includes(stage)){const line=document.createElement('div');line.className='statusMeta';line.textContent=t('geminiAutomaticReplacementInfo');box.appendChild(line);}
  if(geminiLifecycle.message){const raw=document.createElement('div');raw.className='statusRaw';raw.textContent=`${t('geminiStatusMessageLabel')}: ${geminiLifecycle.message}`;box.appendChild(raw);}
}

async function load(){
  const raw=await browser.storage.local.get(null);
  const settings=effectiveSettings(raw);
  geminiLifecycle=raw.geminiModelLifecycle||null;
  ignoredLanguages=[...settings.ignoredLanguages];
  uiLanguage=settings.uiLanguage;
  localize();
  try{const response=await browser.runtime.sendMessage({type:'get-gemini-model-catalog'});geminiCatalog=response?.catalog||null;}catch(_){geminiCatalog=null;}
  const sourceCategory=languageCategory(settings.sourceLanguage);
  const targetCategory=languageCategory(settings.targetLanguage);
  fillLanguageCategories(document.getElementById('sourceCategory'),sourceCategory);
  fillLanguageCategories(document.getElementById('targetCategory'),targetCategory);
  fillLanguageCategories(document.getElementById('ignoredLanguageCategory'),'standard');
  fillLanguages(document.getElementById('sourceLanguage'),true,sourceCategory,settings.sourceLanguage);
  fillLanguages(document.getElementById('targetLanguage'),false,targetCategory,settings.targetLanguage);
  updateHistoricalEraFields(settings);
  fillGeminiModelSelect(settings);
  renderGeminiCatalogMeta();
  for(const key of booleanKeys)document.getElementById(key).checked=Boolean(settings[key]);
  for(const key of selectKeys)document.getElementById(key).value=settings[key];
  for(const key of numberKeys)document.getElementById(key).value=settings[key];
  document.getElementById('geminiApiKey').value=settings.geminiApiKey||'';
  document.getElementById('deepLApiKey').value=settings.deepLApiKey||'';
  document.getElementById('geminiCustomPrompt').value=settings.geminiCustomPrompt||DEFAULT_GEMINI_CUSTOM_PROMPT;
  document.getElementById('version').textContent=browser.runtime.getManifest().version;
  const shortcut=await browser.runtime.sendMessage({type:'get-shortcut'});document.getElementById('shortcutValue').textContent=shortcut?.shortcut||t('notSet');
  updateModeVisibility();
  renderIgnoredLanguages();
  renderGeminiModelStatus();
  await refreshUsageStats();
}

async function save(){
  if(geminiOnlyPairFromForm()) document.getElementById('engine').value='gemini';
  const payload={};
  for(const key of booleanKeys)payload[key]=document.getElementById(key).checked;
  for(const key of selectKeys)payload[key]=document.getElementById(key).value;
  for(const key of numberKeys)payload[key]=Number(document.getElementById(key).value)||DEFAULT_SETTINGS[key];
  const modelSelection=document.getElementById('geminiModel').value;
  payload.geminiModelMode=modelSelection==='auto'?'auto':'manual';
  payload.geminiModel=modelSelection==='auto'?(geminiCatalog?.resolvedModel||geminiCatalog?.autoModel||DEFAULT_SETTINGS.geminiModel):modelSelection;
  payload.geminiApiKey=document.getElementById('geminiApiKey').value.trim();
  payload.deepLApiKey=document.getElementById('deepLApiKey').value.trim();
  payload.geminiCustomPrompt=document.getElementById('geminiCustomPrompt').value.trim()||DEFAULT_GEMINI_CUSTOM_PROMPT;
  payload.ignoredLanguages=[...ignoredLanguages];
  await browser.storage.local.set(payload);
  await browser.storage.local.remove('geminiCustomPromptEnabled');
  uiLanguage=payload.uiLanguage;
  localize();
  relocalizeLanguageLists();
  fillGeminiModelSelect(effectiveSettings(payload),payload.geminiModelMode==='auto'?'auto':payload.geminiModel);
  renderGeminiCatalogMeta();
  updateModeVisibility();
  renderGeminiModelStatus();
  showToast(t('settingsSaved'));
}

async function resetDefaults(){
  if(!confirm(t('resetConfirm')))return;
  const current=await browser.storage.local.get(['geminiApiKey','deepLApiKey']);
  const preservedApiKeys={
    geminiApiKey:String(current.geminiApiKey||''),
    deepLApiKey:String(current.deepLApiKey||'')
  };
  const keys=[...Object.keys(DEFAULT_SETTINGS),'geminiModelLifecycle','skipEnglish','geminiCustomPromptEnabled'];
  await browser.storage.local.remove(keys);
  await browser.storage.local.set({...DEFAULT_SETTINGS,...preservedApiKeys});
  geminiLifecycle=null;
  ignoredLanguages=[...DEFAULT_SETTINGS.ignoredLanguages];
  await load();
  showToast(t('defaultsRestored'));
}

function resetCustomPrompt(){
  document.getElementById('geminiCustomPrompt').value=DEFAULT_GEMINI_CUSTOM_PROMPT;
  showToast(t('promptDefaultRestored'));
}

document.addEventListener('DOMContentLoaded',async()=>{
  await load();
  document.getElementById('saveBtn').addEventListener('click',save);
  document.getElementById('resetBtn').addEventListener('click',resetDefaults);
  document.getElementById('clearCacheBtn').addEventListener('click',async()=>{await browser.runtime.sendMessage({type:'clear-cache'});showToast(t('cacheCleared'));});
  document.getElementById('resetUsageStatsBtn').addEventListener('click',resetUsageStats);
  document.getElementById('shortcutBtn').addEventListener('click',()=>browser.runtime.sendMessage({type:'open-shortcuts'}));
  document.getElementById('actionMode').addEventListener('change',updateModeVisibility);
  document.getElementById('sourceCategory').addEventListener('change',e=>{
    const select=document.getElementById('sourceLanguage');
    const previous=select.value;
    fillLanguages(select,true,e.target.value,previous==='auto'?'auto':null);
    if(previous!=='auto'){const first=[...select.options].find(o=>o.value!=='auto');if(first)select.value=first.value;}
    updateModeVisibility();
  });
  document.getElementById('targetCategory').addEventListener('change',e=>{
    const select=document.getElementById('targetLanguage');
    fillLanguages(select,false,e.target.value,null);
    updateModeVisibility();
  });
  document.getElementById('sourceLanguage').addEventListener('change',updateModeVisibility);
  document.getElementById('targetLanguage').addEventListener('change',updateModeVisibility);
  document.getElementById('sourceHistoricalEra').addEventListener('change',updateSameWarning);
  document.getElementById('targetHistoricalEra').addEventListener('change',updateSameWarning);
  document.getElementById('geminiModel').addEventListener('change',renderGeminiModelStatus);
  document.getElementById('refreshGeminiModelsBtn').addEventListener('click',async()=>{const btn=document.getElementById('refreshGeminiModelsBtn');btn.disabled=true;try{await refreshGeminiCatalog(true);showToast(t('geminiModelsRefreshed'));}finally{btn.disabled=false;}});
  document.getElementById('resetPromptBtn').addEventListener('click',resetCustomPrompt);
  document.getElementById('ignoredLanguageCategory').addEventListener('change',fillIgnoredLanguageSelect);
  document.getElementById('addIgnoredLanguageBtn').addEventListener('click',()=>{
    const select=document.getElementById('ignoredLanguageSelect');
    const code=select.value;
    if(code&&!ignoredLanguages.includes(code)){ignoredLanguages.push(code);renderIgnoredLanguages();}
  });
  document.getElementById('uiLanguage').addEventListener('change',e=>{
    uiLanguage=e.target.value;
    localize();
    relocalizeLanguageLists();
    updateModeVisibility();
    renderGeminiModelStatus();
  });
  document.querySelectorAll('.reveal').forEach(btn=>btn.addEventListener('click',()=>{const input=document.getElementById(btn.dataset.target);const showing=input.type==='text';input.type=showing?'password':'text';btn.textContent=showing?t('show'):t('hide');}));
});

browser.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(changes.geminiModelLifecycle){geminiLifecycle=changes.geminiModelLifecycle.newValue||null;renderGeminiModelStatus();}if(changes.geminiModelCatalog){const previous=document.getElementById('geminiModel')?.value||null;geminiCatalog=changes.geminiModelCatalog.newValue||null;browser.storage.local.get(DEFAULT_SETTINGS).then(raw=>{const settings=effectiveSettings(raw);fillGeminiModelSelect(settings,previous);renderGeminiCatalogMeta();renderGeminiModelStatus();}).catch(()=>{});}if(changes.usageStats)renderUsageStats(changes.usageStats.newValue||{});});
