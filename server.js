import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { resolveWordWithFran, findInLocalDictionary, getDictionaryEntries } from './franService.js';
import { isVerbInfinitive, conjugateVerb } from './verbConjugator.js';
import { stripDiacritics, fuzzySuggest, diffDiacritics } from './shared/textUtils.js';
import { transcribe } from './shared/phonemic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Shared text utilities are also usable in the browser (e.g. a future quiz mode)
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// Cache to prevent re-scraping PONS repeatedly
const audioCache = new Map();

// Tricky irregular Slovenian nouns dictionary
const irregularDictionary = {
  "pes": {
    beseda: "pes", spol: "Moški spol", kratek_opis: "Pri sklanjanju besede 'pes' izpade neobstojni 'e' (pes -> psa).",
    ednina_prikaz: "en pes", dvojina_prikaz: "dva psa", mnozina_prikaz: "trije psi",
    tabela: {
      imenovalnik: { ednina: "pes", dvojina: "psa", mnozina: "psi" },
      rodilnik: { ednina: "psa", dvojina: "psov", mnozina: "psov" },
      dajalnik: { ednina: "psu", dvojina: "psoma", mnozina: "psom" },
      tozilnik: { ednina: "psa", dvojina: "psa", mnozina: "pse" },
      mestnik: { ednina: "pri psu", dvojina: "pri psih", mnozina: "pri psih" },
      orodnik: { ednina: "s psom", dvojina: "s psoma", mnozina: "s psi" }
    }
  },
  "otrok": {
    beseda: "otrok", spol: "Moški spol", kratek_opis: "Beseda 'otrok' ima v množini in mestniku posebnost: k se spremeni v c (otrok -> otroci).",
    ednina_prikaz: "en otrok", dvojina_prikaz: "dva otroka", mnozina_prikaz: "trije otroci",
    tabela: {
      imenovalnik: { ednina: "otrok", dvojina: "otroka", mnozina: "otroci" },
      rodilnik: { ednina: "otroka", dvojina: "otrok", mnozina: "otrok" },
      dajalnik: { ednina: "otroku", dvojina: "otrokoma", mnozina: "otrokom" },
      tozilnik: { ednina: "otroka", dvojina: "otroka", mnozina: "otroke" },
      mestnik: { ednina: "pri otroku", dvojina: "pri otrocih", mnozina: "pri otrocih" },
      orodnik: { ednina: "z otrokom", dvojina: "z otrokoma", mnozina: "z otroki" }
    }
  },
  "človek": {
    beseda: "človek", spol: "Moški spol", kratek_opis: "Izjemno nepravilna sklanjatev. V dvojini in množini osnova postane 'ljud-'.",
    ednina_prikaz: "en človek", dvojina_prikaz: "dva človeka", mnozina_prikaz: "trije ljudje",
    tabela: {
      imenovalnik: { ednina: "človek", dvojina: "človeka", mnozina: "ljudje" },
      rodilnik: { ednina: "človeka", dvojina: "ljudi", mnozina: "ljudi" },
      dajalnik: { ednina: "človeku", dvojina: "človekoma", mnozina: "ljudem" },
      tozilnik: { ednina: "človeka", dvojina: "človeka", mnozina: "ljudi" },
      mestnik: { ednina: "pri človeku", dvojina: "pri ljudeh", mnozina: "pri ljudeh" },
      orodnik: { ednina: "s človekom", dvojina: "s človekoma", mnozina: "z ljudmi" }
    }
  },
  "dan": {
    beseda: "dan", spol: "Moški spol", kratek_opis: "Kratka osnova v imenovalniku, podaljšana v drugih sklonih (dneva / dni).",
    ednina_prikaz: "en dan", dvojina_prikaz: "dva dni / dneva", mnozina_prikaz: "trije dnevi",
    tabela: {
      imenovalnik: { ednina: "dan", dvojina: "dva dni", mnozina: "dnevi" },
      rodilnik: { ednina: "dneva", dvojina: "dni", mnozina: "dni" },
      dajalnik: { ednina: "dnevu", dvojina: "dnevoma", mnozina: "dnevom" },
      tozilnik: { ednina: "dan", dvojina: "dva dni", mnozina: "dni / dneve" },
      mestnik: { ednina: "pri dnevu", dvojina: "pri dneh", mnozina: "pri dneh" },
      orodnik: { ednina: "z dnem", dvojina: "z dnevoma", mnozina: "z dnevi" }
    }
  },
  "mati": {
    beseda: "mati", spol: "Ženski spol", kratek_opis: "Posebna ženska sklanjatev s podaljševanjem osnove z '-er-' (mater).",
    ednina_prikaz: "ena mati", dvojina_prikaz: "dve materi", mnozina_prikaz: "tri matere",
    tabela: {
      imenovalnik: { ednina: "mati", dvojina: "materi", mnozina: "matere" },
      rodilnik: { ednina: "matere", dvojina: "mater", mnozina: "mater" },
      dajalnik: { ednina: "materi", dvojina: "materama", mnozina: "materam" },
      tozilnik: { ednina: "mater", dvojina: "materi", mnozina: "matere" },
      mestnik: { ednina: "pri materi", dvojina: "pri materah", mnozina: "pri materah" },
      orodnik: { ednina: "z materjo", dvojina: "z materama", mnozina: "z materami" }
    }
  },
  "hči": {
    beseda: "hči", spol: "Ženski spol", kratek_opis: "Posebna ženska sklanjatev s podaljševanjem osnove z '-er-' (hčer).",
    ednina_prikaz: "ena hči", dvojina_prikaz: "dve hčeri", mnozina_prikaz: "tri hčere",
    tabela: {
      imenovalnik: { ednina: "hči", dvojina: "hčeri", mnozina: "hčere" },
      rodilnik: { ednina: "hčere", dvojina: "hčera", mnozina: "hčera" },
      dajalnik: { ednina: "hčeri", dvojina: "hčerama", mnozina: "hčeram" },
      tozilnik: { ednina: "hčer", dvojina: "hčeri", mnozina: "hčere" },
      mestnik: { ednina: "pri hčeri", dvojina: "pri hčerah", mnozina: "pri hčerah" },
      orodnik: { ednina: "s hčerjo", dvojina: "s hčerama", mnozina: "s hčerami" }
    }
  },
  "oko": {
    beseda: "oko", spol: "Srednji spol", kratek_opis: "V dvojini in množini prehaja v žensko sklanjatev (očesi / oči).",
    ednina_prikaz: "eno oko", dvojina_prikaz: "dve očesi / očes", mnozina_prikaz: "tri oči",
    tabela: {
      imenovalnik: { ednina: "oko", dvojina: "očesi", mnozina: "oči" },
      rodilnik: { ednina: "očesa", dvojina: "oči", mnozina: "oči" },
      dajalnik: { ednina: "očesu", dvojina: "očesoma", mnozina: "očem" },
      tozilnik: { ednina: "oko", dvojina: "očesi", mnozina: "oči" },
      mestnik: { ednina: "pri očesu", dvojina: "pri očeh", mnozina: "pri očeh" },
      orodnik: { ednina: "z očesom", dvojina: "z očesoma", mnozina: "z očmi" }
    }
  },
  "uho": {
    beseda: "uho", spol: "Srednji spol", kratek_opis: "V dvojini in množini prehaja v žensko sklanjatev (ušesi / ušesa).",
    ednina_prikaz: "eno uho", dvojina_prikaz: "dve ušesi", mnozina_prikaz: "tri ušesa",
    tabela: {
      imenovalnik: { ednina: "uho", dvojina: "ušesi", mnozina: "ušesa" },
      rodilnik: { ednina: "ušesa", dvojina: "ušes", mnozina: "ušes" },
      dajalnik: { ednina: "ušesu", dvojina: "ušesoma", mnozina: "ušesom" },
      tozilnik: { ednina: "uho", dvojina: "ušesi", mnozina: "ušesa" },
      mestnik: { ednina: "pri ušesu", dvojina: "pri ušesih", mnozina: "pri ušesih" },
      orodnik: { ednina: "z ušesom", dvojina: "z ušesoma", mnozina: "z ušesi" }
    }
  }
};

// Reverse map for inflected forms of irregular nouns
const irregularFormsMap = {};
for (const [base, data] of Object.entries(irregularDictionary)) {
  irregularFormsMap[base] = base;
  for (const c of Object.values(data.tabela)) {
    for (const val of Object.values(c)) {
      for (const w of val.split(/[\s\/]+/)) {
        const clean = w.toLowerCase().replace(/[^a-zčšž]/gi, '');
        if (clean && !['s', 'z', 'pri', 'o', 'k', 'g', 'en', 'ena', 'eno', 'dva', 'dve', 'tri', 'trije'].includes(clean)) {
          irregularFormsMap[clean] = base;
        }
      }
    }
  }
}

// Cyrillic to Latin mapping for Serbian (Latinica requirement)
const cyrToLat = {
  'А':'A','а':'a','Б':'B','б':'b','В':'V','в':'v','Г':'G','г':'g',
  'Д':'D','д':'d','Ђ':'Đ','ђ':'đ','Е':'E','е':'e','Ж':'Ž','ж':'ž',
  'З':'Z','з':'z','И':'I','и':'i','Ј':'J','ј':'j','К':'K','к':'k',
  'Л':'L','л':'l','Љ':'Lj','љ':'lj','М':'M','м':'m','Н':'N','н':'n',
  'Њ':'Nj','њ':'nj','О':'O','о':'o','П':'P','п':'p','Р':'R','р':'r',
  'С':'S','с':'s','Т':'T','т':'t','Ћ':'Ć','ћ':'ć','У':'U','у':'u',
  'Ф':'F','ф':'f','Х':'H','х':'h','Ц':'C','ц':'c','Ч':'Č','č':'č',
  'Џ':'Dž','џ':'dž','Ш':'Š','ш':'š'
};

function toLatin(text) {
  return (text || '').split('').map(ch => cyrToLat[ch] || ch).join('');
}

function generateRegularDeclension(word) {
  word = word.toLowerCase().trim();
  let spol, base, kratek_opis, t = {};

  if (word.endsWith('a')) {
    // Ženski spol (hiša, miza, mačka)
    spol = "Ženski spol";
    base = word.slice(0, -1);
    kratek_opis = "Pravilna ženska sklanjatev na -a (1. ženska sklanjatev).";
    t = {
      imenovalnik: { ednina: word, dvojina: base + 'i', mnozina: base + 'e' },
      rodilnik: { ednina: base + 'e', dvojina: base, mnozina: base },
      dajalnik: { ednina: base + 'i', dvojina: base + 'ama', mnozina: base + 'am' },
      tozilnik: { ednina: base + 'o', dvojina: base + 'i', mnozina: base + 'e' },
      mestnik: { ednina: 'pri ' + base + 'i', dvojina: 'pri ' + base + 'ah', mnozina: 'pri ' + base + 'ah' },
      orodnik: { ednina: 'z ' + base + 'o', dvojina: 'z ' + base + 'ama', mnozina: 'z ' + base + 'ami' }
    };
    return {
      beseda: word, spol, kratek_opis,
      ednina_prikaz: "ena " + t.imenovalnik.ednina,
      dvojina_prikaz: "dve " + t.imenovalnik.dvojina,
      mnozina_prikaz: "tri " + t.imenovalnik.mnozina,
      tabela: t
    };
  } else if (word.endsWith('o') || word.endsWith('e')) {
    // Srednji spol (mesto, polje, morje)
    spol = "Srednji spol";
    base = word.slice(0, -1);
    kratek_opis = "Pravilna srednja sklanjatev na -o/-e (srednja sklanjatev).";
    t = {
      imenovalnik: { ednina: word, dvojina: base + 'i', mnozina: base + 'a' },
      rodilnik: { ednina: base + 'a', dvojina: base, mnozina: base },
      dajalnik: { ednina: base + 'u', dvojina: base + 'oma', mnozina: base + 'om' },
      tozilnik: { ednina: word, dvojina: base + 'i', mnozina: base + 'a' },
      mestnik: { ednina: 'pri ' + base + 'u', dvojina: 'pri ' + base + 'ih', mnozina: 'pri ' + base + 'ih' },
      orodnik: { ednina: 'z ' + base + 'om', dvojina: 'z ' + base + 'oma', mnozina: 'z ' + base + 'imi' }
    };
    return {
      beseda: word, spol, kratek_opis,
      ednina_prikaz: "eno " + t.imenovalnik.ednina,
      dvojina_prikaz: "dve " + t.imenovalnik.dvojina,
      mnozina_prikaz: "tri " + t.imenovalnik.mnozina,
      tabela: t
    };
  } else {
    // Moški spol (korak, stol, avto...)
    spol = "Moški spol";
    base = word;
    kratek_opis = "Pravilna moška sklanjatev na soglasnik (1. moška sklanjatev).";
    t = {
      imenovalnik: { ednina: word, dvojina: base + 'a', mnozina: base + 'i' },
      rodilnik: { ednina: base + 'a', dvojina: base + 'ov', mnozina: base + 'ov' },
      dajalnik: { ednina: base + 'u', dvojina: base + 'oma', mnozina: base + 'om' },
      tozilnik: { ednina: base + 'a', dvojina: base + 'a', mnozina: base + 'e' },
      mestnik: { ednina: 'pri ' + base + 'u', dvojina: 'pri ' + base + 'ih', mnozina: 'pri ' + base + 'ih' },
      orodnik: { ednina: 's ' + base + 'om', dvojina: 's ' + base + 'oma', mnozina: 's ' + base + 'i' }
    };
    return {
      beseda: word, spol, kratek_opis,
      ednina_prikaz: "en " + t.imenovalnik.ednina,
      dvojina_prikaz: "dva " + t.imenovalnik.dvojina,
      mnozina_prikaz: "trije " + t.imenovalnik.mnozina,
      tabela: t
    };
  }
}

// Normalize Slovene text for comparison: strip diacritics and separators
function normalizeForMatch(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[|·]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Scrape PONS for a native recording whose Slovene text EXACTLY matches `text`
async function getPonsAudioUrl(text) {
  const cleanText = (text || '').toLowerCase().trim();
  if (!cleanText) return null;
  const cacheKey = `pons:${cleanText}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }

  let result = null;
  try {
    const ponsUrl = `https://en.pons.com/translate/slovenian-english/${encodeURIComponent(cleanText)}`;
    const res = await fetch(ponsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9,sl;q=0.8'
      }
    });

    if (res.ok) {
      const html = await res.text();
      const target = normalizeForMatch(cleanText);
      const entryRegex = /data-language=["']sl["'][^>]*data-translation-id=["'](Tensl[0-9]+)["'](?:(?!tts-button)[\s\S])*?data-e2e=["']translation-source["'][^>]*>([\s\S]*?)<\/div>/gi;
      let m;
      while ((m = entryRegex.exec(html)) !== null) {
        const spoken = normalizeForMatch(m[2].replace(/<[^>]+>/g, ' '));
        if (spoken === target) {
          const translationId = m[1];
          result = {
            audioUrl: `https://api-ng.pons.com/pons-site-website/api/tts/sl/${translationId}`,
            source: 'pons',
            translationId
          };
          break;
        }
      }
    }
  } catch (err) {
    console.warn(`[PONS] Scrape error for ${cleanText}:`, err.message);
    return null;
  }

  audioCache.set(cacheKey, result);
  return result;
}

// Neural Slovenian voice (Microsoft Edge "Petra")
const NEURAL_VOICE = 'sl-SI-PetraNeural';
const ttsCache = new Map();

async function synthesizeNeural(text, rate = 'default') {
  const cacheKey = `${rate}:${text}`;
  if (ttsCache.has(cacheKey)) return ttsCache.get(cacheKey);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(NEURAL_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const options = rate === 'slow' ? { rate: '-30%' } : undefined;
  const { audioStream } = tts.toStream(text, options);

  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    const timer = setTimeout(() => reject(new Error('TTS timeout')), 15000);
    audioStream.on('data', (c) => chunks.push(c));
    audioStream.on('close', () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); });
    audioStream.on('error', (e) => { clearTimeout(timer); reject(e); });
  });

  try { tts.close(); } catch (e) {}
  if (!buffer.length) throw new Error('Empty TTS audio');
  ttsCache.set(cacheKey, buffer);
  return buffer;
}

function speakableText(str) {
  return (str || '').replace(/\s*\/\s*/g, ', ').trim();
}

function neuralAudio(text, rate = 'default') {
  const rateParam = rate === 'slow' ? '&rate=slow' : '';
  return { audioUrl: `/api/tts?text=${encodeURIComponent(text)}${rateParam}`, source: 'neural' };
}

// Resolve audio for one card: PONS recording if one exactly matches, else neural voice
async function resolveAudio(candidates, speakText) {
  for (const c of candidates) {
    const pons = await getPonsAudioUrl(c);
    if (pons) return { ...pons, word: c };
  }
  return { ...neuralAudio(speakText), word: speakText };
}

// Check if word is an established Slovenian headword in PONS
async function isSlovenianWordInPons(word) {
  try {
    const ponsUrl = `https://en.pons.com/translate/slovenian-english/${encodeURIComponent(word)}`;
    const res = await fetch(ponsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (res.ok) {
      const html = await res.text();
      const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`<strong[^>]*class=["']headword["'][^>]*>\\s*${escaped}\\s*</strong>`, 'i');
      return regex.test(html);
    }
  } catch (e) {}
  return false;
}

// Multi-engine Translation Helper with Latin script enforcement for Serbian
async function translateWithFallback(text, sl = 'auto', tl = 'sl') {
  text = (text || '').trim();
  if (!text) return { text: '', detected: sl };

  // 1. Google Translate GTX
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(gtxUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        let out = data[0].map(x => x[0]).join('').trim();
        if (tl === 'sr' || tl === 'bs' || tl === 'hr') out = toLatin(out);
        return { text: out, detected: data[2] || sl };
      }
    }
  } catch (e) {
    console.warn('[Translate] Google GTX failed:', e.message);
  }

  // 2. MyMemory Translation Fallback
  try {
    const pair = `${sl === 'auto' ? 'autodetect' : sl}|${tl}`;
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`;
    const res = await fetch(mmUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.responseData && data.responseData.translatedText) {
        let out = data.responseData.translatedText.trim();
        if (tl === 'sr' || tl === 'bs' || tl === 'hr') out = toLatin(out);
        return { text: out, detected: data.responseData.detectedLanguage || sl };
      }
    }
  } catch (e) {
    console.warn('[Translate] MyMemory failed:', e.message);
  }

  return { text, detected: sl };
}

// Extract base lemma for word declension
function resolveBaseLemma(word) {
  const lower = word.toLowerCase().trim();
  if (irregularDictionary[lower]) return lower;
  if (irregularFormsMap[lower]) return irregularFormsMap[lower];

  // Common feminine inflections (-o, -i, -e -> -a)
  if (lower.endsWith('o') && lower.length > 3) {
    const candidate = lower.slice(0, -1) + 'a';
    return candidate;
  }
  return lower;
}

function cleanWordForm(str) {
  if (!str) return '';
  const parts = str.split(/[\s\/]+/);
  const skipWords = new Set(['en', 'eno', 'ena', 'dva', 'dve', 'tri', 'trije', 'pri', 's', 'z', 'o', 'k', 'g']);
  const nounPart = parts.find(p => !skipWords.has(p.toLowerCase())) || parts[0];
  return nounPart.toLowerCase().replace(/[^a-zčšž]/gi, '');
}

// Everything we can match typed input against: Slovene headwords, their
// translations in all UI languages, and irregular noun forms (psa, ljudje...).
function buildVocabulary() {
  const vocab = [];
  const add = (word, lang, slWord) => {
    if (!word) return;
    const w = String(word).trim();
    if (!w || w.includes(' ')) return;
    vocab.push({ word: w, lang, slWord, norm: stripDiacritics(w) });
  };
  for (const entry of getDictionaryEntries()) {
    add(entry.slWord, 'sl', entry.slWord);
    for (const [lang, trans] of Object.entries(entry.translations || {})) {
      add(trans, lang, entry.slWord);
    }
  }
  for (const [form, base] of Object.entries(irregularFormsMap)) add(form, 'sl', base);
  return vocab;
}

// Order candidates: the user's language first, then Slovene, then the rest
function langPriority(userLang) {
  return (lang) => (lang === userLang ? 0 : lang === 'sl' ? 1 : 2);
}

function toSuggestion(v) {
  return { word: v.word, lang: v.lang, slWord: v.slWord };
}

// 1. Audio Endpoint
app.get('/api/audio', async (req, res) => {
  const { word } = req.query;
  if (!word) {
    return res.status(400).json({ error: 'Missing word parameter' });
  }

  const phrase = speakableText(word);
  const audioInfo = await resolveAudio([phrase, cleanWordForm(word)], phrase);
  res.json(audioInfo);
});

// 1b. Neural TTS Endpoint (supports normal and slow rate)
app.get('/api/tts', async (req, res) => {
  const text = (req.query.text || '').trim().slice(0, 500);
  const rate = req.query.rate || 'default';
  if (!text) return res.status(400).send('Missing text parameter');

  try {
    const buffer = await synthesizeNeural(text, rate);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.warn(`[TTS] Neural synthesis failed for "${text}":`, err.message);
    res.status(502).send('TTS failed');
  }
});

// 2. Full Analysis & Translation Endpoint
app.get('/api/analyze', async (req, res) => {
  const query = (req.query.q || '').trim();
  const userLang = req.query.ui || 'sr'; // target language for translations and UI

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  try {
    const isSentence = query.includes(' ') || /[.?!,;:]/.test(query);

    // ==========================================
    // CASE A: Full Sentence Translation Mode
    // ==========================================
    if (isSentence) {
      // 1. Determine if query is in Slovenian or foreign language
      const transToSl = await translateWithFallback(query, 'auto', 'sl');
      let slText = transToSl.text;
      let detectedLang = transToSl.detected;
      let meaning = '';

      if (detectedLang === 'sl') {
        // User wrote a Slovenian sentence -> translate meaning into user language
        slText = query;
        const transToUser = await translateWithFallback(query, 'sl', userLang);
        meaning = transToUser.text;
      } else {
        // User wrote in their language -> slText is Slovenian, meaning is user text (or translated to userLang)
        if (detectedLang === userLang) {
          meaning = query;
        } else {
          const transToUser = await translateWithFallback(query, 'auto', userLang);
          meaning = transToUser.text;
        }
      }

      // Build clickable word tokens from the Slovenian sentence
      const rawTokens = slText.split(/\s+/);
      const tokens = rawTokens.map(raw => {
        const clean = raw.replace(/[^a-zčšž]/gi, '');
        const lemma = resolveBaseLemma(clean);
        return {
          raw,
          clean,
          lemma,
          phonemic: clean ? transcribe(clean) : null
        };
      }).filter(t => t.clean.length > 0);

      const sentencePhonemic = transcribe(slText);

      // Return sentence response with neural audio (normal + 0.75x slow)
      return res.json({
        isSentence: true,
        original: query,
        detectedLang,
        slText,
        meaning,
        phonemic: sentencePhonemic,
        tokens,
        audio: {
          normal: { audioUrl: `/api/tts?text=${encodeURIComponent(slText)}`, source: 'neural' },
          slow: { audioUrl: `/api/tts?rate=slow&text=${encodeURIComponent(slText)}`, source: 'neural' }
        }
      });
    }

    // ==========================================
    // CASE B: Single Word / Declension Mode
    // ==========================================
    const lowerQuery = query.toLowerCase();
    const skipFuzzy = req.query.exact === '1'; // "search anyway" from the suggestion banner
    let slWord = '';
    let detectedLang = 'auto';
    let franData = null;

    // 0. Diacritic normalization & typo tolerance against our vocabulary
    let lookupWord = lowerQuery;
    let correction = null;
    let suggestions = [];
    if (!skipFuzzy) {
      const vocab = buildVocabulary();
      const isExact = vocab.some(v => v.word.toLowerCase() === lowerQuery);
      if (!isExact) {
        const rank = langPriority(userLang);
        const qNorm = stripDiacritics(lowerQuery);
        const sameLetters = vocab
          .filter(v => v.norm === qNorm)
          .sort((a, b) => rank(a.lang) - rank(b.lang));
        if (sameLetters.length) {
          // e.g. "hisa" -> "hiša", "kuca" -> "kuća", "djak" -> "đak"
          const best = sameLetters[0];
          lookupWord = best.word.toLowerCase();
          correction = { from: query, to: best.word, lang: best.lang };
        } else {
          suggestions = fuzzySuggest(lowerQuery, vocab, { limit: 3, preferLangs: [userLang, 'sl'] }).map(toSuggestion);
        }
      }
    }

    // 1. Check local & live Fran.si / Franja.si database
    const franResolved = await resolveWordWithFran(lookupWord, userLang);
    if (franResolved) {
      slWord = franResolved.slWord;
      detectedLang = franResolved.matchedLang || (franResolved.fromDb || franResolved.liveFetched ? (userLang === 'sl' ? 'sl' : userLang) : 'sl');
      franData = {
        accent: franResolved.accent || slWord,
        spol: franResolved.spol,
        dictSource: franResolved.dictSource,
        franUrl: franResolved.franUrl,
        franjaUrl: franResolved.franjaUrl,
        verified: true
      };
    } else if (irregularDictionary[lookupWord]) {
      slWord = lookupWord;
      detectedLang = 'sl';
    } else if (irregularFormsMap[lookupWord]) {
      slWord = irregularFormsMap[lookupWord];
      detectedLang = 'sl';
    } else if (suggestions.length) {
      // Neither our dictionary nor Fran/Franja know this word, but close
      // matches exist: offer them instead of guessing a declension.
      return res.json({ notFound: true, isSentence: false, original: query, suggestions });
    } else if (/[čšž]/i.test(lookupWord)) {
      slWord = resolveBaseLemma(lookupWord);
      detectedLang = 'sl';
    } else if (await isSlovenianWordInPons(lookupWord)) {
      slWord = lookupWord;
      detectedLang = 'sl';
    } else {
      // 2. Translate foreign word to Slovenian base word
      const trans = await translateWithFallback(lookupWord, 'auto', 'sl');
      detectedLang = trans.detected;
      slWord = resolveBaseLemma(trans.text.split(' ')[0]);
    }

    // Translate meaning of the word into user language
    let meaning = '';
    if (franResolved && franResolved.translations && franResolved.translations[userLang]) {
      meaning = franResolved.translations[userLang];
    } else if (detectedLang !== 'sl' && detectedLang === userLang) {
      meaning = lookupWord;
    } else {
      const transMeaning = await translateWithFallback(slWord, 'sl', userLang);
      meaning = transMeaning.text;
    }

    // Check if word is a verb (glagol)
    const isVerb = (franResolved && franResolved.partOfSpeech === 'glagol') || isVerbInfinitive(slWord);
    if (isVerb) {
      const verbConjugation = conjugateVerb(slWord);
      const headAccent = franData?.accent || slWord;
      const headPhonemic = transcribe(headAccent);

      // Enrich dual summary with phonemic transcriptions
      const enrichedDvojina = {
        sedanjik: verbConjugation.dvojinaSummary.sedanjik.map(it => ({
          ...it,
          phonemic: transcribe(it.form)
        })),
        preteklik: verbConjugation.dvojinaSummary.preteklik.map(it => ({
          ...it,
          phonemic: transcribe(it.example)
        })),
        prihodnjik: verbConjugation.dvojinaSummary.prihodnjik.map(it => ({
          ...it,
          phonemic: transcribe(it.form)
        }))
      };

      return res.json({
        isVerb: true,
        isSentence: false,
        original: query,
        correction,
        suggestions,
        detectedLang,
        slWord,
        meaning,
        phonemic: headPhonemic,
        verbData: {
          infinitive: slWord,
          accent: headAccent,
          phonemic: headPhonemic,
          sedanjik: verbConjugation.present,
          preteklik: verbConjugation.past,
          prihodnjik: verbConjugation.future,
          dvojinaSummary: enrichedDvojina,
          pastParticiple: verbConjugation.pastParticiple
        },
        franData: franData || {
          accent: slWord,
          spol: "Glagol",
          dictSource: "Fran.si (SSKJ) / Franja.si (ZRC SAZU)",
          franUrl: `https://fran.si/iskanje?View=1&Query=${encodeURIComponent(slWord)}`,
          franjaUrl: `https://franja.si/iskanje?sl=en&tl=sl&q=${encodeURIComponent(query)}`,
          verified: true
        },
        audio: {
          infinitive: { audioUrl: `/api/tts?text=${encodeURIComponent(slWord)}`, source: 'neural' },
          sedanjik_p1: { audioUrl: `/api/tts?text=${encodeURIComponent(verbConjugation.present.dvojina.p1)}`, source: 'neural' },
          preteklik_m: { audioUrl: `/api/tts?text=${encodeURIComponent(verbConjugation.past.dvojina.moski)}`, source: 'neural' },
          preteklik_f: { audioUrl: `/api/tts?text=${encodeURIComponent(verbConjugation.past.dvojina.zenski_srednji)}`, source: 'neural' }
        }
      });
    }

    // Declension generation for nouns
    let wordData;
    if (irregularDictionary[slWord]) {
      wordData = { ...irregularDictionary[slWord] };
    } else {
      wordData = generateRegularDeclension(slWord);
    }

    // If Fran.si confirmed a specific gender (e.g. avto -> Moški spol), honor it
    if (franData && franData.spol) {
      wordData.spol = franData.spol;
    }

    const headAccent = franData?.accent || slWord;
    const headPhonemic = transcribe(headAccent);

    // Phonemic transcriptions for each card
    const edninaPhonemic = transcribe(wordData.ednina_prikaz);
    const dvojinaPhonemic = transcribe(wordData.dvojina_prikaz);
    const mnozinaPhonemic = transcribe(wordData.mnozina_prikaz);

    // Phrases shown on cards
    const edninaPhrase = speakableText(wordData.ednina_prikaz);
    const dvojinaPhrase = speakableText(wordData.dvojina_prikaz);
    const mnozinaPhrase = speakableText(wordData.mnozina_prikaz);

    // Audio: Ednina uses PONS headword if exact match, Dvojina/Množina use exact phrase or neural voice
    const [edninaAudio, dvojinaAudio, mnozinaAudio] = await Promise.all([
      resolveAudio([cleanWordForm(wordData.tabela.imenovalnik.ednina)], edninaPhrase),
      resolveAudio([dvojinaPhrase], dvojinaPhrase),
      resolveAudio([mnozinaPhrase], mnozinaPhrase)
    ]);

    res.json({
      isSentence: false,
      original: query,
      correction,
      suggestions,
      detectedLang,
      slWord,
      meaning,
      phonemic: headPhonemic,
      wordData: {
        ...wordData,
        phonemic: headPhonemic,
        ednina_phonemic: edninaPhonemic,
        dvojina_phonemic: dvojinaPhonemic,
        mnozina_phonemic: mnozinaPhonemic
      },
      audio: {
        ednina: edninaAudio,
        dvojina: dvojinaAudio,
        mnozina: mnozinaAudio
      },
      franData: franData || {
        accent: slWord,
        spol: wordData.spol,
        dictSource: "Fran.si (SSKJ) / Franja.si (ZRC SAZU)",
        franUrl: `https://fran.si/iskanje?View=1&Query=${encodeURIComponent(slWord)}`,
        franjaUrl: `https://franja.si/iskanje?sl=en&tl=sl&q=${encodeURIComponent(query)}`,
        verified: true
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Napaka pri analizi besedila.' });
  }
});

// Audio proxy endpoint to stream external audio if needed
app.get('/api/audio-stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url parameter');

  try {
    const audioRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    res.setHeader('Content-Type', audioRes.headers.get('content-type') || 'audio/mpeg');
    const arrayBuffer = await audioRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).send('Audio fetch failed');
  }
});

// Practice/Quiz check endpoint: compares user answer with expected form,
// distinguishing true typos from missing carons/diacritics.
app.post('/api/quiz/check', (req, res) => {
  const { userInput, expected } = req.body || {};
  if (!userInput || !expected) {
    return res.status(400).json({ error: 'Missing userInput or expected' });
  }
  const result = diffDiacritics(userInput, expected);
  res.json(result);
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 SloDvojina strežnik teče na: http://localhost:${PORT}`);
  });
}

export default app;
