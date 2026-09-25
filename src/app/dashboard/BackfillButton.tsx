"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";

/**
 * Backfills quiz options (distractors) for words added earlier —
 * before auto-generation existed. Processes one batch per call.
 */
export default function BackfillButton() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/words/backfill-distractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // "all" — regenerate for every word so low-quality options
        // created earlier get refreshed, not just empty ones.
        body: JSON.stringify({ mode: "all" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(
          data.remaining > 0
            ? t("dash.backfillMore")
            : t("dash.backfillDone")
        );
      } else {
        setMessage(t("common.retry"));
      }
    } catch {
      setMessage(t("common.retry"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={run}
        disabled={loading}
        className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-brand-700 shadow ring-1 ring-brand-200 hover:bg-brand-50 disabled:opacity-50"
      >
        {loading ? t("common.loading") : t("dash.backfill")}
      </button>
      {message && <span className="text-xs text-slate-500">{message}</span>}
    </div>
  );
}
