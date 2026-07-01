import { getT } from "@/i18n/server";
import { fmtDate, fmtMonth } from "@/i18n/format";
import { Card, CardBody } from "@/components/ui/card";
import { BandChip, DeltaBadge } from "@/components/ui/status";
import { KVEmblem } from "@/components/brand";

type Report = Awaited<ReturnType<typeof import("@/lib/data/report").getStudentMonthly>>;

// The printable per-student monthly report card. Shared by the owner view and
// the staff "individual student" report.
export async function MonthlyReportCard({ report, month }: { report: Report; month: string }) {
  const { t, locale } = await getT();
  const r = report;
  return (
    <Card className="print-area">
      <CardBody>
        <div className="mb-4 flex items-center gap-3 border-b border-hair pb-4">
          <KVEmblem size={44} />
          <div className="flex-1">
            <div className="t-h3 text-ink-900">Kendriya Vidyalaya No 1, IIT Kharagpur</div>
            <div className="text-[13px] text-ink-500">{t("report.title")} · {fmtMonth(locale, `${month}-01`)}</div>
          </div>
          <div className="text-right">
            <div className="text-[14px] font-semibold text-ink-900">{r.student?.full_name}</div>
            <div className="text-[12px] text-muted tabular">{r.student?.admission_no}</div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
          <div className="rounded-md bg-panel/50 p-4">
            <div className="t-label">{t("report.attendanceThisMonth")}</div>
            <div className={`mt-1 text-[30px] font-bold tabular ${r.attendance.pct != null && r.attendance.pct < 75 ? "text-down" : "text-ink-900"}`}>
              {r.attendance.pct != null ? `${r.attendance.pct}%` : "—"}
            </div>
            <div className="text-[12px] text-muted">{r.attendance.present}/{r.attendance.total} {t("attendance.present").toLowerCase()}</div>
          </div>

          <div>
            <div className="t-label mb-2">{t("report.marksThisMonth")}</div>
            {r.marks.length ? (
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="text-left text-[12px] text-muted">
                    <th className="pb-1 font-semibold">{t("common.subject")}</th>
                    <th className="pb-1 font-semibold">{t("marks.assessment")}</th>
                    <th className="pb-1 text-right font-semibold">%</th>
                    <th className="pb-1 text-center font-semibold">{t("progress.band")}</th>
                    <th className="pb-1 text-right font-semibold">{t("progress.delta")}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.marks.map((m, i) => (
                    <tr key={i} className="border-t border-hair">
                      <td className="py-1.5 text-ink-900">{m.subject_name}</td>
                      <td className="py-1.5 text-ink-500">{m.assessment_name}</td>
                      <td className="py-1.5 text-right font-semibold tabular text-ink-900">{m.percent}</td>
                      <td className="py-1.5 text-center"><BandChip band={m.band} /></td>
                      <td className="py-1.5 text-right"><DeltaBadge value={m.delta} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[14px] text-ink-500">{t("common.noData")}</p>
            )}
          </div>
        </div>

        {r.notices.length > 0 && (
          <div className="mt-5 border-t border-hair pt-4">
            <div className="t-label mb-2">{t("report.noticesSent")}</div>
            <ul className="space-y-1 text-[13px] text-ink-700">
              {r.notices.map((n, i) => (
                <li key={i} className="flex gap-2"><span className="text-muted tabular">{fmtDate(locale, n.published_at, { day: "numeric", month: "short" })}</span>{n.title}</li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
