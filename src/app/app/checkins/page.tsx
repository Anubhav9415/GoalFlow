"use client"

import { useEffect, useState } from "react"
import { getSession, UserRole } from "@/lib/auth"
import { ClipboardCheck, Star, Save, CheckCircle2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface CheckinGoal {
  id: string
  title: string
  thrustArea: string
  target: string
  uomType: string
  weightage: number
  actual: string
  progressStatus: string
  selfNote: string
  saved: boolean
}

const MY_GOALS: CheckinGoal[] = [
  { id: "g1", title: "Reduce SLA to 4 hrs", thrustArea: "Customer Satisfaction", target: "4", uomType: "Time (hrs)", weightage: 30, actual: "", progressStatus: "", selfNote: "", saved: false },
  { id: "g2", title: "95% CSAT Score", thrustArea: "Customer Satisfaction", target: "95", uomType: "Percentage", weightage: 30, actual: "", progressStatus: "", selfNote: "", saved: false },
  { id: "g3", title: "Complete AWS Certification", thrustArea: "People Development", target: "1", uomType: "Boolean", weightage: 40, actual: "", progressStatus: "", selfNote: "", saved: false },
]

interface TeamCheckin {
  id: string
  employee: string
  initials: string
  department: string
  goalTitle: string
  target: string
  uomType: string
  actual: string
  progressStatus: string
  selfNote: string
  managerRating: number
  managerFeedback: string
  done: boolean
}

const TEAM_CHECKINS: TeamCheckin[] = [
  { id: "t1", employee: "Ravi Kumar", initials: "RK", department: "Engineering", goalTitle: "Reduce SLA to 4 hrs", target: "4", uomType: "hrs", actual: "5.2", progressStatus: "At Risk", selfNote: "Ticket volume increased. Plan to add 2 agents next quarter.", managerRating: 0, managerFeedback: "", done: false },
  { id: "t2", employee: "Ravi Kumar", initials: "RK", department: "Engineering", goalTitle: "95% CSAT Score", target: "95%", uomType: "Percentage", actual: "89", progressStatus: "At Risk", selfNote: "CSAT dipped due to backlog. Implementing auto-acknowledgements.", managerRating: 0, managerFeedback: "", done: false },
  { id: "t3", employee: "Anita Patel", initials: "AP", department: "Design", goalTitle: "Launch Design System v2", target: "Done", uomType: "Boolean", actual: "75% complete", progressStatus: "On Track", selfNote: "Dark mode components ready. Publishing by end of month.", managerRating: 0, managerFeedback: "", done: false },
  { id: "t4", employee: "Carlos Mendes", initials: "CM", department: "Engineering", goalTitle: "Code Review Coverage 90%", target: "90%", uomType: "Percentage", actual: "88", progressStatus: "On Track", selfNote: "Close to target, 2 teams still onboarding.", managerRating: 0, managerFeedback: "", done: true },
]

const STATUS_COLORS: Record<string, string> = {
  "On Track": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "At Risk": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Completed": "bg-primary/10 text-primary",
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`h-6 w-6 transition-colors ${n <= value ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-300"}`}>
          <Star className="h-5 w-5 fill-current" />
        </button>
      ))}
    </div>
  )
}

function EmployeeCheckinView() {
  const [goals, setGoals] = useState<CheckinGoal[]>(MY_GOALS)

  function update(id: string, field: keyof CheckinGoal, value: string) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  function save(id: string) {
    const g = goals.find(g => g.id === id)
    if (!g?.actual || !g?.progressStatus) { toast.error("Please fill in actual value and progress status."); return }
    setGoals(prev => prev.map(g => g.id === id ? { ...g, saved: true } : g))
    toast.success("Check-in saved!")
  }

  const savedCount = goals.filter(g => g.saved).length
  const progress = Math.round((savedCount / goals.length) * 100)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Check-ins</h2>
        <p className="text-muted-foreground">Log your quarterly achievement and self-assessment for each goal.</p>
      </div>

      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex justify-between mb-2 text-sm">
            <span className="font-medium">Check-in Progress</span>
            <span className="font-bold text-primary">{savedCount}/{goals.length} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {goals.map(goal => (
          <Card key={goal.id} className={`transition-colors ${goal.saved ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10" : "hover:border-primary/30"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  {goal.saved && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {goal.title}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{goal.thrustArea}</Badge>
                  <Badge variant="outline">{goal.weightage}%</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Target: <span className="font-medium text-foreground">{goal.target} {goal.uomType}</span></p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!goal.saved ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Actual Achievement *</label>
                      <Input placeholder={`Enter actual ${goal.uomType}`} value={goal.actual} onChange={e => update(goal.id, "actual", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Progress Status *</label>
                      <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={goal.progressStatus} onChange={e => update(goal.id, "progressStatus", e.target.value)}>
                        <option value="">Select status…</option>
                        <option>On Track</option>
                        <option>At Risk</option>
                        <option>Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1"><MessageSquare className="h-3 w-3" />Self-Assessment Note</label>
                    <textarea className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Describe your progress, challenges, and next steps…"
                      value={goal.selfNote} onChange={e => update(goal.id, "selfNote", e.target.value)} />
                  </div>
                  <Button size="sm" onClick={() => save(goal.id)}>
                    <Save className="mr-2 h-3.5 w-3.5" />Save Check-in
                  </Button>
                </>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex gap-4 flex-wrap">
                    <span>Actual: <strong>{goal.actual} {goal.uomType}</strong></span>
                    <Badge className={STATUS_COLORS[goal.progressStatus] || ""}>{goal.progressStatus}</Badge>
                  </div>
                  {goal.selfNote && <p className="text-muted-foreground italic">"{goal.selfNote}"</p>}
                  <Button size="sm" variant="outline" onClick={() => setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, saved: false } : g))}>Edit</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ManagerCheckinView() {
  const [checkins, setCheckins] = useState<TeamCheckin[]>(TEAM_CHECKINS)
  const [expanded, setExpanded] = useState<string | null>(null)

  function setRating(id: string, rating: number) {
    setCheckins(prev => prev.map(c => c.id === id ? { ...c, managerRating: rating } : c))
  }

  function setFeedback(id: string, feedback: string) {
    setCheckins(prev => prev.map(c => c.id === id ? { ...c, managerFeedback: feedback } : c))
  }

  function markDone(id: string) {
    const c = checkins.find(c => c.id === id)
    if (!c?.managerRating) { toast.error("Please rate the employee before marking complete."); return }
    setCheckins(prev => prev.map(c => c.id === id ? { ...c, done: true } : c))
    toast.success("Check-in review completed!")
    setExpanded(null)
  }

  const pending = checkins.filter(c => !c.done)
  const done = checkins.filter(c => c.done)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Check-ins</h2>
          <p className="text-muted-foreground">Review quarterly achievements and provide feedback for your team.</p>
        </div>
        <div className="text-sm text-muted-foreground">{pending.length} pending · {done.length} completed</div>
      </div>

      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex justify-between mb-2 text-sm">
            <span className="font-medium">Review Progress</span>
            <span className="font-bold text-primary">{done.length}/{checkins.length}</span>
          </div>
          <Progress value={Math.round((done.length / checkins.length) * 100)} className="h-2" />
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending Reviews</p>
          {pending.map(item => (
            <Card key={item.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">{item.initials}</div>
                    <div>
                      <p className="font-semibold">{item.goalTitle}</p>
                      <p className="text-sm text-muted-foreground">{item.employee} · {item.department}</p>
                      <div className="flex gap-3 mt-1 text-sm flex-wrap">
                        <span>Target: <strong>{item.target} {item.uomType}</strong></span>
                        <span>Actual: <strong>{item.actual}</strong></span>
                        <Badge className={STATUS_COLORS[item.progressStatus] || ""}>{item.progressStatus}</Badge>
                      </div>
                      {item.selfNote && <p className="text-xs text-muted-foreground mt-1 italic">"{item.selfNote}"</p>}
                    </div>
                  </div>
                  <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                    {expanded === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {expanded === item.id && (
                  <div className="mt-4 border-t border-border pt-4 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Rating</label>
                      <StarRating value={item.managerRating} onChange={v => setRating(item.id, v)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1"><MessageSquare className="h-3 w-3" />Manager Feedback</label>
                      <textarea className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Provide constructive feedback…"
                        value={item.managerFeedback} onChange={e => setFeedback(item.id, e.target.value)} />
                    </div>
                    <Button size="sm" onClick={() => markDone(item.id)}>
                      <ClipboardCheck className="mr-2 h-3.5 w-3.5" />Mark Review Complete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed Reviews</p>
          {done.map(item => (
            <Card key={item.id} className="opacity-80">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{item.goalTitle} — {item.employee}</p>
                    <div className="flex gap-2 mt-0.5">
                      {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`h-3.5 w-3.5 ${n <= item.managerRating ? "text-amber-400 fill-current" : "text-muted-foreground/20"}`} />)}
                    </div>
                    {item.managerFeedback && <p className="text-xs text-muted-foreground italic mt-1">"{item.managerFeedback}"</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CheckinsPage() {
  const [role, setRole] = useState<UserRole>("employee")

  useEffect(() => {
    const s = getSession()
    if (s) setRole(s.role)
  }, [])

  if (role === "manager" || role === "admin" || role === "hr") return <ManagerCheckinView />
  return <EmployeeCheckinView />
}
