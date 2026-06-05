"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ClipboardCheck, Star, Save, CheckCircle2, MessageSquare,
  ChevronDown, ChevronUp, Loader2, Info, AlertCircle, HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { fetchCheckins, saveCheckin, reviewCheckin, fetchProfile } from "@/services/api"
import type { Goal, Checkin, ProgressStatus } from "@/types/database"

const STATUS_COLORS: Record<string, string> = {
  on_track: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  at_risk: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-primary/10 text-primary",
  not_started: "bg-muted text-muted-foreground",
}
const STATUS_LABELS: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  completed: "Completed",
  not_started: "Not Started Yet",
}

function getCurrentQuarter(): "Q1" | "Q2" | "Q3" | "Q4" {
  const m = new Date().getMonth()
  if (m < 3) return "Q1"
  if (m < 6) return "Q2"
  if (m < 9) return "Q3"
  return "Q4"
}

function WhatIsCheckin() {
  const [open, setOpen] = useState(false)
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setOpen(o => !o)}
        >
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <HelpCircle className="h-4 w-4" />
            What is a Check-in?
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
        </button>
        {open && (
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <p>
              A <strong className="text-foreground">Check-in</strong> is your quarterly self-assessment. Each quarter (Q1–Q4), you report how much progress you've made on each of your approved goals.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                { step: "1", title: "Report Actual", desc: "Enter what you actually achieved vs the target you set." },
                { step: "2", title: "Rate Your Progress", desc: "Pick a status: On Track, At Risk, Completed, or Not Started." },
                { step: "3", title: "Add a Note", desc: "Write a short self-assessment — challenges faced, what's next." },
              ].map(s => (
                <div key={s.step} className="flex gap-3 bg-card rounded-lg p-3 border border-border">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step}</div>
                  <div>
                    <p className="font-semibold text-foreground text-xs">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs">Your manager will then review your check-in and give a star rating + feedback.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`h-7 w-7 transition-colors ${n <= value ? "text-amber-400" : "text-muted-foreground/30 hover:text-amber-300"}`}>
          <Star className="h-5 w-5 fill-current" />
        </button>
      ))}
    </div>
  )
}

/* ─── Employee View ──────────────────────────────────────────────────────── */
function EmployeeCheckinView() {
  const [goals, setGoals] = useState<(Goal & { checkins?: Checkin[] })[]>([])
  const [formData, setFormData] = useState<Record<string, { actual: string; progressStatus: string; selfNote: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const quarter = getCurrentQuarter()

  useEffect(() => {
    fetchCheckins({ role: "employee" })
      .then((data) => {
        const goalsData = data as unknown as (Goal & { checkins?: Checkin[] })[]
        setGoals(goalsData)
        const fd: Record<string, { actual: string; progressStatus: string; selfNote: string }> = {}
        goalsData.forEach(g => {
          const existing = g.checkins?.find(c => c.quarter === quarter)
          fd[g.id] = {
            actual: existing?.actual_value || "",
            progressStatus: existing?.progress_status || "",
            selfNote: existing?.self_note || "",
          }
        })
        setFormData(fd)
      })
      .catch(() => toast.error("Failed to load goals."))
      .finally(() => setIsLoading(false))
  }, [quarter])

  function update(goalId: string, field: string, value: string) {
    setFormData(prev => ({ ...prev, [goalId]: { ...prev[goalId], [field]: value } }))
  }

  async function save(goalId: string) {
    const fd = formData[goalId]
    if (!fd?.actual || !fd?.progressStatus) {
      toast.error("Please fill in your actual achievement and progress status before saving.")
      return
    }
    setSavingId(goalId)
    try {
      await saveCheckin({
        goal_id: goalId,
        quarter,
        actual_value: fd.actual,
        progress_status: fd.progressStatus as ProgressStatus,
        self_note: fd.selfNote,
      })
      setGoals(prev => prev.map(g => {
        if (g.id !== goalId) return g
        const existingCheckins = (g.checkins || []).filter(c => c.quarter !== quarter)
        return {
          ...g,
          checkins: [...existingCheckins, {
            id: "temp",
            goal_id: goalId,
            employee_id: g.employee_id,
            quarter,
            actual_value: fd.actual,
            progress_status: (fd.progressStatus as ProgressStatus) || null,
            self_note: fd.selfNote || null,
            manager_rating: null,
            manager_feedback: null,
            is_submitted: true,
            is_reviewed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }],
        }
      }))
      toast.success("Check-in saved! Your manager will review it soon.")
    } catch {
      toast.error("Failed to save check-in. Try again.")
    } finally {
      setSavingId(null)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const savedCount = goals.filter(g => g.checkins?.some(c => c.quarter === quarter && c.is_submitted)).length
  const progress = goals.length > 0 ? Math.round((savedCount / goals.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Check-ins</h2>
        <p className="text-muted-foreground mt-1">Report your {quarter} progress for each approved goal.</p>
      </div>

      <WhatIsCheckin />

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex justify-between mb-2 text-sm">
            <span className="font-medium">{quarter} Check-in Progress</span>
            <span className="font-bold text-primary">{savedCount}/{goals.length} submitted</span>
          </div>
          <Progress value={progress} className="h-2" />
          {progress === 100 && goals.length > 0 && (
            <p className="text-xs text-emerald-600 font-medium mt-2">✓ All check-ins submitted! Your manager will review them.</p>
          )}
        </CardContent>
      </Card>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold">No approved goals yet</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You can only check in on goals that have been <strong>approved</strong> by your manager.
              Go to <strong>Goals</strong> to create and submit your goals first.
            </p>
            <Button variant="outline" onClick={() => window.location.href = "/app/goals"}>Go to Goals →</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            const existingCheckin = goal.checkins?.find(c => c.quarter === quarter)
            const isSaved = existingCheckin?.is_submitted
            const fd = formData[goal.id] || { actual: "", progressStatus: "", selfNote: "" }

            return (
              <Card key={goal.id} className={`transition-colors ${isSaved ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10" : "hover:border-primary/30"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {isSaved && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                      {goal.title}
                    </CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      {goal.thrust_area && <Badge variant="secondary">{goal.thrust_area}</Badge>}
                      <Badge variant="outline">{goal.weightage}%</Badge>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span>Target: <span className="font-medium text-foreground">{goal.target_value} {goal.uom_type}</span></span>
                    <span className="text-xs bg-primary/10 text-primary rounded px-2 py-0.5 font-medium">{quarter}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isSaved ? (
                    <>
                      <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex gap-2">
                        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary" />
                        Enter what you actually achieved this quarter. Be honest — this helps your manager review fairly.
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">
                            Actual Achievement <span className="text-destructive">*</span>
                          </label>
                          <Input
                            placeholder={`What did you actually achieve? (in ${goal.uom_type || "units"})`}
                            value={fd.actual}
                            onChange={e => update(goal.id, "actual", e.target.value)}
                          />
                          <p className="text-[11px] text-muted-foreground">Target was: {goal.target_value} {goal.uom_type}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">
                            Progress Status <span className="text-destructive">*</span>
                          </label>
                          <select
                            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={fd.progressStatus}
                            onChange={e => update(goal.id, "progressStatus", e.target.value)}
                          >
                            <option value="">How is this goal going?</option>
                            <option value="completed">✅ Completed — I hit the target</option>
                            <option value="on_track">🟢 On Track — I'll reach the target</option>
                            <option value="at_risk">🟡 At Risk — unlikely to hit the target</option>
                            <option value="not_started">⬜ Not Started Yet</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />Self-Assessment Note <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <textarea
                          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          placeholder="Explain your progress: what worked, what didn't, and what you'll do differently next quarter…"
                          value={fd.selfNote}
                          onChange={e => update(goal.id, "selfNote", e.target.value)}
                        />
                      </div>
                      <Button size="sm" onClick={() => save(goal.id)} disabled={savingId === goal.id}>
                        {savingId === goal.id ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                        Submit Check-in
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-4 flex-wrap items-center">
                        <span>Achieved: <strong>{existingCheckin?.actual_value} {goal.uom_type}</strong></span>
                        <Badge className={STATUS_COLORS[existingCheckin?.progress_status || ""] || ""}>
                          {STATUS_LABELS[existingCheckin?.progress_status || ""] || existingCheckin?.progress_status}
                        </Badge>
                        {existingCheckin?.is_reviewed
                          ? <span className="text-xs text-emerald-600 font-medium">✓ Reviewed by manager</span>
                          : <span className="text-xs text-amber-600 font-medium">⏳ Awaiting manager review</span>
                        }
                      </div>
                      {existingCheckin?.self_note && (
                        <p className="text-muted-foreground italic text-xs bg-muted/40 rounded p-2">"{existingCheckin.self_note}"</p>
                      )}
                      {existingCheckin?.is_reviewed && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-amber-700 dark:text-amber-400 text-xs">Manager Review:</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(n => (
                                <Star key={n} className={`h-3 w-3 ${n <= (existingCheckin?.manager_rating || 0) ? "text-amber-400 fill-current" : "text-muted-foreground/20"}`} />
                              ))}
                            </div>
                          </div>
                          {existingCheckin?.manager_feedback && (
                            <p className="text-xs text-amber-800 dark:text-amber-300">"{existingCheckin.manager_feedback}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Manager View ──────────────────────────────────────────────────────── */
function ManagerCheckinView() {
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchCheckins({ role: "manager" })
      setCheckins(data as Checkin[])
    } catch {
      toast.error("Failed to load team check-ins.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function markDone(checkinId: string) {
    const rating = ratings[checkinId]
    if (!rating) { toast.error("Please rate the employee (1–5 stars) before completing the review."); return }
    setReviewingId(checkinId)
    try {
      await reviewCheckin({ checkin_id: checkinId, manager_rating: rating, manager_feedback: feedbacks[checkinId] })
      setCheckins(prev => prev.map(c => c.id === checkinId
        ? { ...c, is_reviewed: true, manager_rating: rating, manager_feedback: feedbacks[checkinId] || null }
        : c
      ))
      toast.success("Review submitted! Employee will be notified.")
      setExpanded(null)
    } catch {
      toast.error("Failed to submit review.")
    } finally {
      setReviewingId(null)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const pending = checkins.filter(c => !c.is_reviewed)
  const done = checkins.filter(c => c.is_reviewed)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Check-ins</h2>
          <p className="text-muted-foreground mt-1">Review your team's quarterly submissions and provide feedback.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">{pending.length} pending</span>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">{done.length} reviewed</span>
        </div>
      </div>

      {/* Explanation for manager */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-3 text-sm">
            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              Each card below is a <strong className="text-foreground">check-in</strong> submitted by one of your team members. Expand it to see their self-assessment, give a star rating, and add written feedback. The employee will see your review in their check-ins.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex justify-between mb-2 text-sm">
            <span className="font-medium">Review Progress</span>
            <span className="font-bold text-primary">{done.length}/{checkins.length} reviewed</span>
          </div>
          <Progress value={checkins.length > 0 ? Math.round((done.length / checkins.length) * 100) : 0} className="h-2" />
        </CardContent>
      </Card>

      {checkins.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="font-semibold">No check-ins submitted yet</p>
            <p className="text-sm text-muted-foreground">Your team members haven't submitted their quarterly check-ins yet.</p>
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending Reviews</p>
          {pending.map(item => {
            const name = item.employee?.full_name || "Team Member"
            const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
            return (
              <Card key={item.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">{initials}</div>
                      <div>
                        <p className="font-semibold">{item.goal?.title || "Goal"}</p>
                        <p className="text-sm text-muted-foreground">{name} · {item.employee?.department || "—"}</p>
                        <div className="flex gap-3 mt-2 text-sm flex-wrap items-center">
                          <span>Target: <strong>{item.goal?.target_value} {item.goal?.uom_type}</strong></span>
                          <span>Actual: <strong>{item.actual_value || "—"}</strong></span>
                          <Badge className={STATUS_COLORS[item.progress_status || ""] || ""}>
                            {STATUS_LABELS[item.progress_status || ""] || item.progress_status || "Not set"}
                          </Badge>
                        </div>
                        {item.self_note && (
                          <p className="text-xs text-muted-foreground mt-2 italic bg-muted/40 rounded p-2 max-w-md">"{item.self_note}"</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 flex items-center gap-1 text-xs"
                    >
                      {expanded === item.id ? <><ChevronUp className="h-4 w-4" /> Close</> : <><ChevronDown className="h-4 w-4" /> Review</>}
                    </button>
                  </div>

                  {expanded === item.id && (
                    <div className="mt-4 border-t border-border pt-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Your Rating <span className="text-destructive">*</span></label>
                        <StarRating value={ratings[item.id] || 0} onChange={v => setRatings(prev => ({ ...prev, [item.id]: v }))} />
                        <p className="text-[11px] text-muted-foreground">
                          {["", "Needs major improvement", "Below expectations", "Meets expectations", "Above expectations", "Exceptional performance"][ratings[item.id] || 0]}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium flex items-center gap-1"><MessageSquare className="h-3 w-3" />Feedback <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <textarea
                          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          placeholder="Write constructive feedback for this employee…"
                          value={feedbacks[item.id] || ""}
                          onChange={e => setFeedbacks(prev => ({ ...prev, [item.id]: e.target.value }))}
                        />
                      </div>
                      <Button size="sm" onClick={() => markDone(item.id)} disabled={reviewingId === item.id}>
                        {reviewingId === item.id
                          ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Submitting…</>
                          : <><ClipboardCheck className="mr-2 h-3.5 w-3.5" />Submit Review</>
                        }
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Reviewed</p>
          {done.map(item => (
            <Card key={item.id} className="opacity-80">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.goal?.title || "Goal"} — {item.employee?.full_name}</p>
                    <div className="flex gap-2 mt-1 items-center">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className={`h-3 w-3 ${n <= (item.manager_rating || 0) ? "text-amber-400 fill-current" : "text-muted-foreground/20"}`} />
                      ))}
                      {item.manager_feedback && (
                        <span className="text-xs text-muted-foreground ml-2 italic truncate">"{item.manager_feedback}"</span>
                      )}
                    </div>
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

/* ─── Page Router ────────────────────────────────────────────────────────── */
export default function CheckinsPage() {
  const [role, setRole] = useState<string>("employee")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
      .then(p => setRole(p.role))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (["manager", "admin", "hr"].includes(role)) return <ManagerCheckinView />
  return <EmployeeCheckinView />
}
