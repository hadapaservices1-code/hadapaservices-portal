-- Create Project Schema for Manager Dashboard
-- This file contains only the database schema needed for project creation functionality

-- =============================================
-- CUSTOM TYPES
-- =============================================

-- Project priority levels
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high');

-- Project status states
CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'completed', 'on_hold');

-- =============================================
-- PROJECTS TABLE
-- =============================================

-- Main projects table for storing project information
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  priority project_priority DEFAULT 'medium',
  status project_status DEFAULT 'planning',
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT valid_project_name CHECK (length(name) >= 2),
  CONSTRAINT valid_description CHECK (length(description) >= 10)
);

-- =============================================
-- TRIGGERS
-- =============================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at timestamp
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Managers and admins can view all projects
CREATE POLICY "managers_admins_view_projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Policy: Managers and admins can create projects
CREATE POLICY "managers_admins_create_projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Policy: Managers and admins can update projects
CREATE POLICY "managers_admins_update_projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Policy: Managers and admins can delete projects
CREATE POLICY "managers_admins_delete_projects" ON projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Index on created_by for user queries
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- Index on status for filtering by project status
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Index on priority for filtering by project priority
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);

-- Index on start_date for date range queries
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);

-- Index on end_date for date range queries
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);

-- Composite index for common queries (status + priority)
CREATE INDEX IF NOT EXISTS idx_projects_status_priority ON projects(status, priority);

-- Composite index for user's projects (created_by + status)
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(created_by, status);

-- =============================================
-- SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert sample projects for testing (only if no projects exist)
INSERT INTO projects (name, description, start_date, end_date, priority, status, created_by) 
SELECT 
  'Mobile App Development',
  'Build a cross-platform mobile application for iOS and Android with modern UI/UX design',
  '2024-01-15',
  '2024-06-15',
  'high',
  'in_progress',
  (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM projects LIMIT 1);

INSERT INTO projects (name, description, start_date, end_date, priority, status, created_by) 
SELECT 
  'Website Redesign',
  'Complete redesign of the company website with modern UI/UX and improved performance',
  '2024-02-01',
  '2024-04-30',
  'medium',
  'planning',
  (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Website Redesign');

INSERT INTO projects (name, description, start_date, end_date, priority, status, created_by) 
SELECT 
  'Database Migration',
  'Migrate legacy database to new cloud infrastructure with zero downtime',
  '2024-01-20',
  '2024-03-20',
  'high',
  'in_progress',
  (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = 'Database Migration');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Uncomment these to verify the schema was created correctly:

-- Check if projects table exists
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'projects';

-- Check if custom types exist
-- SELECT typname FROM pg_type WHERE typname IN ('project_priority', 'project_status');

-- Check if RLS policies exist
-- SELECT policyname FROM pg_policies WHERE tablename = 'projects';

-- Check if indexes exist
-- SELECT indexname FROM pg_indexes WHERE tablename = 'projects';
