# Privacy

LingoLens sends text to the provider required by the selected language-tool mode. Translation uses the provider selected by the user; Gemini-only modes such as summarization, explanation and rhymed-poem transformation send the selected text to the Google Gemini API.


Historical/ancient languages, fictional/constructed languages, regional/dialect entries, the rare/indigenous catalog, mathematical/formal systems, computer/machine languages, and writing/encoding/signaling systems are Gemini-only in LingoLens. Historical language requests also send the selected source/target period metadata as part of the Gemini instruction so the model can avoid anachronistic forms. When one of these languages, mathematical/formal systems, computer representations, or writing/encoding/signaling systems is selected as the source or target, LingoLens sends the selected/hovered text to the Google Gemini API even if another translation engine had previously been selected. Google Translate and DeepL are not used as provider fallback for these language pairs; only Gemini model replacement may occur when Automatic fallback is enabled.

Depending on settings, translated text may be sent to:

- Google Translate
- Google Gemini API
- DeepL API

When **Fallback to Google Translate** is enabled (the default), text initially sent to Gemini or DeepL may also be sent to Google Translate if the selected provider fails or, for hover translations in Gemini, responds too slowly. The translation footer indicates when fallback was used and why. The global **Automatic fallback** switch can be disabled in Advanced settings; when disabled, LingoLens does not automatically switch providers or Gemini models.

If the selected Gemini model is unavailable, LingoLens may retry the same text with another Gemini model before any provider fallback. It prefers an explicit replacement suggested by Gemini lifecycle/error metadata and otherwise uses its built-in translation-model fallback policy. The footer indicates model-level fallback separately.

If the Custom prompt quality profile is selected, that prompt is sent to the Gemini API together with the source text. For historical languages, LingoLens appends the selected chronological-stage constraints even in Custom mode so the user-defined prompt does not accidentally remove the anti-anachronism guard. Depending on the selected prompt placement, it is sent as a system instruction or as a prefix in the user message. Prompt settings are stored locally in Firefox extension storage.

Gemini-only tools operate on selected text even when its language is present on the **Never translate these languages** list, because those modes are transformations rather than ordinary translation. The **Never translate these languages** list is stored locally and is used before sending text to a translation service. English is included by default. The list can be changed by the user.

API keys are stored locally in Firefox extension storage and are sent only to the corresponding provider when required. LingoLens does not operate its own translation server and does not sell user data.

For Gemini, LingoLens also calls the Gemini Models API to retrieve the current catalog of text models and their public metadata (for example model ID, display name, description, supported generation methods and token limits). This catalog request uses the user's Gemini API key but sends **no webpage text or translation content**. The resulting catalog and refresh timestamp are cached locally, normally for up to 24 hours, so LingoLens can discover new models and removed models without an extension update.

Gemini generation responses may additionally return model-lifecycle metadata such as model stage, retirement time, and a provider message. LingoLens stores the latest status locally so it can warn about deprecation or retirement and select a replacement if a model becomes unavailable. This lifecycle/status handling does not require sending extra source text solely for monitoring.

The **Explain with page context** mode may additionally send up to 16,000 characters of nearby webpage text to Gemini to interpret the selected fragment.

Whole-page translation is initiated only from the browser context menu (**Translate page → Google Translate**). LingoLens opens a Google Translate page-translation URL containing the current page address. The page is not sent through the normal Gemini or DeepL text workflow. `Ctrl+A` does not trigger whole-page translation.

Author: Arkadiusz Pajda  
Contact: arkadiusz.pajda.97@onet.pl


## Local usage statistics

LingoLens stores resettable local usage counters in Firefox extension storage: provider request counts, Gemini token counts reported by the Gemini API, and the number of input characters sent to DeepL. These statistics stay on the user's device and are not transmitted to the author or to an analytics service. Resetting general settings does not clear these counters; they have a separate reset control.
