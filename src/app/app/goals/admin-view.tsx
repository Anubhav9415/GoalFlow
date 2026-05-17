"use client"

import { useState } from "react"
import {
  ShieldCheck, Filter, Unlock, RefreshCw, Download,
  Building2, Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

type GoalStatus = "approved" | "submitted" | "draft" | "returned"

interface OrgGoal {
  id: string
  employee: string
  department: string
  title: string
  thrustArea: string
  weightage: number
  status: GoalStatus
  progress: number
  locked: boolean
}

const MOCK_ORG_GOALS: OrgGoal[] = [
  { id: "1", employee: "Ravi Kumar", department: "Engineering", title: "Reduce SLA to 4 hrs", thrustArea: "Customer Satisfaction", weightage: 30, status: "approved", progress: 72, locked: true },
  { id: "2", employee: "Anita Patel", department: "Design", title: "Launch Design System v2", thrustArea: "Innovation", weightage: 40, status: "submitted", progress: 0, locked: true },
  { id: "3", employee: "Carlos Mendes", department: "Engineering", title: "Code Review Coverage 90%", thrustArea: "Quality", weightage: 20, status: "draft", progress: 0, locked: false },
  { id: "4", employee: "Meena Raj", department: "Sales", title: "Close 50 Enterprise Deals", thrustArea: "Revenue Growth", weightage: 50, status: "approved", progress: 85, locked: true },
  { id: "5", employee: "John D'Souza", department: "Marketing", title: "3x Website Organic Traffic", thrustArea: "Revenue Growth", weightage: 35, status: "returned", progress: 0, locked: false },
  { id: "6", employee: "Preethi Nair", department: "HR", title: "Reduce Attrition to 8%", thrustArea: "People Development", weightage: 45, status: "approved", progress: 60, locked: true },
]

const CYCLE_CONFIG = { name: "FY 2026 Q3", startDate: "2026-07-01", endDate: "2026-09-30", active: true }

const STATUS_STYLE: Record<GoalStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  returned: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export function AdminGoalsView() {
  const [goals, setGoals] = useState<OrgGoal[]>(MOCK_ORG_GOALS)
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [cycle, setCycle] = useState(CYCLE_CONFIG)

  const departments = ["All", ...Array.from(new Set(MOCK_ORG_GOALS.map(g => g.department)))]

  const filtered = goals.filter(g => {
    const matchSearch = g.employee.toLowerCase().includes(search.toLowerCase()) || g.title.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === "All" || g.department === deptFilter
    const matchStatus = statusFilter === "All" || g.status === statusFilter
    return matchSearch && matchDept && matchStatus
  })

  function unlockGoal(id: string) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, locked: false, status: "draft" } : g))
    toast.success("Goal unlocked — employee can now edit it.")
  }

  const stats = {
    total: goals.length,
    approved: goals.filter(g => g.status === "approved").length,
    submitted: goals.filter(g => g.status === "submitted").length,
    avgProgress: Math.round(goals.filter(g => g.status === "approved").reduce((s, g) => s + g.progress, 0) / Math.max(goals.filter(g => g.status === "approved").length, 1)),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Org-Wide Goals</h2>
          <p className="text-muted-foreground">Manage all employee goals across the organization.</p>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-red-500" />
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Admin / HR View</Badge>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Goals", value: stats.total, color: "text-foreground" },
          { label: "Approved", value: stats.approved, color: "text-emerald-600" },
          { label: "Pending Review", value: stats.submitted, color: "text-amber-600" },
          { label: "Avg Progress", value: `${stats.avgProgress}%`, color: "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-5 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cycle Management */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />Performance Cycle Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Cycle Name</label>
              <Input value={cycle.name} onChange={e => setCycle(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Start Date</label>
              <Input type="date" value={cycle.startDate} onChange={e => setCycle(p => ({ ...p, startDate: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">End Date</label>
              <Input type="date" value={cycle.endDate} onChange={e => setCycle(p => ({ ...p, endDate: e.target.value }))} className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${cycle.active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
              <span className="text-sm">{cycle.active ? "Cycle Active" : "Cycle Inactive"}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setCycle(p => ({ ...p, active: !p.active }))}>
                {cycle.active ? "Deactivate" : "Activate"} Cycle
              </Button>
              <Button size="sm" onClick={() => toast.success("Cycle configuration saved!")}>Save Changes</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employee or goal…" className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          {departments.map(d => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {["All", "draft", "submitted", "approved", "returned"].map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => toast.success("CSV export initiated!")}>
          <Download className="mr-2 h-4 w-4" />Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Goal</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Dept</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Thrust Area</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden md:table-cell">Progress</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((goal, i) => (
                  <tr key={goal.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {goal.employee.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-medium">{goal.employee}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="font-medium truncate">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">{goal.weightage}% weight</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" />{goal.department}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{goal.thrustArea}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`text-xs ${STATUS_STYLE[goal.status]}`}>{goal.status}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {goal.status === "approved" ? (
                        <div className="space-y-1 min-w-[80px]">
                          <Progress value={goal.progress} className="h-1.5" />
                          <p className="text-xs text-center text-muted-foreground">{goal.progress}%</p>
                        </div>
                      ) : <span className="text-xs text-muted-foreground text-center block">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {goal.locked ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20" onClick={() => unlockGoal(goal.id)}>
                          <Unlock className="mr-1 h-3 w-3" />Unlock
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">Editable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">No goals match your filters.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
