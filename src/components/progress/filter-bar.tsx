"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/field";
import { useT } from "@/i18n/provider";
import type { YearOpt, SectionMeta, ClassOpt, SubjectOpt } from "@/lib/data/scope";

export function FilterBar({
  years, classes, sectionMeta, subjects, yearId, level, scopeId, subjectId,
}: {
  years: YearOpt[];
  classes: ClassOpt[];
  sectionMeta: SectionMeta[];
  subjects: SubjectOpt[];
  yearId: number;
  level: "class" | "section";
  scopeId: number;
  subjectId: number | null;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const subjectOptions =
    level === "class" ? subjects : (sectionMeta.find((s) => s.id === scopeId)?.subjects ?? []);

  function push(next: URLSearchParams) {
    next.delete("studentId");
    router.push(`${pathname}?${next.toString()}`);
  }
  function setYear(v: string) {
    const next = new URLSearchParams(params.toString());
    next.set("year", v);
    push(next);
  }
  function setScope(value: string) {
    const [kind, id] = value.split(":");
    const next = new URLSearchParams(params.toString());
    next.delete("subject");
    if (kind === "class") { next.set("class", id); next.delete("section"); }
    else { next.set("section", id); next.delete("class"); }
    push(next);
  }
  function setSubject(v: string) {
    const next = new URLSearchParams(params.toString());
    if (v) next.set("subject", v); else next.delete("subject");
    push(next);
  }

  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-md border border-hair bg-surface p-3 shadow-[var(--shadow-card)]">
      <div className="min-w-[140px] flex-1">
        <label className="t-label mb-1 block">{t("common.year")}</label>
        <Select value={yearId} onChange={(e) => setYear(e.target.value)}>
          {years.map((y) => (<option key={y.id} value={y.id}>{y.name}{y.is_current ? " ★" : ""}</option>))}
        </Select>
      </div>
      <div className="min-w-[200px] flex-1">
        <label className="t-label mb-1 block">{t("common.class")} / {t("common.section")}</label>
        <Select value={`${level}:${scopeId}`} onChange={(e) => setScope(e.target.value)}>
          <optgroup label={t("dashboard.myClass") + " · " + t("common.all")}>
            {classes.map((c) => (<option key={"c" + c.id} value={`class:${c.id}`}>{c.name} · {t("common.all")}</option>))}
          </optgroup>
          <optgroup label={t("common.section")}>
            {sectionMeta.map((s) => (<option key={"s" + s.id} value={`section:${s.id}`}>{s.label}{s.isClassTeacher ? " ★" : ""}</option>))}
          </optgroup>
        </Select>
      </div>
      <div className="min-w-[160px] flex-1">
        <label className="t-label mb-1 block">{t("common.subject")}</label>
        <Select value={subjectId ?? ""} onChange={(e) => setSubject(e.target.value)}>
          <option value="">{t("common.all")}</option>
          {subjectOptions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </Select>
      </div>
    </div>
  );
}
