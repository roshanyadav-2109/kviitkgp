"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";

// Save marks for one assessment. RLS (mark_write) permits only the subject
// teacher of that section×subject, the class teacher, or admin.
export async function saveMarks(input: {
  assessmentId: number;
  entries: { studentId: number; marks: number | null; absent: boolean }[];
}) {
  const supabase = await createClient();
  const session = await getSession();
  const rows = input.entries.map((e) => ({
    assessment_id: input.assessmentId,
    student_id: e.studentId,
    marks_obtained: e.absent ? null : e.marks,
    is_absent: e.absent,
    entered_by: session?.staffId ?? null,
  }));
  const { error } = await supabase.from("mark").upsert(rows, { onConflict: "assessment_id,student_id" });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/marks");
  revalidatePath("/progress");
  return { ok: true };
}

// Release (or unpublish) an assessment's results. Once released, students and
// parents can see the marks; until then they stay a staff-only draft.
export async function releaseAssessment(assessmentId: number, publish: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assessment")
    .update({ is_published: publish, published_at: publish ? new Date().toISOString() : null })
    .eq("id", assessmentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/marks");
  revalidatePath("/progress");
  revalidatePath("/reports");
  return { ok: true };
}
