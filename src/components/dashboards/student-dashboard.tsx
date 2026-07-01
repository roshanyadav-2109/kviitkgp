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
import { StatCard } from "@/components/dashboards/parts";

type Att = Awaited<ReturnType<typeof getStudentAttendance>>;
type Standing = Awaited<ReturnType<typeof getStudentStanding>>;

// The app's own left sidebar is the page's navigation rail, so the dashboard
// itself is just a centered KV brand header over two columns: the student's
// overview (main content) and a right column stacking Announcements → Quick
// Links → Event Calendar.
export async function StudentDashboard({ session }: { session: Session }) {
  const year = await getCurrentYear();
  const studentId = session.studentId!;
  const [standing, att] = await Promise.all([
    year ? getStudentStanding(studentId, year.id) : Promise.resolve(null),
    year ? getStudentAttendance(studentId, year.id) : Promise.resolve(null),
  ]);

  return (
    <div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
        <MainContent name={session.fullName} standing={standing} att={att} />
        <div className="flex flex-col gap-5">
          <AnnouncementsCard />
          <QuickLinksCard />
          <EventCalendarCard />
        </div>
      </div>
    </div>
  );
}

// ── Middle: the largest area — greeting + performance overview ───────────────
async function MainContent({ name, standing, att }: { name: string; standing: Standing | null; att: Att | null }) {
  const { t, locale } = await getT();
  const firstName = name.split(" ").slice(-1)[0];
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="t-h1 text-ink-900">{t("dashboard.hello", { name: firstName })}</h1>
        <p className="mt-1 text-[14px] text-ink-500">{t("dashboard.overview")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={`${t("progress.overall")} ${t("progress.average")}`} value={fmtPercent(locale, standing?.studentAvg ?? null, 1)} tone="gold" />
        <StatCard label={t("attendance.percent")} value={att ? `${att.pct}%` : "—"} tone={att && att.pct < 75 ? "down" : "up"} sub={att ? `${att.present}/${att.total}` : undefined} />
        <StatCard label={t("progress.sectionStanding")} value={standing?.sectionRank ? `${standing.sectionRank}/${standing.sectionSize}` : "—"} sub={standing ? `${t("progress.sectionAvg")} ${fmtPercent(locale, standing.sectionAvg, 1)}` : undefined} />
        <StatCard label={t("progress.classStanding")} value={standing?.classRank ? `${standing.classRank}/${standing.classSize}` : "—"} sub={standing ? `${t("progress.classAvg")} ${fmtPercent(locale, standing.classAvg, 1)}` : undefined} />
      </div>

      {/* Larger canvas below the stats — progress call-to-action */}
      <Card className="flex-1">
        <CardHeader eyebrow={t("nav.myProgress")} title={t("progress.title")} />
        <CardBody className="pt-2">
          <p className="text-[14px] leading-relaxed text-ink-500">{t("dashboard.progressCta")}</p>
          <Link href="/progress" className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-[13px] font-semibold text-gold-100 transition-colors hover:bg-ink-700">
            {t("nav.myProgress")}
            <ArrowRightIcon size={14} />
          </Link>
        </CardBody>
      </Card>
    </section>
  );
}

// ── Right column: Announcements ──────────────────────────────────────────────
async function AnnouncementsCard() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const { data } = await supabase
    .from("announcement")
    .select("id, title, body, published_at")
    .order("published_at", { ascending: false })
    .limit(4);
  const rows = data ?? [];
  return (
    <Card>
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
      <CardBody className="pt-2">
        {rows.length ? (
          <ul className="divide-y divide-hair">
            {rows.map((a) => (
              <li key={a.id} className="flex gap-3 py-3 first:pt-0">
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
  );
}

// ── Right column: Quick Links (two columns) ──────────────────────────────────
async function QuickLinksCard() {
  const { t } = await getT();
  const links = navFor("student").filter((l) => l.href !== "/");
  return (
    <Card>
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
    </Card>
  );
}

// ── Right column: Event Calendar (this month's upcoming events) ──────────────
async function EventCalendarCard() {
  const { t, locale } = await getT();
  const supabase = await createClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const [{ data: inMonth }, { data: future }] = await Promise.all([
    supabase.from("event").select("id, title, event_type, start_date").gte("start_date", today).lte("start_date", monthEnd).order("start_date", { ascending: true }).limit(5),
    supabase.from("event").select("id, title, event_type, start_date").gte("start_date", today).order("start_date", { ascending: true }).limit(4),
  ]);
  const events = (inMonth && inMonth.length ? inMonth : future ?? []).slice(0, 5);

  return (
    <Card>
      <CardHeader
        eyebrow={t("dashboard.thisMonth")}
        title={t("announce.events")}
        action={
          <Link href="/calendar" className="inline-flex items-center gap-1 text-[12px] font-semibold text-gold-700 hover:text-ink-900">
            {t("dashboard.viewAll")}
            <ArrowRightIcon size={13} />
          </Link>
        }
      />
      <CardBody className="pt-2">
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
      </CardBody>
    </Card>
  );
}
