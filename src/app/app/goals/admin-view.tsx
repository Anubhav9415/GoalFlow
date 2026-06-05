"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ShieldCheck, Unlock, RefreshCw, Download,
  Building2, Search, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { fetchGoals, updateGoal, fetchCycles, saveCycle } from "@/services/api"
import type { Goal, PerformanceCycle } from "@/types/database"

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export function AdminGoalsView() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [cycle, setCycle] = useState<{ id?: string; name: string; startDate: string; endDate: string; active: boolean }>({ name: "", startDate: "", endDate: "", active: false })
  const [isLoading, setIsLoading] = useState(true)
  const [unlockingId, setUnlockingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [goalsData, cyclesData] = await Promise.all([
        fetchGoals({ role: "admin" }),
        fetchCycles(),
      ])
      setGoals(goalsData)
      const activeCycle = cyclesData.find(c => c.is_active) || cyclesData[0]
      if (activeCycle) {
        setCycle({
          id: activeCycle.id,
          name: activeCycle.name,
          startDate: activeCycle.start_date,
          endDate: activeCycle.end_date,
          active: activeCycle.is_active,
        })
      }
    } catch {
      toast.error("Failed to load data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const departments = ["All", ...Array.from(new Set(goals.map(g => g.employee?.department).filter(Boolean) as string[]))]

  const filtered = goals.filter(g => {
    const name = g.employee?.full_name || ""
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || g.title.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === "All" || g.employee?.department === deptFilter
    const matchStatus = statusFilter === "All" || g.status === statusFilter
    return matchSearch && matchDept && matchStatus
  })

  async function unlockGoal(id: string) {
    setUnlockingId(id)
    try {
      await updateGoal(id, { is_locked: false, status: "draft" })
      setGoals(prev => prev.map(g => g.id === id ? { ...g, is_locked: false, status: "draft" } : g))
      toast.success("Goal unlocked — employee can now edit it.")
    } catch {
      toast.error("Failed to unlock goal.")
    } finally {
      setUnlockingId(null)
    }
  }

  async function handleSaveCycle() {
    try {
      const saved = await saveCycle({
        id: cycle.id,
        name: cycle.name,
        start_date: cycle.startDate,
        end_date: cycle.endDate,
        is_active: cycle.active,
      })
      setCycle(prev => ({ ...prev, id: saved.id }))
      toast.success("Cycle configuration saved!")
    } catch {
      toast.error("Failed to save cycle.")
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const stats = {
    total: goals.length,
    approved: goals.filter(g => g.status === "approved").length,
    pending: goals.filter(g => g.status === "pending").length,
    avgWeightage: goals.length > 0 ? Math.round(goals.reduce((s, g) => s + Number(g.weightage), 0) / goals.length) : 0,
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
          { label: "Pending Review", value: stats.pending, color: "text-amber-600" },
          { label: "Avg Weightage", value: `${stats.avgWeightage}%`, color: "text-primary" },
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
              <Button size="sm" onClick={handleSaveCycle}>Save Changes</Button>
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
          {["All", "draft", "pending", "approved", "rejected"].map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden md:table-cell">Weightage</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((goal, i) => {
                  const name = goal.employee?.full_name || "—"
                  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                  return (
                    <tr key={goal.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {initials}
                          </div>
                          <span className="font-medium">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-medium truncate">{goal.title}</p>
                        <p className="text-xs text-muted-foreground">{goal.target_value} {goal.uom_type}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="h-3 w-3" />{goal.employee?.department || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">{goal.thrust_area || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`text-xs capitalize ${STATUS_STYLE[goal.status] || ""}`}>{goal.status}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-center">
                        <span className="text-sm font-medium">{goal.weightage}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {goal.is_locked ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                            disabled={unlockingId === goal.id} onClick={() => unlockGoal(goal.id)}>
                            {unlockingId === goal.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Unlock className="mr-1 h-3 w-3" />}Unlock
                          </Button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">Editable</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
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
