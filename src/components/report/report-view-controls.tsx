"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/field";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type Row = { id: number; name: string };

// Staff choose WHAT to view/download: a whole-class overview or one student's
// report card. Embedded as the `extra` slot of ReportControls.
export function ReportViewControls({ view, students, studentId }: { view: "overview" | "student"; students: Row[]; studentId: number | null }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function push(patch: Record<string, string>, clear: string[] = []) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v) next.set(k, v); else next.delete(k); }
    for (const k of clear) next.delete(k);
    router.push(`${pathname}?${next.toString()}`);
  }

  const Toggle = ({ v, label }: { v: "overview" | "student"; label: string }) => (
    <button
      onClick={() => push({ view: v }, v === "overview" ? ["student"] : [])}
      aria-pressed={view === v}
      className={cn("h-10 rounded-sm px-3 text-[13px] font-medium transition-colors",
        view === v ? "bg-ink-900 text-gold-100" : "bg-panel text-ink-900 hover:bg-[rgb(37,99,235)]/[0.05]")}
    >
      {label}
    </button>
  );

  return (
    <>
      <div>
        <label className="t-label mb-1 block">{t("x.reportWhat")}</label>
        <div className="flex gap-1.5">
          <Toggle v="overview" label={t("x.reportOverview")} />
          <Toggle v="student" label={t("x.reportStudent")} />
        </div>
      </div>
      {view === "student" && (
        <div className="min-w-[180px]">
          <label className="t-label mb-1 block">{t("x.reportStudent")}</label>
          <Select value={studentId ?? ""} onChange={(e) => push({ student: e.target.value })}>
            <option value="" disabled>{t("x.reportPickStudent")}</option>
            {students.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </Select>
        </div>
      )}
    </>
  );
}
