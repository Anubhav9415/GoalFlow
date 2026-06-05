"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, XCircle, MessageSquare, ChevronDown, ChevronUp, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { fetchGoals, processApproval } from "@/services/api"
import type { Goal } from "@/types/database"

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export function ManagerGoalsView() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [decidingId, setDecidingId] = useState<string | null>(null)

  const loadGoals = useCallback(async () => {
    try {
      const data = await fetchGoals({ role: "manager" })
      // Show non-draft goals (pending, approved, rejected)
      setGoals(data.filter(g => g.status !== "draft"))
    } catch {
      toast.error("Failed to load team goals.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadGoals() }, [loadGoals])

  const pending = goals.filter(g => g.status === "pending")
  const decided = goals.filter(g => g.status !== "pending")

  function updateComment(id: string, comment: string) {
    setComments(prev => ({ ...prev, [id]: comment }))
  }

  async function decide(goalId: string, action: "approve" | "reject") {
    const comment = comments[goalId] || ""
    if (action === "reject" && !comment.trim()) {
      toast.error("Please add a comment before returning a goal.")
      return
    }
    setDecidingId(goalId)
    try {
      const updated = await processApproval({ goal_id: goalId, action, comment })
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, status: updated.status, manager_comment: updated.manager_comment } : g))
      toast.success(action === "approve" ? "✅ Goal approved!" : "↩️ Goal returned with feedback.")
      setExpanded(null)
    } catch {
      toast.error("Failed to process approval.")
    } finally {
      setDecidingId(null)
    }
  }

  function GroupedGoals({ items }: { items: Goal[] }) {
    const byEmployee = items.reduce<Record<string, Goal[]>>((acc, g) => {
      const name = g.employee?.full_name || "Unknown"
      if (!acc[name]) acc[name] = []
      acc[name].push(g)
      return acc
    }, {})

    return (
      <div className="space-y-6">
        {Object.entries(byEmployee).map(([name, empGoals]) => {
          const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
          const dept = empGoals[0].employee?.department || "—"
          return (
            <div key={name}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{dept}</p>
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
                            {goal.thrust_area && <Badge variant="secondary" className="text-xs">{goal.thrust_area}</Badge>}
                            <Badge className={`text-xs ${STATUS_STYLE[goal.status] || ""}`} style={{ textTransform: "capitalize" }}>{goal.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{goal.description}</p>
                          <p className="text-xs">Target: <span className="font-medium">{goal.target_value} ({goal.uom_type})</span> · Weightage: <span className="font-medium">{goal.weightage}%</span></p>
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
                              value={comments[goal.id] || ""}
                              onChange={e => updateComment(goal.id, e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={decidingId === goal.id} onClick={() => decide(goal.id, "approve")}>
                              {decidingId === goal.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}Approve
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" disabled={decidingId === goal.id} onClick={() => decide(goal.id, "reject")}>
                              <XCircle className="mr-1.5 h-3.5 w-3.5" />Return
                            </Button>
                          </div>
                        </div>
                      )}
                      {goal.manager_comment && goal.status !== "pending" && (
                        <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground border-t border-border pt-3">
                          <span className="font-medium">Your feedback: </span>{goal.manager_comment}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pendingPct = goals.length > 0 ? Math.round((decided.length / goals.length) * 100) : 0

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

      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl text-center space-y-4">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="text-lg font-semibold">No team goals yet</p>
            <p className="text-muted-foreground text-sm">Your team members haven't submitted any goals for review.</p>
          </div>
        </div>
      )}

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
