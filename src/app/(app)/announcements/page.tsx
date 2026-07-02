import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { fmtRelative } from "@/i18n/format";
import { EmptyState } from "@/components/ui/empty";
import { AnnounceIcon } from "@/components/icons";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { getStaffScope } from "@/lib/data/scope";
import { cn } from "@/lib/utils";

const roleShort: Record<string, string> = { principal: "Principal", office: "Office", class_teacher: "Class Teacher", subject_teacher: "Teacher" };
const scopeKey: Record<string, string> = { school: "announce.scopeSchool", class: "announce.scopeClass", section: "announce.scopeSection" };

function initialsOf(name: string) {
  const clean = name.replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, "").trim();
  return clean.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "KV";
}

export default async function AnnouncementsPage() {
  const session = (await getSession())!;
  const supabase = await createClient();
  const { t, locale } = await getT();

  const { data: items } = await supabase
    .from("announcement")
    .select("id, title, body, scope, published_at, class_id, section_id, staff:created_by(full_name, role)")
    .order("published_at", { ascending: false });

  const isStaff = !!session.staffId;
  const scope = isStaff ? await getStaffScope() : null;

  const feed = (
    <div className="space-y-4">
      {items && items.length ? (
        items.map((a) => {
          const staff = a.staff as unknown as { full_name: string; role: string } | null;
          const name = staff?.full_name ?? "KV No.1";
          const role = roleShort[staff?.role ?? ""] ?? "Staff";
          return (
            <article key={a.id} className="rounded-xl border border-hair bg-surface p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-panel text-[13px] font-semibold text-ink-700">
                  {initialsOf(name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5">
                    <span className="font-bold text-ink-900">{name}</span>
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">| {role}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted">{fmtRelative(locale, a.published_at)}</div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold",
                    a.scope === "school" ? "bg-gold-500 text-ink-900" : "bg-panel text-ink-600",
                  )}
                >
                  {t(scopeKey[a.scope] ?? "announce.scopeSchool")}
                </span>
              </div>

              <h2 className="mt-4 text-[16px] font-bold leading-snug text-ink-900">{a.title}</h2>
              <div className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-700">{a.body}</div>
            </article>
          );
        })
      ) : (
        <EmptyState icon={AnnounceIcon} title={t("common.noData")} hint={isStaff ? t("announce.new") : undefined} />
      )}
    </div>
  );

  if (!isStaff || !scope) return feed;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      {feed}
      <AnnouncementForm sections={scope.sections} allowSchool={scope.isAdmin} />
    </div>
  );
}
