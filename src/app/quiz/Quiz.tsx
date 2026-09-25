"use client";

import { useCallback, useState } from "react";
import type { QuizQuestion, QuizType } from "@/lib/types";
import { speak } from "@/lib/speech";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type Status =
  | "choose"
  | "idle"
  | "loading"
  | "answered"
  | "error"
  | "not_enough"
  | "all_learned";

export default function Quiz() {
  const { t } = useI18n();
  const [mode, setMode] = useState<QuizType | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [status, setStatus] = useState<Status>("choose");
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const loadQuestion = useCallback(async (type: QuizType) => {
    setStatus("loading");
    setSelected(null);
    try {
      const res = await fetch(`/api/quiz?type=${type}`, { cache: "no-store" });
      if (res.status === 422) {
        const data = await res.json().catch(() => ({}));
        setStatus(data.error === "all_learned" ? "all_learned" : "not_enough");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();
      setQuestion(data.question);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, []);

  function start(type: QuizType) {
    setMode(type);
    setCorrectCount(0);
    setTotal(0);
    loadQuestion(type);
  }

  function backToChoose() {
    setMode(null);
    setQuestion(null);
    setStatus("choose");
  }

  async function choose(option: string) {
    if (status !== "idle" || !question) return;
    setSelected(option);
    setStatus("answered");

    const correct = option === question.answer;
    setTotal((n) => n + 1);
    if (correct) setCorrectCount((c) => c + 1);

    try {
      const res = await fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: question.wordId, correct }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.justLearned) {
        setToast(t("quiz.justLearned"));
        setTimeout(() => setToast(null), 2000);
      }
    } catch {
      // not critical for UX
    }
  }

  // --- Direction selection screen ---
  if (status === "choose") {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-slate-600">{t("quiz.chooseMode")}</p>
        <div className="grid w-full max-w-md gap-3">
          <button
            onClick={() => start("en-ua")}
            className="rounded-2xl bg-white p-6 text-left shadow ring-1 ring-brand-100 hover:ring-brand-300"
          >
            <div className="text-lg font-semibold text-brand-800">
              🇬🇧 → 🇺🇦 EN → UA
            </div>
            <div className="text-sm text-slate-500">
              {t("quiz.modeEnUaHint")}
            </div>
          </button>
          <button
            onClick={() => start("ua-en")}
            className="rounded-2xl bg-white p-6 text-left shadow ring-1 ring-brand-100 hover:ring-brand-300"
          >
            <div className="text-lg font-semibold text-brand-800">
              🇺🇦 → 🇬🇧 UA → EN
            </div>
            <div className="text-sm text-slate-500">
              {t("quiz.modeUaEnHint")}
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return <p className="text-center text-slate-500">{t("common.loading")}</p>;
  }

  if (status === "not_enough") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow ring-1 ring-brand-100">
        <p className="text-lg text-slate-600">{t("quiz.needWords")}</p>
        <a
          href="/words"
          className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 font-medium text-white"
        >
          {t("words.add")}
        </a>
      </div>
    );
  }

  if (status === "all_learned") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow ring-1 ring-brand-100">
        <p className="text-lg text-slate-600">{t("quiz.allLearned")}</p>
        <button
          onClick={backToChoose}
          className="mt-4 rounded-xl bg-white px-4 py-2 font-medium text-brand-700 ring-1 ring-brand-200"
        >
          {t("quiz.changeMode")}
        </button>
      </div>
    );
  }

  if (status === "error" || !question) {
    return (
      <div className="text-center">
        <p className="text-red-600">⚠️</p>
        <button
          onClick={() => mode && loadQuestion(mode)}
          className="mt-3 rounded-xl bg-brand-600 px-4 py-2 font-medium text-white"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  const isEnUa = question.type === "en-ua";

  return (
    <div className="flex flex-col items-center gap-6">
      {toast && (
        <div className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span>
          {t("quiz.correct")}: {correctCount} / {total}
        </span>
        <button
          onClick={backToChoose}
          className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 hover:bg-slate-200"
        >
          {t("quiz.changeMode")}
        </button>
      </div>

      {/* Question */}
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-brand-100">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-400">
          {isEnUa ? t("quiz.chooseTranslation") : t("quiz.chooseEnglish")}
        </div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-bold text-brand-800">
            {question.prompt}
          </span>
          {isEnUa && (
            <button
              onClick={() => speak(question.prompt)}
              className="rounded-full bg-brand-50 px-3 py-1 text-brand-700 hover:bg-brand-100"
              aria-label="Озвучити"
            >
              🔊
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((opt) => {
          const isAnswer = opt === question.answer;
          const isSelected = opt === selected;
          let cls =
            "rounded-2xl border px-4 py-4 text-center font-medium transition ";
          if (status === "answered") {
            if (isAnswer) cls += "border-green-500 bg-green-50 text-green-700";
            else if (isSelected)
              cls += "border-red-400 bg-red-50 text-red-600";
            else cls += "border-slate-200 bg-white text-slate-400";
          } else {
            cls +=
              "border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50";
          }
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={status === "answered"}
              className={cls}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {status === "answered" && (
        <button
          onClick={() => mode && loadQuestion(mode)}
          className="rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white shadow hover:bg-brand-700"
        >
          {t("quiz.nextQuestion")}
        </button>
      )}
    </div>
  );
}
