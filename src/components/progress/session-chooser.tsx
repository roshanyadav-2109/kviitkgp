import Link from "next/link";
import { cn } from "@/lib/utils";

export type YearOpt = { yearId: number; yearName: string; isCurrent: boolean };

// Session picker for the student's progress: "Lifetime" (full history in one)
// plus every academic year the pupil has records for.
export function SessionChooser({
  years,
  active,
  lifetimeLabel,
  childId,
}: {
  years: YearOpt[];
  active: string; // "lifetime" | "<yearId>"
  lifetimeLabel: string;
  childId?: number;
}) {
  const href = (session: string) => {
    const p = new URLSearchParams();
    p.set("session", session);
    if (childId) p.set("child", String(childId));
    return `/progress?${p.toString()}`;
  };
  const opts = [{ key: "lifetime", label: lifetimeLabel }, ...years.map((y) => ({ key: String(y.yearId), label: y.yearName }))];
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {opts.map((o) => {
        const isActive = active === o.key;
        return (
          <Link
            key={o.key}
            href={href(o.key)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-[13px] font-medium transition-colors",
              isActive ? "border-black bg-black text-white" : "border-hair bg-surface text-ink-900 hover:bg-panel",
            )}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
