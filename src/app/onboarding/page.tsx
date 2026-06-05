"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Target, Users, ShieldCheck, Briefcase, ChevronRight, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type Role = "employee" | "manager" | "hr" | "admin"

const ROLES = [
  {
    id: "employee" as Role,
    title: "Employee",
    description: "Set personal goals, submit for approval, track your quarterly progress.",
    icon: Target,
    color: "#4F46E5",
    bg: "rgba(79,70,229,0.08)",
    border: "rgba(79,70,229,0.3)",
    perks: ["Create & manage personal goals", "Submit quarterly check-ins", "View your performance trends"],
  },
  {
    id: "manager" as Role,
    title: "Manager",
    description: "Approve team goals, review check-ins, track your team's performance.",
    icon: Users,
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
    border: "rgba(5,150,105,0.3)",
    perks: ["Approve / reject team goals", "Review quarterly check-ins", "Access team analytics"],
  },
  {
    id: "hr" as Role,
    title: "HR",
    description: "Monitor org-wide performance, manage cycles, and export reports.",
    icon: Briefcase,
    color: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.3)",
    perks: ["Org-wide analytics & reports", "Manage performance cycles", "View audit logs"],
  },
  {
    id: "admin" as Role,
    title: "Admin",
    description: "Full access — configure the system, manage users, and override settings.",
    icon: ShieldCheck,
    color: "#DC2626",
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.3)",
    perks: ["Full system access", "Manage users & roles", "Configure org settings"],
  },
]

const DEPARTMENTS = [
  "Engineering", "Design", "Sales", "Marketing",
  "Human Resources", "Finance", "Operations", "Product",
  "Customer Success", "Legal", "Other",
]

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [department, setDepartment] = useState("")
  const [customDept, setCustomDept] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  async function handleFinish() {
    if (!selectedRole) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/profiles/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          full_name: user?.fullName || user?.username || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
          department: department === "Other" ? customDept : department,
          avatar_url: user?.imageUrl || null,
        }),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Setup failed")
      }
      toast.success("Welcome to GoalFlow! 🎉")
      router.push("/app/dashboard")
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  const selectedRoleData = ROLES.find(r => r.id === selectedRole)
  const firstName = user?.firstName || user?.username || "there"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">GoalFlow</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {step === 1 ? `Welcome, ${firstName}! 👋` : "Almost there!"}
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {step === 1
              ? "What's your role in the organisation?"
              : `Setting you up as ${selectedRoleData?.title}`}
          </p>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mt-5">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step > s ? "bg-primary text-primary-foreground" :
                  step === s ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                <span className={`text-sm ${step >= s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {s === 1 ? "Choose Role" : "Your Details"}
                </span>
                {s < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ROLES.map(role => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className="relative text-left rounded-2xl border-2 p-5 transition-all duration-200 hover:scale-[1.01] focus:outline-none"
                  style={{
                    borderColor: isSelected ? role.color : "hsl(var(--border))",
                    background: isSelected ? role.bg : "hsl(var(--card))",
                  }}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="h-5 w-5" style={{ color: role.color }} />
                    </div>
                  )}
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: role.bg, border: `1.5px solid ${role.border}` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: role.color }} />
                  </div>
                  <p className="font-bold text-base">{role.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">{role.description}</p>
                  <ul className="space-y-1">
                    {role.perks.map(perk => (
                      <li key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: role.color }} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>
        )}

        {/* Step 2: Department */}
        {step === 2 && selectedRoleData && (
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl" style={{ background: selectedRoleData.bg, border: `1.5px solid ${selectedRoleData.border}` }}>
              <selectedRoleData.icon className="h-8 w-8" style={{ color: selectedRoleData.color }} />
              <div>
                <p className="font-bold">{selectedRoleData.title}</p>
                <p className="text-xs text-muted-foreground">{selectedRoleData.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your Department</label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                >
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {department === "Other" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Department Name</label>
                  <Input
                    placeholder="Type your department…"
                    value={customDept}
                    onChange={e => setCustomDept(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5 opacity-60">
                <label className="text-sm font-medium">Your Name</label>
                <Input value={user?.fullName || user?.username || ""} disabled />
              </div>

              <div className="space-y-1.5 opacity-60">
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.primaryEmailAddress?.emailAddress || ""} disabled />
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8">
          {step === 2 ? (
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Back
            </Button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <Button
              disabled={!selectedRole}
              onClick={() => setStep(2)}
              className="px-8"
            >
              Continue →
            </Button>
          ) : (
            <Button
              disabled={!department || isSubmitting || (department === "Other" && !customDept.trim())}
              onClick={handleFinish}
              className="px-8"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up…</>
              ) : (
                "Get started →"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
