import Link from "next/link";
import { type Session } from "@/lib/session";
import { getT } from "@/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getStaffScope } from "@/lib/data/scope";
import { StudentsIcon, ProgressIcon, AttendanceIcon, MarksIcon, AlertIcon } from "@/components/icons";
import { DashHeader, AnnouncementsPanel, EventsPanel, QuickLinks } from "@/components/dashboards/parts";
import type { NavRole } from "@/lib/nav";

// One unified teacher portal: own class (full access) + subject-only sections.
export async function TeacherDashboard({ session }: { session: Session }) {
  const { t } = await getT();
  const supabase = await createClient();
  const [scope, { count: slippage }] = await Promise.all([
    getStaffScope(),
    supabase.from("slippage_flag").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);
  const myClass = scope.sectionMeta.find((m) => m.isClassTeacher) ?? null;
  const subjectSections = scope.sectionMeta.filter((m) => !m.isClassTeacher);
  const yr = scope.currentYearId ?? "";

  return (
    <div>
      <DashHeader name={session.fullName} />

      {!!slippage && slippage > 0 && (
        <Link href="/progress" className="mb-5 flex items-center gap-3 rounded-md border border-watch/30 bg-watch-soft px-4 py-3 transition-colors hover:border-watch">
          <AlertIcon size={20} className="text-watch" />
          <div className="text-[14px] text-ink-900"><span className="font-semibold">{slippage}</span> {t("progress.slippage").toLowerCase()} — <span className="text-gold-700 underline">{t("progress.needsSupport").toLowerCase()}</span></div>
        </Link>
      )}

      {myClass && (
        <div className="mb-4 rounded-md border border-gold-500/50 bg-gold-100/50 p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3">
            <div className="t-label flex items-center gap-1.5"><StudentsIcon size={14} className="text-gold-700" />{t("dashboard.myClass")}</div>
            <span className="rounded-xs bg-gold-500 px-2 py-0.5 text-[11px] font-semibold text-ink-900">{t("dashboard.fullAccess")}</span>
          </div>
          <div className="t-h2 mt-1 text-ink-900">{myClass.label}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { href: `/progress?section=${myClass.id}&year=${yr}`, icon: ProgressIcon, label: t("nav.progress") },
              { href: `/attendance?section=${myClass.id}`, icon: AttendanceIcon, label: t("nav.attendance") },
              { href: `/marks?section=${myClass.id}`, icon: MarksIcon, label: t("nav.marks") },
              { href: `/students?section=${myClass.id}`, icon: StudentsIcon, label: t("nav.students") },
            ].map((l) => {
              const Icon = l.icon;
              return (
                <Link key={l.label} href={l.href} className="inline-flex items-center gap-2 rounded-sm border border-hair bg-surface px-3 py-2 text-[13px] font-medium text-ink-900 transition-colors hover:border-gold-500">
                  <Icon size={16} className="text-gold-700" />{l.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {subjectSections.length > 0 && (
        <div className="mb-6">
          <div className="t-label mb-2">{t("dashboard.mySubjects")}</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjectSections.map((m) => (
              <Link key={m.id} href={`/progress?section=${m.id}&year=${yr}${m.subjects[0] ? `&subject=${m.subjects[0].id}` : ""}`}
                className="group rounded-md border border-hair bg-surface p-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-gold-500 hover:bg-gold-100">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-ink-900">{m.label}</span>
                  <span className="t-label text-muted">{t("dashboard.subjectOnly")}</span>
                </div>
                <div className="mt-1 text-[13px] text-ink-500"><span className="text-muted">{t("dashboard.teaches")}: </span>{m.subjects.map((s) => s.name).join(", ") || "—"}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6"><QuickLinks role={session.navRole as NavRole} /></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <AnnouncementsPanel />
        <EventsPanel />
      </div>
    </div>
  );
}
