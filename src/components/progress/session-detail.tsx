"use client";
import { useState } from "react";
import { useT } from "@/i18n/provider";

type Sessions = Awaited<ReturnType<typeof import("@/lib/data/analytics").getStudentProgress>>["sessions"];

const bandCell: Record<string, string> = {
  A1: "bg-up-soft text-up", A2: "bg-up-soft text-up", B1: "bg-gold-100 text-gold-700",
  B2: "bg-gold-100 text-gold-700", C1: "bg-watch-soft text-watch", C2: "bg-watch-soft text-watch",
  D: "bg-down-soft text-down", E: "bg-down-soft text-down",
};

export function SessionDetail({ sessions }: { sessions: Sessions }) {
  const t = useT();
  const [yearId, setYearId] = useState<number>(sessions[0]?.yearId ?? 0);
  const sess = sessions.find((s) => s.yearId === yearId) ?? sessions[0];
  if (!sess) return <p className="py-2 text-[14px] text-ink-500">{t("common.noData")}</p>;

  return (
    <div>
      {/* Session selector */}
      <div className="mb-3 flex flex-wrap gap-2">
        {sessions.map((s) => {
          const active = s.yearId === sess.yearId;
          return (
            <button key={s.yearId} onClick={() => setYearId(s.yearId)}
              className={`rounded-sm border px-3 py-1.5 text-[13px] font-medium transition-colors ${active ? "border-gold-500 bg-gold-100 text-ink-900" : "border-hair bg-surface text-ink-500 hover:bg-panel"}`}>
              {s.yearName}{s.isCurrent ? " ★" : ""}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2 pr-3 font-semibold">{t("common.subject")}</th>
              {sess.assessments.map((a) => (<th key={a} className="px-1.5 pb-2 text-center font-semibold">{a}</th>))}
            </tr>
          </thead>
          <tbody>
            {sess.subjects.map((sub) => (
              <tr key={sub.code} className="border-t border-hair">
                <td className="py-1.5 pr-3 font-medium text-ink-900">{sub.name}</td>
                {sess.assessments.map((a) => {
                  const c = sub.cells[a];
                  return (
                    <td key={a} className="px-1 py-1.5 text-center">
                      {c ? (
                        <span className={`inline-block min-w-[38px] rounded-xs px-1.5 py-1 font-semibold tabular ${bandCell[c.band ?? "flat"] ?? "bg-panel text-ink-500"}`}>{c.percent}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
