"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function AddWordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [english, setEnglish] = useState("");
  const [translation, setTranslation] = useState("");
  const [translating, setTranslating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-fill the translation when the English input loses focus,
  // but only if the user hasn't typed a translation themselves.
  async function autoTranslate() {
    const term = english.trim();
    if (!term || translation.trim()) return;
    setTranslating(true);
    try {
      const res = await fetch(
        `/api/words/translate?word=${encodeURIComponent(term)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (data.translation) setTranslation(data.translation);
    } catch {
      // ignore — user can type the translation manually
    } finally {
      setTranslating(false);
    }
  }

  async function submit(force: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          english,
          translation_uk: translation,
          force,
        }),
      });

      if (res.status === 422) {
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
        setPendingConfirm(true);
        setError(t("words.maybeMistake"));
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("words.add"));
        return;
      }

      // success — clear the form and refresh the list
      setEnglish("");
      setTranslation("");
      setSuggestions([]);
      setPendingConfirm(false);
      router.refresh();
    } catch {
      setError(t("common.retry"));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPendingConfirm(false);
    submit(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl bg-white p-5 shadow ring-1 ring-brand-100"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={english}
          onChange={(e) => {
            setEnglish(e.target.value);
            setPendingConfirm(false);
            setSuggestions([]);
          }}
          onBlur={autoTranslate}
          required
          placeholder={t("words.englishWord")}
          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <div className="relative">
          <input
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            required
            placeholder={t("words.translation")}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          {translating && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {t("words.translating")}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="text-sm text-slate-600">
          {t("words.didYouMean")}{" "}
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setEnglish(s);
                setSuggestions([]);
                setPendingConfirm(false);
              }}
              className="mr-2 rounded-md bg-brand-50 px-2 py-1 font-medium text-brand-700 hover:bg-brand-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-600 px-5 py-2 font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? t("words.adding") : t("words.add")}
        </button>

        {pendingConfirm && (
          <button
            type="button"
            disabled={loading}
            onClick={() => submit(true)}
            className="rounded-xl bg-white px-5 py-2 font-semibold text-brand-700 shadow ring-1 ring-brand-200 hover:bg-brand-50"
          >
            {t("words.addAnyway")}
          </button>
        )}
      </div>
    </form>
  );
}
