import { SignIn } from "@clerk/nextjs"
import { Target } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 font-bold text-2xl">
          <Target className="h-8 w-8" />
          <span>GoalFlow</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
            Align Goals. Track Progress. Drive Performance.
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Enterprise-grade goal management and quarterly check-ins for high-performance teams.
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-primary-foreground/60">
          <span>© 2026 GoalFlow. All rights reserved.</span>
        </div>
      </div>

      {/* Right side - Clerk Sign In */}
      <div className="flex w-full items-center justify-center lg:w-1/2 p-8">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 font-bold text-2xl text-primary lg:hidden">
            <Target className="h-8 w-8" />
            <span>GoalFlow</span>
          </div>

          <SignIn
            fallbackRedirectUrl="/app/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-xl border border-border bg-card rounded-2xl",
                headerTitle: "text-foreground font-bold",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton:
                  "border border-border bg-background text-foreground hover:bg-muted",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground",
                formFieldLabel: "text-foreground font-medium",
                formFieldInput:
                  "bg-background border-border text-foreground placeholder:text-muted-foreground focus:ring-primary",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
                footerActionLink: "text-primary hover:text-primary/80 font-semibold",
                identityPreviewText: "text-foreground",
                identityPreviewEditButton: "text-primary",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
