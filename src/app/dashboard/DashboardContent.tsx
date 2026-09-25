"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/lib/i18n/LanguageSwitcher";
import BackfillButton from "./BackfillButton";
import { logoutAction } from "../(auth)/actions";

interface Props {
  username: string;
  totalCount: number;
  learnedCount: number;
  toLearn: number;
}

export default function DashboardContent({
  username,
  totalCount,
  learnedCount,
  toLearn,
}: Props) {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-800">
          {t("dash.greeting")}, {username}! 👋
        </h1>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <form action={logoutAction}>
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow ring-1 ring-slate-200 hover:bg-slate-50">
              {t("common.logout")}
            </button>
          </form>
        </div>
      </header>

      {/* Statistics */}
      <div className="mb-6 flex flex-wrap items-center gap-6 rounded-2xl bg-white p-5 shadow ring-1 ring-brand-100">
        <div>
          <div className="text-2xl font-bold text-brand-800">{totalCount}</div>
          <div className="text-xs text-slate-500">{t("dash.totalWords")}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">
            {learnedCount}
          </div>
          <div className="text-xs text-slate-500">{t("dash.learned")}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-amber-500">{toLearn}</div>
          <div className="text-xs text-slate-500">{t("dash.toLearn")}</div>
        </div>
        <div className="ml-auto">
          <BackfillButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <a
          href="/words"
          className="rounded-2xl bg-white p-6 shadow ring-1 ring-brand-100 hover:ring-brand-300"
        >
          <div className="text-3xl">📖</div>
          <div className="mt-2 font-semibold text-slate-800">
            {t("dash.myDictionary")}
          </div>
          <div className="text-sm text-slate-500">
            {t("dash.myDictionaryHint")}
          </div>
        </a>
        <a
          href="/learn"
          className="rounded-2xl bg-white p-6 shadow ring-1 ring-brand-100 hover:ring-brand-300"
        >
          <div className="text-3xl">🃏</div>
          <div className="mt-2 font-semibold text-slate-800">
            {t("dash.learn")}
          </div>
          <div className="text-sm text-slate-500">{t("dash.learnHint")}</div>
        </a>
        <a
          href="/quiz"
          className="rounded-2xl bg-white p-6 shadow ring-1 ring-brand-100 hover:ring-brand-300"
        >
          <div className="text-3xl">✅</div>
          <div className="mt-2 font-semibold text-slate-800">
            {t("dash.quiz")}
          </div>
          <div className="text-sm text-slate-500">{t("dash.quizHint")}</div>
        </a>
      </div>
    </main>
  );
}
