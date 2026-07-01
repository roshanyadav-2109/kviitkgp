"use client";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { DeltaBadge } from "@/components/ui/status";
import { KVBarChart } from "@/components/charts";
import { TrophyIcon, AlertIcon, ProgressIcon } from "@/components/icons";
import { useI18n } from "@/i18n/provider";
import { fmtPercent } from "@/i18n/format";

type Analytics = Awaited<ReturnType<typeof import("@/lib/data/analytics").getClassAnalytics>>;

export function ClassAnalyticsView({ data, subjectName }: { data: Analytics; subjectName: string | null }) {
  const { t, locale } = useI18n();
  if (!data.subjectAverages.length && !data.sectionComparison.length) {
    return <EmptyState icon={ProgressIcon} title={t("progress.noMarks")} />;
  }

  return (
    <div className="space-y-5">
      {data.conclusions.length > 0 && (
        <Card className="border-gold-500/40 bg-gold-100/50">
          <CardHeader eyebrow={t("progress.autoInsights")} title="" />
          <CardBody className="pt-1">
            <ul className="space-y-2">
              {data.conclusions.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] text-ink-900"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-700" />{c}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Section comparison — the headline of a whole-class view */}
        <Card>
          <CardHeader eyebrow={t("progress.sectionCompare")} title={subjectName ?? t("common.all")} />
          <CardBody className="pt-2">
            {data.sectionComparison.length ? (
              <KVBarChart data={data.sectionComparison} xKey="name" valueKey="avg" horizontal height={260} />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-[14px] text-ink-500">{t("common.noData")}</div>
            )}
          </CardBody>
        </Card>

        {/* Subject vs subject across the class */}
        <Card>
          <CardHeader eyebrow={t("progress.subjectCompare")} title={t("progress.average")} />
          <CardBody className="pt-2">
            <KVBarChart data={data.subjectAverages} xKey="subject" valueKey="avg" horizontal height={260} />
          </CardBody>
        </Card>

        {/* Distribution across the class */}
        <Card>
          <CardHeader eyebrow={t("progress.distribution")} title={subjectName ?? t("common.all")} />
          <CardBody className="pt-2">
            <KVBarChart data={data.distribution} xKey="band" valueKey="n" colorByBand showValues
              maxDomain={Math.max(5, ...data.distribution.map((d) => d.n)) + 2} height={260} />
          </CardBody>
        </Card>

        {/* Best performers across the class (with section) */}
        <Card>
          <CardHeader eyebrow={t("progress.topPerformers")} title="" action={<TrophyIcon size={18} className="text-gold-700" />} />
          <CardBody className="pt-1">
            <ol className="space-y-1.5">
              {data.topPerformers.map((s, i) => (
                <li key={i} className="flex items-center gap-3 rounded-sm px-2 py-1.5 odd:bg-panel/50">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-[12px] font-bold text-gold-700 tabular">{i + 1}</span>
                  <span className="flex-1 truncate text-[14px] text-ink-900">{s.student_name}</span>
                  <span className="rounded-xs bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-ink-500 tabular">{s.section_name}</span>
                  <span className="text-[14px] font-semibold tabular text-ink-900">{fmtPercent(locale, Number(s.avg_percent), 1)}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>

      {/* Needs support across the class */}
      <Card className="border-watch/30">
        <CardHeader eyebrow={t("progress.needsSupport")} title="" action={<AlertIcon size={18} className="text-watch" />} />
        <CardBody className="pt-1">
          <p className="mb-2 text-[12px] text-muted">{t("progress.needsSupportNote")}</p>
          {data.needsSupport.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {data.needsSupport.slice(0, 8).map((s, i) => (
                <div key={i} className="rounded-sm border border-hair bg-surface p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-ink-900">{s.student_name}</span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-xs bg-panel px-1.5 py-0.5 text-[11px] font-semibold text-ink-500 tabular">{s.section_name}</span>
                      <DeltaBadge value={Math.round(Number(s.recent_trend))} />
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-500">{s.reason}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-2 text-[14px] text-ink-500">{t("common.noData")}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
