import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/types";

export const metadata: Metadata = {
  title: "English Words — вчимо англійські слова",
  description: "Додаток для вивчення англійських слів у формі карток та квізів",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initial language from the profile (if the user is authenticated).
  let initialLang: Language = "uk";
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", user.id)
        .single();
      if (data?.preferred_language === "en" || data?.preferred_language === "uk") {
        initialLang = data.preferred_language;
      }
    }
  } catch {
    /* ignore — keeps the default uk */
  }

  return (
    <html lang={initialLang}>
      <body className="min-h-screen">
        <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
