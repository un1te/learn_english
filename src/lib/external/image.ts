import { fetchWithTimeout } from "./fetchWithTimeout";

/**
 * Find an association image for a word.
 * Primary source — Pixabay (requires a free PIXABAY_API_KEY),
 * fallback — Openverse (no key, freely licensed).
 *
 * For relevance: we don't take the first hit but the one whose
 * tags/title contain the exact search word. This avoids random photos.
 * Returns the image URL or null.
 */
export async function findImage(word: string): Promise<string | null> {
  const term = word.trim().toLowerCase();
  if (!term) return null;

  const fromPixabay = await fromPixabaySearch(term);
  if (fromPixabay) return fromPixabay;

  return fromOpenverse(term);
}

/** Whether the tags/title contain the search word (relevance check). */
function matchesTerm(text: string | undefined, term: string): boolean {
  if (!text) return false;
  const words = text.toLowerCase().split(/[\s,]+/);
  return words.includes(term);
}

async function fromPixabaySearch(term: string): Promise<string | null> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;

  try {
    const url =
      `https://pixabay.com/api/?key=${key}` +
      `&q=${encodeURIComponent(term)}` +
      `&image_type=photo&safesearch=true&order=popular&per_page=20&lang=en`;
    const res = await fetchWithTimeout(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      hits?: Array<{
        webformatURL?: string;
        previewURL?: string;
        tags?: string;
      }>;
    };
    const hits = data.hits ?? [];
    if (hits.length === 0) return null;

    // First look for a hit whose tags contain this exact word.
    const relevant = hits.find((h) => matchesTerm(h.tags, term));
    const chosen = relevant ?? hits[0];
    return chosen.webformatURL ?? chosen.previewURL ?? null;
  } catch {
    return null;
  }
}

async function fromOpenverse(term: string): Promise<string | null> {
  try {
    const url =
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(term)}` +
      `&page_size=20&mature=false`;
    const res = await fetchWithTimeout(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{
        thumbnail?: string;
        url?: string;
        title?: string;
        tags?: Array<{ name?: string }>;
      }>;
    };
    const results = data.results ?? [];
    if (results.length === 0) return null;

    const relevant = results.find((r) => {
      const tagText = (r.tags ?? []).map((t) => t.name).join(" ");
      return matchesTerm(r.title, term) || matchesTerm(tagText, term);
    });
    const chosen = relevant ?? results[0];
    return chosen.thumbnail ?? chosen.url ?? null;
  } catch {
    return null;
  }
}
