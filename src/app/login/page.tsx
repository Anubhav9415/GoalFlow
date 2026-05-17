import { LoginForm } from "@/components/login-form"
import { Target } from "lucide-react"

export default function LoginPage() {
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

      {/* Right side - Login */}
      <div className="flex w-full items-center justify-center lg:w-1/2 p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 font-bold text-2xl lg:hidden text-primary">
            <Target className="h-8 w-8" />
            <span>GoalFlow</span>
          </div>
          <div className="mb-8 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
