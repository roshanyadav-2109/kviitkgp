import { createClient } from "@/lib/supabase/server";

export async function getDateAttendance(sectionId: number, date: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_record")
    .select("student_id, status")
    .eq("section_id", sectionId)
    .eq("on_date", date)
    .is("period", null);
  const map = new Map<number, string>();
  for (const r of data ?? []) map.set(r.student_id, r.status);
  return map;
}

export type AttSummary = { studentId: number; present: number; total: number; pct: number };

// Per-student attendance % for a section across the year (present+late count).
export async function getSectionAttendanceSummary(sectionId: number, yearId: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_record")
    .select("student_id, status")
    .eq("section_id", sectionId)
    .eq("academic_year_id", yearId)
    .is("period", null);
  const agg = new Map<number, { present: number; total: number }>();
  for (const r of data ?? []) {
    const a = agg.get(r.student_id) ?? { present: 0, total: 0 };
    a.total += 1;
    if (r.status === "present" || r.status === "late") a.present += 1;
    agg.set(r.student_id, a);
  }
  const out = new Map<number, AttSummary>();
  for (const [studentId, a] of agg) {
    out.set(studentId, { studentId, present: a.present, total: a.total, pct: a.total ? Math.round((a.present / a.total) * 1000) / 10 : 0 });
  }
  return out;
}

// Owner view: a student's own attendance summary + recent days.
export async function getStudentAttendance(studentId: number, yearId: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_record")
    .select("on_date, status")
    .eq("student_id", studentId)
    .eq("academic_year_id", yearId)
    .is("period", null)
    .order("on_date", { ascending: false });
  const rows = data ?? [];
  const total = rows.length;
  const present = rows.filter((r) => r.status === "present" || r.status === "late").length;
  const pct = total ? Math.round((present / total) * 1000) / 10 : 0;
  return { pct, present, total, recent: rows.slice(0, 30) };
}

// Dates that already have attendance in a section (for the date picker default).
export async function getLatestAttendanceDate(sectionId: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("attendance_record")
    .select("on_date")
    .eq("section_id", sectionId)
    .order("on_date", { ascending: false })
    .limit(1);
  return data?.[0]?.on_date ?? null;
}
