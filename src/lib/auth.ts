export type UserRole = "employee" | "manager" | "admin" | "hr"

/**
 * Reads the GoalFlow role from Clerk's publicMetadata.
 * Set this in the Clerk Dashboard → Users → Edit → publicMetadata:
 *   { "role": "employee" | "manager" | "admin" | "hr" }
 * Falls back to "employee" if no role is set.
 */
export function getClerkRole(
  publicMetadata: Record<string, unknown> | null | undefined
): UserRole {
  const role = publicMetadata?.role
  if (
    role === "employee" ||
    role === "manager" ||
    role === "admin" ||
    role === "hr"
  ) {
    return role
  }
  return "employee"
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

