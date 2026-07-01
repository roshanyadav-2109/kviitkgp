import { createClient } from "@/lib/supabase/server";
import { getCurrentYear } from "@/lib/session";
import { getT } from "@/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status";
import { AllotmentIcon } from "@/components/icons";

export default async function AllotmentsPage() {
  const supabase = await createClient();
  const { t } = await getT();
  const year = await getCurrentYear();

  const { data } = await supabase
    .from("teacher_allotment")
    .select("id, is_class_teacher, staff:staff_id(full_name, role), section:section_id(name, class:class_id(name, level)), subject:subject_id(name)")
    .eq("academic_year_id", year?.id ?? -1);

  const rows = (data ?? []).map((a) => ({
    id: a.id,
    isCt: a.is_class_teacher,
    staff: (a.staff as unknown as { full_name: string } | null)?.full_name ?? "—",
    section: (() => { const s = a.section as unknown as { name: string; class: { name: string; level: number } } | null; return s ? { label: `${s.class.name}-${s.name}`, level: s.class.level } : { label: "—", level: 99 }; })(),
    subject: (a.subject as unknown as { name: string } | null)?.name ?? null,
  })).sort((x, y) => x.section.level - y.section.level || x.section.label.localeCompare(y.section.label));

  return (
    <div>
      <PageHeader title={t("nav.allotments")} description={year?.name} />
      <Card>
        <CardBody>
          {rows.length ? (
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[12px] text-muted">
                  <th className="pb-2 font-semibold">{t("roles.staff")}</th>
                  <th className="pb-2 font-semibold">{t("common.section")}</th>
                  <th className="pb-2 font-semibold">{t("common.subject")}</th>
                  <th className="pb-2 font-semibold">{t("roles.class_teacher")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-hair">
                    <td className="py-2 text-ink-900">{r.staff}</td>
                    <td className="py-2 tabular text-ink-700">{r.section.label}</td>
                    <td className="py-2 text-ink-700">{r.subject ?? "—"}</td>
                    <td className="py-2">{r.isCt && <StatusPill status="up">✓</StatusPill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon={AllotmentIcon} title={t("common.noData")} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
