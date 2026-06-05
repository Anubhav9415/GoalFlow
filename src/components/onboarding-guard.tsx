"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
import { fetchProfile } from "@/services/api"

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      // Middleware should handle this, but just in case
      router.push("/sign-in")
      return
    }

    // Check if user has a profile in Supabase
    fetchProfile()
      .then((profile) => {
        if (!profile) {
          // No profile = needs onboarding
          if (pathname !== "/onboarding") {
            router.push("/onboarding")
          } else {
            setIsChecking(false)
          }
        } else {
          // Has profile = shouldn't be on onboarding
          if (pathname === "/onboarding") {
            router.push("/app/dashboard")
          } else {
            setIsChecking(false)
          }
        }
      })
      .catch((err) => {
        console.error("Failed to check profile:", err)
        // If 404, it means no profile. But fetchAPI throws an error for non-ok.
        // Wait, fetchProfile returns 404 as a null or throws?
        // Let's check how api/profiles handles 404.
        if (err.message.includes("404") || err.message.includes("Not Found")) {
          if (pathname !== "/onboarding") router.push("/onboarding")
          else setIsChecking(false)
        } else {
          setIsChecking(false) // Let it pass to show error state in app
        }
      })
  }, [isLoaded, isSignedIn, pathname, router])

  if (!isLoaded || isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
