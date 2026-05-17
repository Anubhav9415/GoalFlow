"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, MessageSquare, ChevronDown, ChevronUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

type GoalStatus = "pending" | "approved" | "returned"

interface TeamGoal {
  id: string
  employeeName: string
  employeeInitials: string
  department: string
  title: string
  description: string
  thrustArea: string
  uomType: string
  target: string
  weightage: number
  status: GoalStatus
  comment: string
}

const MOCK_TEAM_GOALS: TeamGoal[] = [
  { id: "1", employeeName: "Ravi Kumar", employeeInitials: "RK", department: "Engineering", title: "Reduce SLA to 4 hrs", description: "Improve customer support resolution time by streamlining ticketing workflows.", thrustArea: "Customer Satisfaction", uomType: "Time", target: "4 hours", weightage: 30, status: "pending", comment: "" },
  { id: "2", employeeName: "Ravi Kumar", employeeInitials: "RK", department: "Engineering", title: "95% CSAT Score", description: "Achieve 95% customer satisfaction score across all support interactions.", thrustArea: "Customer Satisfaction", uomType: "Percentage", target: "95", weightage: 30, status: "pending", comment: "" },
  { id: "3", employeeName: "Anita Patel", employeeInitials: "AP", department: "Design", title: "Launch Design System v2", description: "Complete and publish component library v2 with dark mode support.", thrustArea: "Innovation", uomType: "Boolean", target: "Done", weightage: 40, status: "pending", comment: "" },
  { id: "4", employeeName: "Anita Patel", employeeInitials: "AP", department: "Design", title: "Reduce Design Iteration Cycles", description: "Reduce average design review rounds from 4 to 2 via better prototyping.", thrustArea: "Operational Efficiency", uomType: "Number", target: "2", weightage: 30, status: "pending", comment: "" },
  { id: "5", employeeName: "Carlos Mendes", employeeInitials: "CM", department: "Engineering", title: "Code Review Coverage 90%", description: "Ensure 90% of all PRs have at least 2 reviewers before merge.", thrustArea: "Quality", uomType: "Percentage", target: "90", weightage: 20, status: "pending", comment: "" },
]

const STATUS_STYLE: Record<GoalStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  returned: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export function ManagerGoalsView() {
  const [goals, setGoals] = useState<TeamGoal[]>(MOCK_TEAM_GOALS)
  const [expanded, setExpanded] = useState<string | null>(null)

  const pending = goals.filter(g => g.status === "pending")
  const decided = goals.filter(g => g.status !== "pending")

  function updateComment(id: string, comment: string) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, comment } : g))
  }

  function decide(id: string, status: "approved" | "returned") {
    const goal = goals.find(g => g.id === id)
    if (status === "returned" && !goal?.comment.trim()) {
      toast.error("Please add a comment before returning a goal.")
      return
    }
    setGoals(prev => prev.map(g => g.id === id ? { ...g, status } : g))
    toast.success(status === "approved" ? "✅ Goal approved!" : "↩️ Goal returned with feedback.")
    setExpanded(null)
  }

  function GroupedGoals({ items }: { items: TeamGoal[] }) {
    const byEmployee = items.reduce<Record<string, TeamGoal[]>>((acc, g) => {
      if (!acc[g.employeeName]) acc[g.employeeName] = []
      acc[g.employeeName].push(g)
      return acc
    }, {})

    return (
      <div className="space-y-6">
        {Object.entries(byEmployee).map(([name, empGoals]) => (
          <div key={name}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {empGoals[0].employeeInitials}
              </div>
              <div>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{empGoals[0].department}</p>
              </div>
              <Badge variant="outline" className="ml-auto">{empGoals.length} goal{empGoals.length > 1 ? "s" : ""}</Badge>
            </div>
            <div className="space-y-3 pl-11">
              {empGoals.map(goal => (
                <Card key={goal.id} className={`transition-colors ${goal.status === "pending" ? "hover:border-primary/30" : "opacity-80"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm">{goal.title}</h4>
                          <Badge variant="secondary" className="text-xs">{goal.thrustArea}</Badge>
                          <Badge className={`text-xs ${STATUS_STYLE[goal.status]}`}>{goal.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{goal.description}</p>
                        <p className="text-xs">Target: <span className="font-medium">{goal.target} ({goal.uomType})</span> · Weightage: <span className="font-medium">{goal.weightage}%</span></p>
                      </div>
                      {goal.status === "pending" && (
                        <button onClick={() => setExpanded(expanded === goal.id ? null : goal.id)} className="text-muted-foreground hover:text-foreground transition-colors ml-2">
                          {expanded === goal.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                    </div>

                    {expanded === goal.id && goal.status === "pending" && (
                      <div className="mt-4 space-y-3 border-t border-border pt-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium flex items-center gap-1"><MessageSquare className="h-3 w-3" />Comment / Feedback</label>
                          <textarea
                            className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Add feedback (required when returning)…"
                            value={goal.comment}
                            onChange={e => updateComment(goal.id, e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => decide(goal.id, "approved")}>
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => decide(goal.id, "returned")}>
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />Return
                          </Button>
                        </div>
                      </div>
                    )}
                    {goal.comment && goal.status !== "pending" && (
                      <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-t border-border pt-3">
                        <span className="font-medium">Your feedback: </span>{goal.comment}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const pendingPct = Math.round((decided.length / goals.length) * 100)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Goals</h2>
          <p className="text-muted-foreground">Review and approve your team's quarterly goal submissions.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{pending.length} pending · {decided.length} decided</span>
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex justify-between mb-2 text-sm">
            <span className="font-medium">Approval Progress</span>
            <span className="font-bold text-primary">{pendingPct}%</span>
          </div>
          <Progress value={pendingPct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">{decided.length} of {goals.length} goals reviewed</p>
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">⏳ Pending Approval</p>
          <GroupedGoals items={pending} />
        </div>
      )}

      {decided.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">✅ Reviewed</p>
          <GroupedGoals items={decided} />
        </div>
      )}
    </div>
  )
}
