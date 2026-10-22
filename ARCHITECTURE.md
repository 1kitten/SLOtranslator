# Dvojček — System Architecture & Sequence Diagrams

> [!NOTE]
> **Zero Runtime AI Token Cost:** All translation resolution, dictionary lookups, Slovenian noun declensions (6 cases across *Ednina*, *Dvojina*, *Množina*), verb conjugations, phonemic IPA transcriptions, and audio synthesis run via deterministic Node.js modules and HTTP APIs — consuming **0 LLM/AI tokens** at runtime.

---

## 1. End-to-End Word Lookup & Self-Growing Dictionary Flow

This sequence diagram illustrates what happens when a user searches for a single word (e.g., `"pas"`, `"hisa"`, `"delovati"`), showing how the local database ([`data/dictionary.json`](file:///E:/antigravity/Translator%20app/data/dictionary.json)) is checked first before falling back to live scraping of **Franja.si** and **Fran.si (SSKJ)**.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant UI as Frontend UI<br/>(public/index.html)
    participant API as Express Server<br/>(server.js)
    participant Text as Text Utils<br/>(shared/textUtils.js)
    participant FranSvc as Fran Service<br/>(franService.js)
    participant LocalDB as Local Database<br/>(data/dictionary.json)
    participant External as External Portals<br/>(Franja.si / Fran.si / GTX)

    User->>UI: Enters word (e.g. "hisa" or "pas") & clicks Analyze
    UI->>API: GET /api/analyze?q=hisa&ui=sr

    rect rgba(240, 249, 255, 0.5)
        Note over API,Text: Step 1: Diacritic Normalization & Typo Check
        API->>Text: stripDiacritics(query) & match against vocabulary
        alt Missing carons (e.g. "hisa" -> "hiša")
            Text-->>API: Soft auto-correction { from: "hisa", to: "hiša" }
        else Close typo (e.g. "hsia")
            Text-->>API: fuzzySuggest() -> Top 3 candidate words
        end
    end

    rect rgba(236, 253, 245, 0.5)
        Note over API,External: Step 2: Word Resolution (Local DB First -> Live Scrape Fallback)
        API->>FranSvc: resolveWordWithFran(lookupWord, userLang)
        FranSvc->>LocalDB: findInLocalDictionary(word, userLang)
        
        alt Word found in Local Database (Fast Path — 0ms network)
            LocalDB-->>FranSvc: Return cached entry (slWord, accent, spol, translations)
            FranSvc-->>API: Return verified entry (fromDb: true)
        else Word NOT in Local Database (Live Scrape Path)
            opt Foreign input language (userLang != "sl")
                FranSvc->>External: GET franja.si/iskanje?sl=sh&tl=sl&q=word
                External-->>FranSvc: HTML entry (strict headword match check)
            end
            FranSvc->>External: GET fran.si/iskanje?View=1&Query=slCandidate
            External-->>FranSvc: SSKJ HTML (extracts accent, gender, POS)
            FranSvc->>LocalDB: persistNewEntry() -> Saves word to dictionary.json
            FranSvc-->>API: Return verified entry (liveFetched: true)
        end

        opt Meaning missing for selected UI language
            API->>External: translateWithFallback(slWord, "sl", userLang)
            External-->>API: Translated meaning (enforced Latin script for SR)
        end
    end

    API-->>UI: JSON Payload (Grammar + Phonetics + Audio URLs)
    UI-->>User: Renders Cards, Table & Pronunciation Controls
```

---

## 2. The 3 Generator Branches: Grammar, Pronunciation & Audio Pipeline

Once [`server.js`](file:///E:/antigravity/Translator%20app/server.js) resolves the Slovenian base lemma (`slWord`), it branches into the **three outputs** from your architectural sketch:
1. **Branch A — Grammar Generation:** Noun Declensions (6 cases / *Skloni*) or Verb Conjugations (3 tenses)
2. **Branch B — Ednina / Dvojina / Množina Summary Cards**
3. **Branch C — Pronunciation Guide (Syllables + IPA) & Natural Voice Audio (PONS + Neural TTS)**

```mermaid
sequenceDiagram
    autonumber
    participant API as Express Server<br/>(server.js)
    participant Verb as Verb Engine<br/>(verbConjugator.js)
    participant Noun as Noun Declension Engine<br/>(server.js)
    participant Phon as Phonemic Engine<br/>(shared/phonemic.js)
    participant PONS as PONS.com Scraper<br/>(getPonsAudioUrl)
    participant TTS as Edge Neural TTS<br/>(sl-SI-PetraNeural)

    Note over API: Input: Verified Slovenian Lemma (slWord) & POS

    alt Word is a Verb (partOfSpeech == "glagol" or -ti / -či)
        API->>Verb: conjugateVerb(slWord, userLang)
        Verb-->>API: Present (Sedanjik), Past (Preteklik), Future (Prihodnjik)<br/>+ Localized Dvojina Summary
        API->>Phon: transcribe(headAccent) & transcribe(dvojinaForms)
        Phon-->>API: Syllabic respelling (/de-lo-vá-ti/) + IPA ([dɛlɔˈʋaːti])
    else Word is a Noun (Samostalnik)
        API->>Noun: Check irregularDictionary[slWord] or generateRegularDeclension(slWord)
        Noun-->>API: 3 Display Cards (Ednina, Dvojina, Množina)<br/>+ 6 Cases Table (Imenovalnik -> Orodnik)
        
        par Branch A: Phonemic Transcription
            API->>Phon: transcribe(headAccent, ednina, dvojina, mnozina)
            Phon-->>API: Respelling + IPA for Headword & all 3 Cards
        and Branch B: Audio Resolution (PONS Human Recording -> Neural Fallback)
            API->>PONS: resolveAudio([ednina, dvojina, mnozina])
            alt Exact native recording exists on PONS.com
                PONS-->>API: { source: "pons", audioUrl: "https://api-ng.pons.com/..." } (Green Dot)
            else No PONS recording for phrase
                PONS-->>API: Fallback to { source: "neural", audioUrl: "/api/tts?text=..." }
            end
        end
    else Non-Inflecting Word (Zaimek, Prislov, Predlog, Veznik, Členek)
        API->>Noun: Return base word with nonInflecting: true (suppresses fake noun cases)
    end

    Note over API,TTS: On-Demand Audio Playback (When User Clicks "Natural voice")
    API->>TTS: GET /api/tts?text=... (if source == "neural" or table cell clicked)
    TTS-->>API: Synthesize MP3 audio buffer (cached in memory ttsCache)
```

---

## 3. Sentence Translation & Interactive Token Inspection Flow

When a user enters a multi-word sentence (e.g., `"Nekaj te želim vprašati"` or `"Danes potujem v Ljubljano"`), the system translates the full sentence, generates normal (`1.0x`) and slow (`0.75x`) neural audio, and breaks the Slovenian sentence into clickable lemmatized word pills.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant UI as Frontend UI<br/>(public/index.html)
    participant API as Express Server<br/>(server.js)
    participant Trans as Translation Service<br/>(Google GTX / MyMemory)
    participant Lemma as Lemmatizer<br/>(resolveBaseLemma)
    participant Phon as Phonemic Engine<br/>(shared/phonemic.js)

    User->>UI: Enters full sentence ("Danes potujem v Ljubljano")
    UI->>API: GET /api/analyze?q=Danes+potujem+v+Ljubljano&ui=sr

    API->>Trans: translateWithFallback(query, "auto", "sl")
    Trans-->>API: Detected language + Slovenian sentence (slText)

    API->>Trans: translateWithFallback(slText, "sl", userLang)
    Trans-->>API: Meaning in User's UI Language

    loop For each word token in slText
        API->>Lemma: resolveBaseLemma(cleanToken)
        Note right of Lemma: Maps conjugated forms to lemmas:<br/>"potujem" -> "potovati"<br/>"želim" -> "želeti"<br/>"sem/je" -> "biti"<br/>"Ljubljano" -> "ljubljana"
        Lemma-->>API: Base lemma
        API->>Phon: transcribe(cleanToken)
        Phon-->>API: Token phonemic guide
    end

    API->>Phon: transcribe(slText)
    Phon-->>API: Full-sentence respelling & IPA

    API-->>UI: Return { isSentence: true, slText, meaning, tokens, audio: { normal, slow } }
    UI-->>User: Renders Sentence Card + Clickable Word Tokens

    opt User Clicks a Word Token Pill (e.g. "potujem")
        User->>UI: Clicks token pill "potujem" (lemma: "potovati")
        UI->>API: analyzeWordDirectly("potovati") -> GET /api/analyze?q=potovati&ui=sr
        API-->>UI: Returns Verb Conjugation or Noun Declension payload
        UI-->>User: Smooth-scrolls & renders full grammar table below sentence
    end
```

---

## 4. Interactive Dual Practice (Quiz) & Soft Diacritic Diff Flow

At the bottom of every noun result, the **Dvojček Practice Card** tests the user's knowledge of the dual (*dvojina*) form, accepting slash-separated alternatives and distinguishing real spelling errors from missing carons (`č, š, ž`).

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant UI as Practice Card UI<br/>(public/index.html)
    participant API as Quiz Endpoint<br/>(POST /api/quiz/check)
    participant Diff as Diacritic Differ<br/>(shared/textUtils.js)

    User->>UI: Types dual answer (e.g. "dve hisi" or "dva dneva") & clicks Check
    UI->>API: POST /api/quiz/check { userInput, expected }

    rect rgba(254, 243, 199, 0.4)
        Note over API,Diff: Slash-Variant Expansion & Diacritic Comparison
        API->>API: Expand slash variants (e.g. "dva dni / dneva" -> ["dva dni", "dva dneva", "dni", "dneva"])
        loop For each valid expected variant
            API->>Diff: diffDiacritics(userInput, variant)
            alt Exact match (e.g. "dve hiši")
                Diff-->>API: { status: "correct", chars: [...] }
            else Only carons/diacritics differ (e.g. "dve hisi" vs "dve hiši")
                Diff-->>API: { status: "diacritics", chars: [character-by-character diff] }
            else Different letters
                Diff-->>API: { status: "wrong", chars: [] }
            end
        end
    end

    API-->>UI: Best match result ({ status, chars, matchedVariant })
    
    alt status == "correct"
        UI-->>User: Green Dvojček badge + Audio playback button
    else status == "diacritics"
        UI-->>User: Amber "Almost correct — watch the diacritics (č, š, ž)!" + Character diff
    else status == "wrong"
        UI-->>User: Neutral retry prompt + Reveals correct dual form & audio
    end
```

---

## 5. Module Responsibility Overview

| File | Role in Architecture | Runtime AI Tokens |
| :--- | :--- | :---: |
| [`public/index.html`](file:///E:/antigravity/Translator%20app/public/index.html) | Single-page UI, 10-language `i18nData` dictionary, audio player, and interactive Practice card. | **0** |
| [`server.js`](file:///E:/antigravity/Translator%20app/server.js) | Express API (`/api/analyze`, `/api/tts`, `/api/audio`, `/api/quiz/check`), noun declension generator, lemmatizer (`resolveBaseLemma`), PONS audio scraper, and Edge Neural TTS cache. | **0** |
| [`franService.js`](file:///E:/antigravity/Translator%20app/franService.js) | Manages [`data/dictionary.json`](file:///E:/antigravity/Translator%20app/data/dictionary.json) in-memory indexes (`slIndex`, `foreignIndex`), live scraping of **Franja.si** and **Fran.si (SSKJ)**, POS detection, and auto-caching (`persistNewEntry`). | **0** |
| [`verbConjugator.js`](file:///E:/antigravity/Translator%20app/verbConjugator.js) | Rule-based and irregular Slovenian verb conjugator across *Sedanjik*, *Preteklik*, and *Prihodnjik* with special focus on *Dvojina* forms. | **0** |
| [`shared/phonemic.js`](file:///E:/antigravity/Translator%20app/shared/phonemic.js) | Rule-based Slovenian syllabification, stress-mark parser, regressive voicing assimilation, and IPA transcription generator. | **0** |
| [`shared/textUtils.js`](file:///E:/antigravity/Translator%20app/shared/textUtils.js) | Diacritic stripping (`č, š, ž, ć, đ`), Damerau-Levenshtein fuzzy typo suggestions, and character-level diacritic diffing for the Practice quiz. | **0** |
| [`data/dictionary.json`](file:///E:/antigravity/Translator%20app/data/dictionary.json) | Local JSON dictionary database storing verified Slovenian headwords, SSKJ accents, genders, POS tags, and multi-language translations. | **0** |
