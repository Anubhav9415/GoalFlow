"use client"

import { useEffect, useState, useRef } from "react"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUser, UserButton } from "@clerk/nextjs"
import { ROLE_CONFIG } from "@/lib/auth"
import { syncProfile, fetchNotifications, markAllNotificationsRead, fetchProfile } from "@/services/api"
import type { Notification, Profile } from "@/types/database"

export function TopNavbar() {
  const { user, isLoaded } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const syncedRef = useRef(false)

  // Fetch Supabase profile to resolve role
  useEffect(() => {
    if (!isLoaded || !user) return
    fetchProfile()
      .then(setProfile)
      .catch(() => {})
  }, [isLoaded, user])

  const role = profile?.role ?? null

  const roleCfg = role ? ROLE_CONFIG[role] : null

  // Sync profile to Supabase on first load
  useEffect(() => {
    if (!isLoaded || !user || syncedRef.current) return
    syncedRef.current = true
    syncProfile({
      clerk_user_id: user.id,
      full_name: user.fullName || user.username || "",
      email: user.primaryEmailAddress?.emailAddress || "",
      avatar_url: user.imageUrl || undefined,
    }).catch(() => {
      // Silently fail — profile might already exist
    })
  }, [isLoaded, user])

  // Fetch notifications
  useEffect(() => {
    if (!isLoaded || !user) return
    fetchNotifications()
      .then(setNotifications)
      .catch(() => {})
  }, [isLoaded, user])

  const unreadCount = notifications.filter(n => !n.is_read).length

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {
      // silently fail
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Search */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm"
            placeholder="Search employees, goals, or departments…"
            type="search"
            name="search"
          />
        </form>

        {/* Right side */}
        <div className="flex items-center gap-x-3 lg:gap-x-4">
          {/* Notification bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
              onClick={() => {
                setShowNotifications(prev => !prev)
                if (!showNotifications && unreadCount > 0) handleMarkAllRead()
              }}
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Notification dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <p className="font-semibold text-sm">Notifications</p>
                  {notifications.length > 0 && (
                    <button className="text-xs text-primary hover:underline" onClick={handleMarkAllRead}>Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-sm text-muted-foreground text-center">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 text-sm ${!n.is_read ? "bg-primary/5" : ""}`}>
                      <p className="font-medium">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          {/* User info + Clerk UserButton */}
          {isLoaded && user && roleCfg && (
            <>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col leading-tight text-right">
                  <span className="text-sm font-semibold">{user.fullName ?? user.username}</span>
                  <span
                    className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 w-fit ml-auto"
                    style={{ background: roleCfg.bgColor, color: roleCfg.color }}
                  >
                    {roleCfg.label}
                  </span>
                </div>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
