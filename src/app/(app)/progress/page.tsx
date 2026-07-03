import Link from "next/link";
import { getSession, getCurrentYear } from "@/lib/session";
import { getT } from "@/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { FilterBar } from "@/components/progress/filter-bar";
import { StudentProgressView } from "@/components/progress/student-progress-view";
import { SessionChooser } from "@/components/progress/session-chooser";
import { SectionAnalyticsView } from "@/components/progress/section-analytics-view";
import { ClassAnalyticsView } from "@/components/progress/class-analytics-view";
import { ProgressIcon, ArrowRightIcon } from "@/components/icons";
import { getStaffScope, getSectionStudents } from "@/lib/data/scope";
import { getSectionAnalytics, getClassAnalytics, getStudentProgress, getStudentStanding, getMyChildren } from "@/lib/data/analytics";

import { numParam } from "@/lib/utils";

type SP = Promise<Record<string, string | string[] | undefined>>;
const num = numParam;

export default async function ProgressPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const session = (await getSession())!;
  const { t } = await getT();

  // ---- Owner view (student / guardian): their own continuous record ----------
  if (session.role === "student" || session.role === "guardian") {
    let studentId = session.studentId;
    let children: { id: number; full_name: string; admission_no: string }[] = [];
    if (session.role === "guardian") {
      children = await getMyChildren();
      studentId = num(sp.child) ?? children[0]?.id ?? null;
    }
    if (!studentId) return <EmptyState icon={ProgressIcon} title={t("progress.noMarks")} />;
    const curYear = await getCurrentYear();
    // Session chooser: "lifetime" (full history), or a specific academic year.
    const sessionParam = typeof sp.session === "string" ? sp.session : undefined;
    const lifetime = sessionParam === "lifetime";
    const selectedYearId = lifetime ? null : (num(sessionParam) ?? curYear?.id ?? null);
    const standingYearId = selectedYearId ?? curYear?.id ?? null;
    const [data, standing] = await Promise.all([
      getStudentProgress(studentId, selectedYearId),
      standingYearId ? getStudentStanding(studentId, standingYearId) : Promise.resolve(null),
    ]);
    return (
      <div>
        {session.role === "guardian" && children.length > 1 && (
          <div className="mb-5 flex flex-wrap gap-2">
            {children.map((c) => {
              const active = c.id === studentId;
              return (
                <Link key={c.id} href={`/progress?child=${c.id}`}
                  className={`rounded-sm border px-3 py-1.5 text-[13px] font-medium ${active ? "border-gold-500 bg-gold-100 text-ink-900" : "border-hair bg-surface text-ink-500 hover:bg-panel"}`}>
                  {c.full_name}
                </Link>
              );
            })}
          </div>
        )}
        <SessionChooser
          years={data.years}
          active={lifetime ? "lifetime" : String(selectedYearId ?? "lifetime")}
          lifetimeLabel={t("progress.lifetime")}
          childId={session.role === "guardian" ? studentId : undefined}
        />
        <StudentProgressView data={data} standing={standing} />
      </div>
    );
  }

  // ---- Staff view: section / class analytics, scoped by allotment -------------
  const scope = await getStaffScope();
  if (!scope.sections.length || !scope.currentYearId) {
    return (
      <div>
        <PageHeader title={t("progress.title")} />
        <EmptyState icon={ProgressIcon} title={t("progress.noMarks")} hint={t("x.progNoSections")} />
      </div>
    );
  }

  const yearId = num(sp.year) ?? scope.currentYearId;
  const subjectId = num(sp.subject);
  const subjectName = subjectId ? scope.subjects.find((s) => s.id === subjectId)?.name ?? null : null;

  const classId = num(sp.class);
  const level: "class" | "section" = classId ? "class" : "section";
  const section = scope.sections.find((s) => s.id === num(sp.section)) ?? scope.sections[0];
  const cls = classId ? (scope.classes.find((c) => c.id === classId) ?? scope.classes[0]) : null;
  const scopeId = level === "class" && cls ? cls.id : section.id;

  const filters = (
    <FilterBar years={scope.years} classes={scope.classes} sectionMeta={scope.sectionMeta} subjects={scope.subjects}
      yearId={yearId} level={level} scopeId={scopeId} subjectId={subjectId} />
  );

  // Whole-class view: aggregate all sections + section-vs-section comparison
  if (level === "class" && cls) {
    const sectionIds = scope.sections.filter((s) => s.class_id === cls.id).map((s) => s.id);
    const data = await getClassAnalytics(cls.id, sectionIds, yearId, subjectId);
    return (
      <div>
        <PageHeader title={t("progress.title")}
          description={`${sectionIds.length} ${t("common.section").toLowerCase()}(s)`} />
        {filters}
        <ClassAnalyticsView data={data} subjectName={subjectName} />
      </div>
    );
  }

  const backQs = new URLSearchParams();
  backQs.set("year", String(yearId));
  backQs.set("section", String(section.id));
  if (subjectId) backQs.set("subject", String(subjectId));

  // Drill-down into one student's record
  const studentId = num(sp.studentId);
  if (studentId) {
    const [data, standing] = await Promise.all([
      getStudentProgress(studentId),
      getStudentStanding(studentId, yearId),
    ]);
    return (
      <div>
        <PageHeader title={t("progress.title")}
          description={data.student ? `${data.student.full_name} · ${data.student.admission_no}` : undefined} />
        {filters}
        <Link href={`/progress?${backQs.toString()}`} className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-gold-700 hover:underline">
          <ArrowRightIcon size={14} className="rotate-180" /> {section.class_name}-{section.name}
        </Link>
        <StudentProgressView data={data} standing={standing} />
      </div>
    );
  }

  const [analytics, roster] = await Promise.all([
    getSectionAnalytics(section.id, section.class_id, yearId, subjectId),
    getSectionStudents(section.id, yearId),
  ]);

  return (
    <div>
      <PageHeader title={t("progress.title")}
        description={`${scope.isAdmin ? t("x.progSchoolScope") : t("x.progAllottedScope")} · ${t("x.scopeSections", { n: scope.sections.length })}`} />
      {filters}
      <SectionAnalyticsView data={analytics} roster={roster} subjectName={subjectName} />
    </div>
  );
}
