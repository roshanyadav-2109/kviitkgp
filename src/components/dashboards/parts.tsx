import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { fmtDate } from "@/i18n/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { AnnounceIcon, CalendarIcon } from "@/components/icons";
import { navFor, type NavRole } from "@/lib/nav";
import { cn } from "@/lib/utils";

export async function DashHeader({ name, subtitleKey = "dashboard.overview" }: { name: string; subtitleKey?: string }) {
  const { t } = await getT();
  const firstName = name.split(" ").slice(-1)[0];
  return (
    <div className="mb-6">
      <h1 className="t-h1 text-ink-900">{t("dashboard.hello", { name: firstName })}</h1>
      <p className="mt-1 text-[14px] text-ink-500">{t(subtitleKey)}</p>
    </div>
  );
}

export function StatCard({ label, value, sub, tone = "ink" }: { label: string; value: React.ReactNode; sub?: string; tone?: "ink" | "up" | "down" | "watch" | "gold" }) {
  const toneCls = { ink: "text-ink-900", up: "text-up", down: "text-down", watch: "text-watch", gold: "text-gold-700" }[tone];
  return (
    <div className="rounded-md border border-hair bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="t-label">{label}</div>
      <div className={cn("mt-1 text-[30px] font-bold leading-none tabular", toneCls)}>{value}</div>
      {sub && <div className="mt-1.5 text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

// Reusable async panels (RLS-scoped) used across every role dashboard.
export async function AnnouncementsPanel() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const { data } = await supabase
    .from("announcement")
    .select("id, title, body, published_at")
    .order("published_at", { ascending: false })
    .limit(4);
  return (
    <Card>
      <CardHeader eyebrow={t("dashboard.recentAnnouncements")} title={t("announce.title")} />
      <CardBody className="pt-2">
        {data && data.length ? (
          <ul className="divide-y divide-hair">
            {data.map((a) => (
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
  );
}

export async function EventsPanel() {
  const supabase = await createClient();
  const { t, locale } = await getT();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: future }, { data: recent }] = await Promise.all([
    supabase.from("event").select("id, title, event_type, start_date").gte("start_date", today).order("start_date", { ascending: true }).limit(4),
    supabase.from("event").select("id, title, event_type, start_date").order("start_date", { ascending: false }).limit(4),
  ]);
  const rows = (future && future.length ? future : recent ?? []).slice(0, 4);
  return (
    <Card>
      <CardHeader eyebrow={t("dashboard.upcoming")} title={t("announce.events")} />
      <CardBody className="pt-2">
        {rows.length ? (
          <ul className="divide-y divide-hair">
            {rows.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-panel text-ink-700"><CalendarIcon size={16} /></span>
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
  );
}

export async function QuickLinks({ role }: { role: NavRole }) {
  const { t } = await getT();
  const links = navFor(role).filter((l) => l.href !== "/");
  return (
    <div>
      <div className="t-label mb-2">{t("dashboard.quickLinks")}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href + l.labelKey} href={l.href} className="group flex items-center gap-3 rounded-md border border-hair bg-surface p-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-gold-500 hover:bg-gold-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-gold-100 text-gold-700 group-hover:bg-surface"><Icon size={20} /></span>
              <span className="text-[14px] font-semibold text-ink-900">{t(l.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
