"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { speak } from "@/lib/speech";

interface MatchCard {
  wordId: string;
  english: string;
  translation: string;
}

type Status = "loading" | "playing" | "finished" | "error" | "not_enough";

/** Shuffle helper (Fisher–Yates). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Side = "en" | "uk";

export default function MatchGame() {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("loading");
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [enOrder, setEnOrder] = useState<MatchCard[]>([]);
  const [ukOrder, setUkOrder] = useState<MatchCard[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  // Words that were mismatched at least once (counted as an error).
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);

  // Current selection on each side (by wordId).
  const [selEn, setSelEn] = useState<string | null>(null);
  const [selUk, setSelUk] = useState<string | null>(null);
  // Transient wrong-pair highlight.
  const [wrong, setWrong] = useState<{ en: string; uk: string } | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setMatched(new Set());
    setMistakes(new Set());
    setScore(0);
    setSelEn(null);
    setSelUk(null);
    setWrong(null);
    try {
      const res = await fetch("/api/match/session", { cache: "no-store" });
      if (res.status === 422) {
        setStatus("not_enough");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();
      const list = (data.cards ?? []) as MatchCard[];
      setCards(list);
      setEnOrder(shuffle(list));
      setUkOrder(shuffle(list));
      setStatus("playing");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // When both sides are selected, evaluate the pair.
  useEffect(() => {
    if (!selEn || !selUk) return;

    if (selEn === selUk) {
      // Correct match. It counts toward the score only if this word
      // was never mismatched before.
      const id = selEn;
      const hadMistake = mistakes.has(id);
      setMatched((prev) => new Set(prev).add(id));
      if (!hadMistake) setScore((s) => s + 1);
      setSelEn(null);
      setSelUk(null);
      // Record rating: correct only if solved without any mistake.
      void fetch("/api/quiz/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: id, correct: !hadMistake }),
      }).catch(() => {});
    } else {
      // Wrong match. Mark the chosen ENGLISH word as mistaken: it is
      // now locked (can't be picked again), stays highlighted, does not
      // score, and records a wrong answer for its rating.
      const enId = selEn;
      setMistakes((prev) => {
        if (prev.has(enId)) return prev;
        const next = new Set(prev);
        next.add(enId);
        void fetch("/api/quiz/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wordId: enId, correct: false }),
        }).catch(() => {});
        return next;
      });
      // Brief red flash, then clear BOTH selections so the game continues.
      setWrong({ en: selEn, uk: selUk });
      const timer = setTimeout(() => {
        setWrong(null);
        setSelEn(null);
        setSelUk(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [selEn, selUk, mistakes]);

  // Finish when every card is resolved (matched or mistaken).
  useEffect(() => {
    if (
      status === "playing" &&
      cards.length > 0 &&
      matched.size + mistakes.size === cards.length
    ) {
      const timer = setTimeout(() => setStatus("finished"), 400);
      return () => clearTimeout(timer);
    }
  }, [matched, mistakes, cards.length, status]);

  if (status === "loading") {
    return <p className="text-center text-slate-500">{t("common.loading")}</p>;
  }

  if (status === "not_enough") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow ring-1 ring-brand-100">
        <p className="text-lg text-slate-600">{t("match.needWords")}</p>
        <a
          href="/words"
          className="mt-4 inline-block rounded-xl bg-brand-600 px-4 py-2 font-medium text-white"
        >
          {t("words.add")}
        </a>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center">
        <p className="text-red-600">⚠️</p>
        <button
          onClick={load}
          className="mt-3 rounded-xl bg-brand-600 px-4 py-2 font-medium text-white"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div className="flex flex-col items-center gap-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg ring-1 ring-brand-100">
          <div className="text-5xl">🎉</div>
          <div className="mt-3 text-xl font-bold text-brand-800">
            {t("match.resultTitle")}
          </div>
          <div className="mt-2 text-2xl font-bold text-green-600">
            {score} / {cards.length}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white shadow hover:bg-brand-700"
          >
            {t("match.playAgain")}
          </button>
          <a
            href="/dashboard"
            className="rounded-xl bg-white px-6 py-2.5 font-semibold text-brand-700 shadow ring-1 ring-brand-200 hover:bg-brand-50"
          >
            {t("match.exit")}
          </a>
        </div>
      </div>
    );
  }

  // --- Playing ---
  // A card is "locked" once its word is resolved: either matched
  // correctly or marked as a mistake. Locked cards can't be picked.
  const isLocked = (id: string) => matched.has(id) || mistakes.has(id);

  function cardClass(side: Side, id: string): string {
    const isMatched = matched.has(id);
    const isMistaken = mistakes.has(id);
    const isSelected = side === "en" ? selEn === id : selUk === id;
    const isWrong =
      wrong && (side === "en" ? wrong.en === id : wrong.uk === id);

    let cls =
      "flex-1 rounded-xl px-3 py-4 text-center text-sm font-medium transition select-none ";
    if (isMatched) {
      cls +=
        "cursor-default border border-green-300 bg-green-50 text-green-600 opacity-60";
    } else if (isWrong) {
      cls += "border border-red-400 bg-red-50 text-red-600";
    } else if (isMistaken) {
      // Locked mistaken word (both its English card and translation).
      cls +=
        "cursor-default border border-amber-400 bg-amber-50 text-amber-700 opacity-70";
    } else if (isSelected) {
      cls += "border-2 border-brand-500 bg-brand-50 text-brand-700";
    } else {
      cls +=
        "cursor-pointer border border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:bg-brand-50";
    }
    return cls;
  }

  function pick(side: Side, id: string) {
    if (isLocked(id) || wrong) return;
    if (side === "en") setSelEn((cur) => (cur === id ? null : id));
    else setSelUk((cur) => (cur === id ? null : id));
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-sm text-slate-500">
        {t("match.score")}: {score} / {cards.length}
      </div>
      <p className="text-xs text-slate-400">{t("match.hint")}</p>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
        {/* English column — card + separate speak icon */}
        <div className="flex flex-col gap-3">
          {enOrder.map((c) => (
            <div key={`en-${c.wordId}`} className="flex items-center gap-1">
              <button
                onClick={() => pick("en", c.wordId)}
                disabled={isLocked(c.wordId)}
                className={cardClass("en", c.wordId)}
              >
                {c.english}
              </button>
              <button
                onClick={() => speak(c.english)}
                className="shrink-0 rounded-lg px-2 py-1 text-brand-600 hover:bg-brand-50"
                aria-label={t("learn.listen")}
                title={t("learn.listen")}
              >
                🔊
              </button>
            </div>
          ))}
        </div>

        {/* Translation column */}
        <div className="flex flex-col gap-3">
          {ukOrder.map((c) => (
            <button
              key={`uk-${c.wordId}`}
              onClick={() => pick("uk", c.wordId)}
              disabled={isLocked(c.wordId)}
              className={cardClass("uk", c.wordId)}
            >
              {c.translation}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
