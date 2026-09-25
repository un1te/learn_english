"use client";

/**
 * Pronounce an English word.
 * 1) Primary — Web Speech API (SpeechSynthesis), free, no API keys.
 * 2) Fallback — the free Google Translate TTS endpoint (audio) when
 *    no EN voice is available in the browser.
 */
export function speak(word: string): void {
  const text = word.trim();
  if (!text) return;

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 0.9;

      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
      if (enVoice) utter.voice = enVoice;

      // If no EN voice is available — go straight to fallback.
      if (!enVoice && voices.length > 0) {
        playFallback(text);
        return;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      return;
    } catch {
      playFallback(text);
      return;
    }
  }

  playFallback(text);
}

/** Fallback pronunciation via a free TTS endpoint. */
function playFallback(text: string): void {
  try {
    const url =
      `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=` +
      encodeURIComponent(text);
    const audio = new Audio(url);
    void audio.play();
  } catch {
    // silently ignore — pronunciation is not critical
  }
}
