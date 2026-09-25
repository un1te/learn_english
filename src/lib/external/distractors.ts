import { fetchWithTimeout } from "./fetchWithTimeout";

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
    const trNorm = tr.trim().toLowerCase();
    // Skip if the translation matches the correct answer
    // or has already been added.
    if (trNorm === correctUkNorm) continue;
    if (uk.some((x) => x.toLowerCase() === trNorm)) continue;
    en.push(word);
    uk.push(tr);
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

/** Translate EN→UK via MyMemory (free, no API key). */
async function translateToUk(word: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|uk`,
      { cache: "no-store" },
      4000
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
    };
    const text = data.responseData?.translatedText?.trim();
    if (!text) return null;
    // Discard if the translation is suspiciously long (a whole sentence) or Latin.
    if (text.split(/\s+/).length > 3) return null;
    if (/^[a-z0-9\s-]+$/i.test(text)) return null; // not translated (still Latin)
    return text;
  } catch {
    return null;
  }
}
