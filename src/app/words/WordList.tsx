"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Word } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { speak } from "@/lib/speech";

export default function WordList({ words }: { words: Word[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/words/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleLearned(word: Word) {
    setTogglingId(word.id);
    try {
      await fetch(`/api/words/${word.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_learned: !word.is_learned }),
      });
      router.refresh();
    } finally {
      setTogglingId(null);
    }
  }

  if (words.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow ring-1 ring-brand-100">
        {t("words.empty")}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {words.map((w) => (
        <li
          key={w.id}
          className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100"
        >
          {w.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={w.image_url}
              alt={w.english}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-xl">
              🔤
            </div>
          )}

          <div className="flex-1">
            <div className="font-semibold text-slate-800">{w.english}</div>
            <div className="text-sm text-slate-500">{w.translation_uk}</div>
          </div>

          {/* Pronunciation */}
          <button
            onClick={() => speak(w.english)}
            className="rounded-lg px-2 py-1 text-brand-600 hover:bg-brand-50"
            aria-label={t("learn.listen")}
            title={t("learn.listen")}
          >
            🔊
          </button>

          {/* "Learned" toggle — clickable badge */}
          <button
            onClick={() => toggleLearned(w)}
            disabled={togglingId === w.id}
            title={t("words.toggleLearned")}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
              w.is_learned
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {w.is_learned ? `✓ ${t("words.learnedBadge")}` : t("words.learningBadge")}
          </button>

          <button
            onClick={() => remove(w.id)}
            disabled={deletingId === w.id}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="Видалити"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
