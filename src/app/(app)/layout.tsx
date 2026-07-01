import { redirect } from "next/navigation";
import { getSession, getStudentSectionLabel } from "@/lib/session";
import { getT } from "@/i18n/server";
import { AppShell } from "@/components/app-shell";
import type { NavRole } from "@/lib/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { t } = await getT();
  const roleLabel = t(`roles.${session.navRole}`);
  // Students show their class-section under their name; everyone else the role.
  const subLabel =
    session.navRole === "student" && session.studentId
      ? (await getStudentSectionLabel(session.studentId)) ?? roleLabel
      : roleLabel;
  return (
    <AppShell name={session.fullName} role={session.navRole as NavRole} roleLabel={roleLabel} subLabel={subLabel}>
      {children}
    </AppShell>
  );
}
