"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Target, ArrowRight, BarChart3, CheckSquare, Users, Shield, PieChart, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/30">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">GoalFlow</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#workflow" className="hover:text-primary transition-colors">Workflow</Link>
            <Link href="#analytics" className="hover:text-primary transition-colors">Analytics</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Log in</Button>
            </Link>
            <Link href="/login">
              <Button>Start Demo</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(79,70,229,0.2),rgba(15,23,42,0))]" />
          
          <div className="container px-4 md:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col justify-center space-y-8 text-center lg:text-left"
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                    Enterprise Goal Management 2.0
                  </div>
                  <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl">
                    Align Goals. <br className="hidden lg:inline" />
                    Track Progress. <br className="hidden lg:inline" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Drive Performance.</span>
                  </h1>
                  <p className="max-w-[42rem] mx-auto lg:mx-0 text-lg text-muted-foreground sm:text-xl">
                    Enterprise-grade goal management and quarterly check-ins for high-performance teams. Build alignment from the executive board to every employee.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/login">
                    <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg group">
                      Start Demo 
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-lg">
                    Watch Overview
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative mx-auto w-full max-w-[600px] lg:max-w-none"
              >
                <div className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur shadow-2xl p-2 ring-1 ring-inset ring-primary/10">
                  <div className="rounded-lg overflow-hidden border border-border bg-background">
                    <div className="h-8 border-b border-border bg-muted/50 flex items-center px-4 gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-destructive/80" />
                        <div className="h-3 w-3 rounded-full bg-warning/80" />
                        <div className="h-3 w-3 rounded-full bg-success/80" />
                      </div>
                    </div>
                    {/* Fake Dashboard UI */}
                    <div className="p-4 grid grid-cols-4 gap-4 bg-background h-[400px]">
                      <div className="col-span-1 border-r border-border space-y-4 pr-4 hidden sm:block">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-4 w-full bg-muted/50 rounded" />
                        <div className="h-4 w-3/4 bg-muted/50 rounded" />
                        <div className="h-4 w-5/6 bg-muted/50 rounded" />
                      </div>
                      <div className="col-span-4 sm:col-span-3 space-y-4">
                        <div className="flex gap-4">
                          <div className="h-24 flex-1 bg-primary/10 border border-primary/20 rounded-lg p-4">
                            <div className="h-4 w-20 bg-primary/30 rounded mb-2" />
                            <div className="h-8 w-12 bg-primary/40 rounded" />
                          </div>
                          <div className="h-24 flex-1 bg-muted rounded-lg p-4">
                            <div className="h-4 w-20 bg-muted-foreground/30 rounded mb-2" />
                            <div className="h-8 w-12 bg-muted-foreground/40 rounded" />
                          </div>
                        </div>
                        <div className="h-48 w-full bg-muted rounded-lg p-4 flex items-end gap-2">
                          {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                            <div key={i} className="w-full bg-primary/40 rounded-t" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Cards */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -right-6 top-24 hidden lg:block"
                >
                  <Card className="p-4 shadow-xl border-primary/20 bg-card/90 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckSquare className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Goal Approved</p>
                        <p className="text-xs text-muted-foreground">Manager reviewed Q3 targets</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-muted/30">
          <div className="container px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to scale</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Built from the ground up for enterprise teams. No more messy spreadsheets or disjointed tools.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Target, title: "Goal Creation", desc: "Set SMART goals with custom weights and UOMs." },
                { icon: CheckSquare, title: "Approval Workflow", desc: "Multi-level manager approvals with inline comments." },
                { icon: Activity, title: "Quarterly Check-ins", desc: "Structured progress updates for Q1 to Q4." },
                { icon: BarChart3, title: "Advanced Analytics", desc: "Heatmaps and trends across departments." },
                { icon: Users, title: "Shared Goals", desc: "Cascade KPIs from executives down to employees." },
                { icon: Shield, title: "Audit Logs", desc: "Enterprise-grade history tracking for all changes." },
              ].map((feature, i) => (
                <Card key={i} className="p-6 bg-card border-border/50 hover:border-primary/50 transition-colors">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-5 w-5" />
            <span className="font-semibold">GoalFlow AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Goal Tracking Portal. Designed for Enterprise Hackathons.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
