-- Tasks schema for task management functionality

-- Create task_priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create task_status enum
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2) DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_comments table for task discussions
CREATE TABLE task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_attachments table for file attachments
CREATE TABLE task_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at triggers
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks
CREATE POLICY "Users can view their assigned tasks" ON tasks
  FOR SELECT USING (auth.uid() = assigned_to);

CREATE POLICY "Users can view tasks they assigned" ON tasks
  FOR SELECT USING (auth.uid() = assigned_by);

CREATE POLICY "Managers can view team tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role IN ('manager', 'admin') OR id = assigned_to OR id = assigned_by)
    )
  );

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "Users can update their assigned tasks" ON tasks
  FOR UPDATE USING (auth.uid() = assigned_to);

CREATE POLICY "Managers can update team tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Users can delete tasks they created" ON tasks
  FOR DELETE USING (auth.uid() = assigned_by);

CREATE POLICY "Managers can delete team tasks" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- RLS policies for task_comments
CREATE POLICY "Users can view task comments" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_id 
      AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Users can create task comments" ON task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_id 
      AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
    )
  );

CREATE POLICY "Users can update their own comments" ON task_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for task_attachments
CREATE POLICY "Users can view task attachments" ON task_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_id 
      AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Users can create task attachments" ON task_attachments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM tasks 
      WHERE id = task_id 
      AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own attachments" ON task_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX idx_task_comments_created_at ON task_comments(created_at);

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_user_id ON task_attachments(user_id);

-- Function to get user tasks with project and assigner info
CREATE OR REPLACE FUNCTION get_user_tasks(user_uuid UUID, status_filter TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(4,2),
  actual_hours DECIMAL(4,2),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  project_name TEXT,
  project_id UUID,
  assigned_by_name TEXT,
  assigned_by_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.status::TEXT,
    t.priority::TEXT,
    t.due_date,
    t.completed_at,
    t.estimated_hours,
    t.actual_hours,
    t.tags,
    t.created_at,
    t.updated_at,
    p.name as project_name,
    t.project_id,
    pb.full_name as assigned_by_name,
    t.assigned_by
  FROM tasks t
  LEFT JOIN projects p ON t.project_id = p.id
  LEFT JOIN profiles pb ON t.assigned_by = pb.id
  WHERE t.assigned_to = user_uuid
    AND (status_filter IS NULL OR t.status::TEXT = status_filter)
  ORDER BY 
    CASE t.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    t.due_date ASC NULLS LAST,
    t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get task statistics for a user
CREATE OR REPLACE FUNCTION get_user_task_stats(user_uuid UUID)
RETURNS TABLE (
  total_tasks INTEGER,
  completed_tasks INTEGER,
  pending_tasks INTEGER,
  in_progress_tasks INTEGER,
  overdue_tasks INTEGER,
  completion_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_tasks,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_tasks,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress_tasks,
    COUNT(*) FILTER (WHERE status != 'completed' AND due_date < CURRENT_DATE)::INTEGER as overdue_tasks,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0
    END as completion_rate
  FROM tasks
  WHERE assigned_to = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update task status
CREATE OR REPLACE FUNCTION update_task_status(task_uuid UUID, new_status TEXT, user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  task_record RECORD;
BEGIN
  -- Check if user can update this task
  IF NOT EXISTS (
    SELECT 1 FROM tasks 
    WHERE id = task_uuid 
    AND (assigned_to = user_uuid OR assigned_by = user_uuid)
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'You do not have permission to update this task',
      'data', null
    );
  END IF;
  
  -- Update task status
  UPDATE tasks
  SET 
    status = new_status::task_status,
    completed_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE completed_at END,
    updated_at = NOW()
  WHERE id = task_uuid
  RETURNING * INTO task_record;
  
  IF task_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Task not found',
      'data', null
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Task status updated successfully',
    'data', row_to_json(task_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

