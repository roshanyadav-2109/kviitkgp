"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ReportIcon } from "@/components/icons";
import { useT } from "@/i18n/provider";

export function ReportControls({ month, extra }: { month: string; extra?: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setMonth(v: string) {
    const next = new URLSearchParams(params.toString());
    if (v) next.set("month", v);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="no-print mb-5 flex flex-wrap items-end gap-3 rounded-md border border-hair bg-surface p-3 shadow-[var(--shadow-card)]">
      <div className="min-w-[160px]">
        <label className="t-label mb-1 block">{t("report.month")}</label>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
      </div>
      {extra}
      <Button variant="subtle" onClick={() => window.print()} className="ml-auto">
        <ReportIcon size={16} /> {t("x.download")}
      </Button>
    </div>
  );
}
