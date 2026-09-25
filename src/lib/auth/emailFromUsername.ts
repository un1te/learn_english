/**
 * Sign-in uses only a name + password, no email.
 * For Supabase Auth we generate a stable, unique pseudo-email from the name.
 *
 * Names may contain Cyrillic and spaces, so the normalized name is
 * hex-encoded — this guarantees a valid email local part and no
 * collisions between different names.
 */
const DOMAIN =
  process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN?.trim() || "app.local";

/** Normalizes a name for comparison/storage (lowercase, trimmed). */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Encodes a string to hex (works in both browser and server). */
function toHex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Converts a username into a stable, unique pseudo-email. */
export function emailFromUsername(username: string): string {
  const normalized = normalizeUsername(username);
  const local = `u${toHex(normalized)}`;
  return `${local}@${DOMAIN}`;
}
