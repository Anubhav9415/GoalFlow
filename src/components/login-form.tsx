"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import {
  UserCircle,
  Users,
  ShieldCheck,
  Briefcase,
  ChevronRight,
  ArrowLeft,
} from "lucide-react"
import { UserRole, ROLE_CONFIG, saveSession } from "@/lib/auth"

// ─── Schemas ────────────────────────────────────────────────────────────────
const identifierSchema = z.object({
  identifier: z.string().min(3, { message: "Email or Phone is required" }),
})

const otpSchema = z.object({
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
})

// ─── Role icon map ───────────────────────────────────────────────────────────
const ROLE_ICONS: Record<UserRole, React.ElementType> = {
  employee: UserCircle,
  manager: Users,
  admin: ShieldCheck,
  hr: Briefcase,
}

type Step = "role" | "identifier" | "otp"

// ─── Component ───────────────────────────────────────────────────────────────
export function LoginForm() {
  const [step, setStep] = useState<Step>("role")
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [identifier, setIdentifier] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const identifierForm = useForm<z.infer<typeof identifierSchema>>({
    resolver: zodResolver(identifierSchema),
  })

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
  })

  // Step 1 → select role
  function handleRoleSelect(role: UserRole) {
    setSelectedRole(role)
    setStep("identifier")
  }

  // Step 2 → send OTP
  function onIdentifierSubmit(data: z.infer<typeof identifierSchema>) {
    setIsLoading(true)
    setIdentifier(data.identifier)
    setTimeout(() => {
      setIsLoading(false)
      setStep("otp")
      toast.success(`OTP sent to ${data.identifier}`)
    }, 800)
  }

  // Step 3 → verify OTP
  function onOtpSubmit(data: z.infer<typeof otpSchema>) {
    setIsLoading(true)
    if (data.otp === "111111") {
      setTimeout(() => {
        setIsLoading(false)
        saveSession(selectedRole!)
        toast.success(
          `Logged in as ${ROLE_CONFIG[selectedRole!].label} successfully!`
        )
        setTimeout(() => {
          window.location.href = "/app/dashboard"
        }, 800)
      }, 1000)
    } else {
      setIsLoading(false)
      toast.error("Invalid OTP. Use 111111 to continue.")
    }
  }

  const roleEntries = Object.entries(ROLE_CONFIG) as [
    UserRole,
    (typeof ROLE_CONFIG)[UserRole]
  ][]

  return (
    <Card className="p-8 backdrop-blur-sm bg-card/90 shadow-xl border-border/50">
      {/* ── STEP 1: Role Selection ── */}
      {step === "role" && (
        <div className="space-y-5">
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Step 1 of 3
            </p>
            <h3 className="text-xl font-bold">Select your role</h3>
            <p className="text-sm text-muted-foreground">
              Choose how you access GoalFlow
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {roleEntries.map(([role, cfg]) => {
              const Icon = ROLE_ICONS[role]
              return (
                <button
                  key={role}
                  id={`role-${role}`}
                  onClick={() => handleRoleSelect(role)}
                  className="group relative flex flex-col items-center gap-2 rounded-xl border-2 border-border p-4 text-center transition-all duration-200 hover:border-[var(--role-color)] hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={
                    {
                      "--role-color": cfg.color,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full transition-colors"
                    style={{ background: cfg.bgColor }}
                  >
                    <Icon
                      className="h-5 w-5 transition-transform group-hover:scale-110"
                      style={{ color: cfg.color }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{cfg.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                      {cfg.description}
                    </p>
                  </div>
                  <ChevronRight
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 transition-opacity group-hover:opacity-100 opacity-0"
                  />
                </button>
              )
            })}
          </div>

          {/* Google SSO */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => toast.info("Google SSO coming soon")}
          >
            <svg
              className="mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
              />
            </svg>
            Google
          </Button>
        </div>
      )}

      {/* ── STEP 2: Identifier ── */}
      {step === "identifier" && selectedRole && (
        <form
          onSubmit={identifierForm.handleSubmit(onIdentifierSubmit)}
          className="space-y-5"
        >
          {/* Role badge + back */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("role")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <RoleBadge role={selectedRole} />
          </div>

          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Step 2 of 3
            </p>
            <h3 className="text-xl font-bold">Enter your credentials</h3>
            <p className="text-sm text-muted-foreground">
              We'll send a one-time password to verify you
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier">Email or Phone Number</Label>
            <Input
              id="identifier"
              placeholder="name@company.com or +91XXXXXXXXXX"
              disabled={isLoading}
              {...identifierForm.register("identifier")}
            />
            {identifierForm.formState.errors.identifier && (
              <p className="text-sm text-destructive">
                {identifierForm.formState.errors.identifier.message}
              </p>
            )}
          </div>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Sending OTP…" : "Get OTP"}
          </Button>
        </form>
      )}

      {/* ── STEP 3: OTP ── */}
      {step === "otp" && selectedRole && (
        <form
          onSubmit={otpForm.handleSubmit(onOtpSubmit)}
          className="space-y-5"
        >
          {/* Role badge + back */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("identifier")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <RoleBadge role={selectedRole} />
          </div>

          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Step 3 of 3
            </p>
            <h3 className="text-xl font-bold">Verify your identity</h3>
            <p className="text-sm text-muted-foreground">
              OTP sent to{" "}
              <span className="font-medium text-foreground">{identifier}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">Enter 6-digit OTP</Label>
            <Input
              id="otp"
              placeholder="111111"
              type="text"
              inputMode="numeric"
              maxLength={6}
              disabled={isLoading}
              className="tracking-[0.4em] text-center text-lg font-bold"
              {...otpForm.register("otp")}
            />
            {otpForm.formState.errors.otp && (
              <p className="text-sm text-destructive">
                {otpForm.formState.errors.otp.message}
              </p>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Demo OTP: <code className="font-mono font-bold">111111</code>
            </p>
          </div>

          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Verifying…" : "Verify & Login"}
          </Button>
        </form>
      )}
    </Card>
  )
}

// ─── Role badge component ─────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role]
  const Icon = ROLE_ICONS[role]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: cfg.bgColor, color: cfg.color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  )
}
