"use client"

import { useEffect, useState } from "react"
import { getSession, UserRole } from "@/lib/auth"
import { RoleGuard } from "@/components/role-guard"
import { Download, FileText, Filter, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

type ReportStatus = "On Track" | "At Risk" | "Completed" | "Not Started"

interface ReportRow {
  id: string
  employee: string
  dept: string
  goal: string
  thrustArea: string
  target: string
  actual: string
  weightage: number
  progress: number
  status: ReportStatus
  cycle: string
}

const MOCK_REPORT: ReportRow[] = [
  { id: "r1", employee: "Ravi Kumar", dept: "Engineering", goal: "Reduce SLA to 4 hrs", thrustArea: "Customer Satisfaction", target: "4 hrs", actual: "5.2 hrs", weightage: 30, progress: 55, status: "At Risk", cycle: "FY 2026 Q3" },
  { id: "r2", employee: "Ravi Kumar", dept: "Engineering", goal: "95% CSAT Score", thrustArea: "Customer Satisfaction", target: "95%", actual: "89%", weightage: 30, progress: 45, status: "At Risk", cycle: "FY 2026 Q3" },
  { id: "r3", employee: "Anita Patel", dept: "Design", goal: "Launch Design System v2", thrustArea: "Innovation", target: "Done", actual: "75%", weightage: 40, progress: 75, status: "On Track", cycle: "FY 2026 Q3" },
  { id: "r4", employee: "Carlos Mendes", dept: "Engineering", goal: "Code Review Coverage 90%", thrustArea: "Quality", target: "90%", actual: "88%", weightage: 20, progress: 88, status: "On Track", cycle: "FY 2026 Q3" },
  { id: "r5", employee: "Meena Raj", dept: "Sales", goal: "Close 50 Enterprise Deals", thrustArea: "Revenue Growth", target: "50 deals", actual: "43 deals", weightage: 50, progress: 86, status: "On Track", cycle: "FY 2026 Q3" },
  { id: "r6", employee: "Preethi Nair", dept: "HR", goal: "Reduce Attrition to 8%", thrustArea: "People Development", target: "8%", actual: "9.2%", weightage: 45, progress: 60, status: "At Risk", cycle: "FY 2026 Q3" },
  { id: "r7", employee: "John D'Souza", dept: "Marketing", goal: "3x Organic Traffic", thrustArea: "Revenue Growth", target: "3x", actual: "1.8x", weightage: 35, progress: 60, status: "At Risk", cycle: "FY 2026 Q3" },
  { id: "r8", employee: "Nikhil Verma", dept: "Engineering", goal: "Zero Critical Bugs in Prod", thrustArea: "Quality", target: "0", actual: "0", weightage: 25, progress: 100, status: "Completed", cycle: "FY 2026 Q3" },
]

const STATUS_ICON: Record<ReportStatus, React.ReactNode> = {
  "On Track": <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  "At Risk": <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,
  "Completed": <CheckCircle2 className="h-3.5 w-3.5 text-primary" />,
  "Not Started": <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
}

const STATUS_STYLE: Record<ReportStatus, string> = {
  "On Track": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "At Risk": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Completed": "bg-primary/10 text-primary",
  "Not Started": "bg-muted text-muted-foreground",
}

export default function ReportsPage() {
  const [role, setRole] = useState<UserRole>("employee")
  const [deptFilter, setDeptFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  useEffect(() => {
    const s = getSession()
    if (s) setRole(s.role)
  }, [])

  const depts = ["All", ...Array.from(new Set(MOCK_REPORT.map(r => r.dept)))]
  const filtered = MOCK_REPORT.filter(r => {
    const matchDept = deptFilter === "All" || r.dept === deptFilter
    const matchStatus = statusFilter === "All" || r.status === statusFilter
    return matchDept && matchStatus
  })

  const summary = {
    total: filtered.length,
    onTrack: filtered.filter(r => r.status === "On Track").length,
    atRisk: filtered.filter(r => r.status === "At Risk").length,
    completed: filtered.filter(r => r.status === "Completed").length,
    avgProgress: Math.round(filtered.reduce((s, r) => s + r.progress, 0) / Math.max(filtered.length, 1)),
  }

  return (
    <RoleGuard permission="canViewAnalytics">
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2"><FileText className="h-7 w-7" />Reports</h2>
            <p className="text-muted-foreground">Detailed goal performance report — FY 2026 Q3.</p>
          </div>
          <Button onClick={() => toast.success("CSV export initiated!")}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Goals", value: summary.total, color: "text-foreground" },
            { label: "On Track", value: summary.onTrack, color: "text-emerald-600" },
            { label: "At Risk", value: summary.atRisk, color: "text-amber-600" },
            { label: "Completed", value: summary.completed, color: "text-primary" },
            { label: "Avg Progress", value: `${summary.avgProgress}%`, color: "text-blue-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            {depts.map(d => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
          </select>
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {["All", "On Track", "At Risk", "Completed", "Not Started"].map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
          <span className="text-sm text-muted-foreground ml-auto">{filtered.length} rows</span>
        </div>

        {/* Report table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employee</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Dept</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Goal</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">Target</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden lg:table-cell">Actual</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Progress</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {row.employee.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="font-medium">{row.employee}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{row.dept}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium max-w-[160px] truncate">{row.goal}</p>
                        <p className="text-xs text-muted-foreground">{row.thrustArea}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-xs hidden lg:table-cell">{row.target}</td>
                      <td className="px-4 py-3 text-center text-xs font-medium hidden lg:table-cell">{row.actual}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1 min-w-[80px]">
                          <Progress value={row.progress} className="h-1.5" />
                          <p className="text-xs text-center text-muted-foreground">{row.progress}%</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`text-xs gap-1 ${STATUS_STYLE[row.status]}`}>
                          {STATUS_ICON[row.status]}{row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">No data matches your filters.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
