-- Test team functionality
-- Run this in your Supabase SQL editor to test the team management features

-- 1. Check if there are any profiles with manager_id set
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.department,
  p.position,
  p.manager_id,
  m.full_name as manager_name
FROM profiles p
LEFT JOIN profiles m ON p.manager_id = m.id
ORDER BY p.created_at DESC;

-- 2. Check team structure (managers and their team members)
SELECT 
  m.full_name as manager_name,
  m.role as manager_role,
  COUNT(t.id) as team_size,
  ARRAY_AGG(t.full_name) as team_members
FROM profiles m
LEFT JOIN profiles t ON t.manager_id = m.id
WHERE m.role IN ('manager', 'admin')
GROUP BY m.id, m.full_name, m.role
ORDER BY team_size DESC;

-- 3. Check if there are any tasks assigned to team members
SELECT 
  p.full_name as team_member,
  p.role,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks
FROM profiles p
LEFT JOIN tasks t ON t.assigned_to = p.id
WHERE p.manager_id IS NOT NULL
GROUP BY p.id, p.full_name, p.role
ORDER BY total_tasks DESC;

-- 4. Check projects created by managers
SELECT 
  p.full_name as manager_name,
  pr.name as project_name,
  pr.status,
  pr.priority,
  pr.end_date
FROM profiles p
JOIN projects pr ON pr.created_by = p.id
WHERE p.role IN ('manager', 'admin')
ORDER BY pr.end_date ASC;

-- 5. Sample data to test team functionality (uncomment to add test data)
/*
-- Add a test manager
INSERT INTO profiles (id, email, full_name, role, department, position)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'manager@test.com',
  'Test Manager',
  'manager',
  'Engineering',
  'Engineering Manager'
);

-- Add test team members
INSERT INTO profiles (id, email, full_name, role, department, position, manager_id)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    'employee1@test.com',
    'John Developer',
    'employee',
    'Engineering',
    'Senior Developer',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'employee2@test.com',
    'Jane Designer',
    'employee',
    'Engineering',
    'UI/UX Designer',
    '00000000-0000-0000-0000-000000000001'
  );

-- Add test project
INSERT INTO projects (name, description, start_date, end_date, priority, status, created_by)
VALUES (
  'Test Project',
  'A test project for team management',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'high',
  'in_progress',
  '00000000-0000-0000-0000-000000000001'
);

-- Add test tasks
INSERT INTO tasks (title, description, status, priority, assigned_to, assigned_by, project_id)
VALUES 
  (
    'Implement user authentication',
    'Create login and registration system',
    'in_progress',
    'high',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM projects WHERE name = 'Test Project' LIMIT 1)
  ),
  (
    'Design user interface',
    'Create mockups and wireframes',
    'completed',
    'medium',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    (SELECT id FROM projects WHERE name = 'Test Project' LIMIT 1)
  );
*/
