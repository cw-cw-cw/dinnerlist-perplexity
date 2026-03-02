export const RSVP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Accepted", WAITLISTED: "Waitlisted",
  CANCELLED: "Cancelled", DECLINED: "Declined", NO_SHOW: "No Show", CHECKED_IN: "Checked In",
} as const;

export const RSVP_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800", CONFIRMED: "bg-green-100 text-green-800",
  WAITLISTED: "bg-blue-100 text-blue-800", CANCELLED: "bg-gray-100 text-gray-800",
  DECLINED: "bg-red-100 text-red-800", NO_SHOW: "bg-orange-100 text-orange-800",
  CHECKED_IN: "bg-emerald-100 text-emerald-800",
} as const;

export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", OPEN: "Open", FULL: "Full",
  WAITLIST_ONLY: "Waitlist Only", CLOSED: "Closed", COMPLETED: "Completed",
} as const;

export const EVENT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800", OPEN: "bg-green-100 text-green-800",
  FULL: "bg-red-100 text-red-800", WAITLIST_ONLY: "bg-amber-100 text-amber-800",
  CLOSED: "bg-slate-100 text-slate-800", COMPLETED: "bg-blue-100 text-blue-800",
} as const;

export const EVENT_TYPE_LABELS: Record<string, string> = {
  IN_PRACTICE: "In Practice", RESIDENT_FELLOW: "Resident/Fellow",
} as const;

export const INVITEE_TYPES = ["IN_PRACTICE", "RESIDENT_FELLOW"] as const;

export interface NavItem { label: string; href: string; icon: string; }

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Events", href: "/admin/events", icon: "CalendarDays" },
  { label: "Invitees", href: "/admin/invitees", icon: "Users" },
  { label: "Analytics", href: "/admin/analytics", icon: "BarChart3" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
] as const;
