# LingoLens 1.12.2

**Understand any text without leaving the page.** LingoLens is a privacy-conscious Firefox extension that translates, explains, summarizes, rewrites, analyzes, and proofreads text exactly where you are reading it.

Hover over a paragraph for an instant translation, or select any passage to unlock the full toolkit. LingoLens covers **484 languages, regional varieties, historical stages, constructed languages, programming languages, mathematical formalisms, and encoding systems**—from everyday English to Quenya, from Old Polish to Egyptian, and from prose to mathematical notation.

## Highlights

- Instant, unobtrusive translation on hover and powerful actions for selected text.
- Translate, summarize, explain simply, explain with page context, create rhymed verse, perform expert language analysis, or proofread with minimal high-confidence corrections.
- Gemini, DeepL, and Google Translate support, with transparent fallbacks and local usage counters.
- Period-aware historical language handling, conservative uncertainty reporting, and dialect-sensitive analysis.
- Keyboard copying, long-result scrolling, and a toolbar pinning hint.
- API keys stay in Firefox extension storage and are never included in the source or release package.

## v1.12.2 — publication release

- Replaced every product icon size with the final supplied artwork.
- Added expert Language analysis and focused Proofread modes.
- Added toolbar placement guidance, hover controls and keyboard shortcuts.
- Added MIT licensing and publication-ready English metadata and documentation.
- Preserved the v1.x extension identity and all existing translation, fallback, catalog and usage-counter behavior.

## v1.9.9 — usage-counter regression hotfix

- Fixed translations getting stuck on `Translating...` after v1.9.8.
- Root cause: local usage-counter writes were incorrectly treated by the content script as user setting changes, invalidating the in-flight request ID before the provider response could be displayed.
- The content script now reacts only to keys that are actual `DEFAULT_SETTINGS`; internal storage such as `usageStats`, Gemini model catalog and lifecycle metadata no longer cancels translations or clears the translation cache.
- Usage counters and footer token/character reporting from v1.9.8 are preserved.


## v1.9.8 — local usage counters

- Added local, resettable request counters for Gemini, DeepL and Google Translate.
- Added Gemini input/output/thinking/total token counters based on API `usageMetadata`.
- Added a local DeepL input-character counter.
- Gemini token count and DeepL input-character count can appear in the one-line result footer.
- Counter writes are isolated from translation execution: storage errors are ignored and cannot fail a translation.


## v1.9.7 — self-updating Gemini model catalog

- Gemini text models are discovered dynamically through the Gemini Models API instead of being limited to two hard-coded choices.
- Automatic model selection is now the default. It prioritizes explicit Google lifecycle replacements, then translation-oriented metadata, then the lightest/newest stable text model.
- The catalog refreshes automatically, is cached locally for resilience, can be refreshed manually, and is refreshed immediately when a model becomes unavailable.
- Users can still choose any discovered text model manually. Specialized image/audio/live/embedding/video endpoints are excluded from the text-model selector.
- Minimal-thinking optimization now adapts to model families so choosing an older/newer model does not blindly send an unsupported thinking configuration.

## v1.9.6 — language picker UX

- Translation quality remains directly available in the main popup whenever it applies to Gemini translation.
- Language selectors are now two-stage: choose a category first, then choose a language from that category. Only one language group is visible at a time.
- The same category filter is used in full settings and in the “Never translate these languages” picker, avoiding a single list with hundreds of entries.


## Mathematics and formal logic / Matematyka i logika formalna (v1.9.5)

LingoLens adds a dedicated Gemini-only **mathematical language** family. The primary target, **Mathematical language / adaptive formalism**, is intended to formalize arbitrary prose as rigorously as the source permits. Gemini may combine algebra, functions, equations, set theory, relations, propositional/predicate/modal/temporal logic, probability and statistics, vectors/matrices/tensors, graph theory, optimization and other established mathematical notation when that is the most faithful representation.

The key rule is **no fake precision**. LingoLens explicitly forbids inventing numerical values, probabilities, coefficients, distributions, dimensions, equations, causal laws or assumptions merely to make ordinary prose look mathematical. Qualitative concepts should remain qualitative through named predicates, relations, sets, orderings, variables or symbolic parameters. Nonstandard symbols must be defined. The output may contain a compact symbol legend when that is necessary for an unambiguous formalization.

The catalog also provides more constrained targets for **formal logic**, **set theory & relations**, **algebra & equations**, **calculus & differential equations**, **probability & statistics**, **linear algebra & tensor notation**, **discrete mathematics & graph theory**, and **optimization & decision models**. Selecting one of these forces Gemini to prefer that formal vocabulary rather than freely choosing the representation.

Mathematical notation can also be selected as a source. In that direction LingoLens interprets equations, quantifiers, variables, domains, assumptions and constraints and renders their meaning in a natural language without silently solving, simplifying or strengthening the statement. Mathematical-to-computer conversion treats the formal statement as a specification. Mathematical pairs bypass ordinary natural-language number/currency validation because equivalent formalizations can legitimately reorganize or introduce structural numeric notation. Mathematical output is shown in a monospaced layout and uses readable Unicode symbols with LaTeX-compatible notation when needed.

## Writing, encoding and signaling systems / Systemy zapisu, kodowania i sygnałów (v1.9.4)

LingoLens adds a dedicated Gemini-only catalog of **38 writing, transcription, encoding and signaling systems**. These are treated as exact representation conversions rather than ordinary stylistic translation. The catalog includes **International Morse Code**, Polish/Cyrillic/Greek Morse variants, **Wabun (Japanese Morse)**, historical American Morse, **flag semaphore**, International Code of Signals flags, the **ICAO/NATO spelling alphabet**, several Braille conventions (including UEB and Polish Braille), **IPA, X-SAMPA and ARPABET**, selected romanization standards, classical manual codes/ciphers such as **Tap code, Polybius square, Bacon’s cipher and Pigpen**, **Baudot/ITA2**, ASCII/EBCDIC representations, Base32/Base58, URL percent-encoding, HTML character references and Quoted-Printable.

For these systems LingoLens uses a specialized exact-conversion prompt. It instructs Gemini to preserve the payload, symbol order, digits, punctuation, separators and shift states, to use the exact selected standard, and to avoid paraphrasing or inventing unsupported symbols. Normal natural-language number/currency validation is disabled for these pairs because an encoding may legitimately replace visible digits and words with code symbols. Output is displayed in a monospaced form.

Some systems are explicitly marked **experimental** when plain Unicode cannot faithfully render the original medium or when multiple historical conventions exist (for example American Morse, Moon type or Pigpen glyphs). In those cases LingoLens asks for a reversible textual notation rather than pretending that an exact graphical glyph is available. These systems are Gemini-only; Google Translate and DeepL are not used as provider fallback, although automatic Gemini-model replacement can still occur.

## Gemini AI modes / Tryby Gemini


## Computer and machine languages / Języki komputerowe i maszynowe (v1.9.3)

LingoLens includes a dedicated Gemini-only catalog for **77 computer languages and machine-readable representations**. It covers architecture-specific low-level targets (**x86-64 Intel/AT&T assembly and experimental raw machine bytes, ARM64/AArch64, ARMv7, RISC-V RV64, MIPS32, MOS 6502, Z80, AVR**), intermediate representations (**WebAssembly WAT, LLVM IR, JVM bytecode, .NET CIL, NVIDIA PTX**), general-purpose/scientific languages (**C, C++, Rust, Zig, Go, Python, JavaScript, TypeScript, Java, Kotlin, C#, Swift, R, Julia, MATLAB, Fortran, COBOL, Haskell, OCaml, Scala, Elixir and others**) and technical notations/formats (**SQL/T-SQL/PostgreSQL, Bash, PowerShell, Regex, JSON, YAML, XML, TOML, HTML, CSS, Markdown, LaTeX, GraphQL, Dockerfile, Terraform/HCL, pseudocode**). Binary UTF-8, hexadecimal UTF-8, Base64 and Unicode code-point representations are also available.

For these targets LingoLens switches from natural-language translation prompting to a **semantic code-conversion prompt**. Natural-language input is treated as a behavioral specification; code-to-code input is transpiled/ported by behavior rather than token-by-token wording; code-to-natural-language input is rendered as a faithful description of what the program/data does. Natural-language number/currency validation is disabled for computer-language pairs because correct code transformations may legitimately introduce numeric literals, offsets or sentinels.

Raw machine-code targets are marked **experimental**. Exact bytes depend on the selected architecture and may additionally depend on ABI, operating system, instruction-set extensions and memory layout. The prompt explicitly instructs Gemini never to fabricate unknown opcodes or unsupported platform assumptions. Computer-language results are displayed in a monospaced font. Google Translate and DeepL are not used for these pairs; Automatic fallback may only move to another Gemini model.


## Historical and ancient languages / Języki historyczne i starożytne

LingoLens 1.9.0 introduced a Gemini-only historical-language catalog with explicit **source period** and **target period** selectors. Historical translation is period-aware: the Gemini prompt names the selected chronological stage and instructs the model to avoid vocabulary, morphology, syntax, spelling and idioms characteristic only of substantially earlier or later stages. When a modern concept has no securely attested equivalent in the requested period, LingoLens asks Gemini to prefer a historically plausible descriptive paraphrase rather than silently importing a modern anachronism.

The catalog includes, among others:

- **Ancient Egypt:** Ancient Egyptian in Unicode hieroglyphs (experimental) and Egyptological transliteration; Old, Middle, Late and Ptolemaic/Demotic stages where appropriate.
- **Mesopotamia and the Ancient Near East:** Sumerian (transliteration and cuneiform), Akkadian (Old Babylonian, Middle Babylonian, Neo-Assyrian, Neo-Babylonian), Elamite, Hittite, Hurrian, Ugaritic, Phoenician/Punic, historical Aramaic, and Ancient/Biblical Hebrew.
- **Mediterranean and Indo-Iranian:** Mycenaean/Homeric/Classical/Koine/Byzantine Greek, Old/Classical/Late/Medieval/Renaissance Latin, Etruscan, Old Persian, Avestan, and Vedic/Classical Sanskrit.
- **Historical Europe:** Gothic, Proto-Norse, Old Norse, Old English, Middle English, Early Modern English, Old and Middle High German, Old and Middle French, Old Church Slavonic, Old East Slavic, Old Polish, Middle Polish and Old Czech.
- **East Asia:** Old/Classical Chinese, Middle Chinese, and Old/Middle Japanese.
- **Pre-Columbian and early colonial Americas:** Classic and Postclassic Maya, historical Yucatec Maya, K’iche’ and Kaqchikel, Classical Nahuatl/Aztec-Mexica, historical Mixtec, Zapotec, Purépecha, Otomi, Totonac, Huastec, Inca-period Quechua, historical Aymara, Puquina, Mochica, Guaraní, Taíno, Muisca, Old Tupi/Tupinambá and historical Mapudungun. Pre-contact stages that lack direct prose documentation are explicitly marked reconstructed/experimental.
- **Reconstructed proto-languages:** Proto-Indo-European, Proto-Germanic, Proto-Slavic/Common Slavic and Proto-Semitic. These are explicitly marked reconstructed/experimental and must not be treated as directly attested historical texts.

For **Old Polish**, for example, the target period can be selected as pre-literary/reconstructed 10th–12th century, 13th century, **14th century**, 15th century or early 16th century. A 14th-century target explicitly tells Gemini not to mix in 10th-century reconstructions or 17th-century Polish. Middle English similarly exposes 12th–13th, 14th and 15th-century stages; Latin exposes Old, Classical, Late, Medieval and Renaissance stages.

Historical language pairs always use Gemini. Google Translate and DeepL are not used as provider fallback, although Automatic fallback may still replace an unavailable Gemini model with another Gemini model. Automatic source-language detection is not reliable for ancient languages, scripts or reconstructed stages, so selecting the source language and period manually is recommended.

**Undeciphered writing systems are intentionally not presented as translatable languages.** For example, Linear A is not offered as if it had a reliably known linguistic reading. Classic Maya output uses scholarly transliteration/transcription rather than invented pseudo-glyphs because a complete standardized Unicode Maya hieroglyph repertoire is not generally available for ordinary text output.

## Rare and indigenous languages / Języki rzadkie i rdzenne

LingoLens 1.8.2 adds a broad Gemini-only catalog of rare, indigenous and minority languages from the Americas, Africa, Oceania, Australia, the Arctic, Asia and Europe. The list includes, among others, **Cherokee, Navajo, Lakota, Dakota, Ojibwe, Cree, Inuktitut, Kalaallisut, Mohawk, Quechua, Aymara, Guaraní, Nahuatl, Yucatec Maya, K’iche’, Mapudungun, Māori, Hawaiian, Samoan, Tongan, Tahitian, Pitjantjatjara, Warlpiri, Khoekhoegowab, Taa/!Xóõ, Juǀ’hoan, Maasai, Zulu, Xhosa, Yoruba, Oromo, Ainu, Northern/Lule/Southern/Inari/Skolt Sámi, Tibetan, Uyghur, Hmong, S’gaw Karen, Amis and Atayal**.

These languages are grouped separately in the source/target selectors. LingoLens routes them through Gemini to avoid unreliable provider assumptions for uncommon language pairs. Automatic fallback may still switch to another Gemini model, but not to Google Translate or DeepL. Languages with scarcer digital resources are labeled **experimental**. Automatic detection can be unreliable for uncommon languages, so choosing the source language manually is recommended when translating from one of them.

## Fictional and constructed languages / Języki fikcyjne i konstruowane

LingoLens 1.8.1 adds Gemini-only fictional and constructed language targets. Tolkien languages include **Quenya, Sindarin, Telerin, Khuzdul, Adûnaic, Westron/Common Speech, Black Speech of Mordor, and Valarin**. Other included languages are **Klingon (tlhIngan Hol), High Valyrian, Dothraki, Na’vi, Trigedasleng, Belter Creole/Lang Belta, Dovahzul, Huttese, and Mando’a**.

Selecting any of these languages as a fixed source or target automatically uses Gemini. DeepL and Google Translate are not used for these pairs, including provider fallback. Automatic fallback may still replace an unavailable Gemini model with another Gemini model. Languages with very small canonical corpora are labeled **experimental** in the language list; output for those languages may require reconstruction and should not be treated as canonical. Automatic source-language detection is not reliable for fictional languages, so choose the fictional source explicitly when translating *from* one of them.


## Rhymed poem / Wiersz rymowany

LingoLens 1.8.0 adds a separate **Rhymed poem / Wiersz rymowany** mode for selected text. Gemini preserves the core meaning, factual content, context and emotional tone, while reshaping the selection into natural rhymed verse in the configured target language. The prompt prefers clear end rhymes and a reasonably consistent rhyme scheme without forcing awkward wording. Names, dates, numbers, prices, currencies, units and important conditions must remain faithful to the source. The mode works on selections only; hover is intentionally inactive. If the selected Gemini model is unavailable and Automatic fallback is enabled, LingoLens may use a suitable replacement Gemini model, but it does not fall back to Google Translate or DeepL for this creative transformation.

LingoLens 1.7.0 adds two Gemini explanation modes: **Explain simply / Wyjaśnij prosto** and **Explain with page context / Wyjaśnij z kontekstem strony**. The first explains only the selected fragment in the simplest practical language. The second stays focused on the selection but also sends up to 16,000 characters of nearby page text as supporting context. Both modes work on selections only and do not use provider fallback to Google Translate or DeepL.

LingoLens 1.6.0 added a separate **Summarize / Streszczenie** mode for longer selections. It uses Gemini directly, produces a concise overview followed by key bullet points, and writes the summary in the configured target language. Hover is intentionally disabled in this mode. The ignored-language list and same-language translation guard do not block summarization. If the selected Gemini model is unavailable and automatic fallback is enabled, LingoLens may use a suitable replacement Gemini model; it does not fall back to Google Translate or DeepL for summarization.


## Author

Arkadiusz Pajda  
Contact: arkadiusz.pajda.97@onet.pl

## Features

- Translate a paragraph/block by hovering over its text.
- Translate the entire selected fragment while preserving line and paragraph breaks.
- Turn selected text into a natural rhymed poem in the configured target language while preserving its core meaning, facts, context and emotional tone.
- Whole-page translation is available from the browser context menu: **Translate page → Google Translate**.
- `Ctrl+A` does not trigger whole-page translation; near-whole-page selections are ignored by the text translator.
- Translation engines are selected directly: **DeepL**, **Gemini**, or **Google Translate**.
- **Gemini translation quality** can be selected from the main popup: **Fast**, **Balanced (recommended)**, **High quality**, **Professional rewrite**, or **Custom prompt**. Balanced and High quality explicitly prioritize idiomatic target-language phrasing and avoid literal calques. Professional rewrite additionally rewrites the translation into clear, polished professional prose while preserving factual meaning, context, speaker intent and emotional stance. Legacy was removed in v1.5.7.
- **DeepL** automatically falls back to Google Translate when DeepL fails.
- **Gemini** automatically falls back to Google Translate when Gemini fails. Hover translations also retain the fast fallback behavior when Gemini responds too slowly; selected text waits for an actual Gemini failure.
- **Automatic fallback** can be disabled globally in **Advanced settings**. When disabled, LingoLens does not switch Gemini models and does not switch providers.
- Whenever provider fallback occurs, the translation footer shows the provider switch and the reason. If Gemini returned text that was rejected by validation, hold **Ctrl+Alt** to temporarily preview that rejected Gemini result; release the keys to return to the fallback translation.
- v1.5.6 makes Gemini validation deliberately conservative to eliminate false fallbacks: explicit numbers are compared as multisets only when both sides contain the same count of digit tokens (so `5` → `pięciu` is not falsely rejected), while one-letter/ambiguous currency symbols such as `R`, `$`, `¥` and `kr` cannot by themselves prove a currency substitution. Explicit codes such as `ZAR`/`PLN` and unambiguous full currency names/symbols still trigger protection.
- Currency validation now uses a comprehensive ISO 4217 normalizer. It recognizes the complete code set known to modern ISO/browser data (including special units such as XAU/XAG), browser-localized symbols and currency names via `Intl`, plural/case variants, and ambiguity-aware symbols such as `$`, `¥` and `kr`. A fallback is triggered only when the translated output introduces a currency incompatible with the source currency evidence.
- Gemini result validation now compares numeric values semantically, so harmless locale formatting such as `3000.00`, `3000,00`, `3 000,00`, or dropping a zero-only decimal part does not trigger a false fallback. Currency-family validation also recognizes short Russian ruble notation more reliably.
- Fast, Balanced, High quality and Professional Gemini prompts explicitly forbid currency conversion/substitution (for example RUB → PLN). 
- Translation cache keys include the selected Gemini quality profile and custom prompt, so switching **Fast / Balanced / High quality / Professional / Custom** cannot reuse a stale result generated by another profile.
- A configurable **Never translate these languages** list. English is on the list by default. Languages can be added and removed in Settings.
- Local language detection prefers the actual Latin-script text over a page-level `lang` declaration, which improves ignore-language behavior on mixed-language pages.
- Source language: automatic detection by default, or a fixed language.
- Target language: selectable; on first run it follows the Firefox interface language when supported. Unsupported Firefox languages fall back to English.
- Same-language translation is skipped, except when the same historical language is deliberately converted between two different selected periods.
- Optional skip when local source-language detection is unknown.
- Keyboard shortcut to copy the currently visible result. Default: `Ctrl+Shift+Y`.
- Keyboard shortcut to enable/disable hover translation. Default: `Alt+Shift+H`.
- Selectable Polish or English interface. On first run, Polish Firefox selects Polish; every other Firefox interface language selects English.
- API keys stored locally in Firefox extension storage. **Reset settings preserves Gemini and DeepL API keys.**

## Gemini advanced controls

- The model selector in **Advanced settings** is populated dynamically from the Gemini `models.list` API whenever a Gemini API key is available. Only ordinary text models that support `generateContent` are shown; image, audio/live, embedding, robotics and video-specialized endpoints are filtered out.
- **Automatic selection** is the default. LingoLens refreshes the catalog at most once every 24 hours during normal use and also refreshes it after the API key changes, when the user presses **Refresh models**, and when a selected model suddenly becomes unavailable. The last successful catalog is cached locally, so the extension can keep working through temporary network/API-catalog failures.
- Automatic selection gives first priority to an explicit replacement recommended by Google lifecycle metadata. Otherwise it prefers models whose Gemini API metadata describes them as translation-oriented/optimized; if no such signal exists, it selects the lightest available stable text model (Flash-Lite/Lite before Flash before Pro, favoring newer generations).
- A specific model can still be selected manually from the live catalog. The built-in Flash-Lite entries are only an offline bootstrap safety net, not the authoritative model list.
- LingoLens reads Gemini lifecycle metadata returned by generation responses and warns when the active model becomes legacy, deprecated, or retired. If a model disappears, the extension refreshes the live catalog before choosing a replacement.
- Model-level fallback is shown separately in the translation footer.
- Custom Gemini translation prompt used by the **Custom prompt** quality profile, with placeholders: `{source_language}`, `{target_language}`, `{source_kind}`, `{source_period}`, `{target_period}`. Historical period constraints are appended even in Custom mode so a custom prompt cannot accidentally disable the anti-anachronism guard. The prompt section includes **Reset prompt**, which restores the built-in default prompt without changing API keys or other settings.
- Prompt placement can be set to **System instruction** (recommended) or **User message prefix**.
- **Minimal thinking** can be enabled to reduce latency/token use when supported by the selected model.
- **Compact prompt for hover** keeps hover instructions shorter. Selected text continues to use the fuller built-in prompt. A custom prompt is never shortened automatically.

System instruction is primarily a request-structure and instruction-separation choice; it is not treated as a guaranteed latency optimization. The latency-oriented controls are minimal thinking and the compact hover prompt.

## Model lifecycle and recommendations

LingoLens is designed to remain usable without an extension update when Google adds or removes Gemini models. The Gemini Models API is the authoritative runtime catalog. It exposes available model IDs, display names, descriptions, `generateContent` support, context limits and related metadata. Generation responses/errors provide lifecycle and replacement hints.

For automatic model choice LingoLens uses this order:

1. Google's explicit lifecycle replacement, when supplied and currently available.
2. A live text model whose API description explicitly signals translation optimization/preference; among matching models LingoLens favors a light/new/stable option.
3. Otherwise the lightest available stable text model from the live catalog.
4. If the live catalog cannot be obtained, the most recent cached catalog; if there is no cache, the built-in Flash-Lite bootstrap model.
5. Google Translate provider fallback, when enabled and Gemini itself still fails.

The Models API does not currently expose a universal `best_for_translation` field, so LingoLens deliberately treats explicit lifecycle recommendations and translation wording in provider metadata as stronger evidence than its own lightness heuristic.

## Test installation in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select `manifest.json` from the unpacked extension folder.
4. Open Settings and add your Gemini and/or DeepL API key if you want to use those engines.

Temporary add-ons are removed when Firefox closes. A permanently installed release needs to be signed by Mozilla Add-ons for standard Firefox builds.

## API keys

API keys are stored in `browser.storage.local`. This is local extension storage, not an encrypted password vault. The extension does not include any API key in its source package.

## License

MIT License. See `LICENSE`.

Copyright (c) 2026 Arkadiusz Pajda.

- v1.5.5: expanded currency validation from a small hand-written list to the comprehensive ISO 4217/Intl normalizer; ambiguous symbols are handled as candidate sets rather than guessed.

- v1.5.6: reduced false-positive Gemini validation fallbacks for number-word inflection/reformatting and ambiguous CLDR narrow currency symbols.

- v1.5.7: removed the Legacy quality profile. Added Ctrl+Alt diagnostic preview for Gemini text rejected by validation before provider fallback.

- v1.5.8: compacted fallback diagnostics into the translation footer and retained Ctrl+Alt rejected-result preview.

- v1.5.9: added the Professional rewrite quality profile. It preserves meaning, facts, context and emotional intent while rewriting awkward or informal source text into polished professional target-language prose.


- v1.7.0: added Explain simply and Explain with page context modes. Context mode sends at most 16,000 characters of nearby page text to Gemini and remains focused on the selected fragment.
- v1.6.0: added a separate Summarize mode for selected text. Gemini produces a concise overview plus key bullet points in the chosen output language; hover and provider fallback to Google/DeepL are disabled for this mode.

- v1.8.0: added Rhymed poem / Wiersz rymowany mode for selected text. Gemini adapts the selection into natural rhymed verse in the target language while preserving factual meaning and emotional tone.

- v1.8.2: added a large Gemini-only catalog of rare, indigenous and minority languages and grouped language selectors into standard, rare/indigenous and fictional/constructed sections.
- v1.8.1: added Gemini-only fictional/constructed languages, including Tolkien languages, Klingon, High Valyrian, Dothraki, Na’vi and other well-known conlangs. Fragmentary languages are labeled experimental.

- v1.9.0: added historical and ancient languages with independent source/target period selection and an anti-anachronism prompt guard. Includes Ancient Egyptian/hieroglyphs, Sumerian, Akkadian, Biblical Hebrew, historical Greek and Latin, Old/Middle English, Old Polish by century, Classic Maya, reconstructed proto-languages and more.
- v1.9.2: expanded the historical Americas catalog with period-aware Classical Nahuatl/Aztec-Mexica, Postclassic Maya and historical Yucatec/K’iche’/Kaqchikel, Mixtec, Zapotec, Purépecha, Otomi, Totonac, Huastec, Inca-period Quechua, Aymara, Puquina, Mochica, Guaraní, Taíno, Muisca, Old Tupi/Tupinambá and historical Mapudungun. Reconstructed pre-contact stages are labeled explicitly to avoid false certainty.


## Regional languages and dialects (v1.9.2)

LingoLens now includes a dedicated **Regional languages & dialects** catalog with 151 regional varieties from Europe, the Americas, Africa, the Middle East, Asia and Oceania. Examples include Kashubian, Silesian, Scots, Yorkshire/Geordie/Cockney English, Southern American English, AAVE, Australian and Indian English, Bavarian, Swiss German, Sicilian, Neapolitan, Valencian, Québécois French, Rioplatense Spanish, Brazilian regional Portuguese, Egyptian/Levantine/Gulf/Maghrebi Arabic, Cantonese, Hokkien, Kansai Japanese, Gyeongsang Korean and many others.

These catalog entries are **Gemini-only** because provider APIs such as Google Translate and DeepL generally do not expose reliable target controls for fine-grained dialect output. The Gemini prompt explicitly asks for a consistent, natural regional variety while avoiding caricature, stereotypes and artificial phonetic respelling. Some poorly standardized local varieties are marked experimental.

The category intentionally includes both items conventionally called dialects and items that linguists or communities may regard as separate regional/minority languages. LingoLens uses the category operationally rather than making a claim about language-vs-dialect status.

- v1.9.3: added 77 Gemini-only computer/machine languages and representations, including architecture-specific assembly/machine code, IRs, programming languages, SQL/shell/markup formats and binary/hex/Base64/Unicode representations. Added semantic code-conversion prompting and monospaced output.

- v1.9.4: added 38 Gemini-only writing, encoding, transcription and signaling systems, including Morse variants, Wabun, semaphore, NATO spelling alphabet, Braille, IPA/X-SAMPA/ARPABET, telegraph/manual codes and transport/character encodings. Added exact representation-conversion prompting.
- v1.9.5: added 9 Gemini-only mathematical/formal targets, led by an adaptive mathematical-language mode plus logic, set theory, algebra, calculus, probability/statistics, linear/tensor notation, discrete mathematics/graphs and optimization. Added conservative no-fake-precision formalization prompting and mathematical source decoding.

- v1.9.7: replaced the fixed two-model Gemini selector with a self-updating Models API catalog, automatic recommended/lightweight model choice, cached offline resilience and manual catalog refresh.


## Local usage counters (v1.9.8)

LingoLens keeps local, resettable usage counters in Firefox extension storage. Gemini counts actual generation requests and API-reported input/output/thinking/total tokens. DeepL counts actual translation requests and Unicode input characters sent. Google Translate counts internal translation requests. Retries and provider fallbacks are counted as real requests; Gemini model-catalog refreshes are excluded. These counters are local telemetry only and are never sent to another analytics service. Translation results are returned independently of counter writes, so a storage/counter failure cannot fail a translation.
