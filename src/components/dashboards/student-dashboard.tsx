import Link from "next/link";
import { getCurrentYear, type Session } from "@/lib/session";
import { getT } from "@/i18n/server";
import { fmtPercent, fmtDate } from "@/i18n/format";
import { getStudentStanding } from "@/lib/data/analytics";
import { getStudentAttendance } from "@/lib/data/attendance";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { navFor } from "@/lib/nav";
import { AnnounceIcon, CalendarIcon, ArrowRightIcon } from "@/components/icons";
import { DashHeader, StatCard } from "@/components/dashboards/parts";
import { cn } from "@/lib/utils";

// Student's own snapshot: average, standing, attendance — then a composed band
// of a dark section rail, a professional announcements feed, and a quick-links +
// this-month events column (outer columns share the same width).
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

      {/* Outer columns (rail + quick column) share one width; announcements flex between. */}
      <div className="grid items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_15rem]">
        <SectionRail />
        <StudentAnnouncements />
        <QuickColumn />
      </div>
    </div>
  );
}

// Dark floating rail — the KV ink palette, gently rounded, listing the student's
// sections as a compact vertical tab strip.
async function SectionRail() {
  const { t } = await getT();
  const items = navFor("student");
  return (
    <aside className="sticky top-6 overflow-hidden rounded-lg bg-gradient-to-b from-ink-900 to-ink-700 shadow-[var(--shadow-pop)] ring-1 ring-ink-900/60">
      <div className="h-1 bg-gradient-to-r from-gold-500 to-gold-300" />
      <div className="p-4">
        <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-300">
          {t("dashboard.sections")}
        </div>
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isHome = item.href === "/";
            return (
              <Link
                key={item.href + item.labelKey}
                href={item.href}
                aria-current={isHome ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                  isHome
                    ? "bg-gold-500 text-ink-900"
                    : "text-gold-100/80 hover:bg-white/10 hover:text-gold-100",
                )}
              >
                <Icon size={17} className={isHome ? "text-ink-900" : "text-gold-500 group-hover:text-gold-300"} />
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

// Professional announcements feed: a featured lead item, then a tidy list.
async function StudentAnnouncements() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const { data } = await supabase
    .from("announcement")
    .select("id, title, body, published_at")
    .order("published_at", { ascending: false })
    .limit(5);
  const rows = data ?? [];
  const [lead, ...rest] = rows;

  return (
    <Card className="flex min-h-full flex-col">
      <CardHeader
        eyebrow={t("dashboard.recentAnnouncements")}
        title={t("announce.title")}
        action={
          <Link href="/announcements" className="inline-flex items-center gap-1 text-[12px] font-semibold text-gold-700 hover:text-ink-900">
            {t("dashboard.viewAll")}
            <ArrowRightIcon size={13} />
          </Link>
        }
      />
      <CardBody className="flex-1 pt-2">
        {lead ? (
          <div className="flex flex-col gap-4">
            {/* Featured lead */}
            <Link href="/announcements" className="group relative block rounded-md border border-hair bg-panel/40 p-4 pl-5 transition-colors hover:border-gold-300 hover:bg-gold-100/40">
              <span className="absolute inset-y-3 left-0 w-1 rounded-full bg-gold-500" />
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-gold-700">
                <AnnounceIcon size={13} />
                {fmtDate(locale, lead.published_at)}
              </div>
              <div className="text-[15px] font-bold leading-snug text-ink-900 group-hover:text-gold-700">{lead.title}</div>
              <div className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{lead.body}</div>
            </Link>

            {rest.length > 0 && (
              <ul className="divide-y divide-hair">
                {rest.map((a) => (
                  <li key={a.id} className="flex gap-3 py-3 first:pt-0">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gold-100 text-gold-700">
                      <AnnounceIcon size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-ink-900">{a.title}</div>
                      <div className="line-clamp-1 text-[13px] text-ink-500">{a.body}</div>
                      <div className="mt-0.5 text-[12px] text-muted">{fmtDate(locale, a.published_at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <EmptyState icon={AnnounceIcon} title={t("common.noData")} />
        )}
      </CardBody>
    </Card>
  );
}

// Quick links (two-column) with this-month's events stacked in the same card.
async function QuickColumn() {
  const { t, locale } = await getT();
  const supabase = await createClient();
  const links = navFor("student").filter((l) => l.href !== "/");

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const [{ data: inMonth }, { data: future }] = await Promise.all([
    supabase.from("event").select("id, title, event_type, start_date").gte("start_date", today).lte("start_date", monthEnd).order("start_date", { ascending: true }).limit(5),
    supabase.from("event").select("id, title, event_type, start_date").gte("start_date", today).order("start_date", { ascending: true }).limit(4),
  ]);
  const events = (inMonth && inMonth.length ? inMonth : future ?? []).slice(0, 5);

  return (
    <Card className="flex min-h-full flex-col">
      <CardHeader eyebrow={t("dashboard.quickLinks")} />
      <CardBody className="pt-2">
        <div className="grid grid-cols-2 gap-2.5">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href + l.labelKey}
                href={l.href}
                className="group flex flex-col items-center gap-1.5 rounded-md border border-hair bg-surface px-2 py-3 text-center shadow-[var(--shadow-card)] transition-colors hover:border-gold-500 hover:bg-gold-100"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold-100 text-gold-700 transition-colors group-hover:bg-surface">
                  <Icon size={18} />
                </span>
                <span className="text-[12px] font-semibold leading-tight text-ink-900">{t(l.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </CardBody>

      {/* This-month events, same card, below quick links */}
      <div className="border-t border-hair px-4 pb-4 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="t-label">{t("dashboard.thisMonth")}</div>
          <Link href="/calendar" className="text-[12px] font-semibold text-gold-700 hover:text-ink-900">{t("dashboard.viewAll")}</Link>
        </div>
        {events.length ? (
          <ul className="space-y-1.5">
            {events.map((e) => {
              const d = new Date(e.start_date);
              return (
                <li key={e.id}>
                  <Link href="/calendar" className="group flex items-center gap-2.5 rounded-sm p-1 transition-colors hover:bg-panel">
                    <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-sm bg-ink-900 leading-none text-gold-100">
                      <span className="text-[15px] font-bold tabular">{fmtDate(locale, d, { day: "2-digit" })}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-gold-300">{fmtDate(locale, d, { month: "short" })}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink-900 group-hover:text-gold-700">{e.title}</span>
                      <span className="block text-[11px] capitalize text-muted">{e.event_type}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center gap-2 rounded-sm bg-panel/50 px-3 py-4 text-[13px] text-muted">
            <CalendarIcon size={16} className="text-muted" />
            {t("dashboard.noEventsMonth")}
          </div>
        )}
      </div>
    </Card>
  );
}
