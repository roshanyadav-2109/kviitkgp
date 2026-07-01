import Link from "next/link";
import { getSession, getCurrentYear } from "@/lib/session";
import { getT } from "@/i18n/server";
import { fmtDate, fmtMonth, fmtPercent } from "@/i18n/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BandChip, DeltaBadge } from "@/components/ui/status";
import { KVEmblem } from "@/components/brand";
import { ReportControls } from "@/components/report/report-controls";
import { ScopeBar } from "@/components/scope-bar";
import { ReportIcon } from "@/components/icons";
import { getMyChildren } from "@/lib/data/analytics";
import { getStaffScope } from "@/lib/data/scope";
import { getStudentMonthly, getClassMonthly } from "@/lib/data/report";

type SP = Promise<Record<string, string | string[] | undefined>>;
const num = (v: string | string[] | undefined) => (typeof v === "string" && v ? Number(v) : null);
const str = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : null);
const DEFAULT_MONTH = "2026-02";

export default async function ReportsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const session = (await getSession())!;
  const { t, locale } = await getT();
  const month = str(sp.month) ?? DEFAULT_MONTH;

  // ---- Owner monthly report card ----
  if (session.role === "student" || session.role === "guardian") {
    let studentId = session.studentId;
    let children: { id: number; full_name: string; admission_no: string }[] = [];
    if (session.role === "guardian") {
      children = await getMyChildren();
      studentId = num(sp.child) ?? children[0]?.id ?? null;
    }
    if (!studentId) return <EmptyState icon={ReportIcon} title={t("common.noData")} />;
    const r = await getStudentMonthly(studentId, month);

    return (
      <div>
        <PageHeader title={t("report.title")} />
        {session.role === "guardian" && children.length > 1 && (
          <div className="no-print mb-3 flex flex-wrap gap-2">
            {children.map((c) => (
              <Link key={c.id} href={`/reports?child=${c.id}&month=${month}`} className={`rounded-sm border px-3 py-1.5 text-[13px] font-medium ${c.id === studentId ? "border-gold-500 bg-gold-100 text-ink-900" : "border-hair bg-surface text-ink-500 hover:bg-panel"}`}>{c.full_name}</Link>
            ))}
          </div>
        )}
        <ReportControls month={month} />

        <Card className="print-area">
          <CardBody>
            {/* Report header with emblem slot */}
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
      </div>
    );
  }

  // ---- Staff: whole-class monthly overview (printable, batch step) ----
  const scope = await getStaffScope();
  if (!scope.sections.length || !scope.currentYearId) {
    return (<div><PageHeader title={t("report.title")} /><EmptyState icon={ReportIcon} title={t("common.noData")} /></div>);
  }
  const year = await getCurrentYear();
  const yearId = num(sp.year) ?? scope.currentYearId;
  const section = scope.sections.find((s) => s.id === num(sp.section)) ?? scope.sections[0];
  const rows = await getClassMonthly(section.id, yearId, month);

  return (
    <div>
      <PageHeader eyebrow={`${section.class_name}-${section.name}`} title={t("report.title")} description={t("report.generateClass")} />
      <ScopeBar years={scope.years} sections={scope.sections} yearId={yearId} sectionId={section.id} />
      <ReportControls month={month} />
      <Card className="print-area">
        <CardHeader eyebrow={`${section.class_name}-${section.name} · ${fmtMonth(locale, `${month}-01`)}`} title={year?.name ?? ""} />
        <CardBody className="pt-2">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-[12px] text-muted">
                <th className="pb-2 font-semibold">#</th>
                <th className="pb-2 font-semibold">{t("common.student")}</th>
                <th className="pb-2 text-right font-semibold">{t("report.marksThisMonth")}</th>
                <th className="pb-2 text-right font-semibold">{t("attendance.percent")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-hair">
                  <td className="py-2 text-muted tabular">{r.roll ?? "–"}</td>
                  <td className="py-2 text-ink-900">{r.name}</td>
                  <td className="py-2 text-right font-semibold tabular text-ink-900">{r.avg != null ? fmtPercent(locale, r.avg, 1) : "—"}</td>
                  <td className={`py-2 text-right tabular ${r.attPct != null && r.attPct < 75 ? "font-semibold text-down" : "text-ink-700"}`}>{r.attPct != null ? `${r.attPct}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
