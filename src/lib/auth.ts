export type UserRole = "employee" | "manager" | "admin" | "hr"

export interface UserSession {
  role: UserRole
  name: string
  initials: string
  email: string
  color: string
  department?: string
}

// ─── Capability keys ─────────────────────────────────────────────────────────
export type Permission =
  | "canCreateGoals"       // Employee: draft & submit goals
  | "canEditOwnGoals"      // Employee: edit pre-submission goals
  | "canInputActuals"      // Employee: enter quarterly achievement values
  | "canApproveGoals"      // Manager: approve / send back goals
  | "canViewTeam"          // Manager+: see team dashboard & goals
  | "canLogFeedback"       // Manager: write check-in feedback
  | "canManageCycles"      // Admin/HR: configure performance cycles
  | "canUnlockGoals"       // Admin/HR: unlock a locked goal for re-edit
  | "canViewAuditLog"      // Admin/HR: see audit trail
  | "canManageOrgHierarchy"// Admin/HR: manage departments & reporting lines
  | "canViewAnalytics"     // Manager, Admin, HR
  | "canExportReports"     // Manager, Admin, HR

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  employee: [
    "canCreateGoals",
    "canEditOwnGoals",
    "canInputActuals",
  ],
  manager: [
    "canCreateGoals",
    "canEditOwnGoals",
    "canInputActuals",
    "canApproveGoals",
    "canViewTeam",
    "canLogFeedback",
    "canViewAnalytics",
    "canExportReports",
  ],
  admin: [
    "canCreateGoals",
    "canEditOwnGoals",
    "canInputActuals",
    "canApproveGoals",
    "canViewTeam",
    "canLogFeedback",
    "canManageCycles",
    "canUnlockGoals",
    "canViewAuditLog",
    "canManageOrgHierarchy",
    "canViewAnalytics",
    "canExportReports",
  ],
  hr: [
    "canCreateGoals",
    "canEditOwnGoals",
    "canInputActuals",
    "canApproveGoals",
    "canViewTeam",
    "canLogFeedback",
    "canManageCycles",
    "canUnlockGoals",
    "canViewAuditLog",
    "canManageOrgHierarchy",
    "canViewAnalytics",
    "canExportReports",
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; description: string; color: string; bgColor: string }
> = {
  employee: {
    label: "Employee",
    description: "View & update your personal goals",
    color: "#4F46E5",
    bgColor: "rgba(79,70,229,0.12)",
  },
  manager: {
    label: "Manager",
    description: "Manage team goals & approve requests",
    color: "#059669",
    bgColor: "rgba(5,150,105,0.12)",
  },
  admin: {
    label: "Admin",
    description: "Full access to all settings & data",
    color: "#DC2626",
    bgColor: "rgba(220,38,38,0.12)",
  },
  hr: {
    label: "HR",
    description: "Monitor org-wide performance & reports",
    color: "#D97706",
    bgColor: "rgba(217,119,6,0.12)",
  },
}

export const MOCK_USERS: Record<UserRole, UserSession> = {
  employee: {
    role: "employee",
    name: "Alex Johnson",
    initials: "AJ",
    email: "alex.johnson@company.com",
    color: "#4F46E5",
  },
  manager: {
    role: "manager",
    name: "Sarah Mitchell",
    initials: "SM",
    email: "sarah.mitchell@company.com",
    color: "#059669",
  },
  admin: {
    role: "admin",
    name: "David Chen",
    initials: "DC",
    email: "david.chen@company.com",
    color: "#DC2626",
  },
  hr: {
    role: "hr",
    name: "Priya Sharma",
    initials: "PS",
    email: "priya.sharma@company.com",
    color: "#D97706",
  },
}

const SESSION_KEY = "goalflow_session"

export function saveSession(role: UserRole): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SESSION_KEY, JSON.stringify(MOCK_USERS[role]))
}

export function getSession(): UserSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as UserSession) : null
  } catch {
    return null
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}
