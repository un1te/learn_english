"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  emailFromUsername,
  normalizeUsername,
} from "@/lib/auth/emailFromUsername";

export interface AuthState {
  error?: string;
}

/** Registration by name + password. */
export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const rawUsername = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const username = rawUsername.trim();

  if (!username) return { error: "Введіть імʼя" };
  if (!password) return { error: "Введіть пароль" };
  if (password.length < 6)
    return { error: "Пароль має містити щонайменше 6 символів" };

  const supabase = await createClient();
  const normalized = normalizeUsername(username);
  const email = emailFromUsername(username);

  // Register with Supabase Auth. The profile is created automatically
  // by the on_auth_user_created trigger (see migration) using the username from metadata.
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: normalized } },
  });

  if (signUpError) {
    return { error: "Не вдалося зареєструватися. Можливо, імʼя вже зайняте." };
  }

  redirect("/dashboard");
}

/** Sign in by name + password. */
export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const rawUsername = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const username = rawUsername.trim();

  if (!username) return { error: "Введіть імʼя" };
  if (!password) return { error: "Введіть пароль" };

  const supabase = await createClient();
  const email = emailFromUsername(username);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Невірне імʼя або пароль" };
  }

  redirect("/dashboard");
}

/** Sign out. */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
