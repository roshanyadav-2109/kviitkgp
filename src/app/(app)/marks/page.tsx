import { getT } from "@/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { MarksScopeBar } from "@/components/marks/marks-scope-bar";
import { MarksEntry } from "@/components/marks/marks-entry";
import { MarksIcon } from "@/components/icons";
import { getStaffScope, getSectionStudents } from "@/lib/data/scope";
import { getAssessments, getAssessmentMarks } from "@/lib/data/marks";

type SP = Promise<Record<string, string | string[] | undefined>>;
const num = (v: string | string[] | undefined) => (typeof v === "string" && v ? Number(v) : null);

export default async function MarksPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { t } = await getT();
  const scope = await getStaffScope();

  if (!scope.sections.length || !scope.subjects.length || !scope.currentYearId) {
    return (<div><PageHeader title={t("marks.title")} /><EmptyState icon={MarksIcon} title={t("common.noData")} hint="No allotted subjects." /></div>);
  }

  const yearId = num(sp.year) ?? scope.currentYearId;
  const section = scope.sections.find((s) => s.id === num(sp.section)) ?? scope.sections[0];
  const meta = scope.sectionMeta.find((m) => m.id === section.id);
  const subjectId = num(sp.subject) ?? meta?.subjects[0]?.id ?? scope.subjects[0]?.id ?? 0;

  const assessments = await getAssessments(section.id, subjectId, yearId);
  const assessmentId = num(sp.assessment) ?? assessments[0]?.id ?? null;
  const assessment = assessments.find((a) => a.id === assessmentId) ?? null;

  const [roster, marksMap] = await Promise.all([
    getSectionStudents(section.id, yearId),
    assessment ? getAssessmentMarks(assessment.id) : Promise.resolve(new Map()),
  ]);
  const initial: Record<number, { marks: number | null; absent: boolean }> = {};
  for (const [k, v] of marksMap) initial[k] = v;

  return (
    <div>
      <PageHeader eyebrow={`${section.class_name}-${section.name}`} title={t("marks.title")} />
      <MarksScopeBar years={scope.years} sectionMeta={scope.sectionMeta} assessments={assessments}
        yearId={yearId} sectionId={section.id} subjectId={subjectId} assessmentId={assessmentId} />
      {assessment ? (
        <MarksEntry assessmentId={assessment.id} assessmentName={assessment.name} maxMarks={assessment.max_marks} roster={roster} initial={initial} />
      ) : (
        <EmptyState icon={MarksIcon} title={t("marks.pickAssessment")} />
      )}
    </div>
  );
}
