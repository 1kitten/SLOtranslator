// Rule-based Slovene phonemic transcription.
//
// Input: a Slovene word or phrase, optionally with SSKJ stress marks
// (e.g. "delováti", "híša", "otròk", "ôče"). Output:
//   respelling: syllables joined by "-", stress mark kept on the vowel  -> "de-lo-vá-ti"
//   ipa:        broad IPA with ˈ before the stressed syllable          -> "dɛlɔˈʋaːti"
//   stressKnown: true when the input carried a stress mark
//
// Stress can only be shown where the dictionary supplies it. Slovene stress is
// free, so it is NOT guessed for generated forms (psa, hiši, delujeva...).

// Accented vowel -> [base letter, IPA, long]
const ACCENTED = {
  'á': ['a', 'a', true], 'à': ['a', 'a', false], 'ȁ': ['a', 'a', false], 'ā': ['a', 'a', true], 'ȃ': ['a', 'a', true],
  'é': ['e', 'e', true], 'ê': ['e', 'ɛ', true], 'è': ['e', 'ɛ', false], 'ȅ': ['e', 'ɛ', false], 'ē': ['e', 'e', true], 'ȇ': ['e', 'e', true],
  'í': ['i', 'i', true], 'ì': ['i', 'i', false], 'ȉ': ['i', 'i', false], 'ī': ['i', 'i', true], 'ȋ': ['i', 'i', true],
  'ó': ['o', 'o', true], 'ô': ['o', 'ɔ', true], 'ò': ['o', 'ɔ', false], 'ȍ': ['o', 'ɔ', false], 'ō': ['o', 'o', true], 'ȏ': ['o', 'o', true],
  'ú': ['u', 'u', true], 'ù': ['u', 'u', false], 'ȕ': ['u', 'u', false], 'ū': ['u', 'u', true], 'ȗ': ['u', 'u', true],
  'ŕ': ['r', 'ər', true]
};
const PLAIN_VOWEL_IPA = { a: 'a', e: 'ɛ', i: 'i', o: 'ɔ', u: 'u', 'ə': 'ə' };

// Obstruents: [voiced IPA, voiceless IPA, isVoiced]
const OBSTRUENTS = {
  b: ['b', 'p', true], p: ['b', 'p', false],
  d: ['d', 't', true], t: ['d', 't', false],
  g: ['ɡ', 'k', true], k: ['ɡ', 'k', false],
  z: ['z', 's', true], s: ['z', 's', false],
  'ž': ['ʒ', 'ʃ', true], 'š': ['ʒ', 'ʃ', false],
  'dž': ['dʒ', 'tʃ', true], 'č': ['dʒ', 'tʃ', false],
  c: ['dz', 'ts', false], f: ['v', 'f', false], h: ['ɣ', 'x', false]
};
const SONORANT_IPA = { m: 'm', n: 'n', r: 'r', l: 'l', j: 'j', v: 'ʋ', lj: 'lj', nj: 'nj' };
const ONSET_SECOND = new Set(['r', 'l', 'lj', 'j']);

// Forms of "biti" used as auxiliaries: when present, a word-final "-l" of the
// past participle is pronounced [u̯] (deloval -> [dɛlɔʋau̯]).
const AUXILIARIES = new Set(['sem', 'si', 'je', 'sva', 'sta', 'smo', 'ste', 'so', 'bom', 'boš', 'bo', 'bova', 'bosta', 'bomo', 'boste', 'bodo']);

// Known dictionary notations where the stressed "e" is a schwa (SSKJ writes "pès").
const SCHWA_WORDS = { 'pès': 'pə̀s' };

function tokenize(word) {
  const units = [];
  const chars = [...word.normalize('NFC')];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    // stressed schwa: ə + combining grave
    if (ch === 'ə') {
      const stressed = next === '\u0300';
      if (stressed) i++;
      units.push({ kind: 'V', orig: stressed ? 'ə̀' : 'ə', base: 'ə', ipa: 'ə', stressed, long: false });
      continue;
    }
    if (ACCENTED[ch]) {
      const [base, ipa, long] = ACCENTED[ch];
      units.push({ kind: base === 'r' ? 'R' : 'V', orig: ch, base, ipa, stressed: true, long });
      continue;
    }
    if (PLAIN_VOWEL_IPA[ch]) {
      units.push({ kind: 'V', orig: ch, base: ch, ipa: PLAIN_VOWEL_IPA[ch], stressed: false, long: false });
      continue;
    }
    // digraphs
    if ((ch === 'l' || ch === 'n') && next === 'j') {
      units.push({ kind: 'C', orig: ch + 'j', base: ch + 'j' });
      i++;
      continue;
    }
    if (ch === 'd' && next === 'ž') {
      units.push({ kind: 'C', orig: 'dž', base: 'dž' });
      i++;
      continue;
    }
    // other accented consonants (data noise like "ḿ"): drop the accent
    const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC') || ch;
    const plain = ch === 'č' || ch === 'š' || ch === 'ž' ? ch : base;
    if (/[a-zčšž]/.test(plain)) units.push({ kind: 'C', orig: ch, base: plain });
  }

  // Syllabic r: an "r" with no vowel on either side acts as the nucleus (vrt, prst, trg).
  units.forEach((u, idx) => {
    if (u.kind === 'R') { u.kind = 'V'; return; }
    if (u.kind === 'C' && u.base === 'r') {
      const prevV = units[idx - 1]?.kind === 'V';
      const nextV = units[idx + 1]?.kind === 'V';
      if (!prevV && !nextV) Object.assign(u, { kind: 'V', ipa: 'ər', stressed: false, long: false });
    }
  });
  return units;
}

function syllabify(units) {
  const nuclei = units.map((u, i) => (u.kind === 'V' ? i : -1)).filter(i => i >= 0);
  if (nuclei.length === 0) return [units];
  const starts = [0];
  for (let n = 1; n < nuclei.length; n++) {
    const prev = nuclei[n - 1];
    const cur = nuclei[n];
    const k = cur - prev - 1;
    let start;
    if (k <= 0) start = cur;
    else if (k === 1) start = cur - 1;
    else {
      const a = units[cur - 2];
      const b = units[cur - 1];
      start = OBSTRUENTS[a.base] && ONSET_SECOND.has(b.base) ? cur - 2 : cur - 1;
    }
    starts.push(start);
  }
  return starts.map((s, i) => units.slice(s, starts[i + 1] ?? units.length));
}

function consonantIpa(units, idx, { finalLtoW }) {
  const u = units[idx];
  const next = units[idx + 1];
  const prev = units[idx - 1];
  const isLast = idx === units.length - 1;

  if (OBSTRUENTS[u.base]) {
    const [voiced, voiceless, isVoiced] = OBSTRUENTS[u.base];
    // regressive voicing assimilation; v does not trigger it
    let nextObs = null;
    for (let j = idx + 1; j < units.length; j++) {
      if (OBSTRUENTS[units[j].base]) { nextObs = units[j]; break; }
      break;
    }
    if (isLast) return voiceless; // final devoicing
    if (nextObs) return OBSTRUENTS[nextObs.base][2] ? voiced : voiceless;
    return isVoiced ? voiced : voiceless;
  }

  switch (u.base) {
    case 'v':
      // before a consonant or word-finally v is a glide [u̯]
      if (!next || next.kind !== 'V') return prev || next ? 'u̯' : 'u';
      return 'ʋ';
    case 'l':
      if (isLast && finalLtoW && prev?.kind === 'V') return 'u̯';
      return 'l';
    case 'lj':
      return next?.kind === 'V' ? 'lj' : 'l';
    case 'nj':
      return next?.kind === 'V' ? 'nj' : 'jn';
    case 'n':
      return next && (next.base === 'k' || next.base === 'g') ? 'ŋ' : 'n';
    default:
      return SONORANT_IPA[u.base] || u.base;
  }
}

export function transcribeWord(word, { finalLtoW = false } = {}) {
  const raw = (word || '').trim().toLowerCase();
  if (!raw) return { respelling: '', ipa: '', stressKnown: false };
  const src = SCHWA_WORDS[raw] || raw;
  const units = tokenize(src);
  if (!units.length) return { respelling: raw, ipa: raw, stressKnown: false };

  const syllables = syllabify(units);
  const stressKnown = units.some(u => u.kind === 'V' && u.stressed);
  let flat = 0;

  const ipaParts = syllables.map(syl => {
    let text = '';
    let stressed = false;
    for (const u of syl) {
      const idx = flat++;
      if (u.kind === 'V') {
        text += u.ipa + (u.long ? 'ː' : '');
        if (u.stressed) stressed = true;
      } else {
        text += consonantIpa(units, idx, { finalLtoW });
      }
    }
    // only mark stress on multi-syllable words; a lone syllable is trivially stressed
    return stressed && syllables.length > 1 ? 'ˈ' + text : text;
  });

  const respelling = syllables.map(s => s.map(u => u.orig).join('')).join('-');
  return { respelling, ipa: ipaParts.join(''), stressKnown };
}

// Transcribe a phrase such as "midva/medve delujeva" or "midva sva delovala".
export function transcribe(phrase) {
  const text = (phrase || '').trim();
  if (!text) return { respelling: '', ipa: '', stressKnown: false };
  const words = text.toLowerCase().split(/\s+/);
  const finalLtoW = words.some(w => w.split('/').some(p => AUXILIARIES.has(p)));

  let stressKnown = false;
  const res = [];
  const ipa = [];
  words.forEach((w, wi) => {
    // One-letter prepositions are pronounced together with the next word.
    if (['s', 'z', 'k', 'h', 'v'].includes(w)) {
      res.push(w);
      ipa.push(prepositionIpa(w, words[wi + 1]));
      return;
    }
    const alts = w.split('/').map(p => transcribeWord(p.replace(/[^\p{L}\u0300-\u036f]/gu, ''), { finalLtoW }));
    if (alts.some(a => a.stressKnown)) stressKnown = true;
    res.push(alts.map(a => a.respelling).join('/'));
    ipa.push(alts.map(a => a.ipa).join('/'));
  });
  return { respelling: `/${res.join(' ')}/`, ipa: `[${ipa.join(' ')}]`, stressKnown };
}

function prepositionIpa(prep, nextWord) {
  const first = (nextWord || '').normalize('NFC')[0] || '';
  const firstBase = first.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');
  const obs = OBSTRUENTS[firstBase];
  const voicelessNext = obs ? !obs[2] : false;
  switch (prep) {
    case 's':
    case 'z':
      return voicelessNext ? 's' : 'z';
    case 'k':
    case 'h':
      return obs && obs[2] ? 'ɡ' : 'k';
    case 'v':
      return 'u';
    default:
      return prep;
  }
}
