"use client"

import { useEffect, useState } from "react"
import { RoleGuard } from "@/components/role-guard"
import { Download, TrendingUp, Users, Target, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts"
import { fetchAnalytics, fetchProfile } from "@/services/api"
import type { OrgAnalytics, AuditLog, Goal, Profile, Checkin } from "@/types/database"

export default function AnalyticsPage() {
  const [role, setRole] = useState<string>("employee")
  const [analytics, setAnalytics] = useState<OrgAnalytics | null>(null)
  const [atRiskGoals, setAtRiskGoals] = useState<(Goal & { employee?: Profile; latest_checkin?: Checkin })[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [departmentCompletion, setDepartmentCompletion] = useState<Array<{ department: string; completion: number; goals: number }>>([])
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: string; completion: number }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchProfile(), fetchAnalytics()])
      .then(([profile, data]) => {
        setRole(profile.role)
        setAnalytics(data.analytics)
        setAtRiskGoals(data.atRiskGoals || [])
        setAuditLogs(data.auditLogs || [])
        setDepartmentCompletion(data.departmentCompletion || [])
        setMonthlyTrend(data.monthlyTrend || [])
      })
      .catch(() => toast.error("Failed to load analytics."))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  // Build status distribution from real data
  const statusDist = analytics?.goals_by_status?.map(s => {
    const colorMap: Record<string, string> = { approved: "#10B981", pending: "#F59E0B", draft: "#94A3B8", rejected: "#EF4444" }
    return { name: s.status.charAt(0).toUpperCase() + s.status.slice(1), value: s.count, color: colorMap[s.status] || "#6366F1" }
  }) || []

  return (
    <RoleGuard permission="canViewAnalytics">
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">Organization-wide goal completion insights.</p>
          </div>
          <Button variant="outline" onClick={() => toast.success("Report exported!")}>
            <Download className="mr-2 h-4 w-4" />Export Report
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Goals", value: String(analytics?.total_goals ?? 0), icon: Target, color: "text-primary" },
            { label: "Total Employees", value: String(analytics?.total_employees ?? 0), icon: Users, color: "text-blue-600" },
            { label: "At Risk", value: String(analytics?.at_risk_count ?? 0), icon: AlertCircle, color: "text-amber-600" },
            { label: "Managers", value: String(analytics?.total_managers ?? 0), icon: TrendingUp, color: "text-emerald-600" },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Completion by Department</CardTitle></CardHeader>
              <CardContent>
                {departmentCompletion.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={departmentCompletion.map(d => ({ dept: d.department, completion: d.completion }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis type="category" dataKey="dept" width={80} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No department data yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Completion Trend</CardTitle></CardHeader>
              <CardContent>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis unit="%" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Line type="monotone" dataKey="completion" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No trend data yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Goal Status Distribution</CardTitle></CardHeader>
              <CardContent>
                {statusDist.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                          {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1.5 mt-2">
                      {statusDist.map(s => (
                        <div key={s.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.name}</div>
                          <span className="font-medium">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No goals yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" />At-Risk Goals</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {atRiskGoals.length > 0 ? atRiskGoals.map((g, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate max-w-[140px]">{g.title}</span>
                      <span className="text-muted-foreground">{g.weightage}%</span>
                    </div>
                    <Progress value={g.weightage} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{g.employee?.full_name || "—"} · {g.employee?.department || "—"}</p>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No at-risk goals 🎉</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Audit log — admin/hr only */}
        {(role === "admin" || role === "hr") && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Audit Log</CardTitle>
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">Admin / HR only</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">By</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Description</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length > 0 ? auditLogs.slice(0, 20).map((log, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium capitalize">{log.action}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{log.changed_by_profile?.full_name || "System"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{log.description || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No audit logs yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  )
}
