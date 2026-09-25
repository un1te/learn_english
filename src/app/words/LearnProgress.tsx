"use client";

/**
 * Learning progress indicator shaped like a 3-bar battery gauge.
 * Level is based on correct_streak (0–3):
 *   1 → one red bar
 *   2 → two yellow bars
 *   3 → three green bars (word is learned)
 * Empty bars are gray.
 */
export default function LearnProgress({
  streak,
  title,
}: {
  streak: number;
  title?: string;
}) {
  const level = Math.max(0, Math.min(3, streak));

  // Fill color depends on the reached level.
  const fill =
    level >= 3
      ? "bg-green-500"
      : level === 2
        ? "bg-yellow-400"
        : level === 1
          ? "bg-red-500"
          : "bg-slate-200";

  return (
    <div
      className="flex items-end gap-0.5"
      title={title}
      aria-label={`${level}/3`}
      role="img"
    >
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={`w-1.5 rounded-sm ${bar <= level ? fill : "bg-slate-200"}`}
          // Battery-style: bars grow in height.
          style={{ height: `${6 + bar * 4}px` }}
        />
      ))}
    </div>
  );
}
