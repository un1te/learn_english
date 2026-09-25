"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/lib/i18n/LanguageSwitcher";

/** Page header with a "Back" button and a language switcher. */
export default function PageHeader({ titleKey }: { titleKey: string }) {
  const { t } = useI18n();
  return (
    <header className="mb-8 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-brand-800">{t(titleKey)}</h1>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <a
          href="/dashboard"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {t("common.back")}
        </a>
      </div>
    </header>
  );
}
