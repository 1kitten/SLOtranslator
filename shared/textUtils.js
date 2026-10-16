// Text normalization, fuzzy matching and diacritic diffing.
// Shared by the server (import) and the browser (served at /shared/textUtils.js),
// so the same rules apply to lookups now and to a future quiz/practice mode.

// Lowercase, map đ -> dj, strip all combining accents (č->c, š->s, ž->z, ć->c,
// SSKJ stress marks like á/ȍ/ê -> plain vowel). Keeps spaces between words.
export function stripDiacritics(str) {
  return (str || '')
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Optimal string alignment distance (Levenshtein + adjacent transposition),
// so "hsia" -> "hisa" counts as 1 edit instead of 2.
// Stops early and returns maxDist + 1 once the distance can no longer be <= maxDist.
export function editDistance(a, b, maxDist = Infinity) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) d[i][0] = i;
  for (let j = 0; j < cols; j++) d[0][j] = j;

  for (let i = 1; i < rows; i++) {
    let rowMin = Infinity;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, d[i - 2][j - 2] + 1);
      }
      d[i][j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > maxDist) return maxDist + 1;
  }
  return d[a.length][b.length];
}

// Allowed edits scale with word length. Short words get 1 edit, otherwise
// "pes" would match "les", "ves", "pas"... and the suggestions become noise.
export function maxEditsFor(word) {
  return word.length <= 4 ? 1 : 2;
}

// Rank vocabulary items against a query.
// vocab: [{ word, ...anything }]. Returns the best `limit` items with `distance`.
export function fuzzySuggest(query, vocab, { limit = 3, preferLangs = [] } = {}) {
  const q = stripDiacritics(query);
  if (!q) return [];
  const maxDist = maxEditsFor(q);
  const seen = new Set();
  const hits = [];

  for (const item of vocab) {
    const norm = item.norm || stripDiacritics(item.word);
    if (norm === q) continue; // exact/diacritic matches are handled elsewhere
    const dist = editDistance(q, norm, maxDist);
    if (dist > maxDist) continue;
    const key = item.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    hits.push({ ...item, distance: dist });
  }

  const langRank = (lang) => {
    const i = preferLangs.indexOf(lang);
    return i === -1 ? preferLangs.length : i;
  };
  hits.sort((x, y) => x.distance - y.distance || langRank(x.lang) - langRank(y.lang) || x.word.length - y.word.length);
  return hits.slice(0, limit);
}

// Compare a user's answer with the correct form, character by character.
// Returns:
//   status: 'correct' | 'diacritics' (only accents/carons differ) | 'wrong'
//   chars:  [{ char, expected, ok }] aligned to the correct form, where `char`
//           is what the user typed and `expected` the correctly spelled letter.
// Intended for a quiz/practice mode: 'diacritics' = "Almost correct".
export function diffDiacritics(userInput, correct) {
  const typed = (userInput || '').trim().toLowerCase().normalize('NFC');
  const target = (correct || '').trim().toLowerCase().normalize('NFC');
  if (typed === target) {
    return { status: 'correct', chars: [...target].map(c => ({ char: c, expected: c, ok: true })) };
  }
  if (stripDiacritics(typed) !== stripDiacritics(target)) {
    return { status: 'wrong', chars: [] };
  }

  // Same letters once accents are removed. Walk both strings; "dj" in the input
  // may stand for a single "đ" in the target.
  const chars = [];
  let i = 0;
  const t = [...typed];
  for (const exp of target) {
    if (exp === 'đ' && t[i] === 'd' && t[i + 1] === 'j') {
      chars.push({ char: 'dj', expected: 'đ', ok: false });
      i += 2;
      continue;
    }
    const got = t[i] ?? '';
    chars.push({ char: got, expected: exp, ok: got === exp });
    i += 1;
  }
  return { status: 'diacritics', chars };
}
