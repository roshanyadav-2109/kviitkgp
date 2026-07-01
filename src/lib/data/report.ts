import { createClient } from "@/lib/supabase/server";

function monthBounds(monthStr: string) {
  const [y, m] = monthStr.split("-").map(Number);
  const start = `${monthStr}-01`;
  const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); // last day
  return { start, end };
}

export async function getStudentMonthly(studentId: number, monthStr: string) {
  const supabase = await createClient();
  const { start, end } = monthBounds(monthStr);

  const [{ data: student }, { data: marks }, { data: att }, { data: notices }] = await Promise.all([
    supabase.from("student").select("full_name, admission_no").eq("id", studentId).single(),
    supabase.from("v_student_subject_trend")
      .select("subject_name, assessment_name, percent, delta, prev_percent, band")
      .eq("student_id", studentId).gte("assessed_on", start).lte("assessed_on", end)
      .order("assessed_on"),
    supabase.from("attendance_record")
      .select("status").eq("student_id", studentId).is("period", null)
      .gte("on_date", start).lte("on_date", end),
    supabase.from("announcement")
      .select("title, published_at").gte("published_at", start).lte("published_at", `${end}T23:59:59`)
      .order("published_at", { ascending: false }),
  ]);

  const total = (att ?? []).length;
  const present = (att ?? []).filter((a) => a.status === "present" || a.status === "late").length;

  return {
    student: student as { full_name: string; admission_no: string } | null,
    marks: (marks ?? []) as Array<{ subject_name: string; assessment_name: string; percent: number; delta: number | null; prev_percent: number | null; band: string | null }>,
    attendance: { present, total, pct: total ? Math.round((present / total) * 1000) / 10 : null },
    notices: (notices ?? []) as Array<{ title: string; published_at: string }>,
  };
}

export async function getClassMonthly(sectionId: number, yearId: number, monthStr: string) {
  const supabase = await createClient();
  const { start, end } = monthBounds(monthStr);

  const [{ data: marks }, { data: att }, { data: roster }] = await Promise.all([
    supabase.from("v_mark_detail").select("student_id, percent")
      .eq("section_id", sectionId).eq("academic_year_id", yearId)
      .gte("assessed_on", start).lte("assessed_on", end),
    supabase.from("attendance_record").select("student_id, status")
      .eq("section_id", sectionId).is("period", null).gte("on_date", start).lte("on_date", end),
    supabase.from("student_enrollment").select("roll_no, student:student_id(id, full_name)")
      .eq("section_id", sectionId).eq("academic_year_id", yearId).order("roll_no"),
  ]);

  const markAgg = new Map<number, { sum: number; n: number }>();
  for (const m of marks ?? []) {
    if (m.student_id == null) continue;
    const a = markAgg.get(m.student_id) ?? { sum: 0, n: 0 };
    a.sum += Number(m.percent); a.n += 1; markAgg.set(m.student_id, a);
  }
  const attAgg = new Map<number, { p: number; t: number }>();
  for (const a of att ?? []) {
    if (a.student_id == null) continue;
    const x = attAgg.get(a.student_id) ?? { p: 0, t: 0 };
    x.t += 1; if (a.status === "present" || a.status === "late") x.p += 1; attAgg.set(a.student_id, x);
  }

  return (roster ?? []).map((e) => {
    const s = e.student as unknown as { id: number; full_name: string };
    const mk = markAgg.get(s.id);
    const at = attAgg.get(s.id);
    return {
      id: s.id, roll: e.roll_no, name: s.full_name,
      avg: mk ? Math.round((mk.sum / mk.n) * 10) / 10 : null,
      attPct: at && at.t ? Math.round((at.p / at.t) * 1000) / 10 : null,
    };
  });
}
