export type Language = "uk" | "en";

export interface Profile {
  id: string;
  username: string;
  preferred_language: Language;
  created_at: string;
}

export interface Word {
  id: string;
  user_id: string;
  english: string;
  translation_uk: string;
  category: string | null;
  image_url: string | null;
  is_learned: boolean;
  correct_streak: number;
  /** Cumulative quiz answer counters — drive word "rating" ordering */
  correct_count: number;
  wrong_count: number;
  /** Cached wrong options for the quiz (meaning-based) */
  distractors_uk: string[];
  distractors_en: string[];
  created_at: string;
  updated_at: string;
}

export type QuizType = "en-ua" | "ua-en";

export interface QuizQuestion {
  wordId: string;
  type: QuizType;
  /** The word being shown (English for en-ua, Ukrainian for ua-en) */
  prompt: string;
  /** Answer options (translations for en-ua, English words for ua-en) */
  options: string[];
  /** The correct option among the options */
  answer: string;
}

export interface SpellcheckResult {
  ok: boolean;
  /** Suggestions if the word was not found */
  suggestions: string[];
}
