"use client"

import { ShieldX } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { getClerkRole, hasPermission, Permission } from "@/lib/auth"

interface RoleGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ permission, children, fallback }: RoleGuardProps) {
  const { user, isLoaded } = useUser()

  // While Clerk is loading, render nothing to avoid flicker
  if (!isLoaded) return null

  const role = getClerkRole(user?.publicMetadata as Record<string, unknown> | undefined)

  if (!hasPermission(role, permission)) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <p className="text-lg font-semibold">Access Restricted</p>
          <p className="text-sm text-muted-foreground mt-1">
            You don&apos;t have permission to view this section.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
