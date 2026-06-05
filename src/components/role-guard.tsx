"use client"

import { useEffect, useState } from "react"
import { ShieldX } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { getClerkRole, hasPermission, Permission, UserRole } from "@/lib/auth"
import { fetchProfile } from "@/services/api"

interface RoleGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ permission, children, fallback }: RoleGuardProps) {
  const { user, isLoaded } = useUser()
  const [role, setRole] = useState<UserRole | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isLoaded || !user) return
    fetchProfile()
      .then((p) => {
        if (p?.role) {
          setRole(p.role as UserRole)
        } else {
          setRole(getClerkRole(user.publicMetadata as Record<string, unknown>))
        }
      })
      .catch(() => {
        setRole(getClerkRole(user.publicMetadata as Record<string, unknown>))
      })
      .finally(() => {
        setIsChecking(false)
      })
  }, [isLoaded, user])

  // While Clerk or profile is loading, render nothing to avoid flicker
  if (!isLoaded || isChecking) return null

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
