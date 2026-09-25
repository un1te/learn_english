"use client";

import { useI18n } from "./LanguageProvider";

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "uk" ? "en" : "uk")}
      className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-brand-700 shadow ring-1 ring-brand-200 hover:bg-brand-50"
      aria-label="Switch language"
    >
      {lang === "uk" ? "EN" : "UA"}
    </button>
  );
}
