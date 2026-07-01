import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Section / class analytics for staff (all RLS-scoped by the caller).
// ---------------------------------------------------------------------------
export async function getSectionAnalytics(
  sectionId: number,
  classId: number,
  yearId: number,
  subjectId: number | null,
) {
  const supabase = await createClient();

  const [{ data: summary }, { data: dist }, top, needs, concl, comparison] = await Promise.all([
    supabase.from("v_section_subject_summary")
      .select("subject_id, subject_name, term, avg_percent, n_students")
      .eq("section_id", sectionId).eq("academic_year_id", yearId),
    supabase.from("v_section_distribution")
      .select("band, n, subject_id")
      .eq("section_id", sectionId).eq("academic_year_id", yearId),
    supabase.rpc("top_performers", { p_section: sectionId, p_year: yearId, p_subject: subjectId ?? undefined, p_limit: 5 }),
    supabase.rpc("needs_support", { p_section: sectionId, p_year: yearId, p_threshold: 40 }),
    supabase.rpc("auto_conclusions", { p_section: sectionId, p_year: yearId }),
    subjectId
      ? supabase.rpc("section_comparison", { p_class: classId, p_subject: subjectId, p_year: yearId })
      : Promise.resolve({ data: [] }),
  ]);

  // subject vs subject (average across terms)
  const subjAgg = new Map<string, { sum: number; n: number }>();
  const termAgg = new Map<number, { sum: number; n: number }>();
  for (const r of summary ?? []) {
    const s = subjAgg.get(r.subject_name!) ?? { sum: 0, n: 0 };
    s.sum += Number(r.avg_percent); s.n += 1; subjAgg.set(r.subject_name!, s);
    if (r.term != null) {
      const t = termAgg.get(r.term) ?? { sum: 0, n: 0 };
      t.sum += Number(r.avg_percent); t.n += 1; termAgg.set(r.term, t);
    }
  }
  const subjectAverages = [...subjAgg.entries()]
    .map(([subject, v]) => ({ subject, avg: Math.round((v.sum / v.n) * 10) / 10 }))
    .sort((a, b) => b.avg - a.avg);
  const termTrend = [...termAgg.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([term, v]) => ({ term: `Term ${term}`, avg: Math.round((v.sum / v.n) * 10) / 10 }));

  // distribution (filtered to subject if chosen, else overall)
  const bands = ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E"];
  const bandAgg = new Map<string, number>();
  for (const r of dist ?? []) {
    if (subjectId && r.subject_id !== subjectId) continue;
    bandAgg.set(r.band!, (bandAgg.get(r.band!) ?? 0) + Number(r.n));
  }
  const distribution = bands.map((band) => ({ band, n: bandAgg.get(band) ?? 0 }));

  return {
    subjectAverages,
    termTrend,
    distribution,
    topPerformers: (top.data ?? []) as Array<{ student_name: string; avg_percent: number; n_marks: number }>,
    needsSupport: (needs.data ?? []) as Array<{ student_name: string; avg_percent: number; weak_subjects: string | null; recent_trend: number; reason: string }>,
    conclusions: (concl.data ?? []) as unknown as string[],
    sectionComparison: (comparison.data ?? []) as Array<{ section_name: string; avg_percent: number; n_students: number }>,
  };
}

// ---------------------------------------------------------------------------
// Per-student continuous progress record (owner or staff-in-scope).
// ---------------------------------------------------------------------------
type TrendRow = {
  subject_id: number; subject_name: string; subject_code: string;
  assessment_name: string; assessed_on: string; percent: number; delta: number | null;
  prev_percent: number | null; band: string | null; year_name: string; academic_year_id: number;
  is_current: boolean; term: number | null;
};

export async function getStudentProgress(studentId: number) {
  const supabase = await createClient();

  const [{ data: student }, { data: rows }, { data: obs }] = await Promise.all([
    supabase.from("student").select("id, full_name, admission_no").eq("id", studentId).single(),
    supabase.from("v_student_subject_trend")
      .select("subject_id, subject_name, subject_code, assessment_name, assessed_on, percent, delta, prev_percent, band, year_name, academic_year_id, is_current, term")
      .eq("student_id", studentId)
      .order("assessed_on", { ascending: true }),
    supabase.from("observation")
      .select("id, observed_on, category, body, subject:subject_id(name), staff:staff_id(full_name)")
      .eq("student_id", studentId)
      .order("observed_on", { ascending: false })
      .limit(12),
  ]);

  const trend = (rows ?? []) as TrendRow[];

  // Per-subject summary (latest result + delta + full point list)
  const bySubject = new Map<number, { name: string; code: string; points: { label: string; percent: number }[]; latest: number; delta: number | null; prev: number | null; band: string | null }>();
  for (const r of trend) {
    const s = bySubject.get(r.subject_id) ?? { name: r.subject_name, code: r.subject_code, points: [], latest: 0, delta: null, prev: null, band: null };
    s.points.push({ label: shortLabel(r.assessment_name, r.year_name), percent: Number(r.percent) });
    s.latest = Number(r.percent); s.delta = r.delta; s.prev = r.prev_percent; s.band = r.band;
    bySubject.set(r.subject_id, s);
  }
  const subjects = [...bySubject.values()].sort((a, b) => a.name.localeCompare(b.name));

  // Pivot for multi-subject line chart: one row per (year, assessment), a column per subject code.
  const labelOrder: string[] = [];
  const pivot = new Map<string, Record<string, number | string>>();
  for (const r of trend) {
    const label = shortLabel(r.assessment_name, r.year_name);
    if (!pivot.has(label)) { pivot.set(label, { label }); labelOrder.push(label); }
    pivot.get(label)![r.subject_code] = Number(r.percent);
  }
  const chartData = labelOrder.map((l) => pivot.get(l)!);
  const seriesSubjects = subjects.map((s) => ({ code: s.code, name: s.name }));

  // Year-on-year overall average
  const yearAgg = new Map<string, { sum: number; n: number; id: number }>();
  for (const r of trend) {
    const y = yearAgg.get(r.year_name) ?? { sum: 0, n: 0, id: r.academic_year_id };
    y.sum += Number(r.percent); y.n += 1; yearAgg.set(r.year_name, y);
  }
  const yearOnYear = [...yearAgg.entries()].map(([year, v]) => ({ year, avg: Math.round((v.sum / v.n) * 10) / 10 }));
  const currentAvg = (() => {
    const cur = trend.filter((r) => r.is_current);
    if (!cur.length) return null;
    return Math.round((cur.reduce((a, r) => a + Number(r.percent), 0) / cur.length) * 10) / 10;
  })();

  // Every session (year) in detail: subjects × assessments grid.
  const sessMap = new Map<number, {
    yearId: number; yearName: string; isCurrent: boolean;
    assessments: string[]; assessSet: Set<string>;
    subjects: Map<string, { name: string; code: string; cells: Record<string, { percent: number; band: string | null; delta: number | null }> }>;
  }>();
  for (const r of trend) {
    let s = sessMap.get(r.academic_year_id);
    if (!s) { s = { yearId: r.academic_year_id, yearName: r.year_name, isCurrent: r.is_current, assessments: [], assessSet: new Set(), subjects: new Map() }; sessMap.set(r.academic_year_id, s); }
    const aName = shortName(r.assessment_name);
    if (!s.assessSet.has(aName)) { s.assessSet.add(aName); s.assessments.push(aName); }
    let subj = s.subjects.get(r.subject_code);
    if (!subj) { subj = { name: r.subject_name, code: r.subject_code, cells: {} }; s.subjects.set(r.subject_code, subj); }
    subj.cells[aName] = { percent: Number(r.percent), band: r.band, delta: r.delta };
  }
  const sessions = [...sessMap.values()]
    .sort((a, b) => b.yearId - a.yearId)
    .map((s) => ({ yearId: s.yearId, yearName: s.yearName, isCurrent: s.isCurrent, assessments: s.assessments, subjects: [...s.subjects.values()].sort((a, b) => a.name.localeCompare(b.name)) }));

  const observations = (obs ?? []).map((o) => ({
    id: o.id,
    date: o.observed_on,
    category: o.category,
    body: o.body,
    subject: (o.subject as unknown as { name: string } | null)?.name ?? null,
    staff: (o.staff as unknown as { full_name: string } | null)?.full_name ?? "—",
  }));

  return {
    student: student as { id: number; full_name: string; admission_no: string } | null,
    subjects, chartData, seriesSubjects, yearOnYear, currentAvg, observations, sessions,
    hasData: trend.length > 0,
  };
}

// Class & section rank for a student (owner or staff-in-scope). Uses a
// SECURITY DEFINER RPC that returns only ranks + aggregates, never other pupils.
export async function getStudentStanding(studentId: number, yearId: number) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("student_standing", { p_student: studentId, p_year: yearId });
  const row = Array.isArray(data) ? data[0] : null;
  if (!row || row.section_rank == null) return null;
  return {
    sectionRank: row.section_rank, sectionSize: row.section_size,
    classRank: row.class_rank, classSize: row.class_size,
    studentAvg: row.student_avg == null ? null : Number(row.student_avg),
    sectionAvg: row.section_avg == null ? null : Number(row.section_avg),
    classAvg: row.class_avg == null ? null : Number(row.class_avg),
  };
}

function shortName(assessment: string): string {
  const map: Record<string, string> = {
    "Periodic Test 1": "PT1", "Periodic Test 2": "PT2", "Periodic Test 3": "PT3",
    "Periodic Test 4": "PT4", "Half-Yearly": "HY", "Annual": "Annual",
  };
  return map[assessment] ?? assessment;
}

function shortLabel(assessment: string, year: string): string {
  const yy = year.slice(2, 4); // '2024-25' -> '24'
  const map: Record<string, string> = {
    "Periodic Test 1": "PT1", "Periodic Test 2": "PT2", "Periodic Test 3": "PT3",
    "Periodic Test 4": "PT4", "Half-Yearly": "HY", "Annual": "Ann",
  };
  return `${map[assessment] ?? assessment} '${yy}`;
}

// Children of the signed-in guardian (for the child switcher).
export async function getMyChildren() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("guardian_student")
    .select("student:student_id(id, full_name, admission_no)")
    .order("student_id");
  return (data ?? []).map((g) => g.student as unknown as { id: number; full_name: string; admission_no: string });
}
