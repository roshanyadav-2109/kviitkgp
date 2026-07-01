import {
  DashboardIcon, ProgressIcon, AttendanceIcon, MarksIcon, StudentsIcon,
  AnnounceIcon, CalendarIcon, ReportIcon, LeaveIcon, FeedbackIcon, AllotmentIcon,
  type IconComponent,
} from "@/components/icons";

export type NavRole = "student" | "guardian" | "subject_teacher" | "class_teacher" | "principal" | "office";

export type NavItem = {
  href: string;
  icon: IconComponent;
  labelKey: string;
  roles: NavRole[];
};

const ALL: NavRole[] = ["student", "guardian", "subject_teacher", "class_teacher", "principal", "office"];
const STAFF: NavRole[] = ["subject_teacher", "class_teacher", "principal", "office"];
const OWNERS: NavRole[] = ["student", "guardian"];

export const NAV: NavItem[] = [
  { href: "/", icon: DashboardIcon, labelKey: "nav.dashboard", roles: ALL },
  { href: "/progress", icon: ProgressIcon, labelKey: "nav.myProgress", roles: OWNERS },
  { href: "/progress", icon: ProgressIcon, labelKey: "nav.progress", roles: STAFF },
  { href: "/attendance", icon: AttendanceIcon, labelKey: "nav.attendance", roles: ALL },
  { href: "/marks", icon: MarksIcon, labelKey: "nav.marks", roles: STAFF },
  { href: "/students", icon: StudentsIcon, labelKey: "nav.students", roles: ["class_teacher", "principal", "office"] },
  { href: "/announcements", icon: AnnounceIcon, labelKey: "nav.announcements", roles: ALL },
  { href: "/calendar", icon: CalendarIcon, labelKey: "nav.calendar", roles: ALL },
  { href: "/reports", icon: ReportIcon, labelKey: "nav.reports", roles: ["student", "guardian", "class_teacher", "principal", "office"] },
  { href: "/leave", icon: LeaveIcon, labelKey: "nav.leave", roles: ["student", "guardian", "class_teacher", "principal", "office"] },
  { href: "/feedback", icon: FeedbackIcon, labelKey: "nav.feedback", roles: ["guardian", "class_teacher", "principal", "office"] },
  { href: "/allotments", icon: AllotmentIcon, labelKey: "nav.allotments", roles: ["principal", "office"] },
];

export function navFor(role: NavRole): NavItem[] {
  const seen = new Set<string>();
  return NAV.filter((i) => i.roles.includes(role)).filter((i) => {
    if (seen.has(i.href)) return false;
    seen.add(i.href);
    return true;
  });
}
