"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Loader2, RefreshCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const MOCK_GOALS = [
  { title: "Reduce SLA response time to under 4 hours", status: "On Track", progress: 72, weightage: 30 },
  { title: "Achieve 95% customer satisfaction score", status: "At Risk", progress: 45, weightage: 25 },
  { title: "Complete product certification training", status: "On Track", progress: 90, weightage: 20 },
  { title: "Reduce operational costs by 10%", status: "Completed", progress: 100, weightage: 25 },
]

export function AiInsightsCard() {
  const [insight, setInsight] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [displayedInsight, setDisplayedInsight] = useState("")
  const [loaded, setLoaded] = useState(false)

  async function fetchInsight() {
    setIsLoading(true)
    setDisplayedInsight("")
    setInsight("")
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: MOCK_GOALS,
          role: "Employee",
          userName: "John Doe",
        }),
      })
      const data = await res.json()
      setInsight(data.insight || "")
    } catch {
      setInsight("You are making excellent progress this quarter! Keep focusing on your top-priority goals.")
    } finally {
      setIsLoading(false)
    }
  }

  // Typing animation when insight changes
  useEffect(() => {
    if (!insight) return
    setIsTyping(true)
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayedInsight(insight.slice(0, i))
      if (i >= insight.length) {
        clearInterval(interval)
        setIsTyping(false)
      }
    }, 15)
    return () => clearInterval(interval)
  }, [insight])

  // Auto-fetch on mount
  useEffect(() => {
    if (!loaded) {
      setLoaded(true)
      fetchInsight()
    }
  }, [loaded])

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            AI Performance Insight
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={fetchInsight}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">Analyzing your goals...</span>
            </motion.div>
          ) : (
            <motion.div key="insight" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-sm text-foreground leading-relaxed">
                {displayedInsight}
                {isTyping && <span className="inline-block h-4 w-0.5 bg-primary ml-0.5 animate-pulse" />}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary/60" />
            Powered by Groq LLaMA 3.3 · Updated just now
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
