"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  ClipboardCheck,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ROLE_CONFIG } from "@/lib/auth"
import { useUser, useClerk } from "@clerk/nextjs"
import { fetchProfile } from "@/services/api"
import type { Profile } from "@/types/database"

const ALL_NAV_ITEMS = [
  { name: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard, roles: ["employee", "manager", "admin", "hr"] },
  { name: "Goals", href: "/app/goals", icon: Target, roles: ["employee", "manager", "admin", "hr"] },
  { name: "Approvals", href: "/app/approvals", icon: CheckSquare, roles: ["manager", "admin", "hr"] },
  { name: "Check-ins", href: "/app/checkins", icon: ClipboardCheck, roles: ["employee", "manager", "admin", "hr"] },
  { name: "Analytics", href: "/app/analytics", icon: BarChart3, roles: ["manager", "admin", "hr"] },
  { name: "Reports", href: "/app/reports", icon: FileText, roles: ["manager", "admin", "hr"] },
  { name: "Settings", href: "/app/settings", icon: Settings, roles: ["employee", "manager", "admin", "hr"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!isLoaded || !user) return
    fetchProfile().then(setProfile).catch(() => {})
  }, [isLoaded, user])

  const role = (profile?.role ?? "employee") as keyof typeof ROLE_CONFIG
  const roleCfg = ROLE_CONFIG[role]
  const visibleItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(role))

  const fullName = profile?.full_name || user?.fullName || user?.username || ""
  const initials = fullName
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"

  async function handleSignOut() {
    await signOut({ redirectUrl: "/" })
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border gap-2">
        <Target className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">GoalFlow</span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User profile + sign out */}
      <div className="border-t border-sidebar-border p-4 space-y-1">
        {isLoaded && user ? (
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            {user.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt={fullName}
                className="h-9 w-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: roleCfg.color }}
              >
                {initials}
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold truncate">
                {fullName || "Loading..."}
              </span>
              <span
                className="inline-flex items-center w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5"
                style={{ background: roleCfg.bgColor, color: roleCfg.color }}
              >
                {roleCfg.label}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
            <div className="flex flex-col gap-1 flex-1">
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              <div className="h-2.5 w-14 bg-muted animate-pulse rounded" />
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
