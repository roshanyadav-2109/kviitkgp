import Link from "next/link";
import { getSession, getCurrentYear } from "@/lib/session";
import { getT } from "@/i18n/server";
import { fmtMonth, fmtPercent } from "@/i18n/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ReportControls } from "@/components/report/report-controls";
import { ReportViewControls } from "@/components/report/report-view-controls";
import { MonthlyReportCard } from "@/components/report/monthly-report-card";
import { ScopeBar } from "@/components/scope-bar";
import { ReportIcon } from "@/components/icons";
import { getMyChildren } from "@/lib/data/analytics";
import { getStaffScope, getSectionStudents } from "@/lib/data/scope";
import { getStudentMonthly, getClassMonthly } from "@/lib/data/report";
import { numParam, strParam } from "@/lib/utils";

type SP = Promise<Record<string, string | string[] | undefined>>;
const num = numParam;
const str = strParam;
const DEFAULT_MONTH = "2026-02";

export default async function ReportsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const session = (await getSession())!;
  const { t, locale } = await getT();
  const month = str(sp.month) ?? DEFAULT_MONTH;

  // ---- Owner: their own / their child's report card ----
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
        <MonthlyReportCard report={r} month={month} />
      </div>
    );
  }

  // ---- Staff: choose whole-class overview OR a single student's report ----
  const scope = await getStaffScope();
  if (!scope.sections.length || !scope.currentYearId) {
    return (<div><PageHeader title={t("report.title")} /><EmptyState icon={ReportIcon} title={t("common.noData")} /></div>);
  }
  const year = await getCurrentYear();
  const yearId = num(sp.year) ?? scope.currentYearId;
  const section = scope.sections.find((s) => s.id === num(sp.section)) ?? scope.sections[0];
  const view = str(sp.view) === "student" ? "student" : "overview";

  const roster = await getSectionStudents(section.id, yearId);
  const studentId = num(sp.student) ?? (view === "student" ? roster[0]?.id ?? null : null);

  const controls = (
    <>
      <ScopeBar years={scope.years} sections={scope.sections} yearId={yearId} sectionId={section.id} />
      <ReportControls month={month} extra={<ReportViewControls view={view} students={roster.map((s) => ({ id: s.id, name: s.name }))} studentId={studentId} />} />
    </>
  );

  if (view === "student") {
    return (
      <div>
        <PageHeader eyebrow={`${section.class_name}-${section.name}`} title={t("report.title")} description={t("x.reportStudent")} />
        {controls}
        {studentId ? (
          <MonthlyReportCard report={await getStudentMonthly(studentId, month)} month={month} />
        ) : (
          <EmptyState icon={ReportIcon} title={t("x.reportPickStudent")} />
        )}
      </div>
    );
  }

  const rows = await getClassMonthly(section.id, yearId, month);
  return (
    <div>
      <PageHeader eyebrow={`${section.class_name}-${section.name}`} title={t("report.title")} description={t("report.generateClass")} />
      {controls}
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
