import { getCurrentYear, type Session } from "@/lib/session";
import { getT } from "@/i18n/server";
import { fmtPercent } from "@/i18n/format";
import { getStudentStanding } from "@/lib/data/analytics";
import { getStudentAttendance } from "@/lib/data/attendance";
import { DashHeader, StatCard, AnnouncementsPanel, EventsPanel, QuickLinks } from "@/components/dashboards/parts";

// Student's own snapshot: average, standing, attendance.
export async function StudentDashboard({ session }: { session: Session }) {
  const { t, locale } = await getT();
  const year = await getCurrentYear();
  const studentId = session.studentId!;
  const [standing, att] = await Promise.all([
    year ? getStudentStanding(studentId, year.id) : Promise.resolve(null),
    year ? getStudentAttendance(studentId, year.id) : Promise.resolve(null),
  ]);

  return (
    <div>
      <DashHeader name={session.fullName} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={`${t("progress.overall")} ${t("progress.average")}`} value={fmtPercent(locale, standing?.studentAvg ?? null, 1)} tone="gold" />
        <StatCard label={t("progress.sectionStanding")} value={standing?.sectionRank ? `${standing.sectionRank}/${standing.sectionSize}` : "—"} sub={standing ? `${t("progress.sectionAvg")} ${fmtPercent(locale, standing.sectionAvg, 1)}` : undefined} />
        <StatCard label={t("progress.classStanding")} value={standing?.classRank ? `${standing.classRank}/${standing.classSize}` : "—"} sub={standing ? `${t("progress.classAvg")} ${fmtPercent(locale, standing.classAvg, 1)}` : undefined} />
        <StatCard label={t("attendance.percent")} value={att ? `${att.pct}%` : "—"} tone={att && att.pct < 75 ? "down" : "up"} sub={att ? `${att.present}/${att.total}` : undefined} />
      </div>
      <div className="mb-6"><QuickLinks role="student" /></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <AnnouncementsPanel />
        <EventsPanel />
      </div>
    </div>
  );
}
