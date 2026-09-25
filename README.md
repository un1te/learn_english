# English Words 📚

A web app that helps a child learn English words: a personal dictionary,
flip flashcards, a translation quiz, and manual control over what is learned.

Stack: **Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase**.
Hosted for free on **Vercel + Supabase Free**.

## Features

- Simple registration/sign-in by **name + password** (no email).
- Personal dictionary with spellcheck and suggestions.
- Automatic association image lookup for a word (Pixabay / Openverse).
- **Learn** mode — flip flashcards with pronunciation (Web Speech API).
- **Quiz** mode — two directions (EN→UA and UA→EN) with meaning-based options.
- A word becomes **learned** after 3 correct answers in a row.
- Meaning-based wrong options are generated from the internet and cached per word.
- Manual **"learned" toggle** in the dictionary — flip a word back to review it.
- UI in Ukrainian / English (switcher in the header).

---

## 1. Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values (see below)
npm run dev                  # http://localhost:3000
```

## 2. Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
   then [`supabase/migrations/0002_distractors.sql`](supabase/migrations/0002_distractors.sql).
   This creates the `profiles` and `words` tables, RLS policies, the
   `answer_quiz` / `forget_random` functions, the profile auto-create
   trigger, and the distractor cache columns.
3. **Authentication → Providers → Email**: enable the Email provider.
4. **Authentication → Sign In / Providers** (or **Settings**):
   **DISABLE email confirmation** ("Confirm email"). This is required —
   the app uses internal pseudo-emails like `u<hex>@app.local`, and
   confirmation messages go nowhere.
5. **Project Settings → API**: copy the `Project URL` and the `anon public` key.

> The password must be at least 6 characters — a Supabase Auth limitation.

## 3. Environment variables

Create `.env.local` (locally) and add the same variables in Vercel:

| Variable | Description | Required |
|----------|-------------|:--------:|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL from Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | ✅ |
| `PIXABAY_API_KEY` | [Pixabay API](https://pixabay.com/api/docs/) key for images | ⬜ (Openverse works without it) |
| `NEXT_PUBLIC_AUTH_EMAIL_DOMAIN` | pseudo-email domain (defaults to `app.local`) | ⬜ |

`SUPABASE_SERVICE_ROLE_KEY` is not currently used (all operations run
under RLS on the user's behalf), so it can be left unset.

## 4. Deploy to Vercel

1. Push the code to a Git repository (GitHub / GitLab).
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
   Vercel detects Next.js automatically.
3. Under **Environment Variables** add the variables from the table above.
4. **Deploy**. After the build you get a public URL like
   `https://your-app.vercel.app` — share it with the child.

Updates deploy automatically on every push to the branch.

---

## Project structure

```
src/
  app/
    (auth)/            sign-in, registration, server actions
    api/               route handlers (words, quiz, user/language)
    dashboard/         home screen + stats + backfill
    learn/             flip flashcards
    quiz/              quiz
    words/             dictionary
    layout.tsx         root + LanguageProvider
  components/          PageHeader
  lib/
    auth/              pseudo-email from name
    external/          dictionary (spellcheck), image, distractors
    i18n/              UA/EN translations, provider, switcher
    supabase/          clients (browser, server)
    quiz.ts            question generation + distractors
    speech.ts          pronunciation (Web Speech API + fallback)
    types.ts           types
  middleware.ts        route protection + session refresh
supabase/
  migrations/0001_init.sql          DB schema
  migrations/0002_distractors.sql   distractor cache columns
```

## How learning works

- New word: `is_learned = false`, `correct_streak = 0`.
- Correct answer in the quiz → `correct_streak + 1`; wrong → `0`.
- `correct_streak >= 3` → the word becomes `is_learned = true`.
- Learned words are excluded from the quiz.
- In the dictionary you can toggle the "learned" flag manually; removing it
  resets `correct_streak` and the word returns to the quiz for review.

## How quiz options work

- When a word is added, meaning-based distractors are fetched from the
  internet ([Datamuse](https://www.datamuse.com/api/) for related English
  words, [MyMemory](https://mymemory.translated.net/) for Ukrainian
  translations) and cached on the word.
- The quiz uses these cached options; the dictionary is only a fallback.
- For words added before this feature, use the "Refresh quiz options"
  button on the dashboard to backfill their distractors.

## Known limitations

- **Supabase Free** "sleeps" after 7 days of inactivity — the first request
  after a pause is slower; data is not lost.
- **Pronunciation** via Web Speech API depends on device voices; when none
  are available, a fallback online TTS is used.
- External APIs (dictionary, images, distractors) have rate limits; when
  unavailable, the app keeps working without suggestions/images.
- `npm audit` reports a vulnerability in a transitive `postcss` nested in
  `next`. Direct dependencies are safe; a full fix requires upgrading to
  Next 16 (breaking).
