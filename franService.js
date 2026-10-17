import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data', 'dictionary.json');

// In-memory cache & indexes
let dictionaryEntries = [];
const slIndex = new Map();
const foreignIndex = new Map(); // key: `${lang}:${word.toLowerCase()}`

// Map app language code to Franja language code
function toFranjaLang(lang) {
  if (['sr', 'hr', 'bs', 'sh'].includes(lang)) return 'sh';
  if (['en', 'de', 'it', 'fr', 'es', 'ru', 'sl'].includes(lang)) return lang;
  return 'en';
}

// Recognized non-inflecting words to ensure correct POS & spol
export const KNOWN_NON_INFLECTING = {
  nekaj: { partOfSpeech: 'zaimek', spol: 'Zaimek' },
  kdo: { partOfSpeech: 'zaimek', spol: 'Zaimek' },
  kaj: { partOfSpeech: 'zaimek', spol: 'Zaimek' },
  danes: { partOfSpeech: 'prislov', spol: 'Prislov' },
  zelo: { partOfSpeech: 'prislov', spol: 'Prislov' },
  tukaj: { partOfSpeech: 'prislov', spol: 'Prislov' },
  včeraj: { partOfSpeech: 'prislov', spol: 'Prislov' },
  jutri: { partOfSpeech: 'prislov', spol: 'Prislov' },
  brez: { partOfSpeech: 'predlog', spol: 'Predlog' },
  pri: { partOfSpeech: 'predlog', spol: 'Predlog' },
  v: { partOfSpeech: 'predlog', spol: 'Predlog' },
  za: { partOfSpeech: 'predlog', spol: 'Predlog' },
  ker: { partOfSpeech: 'veznik', spol: 'Veznik' },
  in: { partOfSpeech: 'veznik', spol: 'Veznik' },
  ampak: { partOfSpeech: 'veznik', spol: 'Veznik' },
  tudi: { partOfSpeech: 'členek', spol: 'Členek' },
  že: { partOfSpeech: 'členek', spol: 'Členek' },
  še: { partOfSpeech: 'členek', spol: 'Členek' }
};

// Load and index local database
export function initDictionary() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      dictionaryEntries = JSON.parse(data);
    }
  } catch (err) {
    console.warn('[FranService] Failed to load dictionary.json:', err.message);
    dictionaryEntries = [];
  }

  // Ensure recognized non-inflecting words in dictionaryEntries have true POS and spol
  for (const entry of dictionaryEntries) {
    const key = (entry.slWord || '').toLowerCase().trim();
    if (KNOWN_NON_INFLECTING[key]) {
      const meta = KNOWN_NON_INFLECTING[key];
      if (!entry.partOfSpeech) entry.partOfSpeech = meta.partOfSpeech;
      if (!entry.spol || entry.spol === 'Moški spol' || entry.spol === 'Ženski spol' || entry.spol === 'Srednji spol') {
        entry.spol = meta.spol;
      }
    }
  }

  rebuildIndexes();

  // Ensure core irregular verb headword 'dati' is registered to avoid foreign index collision
  if (!slIndex.has('dati')) {
    dictionaryEntries.push({
      slWord: 'dati',
      accent: 'dáti',
      spol: null,
      partOfSpeech: 'glagol',
      translations: {
        en: 'to give',
        de: 'geben',
        it: 'dare',
        fr: 'donner',
        es: 'dar',
        ru: 'дать',
        sr: 'dati',
        hr: 'dati',
        bs: 'dati',
        sl: 'dati'
      },
      franUrl: 'https://fran.si/iskanje?View=1&Query=dati',
      source: 'Fran.si (SSKJ)',
      verified: true
    });
    rebuildIndexes();
  }

  console.log(`[FranService] Loaded & indexed ${dictionaryEntries.length} words from Fran.si & Franja.si`);
}

function rebuildIndexes() {
  slIndex.clear();
  foreignIndex.clear();

  for (const entry of dictionaryEntries) {
    if (entry.slWord) {
      slIndex.set(entry.slWord.toLowerCase(), entry);
    }
    if (entry.translations) {
      for (const [lang, trans] of Object.entries(entry.translations)) {
        if (trans) {
          const key = `${lang}:${trans.toLowerCase().trim()}`;
          foreignIndex.set(key, entry);
          // Also index Serbian / Croatian / Bosnian interchangeable lookups
          if (['sr', 'hr', 'bs'].includes(lang)) {
            foreignIndex.set(`sh:${trans.toLowerCase().trim()}`, entry);
          }
        }
      }
    }
  }
}

// Save newly discovered words back to dictionary.json
function persistNewEntry(newEntry) {
  try {
    dictionaryEntries.push(newEntry);
    rebuildIndexes();
    fs.writeFileSync(DB_PATH, JSON.stringify(dictionaryEntries, null, 2), 'utf8');
    console.log(`[FranService] Persisted new entry "${newEntry.slWord}" to dictionary.json`);
  } catch (e) {
    console.warn('[FranService] Failed to save entry:', e.message);
  }
}

// 1. Check local Fran / Franja database
export function findInLocalDictionary(word, lang = 'auto') {
  if (!word) return null;
  const lower = word.toLowerCase().trim();

  // If input matches a Slovenian headword
  if (slIndex.has(lower)) {
    return slIndex.get(lower);
  }

  // If specific language provided
  if (lang && lang !== 'auto') {
    const key = `${lang}:${lower}`;
    if (foreignIndex.has(key)) return foreignIndex.get(key);
  }

  // Check any language match in the local database
  for (const [key, entry] of foreignIndex.entries()) {
    if (key.endsWith(`:${lower}`)) {
      return entry;
    }
  }

  return null;
}

// Read-only view of all loaded entries (used for fuzzy / diacritic matching)
export function getDictionaryEntries() {
  return dictionaryEntries;
}

// Parse entry HTML returned by Franja.si
function parseFranjaEntry(html, targetWord) {
  const re = /<div class="entry-content">([\s\S]*?)<\/div>/gi;
  let m;
  const entries = [];
  while ((m = re.exec(html)) !== null) {
    entries.push(m[1]);
  }
  if (!entries.length) return null;

  // Find best matching entry whose headword actually matches targetWord
  const normTarget = targetWord.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  for (const entryHtml of entries) {
    const hwMatch = entryHtml.match(/<strong[^>]*class=["'][^"']*color-primary[^"']*["'][^>]*>([\s\S]*?)<\/strong>/i);
    if (!hwMatch) continue;
    const hwClean = hwMatch[1].replace(/<[^>]+>/g, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (hwClean !== normTarget) continue;

    // Strip headword
    let clean = entryHtml.replace(/<strong[^>]*class=["'][^"']*color-primary[^"']*["'][\s\S]*?<\/strong>/gi, '');
    clean = clean.replace(/<sup>[\s\S]*?<\/sup>/gi, '');
    clean = clean.replace(/<span[^>]*class=["'][^"']*(?:color-gray|font-size-small|font-size-xsmall)[^"']*["'][\s\S]*?<\/span>/gi, ' ');
    clean = clean.replace(/<[^>]+>/g, ' ');
    clean = clean.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

    // Candidates split by commas/semicolons
    const segments = clean.split(/[,;\n▸]/).map(s => s.trim()).filter(Boolean);
    const stopWords = new Set(['samostalnik', 'moski', 'spol', 'zenski', 'srednji', 'moskega', 'zenskega', 'srednjega', 'mn', 'ed', 'zool', 'fig', 'der', 'die', 'das', 'the', 'un', 'une', 'el', 'la', 'zu']);
    
    for (const seg of segments) {
      const firstWord = seg.split(/\s+/)[0].toLowerCase().replace(/[^a-zčšž]/gi, '');
      if (firstWord.length > 1 && !stopWords.has(firstWord)) {
        return {
          slWord: firstWord,
          rawEntry: clean.slice(0, 150)
        };
      }
    }
  }

  return null;
}

// 2. Query live Franja.si portal
export async function lookupFranjaLive(word, fromLang) {
  const cleanWord = (word || '').toLowerCase().trim();
  if (!cleanWord) return null;

  const franjaLang = toFranjaLang(fromLang);
  const url = `https://franja.si/iskanje?sl=${franjaLang}&tl=sl&q=${encodeURIComponent(cleanWord)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      }
    });

    if (res.ok) {
      const html = await res.text();
      const parsed = parseFranjaEntry(html, cleanWord);
      if (parsed && parsed.slWord) {
        return {
          slWord: parsed.slWord,
          source: 'Franja.si (ZRC SAZU)',
          franjaUrl: url,
          rawEntry: parsed.rawEntry
        };
      }
    }
  } catch (err) {
    console.warn(`[FranService] Franja.si query failed for "${cleanWord}":`, err.message);
  }

  return null;
}

// 3. Query live Fran.si portal (SSKJ / eSSKJ)
export async function lookupFranLive(slWord) {
  const cleanWord = (slWord || '').toLowerCase().trim();
  if (!cleanWord) return null;

  const url = `https://fran.si/iskanje?View=1&Query=${encodeURIComponent(cleanWord)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      }
    });

    if (res.ok) {
      const html = await res.text();
      const m = html.match(/<div class="entry-content">([\s\S]*?)<\/div>/i);
      if (m) {
        const entryHtml = m[1];

        // Extract accentuation & verify headword matches cleanWord
        const accentMatch = entryHtml.match(/<span class="font_xlarge"><a[^>]*>([^<]+)<\/a><\/span>/i);
        const accent = accentMatch ? accentMatch[1].trim() : cleanWord;
        const normAccent = accent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const normClean = cleanWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (accentMatch && normAccent !== normClean) {
          return null;
        }

        // Determine part of speech & gender from official Fran metadata
        let spol = null;
        let partOfSpeech = "samostalnik";
        if (cleanWord.endsWith('ti') || cleanWord.endsWith('či') || /\bglagol\b|title=["']glagol["']/i.test(entryHtml)) {
          partOfSpeech = "glagol";
        } else if (/zaimek|\bzaim\.\b|title=["']zaimek["']/i.test(entryHtml)) {
          partOfSpeech = "zaimek";
          spol = "Zaimek";
        } else if (/prislov|\bprisl\.\b|title=["']prislov["']/i.test(entryHtml)) {
          partOfSpeech = "prislov";
          spol = "Prislov";
        } else if (/predlog|\bpredl\.\b|title=["']predlog["']/i.test(entryHtml)) {
          partOfSpeech = "predlog";
          spol = "Predlog";
        } else if (/veznik|\bvezn\.\b|title=["']veznik["']/i.test(entryHtml)) {
          partOfSpeech = "veznik";
          spol = "Veznik";
        } else if (/členek|\bčlen\.\b|title=["']členek["']/i.test(entryHtml)) {
          partOfSpeech = "členek";
          spol = "Členek";
        } else if (/\bgl\.\b/i.test(entryHtml)) {
          partOfSpeech = "glagol";
        } else if (/samostalnik moškega spola|\bmoškega spola\b|title=["']samostalnik moškega spola["']|\bm\b\s*[,.\(]/i.test(entryHtml)) {
          spol = "Moški spol";
        } else if (/samostalnik ženskega spola|\bženskega spola\b|title=["']samostalnik ženskega spola["']|\bž\b\s*[,.\(]/i.test(entryHtml)) {
          spol = "Ženski spol";
        } else if (/samostalnik srednjega spola|\bsrednjega spola\b|title=["']samostalnik srednjega spola["']|\bs\b\s*[,.\(]/i.test(entryHtml)) {
          spol = "Srednji spol";
        }

        return {
          slWord: cleanWord,
          accent,
          spol,
          partOfSpeech,
          franUrl: url,
          source: 'Fran.si (SSKJ)',
          verified: true
        };
      }
    }
  } catch (err) {
    console.warn(`[FranService] Fran.si query failed for "${cleanWord}":`, err.message);
  }

  return null;
}

// 4. Combined Resolver: checks Local DB -> Live Franja -> Live Fran
export async function resolveWordWithFran(word, fromLang = 'auto') {
  const clean = (word || '').toLowerCase().trim();
  if (!clean) return null;

  // Step 1: Check Local Verified Database
  const local = findInLocalDictionary(clean, fromLang);
  if (local) {
    const isSlMatch = local.slWord.toLowerCase() === clean && (!local.translations || local.translations[fromLang]?.toLowerCase() !== clean);
    const nonInf = KNOWN_NON_INFLECTING[clean] || KNOWN_NON_INFLECTING[local.slWord.toLowerCase()];
    const resolvedPos = local.partOfSpeech || nonInf?.partOfSpeech || (['Zaimek', 'Prislov', 'Predlog', 'Veznik', 'Členek'].includes(local.spol) ? local.spol.toLowerCase() : (local.slWord.endsWith('ti') || local.slWord.endsWith('či') ? 'glagol' : (local.spol ? 'samostalnik' : null)));
    const resolvedSpol = local.spol || nonInf?.spol || (resolvedPos && ['zaimek', 'prislov', 'predlog', 'veznik', 'členek'].includes(resolvedPos) ? resolvedPos.charAt(0).toUpperCase() + resolvedPos.slice(1) : null);
    return {
      slWord: local.slWord,
      accent: local.accent || local.slWord,
      spol: resolvedSpol,
      partOfSpeech: resolvedPos,
      translations: local.translations,
      dictSource: local.source || "Fran.si (SSKJ) / Franja.si (ZRC SAZU)",
      franUrl: local.franUrl || `https://fran.si/iskanje?View=1&Query=${encodeURIComponent(local.slWord)}`,
      franjaUrl: local.franjaUrl || `https://franja.si/iskanje?sl=en&tl=sl&q=${encodeURIComponent(clean)}`,
      verified: true,
      fromDb: true,
      matchedLang: isSlMatch ? 'sl' : fromLang
    };
  }

  // Check if un-cached headword is a recognized non-inflecting word
  if (KNOWN_NON_INFLECTING[clean]) {
    const meta = KNOWN_NON_INFLECTING[clean];
    return {
      slWord: clean,
      accent: clean,
      spol: meta.spol,
      partOfSpeech: meta.partOfSpeech,
      translations: {},
      dictSource: "Fran.si (SSKJ) / Franja.si (ZRC SAZU)",
      franUrl: `https://fran.si/iskanje?View=1&Query=${encodeURIComponent(clean)}`,
      franjaUrl: `https://franja.si/iskanje?sl=en&tl=sl&q=${encodeURIComponent(clean)}`,
      verified: true,
      fromDb: false,
      matchedLang: 'sl'
    };
  }

  // Step 2: If foreign word, query live Franja.si
  let slCandidate = null;
  let franjaData = null;
  let matchedLang = fromLang;

  if (fromLang !== 'sl') {
    franjaData = await lookupFranjaLive(clean, fromLang);
    if (franjaData && franjaData.slWord) {
      slCandidate = franjaData.slWord;
    } else {
      // Fallback: check if input word is already a Slovenian word on Fran.si
      slCandidate = clean;
      matchedLang = 'sl';
    }
  } else {
    slCandidate = clean;
    matchedLang = 'sl';
  }

  // Step 3: If we have a Slovene candidate, verify on live Fran.si
  if (slCandidate) {
    const franData = await lookupFranLive(slCandidate);
    if (franData) {
      const result = {
        slWord: slCandidate,
        accent: franData.accent || slCandidate,
        spol: franData.spol,
        partOfSpeech: franData.partOfSpeech,
        dictSource: "Fran.si (SSKJ) / Franja.si (ZRC SAZU)",
        franUrl: franData.franUrl,
        franjaUrl: franjaData?.franjaUrl || `https://franja.si/iskanje?sl=en&tl=sl&q=${encodeURIComponent(clean)}`,
        verified: true,
        liveFetched: true,
        matchedLang
      };

      // Persist to local database only when we have a genuine foreign->Slovene translation or Slovene headword
      persistNewEntry({
        slWord: slCandidate,
        accent: result.accent,
        spol: result.spol,
        partOfSpeech: result.partOfSpeech,
        translations: matchedLang !== 'sl' ? { [fromLang]: clean } : {},
        source: result.dictSource,
        franUrl: result.franUrl,
        franjaUrl: result.franjaUrl
      });

      return result;
    }
  }

  return null;
}

// Initialize on module load
initDictionary();
