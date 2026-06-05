"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Target, Building, KeyRound, ChevronRight, CheckCircle2, Loader2, ArrowLeft, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type OnboardingAction = "create" | "join" | null

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  const [action, setAction] = useState<OnboardingAction>(null)
  
  // Create State
  const [orgName, setOrgName] = useState("")
  
  // Join State
  const [orgSlug, setOrgSlug] = useState("")
  const [password, setPassword] = useState("")
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Result State for Creation
  const [createdOrg, setCreatedOrg] = useState<any>(null)

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/profiles/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          orgName,
          orgSlug,
          password,
          full_name: user?.fullName || user?.username || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
          avatar_url: user?.imageUrl || null,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Setup failed")
      }
      
      if (action === "create") {
        setCreatedOrg(data.organization)
        toast.success("Organization created successfully! 🎉")
      } else {
        toast.success(`Welcome to ${data.organization.name}! 🎉`)
        router.push("/app/dashboard")
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const firstName = user?.firstName || user?.username || "there"

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  // If org was created, show the credentials screen
  if (createdOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Created!</h1>
            <p className="text-muted-foreground mt-2">
              Save these credentials. Share the appropriate password with your team members so they can join.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Organization Slug</p>
                <p className="font-mono font-bold text-lg">{createdOrg.slug}</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(createdOrg.slug)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordCard role="Employee" pwd={createdOrg.employee_password} onCopy={copyToClipboard} />
              <PasswordCard role="Manager" pwd={createdOrg.manager_password} onCopy={copyToClipboard} />
              <PasswordCard role="HR" pwd={createdOrg.hr_password} onCopy={copyToClipboard} />
              <PasswordCard role="Admin" pwd={createdOrg.admin_password} onCopy={copyToClipboard} />
            </div>
          </div>
          
          <Button className="w-full mt-8" size="lg" onClick={() => router.push("/app/dashboard")}>
            Go to Dashboard →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">GoalFlow</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {!action 
              ? "Let's get you set up. Do you want to create or join an organization?" 
              : action === "create" 
                ? "Set up your new organization" 
                : "Join your team's organization"}
          </p>
        </div>

        {/* Step 1: Action Selection */}
        {!action && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => setAction("create")}
              className="relative text-left rounded-2xl border-2 border-transparent bg-card p-8 transition-all duration-200 hover:scale-[1.02] hover:border-primary/50 focus:outline-none shadow-sm"
            >
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Building className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Create Organization</h3>
              <p className="text-muted-foreground">Start a new workspace for your company. You will be the Admin.</p>
            </button>
            
            <button
              onClick={() => setAction("join")}
              className="relative text-left rounded-2xl border-2 border-transparent bg-card p-8 transition-all duration-200 hover:scale-[1.02] hover:border-primary/50 focus:outline-none shadow-sm"
            >
              <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <KeyRound className="h-7 w-7 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Join Organization</h3>
              <p className="text-muted-foreground">Use an organization slug and access password to join an existing team.</p>
            </button>
          </div>
        )}

        {/* Step 2: Form */}
        {action && (
          <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-auto shadow-sm">
            {action === "create" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Organization Name</label>
                  <Input
                    placeholder="e.g. Acme Corp"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Organization Slug</label>
                  <Input
                    placeholder="e.g. acme-corp-1234"
                    value={orgSlug}
                    onChange={e => setOrgSlug(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Role Access Password</label>
                  <Input
                    type="password"
                    placeholder="Enter the password provided by your admin"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-8">
              <Button variant="ghost" onClick={() => setAction(null)} className="px-0">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              
              <Button
                disabled={isSubmitting || (action === "create" ? !orgName : (!orgSlug || !password))}
                onClick={handleSubmit}
                className="px-8"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {action === "create" ? "Creating..." : "Joining..."}</>
                ) : (
                  action === "create" ? "Create Org" : "Join Org"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PasswordCard({ role, pwd, onCopy }: { role: string, pwd: string, onCopy: (v: string) => void }) {
  return (
    <div className="border border-border rounded-xl p-4 flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">{role} Password</p>
      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
        <code className="font-mono text-sm">{pwd}</code>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onCopy(pwd)}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
