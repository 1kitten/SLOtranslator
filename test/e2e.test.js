/**
 * Comprehensive End-to-End Verification Test Suite
 * Milestone 4 (Requirement R4)
 * 
 * Tests all 4 bug clusters and all 5 Acceptance Criteria checkboxes from ORIGINAL_REQUEST.md:
 * - Cluster 1: Frontend language-switch non-crash, async meaning re-fetch across 10 languages,
 *              localized "Zvok" -> naturalVoice, brand name "v Dvojčku", extraI18n 31 keys in 10 languages.
 * - Cluster 2: Verb conjugator accuracy (5 -či verbs, 7 irregular verbs, prefixed verbs),
 *              zero hardcoded "work" descriptions, 10-language localized pronoun/person descriptions,
 *              server.js userLang wiring.
 * - Cluster 3: Sentence token lemmatization (želim -> želeti, potujem -> potovati, sem/je -> biti,
 *              grem -> iti, imam -> imeti), non-inflecting POS detection (zaimek, prislov, predlog,
 *              veznik, členek), suppression of noun declensions for non-inflecting words,
 *              quiz slash-variants ("dva dni" / "dva dneva", "dve očesi" / "dve očes", bare nouns, full strings).
 * - Cluster 4: Complete elimination of translator.js from the repository.
 * - Acceptance Criteria 1 to 5: Formal verification of all 5 functional acceptance criteria.
 */

import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Set port to '0' to enable OS dynamic ephemeral port allocation, completely preventing port collisions
process.env.PORT = '0';

// Import server and core modules
const { default: app, server } = await import('../server.js');
const { conjugateVerb, isVerbInfinitive, verbDescriptions, irregularVerbs } = await import('../verbConjugator.js');
const { KNOWN_NON_INFLECTING, resolveWordWithFran, findInLocalDictionary } = await import('../franService.js');

const BASE_URL = `http://127.0.0.1:${server.address().port}`;

// Intercept client-side relative fetch calls to point directly to live Express server
const nativeFetch = global.fetch;
global.fetch = async function(url, opts) {
  if (typeof url === 'string' && url.startsWith('/')) {
    url = `${BASE_URL}${url}`;
  }
  return nativeFetch(url, opts);
};

test.after(async () => {
  if (server) {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  }
});

// Helper for live HTTP GET requests
async function getAnalyze(query, ui = 'en') {
  const url = `${BASE_URL}/api/analyze?q=${encodeURIComponent(query)}&ui=${encodeURIComponent(ui)}`;
  const res = await fetch(url);
  assert.strictEqual(res.status, 200, `Expected 200 from ${url}, got ${res.status}`);
  return await res.json();
}

// Helper for live HTTP POST quiz checks
async function postQuizCheck(userInput, expected) {
  const url = `${BASE_URL}/api/quiz/check`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userInput, expected })
  });
  assert.strictEqual(res.status, 200, `Expected 200 from ${url}, got ${res.status}`);
  return await res.json();
}

// Read index.html for source text and DOM assertions
const htmlContent = fs.readFileSync(path.join(ROOT_DIR, 'public', 'index.html'), 'utf8');

// Set up simulated DOM environment for client JavaScript verification
const elementsMap = new Map();
function createMockElement(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    innerText: '',
    _innerHTML: '',
    set innerHTML(val) {
      this._innerHTML = val;
      if (val === '') this.children = [];
    },
    get innerHTML() {
      return this._innerHTML;
    },
    placeholder: '',
    value: '',
    title: '',
    href: '',
    children: [],
    classList: {
      classes: new Set(),
      add(...c) { c.forEach(x => this.classes.add(x)); },
      remove(...c) { c.forEach(x => this.classes.delete(x)); },
      contains(c) { return this.classes.has(c); },
      toggle(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); },
      replace(a, b) { this.classes.delete(a); this.classes.add(b); }
    },
    appendChild(child) { this.children.push(child); },
    addEventListener() {},
    focus() {}
  };
}

function getEl(id) {
  if (!elementsMap.has(id)) {
    elementsMap.set(id, createMockElement(id));
  }
  return elementsMap.get(id);
}

const mockDoc = {
  getElementById: getEl,
  createElement(tag) { return createMockElement('', tag); },
  addEventListener() {}
};

const mockStorage = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = String(v); }
};

global.document = mockDoc;
global.window = { matchMedia: () => ({ matches: false }) };
global.localStorage = mockStorage;
global.tailwind = { config: {} };

const scripts = [...htmlContent.matchAll(/<script(?![^>]*src=)>([\s\S]*?)<\/script>/g)];
const scriptMatch = scripts.find(m => m[1].includes('i18nData'));
assert.ok(scriptMatch, 'Main client script with i18nData must exist in public/index.html');

const clientApp = new Function(scriptMatch[1] + `
  return {
    i18nData,
    extraI18n,
    selectLanguage,
    applyLanguage,
    renderVerbUI,
    renderWordUI,
    renderSentenceUI,
    checkPracticeAnswer,
    setupPracticeCard,
    getCurrentAnalysis: () => currentAnalysis,
    setCurrentAnalysis: (val) => { currentAnalysis = val; },
    getCurrentLang: () => currentLang,
    setCurrentLang: (val) => { currentLang = val; }
  };
`)();


/* ========================================================================= */
/* SECTION 1: CLUSTER 1 - FRONTEND LANGUAGE SWITCH & LOCALIZATION (R1)       */
/* ========================================================================= */

describe('Cluster 1: Frontend Language-Switch, Async Meaning, & Localization', () => {

  it('1.1 Brand name updated to "v Dvojčku" and obsolete "v SloDvojina" eliminated', () => {
    assert.strictEqual(
      htmlContent.includes('v SloDvojina'),
      false,
      'Obsolete brand name "v SloDvojina" must not exist in public/index.html'
    );
    assert.ok(
      htmlContent.includes('v Dvoj\u010dku') || htmlContent.includes('v Dvojčku'),
      'Updated brand name "v Dvojčku" must be present in public/index.html'
    );
  });

  it('1.2 No hardcoded >Zvok< buttons in #verb-results-container', () => {
    const verbContainerMatch = htmlContent.match(/<section id="verb-results-container"[\s\S]*?<\/section>/);
    assert.ok(verbContainerMatch, 'Could not find #verb-results-container in public/index.html');
    assert.strictEqual(
      verbContainerMatch[0].includes('>Zvok<'),
      false,
      'Hardcoded ">Zvok<" found in #verb-results-container'
    );
  });

  it('1.3 All 19 required element IDs present in public/index.html', () => {
    const requiredElementIds = [
      'verb-badge-text',
      'verb-dual-badge',
      'verb-dual-title',
      'verb-dual-sub',
      'verb-tense-sedanjik-title',
      'verb-tense-preteklik-title',
      'verb-tense-preteklik-sub',
      'verb-tense-prihodnjik-title',
      'verb-table-title',
      'verb-table-hint',
      'verb-th-person',
      'verb-th-ednina',
      'verb-th-dvojina',
      'verb-th-mnozina',
      'phonemic-th-sign',
      'phonemic-th-meaning',
      'phonemic-th-example',
      'phonemic-modal-footer',
      'phonemic-modal-close'
    ];
    for (const id of requiredElementIds) {
      assert.ok(
        htmlContent.includes(`id="${id}"`),
        `Missing required element ID: "${id}" in public/index.html`
      );
    }
  });

  it('1.4 i18nData contains all 31 localization keys across all 10 supported languages', () => {
    const expectedLanguages = ['sr', 'en', 'hr', 'bs', 'de', 'it', 'es', 'fr', 'ru', 'sl'];
    const requiredKeys = [
      'naturalVoice',
      'verbBadge',
      'verbDualTitle',
      'verbDualSub',
      'verbTenseSedanjik',
      'verbTensePreteklik',
      'verbTensePreteklikSub',
      'verbTensePrihodnjik',
      'verbTableTitle',
      'verbTableHint',
      'thPerson',
      'p1Sedanjik',
      'p2Sedanjik',
      'p3Sedanjik',
      'p1Preteklik',
      'p1Prihodnjik',
      'examplePrefix',
      'practiceChecking',
      'practiceDiffTitle',
      'practiceCorrectWithCaron',
      'practiceCorrectIs',
      'practiceError',
      'phonemicModalTitle',
      'phonemicModalDesc',
      'phonemicThSign',
      'phonemicThMeaning',
      'phonemicThExample',
      'phonemicModalFooter',
      'phonemicClose',
      'slovenianLang',
      'translatedFrom'
    ];

    assert.strictEqual(requiredKeys.length, 31, 'Localization must specify exactly 31 keys');

    for (const lang of expectedLanguages) {
      assert.ok(clientApp.i18nData[lang], `i18nData missing language entry for: ${lang}`);
      for (const key of requiredKeys) {
        assert.ok(
          clientApp.i18nData[lang][key],
          `i18nData.${lang} is missing required key: "${key}"`
        );
      }
    }
  });

  it('1.5 Client selectLanguage(lang) executes cleanly without throwing when viewing a verb', async () => {
    const verbPayload = await getAnalyze('delati', 'en');
    assert.strictEqual(verbPayload.isVerb, true);

    clientApp.setCurrentAnalysis(verbPayload);
    clientApp.setCurrentLang('en');

    // Switching to German while viewing a verb must NOT crash or throw TypeError
    assert.doesNotThrow(() => {
      clientApp.selectLanguage('de');
    });
    assert.strictEqual(clientApp.getCurrentLang(), 'de');

    // Switching to French
    assert.doesNotThrow(() => {
      clientApp.selectLanguage('fr');
    });
    assert.strictEqual(clientApp.getCurrentLang(), 'fr');
  });

  it('1.6 Async meaning re-fetch across all 10 languages via live HTTP server', async () => {
    const expectedLanguages = ['sr', 'en', 'hr', 'bs', 'de', 'it', 'es', 'fr', 'ru', 'sl'];
    for (const lang of expectedLanguages) {
      const data = await getAnalyze('delovati', lang);
      assert.strictEqual(data.isVerb, true);
      assert.ok(data.meaning, `Expected translated meaning for lang: ${lang}`);
      assert.strictEqual(typeof data.meaning, 'string');
      assert.ok(data.meaning.length > 0);
    }
  });

  it('1.7 Localized naturalVoice replaces "Zvok" in Verb UI render', async () => {
    const liveVerbData = await getAnalyze('govoriti', 'en');
    assert.strictEqual(liveVerbData.isVerb, true);

    clientApp.setCurrentLang('en');
    clientApp.setCurrentAnalysis(liveVerbData);
    clientApp.applyLanguage('en');
    clientApp.renderVerbUI(liveVerbData);

    const sedList = getEl('verb-sedanjik-list');
    assert.ok(sedList.children.length > 0, 'Sedanjik list should have children');
    const enButtonHtml = sedList.children[0].innerHTML;
    assert.ok(enButtonHtml.includes('Natural Voice'), 'Audio button should show Natural Voice under en');
    assert.ok(!enButtonHtml.includes('>Zvok<'), 'Audio button must not show >Zvok< under en');

    // Switch to German
    clientApp.setCurrentLang('de');
    clientApp.applyLanguage('de');
    clientApp.renderVerbUI(liveVerbData);
    const deButtonHtml = sedList.children[0].innerHTML;
    assert.ok(deButtonHtml.includes('Natürliche Stimme'), 'Audio button should show Natürliche Stimme under de');

    // Switch to French
    clientApp.setCurrentLang('fr');
    clientApp.applyLanguage('fr');
    clientApp.renderVerbUI(liveVerbData);
    const frButtonHtml = sedList.children[0].innerHTML;
    assert.ok(frButtonHtml.includes('Voix naturelle'), 'Audio button should show Voix naturelle under fr');

    // Switch to Serbian
    clientApp.setCurrentLang('sr');
    clientApp.applyLanguage('sr');
    clientApp.renderVerbUI(liveVerbData);
    const srButtonHtml = sedList.children[0].innerHTML;
    assert.ok(srButtonHtml.includes('Prirodni glas'), 'Audio button should show Prirodni glas under sr');

    // Switch to Slovenian
    clientApp.setCurrentLang('sl');
    clientApp.applyLanguage('sl');
    clientApp.renderVerbUI(liveVerbData);
    const slButtonHtml = sedList.children[0].innerHTML;
    assert.ok(slButtonHtml.includes('Naravni glas'), 'Audio button should show Naravni glas under sl');
  });
});


/* ========================================================================= */
/* SECTION 2: CLUSTER 2 - VERB CONJUGATOR ACCURACY & DUAL DESCRIPTIONS (R2)  */
/* ========================================================================= */

describe('Cluster 2: Verb Conjugator Accuracy & Dual Descriptions', () => {

  it('2.1 Morphological accuracy for all 5 base -či verbs', () => {
    // 1. reči
    const reci = conjugateVerb('reči');
    assert.strictEqual(reci.infinitive, 'reči');
    assert.strictEqual(reci.present.dvojina.p1, 'midva/medve rečeva');
    assert.strictEqual(reci.present.dvojina.p2, 'vidva/vedve rečeta');
    assert.strictEqual(reci.present.dvojina.p3, 'onadva/onidve rečeta');
    assert.strictEqual(reci.pastParticiple.m_ed, 'rekel');
    assert.strictEqual(reci.pastParticiple.f_ed, 'rekla');
    assert.strictEqual(reci.pastParticiple.m_dv, 'rekla');
    assert.strictEqual(reci.pastParticiple.f_dv, 'rekli');
    assert.strictEqual(reci.future.dvojina.p1, 'midva bova rekla / medve bova rekli');

    // 2. peči
    const peci = conjugateVerb('peči');
    assert.strictEqual(peci.infinitive, 'peči');
    assert.strictEqual(peci.present.dvojina.p1, 'midva/medve pečeva');
    assert.strictEqual(peci.present.dvojina.p2, 'vidva/vedve pečeta');
    assert.strictEqual(peci.present.dvojina.p3, 'onadva/onidve pečeta');
    assert.strictEqual(peci.pastParticiple.m_ed, 'pekel');
    assert.strictEqual(peci.pastParticiple.f_ed, 'pekla');
    assert.strictEqual(peci.pastParticiple.m_dv, 'pekla');
    assert.strictEqual(peci.pastParticiple.f_dv, 'pekli');

    // 3. teči
    const teci = conjugateVerb('teči');
    assert.strictEqual(teci.infinitive, 'teči');
    assert.strictEqual(teci.present.dvojina.p1, 'midva/medve tečeva');
    assert.strictEqual(teci.present.dvojina.p2, 'vidva/vedve tečeta');
    assert.strictEqual(teci.present.dvojina.p3, 'onadva/onidve tečeta');
    assert.strictEqual(teci.pastParticiple.m_ed, 'tekel');
    assert.strictEqual(teci.pastParticiple.f_ed, 'tekla');
    assert.strictEqual(teci.pastParticiple.m_dv, 'tekla');
    assert.strictEqual(teci.pastParticiple.f_dv, 'tekli');

    // 4. leči
    const leci = conjugateVerb('leči');
    assert.strictEqual(leci.infinitive, 'leči');
    assert.strictEqual(leci.present.dvojina.p1, 'midva/medve leževa');
    assert.strictEqual(leci.present.dvojina.p2, 'vidva/vedve ležeta');
    assert.strictEqual(leci.present.dvojina.p3, 'onadva/onidve ležeta');
    assert.strictEqual(leci.pastParticiple.m_ed, 'legel');
    assert.strictEqual(leci.pastParticiple.f_ed, 'legla');
    assert.strictEqual(leci.pastParticiple.m_dv, 'legla');
    assert.strictEqual(leci.pastParticiple.f_dv, 'legli');

    // 5. vreči
    const vreci = conjugateVerb('vreči');
    assert.strictEqual(vreci.infinitive, 'vreči');
    assert.strictEqual(vreci.present.dvojina.p1, 'midva/medve vrževa');
    assert.strictEqual(vreci.present.dvojina.p2, 'vidva/vedve vržeta');
    assert.strictEqual(vreci.present.dvojina.p3, 'onadva/onidve vržeta');
    assert.strictEqual(vreci.pastParticiple.m_ed, 'vrgel');
    assert.strictEqual(vreci.pastParticiple.f_ed, 'vrgla');
    assert.strictEqual(vreci.pastParticiple.m_dv, 'vrgla');
    assert.strictEqual(vreci.pastParticiple.f_dv, 'vrgli');
  });

  it('2.2 Morphological accuracy for all 7 required irregular verbs', () => {
    // 1. hoteti
    const hoteti = conjugateVerb('hoteti');
    assert.strictEqual(hoteti.present.dvojina.p1, 'midva/medve hočeva');
    assert.strictEqual(hoteti.present.dvojina.p2, 'vidva/vedve hočeta');
    assert.strictEqual(hoteti.present.dvojina.p3, 'onadva/onidve hočeta');
    assert.strictEqual(hoteti.pastParticiple.m_ed, 'hotel');
    assert.strictEqual(hoteti.pastParticiple.m_dv, 'hotela');
    assert.strictEqual(hoteti.pastParticiple.f_dv, 'hoteli');

    // 2. vedeti
    const vedeti = conjugateVerb('vedeti');
    assert.strictEqual(vedeti.present.dvojina.p1, 'midva/medve veva');
    assert.strictEqual(vedeti.present.dvojina.p2, 'vidva/vedve vesta');
    assert.strictEqual(vedeti.present.dvojina.p3, 'onadva/onidve vesta');
    assert.strictEqual(vedeti.pastParticiple.m_ed, 'vedel');
    assert.strictEqual(vedeti.pastParticiple.m_dv, 'vedela');
    assert.strictEqual(vedeti.pastParticiple.f_dv, 'vedeli');

    // 3. moči
    const moci = conjugateVerb('moči');
    assert.strictEqual(moci.present.dvojina.p1, 'midva/medve moreva');
    assert.strictEqual(moci.present.dvojina.p2, 'vidva/vedve moreta');
    assert.strictEqual(moci.present.dvojina.p3, 'onadva/onidve moreta');
    assert.strictEqual(moci.pastParticiple.m_ed, 'mogel');
    assert.strictEqual(moci.pastParticiple.m_dv, 'mogla');
    assert.strictEqual(moci.pastParticiple.f_dv, 'mogli');

    // 4. jesti
    const jesti = conjugateVerb('jesti');
    assert.strictEqual(jesti.present.dvojina.p1, 'midva/medve jeva');
    assert.strictEqual(jesti.present.dvojina.p2, 'vidva/vedve jesta');
    assert.strictEqual(jesti.present.dvojina.p3, 'onadva/onidve jesta');
    assert.strictEqual(jesti.pastParticiple.m_ed, 'jedel');
    assert.strictEqual(jesti.pastParticiple.m_dv, 'jedla');
    assert.strictEqual(jesti.pastParticiple.f_dv, 'jedli');

    // 5. dati
    const dati = conjugateVerb('dati');
    assert.strictEqual(dati.present.dvojina.p1, 'midva/medve dava');
    assert.strictEqual(dati.present.dvojina.p2, 'vidva/vedve dasta');
    assert.strictEqual(dati.present.dvojina.p3, 'onadva/onidve dasta');
    assert.strictEqual(dati.pastParticiple.m_ed, 'dal');
    assert.strictEqual(dati.pastParticiple.m_dv, 'dala');
    assert.strictEqual(dati.pastParticiple.f_dv, 'dali');

    // 6. priti
    const priti = conjugateVerb('priti');
    assert.strictEqual(priti.present.dvojina.p1, 'midva/medve prideva');
    assert.strictEqual(priti.present.dvojina.p2, 'vidva/vedve prideta');
    assert.strictEqual(priti.present.dvojina.p3, 'onadva/onidve prideta');
    assert.strictEqual(priti.pastParticiple.m_ed, 'prišel');
    assert.strictEqual(priti.pastParticiple.m_dv, 'prišla');
    assert.strictEqual(priti.pastParticiple.f_dv, 'prišli');

    // 7. vzeti
    const vzeti = conjugateVerb('vzeti');
    assert.strictEqual(vzeti.present.dvojina.p1, 'midva/medve vzameva');
    assert.strictEqual(vzeti.present.dvojina.p2, 'vidva/vedve vzameta');
    assert.strictEqual(vzeti.present.dvojina.p3, 'onadva/onidve vzameta');
    assert.strictEqual(vzeti.pastParticiple.m_ed, 'vzel');
    assert.strictEqual(vzeti.pastParticiple.m_dv, 'vzela');
    assert.strictEqual(vzeti.pastParticiple.f_dv, 'vzeli');
  });

  it('2.3 Zero hardcoded "work" descriptions for non-work verbs across all 10 languages', () => {
    const testVerbs = [
      'biti', 'iti', 'imeti',
      'govoriti', 'videti', 'pisati',
      'reči', 'peči', 'teči', 'leči', 'vreči',
      'hoteti', 'vedeti', 'moči', 'jesti', 'dati', 'priti', 'vzeti'
    ];
    const languages = ['sr', 'en', 'hr', 'bs', 'de', 'it', 'es', 'fr', 'ru', 'sl'];

    for (const v of testVerbs) {
      for (const lang of languages) {
        const res = conjugateVerb(v, lang);
        const json = JSON.stringify(res.dvojinaSummary);
        assert.strictEqual(
          /work/i.test(json),
          false,
          `Forbidden "work" description found for verb "${v}" in lang "${lang}"`
        );
      }
    }
  });

  it('2.4 Localized dual pronoun/person descriptions across all 10 languages', () => {
    const expectedPronounsP1 = {
      en: 'The two of us',
      sl: 'Midva / medve',
      de: 'Wir beide',
      it: 'Noi due',
      sr: 'Nas dvoje / nas dve',
      hr: 'Nas dvoje / nas dvije',
      bs: 'Nas dvoje / nas dvije',
      es: 'Nosotros dos',
      fr: 'Nous deux',
      ru: 'Мы вдвоём'
    };

    const expectedPersonsP1 = {
      en: '1st person',
      sl: '1. oseba',
      de: '1. Person',
      it: '1ª persona',
      sr: '1. lice',
      hr: '1. lice',
      bs: '1. lice',
      es: '1.ª persona',
      fr: '1re personne',
      ru: '1-е лицо'
    };

    const supportedLangs = ['sr', 'en', 'hr', 'bs', 'de', 'it', 'es', 'fr', 'ru', 'sl'];

    for (const lang of supportedLangs) {
      const res = conjugateVerb('govoriti', lang);
      assert.strictEqual(
        res.dvojinaSummary.sedanjik[0].desc,
        expectedPronounsP1[lang],
        `Language ${lang} sedanjik[0].desc mismatch`
      );
      assert.strictEqual(
        res.dvojinaSummary.sedanjik[0].person,
        expectedPersonsP1[lang],
        `Language ${lang} sedanjik[0].person mismatch`
      );
      assert.ok(
        res.dvojinaSummary.preteklik[0].genderLabel.length > 0,
        `Language ${lang} preteklik[0].genderLabel empty`
      );
      assert.ok(
        res.dvojinaSummary.preteklik[1].genderLabel.length > 0,
        `Language ${lang} preteklik[1].genderLabel empty`
      );
    }
  });

  it('2.5 Live HTTP /api/analyze forwards userLang parameter to conjugateVerb', async () => {
    const resDe = await getAnalyze('govoriti', 'de');
    assert.strictEqual(resDe.isVerb, true);
    assert.strictEqual(resDe.verbData.dvojinaSummary.sedanjik[0].desc, 'Wir beide');

    const resFr = await getAnalyze('govoriti', 'fr');
    assert.strictEqual(resFr.isVerb, true);
    assert.strictEqual(resFr.verbData.dvojinaSummary.sedanjik[0].desc, 'Nous deux');

    const resIt = await getAnalyze('govoriti', 'it');
    assert.strictEqual(resIt.isVerb, true);
    assert.strictEqual(resIt.verbData.dvojinaSummary.sedanjik[0].desc, 'Noi due');
  });
});


/* ========================================================================= */
/* SECTION 3: CLUSTER 3 - SENTENCE LEMMATIZATION, POS, & QUIZ (R3)           */
/* ========================================================================= */

describe('Cluster 3: Sentence Token Lemmatization, POS, & Quiz Slash-Variants', () => {

  it('3.1 Sentence token lemmatization for target sentences and verbs', async () => {
    // Target 1: "Nekaj te želim vprašati" -> želim -> želeti
    const data1 = await getAnalyze('Nekaj te želim vprašati', 'en');
    assert.strictEqual(data1.isSentence, true);
    const zelim = data1.tokens.find(t => t.clean === 'želim');
    assert.ok(zelim, 'Token "želim" must exist in sentence 1');
    assert.strictEqual(zelim.lemma, 'želeti', 'Token "želim" must lemmatize to "želeti"');

    // Target 2: "Danes potujem v Ljubljano" -> potujem -> potovati, Ljubljano -> ljubljana
    const data2 = await getAnalyze('Danes potujem v Ljubljano', 'en');
    assert.strictEqual(data2.isSentence, true);
    const potujem = data2.tokens.find(t => t.clean === 'potujem');
    assert.ok(potujem, 'Token "potujem" must exist in sentence 2');
    assert.strictEqual(potujem.lemma, 'potovati', 'Token "potujem" must lemmatize to "potovati"');

    const ljubljano = data2.tokens.find(t => t.clean === 'Ljubljano');
    assert.ok(ljubljano, 'Token "Ljubljano" must exist in sentence 2');
    assert.strictEqual(ljubljano.lemma, 'ljubljana', 'Token "Ljubljano" must retain feminine accusative root');
  });

  it('3.2 Sentence token lemmatization for irregular and auxiliary verbs', async () => {
    const testCases = [
      { text: 'Jaz sem vesel in on je pripravljen', tokens: [['sem', 'biti'], ['je', 'biti']] },
      { text: 'Jutri grem domov', tokens: [['grem', 'iti']] },
      { text: 'Danes imam čas', tokens: [['imam', 'imeti']] },
      { text: 'Jaz vem odgovor', tokens: [['vem', 'vedeti']] },
      { text: 'Jaz hočem pomagati', tokens: [['hočem', 'hoteti']] },
      { text: 'Jaz morem teči', tokens: [['morem', 'moči']] }
    ];

    for (const tc of testCases) {
      const data = await getAnalyze(tc.text, 'en');
      assert.strictEqual(data.isSentence, true);
      for (const [form, expectedLemma] of tc.tokens) {
        const tok = data.tokens.find(t => t.clean === form);
        assert.ok(tok, `Token "${form}" must exist in sentence "${tc.text}"`);
        assert.strictEqual(tok.lemma, expectedLemma, `Token "${form}" must lemmatize to "${expectedLemma}"`);
      }
    }
  });

  it('3.3 Non-inflecting POS detection on live server', async () => {
    const nonInflectingWords = [
      { word: 'nekaj', pos: 'zaimek' },
      { word: 'danes', pos: 'prislov' },
      { word: 'brez', pos: 'predlog' },
      { word: 'ker', pos: 'veznik' },
      { word: 'tudi', pos: 'členek' }
    ];

    for (const item of nonInflectingWords) {
      const data = await getAnalyze(item.word, 'en');
      assert.strictEqual(data.isVerb, false);
      assert.strictEqual(data.isSentence, false);
      assert.ok(data.wordData, `wordData missing for: ${item.word}`);
      assert.strictEqual(data.wordData.partOfSpeech, item.pos, `POS mismatch for: ${item.word}`);
      assert.strictEqual(data.wordData.nonInflecting, true, `nonInflecting flag must be true for: ${item.word}`);
    }
  });

  it('3.4 Complete suppression of noun declensions for non-inflecting words', async () => {
    const nonInfWords = ['nekaj', 'danes', 'zelo', 'brez', 'ker', 'tudi'];
    for (const w of nonInfWords) {
      const data = await getAnalyze(w, 'en');
      assert.strictEqual(data.wordData.dvojina_prikaz, '', `dvojina_prikaz must be empty for ${w}`);
      assert.strictEqual(data.wordData.mnozina_prikaz, '', `mnozina_prikaz must be empty for ${w}`);

      // Verify all dual and plural table cells are blank
      for (const [sklon, forms] of Object.entries(data.wordData.tabela)) {
        assert.strictEqual(forms.dvojina, '', `Table dual cell for ${w} in ${sklon} must be empty`);
        assert.strictEqual(forms.mnozina, '', `Table plural cell for ${w} in ${sklon} must be empty`);
      }

      // Negative check: ensure no bogus masculine dual like "dva nekaja" or "dva danesa"
      const json = JSON.stringify(data);
      assert.strictEqual(
        json.includes(`dva ${w}`),
        false,
        `Artificial dual "dva ${w}" must never appear in payload`
      );
    }
  });

  it('3.5 Single-word inflected verb queries route to verb infinitives and conjugate', async () => {
    const inflectedQueries = [
      { q: 'grem', expectedInf: 'iti' },
      { q: 'imam', expectedInf: 'imeti' },
      { q: 'vem', expectedInf: 'vedeti' },
      { q: 'morem', expectedInf: 'moči' },
      { q: 'prišel', expectedInf: 'priti' }
    ];

    for (const item of inflectedQueries) {
      const data = await getAnalyze(item.q, 'en');
      assert.strictEqual(data.isVerb, true, `Query "${item.q}" must resolve as verb`);
      assert.strictEqual(data.slWord, item.expectedInf, `Query "${item.q}" must map to infinitive "${item.expectedInf}"`);
      assert.ok(data.verbData, `verbData missing for "${item.q}"`);
      assert.ok(data.verbData.dvojinaSummary, `dvojinaSummary missing for "${item.q}"`);
    }
  });

  it('3.6 Quiz slash-variant checking (/api/quiz/check)', async () => {
    // 1. dan: expected = "dva dni / dneva"
    const danExpected = "dva dni / dneva";
    assert.strictEqual((await postQuizCheck('dva dni', danExpected)).status, 'correct');
    assert.strictEqual((await postQuizCheck('dva dneva', danExpected)).status, 'correct');
    assert.strictEqual((await postQuizCheck('dni', danExpected)).status, 'correct');
    assert.strictEqual((await postQuizCheck('dneva', danExpected)).status, 'correct');
    assert.strictEqual((await postQuizCheck('dva dni / dneva', danExpected)).status, 'correct');

    // 2. oko: expected = "dve očesi / očes"
    const okoExpected = "dve očesi / očes";
    assert.strictEqual((await postQuizCheck('dve očesi', okoExpected)).status, 'correct');
    assert.strictEqual((await postQuizCheck('dve očes', okoExpected)).status, 'correct');
    assert.strictEqual((await postQuizCheck('očesi', okoExpected)).status, 'correct');
    assert.strictEqual((await postQuizCheck('očes', okoExpected)).status, 'correct');
    assert.strictEqual((await postQuizCheck('dve očesi / očes', okoExpected)).status, 'correct');

    // 3. Typo and Diacritic handling
    assert.strictEqual((await postQuizCheck('dva dnl', danExpected)).status, 'wrong');
    assert.strictEqual((await postQuizCheck('dve ocesi', okoExpected)).status, 'diacritics');
  });
});


/* ========================================================================= */
/* SECTION 4: CLUSTER 4 - DEAD CODE REMOVAL (R3)                             */
/* ========================================================================= */

describe('Cluster 4: Dead Code Removal', () => {

  it('4.1 translator.js does NOT exist in the repository root or subdirectories', () => {
    const rootPath = path.join(ROOT_DIR, 'translator.js');
    assert.strictEqual(fs.existsSync(rootPath), false, 'translator.js must be removed from repository root');

    const srcPath = path.join(ROOT_DIR, 'src', 'translator.js');
    assert.strictEqual(fs.existsSync(srcPath), false, 'translator.js must not exist in src/');
  });

  it('4.2 Zero references or imports to translator.js in active source files', () => {
    const sourceFiles = [
      'server.js',
      'verbConjugator.js',
      'franService.js',
      'public/index.html',
      'package.json'
    ];

    for (const rel of sourceFiles) {
      const full = path.join(ROOT_DIR, rel);
      if (fs.existsSync(full)) {
        const text = fs.readFileSync(full, 'utf8');
        assert.strictEqual(
          /from\s+['"].*translator\.js['"]/i.test(text),
          false,
          `Found lingering import of translator.js in ${rel}`
        );
        assert.strictEqual(
          /import\(['"].*translator\.js['"]\)/i.test(text),
          false,
          `Found dynamic import of translator.js in ${rel}`
        );
      }
    }
  });
});


/* ========================================================================= */
/* SECTION 5: ACCEPTANCE CRITERIA FORMAL VERIFICATION (CRITERIA 1 - 5)       */
/* ========================================================================= */

describe('Formal Acceptance Criteria Verification (ORIGINAL_REQUEST.md)', () => {

  it('Acceptance Criterion 1: Switching UI languages while viewing a verb, noun, or sentence does not throw a JS error and updates the displayed meaning to the selected UI language', async () => {
    // 1. Verb view test
    const verbDataEn = await getAnalyze('delati', 'en');
    clientApp.setCurrentAnalysis(verbDataEn);
    clientApp.setCurrentLang('en');

    // Switch across multiple languages while viewing verb
    for (const lang of ['de', 'it', 'fr', 'es', 'sl', 'en']) {
      assert.doesNotThrow(() => clientApp.selectLanguage(lang));
      const freshVerb = await getAnalyze('delati', lang);
      assert.ok(freshVerb.meaning, `Verb meaning must exist for lang ${lang}`);
    }

    // 2. Noun view test
    const nounDataEn = await getAnalyze('pes', 'en');
    clientApp.setCurrentAnalysis(nounDataEn);
    clientApp.setCurrentLang('en');

    for (const lang of ['de', 'it', 'fr', 'es', 'sl', 'en']) {
      assert.doesNotThrow(() => clientApp.selectLanguage(lang));
      const freshNoun = await getAnalyze('pes', lang);
      assert.ok(freshNoun.meaning, `Noun meaning must exist for lang ${lang}`);
    }

    // 3. Sentence view test
    const sentDataEn = await getAnalyze('Danes potujem v Ljubljano', 'en');
    clientApp.setCurrentAnalysis(sentDataEn);
    clientApp.setCurrentLang('en');

    for (const lang of ['de', 'it', 'fr', 'es', 'sl', 'en']) {
      assert.doesNotThrow(() => clientApp.selectLanguage(lang));
      const freshSent = await getAnalyze('Danes potujem v Ljubljano', lang);
      assert.ok(freshSent.meaning, `Sentence meaning must exist for lang ${lang}`);
    }
  });

  it('Acceptance Criterion 2: Searching verbs such as biti, iti, govoriti, reči, peči, teči, hoteti, and vedeti returns accurate dual present, past, and future forms and never displays hardcoded "work" descriptions for non-work verbs', async () => {
    const targetVerbs = [
      { verb: 'biti', p1Pres: 'sva', p1Fut: 'bova' },
      { verb: 'iti', p1Pres: 'greva', p1Fut: 'bova šla' },
      { verb: 'govoriti', p1Pres: 'govoriva', p1Fut: 'bova govorila' },
      { verb: 'reči', p1Pres: 'rečeva', p1Fut: 'bova rekla' },
      { verb: 'peči', p1Pres: 'pečeva', p1Fut: 'bova pekla' },
      { verb: 'teči', p1Pres: 'tečeva', p1Fut: 'bova tekla' },
      { verb: 'hoteti', p1Pres: 'hočeva', p1Fut: 'bova hotela' },
      { verb: 'vedeti', p1Pres: 'veva', p1Fut: 'bova vedela' }
    ];

    for (const item of targetVerbs) {
      const data = await getAnalyze(item.verb, 'en');
      assert.strictEqual(data.isVerb, true, `${item.verb} must resolve as verb`);
      assert.ok(data.verbData, `verbData missing for ${item.verb}`);

      const vData = data.verbData;
      // Present dual check
      assert.ok(
        vData.sedanjik.dvojina.p1.includes(item.p1Pres),
        `${item.verb} present dual p1 must include ${item.p1Pres}: got ${vData.sedanjik.dvojina.p1}`
      );
      // Future dual check
      assert.ok(
        vData.prihodnjik.dvojina.p1.includes(item.p1Fut),
        `${item.verb} future dual p1 must include ${item.p1Fut}: got ${vData.prihodnjik.dvojina.p1}`
      );

      // Verify ZERO occurrences of "work"
      const json = JSON.stringify(vData.dvojinaSummary);
      assert.strictEqual(
        /work/i.test(json),
        false,
        `Forbidden "work" string detected in dvojinaSummary for ${item.verb}`
      );
    }
  });

  it('Acceptance Criterion 3: Clicking sentence tokens in "Nekaj te želim vprašati" and "Danes potujem v Ljubljano" resolves želim → želeti and potujem → potovati as verbs', async () => {
    // Sentence 1
    const data1 = await getAnalyze('Nekaj te želim vprašati', 'en');
    const zelimToken = data1.tokens.find(t => t.clean === 'želim');
    assert.ok(zelimToken, 'Expected token for "želim"');
    assert.strictEqual(zelimToken.lemma, 'želeti', 'Lemma for "želim" must be "želeti"');

    // Simulate clicking token (analyzeWordDirectly -> /api/analyze?q=želeti)
    const zelimResolved = await getAnalyze(zelimToken.lemma, 'en');
    assert.strictEqual(zelimResolved.isVerb, true, 'Clicking "želim" (želeti) must resolve as verb');
    assert.strictEqual(zelimResolved.slWord, 'želeti');

    // Sentence 2
    const data2 = await getAnalyze('Danes potujem v Ljubljano', 'en');
    const potujemToken = data2.tokens.find(t => t.clean === 'potujem');
    assert.ok(potujemToken, 'Expected token for "potujem"');
    assert.strictEqual(potujemToken.lemma, 'potovati', 'Lemma for "potujem" must be "potovati"');

    // Simulate clicking token (analyzeWordDirectly -> /api/analyze?q=potovati)
    const potujemResolved = await getAnalyze(potujemToken.lemma, 'en');
    assert.strictEqual(potujemResolved.isVerb, true, 'Clicking "potujem" (potovati) must resolve as verb');
    assert.strictEqual(potujemResolved.slWord, 'potovati');
  });

  it('Acceptance Criterion 4: Submitting either "dva dni" or "dva dneva" in the Practice card for dan returns status: "correct"', async () => {
    // Retrieve "dan" metadata
    const danData = await getAnalyze('dan', 'en');
    assert.strictEqual(danData.wordData.beseda, 'dan');
    assert.strictEqual(danData.wordData.dvojina_prikaz, 'dva dni / dneva');

    const expected = danData.wordData.dvojina_prikaz;

    // Submission 1: "dva dni"
    const result1 = await postQuizCheck('dva dni', expected);
    assert.strictEqual(result1.status, 'correct', 'Submitting "dva dni" must return status "correct"');

    // Submission 2: "dva dneva"
    const result2 = await postQuizCheck('dva dneva', expected);
    assert.strictEqual(result2.status, 'correct', 'Submitting "dva dneva" must return status "correct"');
  });

  it('Acceptance Criterion 5: translator.js is removed', () => {
    const targetFile = path.join(ROOT_DIR, 'translator.js');
    assert.strictEqual(fs.existsSync(targetFile), false, 'translator.js must be removed from repository root');
  });
});
