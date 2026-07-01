import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type StaffRole = Database["public"]["Enums"]["staff_role"];
export type ProfileRole = Database["public"]["Enums"]["profile_role"];

export type Session = {
  userId: string;
  role: ProfileRole;
  fullName: string;
  locale: string;
  staffId: number | null;
  guardianId: number | null;
  studentId: number | null;
  staffRole: StaffRole | null;
  // effective role for nav/labels
  effectiveRole: StaffRole | "student" | "guardian";
  isAdminScope: boolean; // principal or office
};

// Load the signed-in user's profile (RLS: self-read). Returns null if signed out.
// Cached per request so the auth.getUser() network call + profile query run once
// even though layout, page and data helpers all ask for the session.
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profile")
    .select("id, role, full_name, locale, staff_id, guardian_id, student_id, staff:staff_id(role)")
    .eq("id", user.id)
    .single();
  if (!data) return null;

  const staffRole = (data.staff as { role: StaffRole } | null)?.role ?? null;
  const effectiveRole: Session["effectiveRole"] =
    data.role === "staff" ? (staffRole ?? "office") : data.role;

  return {
    userId: data.id,
    role: data.role,
    fullName: data.full_name,
    locale: data.locale,
    staffId: data.staff_id,
    guardianId: data.guardian_id,
    studentId: data.student_id,
    staffRole,
    effectiveRole,
    isAdminScope: staffRole === "principal" || staffRole === "office",
  };
});

// Current academic year (readable by all authenticated users). Cached per request.
export const getCurrentYear = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_year")
    .select("id, name")
    .eq("is_current", true)
    .single();
  return data;
});
