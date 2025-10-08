-- Test script for timesheet functionality
-- Run this after applying the timesheet-schema.sql

-- Test 1: Check if timesheet tables exist and have correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('timesheet_entries', 'timesheet_submissions')
ORDER BY table_name, ordinal_position;

-- Test 2: Check if RLS policies are enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('timesheet_entries', 'timesheet_submissions');

-- Test 3: Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_available_projects_for_user', 
  'get_timesheet_summary', 
  'submit_timesheet', 
  'approve_timesheet'
);

-- Test 4: Test get_available_projects_for_user function (replace 'test-user-id' with actual user ID)
-- SELECT * FROM get_available_projects_for_user('test-user-id');

-- Test 5: Test timesheet entry creation
-- INSERT INTO timesheet_entries (
--   user_id, 
--   project_id, 
--   date, 
--   hours_worked, 
--   description, 
--   task_category, 
--   billable, 
--   status
-- ) VALUES (
--   'test-user-id',
--   'test-project-id',
--   CURRENT_DATE,
--   2.5,
--   'Working on feature development',
--   'development',
--   true,
--   'draft'
-- );

-- Test 6: Test get_timesheet_summary function
-- SELECT * FROM get_timesheet_summary(
--   'test-user-id', 
--   CURRENT_DATE - INTERVAL '7 days', 
--   CURRENT_DATE
-- );

-- Test 7: Test submit_timesheet function
-- SELECT submit_timesheet(
--   'test-user-id',
--   DATE_TRUNC('week', CURRENT_DATE)::DATE,
--   'Weekly timesheet submission'
-- );

-- Test 8: Verify timesheet entries and submissions
SELECT 
  te.id,
  te.user_id,
  te.date,
  te.hours_worked,
  te.description,
  te.status,
  p.name as project_name
FROM timesheet_entries te
LEFT JOIN projects p ON te.project_id = p.id
ORDER BY te.date DESC 
LIMIT 10;

SELECT 
  ts.id,
  ts.user_id,
  ts.week_start_date,
  ts.week_end_date,
  ts.total_hours,
  ts.status,
  ts.submitted_at
FROM timesheet_submissions ts
ORDER BY ts.week_start_date DESC 
LIMIT 5;

-- Test 9: Check indexes
SELECT 
  indexname, 
  tablename, 
  indexdef 
FROM pg_indexes 
WHERE tablename IN ('timesheet_entries', 'timesheet_submissions')
ORDER BY tablename, indexname;
