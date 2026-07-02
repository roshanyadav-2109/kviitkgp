import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { fmtDate } from "@/i18n/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { Card } from "@/components/ui/card";
import { AnnounceIcon, GradCapIcon, AllotmentIcon, UserIconC } from "@/components/icons";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { getStaffScope } from "@/lib/data/scope";
import { cn } from "@/lib/utils";

// Poster identity by the author's staff role — a class teacher reads as "Class
// Teacher", the principal as "Principal's Desk", office as "School Office".
const posterMeta: Record<string, { key: string; Icon: typeof AnnounceIcon; tone: string }> = {
  principal: { key: "announce.byPrincipal", Icon: GradCapIcon, tone: "bg-gold-500 text-ink-900" },
  office: { key: "announce.byOffice", Icon: AllotmentIcon, tone: "bg-ink-900 text-gold-100" },
  class_teacher: { key: "announce.byClassTeacher", Icon: UserIconC, tone: "bg-gold-100 text-gold-700" },
  subject_teacher: { key: "announce.byTeacher", Icon: UserIconC, tone: "bg-panel text-ink-700" },
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

  return (
    <div>
      <PageHeader title={t("announce.title")} />
      <div className={isStaff ? "grid gap-5 lg:grid-cols-[1fr_360px]" : ""}>
        {items && items.length ? (
          // A scrolling feed of posts, like a social timeline.
          <Card className="divide-y divide-hair overflow-hidden">
            {items.map((a) => {
              const role = (a.staff as unknown as { full_name: string; role: string } | null)?.role ?? "subject_teacher";
              const meta = posterMeta[role] ?? posterMeta.subject_teacher;
              const Icon = meta.Icon;
              return (
                <article key={a.id} className="flex gap-3 p-4">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", meta.tone)}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-1.5 text-[13px]">
                      <span className="font-semibold text-ink-900">{t(meta.key)}</span>
                      <span className="text-muted">· {fmtDate(locale, a.published_at)}</span>
                    </div>
                    <h3 className="mt-0.5 text-[15px] font-semibold text-ink-900">{a.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-700">{a.body}</p>
                  </div>
                </article>
              );
            })}
          </Card>
        ) : (
          <EmptyState icon={AnnounceIcon} title={t("common.noData")} hint={isStaff ? t("announce.new") : undefined} />
        )}
        {isStaff && scope && (
          <AnnouncementForm sections={scope.sections} allowSchool={scope.isAdmin} />
        )}
      </div>
    </div>
  );
}
