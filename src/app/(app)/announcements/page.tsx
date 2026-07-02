import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { fmtDate } from "@/i18n/format";
import { EmptyState } from "@/components/ui/empty";
import { AnnounceIcon, CheckIcon, ReplyIcon, RepostIcon, LikeIcon, ViewsIcon, ShareIcon, MoreIcon } from "@/components/icons";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { getStaffScope } from "@/lib/data/scope";

// Poster identity by the author's staff role — official accounts get a badge.
const posterMeta: Record<string, { key: string; handle: string; verified: boolean }> = {
  principal: { key: "announce.byPrincipal", handle: "principal_desk", verified: true },
  office: { key: "announce.byOffice", handle: "school_office", verified: true },
  class_teacher: { key: "announce.byClassTeacher", handle: "class_teacher", verified: false },
  subject_teacher: { key: "announce.byTeacher", handle: "teacher", verified: false },
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
    <div className="flex max-h-[calc(100dvh-2.5rem)] flex-col overflow-hidden rounded-lg border border-hair bg-surface">
      {/* Column header, like a timeline's sticky top */}
      <div className="shrink-0 border-b border-hair px-4 py-3">
        <h1 className="text-[17px] font-extrabold tracking-tight text-ink-900">{t("announce.title")}</h1>
      </div>

      {/* The scroll zone */}
      <div className="min-h-0 flex-1 divide-y divide-hair overflow-y-auto">
        {items && items.length ? (
          items.map((a) => {
            const role = (a.staff as unknown as { full_name: string; role: string } | null)?.role ?? "subject_teacher";
            const meta = posterMeta[role] ?? posterMeta.subject_teacher;
            return (
              <article key={a.id} className="px-4 py-3 transition-colors hover:bg-panel/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1 text-[14px] leading-tight">
                    <span className="truncate font-bold text-ink-900">{t(meta.key)}</span>
                    {meta.verified && <CheckIcon size={15} className="shrink-0 text-gold-500" />}
                    <span className="truncate text-muted">@{meta.handle}</span>
                    <span className="shrink-0 text-muted">·</span>
                    <span className="shrink-0 whitespace-nowrap text-muted">{fmtDate(locale, a.published_at, { day: "numeric", month: "short", year: "2-digit" })}</span>
                  </div>
                  <MoreIcon size={16} className="mt-0.5 shrink-0 text-muted" />
                </div>
                <h2 className="mt-1 text-[15px] font-semibold text-ink-900">{a.title}</h2>
                <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-700">{a.body}</p>
                {/* X-style action bar */}
                <div className="mt-2.5 flex max-w-sm items-center justify-between text-muted">
                  <ReplyIcon size={16} className="transition-colors hover:text-ink-700" />
                  <RepostIcon size={16} className="transition-colors hover:text-up" />
                  <LikeIcon size={16} className="transition-colors hover:text-down" />
                  <ViewsIcon size={16} className="transition-colors hover:text-ink-700" />
                  <ShareIcon size={16} className="transition-colors hover:text-ink-700" />
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState icon={AnnounceIcon} title={t("common.noData")} hint={isStaff ? t("announce.new") : undefined} />
        )}
      </div>
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
