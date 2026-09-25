"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Word } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { speak } from "@/lib/speech";
import LearnProgress from "./LearnProgress";

export default function WordList({ words }: { words: Word[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unlearningId, setUnlearningId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/words/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  // Remove a word from "learned" so it can be practised again.
  // (Marking as learned manually is not possible — only via the quiz.)
  async function unlearn(id: string) {
    setUnlearningId(id);
    try {
      await fetch(`/api/words/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_learned: false }),
      });
      router.refresh();
    } finally {
      setUnlearningId(null);
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

          {/* Learning progress (battery-style 3 bars) */}
          <LearnProgress
            streak={w.is_learned ? 3 : w.correct_streak}
            title={t("words.progressHint")}
          />

          {/* Pronunciation */}
          <button
            onClick={() => speak(w.english)}
            className="rounded-lg px-2 py-1 text-brand-600 hover:bg-brand-50"
            aria-label={t("learn.listen")}
            title={t("learn.listen")}
          >
            🔊
          </button>

          {/*
            "Learned" status.
            - Learned word → clickable badge to REMOVE it from learned.
            - Not-learned word → static badge (can't mark as learned by hand;
              that only happens through the quiz).
          */}
          {w.is_learned ? (
            <button
              onClick={() => unlearn(w.id)}
              disabled={unlearningId === w.id}
              title={t("words.unlearnHint")}
              className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 transition hover:bg-green-200 disabled:opacity-50"
            >
              ✓ {t("words.learnedBadge")}
            </button>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              {t("words.learningBadge")}
            </span>
          )}

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
