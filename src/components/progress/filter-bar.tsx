"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/field";
import { useT } from "@/i18n/provider";
import type { YearOpt, SectionMeta } from "@/lib/data/scope";

export function FilterBar({
  years, sectionMeta, yearId, sectionId, subjectId,
}: {
  years: YearOpt[];
  sectionMeta: SectionMeta[];
  yearId: number;
  sectionId: number;
  subjectId: number | null;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const current = sectionMeta.find((s) => s.id === sectionId) ?? sectionMeta[0];
  const subjectOptions = current?.subjects ?? [];

  function update(patch: Record<string, string>, resetSubject = false) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) { if (v) next.set(k, v); else next.delete(k); }
    if (resetSubject) next.delete("subject");
    next.delete("studentId");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-md border border-hair bg-surface p-3 shadow-[var(--shadow-card)]">
      <div className="min-w-[140px] flex-1">
        <label className="t-label mb-1 block">{t("common.year")}</label>
        <Select value={yearId} onChange={(e) => update({ year: e.target.value })}>
          {years.map((y) => (<option key={y.id} value={y.id}>{y.name}{y.is_current ? " ★" : ""}</option>))}
        </Select>
      </div>
      <div className="min-w-[170px] flex-1">
        <label className="t-label mb-1 block">{t("common.section")}</label>
        <Select value={sectionId} onChange={(e) => update({ section: e.target.value }, true)}>
          {sectionMeta.map((s) => (
            <option key={s.id} value={s.id}>{s.label}{s.isClassTeacher ? " · " + t("dashboard.myClass") : ""}</option>
          ))}
        </Select>
      </div>
      <div className="min-w-[160px] flex-1">
        <label className="t-label mb-1 block">{t("common.subject")}</label>
        <Select value={subjectId ?? ""} onChange={(e) => update({ subject: e.target.value })}>
          <option value="">{current?.isClassTeacher ? t("common.all") : t("common.all")}</option>
          {subjectOptions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </Select>
      </div>
    </div>
  );
}
