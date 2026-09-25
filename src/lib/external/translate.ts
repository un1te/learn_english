import { fetchWithTimeout } from "./fetchWithTimeout";

/**
 * Translate an English word to Ukrainian via MyMemory (free, no API key).
 * Returns the translation or null when it fails or looks invalid.
 *
 * `strict` (used for distractors) additionally rejects long strings and
 * untranslated Latin text; the auto-fill flow uses strict=false to accept
 * whatever MyMemory returns for the user's chosen word.
 */
export async function translateToUk(
  word: string,
  strict = true
): Promise<string | null> {
  const term = word.trim();
  if (!term) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=en|uk`,
      { cache: "no-store" },
      4000
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
    };
    const text = data.responseData?.translatedText?.trim();
    if (!text) return null;
    if (strict) {
      // Distractor translations must be clean single Ukrainian words:
      // - at most 2 words (reject sentences)
      // - no Latin letters mixed in (reject junk like "резервslot type")
      // - Cyrillic only, no stray symbols/asterisks/digits
      if (text.split(/\s+/).length > 2) return null;
      if (/[a-z]/i.test(text)) return null;
      if (!/^[а-яґєіїʼ'\s-]+$/i.test(text)) return null;
    }
    return text;
  } catch {
    return null;
  }
}
