function levenshtein(a, b) {
  const s = String(a);
  const t = String(b);
  const rows = s.length + 1;
  const cols = t.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[s.length][t.length];
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[#_]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSort(value) {
  return normalize(value).split(' ').filter(Boolean).sort().join(' ');
}

function scoreMatch(query, target) {
  const q = normalize(query);
  const t = normalize(target);
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.includes(q) || q.includes(t)) return 86;
  if (tokenSort(t) === tokenSort(q) && q.includes(' ')) return 82;

  const qTokens = q.split(' ');
  const tTokens = t.split(' ');
  let tokenHits = 0;
  for (const qt of qTokens) {
    if (tTokens.some((tt) => tt.includes(qt) || qt.includes(tt) || levenshtein(qt, tt) <= Math.max(1, Math.floor(qt.length / 4)))) {
      tokenHits += 1;
    }
  }
  if (tokenHits && tokenHits === qTokens.length) return 74;

  const distance = levenshtein(q, t);
  const maxLen = Math.max(q.length, t.length);
  const similarity = 1 - distance / maxLen;
  if (similarity >= 0.62) return Math.round(similarity * 70);
  if (distance <= 2 && q.length >= 3) return 58;
  return tokenHits ? 40 + tokenHits * 6 : 0;
}

function rankByFields(query, items, fieldGetters) {
  return items
    .map((item) => {
      const score = Math.max(...fieldGetters.map((getter) => scoreMatch(query, getter(item) || '')));
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

module.exports = { levenshtein, normalize, scoreMatch, rankByFields };
