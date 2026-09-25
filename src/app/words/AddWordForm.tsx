"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function AddWordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [english, setEnglish] = useState("");
  const [translation, setTranslation] = useState("");
  const [category, setCategory] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          category,
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
      setCategory("");
      setSuggestions([]);
      setPendingConfirm(false);
      router.refresh();
    } catch {
      setError("Помилка мережі");
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
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          value={english}
          onChange={(e) => {
            setEnglish(e.target.value);
            setPendingConfirm(false);
            setSuggestions([]);
          }}
          required
          placeholder={t("words.englishWord")}
          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <input
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          required
          placeholder={t("words.translation")}
          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t("words.category")}
          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
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
