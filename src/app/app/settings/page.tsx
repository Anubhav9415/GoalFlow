"use client"

import { useEffect, useState } from "react"
import { Bell, User, Shield, Save, Loader2, Camera, Building2, RefreshCw, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { fetchProfile, saveCycle, fetchCycles } from "@/services/api"
import type { Profile, PerformanceCycle } from "@/types/database"
import { ROLE_CONFIG } from "@/lib/auth"

const DEPARTMENTS = [
  "Engineering", "Design", "Sales", "Marketing",
  "Human Resources", "Finance", "Operations", "Product",
  "Customer Success", "Legal", "Other",
]

function ProfileTab({ profile, onSave }: { profile: Profile; onSave: (data: Partial<Profile>) => Promise<void> }) {
  const { user } = useUser()
  const [fullName, setFullName] = useState(profile.full_name)
  const [department, setDepartment] = useState(profile.department || "")
  const [saving, setSaving] = useState(false)
  const roleCfg = ROLE_CONFIG[profile.role]

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({ full_name: fullName, department })
      toast.success("Profile updated successfully!")
    } catch {
      toast.error("Failed to save profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Profile Information</CardTitle>
          <CardDescription>Your personal details as shown across GoalFlow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={fullName} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: roleCfg.color }}
                >
                  {fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border-2 border-border flex items-center justify-center">
                <Camera className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-lg">{fullName || "—"}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge className="mt-1 text-xs" style={{ background: roleCfg.bgColor, color: roleCfg.color }}>
                {roleCfg.label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Full Name</label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Email (from Clerk)</label>
              <Input value={profile.email} disabled className="opacity-60" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Department</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Role</label>
              <Input value={roleCfg.label} disabled className="opacity-60" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Notification Preferences</CardTitle>
          <CardDescription>Choose which alerts you want to receive.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            { label: "Goal approval notifications", sub: "When your goals are approved or returned by your manager" },
            { label: "Check-in reminders", sub: "Quarterly reminders to log your check-in before the deadline" },
            { label: "Manager feedback alerts", sub: "When your manager rates or comments on your check-in" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-muted peer-checked:bg-primary rounded-full peer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminSettingsTab() {
  const [cycle, setCycle] = useState<PerformanceCycle | null>(null)
  const [cycleName, setCycleName] = useState("")
  const [cycleStart, setCycleStart] = useState("")
  const [cycleEnd, setCycleEnd] = useState("")
  const [cycleActive, setCycleActive] = useState(true)
  const [savingCycle, setSavingCycle] = useState(false)

  useEffect(() => {
    fetchCycles().then(cycles => {
      const active = cycles.find(c => c.is_active) || cycles[0]
      if (active) {
        setCycle(active)
        setCycleName(active.name)
        setCycleStart(active.start_date)
        setCycleEnd(active.end_date)
        setCycleActive(active.is_active)
      }
    }).catch(() => {})
  }, [])

  async function handleSaveCycle() {
    setSavingCycle(true)
    try {
      const saved = await saveCycle({
        id: cycle?.id,
        name: cycleName,
        start_date: cycleStart,
        end_date: cycleEnd,
        is_active: cycleActive,
      })
      setCycle(saved)
      toast.success("Performance cycle saved!")
    } catch {
      toast.error("Failed to save cycle.")
    } finally {
      setSavingCycle(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" />Performance Cycle</CardTitle>
          <CardDescription>Configure the active goal-setting period for your organisation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Cycle Name</label>
              <Input value={cycleName} onChange={e => setCycleName(e.target.value)} placeholder="e.g. FY 2026 Q3" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Start Date</label>
              <Input type="date" value={cycleStart} onChange={e => setCycleStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">End Date</label>
              <Input type="date" value={cycleEnd} onChange={e => setCycleEnd(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${cycleActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
              <span className="text-sm">{cycleActive ? "Cycle is Active" : "Cycle is Inactive"}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCycleActive(p => !p)}>
                {cycleActive ? "Deactivate" : "Activate"}
              </Button>
              <Button size="sm" onClick={handleSaveCycle} disabled={savingCycle}>
                {savingCycle ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Department Info</CardTitle>
          <CardDescription>Departments are derived from user profiles. Users pick their department during onboarding.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            Departments are automatically detected from your team's profiles. No manual management needed.
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600"><Shield className="h-4 w-4" />Danger Zone</CardTitle>
          <CardDescription>Irreversible actions — use with caution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Force-Close Cycle", desc: "Locks all goals and prevents further edits for this cycle.", btn: "Force Close" },
          ].map(action => (
            <div key={action.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => toast.warning("This action is disabled in demo mode.")}>
                {action.btn}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tab, setTab] = useState<"profile" | "admin">("profile")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(() => toast.error("Could not load profile. Please refresh."))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveProfile(data: Partial<Profile>) {
    const res = await fetch("/api/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to save")
    const updated = await res.json()
    setProfile(updated)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <p className="text-muted-foreground">Profile not found. Have you completed onboarding?</p>
        <Button onClick={() => window.location.href = "/onboarding"}>Complete Onboarding</Button>
      </div>
    )
  }

  const isAdmin = profile.role === "admin" || profile.role === "hr"

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your profile and preferences.</p>
      </div>

      {isAdmin && (
        <div className="flex gap-1 border-b border-border">
          {(["profile", "admin"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "profile" ? "Profile & Notifications" : "System Administration"}
            </button>
          ))}
        </div>
      )}

      {tab === "profile" || !isAdmin
        ? <ProfileTab profile={profile} onSave={handleSaveProfile} />
        : <AdminSettingsTab />
      }
    </div>
  )
}
