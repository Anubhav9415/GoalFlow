"use client"

import { useEffect, useState } from "react"
import { getSession, UserRole } from "@/lib/auth"
import {
  CheckCircle2, XCircle, Clock, MessageSquare,
  ChevronDown, ChevronUp, ShieldCheck, History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

type ApprovalStatus = "pending" | "approved" | "returned"

interface Approval {
  id: string
  employeeName: string
  employeeInitials: string
  department: string
  goalTitle: string
  thrustArea: string
  weightage: number
  target: string
  submittedAt: string
  status: ApprovalStatus
  comment: string
  decidedAt?: string
}

const MOCK_APPROVALS: Approval[] = [
  { id: "a1", employeeName: "Ravi Kumar", employeeInitials: "RK", department: "Engineering", goalTitle: "Reduce SLA to 4 hrs", thrustArea: "Customer Satisfaction", weightage: 30, target: "4 hours", submittedAt: "2026-05-15", status: "pending", comment: "" },
  { id: "a2", employeeName: "Anita Patel", employeeInitials: "AP", department: "Design", goalTitle: "Launch Design System v2", thrustArea: "Innovation", weightage: 40, target: "Done", submittedAt: "2026-05-14", status: "pending", comment: "" },
  { id: "a3", employeeName: "Carlos Mendes", employeeInitials: "CM", department: "Engineering", goalTitle: "Code Review Coverage 90%", thrustArea: "Quality", weightage: 20, target: "90%", submittedAt: "2026-05-13", status: "approved", comment: "Solid goal, well-defined metrics.", decidedAt: "2026-05-14" },
  { id: "a4", employeeName: "Meena Raj", employeeInitials: "MR", department: "Sales", goalTitle: "Close 50 Enterprise Deals", thrustArea: "Revenue Growth", weightage: 50, target: "50 deals", submittedAt: "2026-05-12", status: "returned", comment: "Please refine success criteria — specify deal value threshold.", decidedAt: "2026-05-13" },
]

// Employee's own submission status (mock for employee view)
const MY_SUBMISSIONS = [
  { goalTitle: "Improve API Response Time", status: "approved" as ApprovalStatus, submittedAt: "2026-05-10", decidedAt: "2026-05-11", comment: "Great goal, approved!" },
  { goalTitle: "Complete AWS Certification", status: "pending" as ApprovalStatus, submittedAt: "2026-05-15", comment: "" },
]

const STATUS_STYLE: Record<ApprovalStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  returned: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

function ManagerApprovalsView() {
  const [approvals, setApprovals] = useState<Approval[]>(MOCK_APPROVALS)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab] = useState<"pending" | "history">("pending")

  const pending = approvals.filter(a => a.status === "pending")
  const history = approvals.filter(a => a.status !== "pending")

  function updateComment(id: string, comment: string) {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, comment } : a))
  }

  function decide(id: string, status: "approved" | "returned") {
    const item = approvals.find(a => a.id === id)
    if (status === "returned" && !item?.comment.trim()) {
      toast.error("Please add a comment before returning."); return
    }
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status, decidedAt: new Date().toISOString().slice(0, 10) } : a))
    toast.success(status === "approved" ? "✅ Goal approved!" : "↩️ Goal returned with feedback.")
    setExpanded(null)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Approvals</h2>
          <p className="text-muted-foreground">Review and action your team's goal submissions.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-amber-500" />
          <span>{pending.length} pending</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", value: pending.length, color: "text-amber-600" },
          { label: "Approved", value: history.filter(a => a.status === "approved").length, color: "text-emerald-600" },
          { label: "Returned", value: history.filter(a => a.status === "returned").length, color: "text-red-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["pending", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t === "pending" ? <><Clock className="inline mr-1.5 h-3.5 w-3.5" />Pending ({pending.length})</> : <><History className="inline mr-1.5 h-3.5 w-3.5" />History ({history.length})</>}
          </button>
        ))}
      </div>

      {/* Pending list */}
      {tab === "pending" && (
        <div className="space-y-4">
          {pending.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="font-semibold">All caught up!</p>
              <p className="text-sm text-muted-foreground">No pending approvals.</p>
            </div>
          )}
          {pending.map(item => (
            <Card key={item.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                      {item.employeeInitials}
                    </div>
                    <div>
                      <p className="font-semibold">{item.goalTitle}</p>
                      <p className="text-sm text-muted-foreground">{item.employeeName} · {item.department}</p>
                      <div className="flex gap-2 flex-wrap mt-1">
                        <Badge variant="secondary" className="text-xs">{item.thrustArea}</Badge>
                        <Badge variant="outline" className="text-xs">{item.weightage}% weight</Badge>
                        <span className="text-xs text-muted-foreground">Target: {item.target}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Submitted {item.submittedAt}</p>
                    </div>
                  </div>
                  <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors ml-2 flex-shrink-0">
                    {expanded === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {expanded === item.id && (
                  <div className="mt-4 border-t border-border pt-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1"><MessageSquare className="h-3 w-3" />Feedback / Comment</label>
                      <textarea className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Required when returning a goal…" value={item.comment} onChange={e => updateComment(item.id, e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => decide(item.id, "approved")}>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => decide(item.id, "returned")}>
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />Return
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div className="space-y-3">
          {history.map(item => (
            <Card key={item.id} className="opacity-90">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {item.employeeInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{item.goalTitle}</p>
                      <Badge className={`text-xs ${STATUS_STYLE[item.status]}`}>{item.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.employeeName} · Decided {item.decidedAt}</p>
                    {item.comment && <p className="text-xs mt-1 text-muted-foreground italic">"{item.comment}"</p>}
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

function EmployeeApprovalsView() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Submissions</h2>
        <p className="text-muted-foreground">Track the approval status of your submitted goals.</p>
      </div>
      <div className="space-y-4">
        {MY_SUBMISSIONS.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold">{item.goalTitle}</p>
                  <p className="text-xs text-muted-foreground">Submitted {item.submittedAt}</p>
                </div>
                <Badge className={`text-sm px-3 py-1 ${STATUS_STYLE[item.status]}`}>{item.status}</Badge>
              </div>
              {item.comment && (
                <div className="mt-3 rounded-md bg-muted/50 border border-border p-3 text-sm">
                  <span className="font-medium">Manager feedback: </span>
                  <span className="text-muted-foreground">{item.comment}</span>
                </div>
              )}
              {item.status === "pending" && (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>Awaiting manager review</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const [role, setRole] = useState<UserRole>("employee")

  useEffect(() => {
    const s = getSession()
    if (s) setRole(s.role)
  }, [])

  if (role === "manager" || role === "admin" || role === "hr") return <ManagerApprovalsView />
  return <EmployeeApprovalsView />
}
