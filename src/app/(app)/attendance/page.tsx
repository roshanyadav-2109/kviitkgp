import Link from "next/link";
import { getSession, getCurrentYear } from "@/lib/session";
import { getT } from "@/i18n/server";
import { fmtDate } from "@/i18n/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status";
import { ScopeBar } from "@/components/scope-bar";
import { AttendanceBoard } from "@/components/attendance/attendance-board";
import { AttendanceIcon } from "@/components/icons";
import { getStaffScope, getSectionStudents } from "@/lib/data/scope";
import { getMyChildren } from "@/lib/data/analytics";
import { getDateAttendance, getSectionAttendanceSummary, getStudentAttendance, getLatestAttendanceDate } from "@/lib/data/attendance";
import type { AttStatus } from "@/app/(app)/attendance/actions";

type SP = Promise<Record<string, string | string[] | undefined>>;
const num = (v: string | string[] | undefined) => (typeof v === "string" && v ? Number(v) : null);
const str = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : null);
const statusStyle: Record<string, "up" | "down" | "watch" | "flat"> = { present: "up", absent: "down", late: "watch", leave: "flat", holiday: "flat" };

export default async function AttendancePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const session = (await getSession())!;
  const { t, locale } = await getT();
  const year = await getCurrentYear();

  // ---- Owner: view own / child attendance ----
  if (session.role === "student" || session.role === "guardian") {
    let studentId = session.studentId;
    let children: { id: number; full_name: string; admission_no: string }[] = [];
    if (session.role === "guardian") {
      children = await getMyChildren();
      studentId = num(sp.child) ?? children[0]?.id ?? null;
    }
    if (!studentId || !year) return <EmptyState icon={AttendanceIcon} title={t("common.noData")} />;
    const att = await getStudentAttendance(studentId, year.id);
    return (
      <div>
        <PageHeader title={t("attendance.title")} />
        {session.role === "guardian" && children.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {children.map((c) => (
              <Link key={c.id} href={`/attendance?child=${c.id}`} className={`rounded-sm border px-3 py-1.5 text-[13px] font-medium ${c.id === studentId ? "border-gold-500 bg-gold-100 text-ink-900" : "border-hair bg-surface text-ink-500 hover:bg-panel"}`}>{c.full_name}</Link>
            ))}
          </div>
        )}
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <Card>
            <CardBody>
              <div className="t-label">{t("attendance.percent")}</div>
              <div className={`mt-1 text-[38px] font-bold leading-none tabular ${att.pct < 75 ? "text-down" : "text-ink-900"}`}>{att.pct}%</div>
              <div className="mt-1 text-[13px] text-ink-500">{att.present} / {att.total} {t("attendance.present").toLowerCase()}</div>
              {att.pct < 75 && <div className="mt-3 rounded-sm bg-down-soft px-2.5 py-1.5 text-[12px] font-medium text-down">{t("attendance.belowThreshold")}</div>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader eyebrow={t("common.year")} title={year.name} />
            <CardBody className="pt-2">
              <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {att.recent.map((r, i) => (
                  <li key={i} className="flex items-center justify-between rounded-sm border border-hair px-2.5 py-1.5">
                    <span className="text-[13px] tabular text-ink-700">{fmtDate(locale, r.on_date, { day: "numeric", month: "short" })}</span>
                    <StatusPill status={statusStyle[r.status]}>{t(`attendance.${r.status}`)}</StatusPill>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // ---- Staff: mark attendance ----
  const scope = await getStaffScope();
  if (!scope.sections.length || !scope.currentYearId) {
    return (<div><PageHeader title={t("attendance.title")} /><EmptyState icon={AttendanceIcon} title={t("common.noData")} hint="No allotted sections." /></div>);
  }
  const yearId = num(sp.year) ?? scope.currentYearId;
  const section = scope.sections.find((s) => s.id === num(sp.section)) ?? scope.sections[0];
  const date = str(sp.date) ?? (await getLatestAttendanceDate(section.id)) ?? new Date().toISOString().slice(0, 10);

  const [roster, initialMap, summaryMap] = await Promise.all([
    getSectionStudents(section.id, yearId),
    getDateAttendance(section.id, date),
    getSectionAttendanceSummary(section.id, yearId),
  ]);
  const initial: Record<number, AttStatus> = {};
  for (const [k, v] of initialMap) if (v !== "holiday") initial[k] = v as AttStatus;
  const summary: Record<number, { pct: number; present: number; total: number }> = {};
  for (const [k, v] of summaryMap) summary[k] = { pct: v.pct, present: v.present, total: v.total };

  return (
    <div>
      <PageHeader eyebrow={`${section.class_name}-${section.name}`} title={t("attendance.title")} description={t("attendance.markToday")} />
      <ScopeBar years={scope.years} sections={scope.sections} yearId={yearId} sectionId={section.id} date={date} />
      <AttendanceBoard sectionId={section.id} yearId={yearId} date={date} roster={roster} initial={initial} summary={summary} />
    </div>
  );
}
