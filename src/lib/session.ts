import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type StaffRole = Database["public"]["Enums"]["staff_role"];
export type ProfileRole = Database["public"]["Enums"]["profile_role"];
export type NavRole = "student" | "guardian" | "subject_teacher" | "class_teacher" | "principal" | "office";

export type Session = {
  userId: string;
  role: ProfileRole;
  fullName: string;
  locale: string;
  staffId: number | null;
  guardianId: number | null;
  studentId: number | null;
  staffRole: StaffRole | null;
  // effective role for labels (from staff.role)
  effectiveRole: StaffRole | "student" | "guardian";
  isAdminScope: boolean; // principal or office
  isClassTeacher: boolean; // holds a class-teacher allotment this year (dynamic)
  // role used to build nav/quick-links: a staff member who class-teaches a
  // section is treated as class_teacher regardless of their static staff.role.
  navRole: NavRole;
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

  // Is this staff member a class teacher of any section in the current year?
  let isClassTeacher = false;
  if (data.staff_id) {
    const { data: cy } = await supabase.from("academic_year").select("id").eq("is_current", true).single();
    if (cy) {
      const { count } = await supabase
        .from("teacher_allotment")
        .select("id", { count: "exact", head: true })
        .eq("staff_id", data.staff_id)
        .eq("is_class_teacher", true)
        .eq("academic_year_id", cy.id);
      isClassTeacher = (count ?? 0) > 0;
    }
  }

  const navRole: NavRole = isClassTeacher ? "class_teacher" : (effectiveRole as NavRole);

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
    isClassTeacher,
    navRole,
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
