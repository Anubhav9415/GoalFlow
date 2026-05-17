"use client"

import { Bell, Search } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getSession, UserSession, ROLE_CONFIG } from "@/lib/auth"

export function TopNavbar() {
  const [session, setSession] = useState<UserSession | null>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  const roleCfg = session ? ROLE_CONFIG[session.role] : null

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
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          <ThemeToggle />

          {/* User chip */}
          {session && roleCfg && (
            <>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />
              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: roleCfg.color }}
                >
                  {session.initials}
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-sm font-semibold">{session.name}</span>
                  <span
                    className="text-[10px] font-semibold rounded-full px-1.5 py-0.5 w-fit"
                    style={{ background: roleCfg.bgColor, color: roleCfg.color }}
                  >
                    {roleCfg.label}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
