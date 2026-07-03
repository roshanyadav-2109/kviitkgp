import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { fmtRelative } from "@/i18n/format";
import { EmptyState } from "@/components/ui/empty";
import { AnnounceIcon } from "@/components/icons";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { getStaffScope } from "@/lib/data/scope";

const posterKey: Record<string, string> = { principal: "announce.byPrincipal", office: "announce.byOffice", class_teacher: "announce.byClassTeacher", subject_teacher: "announce.byTeacher" };
const scopeKey: Record<string, string> = { school: "announce.scopeSchool", class: "announce.scopeClass", section: "announce.scopeSection" };

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

  const feed = items && items.length ? (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((a) => {
        const role = (a.staff as unknown as { full_name: string; role: string } | null)?.role ?? "subject_teacher";
        return (
          <article key={a.id} className="flex flex-col rounded-lg border border-hair bg-surface p-5">
            {/* Sender */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black text-white">
                <AnnounceIcon size={17} />
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-ink-900">{t(posterKey[role] ?? "announce.byOffice")}</div>
                <div className="text-[12px] text-ink-900">{fmtRelative(locale, a.published_at)}</div>
              </div>
            </div>

            {/* Title + fading body, with a right accent bar */}
            <div className="mt-4 flex gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[16px] font-bold leading-snug text-ink-900">{a.title}</h2>
                <div className="relative mt-1.5 max-h-[5.5rem] overflow-hidden">
                  <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-900">{a.body}</p>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-surface to-transparent" />
                </div>
              </div>
              <span aria-hidden className="w-[3px] shrink-0 self-stretch rounded-full bg-[rgb(37,99,235)]/25" />
            </div>

            <div className="mt-4 border-t border-dashed border-hair" />
            <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-900">
              {t(scopeKey[a.scope] ?? "announce.scopeSchool")}
            </div>
          </article>
        );
      })}
    </div>
  ) : (
    <EmptyState icon={AnnounceIcon} title={t("common.noData")} hint={isStaff ? t("announce.new") : undefined} />
  );

  if (!isStaff || !scope) return feed;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      {feed}
      <AnnouncementForm sections={scope.sections} allowSchool={scope.isAdmin} />
    </div>
  );
}
