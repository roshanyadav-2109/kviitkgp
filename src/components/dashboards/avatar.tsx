import type { Gender } from "@/lib/session";
import { cn } from "@/lib/utils";

// A student "artifact": an initials avatar tinted by gender (female = gold,
// male = ink, other/unknown = panel). Plain component — server or client safe.
export function StudentAvatar({ name, gender, size = 40 }: { name: string; gender: Gender | null; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const tone =
    gender === "female" ? "bg-gold-500 text-ink-900" : gender === "male" ? "bg-ink-700 text-gold-100" : "bg-panel text-ink-700";
  return (
    <div
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={cn("flex shrink-0 items-center justify-center rounded-full font-medium leading-none", tone)}
    >
      {initials}
    </div>
  );
}
