"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles, Loader2, Wand2, Plus, Trash2, AlertCircle,
  CheckCircle2, Lock, Send, PenLine,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

const goalSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  thrustArea: z.string().min(2, "Thrust area is required"),
  uomType: z.string().min(2, "UOM is required"),
  target: z.string().min(1, "Target is required"),
  weightage: z.coerce.number().min(10, "Minimum 10%").max(100, "Maximum 100%"),
})

type GoalForm = z.infer<typeof goalSchema>

type GoalStatus = "draft" | "submitted" | "approved" | "returned"

type Goal = GoalForm & {
  id: string
  status: GoalStatus
  actual?: string
  progressStatus?: "On Track" | "At Risk" | "Completed"
  managerComment?: string
}

const THRUST_AREAS = [
  "Revenue Growth", "Customer Satisfaction", "Operational Efficiency",
  "People Development", "Innovation", "Quality",
]
const UOM_TYPES = ["Percentage", "Number", "Score", "Currency", "Time", "Boolean"]

const STATUS_COLORS: Record<GoalStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  returned: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export function EmployeeGoalsView() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [aiIdea, setAiIdea] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiTyped, setAiTyped] = useState("")
  const [showAiInput, setShowAiInput] = useState(false)

  const totalWeightage = goals.filter(g => g.status === "draft").reduce((s, g) => s + g.weightage, 0)
  const draftGoals = goals.filter(g => g.status === "draft")
  const lockedGoals = goals.filter(g => g.status !== "draft")
  const weightageOk = totalWeightage === 100 || draftGoals.length === 0

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<GoalForm>({ resolver: zodResolver(goalSchema) })

  const currentWeightage = watch("weightage") || 0

  async function handleAiGenerate() {
    if (!aiIdea.trim()) { toast.error("Please describe your goal idea first."); return }
    setIsGenerating(true); setAiTyped("")
    try {
      const res = await fetch("/api/ai/generate-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: aiIdea, thrustAreas: THRUST_AREAS }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const g = data.goal
      setValue("title", g.title || "")
      setValue("description", g.description || "")
      setValue("thrustArea", g.thrustArea || "")
      setValue("uomType", g.uomType || "")
      setValue("target", String(g.target || ""))
      setValue("weightage", g.weightage || 20)
      const desc: string = g.description || ""
      let i = 0
      const interval = setInterval(() => { i++; setAiTyped(desc.slice(0, i)); if (i >= desc.length) clearInterval(interval) }, 12)
      setShowForm(true); setShowAiInput(false)
      toast.success("✨ AI has drafted your goal!")
    } catch {
      toast.error("AI generation failed. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  function onSubmit(data: GoalForm) {
    if (draftGoals.length >= 8) { toast.error("Maximum 8 goals allowed."); return }
    setGoals(prev => [...prev, { ...data, id: Date.now().toString(), status: "draft" }])
    reset(); setAiTyped(""); setShowForm(false)
    toast.success("Goal added!")
  }

  function removeGoal(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  function updateActual(id: string, actual: string) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, actual } : g))
  }

  function updateProgressStatus(id: string, progressStatus: Goal["progressStatus"]) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progressStatus } : g))
  }

  async function handleSubmitAll() {
    if (draftGoals.length === 0) { toast.error("No draft goals to submit."); return }
    if (totalWeightage !== 100) { toast.error("Total weightage must equal 100%."); return }
    setIsSaving(true)
    setTimeout(() => {
      setGoals(prev => prev.map(g => g.status === "draft" ? { ...g, status: "submitted" } : g))
      setIsSaving(false)
      toast.success("🎉 Goals submitted for approval!")
    }, 1200)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Goals</h2>
          <p className="text-muted-foreground">Draft, manage, and track your quarterly performance goals.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="group border-primary/30 hover:border-primary/60"
            onClick={() => { setShowAiInput(v => !v); setShowForm(false) }}>
            <Sparkles className="mr-2 h-4 w-4 text-primary group-hover:animate-pulse" /> AI Draft
          </Button>
          <Button onClick={() => { setShowForm(v => !v); setShowAiInput(false) }}>
            <Plus className="mr-2 h-4 w-4" /> Add Goal
          </Button>
        </div>
      </div>

      {/* Weightage bar (draft goals only) */}
      {draftGoals.length > 0 && (
        <Card className={`border-2 ${totalWeightage === 100 ? "border-green-500/40 bg-green-50/20 dark:bg-green-950/10" : totalWeightage > 100 ? "border-destructive/40" : "border-border"}`}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {totalWeightage === 100 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                <span className="font-medium text-sm">Draft Weightage</span>
              </div>
              <span className={`text-sm font-bold ${totalWeightage === 100 ? "text-green-600" : totalWeightage > 100 ? "text-destructive" : "text-amber-500"}`}>
                {totalWeightage}% / 100%
              </span>
            </div>
            <Progress value={Math.min(totalWeightage, 100)} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* AI Input */}
      <AnimatePresence>
        {showAiInput && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Goal Drafter</CardTitle>
                <CardDescription>Describe your goal idea and AI will create a SMART goal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input placeholder="e.g. Improve customer support response times..." value={aiIdea}
                    onChange={e => setAiIdea(e.target.value)} className="flex-1"
                    onKeyDown={e => e.key === "Enter" && handleAiGenerate()} />
                  <Button onClick={handleAiGenerate} disabled={isGenerating} className="min-w-[120px]">
                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Drafting…</> : <><Wand2 className="mr-2 h-4 w-4" />Generate</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {aiTyped ? <><Sparkles className="h-5 w-5 text-primary" />AI Drafted Goal</> : <><PenLine className="h-5 w-5" />New Goal</>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="title">Goal Title *</Label>
                    <Input id="title" placeholder="e.g. Reduce SLA to under 4 hours" {...register("title")} />
                    {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea id="description" className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="How will success be measured?" {...register("description")} />
                    {aiTyped && <p className="text-xs text-primary/70 italic">✨ AI: {aiTyped}</p>}
                    {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Thrust Area *</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register("thrustArea")}>
                      <option value="">Select…</option>
                      {THRUST_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    {errors.thrustArea && <p className="text-xs text-destructive">{errors.thrustArea.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Unit of Measurement *</Label>
                    <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register("uomType")}>
                      <option value="">Select…</option>
                      {UOM_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    {errors.uomType && <p className="text-xs text-destructive">{errors.uomType.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target">Target Value *</Label>
                    <Input id="target" placeholder="e.g. 95" {...register("target")} />
                    {errors.target && <p className="text-xs text-destructive">{errors.target.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightage">Weightage (%) *</Label>
                    <Input id="weightage" type="number" min={10} max={100} {...register("weightage")} />
                    {currentWeightage > 0 && <p className="text-xs text-muted-foreground">Remaining: {Math.max(0, 100 - totalWeightage - Number(currentWeightage))}%</p>}
                    {errors.weightage && <p className="text-xs text-destructive">{errors.weightage.message}</p>}
                  </div>
                  <div className="md:col-span-2 flex gap-3 pt-2">
                    <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add Goal</Button>
                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); reset(); setAiTyped("") }}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {goals.length === 0 && !showForm && !showAiInput && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold">No goals yet</p>
            <p className="text-muted-foreground text-sm">Use "AI Draft" to generate instantly, or "Add Goal" to create manually.</p>
          </div>
        </div>
      )}

      {/* Draft goals */}
      {draftGoals.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Draft Goals</p>
          <AnimatePresence>
            {draftGoals.map((goal, i) => (
              <motion.div key={goal.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{goal.title}</h3>
                          <Badge variant="secondary">{goal.thrustArea}</Badge>
                          <Badge variant="outline">{goal.uomType}</Badge>
                          <Badge className="bg-primary/10 text-primary border-primary/20">{goal.weightage}%</Badge>
                          <Badge className={STATUS_COLORS[goal.status]}>Draft</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                        <p className="text-xs text-muted-foreground">Target: <span className="font-medium text-foreground">{goal.target}</span></p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeGoal(goal.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <div className="mr-auto text-sm">
              <span className="font-medium">{draftGoals.length} draft goal{draftGoals.length > 1 ? "s" : ""}</span>
              <span className="text-muted-foreground ml-2">· {totalWeightage}% total weightage</span>
            </div>
            <Button variant="outline" onClick={() => { setGoals(prev => prev.filter(g => g.status !== "draft")); toast.info("Drafts cleared.") }}>Clear Drafts</Button>
            <Button onClick={handleSubmitAll} disabled={totalWeightage !== 100 || isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting…</> : <><Send className="mr-2 h-4 w-4" />Submit for Approval</>}
            </Button>
          </div>
        </div>
      )}

      {/* Locked / submitted goals */}
      {lockedGoals.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Submitted Goals</p>
          {lockedGoals.map(goal => (
            <Card key={goal.id} className="border-border/60 opacity-90">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Lock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{goal.title}</h3>
                      <Badge variant="secondary">{goal.thrustArea}</Badge>
                      <Badge className={STATUS_COLORS[goal.status]} style={{ textTransform: "capitalize" }}>{goal.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                    {goal.managerComment && (
                      <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm">
                        <span className="font-medium text-amber-700 dark:text-amber-400">Manager feedback: </span>
                        <span className="text-amber-800 dark:text-amber-300">{goal.managerComment}</span>
                      </div>
                    )}
                    {goal.status === "approved" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <Label className="text-xs">Actual Achievement ({goal.uomType})</Label>
                          <Input placeholder={`Target: ${goal.target}`} value={goal.actual || ""}
                            onChange={e => updateActual(goal.id, e.target.value)} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Progress Status</Label>
                          <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={goal.progressStatus || ""} onChange={e => updateProgressStatus(goal.id, e.target.value as Goal["progressStatus"])}>
                            <option value="">Select status…</option>
                            <option>On Track</option>
                            <option>At Risk</option>
                            <option>Completed</option>
                          </select>
                        </div>
                      </div>
                    )}
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
