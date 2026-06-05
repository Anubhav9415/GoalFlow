-- ============================================================
-- Complete Production Schema for GoalFlow
-- Project: GoalFlow
-- ============================================================

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'employee'
    CHECK (role IN ('employee', 'manager', 'admin', 'hr')),
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_clerk_user_id ON public.profiles(clerk_user_id);
CREATE INDEX idx_profiles_manager_id ON public.profiles(manager_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_department ON public.profiles(department);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
COMMENT ON TABLE public.profiles IS 'User profiles synced from Clerk authentication. clerk_user_id links to Clerk userId.';

-- 2. Performance Cycles Table
CREATE TABLE public.performance_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE INDEX idx_cycles_active ON public.performance_cycles(is_active);

ALTER TABLE public.performance_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cycles_select_all" ON public.performance_cycles FOR SELECT USING (true);
CREATE POLICY "cycles_insert" ON public.performance_cycles FOR INSERT WITH CHECK (true);
CREATE POLICY "cycles_update" ON public.performance_cycles FOR UPDATE USING (true) WITH CHECK (true);
COMMENT ON TABLE public.performance_cycles IS 'Configurable performance review cycles (quarterly/annual).';

-- 3. Goals Table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES public.performance_cycles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  thrust_area TEXT,
  uom_type TEXT,
  target_value TEXT,
  weightage NUMERIC NOT NULL DEFAULT 0
    CHECK (weightage >= 0 AND weightage <= 100),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  manager_comment TEXT,
  submitted_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_employee_id ON public.goals(employee_id);
CREATE INDEX idx_goals_cycle_id ON public.goals(cycle_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_employee_status ON public.goals(employee_id, status);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "goals_select" ON public.goals FOR SELECT USING (true);
CREATE POLICY "goals_insert" ON public.goals FOR INSERT WITH CHECK (true);
CREATE POLICY "goals_update" ON public.goals FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "goals_delete" ON public.goals FOR DELETE USING (true);
COMMENT ON TABLE public.goals IS 'Employee performance goals with approval workflow. Status transitions: draft -> pending -> approved/rejected.';

-- 4. Checkins Table
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL
    CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  actual_value TEXT,
  progress_status TEXT
    CHECK (progress_status IN ('on_track', 'at_risk', 'completed', 'not_started')),
  self_note TEXT,
  manager_rating INTEGER
    CHECK (manager_rating IS NULL OR (manager_rating >= 1 AND manager_rating <= 5)),
  manager_feedback TEXT,
  is_submitted BOOLEAN NOT NULL DEFAULT false,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(goal_id, quarter)
);

CREATE INDEX idx_checkins_goal_id ON public.checkins(goal_id);
CREATE INDEX idx_checkins_employee_id ON public.checkins(employee_id);
CREATE INDEX idx_checkins_quarter ON public.checkins(quarter);
CREATE INDEX idx_checkins_review_status ON public.checkins(is_submitted, is_reviewed);

ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_select" ON public.checkins FOR SELECT USING (true);
CREATE POLICY "checkins_insert" ON public.checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "checkins_update" ON public.checkins FOR UPDATE USING (true) WITH CHECK (true);
COMMENT ON TABLE public.checkins IS 'Quarterly check-in records. Employees log actuals; managers rate and provide feedback.';

-- 5. Notifications and Audit Logs Tables
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT NOT NULL DEFAULT 'info'
    CHECK (type IN ('info', 'goal_submitted', 'goal_approved', 'goal_rejected', 'checkin_due', 'checkin_reviewed', 'cycle_updated', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (true);
COMMENT ON TABLE public.notifications IS 'User notifications for goal status changes, check-in reminders, etc.';

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL
    CHECK (entity_type IN ('goal', 'checkin', 'cycle', 'profile', 'system')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL
    CHECK (action IN ('created', 'updated', 'deleted', 'submitted', 'approved', 'rejected', 'unlocked', 'locked', 'reviewed')),
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  old_value JSONB,
  new_value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_changed_by ON public.audit_logs(changed_by);
CREATE INDEX idx_audit_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "audit_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail of all significant actions across the system.';

-- 6. Shared Goals Table
CREATE TABLE public.shared_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  primary_owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  linked_employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(goal_id, linked_employee_id)
);

CREATE INDEX idx_shared_goals_goal ON public.shared_goals(goal_id);
CREATE INDEX idx_shared_goals_owner ON public.shared_goals(primary_owner_id);
CREATE INDEX idx_shared_goals_linked ON public.shared_goals(linked_employee_id);

ALTER TABLE public.shared_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared_goals_select" ON public.shared_goals FOR SELECT USING (true);
CREATE POLICY "shared_goals_insert" ON public.shared_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "shared_goals_delete" ON public.shared_goals FOR DELETE USING (true);
COMMENT ON TABLE public.shared_goals IS 'Links goals shared across multiple employees.';

-- 7. Functions and Triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_checkins_updated_at BEFORE UPDATE ON public.checkins FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_cycles_updated_at BEFORE UPDATE ON public.performance_cycles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_profile_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_goals', (SELECT COUNT(*) FROM public.goals WHERE employee_id = p_profile_id),
    'approved_goals', (SELECT COUNT(*) FROM public.goals WHERE employee_id = p_profile_id AND status = 'approved'),
    'pending_goals', (SELECT COUNT(*) FROM public.goals WHERE employee_id = p_profile_id AND status = 'pending'),
    'draft_goals', (SELECT COUNT(*) FROM public.goals WHERE employee_id = p_profile_id AND status = 'draft'),
    'rejected_goals', (SELECT COUNT(*) FROM public.goals WHERE employee_id = p_profile_id AND status = 'rejected'),
    'pending_checkins', (
      SELECT COUNT(*) FROM public.checkins
      WHERE employee_id = p_profile_id AND is_submitted = false
    ),
    'avg_progress', (
      SELECT COALESCE(
        ROUND(AVG(
          CASE
            WHEN c.progress_status = 'completed' THEN 100
            WHEN c.progress_status = 'on_track' THEN 70
            WHEN c.progress_status = 'at_risk' THEN 40
            ELSE 0
          END
        )), 0
      )
      FROM public.checkins c
      JOIN public.goals g ON g.id = c.goal_id
      WHERE g.employee_id = p_profile_id AND c.is_submitted = true
    ),
    'unread_notifications', (
      SELECT COUNT(*) FROM public.notifications
      WHERE user_id = p_profile_id AND is_read = false
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_team_stats(p_manager_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'team_members', (SELECT COUNT(*) FROM public.profiles WHERE manager_id = p_manager_id),
    'pending_approvals', (
      SELECT COUNT(*) FROM public.goals g
      JOIN public.profiles p ON p.id = g.employee_id
      WHERE p.manager_id = p_manager_id AND g.status = 'pending'
    ),
    'pending_reviews', (
      SELECT COUNT(*) FROM public.checkins c
      JOIN public.profiles p ON p.id = c.employee_id
      WHERE p.manager_id = p_manager_id AND c.is_submitted = true AND c.is_reviewed = false
    ),
    'team_avg_progress', (
      SELECT COALESCE(
        ROUND(AVG(
          CASE
            WHEN c.progress_status = 'completed' THEN 100
            WHEN c.progress_status = 'on_track' THEN 70
            WHEN c.progress_status = 'at_risk' THEN 40
            ELSE 0
          END
        )), 0
      )
      FROM public.checkins c
      JOIN public.profiles p ON p.id = c.employee_id
      WHERE p.manager_id = p_manager_id AND c.is_submitted = true
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_org_analytics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_goals', (SELECT COUNT(*) FROM public.goals),
    'total_employees', (SELECT COUNT(*) FROM public.profiles WHERE role = 'employee'),
    'total_managers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'manager'),
    'goals_by_status', (
      SELECT json_agg(json_build_object('status', status, 'count', cnt))
      FROM (SELECT status, COUNT(*) as cnt FROM public.goals GROUP BY status) sub
    ),
    'goals_by_department', (
      SELECT json_agg(json_build_object('department', department, 'count', cnt, 'avg_weightage', avg_w))
      FROM (
        SELECT p.department, COUNT(*) as cnt, ROUND(AVG(g.weightage)) as avg_w
        FROM public.goals g
        JOIN public.profiles p ON p.id = g.employee_id
        WHERE p.department IS NOT NULL
        GROUP BY p.department
      ) sub
    ),
    'at_risk_count', (
      SELECT COUNT(*) FROM public.checkins WHERE progress_status = 'at_risk'
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
