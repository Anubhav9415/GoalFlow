"use client"

import { useEffect, useState } from "react"
import { getSession, UserRole, ROLE_CONFIG } from "@/lib/auth"
import { Settings, RefreshCw, Building2, Bell, User, ShieldCheck, Save, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Dept { id: string; name: string; manager: string; headcount: number }

const MOCK_DEPTS: Dept[] = [
  { id: "d1", name: "Engineering", manager: "Sarah Mitchell", headcount: 24 },
  { id: "d2", name: "Design", manager: "Carlos Mendes", headcount: 8 },
  { id: "d3", name: "Sales", manager: "Meena Raj", headcount: 18 },
  { id: "d4", name: "Marketing", manager: "Preethi Nair", headcount: 12 },
]

function ProfileTab({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role]
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ background: cfg.color }}>
              {role === "employee" ? "AJ" : role === "manager" ? "SM" : role === "admin" ? "DC" : "PS"}
            </div>
            <div>
              <p className="font-semibold text-lg">{role === "employee" ? "Alex Johnson" : role === "manager" ? "Sarah Mitchell" : role === "admin" ? "David Chen" : "Priya Sharma"}</p>
              <Badge style={{ background: cfg.bgColor, color: cfg.color }} className="text-xs">{cfg.label}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-xs font-medium">Full Name</label><Input defaultValue={role === "employee" ? "Alex Johnson" : role === "manager" ? "Sarah Mitchell" : role === "admin" ? "David Chen" : "Priya Sharma"} /></div>
            <div className="space-y-1"><label className="text-xs font-medium">Email</label><Input defaultValue={`${role}@company.com`} /></div>
            <div className="space-y-1"><label className="text-xs font-medium">Department</label><Input defaultValue="Engineering" /></div>
            <div className="space-y-1"><label className="text-xs font-medium">Employee ID</label><Input defaultValue="EMP-2024-001" disabled className="opacity-60" /></div>
          </div>
          <Button onClick={() => toast.success("Profile updated!")}><Save className="mr-2 h-4 w-4" />Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Goal approval notifications", sub: "When your goals are approved or returned" },
            { label: "Check-in reminders", sub: "Weekly reminders for quarterly check-ins" },
            { label: "Manager feedback alerts", sub: "When your manager adds feedback" },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-muted peer-checked:bg-primary rounded-full peer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function AdminSettingsTab() {
  const [cycle, setCycle] = useState({ name: "FY 2026 Q3", start: "2026-07-01", end: "2026-09-30", active: true })
  const [depts, setDepts] = useState<Dept[]>(MOCK_DEPTS)
  const [newDept, setNewDept] = useState({ name: "", manager: "" })

  function addDept() {
    if (!newDept.name || !newDept.manager) { toast.error("Fill in department name and manager."); return }
    setDepts(prev => [...prev, { id: Date.now().toString(), name: newDept.name, manager: newDept.manager, headcount: 0 }])
    setNewDept({ name: "", manager: "" })
    toast.success("Department added!")
  }

  function removeDept(id: string) {
    setDepts(prev => prev.filter(d => d.id !== id))
    toast.info("Department removed.")
  }

  return (
    <div className="space-y-6">
      {/* Cycle management */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-4 w-4 text-primary" />Performance Cycle</CardTitle>
          <CardDescription>Configure the active performance cycle for the organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1"><label className="text-xs font-medium">Cycle Name</label><Input value={cycle.name} onChange={e => setCycle(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><label className="text-xs font-medium">Start Date</label><Input type="date" value={cycle.start} onChange={e => setCycle(p => ({ ...p, start: e.target.value }))} /></div>
            <div className="space-y-1"><label className="text-xs font-medium">End Date</label><Input type="date" value={cycle.end} onChange={e => setCycle(p => ({ ...p, end: e.target.value }))} /></div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${cycle.active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
              <span className="text-sm">{cycle.active ? "Cycle Active" : "Cycle Inactive"}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCycle(p => ({ ...p, active: !p.active }))}>{cycle.active ? "Deactivate" : "Activate"}</Button>
              <Button size="sm" onClick={() => toast.success("Cycle saved!")}><Save className="mr-2 h-3.5 w-3.5" />Save</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Org hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Organisation Hierarchy</CardTitle>
          <CardDescription>Manage departments and their reporting managers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {depts.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-muted-foreground">Manager: {d.manager} · {d.headcount} members</p>
                </div>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-7 w-7" onClick={() => removeDept(d.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Input placeholder="Department name" value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} className="flex-1" />
            <Input placeholder="Manager name" value={newDept.manager} onChange={e => setNewDept(p => ({ ...p, manager: e.target.value }))} className="flex-1" />
            <Button size="sm" onClick={addDept}><Plus className="mr-1.5 h-3.5 w-3.5" />Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Exception / Audit */}
      <Card className="border-red-200 dark:border-red-900/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600"><ShieldCheck className="h-4 w-4" />Exception Handling</CardTitle>
          <CardDescription>Dangerous actions — use with care.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Reset All Employee Drafts", desc: "Clears all unsubmitted drafts for the current cycle.", btn: "Reset Drafts", variant: "outline" as const },
            { label: "Force Close Cycle", desc: "Locks all goals regardless of submission status.", btn: "Force Close", variant: "destructive" as const },
          ].map(action => (
            <div key={action.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <Button size="sm" variant={action.variant} onClick={() => toast.warning(`${action.btn} action triggered (demo).`)}>{action.btn}</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const [role, setRole] = useState<UserRole>("employee")
  const [tab, setTab] = useState<"profile" | "admin">("profile")

  useEffect(() => {
    const s = getSession()
    if (s) setRole(s.role)
  }, [])

  const isAdmin = role === "admin" || role === "hr"

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Settings className="h-7 w-7" />Settings</h2>
        <p className="text-muted-foreground">Manage your profile and system configuration.</p>
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

      {tab === "profile" || !isAdmin ? <ProfileTab role={role} /> : <AdminSettingsTab />}
    </div>
  )
}
