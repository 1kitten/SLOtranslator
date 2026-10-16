# QA Sweep & Vulnerability Report

**Application:** SloDvojina (Slovenian Language & Dual-Grammar Explorer)  
**Date:** 2026-10-16  
**Environment:** Node.js Express Backend (`http://localhost:3000`) & Tailwind HTML Frontend

---

## 1. Automated Route Verification Summary

| # | Route / Feature Tested | Target / Payload | Status |
|---|---|---|---|
| 1 | `GET /` | Root Landing Page & DOM elements | **PASS** |
| 2 | `GET /shared/textUtils.js` | Shared client/server utility module | **PASS** |
| 3 | `GET /shared/phonemic.js` | Phonemic transcription module | **PASS** |
| 4 | `GET /api/analyze?q=pes&ui=sr` | Known irregular noun analysis & dvojina | **PASS** |
| 5 | `GET /api/analyze?q=delovati&ui=en` | Verb conjugation (Sedanjik, Preteklik, Prihodnjik) | **PASS** |
| 6 | `GET /api/analyze?q=Ja potujem v Ljubljano` | Sentence breakdown, translation & token chips | **PASS** |
| 7 | `GET /api/analyze?q=hisa&ui=sr` | Diacritic soft auto-correction (`hisa` -> `hiša`) | **PASS** |
| 8 | `GET /api/analyze?q=hsia&ui=sr` | Typo tolerance fuzzy suggestions (`hsia` -> `hiša`) | **PASS** |
| 9 | `GET /api/analyze?q=` | Empty query validation (400 Bad Request) | **PASS** |
| 10 | `POST /api/quiz/check` | Exact answer validation | **PASS** |
| 11 | `POST /api/quiz/check` | Diacritic soft accept + granular diff | **PASS** |
| 12 | `POST /api/quiz/check` | Empty body validation (400 Bad Request) | **PASS** |
| 13 | `GET /api/tts?text=pes` | Neural TTS audio proxy | **PASS** |
| 14 | `GET /api/audio?word=pes` | Audio metadata endpoint | **PASS** |
| 15 | `GET /api/audio` | Missing parameter check (400 Bad Request) | **PASS** |
| 16 | `GET /api/analyze?q=<script>` | XSS injection sanitization test | **PASS** |

---

## 2. Discovered Issues & Edge Cases

### Issue 1 (CRITICAL / HIGH): Uncaught TypeError in `analyzeWordDirectly` on Unindexed / Missing Token
- **Severity:** High
- **Route / Component:** `/api/analyze` -> Client `analyzeWordDirectly(word)` in `public/index.html`
- **Repro Steps:**
  1. Analyze any sentence (e.g., `"Danes je sončen dan"`).
  2. Click on a token whose word/lemma is unindexed in the vocabulary (or yields `notFound: true`).
  3. Notice `analyzeWordDirectly` unconditionally calls `renderWordUI(data)`.
  4. `renderWordUI` tries to read `wordData.beseda` where `wordData` is undefined, throwing an uncaught TypeError.
- **Error Snippet:**
  ```javascript
  // public/index.html:1897
  TypeError: Cannot read properties of undefined (reading 'beseda')
      at renderWordUI (public/index.html:1897:54)
      at analyzeWordDirectly (public/index.html:1697:11)
  ```
- **Suspected File:** `public/index.html`

### Issue 2 (MEDIUM): `currentAnalysis` Not Updated on Direct Token Inspection, Breaking Card Audio
- **Severity:** Medium
- **Route / Component:** `analyzeWordDirectly` & `playAudioTrack` in `public/index.html`
- **Repro Steps:**
  1. Translate a full sentence. Sentence audio controls are mounted.
  2. Click a valid noun token (e.g. `pes`).
  3. The noun table renders below the sentence, but `currentAnalysis` is never updated with the new noun payload.
  4. Clicking the audio speaker on any declension card fails to play because `playAudioTrack` looks up tracks in the stale sentence analysis.
- **Error Snippet:**
  ```javascript
  // public/index.html:2034
  function playAudioTrack(trackKey, btnElement) {
    if (!currentAnalysis || !currentAnalysis.audio || !currentAnalysis.audio[trackKey]) return;
    // Early return because currentAnalysis.audio only has { normal, slow } from sentence
  ```
- **Suspected File:** `public/index.html`

### Issue 3 (MEDIUM): Stale or Missing Diacritic / Typo Banners in `analyzeWordDirectly`
- **Severity:** Medium
- **Route / Component:** `analyzeWordDirectly` in `public/index.html`
- **Repro Steps:**
  1. Type an unaccented or misspelled word into the main search box (e.g. `ucenik`), revealing the diacritic banner.
  2. Click a sentence token.
  3. `analyzeWordDirectly` does not hide `correction-banner` or `did-you-mean-banner`, nor does it render them if the token needed diacritic correction.
- **Error Snippet:**
  ```javascript
  // public/index.html:1690
  document.getElementById('verb-results-container').classList.add('hidden');
  document.getElementById('results-container').classList.add('hidden');
  // Missing reset and synchronization of correction-banner & did-you-mean-banner
  ```
- **Suspected File:** `public/index.html`

### Issue 4 (LOW): Dynamic Translation Labels Desync on Interface Language Toggle
- **Severity:** Low
- **Route / Component:** `switchLanguage` in `public/index.html`
- **Repro Steps:**
  1. Perform a query with language set to `sr`.
  2. Toggle interface language to `en`.
  3. Fixed template strings switch to English, but dynamic content labels inside active cards (`spol`, `pomen`, `vaja`) remain in Serbian until a new query is submitted.
- **Error Snippet:**
  ```javascript
  // switchLanguage updates static elements by ID but does not trigger
  // re-rendering of active currentAnalysis cards
  ```
- **Suspected File:** `public/index.html`

---

## 3. Root-Cause Clusters for Debug Agent Handoff

- **Cluster A (Token Inspection & State Synchronization):**
  - Encompasses Issues 1, 2, and 3.
  - Root Cause: `analyzeWordDirectly` in `public/index.html` was implemented as a simplified fetch that bypassed `processInput`'s error handling, `currentAnalysis` assignment, notFound suggestions, and banner resetting.


---

## 4. Resolution & Evidence Log Citations

### Cluster A Resolution Status: RESOLVED & VERIFIED

#### Hypotheses Proven by Evidence:
1. **Hypothesis A1 (CONFIRMED):** Unindexed or irregular words returned `{ notFound: true, wordData: undefined }`, causing `renderWordUI` to throw `TypeError: Cannot read properties of undefined (reading 'beseda')`.
   - *Pre-fix Runtime Log Evidence:*  
     `{"runId":"run1","hypothesisId":"A1","location":"repro.js:50","message":"Hypothesis A1 confirmed: TypeError accessing wordData.beseda","data":{"error":"Cannot read properties of undefined (reading 'beseda')"}}`
2. **Hypothesis A2 (CONFIRMED):** In `analyzeWordDirectly`, `currentAnalysis` was never updated to the newly inspected word, causing `playAudioTrack` on noun cards to fail with an early return against stale sentence audio metadata.
   - *Pre-fix Runtime Log Evidence:*  
     `{"runId":"run1","hypothesisId":"A2","location":"repro.js:65","message":"Hypothesis A2: playAudioTrack checked against stale currentAnalysis","data":{"currentAnalysisType":"sentence","dvojinaAudioTrackExists":false}}`
3. **Hypothesis A3 (CONFIRMED):** Stale banners from previous searches remained open and new suggestions/corrections were omitted in `analyzeWordDirectly`.

#### Implemented Fix:
- Updated `analyzeWordDirectly` to reset banners, catch `notFound` with actionable suggestions or status feedback without calling `renderWordUI`, sync diacritic soft-corrections, and assign `currentAnalysis = data`.
- Updated `switchLanguage` to re-render the active `currentAnalysis` dynamically when the language changes.

#### Post-Fix Verification Evidence:
- *Post-fix Runtime Log Evidence (Run ID `post-fix`):*  
  `{"runId":"post-fix","hypothesisId":"A1","location":"verify.js:46","message":"Post-fix verification: unindexed word handled without TypeError","data":{"word":"lep","notFound":true,"hasSuggestions":true,"typeErrorOccurred":false}}`  
  `{"runId":"post-fix","hypothesisId":"A2","location":"verify.js:68","message":"Post-fix verification: currentAnalysis updated and audio track available","data":{"word":"pes","currentAnalysisType":"word","dvojinaAudioAvailable":true,"audioUrl":"/api/tts?text=dva%20psa"}}`

#### Clean-up Verification:
- All `#region debug log` / `#endregion` blocks verified removed (0 matches).
- Git diff verified clean.
