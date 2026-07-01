"use client";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DeltaBadge, BandChip } from "@/components/ui/status";
import { EmptyState } from "@/components/ui/empty";
import { KVLineChart, KVBarChart, SERIES } from "@/components/charts";
import { ProgressIcon, NotebookIcon, TrophyIcon } from "@/components/icons";
import { SessionDetail } from "@/components/progress/session-detail";
import { useI18n } from "@/i18n/provider";
import { fmtDate, fmtPercent } from "@/i18n/format";

type Progress = Awaited<ReturnType<typeof import("@/lib/data/analytics").getStudentProgress>>;
type Standing = Awaited<ReturnType<typeof import("@/lib/data/analytics").getStudentStanding>>;

export function StudentProgressView({ data, standing }: { data: Progress; standing?: Standing }) {
  const { t, locale } = useI18n();
  if (!data.hasData || !data.student) {
    return <EmptyState icon={ProgressIcon} title={t("progress.noMarks")} hint={t("progress.pickStudent")} />;
  }

  const lines = data.seriesSubjects.map((s, i) => ({ key: s.code, name: s.name, color: SERIES[i % SERIES.length] }));

  function deltaText(delta: number | null, prev: number | null) {
    if (delta === null || prev === null) return t("progress.overall");
    if (delta >= 1) return t("progress.upFrom", { prev });
    if (delta <= -1) return t("progress.downFrom", { prev });
    return t("progress.steady");
  }

  return (
    <div className="space-y-5">
      {/* Overall + standing */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="t-label">{t("progress.overall")} · {t("progress.average")}</div>
            <div className="mt-1 text-[34px] font-bold leading-none tabular text-ink-900">{fmtPercent(locale, data.currentAvg, 1)}</div>
            <div className="mt-3 space-y-1">
              {data.yearOnYear.map((y) => (
                <div key={y.year} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-500">{y.year}</span>
                  <span className="font-semibold tabular text-ink-900">{fmtPercent(locale, y.avg, 1)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <StandingCard label={t("progress.sectionStanding")} rank={standing?.sectionRank} size={standing?.sectionSize}
          avg={standing?.studentAvg} groupAvg={standing?.sectionAvg} groupLabel={t("progress.sectionAvg")} locale={locale} t={t} />
        <StandingCard label={t("progress.classStanding")} rank={standing?.classRank} size={standing?.classSize}
          avg={standing?.studentAvg} groupAvg={standing?.classAvg} groupLabel={t("progress.classAvg")} locale={locale} t={t} />
      </div>

      {/* Subject trend lines */}
      <Card>
        <CardHeader eyebrow={t("progress.subjectTrends")} title={data.student.full_name} />
        <CardBody className="pt-2"><KVLineChart data={data.chartData} xKey="label" lines={lines} height={240} /></CardBody>
      </Card>

      {/* Per-subject latest with delta */}
      <Card>
        <CardHeader eyebrow={t("progress.subjectTrends")} title={t("common.subject")} />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.subjects.map((s) => (
            <div key={s.code} className="rounded-md border border-hair bg-panel/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-ink-900">{s.name}</span>
                <BandChip band={s.band} />
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-[26px] font-bold leading-none tabular text-ink-900">{s.latest}</span>
                <span className="pb-0.5 text-[13px] text-muted">%</span>
                <DeltaBadge value={s.delta} className="mb-0.5 ml-auto" />
              </div>
              <div className="mt-1 text-[12px] text-ink-500">{deltaText(s.delta, s.prev)}</div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Every session in detail — filter by session */}
      <Card>
        <CardHeader eyebrow={t("progress.allSessions")} title={t("progress.timeline")} />
        <CardBody className="pt-2">
          <SessionDetail key={data.student?.id ?? 0} sessions={data.sessions} />
        </CardBody>
      </Card>

      {/* Year-on-year overall */}
      {data.yearOnYear.length > 1 && (
        <Card>
          <CardHeader eyebrow={t("progress.yearOnYear")} title={t("progress.overall")} />
          <CardBody className="pt-2"><KVBarChart data={data.yearOnYear} xKey="year" valueKey="avg" height={200} /></CardBody>
        </Card>
      )}

      {/* Observations */}
      <Card>
        <CardHeader eyebrow={t("progress.timeline")} title={t("x.progObservations")} />
        <CardBody className="pt-2">
          {data.observations.length ? (
            <ul className="space-y-3">
              {data.observations.map((o) => (
                <li key={o.id} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gold-100 text-gold-700"><NotebookIcon size={15} /></span>
                  <div className="min-w-0">
                    <div className="text-[14px] text-ink-900">{o.body}</div>
                    <div className="mt-0.5 text-[12px] text-muted"><span className="capitalize">{o.category}</span>{o.subject ? ` · ${o.subject}` : ""} · {o.staff} · {fmtDate(locale, o.date)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-2 text-[14px] text-ink-500">{t("common.noData")}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StandingCard({ label, rank, size, avg, groupAvg, groupLabel, locale, t }: {
  label: string; rank?: number; size?: number; avg?: number | null; groupAvg?: number | null; groupLabel: string;
  locale: "en" | "hi" | "bn"; t: (k: string, v?: Record<string, string | number>) => string;
}) {
  return (
    <Card>
      <CardBody>
        <div className="t-label flex items-center gap-1.5"><TrophyIcon size={14} className="text-gold-700" />{label}</div>
        {rank && size ? (
          <>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[34px] font-bold leading-none tabular text-ink-900">{rank}</span>
              <span className="text-[15px] text-muted tabular">/ {size}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[13px]">
              <span className="text-ink-500">{groupLabel}</span>
              <span className="tabular text-ink-700">{fmtPercent(locale, groupAvg, 1)}</span>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[13px] text-ink-500">{t("common.noData")}</p>
        )}
      </CardBody>
    </Card>
  );
}
