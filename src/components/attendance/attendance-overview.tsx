import { getT } from "@/i18n/server";
import { fmtDate } from "@/i18n/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DateParam } from "@/components/attendance/date-param";

type Overview = Awaited<ReturnType<typeof import("@/lib/data/attendance").getAttendanceOverview>>;

// Aggregate attendance for principal/office: school-wide + class-wise totals of
// students attended on a given day (no per-pupil marking board).
export async function AttendanceOverview({ overview, date }: { overview: Overview; date: string }) {
  const { t, locale } = await getT();
  const s = overview.school;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-md border border-hair bg-surface p-3 shadow-[var(--shadow-card)]">
        <div className="min-w-[170px]">
          <label className="t-label mb-1 block">{t("attendance.date")}</label>
          <DateParam date={date} />
        </div>
      </div>

      {/* School-wide */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-md border border-hair bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="t-label">{t("x.schoolWide")} · {t("x.attended")}</div>
          <div className="mt-1 text-[34px] font-bold leading-none tabular text-ink-900">
            {s.present}<span className="text-[18px] text-muted"> / {s.total}</span>
          </div>
          <div className="mt-1.5 text-[12px] text-muted">{fmtDate(locale, date)}</div>
        </div>
        <div className="rounded-md border border-hair bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="t-label">{t("attendance.percent")}</div>
          <div className={`mt-1 text-[34px] font-bold leading-none tabular ${s.pct != null && s.pct < 75 ? "text-down" : "text-up"}`}>
            {s.pct != null ? `${s.pct}%` : "—"}
          </div>
        </div>
      </div>

      {/* Class-wise */}
      <Card>
        <CardHeader eyebrow={t("x.classWise")} title={t("x.attendanceOverview")} />
        <CardBody className="space-y-3 pt-2">
          {overview.classes.length ? (
            overview.classes.map((c) => (
              <div key={c.id} className="rounded-md border border-hair p-3">
                <div className="flex items-center justify-between">
                  <span className="t-h3 text-ink-900">{t("common.class")} {c.name}</span>
                  <span className="flex items-center gap-2 text-[14px] font-semibold tabular text-ink-900">
                    {c.present} / {c.total}
                    <span className={`rounded-xs px-1.5 py-0.5 text-[12px] ${c.pct != null && c.pct < 75 ? "bg-down-soft text-down" : "bg-up-soft text-up"}`}>
                      {c.pct != null ? `${c.pct}%` : "—"}
                    </span>
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.sections.map((sec, i) => (
                    <span key={i} className="rounded-sm border border-hair bg-panel/40 px-2 py-1 text-[12px] tabular text-ink-700">
                      {c.name}-{sec.name}: {sec.present}/{sec.total} ({sec.pct != null ? `${sec.pct}%` : "—"})
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="py-2 text-[14px] text-ink-500">{t("common.noData")}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
