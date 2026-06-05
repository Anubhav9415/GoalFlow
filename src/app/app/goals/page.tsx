"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { fetchProfile } from "@/services/api"
import { EmployeeGoalsView } from "./employee-view"
import { ManagerGoalsView } from "./manager-view"
import { AdminGoalsView } from "./admin-view"

export default function GoalsPage() {
  const [role, setRole] = useState<string>("employee")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
      .then(p => setRole(p.role))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (role === "manager") return <ManagerGoalsView />
  if (role === "admin" || role === "hr") return <AdminGoalsView />
  return <EmployeeGoalsView />
}
