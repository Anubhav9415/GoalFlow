import type {
  Profile,
  Goal,
  Checkin,
  Notification,
  AuditLog,
  PerformanceCycle,
  CreateGoalRequest,
  UpdateGoalRequest,
  ApprovalRequest,
  CheckinRequest,
  CheckinReviewRequest,
  DashboardStats,
  TeamStats,
  OrgAnalytics,
  CycleRequest,
  ProfileSyncRequest,
} from '@/types/database'

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || 'API request failed')
  }
  return res.json()
}

// ─── Profile ────────────────────────────────────────────
export async function fetchProfile(): Promise<Profile> {
  return fetchAPI<Profile>('/api/profiles')
}

export async function syncProfile(data: ProfileSyncRequest): Promise<Profile> {
  return fetchAPI<Profile>('/api/profiles/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Goals ──────────────────────────────────────────────
export async function fetchGoals(params?: { status?: string; employee_id?: string; role?: string }): Promise<Goal[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.employee_id) searchParams.set('employee_id', params.employee_id)
  if (params?.role) searchParams.set('role', params.role)
  const qs = searchParams.toString()
  return fetchAPI<Goal[]>(`/api/goals${qs ? `?${qs}` : ''}`)
}

export async function fetchGoal(id: string): Promise<Goal> {
  return fetchAPI<Goal>(`/api/goals/${id}`)
}

export async function createGoal(data: CreateGoalRequest): Promise<Goal> {
  return fetchAPI<Goal>('/api/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateGoal(id: string, data: UpdateGoalRequest): Promise<Goal> {
  return fetchAPI<Goal>(`/api/goals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteGoal(id: string): Promise<void> {
  await fetchAPI<void>(`/api/goals/${id}`, { method: 'DELETE' })
}

export async function submitGoals(): Promise<{ count: number }> {
  return fetchAPI<{ count: number }>('/api/goals/submit', { method: 'POST' })
}

// ─── Approvals ──────────────────────────────────────────
export async function fetchApprovals(): Promise<Goal[]> {
  return fetchAPI<Goal[]>('/api/approvals')
}

export async function processApproval(data: ApprovalRequest): Promise<Goal> {
  return fetchAPI<Goal>('/api/approvals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Check-ins ──────────────────────────────────────────
export async function fetchCheckins(params?: { role?: string }): Promise<Checkin[]> {
  const searchParams = new URLSearchParams()
  if (params?.role) searchParams.set('role', params.role)
  const qs = searchParams.toString()
  return fetchAPI<Checkin[]>(`/api/checkins${qs ? `?${qs}` : ''}`)
}

export async function saveCheckin(data: CheckinRequest): Promise<Checkin> {
  return fetchAPI<Checkin>('/api/checkins', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function reviewCheckin(data: CheckinReviewRequest): Promise<Checkin> {
  return fetchAPI<Checkin>('/api/checkins/review', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ─── Dashboard ──────────────────────────────────────────
export async function fetchDashboard(): Promise<{
  stats: DashboardStats | TeamStats
  recentGoals: Goal[]
  profile: Profile
  quarterlyProgress: Array<{ quarter: string; progress: number }>
}> {
  return fetchAPI('/api/dashboard')
}

// ─── Analytics ──────────────────────────────────────────
export async function fetchAnalytics(): Promise<{
  analytics: OrgAnalytics
  atRiskGoals: (Goal & { employee?: Profile; latest_checkin?: Checkin })[]
  auditLogs: AuditLog[]
  departmentCompletion: Array<{ department: string; completion: number; goals: number }>
  monthlyTrend: Array<{ month: string; completion: number }>
}> {
  return fetchAPI('/api/analytics')
}

// ─── Notifications ──────────────────────────────────────
export async function fetchNotifications(): Promise<Notification[]> {
  return fetchAPI<Notification[]>('/api/notifications')
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetchAPI(`/api/notifications`, {
    method: 'PATCH',
    body: JSON.stringify({ id }),
  })
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetchAPI(`/api/notifications`, {
    method: 'PATCH',
    body: JSON.stringify({ all: true }),
  })
}

// ─── Performance Cycles ─────────────────────────────────
export async function fetchCycles(): Promise<PerformanceCycle[]> {
  return fetchAPI<PerformanceCycle[]>('/api/cycles')
}

export async function saveCycle(data: CycleRequest & { id?: string }): Promise<PerformanceCycle> {
  return fetchAPI<PerformanceCycle>('/api/cycles', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
