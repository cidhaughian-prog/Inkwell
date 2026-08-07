// Local keyword/fuzzy matcher. No external AI calls — everything runs in
// your browser, free, offline. It cross-references your brain dump against
// names/titles already in the book, tolerates typos and word variants
// (stemming + edit distance), and flags names that show up repeatedly but
// aren't in your character list yet, in case that's a new character.

const STOPWORDS = new Set([
  'the','a','an','and','or','but','of','to','in','on','at','for','with','is','was','were','be','been','being',
  'it','he','she','they','her','his','their','them','him','that','this','these','those','i','you','we','me','my',
  'so','just','then','not','as','are','if','when','what','who','how','why','where','which','there','here',
  'said','says','like','get','got','went','going','would','could','should','will','can','did','do','does',
  'she\'d','he\'d','i\'m','it\'s','don\'t','didn\'t','couldn\'t','wouldn\'t','my\'d',
]);

// Common capitalized sentence-starters that would otherwise look like proper nouns
const FALSE_PROPER = new Set([
  'the','this','that','these','those','then','there','when','what','who','how','why','where','which',
  'and','but','or','so','if','because','after','before','while','once','maybe','okay','yeah','well',
  'chapter','scene','pov','ch','she','he','they','it','i','we','you','her','his','their',
]);

function stem(word) {
  return word
    .replace(/'(s|d|ll|re|ve|m)$/,'')
    .replace(/(ing|edly|ed|es|s)$/,'')
    .replace(/(ing|ed)$/,'');
}

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function stemSet(tokens) {
  return new Set(tokens.map(stem));
}

// Cheap edit distance, capped early for speed — only used on short word lists
function levenshtein(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function fuzzyHas(dumpTokens, dumpStems, word) {
  const w = word.toLowerCase();
  if (dumpTokens.has(w)) return 2; // exact
  if (dumpStems.has(stem(w))) return 1.5; // same root word (running vs run)
  for (const t of dumpTokens) {
    if (Math.abs(t.length - w.length) <= 2 && w.length > 4 && levenshtein(t, w) <= 1) return 1; // likely typo
  }
  return 0;
}

export function generateSuggestions(dumpText, { characters = [], chapters = [], plotPoints = [], worldNotes = [] }) {
  const dumpTokens = new Set(tokenize(dumpText));
  const dumpStems = stemSet([...dumpTokens]);
  const lowerDump = (dumpText || '').toLowerCase();
  const suggestions = [];

  characters.forEach((c) => {
    if (!c.name) return;
    if (c.name.length > 2 && lowerDump.includes(c.name.toLowerCase())) {
      suggestions.push({ type: 'character', id: c.id, label: `Character: ${c.name}`, score: 5 });
      return;
    }
    const nameTokens = tokenize(c.name).concat(tokenize(c.alias || ''));
    let score = 0;
    nameTokens.forEach((t) => { score += fuzzyHas(dumpTokens, dumpStems, t); });
    if (score > 0) suggestions.push({ type: 'character', id: c.id, label: `Character: ${c.name}`, score });
  });

  chapters.forEach((ch) => {
    const chNumMatch = new RegExp(`chapter\\s*${ch.number}\\b`, 'i').test(dumpText || '');
    const titleTokens = tokenize(ch.title || '');
    let score = chNumMatch ? 3 : 0;
    titleTokens.forEach((t) => { score += fuzzyHas(dumpTokens, dumpStems, t); });
    if (score > 0) suggestions.push({ type: 'chapter', id: ch.id, label: `Chapter ${ch.number}: ${ch.title || ''}`, score });
  });

  plotPoints.forEach((p) => {
    const titleTokens = tokenize(p.title || '');
    let score = 0;
    titleTokens.forEach((t) => { score += fuzzyHas(dumpTokens, dumpStems, t); });
    if (score > 0) suggestions.push({ type: 'plot', id: p.id, label: `Plot beat: ${p.title}`, score });
  });

  worldNotes.forEach((w) => {
    const titleTokens = tokenize(w.title || '');
    let score = 0;
    titleTokens.forEach((t) => { score += fuzzyHas(dumpTokens, dumpStems, t); });
    if (score > 0) suggestions.push({ type: 'world', id: w.id, label: `World note: ${w.title}`, score });
  });

  // Flag capitalized names that repeat but aren't a known character yet —
  // catches new characters your dump introduced that nothing else could match.
  const rawWords = (dumpText || '').match(/\b[A-Z][a-z]{2,}\b/g) || [];
  const freq = {};
  rawWords.forEach((w) => {
    const key = w.toLowerCase();
    if (FALSE_PROPER.has(key)) return;
    freq[key] = (freq[key] || 0) + 1;
  });
  const knownNameTokens = new Set(
    characters.flatMap((c) => tokenize(c.name || '').concat(tokenize(c.alias || '')))
  );
  Object.entries(freq)
    .filter(([key, count]) => count >= 2 && !knownNameTokens.has(key))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .forEach(([key, count]) => {
      const display = rawWords.find((w) => w.toLowerCase() === key);
      suggestions.push({ type: 'new_character', name: display, label: `New character? "${display}" (mentioned ${count}x)`, score: count });
    });

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 7);
}
