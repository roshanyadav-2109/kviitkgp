import { createClient } from "@/lib/supabase/server";

export type AbsenceNotice = {
  id: number;
  on_date: string;
  reason: string | null;
  status: string;
  studentName: string;
};

// Absence notices visible to the caller (RLS: own children, or staff sections).
export async function getAbsenceNotices(): Promise<AbsenceNotice[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("absence_notice")
    .select("id, on_date, reason, status, student:student_id(full_name)")
    .order("on_date", { ascending: false })
    .limit(80);
  return (data ?? []).map((n) => ({
    id: n.id,
    on_date: n.on_date,
    reason: n.reason,
    status: n.status,
    studentName: (n.student as unknown as { full_name: string } | null)?.full_name ?? "—",
  }));
}
