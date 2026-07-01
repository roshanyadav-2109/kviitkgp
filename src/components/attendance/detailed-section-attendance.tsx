import { getT } from "@/i18n/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status";

type Detail = Awaited<ReturnType<typeof import("@/lib/data/attendance").getSectionAttendanceRange>>;

// Principal drill-down: per-student attendance for a section. Day mode shows
// present/absent; month mode shows the attendance % over the period.
export async function DetailedSectionAttendance({ students, period, sectionLabel }: {
  students: Detail;
  period: "day" | "month";
  sectionLabel: string;
}) {
  const { t } = await getT();
  return (
    <Card className="mt-5">
      <CardHeader eyebrow={t("x.detailedFor", { section: sectionLabel })} title={period === "month" ? t("x.periodMonth") : t("x.periodDay")} />
      <CardBody className="pt-2">
        <ul className="divide-y divide-hair">
          {students.map((st) => (
            <li key={st.id} className="flex items-center gap-3 py-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-panel text-[11px] font-semibold text-ink-700 tabular">{st.roll ?? "–"}</span>
              <span className="flex-1 truncate text-[14px] text-ink-900">{st.name}</span>
              {period === "day" ? (
                st.total > 0 ? (
                  <StatusPill status={st.present > 0 ? "up" : "down"}>{st.present > 0 ? t("attendance.present") : t("attendance.absent")}</StatusPill>
                ) : (
                  <span className="text-[13px] text-muted">—</span>
                )
              ) : (
                <span className={`text-[13px] tabular ${st.pct != null && st.pct < 75 ? "font-semibold text-down" : "text-ink-700"}`}>
                  {st.present}/{st.total}{st.pct != null ? ` · ${st.pct}%` : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
