import type { QuizQuestion, QuizType, Word } from "@/lib/types";

/** Shuffles an array (Fisher–Yates). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Fallback distractors taken from the user's dictionary.
 * Used only when the cache of meaning-based options (from the
 * internet) is missing or insufficient.
 */
function fallbackFromPool(
  target: Word,
  pool: Word[],
  pick: (w: Word) => string,
  exclude: Set<string>
): string[] {
  const others = shuffle(pool.filter((w) => w.id !== target.id));
  const result: string[] = [];
  for (const w of others) {
    const val = pick(w);
    const key = val.toLowerCase();
    if (exclude.has(key)) continue;
    exclude.add(key);
    result.push(val);
    if (result.length >= 3) break;
  }
  return result;
}

/**
 * Builds a single quiz question of the given type.
 * en-ua: show the English word, options are Ukrainian translations.
 * ua-en: show the Ukrainian translation, options are English words.
 *
 * Distractors come from the CACHE (meaning-based options generated
 * when the word was added). If the cache is insufficient, we top up
 * with words from the dictionary.
 * Returns null if 4 distinct options cannot be assembled.
 */
export function buildQuestion(
  target: Word,
  pool: Word[],
  type: QuizType
): QuizQuestion | null {
  const pick =
    type === "en-ua"
      ? (w: Word) => w.translation_uk
      : (w: Word) => w.english;
  const prompt = type === "en-ua" ? target.english : target.translation_uk;
  const answer = pick(target);

  // 1) Cached distractors (meaning-based).
  const cached =
    type === "en-ua" ? target.distractors_uk : target.distractors_en;

  const exclude = new Set<string>([answer.toLowerCase()]);
  const distractors: string[] = [];

  for (const d of shuffle(cached ?? [])) {
    const key = d.trim().toLowerCase();
    if (!key || exclude.has(key)) continue;
    exclude.add(key);
    distractors.push(d);
    if (distractors.length >= 3) break;
  }

  // 2) Fallback from the dictionary if the cache was insufficient.
  if (distractors.length < 3) {
    distractors.push(...fallbackFromPool(target, pool, pick, exclude));
  }

  if (distractors.length < 3) return null;

  const options = shuffle([answer, ...distractors.slice(0, 3)]);
  return { wordId: target.id, type, prompt, options, answer };
}
