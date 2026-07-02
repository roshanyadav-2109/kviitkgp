import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { fmtRelative } from "@/i18n/format";
import { EmptyState } from "@/components/ui/empty";
import { AnnounceIcon, GradCapIcon, AllotmentIcon, UserIconC } from "@/components/icons";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { getStaffScope } from "@/lib/data/scope";
import { cn } from "@/lib/utils";

const posterKey: Record<string, string> = { principal: "announce.byPrincipal", office: "announce.byOffice", class_teacher: "announce.byClassTeacher", subject_teacher: "announce.byTeacher" };
const scopeKey: Record<string, string> = { school: "announce.scopeSchool", class: "announce.scopeClass", section: "announce.scopeSection" };
// Distinct filled tag colours per scope (white text on top).
const scopeColor: Record<string, string> = { school: "bg-[rgb(79,70,229)]", class: "bg-[rgb(13,148,136)]", section: "bg-[rgb(194,65,12)]" };
// Profile icon per poster role.
const avatarMeta: Record<string, { Icon: typeof AnnounceIcon; tone: string }> = {
  principal: { Icon: GradCapIcon, tone: "bg-gold-100 text-gold-700" },
  office: { Icon: AllotmentIcon, tone: "bg-panel text-ink-700" },
  class_teacher: { Icon: UserIconC, tone: "bg-gold-100 text-gold-700" },
  subject_teacher: { Icon: UserIconC, tone: "bg-panel text-ink-700" },
};

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
          const av = avatarMeta[staff?.role ?? ""] ?? avatarMeta.subject_teacher;
          const Avatar = av.Icon;
          return (
            <article key={a.id} className="rounded-md border border-hair bg-surface p-5">
              <div className="flex items-start gap-3">
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", av.tone)}>
                  <Avatar size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-ink-900">{t(posterKey[staff?.role ?? ""] ?? "announce.byOffice")}</div>
                  <div className="mt-0.5 text-[12px] text-muted">{fmtRelative(locale, a.published_at)}</div>
                </div>
                <span className={cn("shrink-0 rounded-sm px-2.5 py-0.5 text-[11px] font-semibold text-white", scopeColor[a.scope] ?? scopeColor.school)}>
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
