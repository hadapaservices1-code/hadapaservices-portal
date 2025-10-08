-- Timesheet schema for employee time logging against projects

-- Create timesheet_entries table
CREATE TABLE timesheet_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  hours_worked DECIMAL(4,2) NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 24),
  description TEXT NOT NULL,
  task_category TEXT, -- e.g., 'development', 'testing', 'meeting', 'documentation'
  billable BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no duplicate entries for same user, project, and date
  UNIQUE(user_id, project_id, date)
);

-- Create timesheet_submissions table for weekly submissions
CREATE TABLE timesheet_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_hours DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one submission per user per week
  UNIQUE(user_id, week_start_date)
);

-- Create updated_at triggers
CREATE TRIGGER update_timesheet_entries_updated_at
  BEFORE UPDATE ON timesheet_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timesheet_submissions_updated_at
  BEFORE UPDATE ON timesheet_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for timesheet_entries
CREATE POLICY "Users can view their own timesheet entries" ON timesheet_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timesheet entries" ON timesheet_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft timesheet entries" ON timesheet_entries
  FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Managers can view team timesheet entries" ON timesheet_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role IN ('manager', 'admin') OR id = user_id)
    )
  );

CREATE POLICY "Managers can approve/reject timesheet entries" ON timesheet_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- RLS policies for timesheet_submissions
CREATE POLICY "Users can view their own timesheet submissions" ON timesheet_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timesheet submissions" ON timesheet_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft timesheet submissions" ON timesheet_submissions
  FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Managers can view team timesheet submissions" ON timesheet_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role IN ('manager', 'admin') OR id = user_id)
    )
  );

CREATE POLICY "Managers can approve/reject timesheet submissions" ON timesheet_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_timesheet_entries_user_id ON timesheet_entries(user_id);
CREATE INDEX idx_timesheet_entries_project_id ON timesheet_entries(project_id);
CREATE INDEX idx_timesheet_entries_date ON timesheet_entries(date);
CREATE INDEX idx_timesheet_entries_status ON timesheet_entries(status);
CREATE INDEX idx_timesheet_entries_user_date ON timesheet_entries(user_id, date);

CREATE INDEX idx_timesheet_submissions_user_id ON timesheet_submissions(user_id);
CREATE INDEX idx_timesheet_submissions_week_start ON timesheet_submissions(week_start_date);
CREATE INDEX idx_timesheet_submissions_status ON timesheet_submissions(status);

-- Function to get available projects for a user
CREATE OR REPLACE FUNCTION get_available_projects_for_user(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  start_date DATE,
  end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.status::TEXT,
    p.priority::TEXT,
    p.start_date,
    p.end_date
  FROM projects p
  WHERE p.status IN ('planning', 'in_progress')
    AND p.start_date <= CURRENT_DATE
    AND p.end_date >= CURRENT_DATE
  ORDER BY p.priority DESC, p.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get timesheet summary for a user
CREATE OR REPLACE FUNCTION get_timesheet_summary(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  total_hours DECIMAL(5,2),
  total_entries INTEGER,
  last_entry_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    te.project_id,
    p.name as project_name,
    SUM(te.hours_worked) as total_hours,
    COUNT(te.id) as total_entries,
    MAX(te.date) as last_entry_date
  FROM timesheet_entries te
  JOIN projects p ON te.project_id = p.id
  WHERE te.user_id = user_uuid
    AND te.date >= start_date
    AND te.date <= end_date
  GROUP BY te.project_id, p.name
  ORDER BY total_hours DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit timesheet for approval
CREATE OR REPLACE FUNCTION submit_timesheet(user_uuid UUID, week_start DATE, notes_text TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
  submission_record RECORD;
  total_hours DECIMAL(5,2);
  week_end DATE;
BEGIN
  week_end := week_start + INTERVAL '6 days';
  
  -- Calculate total hours for the week
  SELECT COALESCE(SUM(hours_worked), 0) INTO total_hours
  FROM timesheet_entries
  WHERE user_id = user_uuid
    AND date >= week_start
    AND date <= week_end
    AND status = 'draft';
  
  -- Create or update timesheet submission
  INSERT INTO timesheet_submissions (user_id, week_start_date, week_end_date, total_hours, status, submitted_at, notes)
  VALUES (user_uuid, week_start, week_end, total_hours, 'submitted', NOW(), notes_text)
  ON CONFLICT (user_id, week_start_date)
  DO UPDATE SET 
    total_hours = EXCLUDED.total_hours,
    status = 'submitted',
    submitted_at = NOW(),
    notes = COALESCE(notes_text, timesheet_submissions.notes),
    updated_at = NOW()
  RETURNING * INTO submission_record;
  
  -- Update all timesheet entries to submitted status
  UPDATE timesheet_entries
  SET status = 'submitted', updated_at = NOW()
  WHERE user_id = user_uuid
    AND date >= week_start
    AND date <= week_end
    AND status = 'draft';
  
  RETURN json_build_object(
    'success', true,
    'message', 'Timesheet submitted successfully',
    'data', row_to_json(submission_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve timesheet
CREATE OR REPLACE FUNCTION approve_timesheet(submission_id UUID, approver_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  submission_record RECORD;
BEGIN
  -- Check if user is manager or admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = approver_uuid AND role IN ('manager', 'admin')
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only managers and admins can approve timesheets',
      'data', null
    );
  END IF;
  
  -- Update timesheet submission
  UPDATE timesheet_submissions
  SET 
    status = 'approved',
    approved_by = approver_uuid,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = submission_id
    AND status = 'submitted'
  RETURNING * INTO submission_record;
  
  IF submission_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Timesheet submission not found or already processed',
      'data', null
    );
  END IF;
  
  -- Update all related timesheet entries
  UPDATE timesheet_entries
  SET 
    status = 'approved',
    approved_by = approver_uuid,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE user_id = submission_record.user_id
    AND date >= submission_record.week_start_date
    AND date <= submission_record.week_end_date
    AND status = 'submitted';
  
  RETURN json_build_object(
    'success', true,
    'message', 'Timesheet approved successfully',
    'data', row_to_json(submission_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
