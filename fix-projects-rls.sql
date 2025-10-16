-- Fix RLS policies for projects to allow employees to view projects
-- This script adds the missing RLS policy for employees to view projects

-- Add RLS policy for employees to view projects
CREATE POLICY "Employees can view available projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

-- Enable RLS on projects table if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Verify the policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;
