"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Target,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  ShieldCheck,
  Briefcase,
} from "lucide-react"
import { AiInsightsCard } from "@/components/ai-insights-card"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { getSession, UserSession, ROLE_CONFIG } from "@/lib/auth"

// ─── Static chart data ────────────────────────────────────────────────────────
const pieData = [
  { name: "On Track", value: 5, color: "#10B981" },
  { name: "At Risk", value: 2, color: "#F59E0B" },
  { name: "Completed", value: 1, color: "#4F46E5" },
]

const lineData = [
  { quarter: "Q1", progress: 30 },
  { quarter: "Q2", progress: 55 },
  { quarter: "Q3", progress: 64 },
  { quarter: "Q4", progress: 64 },
]

const teamData = [
  { name: "Engineering", completion: 78 },
  { name: "Sales", completion: 85 },
  { name: "Design", completion: 60 },
  { name: "Marketing", completion: 92 },
]

const recentGoals = [
  { title: "Reduce SLA to 4hrs", progress: 72, status: "On Track" },
  { title: "95% CSAT Score", progress: 45, status: "At Risk" },
  { title: "Product Certification", progress: 90, status: "On Track" },
]

// ─── Role-specific KPI config ─────────────────────────────────────────────────
const roleKpi = {
  employee: {
    statLabel: "My Goals",
    statValue: "5",
    statNote: "+1 from last quarter",
    StatIcon: Target,
    statColor: "text-primary",
    pendingLabel: "Pending Check-ins",
    pendingNote: "Due this week",
  },
  manager: {
    statLabel: "Team Members",
    statValue: "12",
    statNote: "Across 3 departments",
    StatIcon: Users,
    statColor: "text-emerald-500",
    pendingLabel: "Pending Approvals",
    pendingNote: "Awaiting your review",
  },
  admin: {
    statLabel: "Org-Wide Goals",
    statValue: "48",
    statNote: "Across all teams",
    StatIcon: ShieldCheck,
    statColor: "text-red-500",
    pendingLabel: "Policy Updates",
    pendingNote: "Needs attention",
  },
  hr: {
    statLabel: "Employees Tracked",
    statValue: "134",
    statNote: "+8 new this quarter",
    StatIcon: Briefcase,
    statColor: "text-amber-500",
    pendingLabel: "Review Requests",
    pendingNote: "Performance reviews",
  },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  const role = session?.role ?? "employee"
  const roleCfg = ROLE_CONFIG[role]
  const kpi = roleKpi[role]
  const firstName = session?.name?.split(" ")[0] ?? "there"
  const isManagerOrAbove = ["manager", "admin", "hr"].includes(role)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back,{" "}
            <span className="font-semibold text-foreground">{firstName}</span>.
            Here's your Q3 2026 overview.
          </p>
        </div>
        {/* Role badge */}
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
          style={{ background: roleCfg.bgColor, color: roleCfg.color }}
        >
          {role === "employee" && <Target className="h-4 w-4" />}
          {role === "manager" && <Users className="h-4 w-4" />}
          {role === "admin" && <ShieldCheck className="h-4 w-4" />}
          {role === "hr" && <Briefcase className="h-4 w-4" />}
          {roleCfg.label} View
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Role-specific primary stat */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{kpi.statLabel}</CardTitle>
            <kpi.StatIcon className={`h-4 w-4 ${kpi.statColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.statValue}</div>
            <p className="text-xs text-muted-foreground">{kpi.statNote}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">64%</div>
            <Progress value={64} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{kpi.pendingLabel}</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">{kpi.pendingNote}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Check-in</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14d</div>
            <p className="text-xs text-muted-foreground">End of Q3</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts + Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quarterly Progress Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="quarter"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    stroke={roleCfg.color}
                    strokeWidth={2.5}
                    dot={{ fill: roleCfg.color, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team chart — only for manager / admin / hr */}
          {isManagerOrAbove && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Goal Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={teamData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      unit="%"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Bar
                      dataKey="completion"
                      fill={roleCfg.color}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Employee personal milestones */}
          {!isManagerOrAbove && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">My Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Complete Q3 review", done: true },
                  { label: "Submit project report", done: true },
                  { label: "Attend training workshop", done: false },
                  { label: "Update performance notes", done: false },
                ].map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={`h-4 w-4 flex-shrink-0 ${
                        m.done ? "text-emerald-500" : "text-muted-foreground/40"
                      }`}
                    />
                    <span className={m.done ? "line-through text-muted-foreground" : ""}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <AiInsightsCard />

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goal Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: item.color }}
                    />
                    {item.name}: {item.value}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* My Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isManagerOrAbove ? "Team Goals" : "My Goals"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentGoals.map((goal, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[160px]">
                      {goal.title}
                    </span>
                    <Badge
                      variant={goal.status === "At Risk" ? "destructive" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {goal.status}
                    </Badge>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">
                    {goal.progress}% complete
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
