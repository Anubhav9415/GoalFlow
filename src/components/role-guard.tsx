"use client"

import { useEffect, useState } from "react"
import { ShieldX } from "lucide-react"
import { getSession, hasPermission, Permission, UserRole } from "@/lib/auth"

interface RoleGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ permission, children, fallback }: RoleGuardProps) {
  const [role, setRole] = useState<UserRole | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const session = getSession()
    setRole(session?.role ?? "employee")
    setChecked(true)
  }, [])

  if (!checked) return null

  if (!role || !hasPermission(role, permission)) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <p className="text-lg font-semibold">Access Restricted</p>
          <p className="text-sm text-muted-foreground mt-1">
            You don't have permission to view this section.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
