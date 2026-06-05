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
  Loader2,
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
import { ROLE_CONFIG } from "@/lib/auth"
import { fetchDashboard } from "@/services/api"
import type { Profile, Goal, DashboardStats, TeamStats } from "@/types/database"

// ─── Role-specific KPI config ─────────────────────────────────────────────────
const roleIcons = {
  employee: { StatIcon: Target, statColor: "text-primary" },
  manager: { StatIcon: Users, statColor: "text-emerald-500" },
  admin: { StatIcon: ShieldCheck, statColor: "text-red-500" },
  hr: { StatIcon: Briefcase, statColor: "text-amber-500" },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<DashboardStats | TeamStats | null>(null)
  const [recentGoals, setRecentGoals] = useState<Goal[]>([])
  const [quarterlyProgress, setQuarterlyProgress] = useState<Array<{ quarter: string; progress: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
      .then((data) => {
        setProfile(data.profile)
        setStats(data.stats)
        setRecentGoals(data.recentGoals)
        setQuarterlyProgress(data.quarterlyProgress ?? [])
      })
      .catch(() => {
        // Fallback — profile not found yet (first login)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const role = (profile?.role ?? "employee") as keyof typeof roleIcons
  const roleCfg = ROLE_CONFIG[role]
  const icons = roleIcons[role]
  const firstName = profile?.full_name?.split(" ")[0] ?? "there"
  const isManagerOrAbove = ["manager", "admin", "hr"].includes(role)

  // Build KPI values from real data
  const dashStats = stats as DashboardStats | undefined
  const teamStats = stats as TeamStats | undefined

  const primaryStat = isManagerOrAbove
    ? { label: role === "manager" ? "Team Members" : "Org-Wide Goals", value: teamStats?.team_members ?? 0, note: "Active this cycle" }
    : { label: "My Goals", value: dashStats?.total_goals ?? 0, note: `${dashStats?.approved_goals ?? 0} approved` }

  const progressValue = isManagerOrAbove
    ? (teamStats?.team_avg_progress ?? 0)
    : (dashStats?.avg_progress ?? 0)

  const pendingValue = isManagerOrAbove
    ? { label: "Pending Approvals", value: teamStats?.pending_approvals ?? 0, note: "Awaiting your review" }
    : { label: "Pending Check-ins", value: dashStats?.pending_checkins ?? 0, note: "Due this quarter" }

  // Chart data from real goals
  const statusCounts = { approved: 0, pending: 0, draft: 0, rejected: 0 }
  recentGoals.forEach(g => { if (g.status in statusCounts) statusCounts[g.status as keyof typeof statusCounts]++ })
  const pieData = [
    { name: "Approved", value: statusCounts.approved, color: "#10B981" },
    { name: "Pending", value: statusCounts.pending, color: "#F59E0B" },
    { name: "Draft", value: statusCounts.draft, color: "#6366F1" },
    { name: "Rejected", value: statusCounts.rejected, color: "#EF4444" },
  ].filter(d => d.value > 0)

  // Use real quarterly progress, fallback to zeros if empty
  const lineData = quarterlyProgress.length > 0
    ? quarterlyProgress
    : [{ quarter: "Q1", progress: 0 }, { quarter: "Q2", progress: 0 }, { quarter: "Q3", progress: 0 }, { quarter: "Q4", progress: 0 }]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back,{" "}
            <span className="font-semibold text-foreground">{firstName}</span>.
            Here's your performance overview.
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
            <CardTitle className="text-sm font-medium">{primaryStat.label}</CardTitle>
            <icons.StatIcon className={`h-4 w-4 ${icons.statColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{primaryStat.value}</div>
            <p className="text-xs text-muted-foreground">{primaryStat.note}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressValue}%</div>
            <Progress value={progressValue} className="h-1.5 mt-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{pendingValue.label}</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingValue.value}</div>
            <p className="text-xs text-muted-foreground">{pendingValue.note}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Check-in</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const now = new Date()
                const endOfQuarter = new Date(now.getFullYear(), Math.ceil((now.getMonth() + 1) / 3) * 3, 0)
                const daysLeft = Math.max(0, Math.ceil((endOfQuarter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                return `${daysLeft}d`
              })()}
            </div>
            <p className="text-xs text-muted-foreground">End of quarter</p>
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
                {recentGoals.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={(() => {
                        const deptMap: Record<string, { total: number; approved: number }> = {}
                        recentGoals.forEach(g => {
                          const dept = g.employee?.department || "Other"
                          if (!deptMap[dept]) deptMap[dept] = { total: 0, approved: 0 }
                          deptMap[dept].total++
                          if (g.status === "approved") deptMap[dept].approved++
                        })
                        return Object.entries(deptMap).map(([name, d]) => ({
                          name,
                          completion: d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0,
                        }))
                      })()}
                      layout="vertical"
                    >
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
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No team goals data yet.</p>
                )}
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
                  { label: "Set up goals for this cycle", done: (dashStats?.total_goals ?? 0) > 0 },
                  { label: "Submit goals for approval", done: (dashStats?.pending_goals ?? 0) > 0 || (dashStats?.approved_goals ?? 0) > 0 },
                  { label: "Get goals approved", done: (dashStats?.approved_goals ?? 0) > 0 },
                  { label: "Complete quarterly check-in", done: (dashStats?.avg_progress ?? 0) > 0 },
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
              {pieData.length > 0 ? (
                <>
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
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No goals yet. Create your first goal!</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isManagerOrAbove ? "Team Goals" : "My Goals"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentGoals.length > 0 ? (
                recentGoals.slice(0, 5).map((goal) => (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate max-w-[160px]">
                        {goal.title}
                      </span>
                      <Badge
                        variant={goal.status === "rejected" ? "destructive" : "secondary"}
                        className="text-xs shrink-0 capitalize"
                      >
                        {goal.status}
                      </Badge>
                    </div>
                    <Progress value={goal.weightage} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">
                      Weightage: {goal.weightage}%
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No goals yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
