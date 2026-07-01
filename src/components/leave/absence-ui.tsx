"use client";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status";
import { AlertIcon } from "@/components/icons";
import { useI18n } from "@/i18n/provider";
import { fmtDate } from "@/i18n/format";
import { explainAbsences } from "@/app/(app)/leave/actions";
import type { AbsenceNotice } from "@/lib/data/absence";

export function AbsenceList({ notices, canExplain }: { notices: AbsenceNotice[]; canExplain: boolean }) {
  if (canExplain) return <OwnerAbsence notices={notices} />;
  return <StaffAbsence notices={notices} />;
}

// Owner: pick one or many absent days, give one shared reason.
function OwnerAbsence({ notices }: { notices: AbsenceNotice[] }) {
  const { t, locale } = useI18n();
  const pending = notices.filter((n) => n.status === "pending");
  const explained = notices.filter((n) => n.status !== "pending");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [reason, setReason] = useState("");
  const [busy, start] = useTransition();

  if (!notices.length) return <p className="py-2 text-[14px] text-ink-500">{t("common.noData")}</p>;

  const toggle = (id: number) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = pending.length > 0 && selected.size === pending.length;
  const selectAll = () => setSelected(allSelected ? new Set() : new Set(pending.map((n) => n.id)));

  function apply() {
    start(async () => {
      await explainAbsences([...selected], reason);
      setSelected(new Set());
      setReason("");
    });
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="rounded-md border border-watch/40 bg-watch-soft/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="t-label flex items-center gap-1.5"><AlertIcon size={14} className="text-watch" />{t("leave.selectDays")}</span>
            <button onClick={selectAll} className="text-[12px] font-semibold text-gold-700 hover:underline">{t("leave.selectAll")}</button>
          </div>
          <div className="mb-3 grid gap-1.5 sm:grid-cols-2">
            {pending.map((n) => {
              const on = selected.has(n.id);
              return (
                <label key={n.id} className={`flex cursor-pointer items-center gap-2.5 rounded-sm border px-2.5 py-2 text-[13px] transition-colors ${on ? "border-gold-500 bg-gold-100" : "border-hair bg-surface hover:bg-panel"}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(n.id)} className="h-4 w-4 accent-[var(--color-gold-700)]" />
                  <span className="font-medium text-ink-900">{fmtDate(locale, n.on_date)}</span>
                  <span className="ml-auto truncate text-[12px] text-muted">{n.studentName}</span>
                </label>
              );
            })}
          </div>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder={t("leave.absenceReason")} />
          <div className="mt-2">
            <Button size="sm" disabled={busy || !reason || selected.size === 0} onClick={apply}>
              {busy ? t("common.saving") : t("leave.applyToSelected", { n: selected.size })}
            </Button>
          </div>
        </div>
      )}

      {explained.length > 0 && (
        <ul className="space-y-2">
          {explained.map((n) => (
            <li key={n.id} className="rounded-md border border-hair bg-surface p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-ink-900">{n.studentName}</div>
                  <div className="text-[12px] text-muted tabular">{t("leave.absentOn", { date: fmtDate(locale, n.on_date) })}</div>
                </div>
                <StatusPill status="up">{t("leave.explained")}</StatusPill>
              </div>
              {n.reason && <p className="mt-2 rounded-sm bg-panel/60 px-2.5 py-1.5 text-[13px] text-ink-700">{n.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Staff: read-only list of section absences and their reasons.
function StaffAbsence({ notices }: { notices: AbsenceNotice[] }) {
  const { t, locale } = useI18n();
  if (!notices.length) return <p className="py-2 text-[14px] text-ink-500">{t("common.noData")}</p>;
  return (
    <ul className="space-y-2.5">
      {notices.map((n) => {
        const pending = n.status === "pending";
        return (
          <li key={n.id} className="rounded-md border border-hair bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-ink-900">{n.studentName}</div>
                <div className="text-[12px] text-muted tabular">{t("leave.absentOn", { date: fmtDate(locale, n.on_date) })}</div>
              </div>
              <StatusPill status={pending ? "watch" : "up"}>{pending ? t("leave.awaitingReason") : t("leave.explained")}</StatusPill>
            </div>
            {n.reason && <p className="mt-2 rounded-sm bg-panel/60 px-2.5 py-1.5 text-[13px] text-ink-700">{n.reason}</p>}
          </li>
        );
      })}
    </ul>
  );
}
