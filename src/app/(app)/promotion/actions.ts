"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PromotionDecision = {
  student_id: number;
  outcome: "promoted" | "retained" | "transferred" | "graduated";
  to_section_id?: number | null;
  remark?: string;
};

// Apply a batch of promotion decisions for a class (office/admin only, enforced
// by the commit_promotion RPC). Creates next-year enrollments, marks TC/alumni,
// and records every outcome for the principal/class-teacher summary.
export async function commitPromotion(input: { fromYear: number; toYear: number; rows: PromotionDecision[] }) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("commit_promotion", {
    p_from_year: input.fromYear,
    p_to_year: input.toYear,
    p_rows: input.rows,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/promotion");
  revalidatePath("/students");
  return { ok: true as const, count: Number(data ?? 0) };
}
