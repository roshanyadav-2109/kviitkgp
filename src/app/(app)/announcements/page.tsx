import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { fmtDate } from "@/i18n/format";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status";
import { AnnounceIcon } from "@/components/icons";
import { AnnouncementForm } from "@/components/announcements/announcement-form";
import { getStaffScope } from "@/lib/data/scope";

const scopeLabel: Record<string, string> = { school: "announce.scopeSchool", class: "announce.scopeClass", section: "announce.scopeSection" };

export default async function AnnouncementsPage() {
  const session = (await getSession())!;
  const supabase = await createClient();
  const { t, locale } = await getT();

  const { data: items } = await supabase
    .from("announcement")
    .select("id, title, body, scope, published_at, class_id, section_id")
    .order("published_at", { ascending: false });

  const isStaff = !!session.staffId;
  const scope = isStaff ? await getStaffScope() : null;

  return (
    <div>
      <PageHeader title={t("announce.title")} />
      <div className={isStaff ? "grid gap-5 lg:grid-cols-[1fr_360px]" : ""}>
        <div className="space-y-3">
          {items && items.length ? (
            items.map((a) => (
              <Card key={a.id}>
                <CardBody>
                  <div className="mb-1 flex items-center gap-2">
                    <AnnounceIcon size={16} className="text-gold-700" />
                    <StatusPill status="flat">{t(scopeLabel[a.scope])}</StatusPill>
                    <span className="ml-auto text-[12px] text-muted">{fmtDate(locale, a.published_at)}</span>
                  </div>
                  <h3 className="t-h3 text-ink-900">{a.title}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-700">{a.body}</p>
                </CardBody>
              </Card>
            ))
          ) : (
            <EmptyState icon={AnnounceIcon} title={t("common.noData")} hint={isStaff ? t("announce.new") : undefined} />
          )}
        </div>
        {isStaff && scope && (
          <AnnouncementForm sections={scope.sections} allowSchool={scope.isAdmin} />
        )}
      </div>
    </div>
  );
}
