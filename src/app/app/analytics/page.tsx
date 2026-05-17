"use client"

import { useEffect, useState } from "react"
import { getSession, UserRole } from "@/lib/auth"
import { RoleGuard } from "@/components/role-guard"
import { Download, TrendingUp, Users, Target, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts"

const deptData = [
  { dept: "Engineering", completion: 78, goals: 24 },
  { dept: "Sales", completion: 85, goals: 18 },
  { dept: "Design", completion: 60, goals: 8 },
  { dept: "Marketing", completion: 92, goals: 12 },
  { dept: "HR", completion: 70, goals: 6 },
]

const trendData = [
  { month: "Jan", completion: 45 },
  { month: "Feb", completion: 52 },
  { month: "Mar", completion: 60 },
  { month: "Apr", completion: 68 },
  { month: "May", completion: 75 },
]

const statusDist = [
  { name: "On Track", value: 38, color: "#10B981" },
  { name: "At Risk", value: 12, color: "#F59E0B" },
  { name: "Completed", value: 18, color: "#4F46E5" },
  { name: "Not Started", value: 6, color: "#94A3B8" },
]

const atRiskGoals = [
  { employee: "Ravi Kumar", goal: "95% CSAT Score", dept: "Engineering", progress: 45, daysLeft: 22 },
  { employee: "Anita Patel", goal: "Reduce Iteration Cycles", dept: "Design", progress: 30, daysLeft: 22 },
  { employee: "John D'Souza", goal: "3x Organic Traffic", dept: "Marketing", progress: 25, daysLeft: 22 },
]

const auditLog = [
  { action: "Goal Unlocked", user: "David Chen (Admin)", target: "Ravi Kumar — Reduce SLA", time: "2026-05-16 14:22" },
  { action: "Cycle Updated", user: "Priya Sharma (HR)", target: "FY 2026 Q3 → 2026-07-01", time: "2026-05-15 09:10" },
  { action: "Goal Approved", user: "Sarah Mitchell (Manager)", target: "Carlos — Code Review 90%", time: "2026-05-14 11:05" },
  { action: "Goal Returned", user: "Sarah Mitchell (Manager)", target: "Meena — Enterprise Deals", time: "2026-05-13 16:48" },
  { action: "Employee Added", user: "Priya Sharma (HR)", target: "Nikhil Verma — Engineering", time: "2026-05-12 10:30" },
]

export default function AnalyticsPage() {
  const [role, setRole] = useState<UserRole>("employee")

  useEffect(() => {
    const s = getSession()
    if (s) setRole(s.role)
  }, [])

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
            { label: "Total Goals", value: "74", icon: Target, color: "text-primary" },
            { label: "Avg Completion", value: "77%", icon: TrendingUp, color: "text-emerald-600" },
            { label: "At Risk", value: "12", icon: AlertCircle, color: "text-amber-600" },
            { label: "Employees", value: "68", icon: Users, color: "text-blue-600" },
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
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis type="category" dataKey="dept" width={80} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Monthly Completion Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis unit="%" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Line type="monotone" dataKey="completion" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Goal Status Distribution</CardTitle></CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" />At-Risk Goals</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {atRiskGoals.map((g, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate max-w-[140px]">{g.goal}</span>
                      <span className="text-muted-foreground">{g.progress}%</span>
                    </div>
                    <Progress value={g.progress} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{g.employee} · {g.daysLeft}d left</p>
                  </div>
                ))}
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
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Target</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((log, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{log.action}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{log.user}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{log.target}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{log.time}</td>
                      </tr>
                    ))}
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
