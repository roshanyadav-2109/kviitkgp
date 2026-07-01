import Link from "next/link";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { fmtDate } from "@/i18n/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { navFor, type NavRole } from "@/lib/nav";
import { AnnounceIcon, CalendarIcon, AlertIcon, StudentsIcon, ProgressIcon, AttendanceIcon, MarksIcon } from "@/components/icons";
import { getStaffScope } from "@/lib/data/scope";

export default async function DashboardPage() {
  const session = (await getSession())!;
  const supabase = await createClient();
  const { t, locale } = await getT();

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: announcements }, { data: futureEvents }, { data: recentEvents }, slippage] = await Promise.all([
    supabase.from("announcement").select("id, title, body, published_at").order("published_at", { ascending: false }).limit(4),
    supabase.from("event").select("id, title, event_type, start_date").gte("start_date", today).order("start_date", { ascending: true }).limit(4),
    supabase.from("event").select("id, title, event_type, start_date").order("start_date", { ascending: false }).limit(4),
    session.staffId
      ? supabase.from("slippage_flag").select("id", { count: "exact", head: true }).eq("is_active", true)
      : Promise.resolve({ count: 0 } as { count: number }),
  ]);

  const firstName = session.fullName.split(" ").slice(-1)[0];
  const links = navFor(session.effectiveRole as NavRole).filter((l) => l.href !== "/");

  // Unified teacher scope: their own class (full access) + subject-only sections.
  const isTeacher = !!session.staffId && !session.isAdminScope;
  const scope = isTeacher ? await getStaffScope() : null;
  const myClass = scope?.sectionMeta.find((m) => m.isClassTeacher) ?? null;
  const subjectSections = scope?.sectionMeta.filter((m) => !m.isClassTeacher) ?? [];
  const yr = scope?.currentYearId ?? "";
  // Prefer genuinely-upcoming events; fall back to the most recent on the calendar.
  const upcoming = (futureEvents && futureEvents.length ? futureEvents : recentEvents ?? []).slice(0, 4);
  const slipCount = "count" in slippage ? (slippage.count ?? 0) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="t-h1 text-ink-900">{t("dashboard.hello", { name: firstName })}</h1>
        <p className="mt-1 text-[14px] text-ink-500">{t("dashboard.overview")}</p>
      </div>

      {/* Needs-attention banner for staff in scope */}
      {session.staffId && slipCount > 0 && (
        <Link href="/progress" className="mb-5 flex items-center gap-3 rounded-md border border-watch/30 bg-watch-soft px-4 py-3 transition-colors hover:border-watch">
          <AlertIcon size={20} className="text-watch" />
          <div className="text-[14px] text-ink-900">
            <span className="font-semibold">{slipCount}</span> {t("progress.slippage").toLowerCase()} in your scope —{" "}
            <span className="text-gold-700 underline">{t("progress.needsSupport").toLowerCase()}</span>
          </div>
        </Link>
      )}

      {/* Unified teacher portal: own class (full) + subject-only sections */}
      {isTeacher && (
        <div className="mb-6 space-y-4">
          {myClass && (
            <div className="rounded-md border border-gold-500/50 bg-gold-100/50 p-4 shadow-[var(--shadow-card)]">
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
                    <Link key={l.label} href={l.href} className="inline-flex items-center gap-2 rounded-sm border border-hair bg-surface px-3 py-2 text-[13px] font-medium text-ink-900 transition-colors hover:border-gold-500 hover:bg-surface">
                      <Icon size={16} className="text-gold-700" />{l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {subjectSections.length > 0 && (
            <div>
              <div className="t-label mb-2">{t("dashboard.mySubjects")}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjectSections.map((m) => (
                  <Link key={m.id} href={`/progress?section=${m.id}&year=${yr}${m.subjects[0] ? `&subject=${m.subjects[0].id}` : ""}`}
                    className="group rounded-md border border-hair bg-surface p-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-gold-500 hover:bg-gold-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold text-ink-900">{m.label}</span>
                      <span className="t-label text-muted">{t("dashboard.subjectOnly")}</span>
                    </div>
                    <div className="mt-1 text-[13px] text-ink-500">
                      <span className="text-muted">{t("dashboard.teaches")}: </span>{m.subjects.map((s) => s.name).join(", ") || "—"}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="t-label mb-2">{t("dashboard.quickLinks")}</div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} className="group flex items-center gap-3 rounded-md border border-hair bg-surface p-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-gold-500 hover:bg-gold-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-gold-100 text-gold-700 group-hover:bg-surface">
                <Icon size={20} />
              </span>
              <span className="text-[14px] font-semibold text-ink-900">{t(l.labelKey)}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent announcements */}
        <Card>
          <CardHeader eyebrow={t("dashboard.recentAnnouncements")} title={t("announce.title")} />
          <CardBody className="pt-2">
            {announcements && announcements.length > 0 ? (
              <ul className="divide-y divide-hair">
                {announcements.map((a) => (
                  <li key={a.id} className="flex gap-3 py-3">
                    <AnnounceIcon size={16} className="mt-0.5 shrink-0 text-gold-700" />
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-ink-900">{a.title}</div>
                      <div className="line-clamp-1 text-[13px] text-ink-500">{a.body}</div>
                      <div className="mt-0.5 text-[12px] text-muted">{fmtDate(locale, a.published_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={AnnounceIcon} title={t("common.noData")} />
            )}
          </CardBody>
        </Card>

        {/* Upcoming events */}
        <Card>
          <CardHeader eyebrow={t("dashboard.upcoming")} title={t("announce.events")} />
          <CardBody className="pt-2">
            {upcoming.length > 0 ? (
              <ul className="divide-y divide-hair">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-panel text-ink-700">
                      <CalendarIcon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-ink-900">{e.title}</div>
                      <div className="text-[12px] capitalize text-muted">{e.event_type}</div>
                    </div>
                    <div className="shrink-0 text-[13px] font-medium text-ink-700 tabular">{fmtDate(locale, e.start_date)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CalendarIcon} title={t("common.noData")} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
