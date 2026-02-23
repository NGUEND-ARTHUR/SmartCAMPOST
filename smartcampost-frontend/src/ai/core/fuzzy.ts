type Scored<T> = { item: T; score: number };

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string, maxDistance: number): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  const v0 = new Array(b.length + 1).fill(0);
  const v1 = new Array(b.length + 1).fill(0);

  for (let i = 0; i <= b.length; i++) v0[i] = i;

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    let bestInRow = v1[0];

    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      bestInRow = Math.min(bestInRow, v1[j + 1]);
    }

    if (bestInRow > maxDistance) return maxDistance + 1;
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }

  return v0[b.length];
}

export function fuzzyScore(queryRaw: string, candidateRaw: string): number {
  const query = normalize(queryRaw);
  const candidate = normalize(candidateRaw);
  if (!query || !candidate) return 0;

  if (candidate === query) return 1;
  if (candidate.includes(query)) {
    const bonus = Math.min(0.2, query.length / Math.max(1, candidate.length));
    return 0.85 + bonus;
  }

  const maxDistance = Math.min(6, Math.max(2, Math.floor(query.length / 3)));
  const d = levenshtein(query.slice(0, 64), candidate.slice(0, 64), maxDistance);
  if (d > maxDistance) return 0;
  return Math.max(0.2, 1 - d / Math.max(query.length, candidate.length));
}

export function rankFuzzy<T>(
  query: string,
  items: T[],
  toText: (item: T) => string,
  opts?: { limit?: number; minScore?: number },
): T[] {
  const limit = opts?.limit ?? items.length;
  const minScore = opts?.minScore ?? 0.25;

  const scored: Scored<T>[] = [];
  for (const item of items) {
    const score = fuzzyScore(query, toText(item));
    if (score >= minScore) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
