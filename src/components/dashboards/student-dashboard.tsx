import Link from "next/link";
import { getCurrentYear, getStudentCard, type Session } from "@/lib/session";
import { getT } from "@/i18n/server";
import { fmtPercent, fmtDate } from "@/i18n/format";
import { getStudentStanding } from "@/lib/data/analytics";
import { getStudentAttendance } from "@/lib/data/attendance";
import { createClient } from "@/lib/supabase/server";
import { CardBody, CardHeader } from "@/components/ui/card";
import { navFor } from "@/lib/nav";
import { CalendarIcon, ArrowRightIcon } from "@/components/icons";
import { ProfileMenu } from "@/components/dashboards/profile-menu";
import { AnnouncementsList } from "@/components/dashboards/announcements-list";
import { StudentAvatar } from "@/components/dashboards/avatar";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";

type Att = Awaited<ReturnType<typeof getStudentAttendance>>;
type Standing = Awaited<ReturnType<typeof getStudentStanding>>;

// Flat, borderless section on the white page — separated by fill + spacing only.
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-sm bg-panel/50", className)}>{children}</div>;
}

function Stat({ label, value, sub, tone = "ink" }: { label: string; value: React.ReactNode; sub?: string; tone?: "ink" | "up" | "down" | "gold" }) {
  const toneCls = { ink: "text-ink-900", up: "text-up", down: "text-down", gold: "text-gold-700" }[tone];
  return (
    <div className="rounded-sm bg-surface p-4">
      <div className="t-label">{label}</div>
      <div className={cn("mt-1 text-[28px] font-bold leading-none tabular", toneCls)}>{value}</div>
      {sub && <div className="mt-1.5 text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

// Two columns: the student's overview (main) and a right column stacking the
// profile card, Announcements, Quick Links and the Event Calendar.
export async function StudentDashboard({ session }: { session: Session }) {
  const year = await getCurrentYear();
  const studentId = session.studentId!;
  const [standing, att] = await Promise.all([
    year ? getStudentStanding(studentId, year.id) : Promise.resolve(null),
    year ? getStudentAttendance(studentId, year.id) : Promise.resolve(null),
  ]);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <LocaleSwitcher />
      </div>
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
        <MainContent name={session.fullName} standing={standing} att={att} />
        <div className="flex flex-col gap-3">
          <ProfileCard name={session.fullName} studentId={studentId} />
          <AnnouncementsCard />
          <QuickLinksCard />
          <EventCalendarCard />
        </div>
      </div>
    </div>
  );
}

// ── Right column: student profile card, with a vertical ⋮ menu by the name ───
async function ProfileCard({ name, studentId }: { name: string; studentId: number }) {
  const { t } = await getT();
  const card = await getStudentCard(studentId);
  const rows: [string, React.ReactNode][] = [
    [t("dashboard.rollNo"), card?.roll ?? "—"],
    [t("dashboard.classLabel"), card?.classSection ?? "—"],
    [t("dashboard.classTeacher"), card?.classTeacher ?? "—"],
  ];
  return (
    <Panel>
      <CardBody>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <StudentAvatar name={name} gender={card?.gender ?? null} size={40} />
            <div className="min-w-0 truncate text-[20px] font-normal leading-tight text-ink-900">{name}</div>
          </div>
          <ProfileMenu
            name={name}
            gender={card?.gender ?? null}
            promptLabel={t("dashboard.logoutPrompt")}
            confirmLabel={t("dashboard.confirmSignOut")}
            cancelLabel={t("dashboard.cancel")}
          />
        </div>
        <dl className="mt-3.5 space-y-2 border-t border-hair pt-3">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <dt className="text-[12px] text-muted">{label}</dt>
              <dd className="min-w-0 truncate text-right text-[13px] font-medium text-ink-900 tabular">{value}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
    </Panel>
  );
}

// ── Middle: the largest area — greeting + performance overview ───────────────
async function MainContent({ name, standing, att }: { name: string; standing: Standing | null; att: Att | null }) {
  const { t, locale } = await getT();
  const firstName = name.split(" ").slice(-1)[0];
  return (
    <Panel className="flex flex-col p-6">
      <div>
        <h1 className="t-h1 text-ink-900">{t("dashboard.hello", { name: firstName })}</h1>
        <p className="mt-1 text-[14px] text-ink-500">{t("dashboard.overview")}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat label={`${t("progress.overall")} ${t("progress.average")}`} value={fmtPercent(locale, standing?.studentAvg ?? null, 1)} tone="gold" />
        <Stat label={t("attendance.percent")} value={att ? `${att.pct}%` : "—"} tone={att && att.pct < 75 ? "down" : "up"} sub={att ? `${att.present}/${att.total}` : undefined} />
        <Stat label={t("progress.sectionStanding")} value={standing?.sectionRank ? `${standing.sectionRank}/${standing.sectionSize}` : "—"} sub={standing ? `${t("progress.sectionAvg")} ${fmtPercent(locale, standing.sectionAvg, 1)}` : undefined} />
        <Stat label={t("progress.classStanding")} value={standing?.classRank ? `${standing.classRank}/${standing.classSize}` : "—"} sub={standing ? `${t("progress.classAvg")} ${fmtPercent(locale, standing.classAvg, 1)}` : undefined} />
      </div>

      {/* Progress call-to-action */}
      <div className="mt-5 rounded-sm bg-surface p-5">
        <div className="t-label mb-1">{t("nav.myProgress")}</div>
        <h3 className="t-h3 text-ink-900">{t("progress.title")}</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-500">{t("dashboard.progressCta")}</p>
        <Link href="/progress" className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-ink-900 px-3.5 py-2 text-[13px] font-normal text-gold-100 transition-colors hover:bg-ink-700">
          {t("nav.myProgress")}
          <ArrowRightIcon size={14} />
        </Link>
      </div>
    </Panel>
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
  const items = (data ?? []).map((a) => ({ id: a.id, title: a.title, body: a.body, date: fmtDate(locale, a.published_at) }));
  return (
    <Panel>
      <CardHeader
        title={t("announce.title")}
        action={
          <Link href="/announcements" className="inline-flex items-center gap-1 text-[12px] font-normal text-gold-700 hover:text-ink-900">
            {t("dashboard.viewAll")}
            <ArrowRightIcon size={13} />
          </Link>
        }
      />
      <CardBody className="pt-2">
        <AnnouncementsList items={items} emptyLabel={t("common.noData")} />
      </CardBody>
    </Panel>
  );
}

// ── Right column: Quick Links (two columns) ──────────────────────────────────
async function QuickLinksCard() {
  const { t } = await getT();
  const links = navFor("student").filter((l) => l.href !== "/");
  return (
    <Panel>
      <CardHeader eyebrow={t("dashboard.quickLinks")} />
      <CardBody className="pt-2">
        <div className="grid grid-cols-2 gap-2.5">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href + l.labelKey}
                href={l.href}
                className="group flex flex-col items-center gap-1.5 rounded-sm bg-surface px-2 py-3 text-center transition-colors hover:bg-gold-100"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gold-100 text-gold-700 transition-colors group-hover:bg-surface">
                  <Icon size={18} />
                </span>
                <span className="text-[12px] font-normal leading-tight text-ink-900">{t(l.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </CardBody>
    </Panel>
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
    <Panel>
      <CardHeader
        eyebrow={t("dashboard.thisMonth")}
        title={t("announce.events")}
        action={
          <Link href="/calendar" className="inline-flex items-center gap-1 text-[12px] font-normal text-gold-700 hover:text-ink-900">
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
                  <Link href="/calendar" className="group flex items-center gap-2.5 rounded-sm p-1 transition-colors hover:bg-surface">
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
          <div className="flex items-center gap-2 rounded-sm bg-surface px-3 py-4 text-[13px] text-muted">
            <CalendarIcon size={16} className="text-muted" />
            {t("dashboard.noEventsMonth")}
          </div>
        )}
      </CardBody>
    </Panel>
  );
}
