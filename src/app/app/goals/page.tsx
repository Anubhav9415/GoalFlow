"use client"

import { useEffect, useState } from "react"
import { getSession, hasPermission, UserRole } from "@/lib/auth"
import { EmployeeGoalsView } from "./employee-view"
import { ManagerGoalsView } from "./manager-view"
import { AdminGoalsView } from "./admin-view"

export default function GoalsPage() {
  const [role, setRole] = useState<UserRole>("employee")

  useEffect(() => {
    const s = getSession()
    if (s) setRole(s.role)
  }, [])

  if (role === "manager") return <ManagerGoalsView />
  if (role === "admin" || role === "hr") return <AdminGoalsView />
  return <EmployeeGoalsView />
}
