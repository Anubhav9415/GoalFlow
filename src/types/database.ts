// Database row types matching the Supabase schema
export interface Profile {
  id: string
  clerk_user_id: string
  full_name: string
  email: string
  role: 'employee' | 'manager' | 'admin' | 'hr'
  manager_id: string | null
  department: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface PerformanceCycle {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type GoalStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface Goal {
  id: string
  employee_id: string
  cycle_id: string | null
  title: string
  description: string | null
  thrust_area: string | null
  uom_type: string | null
  target_value: string | null
  weightage: number
  status: GoalStatus
  is_locked: boolean
  manager_comment: string | null
  submitted_at: string | null
  decided_at: string | null
  decided_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  employee?: Profile
  cycle?: PerformanceCycle
  decided_by_profile?: Profile
}

export type ProgressStatus = 'on_track' | 'at_risk' | 'completed' | 'not_started'

export interface Checkin {
  id: string
  goal_id: string
  employee_id: string
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  actual_value: string | null
  progress_status: ProgressStatus | null
  self_note: string | null
  manager_rating: number | null
  manager_feedback: string | null
  is_submitted: boolean
  is_reviewed: boolean
  created_at: string
  updated_at: string
  // Joined fields
  goal?: Goal
  employee?: Profile
}

export type NotificationType = 'info' | 'goal_submitted' | 'goal_approved' | 'goal_rejected' | 'checkin_due' | 'checkin_reviewed' | 'cycle_updated' | 'system'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  type: NotificationType
  is_read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export type AuditAction = 'created' | 'updated' | 'deleted' | 'submitted' | 'approved' | 'rejected' | 'unlocked' | 'locked' | 'reviewed'

export interface AuditLog {
  id: string
  entity_type: 'goal' | 'checkin' | 'cycle' | 'profile' | 'system'
  entity_id: string
  action: AuditAction
  changed_by: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  description: string | null
  created_at: string
  // Joined
  changed_by_profile?: Profile
}

export interface SharedGoal {
  id: string
  goal_id: string
  primary_owner_id: string
  linked_employee_id: string
  created_at: string
}

// API Request/Response types
export interface CreateGoalRequest {
  title: string
  description?: string
  thrust_area?: string
  uom_type?: string
  target_value?: string
  weightage: number
  cycle_id?: string
}

export interface UpdateGoalRequest {
  title?: string
  description?: string
  thrust_area?: string
  uom_type?: string
  target_value?: string
  weightage?: number
  status?: GoalStatus
  is_locked?: boolean
  manager_comment?: string
}

export interface ApprovalRequest {
  goal_id: string
  action: 'approve' | 'reject'
  comment?: string
}

export interface CheckinRequest {
  goal_id: string
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  actual_value?: string
  progress_status?: ProgressStatus
  self_note?: string
}

export interface CheckinReviewRequest {
  checkin_id: string
  manager_rating: number
  manager_feedback?: string
}

export interface DashboardStats {
  total_goals: number
  approved_goals: number
  pending_goals: number
  draft_goals: number
  rejected_goals: number
  pending_checkins: number
  avg_progress: number
  unread_notifications: number
}

export interface TeamStats {
  team_members: number
  pending_approvals: number
  pending_reviews: number
  team_avg_progress: number
}

export interface OrgAnalytics {
  total_goals: number
  total_employees: number
  total_managers: number
  goals_by_status: Array<{ status: string; count: number }>
  goals_by_department: Array<{ department: string; count: number; avg_weightage: number }>
  at_risk_count: number
}

export interface CycleRequest {
  name: string
  start_date: string
  end_date: string
  is_active?: boolean
}

export interface ProfileSyncRequest {
  clerk_user_id: string
  full_name: string
  email: string
  avatar_url?: string
}
