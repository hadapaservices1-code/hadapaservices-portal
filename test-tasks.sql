-- Test script for tasks functionality
-- Run this after applying the tasks-schema.sql

-- Test 1: Check if tasks tables exist and have correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('tasks', 'task_comments', 'task_attachments')
ORDER BY table_name, ordinal_position;

-- Test 2: Check if RLS policies are enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('tasks', 'task_comments', 'task_attachments');

-- Test 3: Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_user_tasks', 
  'get_user_task_stats', 
  'update_task_status'
);

-- Test 4: Test get_user_tasks function (replace 'test-user-id' with actual user ID)
-- SELECT * FROM get_user_tasks('test-user-id');

-- Test 5: Test get_user_task_stats function
-- SELECT * FROM get_user_task_stats('test-user-id');

-- Test 6: Test task creation
-- INSERT INTO tasks (
--   title,
--   description,
--   priority,
--   assigned_to,
--   assigned_by,
--   due_date,
--   estimated_hours,
--   tags,
--   status
-- ) VALUES (
--   'Test Task',
--   'This is a test task description',
--   'high',
--   'test-user-id',
--   'test-manager-id',
--   CURRENT_DATE + INTERVAL '7 days',
--   4.5,
--   ARRAY['frontend', 'bug'],
--   'pending'
-- );

-- Test 7: Test update_task_status function
-- SELECT update_task_status(
--   'test-task-id',
--   'in_progress',
--   'test-user-id'
-- );

-- Test 8: Verify tasks data
SELECT 
  t.id,
  t.title,
  t.status,
  t.priority,
  t.due_date,
  t.estimated_hours,
  t.tags,
  p.name as project_name,
  pb.full_name as assigned_by_name
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN profiles pb ON t.assigned_by = pb.id
ORDER BY t.created_at DESC 
LIMIT 10;

-- Test 9: Check indexes
SELECT 
  indexname, 
  tablename, 
  indexdef 
FROM pg_indexes 
WHERE tablename IN ('tasks', 'task_comments', 'task_attachments')
ORDER BY tablename, indexname;

-- Test 10: Check enum types
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('task_priority', 'task_status')
ORDER BY t.typname, e.enumsortorder;

