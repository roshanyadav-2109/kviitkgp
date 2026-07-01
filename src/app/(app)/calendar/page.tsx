import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { MonthCalendar, type CalItem } from "@/components/calendar/month-calendar";

export default async function CalendarPage() {
  const session = (await getSession())!;
  const supabase = await createClient();
  const { t } = await getT();

  const items: CalItem[] = [];

  // Events — visible to everyone in scope (RLS).
  const { data: events } = await supabase.from("event").select("title, event_type, start_date");
  for (const e of events ?? []) items.push({ date: e.start_date, kind: e.event_type, label: e.title });

  if (session.role === "student" || session.role === "guardian") {
    // Owner: their own assessment marks on the day they were assessed.
    const { data: marks } = await supabase
      .from("v_mark_detail")
      .select("assessed_on, subject_code, percent, is_numeric, marks_obtained");
    for (const m of marks ?? []) {
      if (!m.is_numeric || m.marks_obtained == null || !m.assessed_on) continue;
      items.push({ date: m.assessed_on, kind: "mark", label: `${m.subject_code} ${m.percent}%` });
    }
  } else {
    // Staff: assessment windows for their sections (deduped by date + name).
    const { data: assess } = await supabase.from("assessment").select("assessed_on, name");
    const seen = new Set<string>();
    for (const a of assess ?? []) {
      const key = `${a.assessed_on}|${a.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ date: a.assessed_on, kind: "exam", label: a.name });
    }
  }

  // Default to the month of the most recent item (data lives in 2024–2026).
  const latest = items.map((i) => i.date).sort().at(-1);
  const defaultMonth = latest ? latest.slice(0, 7) : "2026-02";

  return (
    <div>
      <PageHeader title={t("announce.events")} description={t("nav.calendar")} />
      <MonthCalendar items={items} defaultMonth={defaultMonth} />
    </div>
  );
}
