// Lightweight, fully local keyword matcher. No external AI calls —
// it just cross-references your brain dump against names/titles
// already in the book and scores overlap.

const STOPWORDS = new Set(['the','a','an','and','or','but','of','to','in','on','at','for','with','is','was','were','be','it','he','she','they','her','his','their','that','this','i','you','we','me','my','so','just','then','not','as','are','if','when','what','who','how']);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function generateSuggestions(dumpText, { characters = [], chapters = [], plotPoints = [], worldNotes = [] }) {
  const dumpTokens = new Set(tokenize(dumpText));
  const lowerDump = (dumpText || '').toLowerCase();
  const suggestions = [];

  characters.forEach((c) => {
    if (!c.name) return;
    const nameTokens = tokenize(c.name).concat(tokenize(c.alias || ''));
    const hits = nameTokens.filter((t) => dumpTokens.has(t));
    if (hits.length > 0 || (c.name.length > 2 && lowerDump.includes(c.name.toLowerCase()))) {
      suggestions.push({
        type: 'character', id: c.id, label: `Character: ${c.name}`,
        score: hits.length + (lowerDump.includes(c.name.toLowerCase()) ? 2 : 0),
      });
    }
  });

  chapters.forEach((ch) => {
    const chNumMatch = new RegExp(`chapter\\s*${ch.number}\\b`, 'i').test(dumpText || '');
    const titleTokens = tokenize(ch.title || '');
    const hits = titleTokens.filter((t) => dumpTokens.has(t));
    if (chNumMatch || hits.length > 0) {
      suggestions.push({
        type: 'chapter', id: ch.id, label: `Chapter ${ch.number}: ${ch.title || ''}`,
        score: hits.length + (chNumMatch ? 3 : 0),
      });
    }
  });

  plotPoints.forEach((p) => {
    const titleTokens = tokenize(p.title || '');
    const hits = titleTokens.filter((t) => dumpTokens.has(t));
    if (hits.length > 0) {
      suggestions.push({ type: 'plot', id: p.id, label: `Plot beat: ${p.title}`, score: hits.length });
    }
  });

  worldNotes.forEach((w) => {
    const titleTokens = tokenize(w.title || '');
    const hits = titleTokens.filter((t) => dumpTokens.has(t));
    if (hits.length > 0) {
      suggestions.push({ type: 'world', id: w.id, label: `World note: ${w.title}`, score: hits.length });
    }
  });

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 6);
}
