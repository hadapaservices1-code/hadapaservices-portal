-- Supabase schema for Create Project functionality
-- Only includes what's needed for project management

-- Create custom types for projects
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'completed', 'on_hold');

-- Create projects table
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Managers and admins can view all projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Managers and admins can create projects" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Managers and admins can update projects" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Managers and admins can delete projects" ON projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);

-- Insert some sample projects (optional)
INSERT INTO projects (name, description, start_date, end_date, priority, status, created_by) VALUES
  ('Mobile App Development', 'Build a cross-platform mobile application for iOS and Android', '2024-01-15', '2024-06-15', 'high', 'in_progress', (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1)),
  ('Website Redesign', 'Complete redesign of the company website with modern UI/UX', '2024-02-01', '2024-04-30', 'medium', 'planning', (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1)),
  ('Database Migration', 'Migrate legacy database to new cloud infrastructure', '2024-01-20', '2024-03-20', 'high', 'in_progress', (SELECT id FROM profiles WHERE role = 'manager' LIMIT 1))
ON CONFLICT DO NOTHING;
