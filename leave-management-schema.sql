-- Leave Management System Database Schema
-- Add this to your Supabase SQL editor

-- 1. Leave Types Table
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_days_per_year INTEGER DEFAULT 0, -- 0 means unlimited
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  manager_comment TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Leave Balances Table (tracks remaining leave days per employee)
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  remaining_days INTEGER GENERATED ALWAYS AS (total_days - used_days) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, year)
);

-- 4. Leave Request Comments Table (for communication between employee and manager)
CREATE TABLE IF NOT EXISTS leave_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- true for manager-only comments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_manager ON leave_requests(manager_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON leave_balances(year);
CREATE INDEX IF NOT EXISTS idx_leave_comments_request ON leave_comments(leave_request_id);

-- 6. Insert default leave types
INSERT INTO leave_types (name, description, max_days_per_year, requires_approval) VALUES
('Annual Leave', 'Regular vacation days', 25, true),
('Sick Leave', 'Medical leave for illness', 10, true),
('Personal Leave', 'Personal time off', 5, true),
('Emergency Leave', 'Urgent personal matters', 3, true),
('Maternity Leave', 'Maternity and paternity leave', 90, true),
('Bereavement Leave', 'Death of family member', 5, true),
('Study Leave', 'Educational purposes', 10, true),
('Unpaid Leave', 'Leave without pay', 0, true)
ON CONFLICT (name) DO NOTHING;

-- 7. Create functions for leave management

-- Function to get employee leave requests
CREATE OR REPLACE FUNCTION get_employee_leave_requests(emp_id UUID)
RETURNS TABLE (
  id UUID,
  leave_type_name TEXT,
  start_date DATE,
  end_date DATE,
  total_days INTEGER,
  reason TEXT,
  status TEXT,
  manager_comment TEXT,
  applied_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  manager_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lr.id,
    lt.name as leave_type_name,
    lr.start_date,
    lr.end_date,
    lr.total_days,
    lr.reason,
    lr.status,
    lr.manager_comment,
    lr.applied_at,
    lr.reviewed_at,
    p.full_name as manager_name
  FROM leave_requests lr
  JOIN leave_types lt ON lr.leave_type_id = lt.id
  LEFT JOIN profiles p ON lr.manager_id = p.id
  WHERE lr.employee_id = emp_id
  ORDER BY lr.applied_at DESC;
END;
$$;

-- Function to get manager's pending leave requests
CREATE OR REPLACE FUNCTION get_manager_pending_requests(manager_id UUID)
RETURNS TABLE (
  id UUID,
  employee_name TEXT,
  employee_email TEXT,
  leave_type_name TEXT,
  start_date DATE,
  end_date DATE,
  total_days INTEGER,
  reason TEXT,
  applied_at TIMESTAMPTZ,
  employee_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lr.id,
    p.full_name as employee_name,
    p.email as employee_email,
    lt.name as leave_type_name,
    lr.start_date,
    lr.end_date,
    lr.total_days,
    lr.reason,
    lr.applied_at,
    lr.employee_id
  FROM leave_requests lr
  JOIN profiles p ON lr.employee_id = p.id
  JOIN leave_types lt ON lr.leave_type_id = lt.id
  WHERE lr.manager_id = manager_id 
    AND lr.status = 'pending'
  ORDER BY lr.applied_at ASC;
END;
$$;

-- Function to get leave statistics
CREATE OR REPLACE FUNCTION get_leave_statistics(emp_id UUID, year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()))
RETURNS TABLE (
  total_requests BIGINT,
  approved_requests BIGINT,
  pending_requests BIGINT,
  rejected_requests BIGINT,
  total_days_taken BIGINT,
  total_days_remaining BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_req BIGINT;
  approved_req BIGINT;
  pending_req BIGINT;
  rejected_req BIGINT;
  days_taken BIGINT;
  days_remaining BIGINT;
BEGIN
  -- Get request counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO total_req, approved_req, pending_req, rejected_req
  FROM leave_requests
  WHERE employee_id = emp_id 
    AND EXTRACT(YEAR FROM applied_at) = year;
  
  -- Get total days taken
  SELECT COALESCE(SUM(total_days), 0)
  INTO days_taken
  FROM leave_requests
  WHERE employee_id = emp_id 
    AND status = 'approved'
    AND EXTRACT(YEAR FROM applied_at) = year;
  
  -- Get remaining days (simplified calculation)
  SELECT COALESCE(SUM(remaining_days), 0)
  INTO days_remaining
  FROM leave_balances
  WHERE employee_id = emp_id 
    AND year = year;
  
  RETURN QUERY
  SELECT 
    total_req,
    approved_req,
    pending_req,
    rejected_req,
    days_taken,
    days_remaining;
END;
$$;

-- Function to approve/reject leave request
CREATE OR REPLACE FUNCTION update_leave_request_status(
  request_id UUID,
  new_status TEXT,
  manager_comment TEXT DEFAULT NULL,
  manager_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  request_record RECORD;
BEGIN
  -- Validate status
  IF new_status NOT IN ('approved', 'rejected', 'cancelled') THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid status. Must be approved, rejected, or cancelled'
    );
  END IF;
  
  -- Get the request details
  SELECT * INTO request_record
  FROM leave_requests
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Leave request not found'
    );
  END IF;
  
  -- Update the request
  UPDATE leave_requests
  SET 
    status = new_status,
    manager_comment = manager_comment,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id;
  
  -- If approved, update leave balance
  IF new_status = 'approved' THEN
    INSERT INTO leave_balances (employee_id, leave_type_id, year, total_days, used_days)
    VALUES (
      request_record.employee_id,
      request_record.leave_type_id,
      EXTRACT(YEAR FROM request_record.start_date),
      0, -- This should be set based on company policy
      request_record.total_days
    )
    ON CONFLICT (employee_id, leave_type_id, year)
    DO UPDATE SET 
      used_days = leave_balances.used_days + request_record.total_days,
      updated_at = NOW();
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Leave request updated successfully'
  );
END;
$$;

-- 8. Set up Row Level Security (RLS)
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_requests
CREATE POLICY "Employees can view their own leave requests" ON leave_requests
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Managers can view their team's leave requests" ON leave_requests
  FOR SELECT USING (
    manager_id = auth.uid() OR 
    employee_id IN (
      SELECT id FROM profiles WHERE manager_id = auth.uid()
    )
  );

CREATE POLICY "Employees can create their own leave requests" ON leave_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can update leave requests they manage" ON leave_requests
  FOR UPDATE USING (manager_id = auth.uid());

-- RLS Policies for leave_balances
CREATE POLICY "Employees can view their own leave balances" ON leave_balances
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Managers can view their team's leave balances" ON leave_balances
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM profiles WHERE manager_id = auth.uid()
    )
  );

-- RLS Policies for leave_comments
CREATE POLICY "Users can view comments on their leave requests" ON leave_comments
  FOR SELECT USING (
    user_id = auth.uid() OR
    leave_request_id IN (
      SELECT id FROM leave_requests WHERE employee_id = auth.uid() OR manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on their leave requests" ON leave_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    leave_request_id IN (
      SELECT id FROM leave_requests WHERE employee_id = auth.uid() OR manager_id = auth.uid()
    )
  );

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION get_employee_leave_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_manager_pending_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leave_statistics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_leave_request_status(UUID, TEXT, TEXT, UUID) TO authenticated;
