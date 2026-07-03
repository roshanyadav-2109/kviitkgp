import Link from "next/link";
import { getCurrentYear, type Session } from "@/lib/session";
import { getT } from "@/i18n/server";
import { fmtPercent } from "@/i18n/format";
import { createClient } from "@/lib/supabase/server";
import { getMyChildren, getStudentStanding } from "@/lib/data/analytics";
import { getStudentAttendance } from "@/lib/data/attendance";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { AlertIcon, ProgressIcon, ArrowRightIcon } from "@/components/icons";
import { DashHeader, AnnouncementsPanel, EventsPanel, QuickLinks } from "@/components/dashboards/parts";

// Parent view: a card per child (one login shows all siblings).
export async function GuardianDashboard({ session }: { session: Session }) {
  const { t, locale } = await getT();
  const year = await getCurrentYear();
  const children = await getMyChildren();
  if (!children.length || !year) {
    return (<div><DashHeader name={session.fullName} /><EmptyState icon={ProgressIcon} title={t("common.noData")} /></div>);
  }
  const supabase = await createClient();
  const childIds = children.map((c) => c.id);

  const [{ data: enr }, { count: pending }, summaries] = await Promise.all([
    supabase.from("student_enrollment").select("student_id, section:section_id(name, class:class_id(name))").in("student_id", childIds).eq("academic_year_id", year.id),
    supabase.from("absence_notice").select("id", { count: "exact", head: true }).in("student_id", childIds).eq("status", "pending"),
    Promise.all(children.map(async (c) => ({
      child: c,
      standing: await getStudentStanding(c.id, year.id),
      att: await getStudentAttendance(c.id, year.id),
    }))),
  ]);
  const sectionOf = new Map<number, string>();
  for (const e of enr ?? []) {
    const s = e.section as unknown as { name: string; class: { name: string } } | null;
    if (s) sectionOf.set(e.student_id, `${s.class.name}-${s.name}`);
  }

  return (
    <div>
      <DashHeader name={session.fullName} />

      {!!pending && pending > 0 && (
        <Link href="/leave" className="mb-5 flex items-center gap-3 rounded-md border border-watch/40 bg-watch-soft px-4 py-3 transition-colors hover:border-watch">
          <AlertIcon size={20} className="text-watch" />
          <div className="text-[14px] text-ink-900"><span className="font-semibold">{pending}</span> {t("leave.absence").toLowerCase()} — {t("leave.explainPrompt").toLowerCase()}</div>
        </Link>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {summaries.map(({ child, standing, att }) => (
          <Card key={child.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <div className="t-h3 text-ink-900">{child.full_name}</div>
                  <div className="text-[12px] text-ink-900">{sectionOf.get(child.id) ?? ""} · {child.admission_no}</div>
                </div>
                <Link href={`/progress?child=${child.id}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-[rgb(37,99,235)] hover:underline">
                  {t("nav.childProgress")} <ArrowRightIcon size={14} />
                </Link>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[12px] font-normal text-ink-900">{t("progress.average")}</div>
                  <div className="text-[22px] font-bold tabular text-ink-900">{fmtPercent(locale, standing?.studentAvg ?? null, 0)}</div>
                </div>
                <div>
                  <div className="text-[12px] font-normal text-ink-900">{t("progress.sectionStanding")}</div>
                  <div className="text-[22px] font-bold tabular text-ink-900">{standing?.sectionRank ? `${standing.sectionRank}/${standing.sectionSize}` : "—"}</div>
                </div>
                <div>
                  <div className="text-[12px] font-normal text-ink-900">{t("attendance.percent")}</div>
                  <div className={`text-[22px] font-bold tabular ${att && att.pct < 75 ? "text-down" : "text-ink-900"}`}>{att ? `${att.pct}%` : "—"}</div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mb-6"><QuickLinks role="guardian" /></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <AnnouncementsPanel />
        <EventsPanel />
      </div>
    </div>
  );
}
