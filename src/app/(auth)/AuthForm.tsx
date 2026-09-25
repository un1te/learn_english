"use client";

import { useActionState } from "react";
import type { AuthState } from "./actions";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import LanguageSwitcher from "@/lib/i18n/LanguageSwitcher";

interface Props {
  mode: "login" | "register";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}

export default function AuthForm({ mode, action }: Props) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {}
  );

  const isLogin = mode === "login";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <a href="/" className="text-2xl font-bold text-brand-800">
        English Words 📚
      </a>

      <form
        action={formAction}
        className="w-full space-y-4 rounded-2xl bg-white p-6 shadow ring-1 ring-brand-100"
      >
        <h1 className="text-center text-xl font-semibold text-slate-800">
          {isLogin ? t("auth.login") : t("auth.register")}
        </h1>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">
            {t("auth.username")}
          </span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            placeholder={t("auth.usernamePlaceholder")}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-600">
            {t("auth.password")}
          </span>
          <input
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            placeholder="••••••"
          />
        </label>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60"
        >
          {pending
            ? t("auth.wait")
            : isLogin
              ? t("auth.signIn")
              : t("auth.signUp")}
        </button>

        <p className="text-center text-sm text-slate-500">
          {isLogin ? (
            <>
              {t("auth.noAccount")}{" "}
              <a href="/register" className="font-medium text-brand-600">
                {t("auth.register")}
              </a>
            </>
          ) : (
            <>
              {t("auth.haveAccount")}{" "}
              <a href="/login" className="font-medium text-brand-600">
                {t("auth.signIn")}
              </a>
            </>
          )}
        </p>
      </form>
    </main>
  );
}
