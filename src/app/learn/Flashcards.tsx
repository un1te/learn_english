"use client";

import { useState } from "react";
import type { Word } from "@/lib/types";
import { speak } from "@/lib/speech";
import { useI18n } from "@/lib/i18n/LanguageProvider";

export default function Flashcards({ words }: { words: Word[] }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (words.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow ring-1 ring-brand-100">
        <p className="text-lg text-slate-600">{t("learn.allLearned")}</p>
        <p className="mt-2 text-sm text-slate-500">
          Додайте нові слова у словнику або перевірте знання у квізі.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <a
            href="/words"
            className="rounded-xl bg-brand-600 px-4 py-2 font-medium text-white"
          >
            До словника
          </a>
          <a
            href="/quiz"
            className="rounded-xl bg-white px-4 py-2 font-medium text-brand-700 ring-1 ring-brand-200"
          >
            До квізу
          </a>
        </div>
      </div>
    );
  }

  const word = words[index];

  function next() {
    setFlipped(false);
    setIndex((i) => (i + 1) % words.length);
  }

  function prev() {
    setFlipped(false);
    setIndex((i) => (i - 1 + words.length) % words.length);
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-sm text-slate-500">
        {index + 1} / {words.length}
      </div>

      {/* Card */}
      <div
        className={`card-flip h-72 w-full max-w-md cursor-pointer ${
          flipped ? "flipped" : ""
        }`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="card-flip-inner">
          {/* Front side — English word + image */}
          <div className="card-face flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-6 shadow-lg ring-1 ring-brand-100">
            {word.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={word.image_url}
                alt={word.english}
                className="h-28 w-28 rounded-2xl object-cover"
              />
            )}
            <div className="text-3xl font-bold text-brand-800">
              {word.english}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(word.english);
              }}
              className="rounded-full bg-brand-50 px-4 py-2 text-brand-700 hover:bg-brand-100"
              aria-label="Listen"
            >
              {t("learn.listen")}
            </button>
            <div className="text-xs text-slate-400">
              {t("learn.tapToTranslate")}
            </div>
          </div>

          {/* Back side — Ukrainian translation */}
          <div className="card-face card-face-back flex flex-col items-center justify-center gap-3 rounded-3xl bg-brand-600 p-6 text-white shadow-lg">
            <div className="text-3xl font-bold">{word.translation_uk}</div>
            <div className="text-sm text-brand-100">{word.english}</div>
            <div className="text-xs text-brand-200">
              {t("learn.tapToFlip")}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={prev}
          className="rounded-xl bg-white px-5 py-2 font-medium text-slate-600 shadow ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {t("learn.prev")}
        </button>
        <button
          onClick={next}
          className="rounded-xl bg-brand-600 px-5 py-2 font-medium text-white shadow hover:bg-brand-700"
        >
          {t("learn.next")}
        </button>
      </div>
    </div>
  );
}
