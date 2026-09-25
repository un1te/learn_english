import type { SpellcheckResult } from "@/lib/types";
import { fetchWithTimeout } from "./fetchWithTimeout";

/**
 * Check an English word via the Free Dictionary API.
 * If the word is found — ok:true. Otherwise we try to suggest
 * close variants via the Datamuse API (free, no key).
 */
export async function spellcheckEnglish(
  word: string
): Promise<SpellcheckResult> {
  const term = word.trim().toLowerCase();
  if (!term) return { ok: false, suggestions: [] };

  try {
    const res = await fetchWithTimeout(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      return { ok: true, suggestions: [] };
    }
  } catch {
    // network error — don't block the user, treat as ok
    return { ok: true, suggestions: [] };
  }

  // Word not found → look for spelling-similar words.
  const suggestions = await suggestSimilar(term);
  return { ok: false, suggestions };
}

/** Suggestions of similar words via Datamuse (sp = spelled-like). */
async function suggestSimilar(term: string): Promise<string[]> {
  try {
    const res = await fetchWithTimeout(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(term)}&max=5`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ word: string }>;
    return data
      .map((d) => d.word)
      .filter((w) => w.toLowerCase() !== term)
      .slice(0, 5);
  } catch {
    return [];
  }
}
