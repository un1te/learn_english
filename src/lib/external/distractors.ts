import { fetchWithTimeout } from "./fetchWithTimeout";
import { translateToUk } from "./translate";

export interface Distractors {
  /** Meaning-based English words (for UA→EN) */
  en: string[];
  /** Their Ukrainian translations (for EN→UA) */
  uk: string[];
}

/**
 * Builds quiz distractors (wrong options) from the internet.
 *
 * 1) Datamuse ml= — words close in meaning to the given English word.
 * 2) Each is translated to Ukrainian via MyMemory (no API key).
 *
 * Returns up to 6 pairs (en + its uk translation). Pairs where the
 * translation failed or matches the original are discarded.
 */
export async function buildDistractors(
  english: string,
  correctUk: string
): Promise<Distractors> {
  const term = english.trim().toLowerCase();
  if (!term) return { en: [], uk: [] };

  const related = await relatedWords(term);
  if (related.length === 0) return { en: [], uk: [] };

  const en: string[] = [];
  const uk: string[] = [];
  const correctUkNorm = correctUk.trim().toLowerCase();

  // Translate in parallel, but cap the count.
  const candidates = related.slice(0, 8);
  const translations = await Promise.all(
    candidates.map((w) => translateToUk(w))
  );

  for (let i = 0; i < candidates.length; i++) {
    const word = candidates[i];
    const tr = translations[i];
    if (!tr) continue;
    // Normalize to lowercase for consistent look (avoid "Студент").
    const clean = tr.trim().toLowerCase();
    // Skip if the translation matches the correct answer
    // or has already been added.
    if (clean === correctUkNorm) continue;
    if (uk.some((x) => x.toLowerCase() === clean)) continue;
    en.push(word.toLowerCase());
    uk.push(clean);
    if (en.length >= 6) break;
  }

  return { en, uk };
}

/** Words close in meaning (Datamuse means-like + related synonyms). */
async function relatedWords(term: string): Promise<string[]> {
  try {
    const res = await fetchWithTimeout(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(term)}&max=20`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ word: string }>;
    return data
      .map((d) => d.word)
      .filter((w) => /^[a-z][a-z-]*$/i.test(w)) // single Latin words
      .filter((w) => w.toLowerCase() !== term)
      .slice(0, 12);
  } catch {
    return [];
  }
}


