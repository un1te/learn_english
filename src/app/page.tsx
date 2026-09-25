export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold text-brand-800">
        English Words 📚
      </h1>
      <p className="max-w-lg text-lg text-slate-600">
        Додаток для вивчення англійських слів: додавай слова, вчи їх картками
        та перевіряй знання у квізі.
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow hover:bg-brand-700"
        >
          Увійти
        </a>
        <a
          href="/register"
          className="rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow ring-1 ring-brand-200 hover:bg-brand-50"
        >
          Реєстрація
        </a>
      </div>
    </main>
  );
}
