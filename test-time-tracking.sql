-- Test script for time tracking functionality
-- Run this after applying the time-tracking-schema.sql

-- Test 1: Check if time_tracking table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'time_tracking' 
ORDER BY ordinal_position;

-- Test 2: Check if RLS policies are enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'time_tracking';

-- Test 3: Check if functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('get_current_time_status', 'clock_in', 'clock_out', 'calculate_total_hours');

-- Test 4: Test clock_in function (replace 'test-user-id' with actual user ID)
-- SELECT clock_in('test-user-id', 'Starting work day');

-- Test 5: Test get_current_time_status function (replace 'test-user-id' with actual user ID)
-- SELECT * FROM get_current_time_status('test-user-id');

-- Test 6: Test clock_out function (replace 'test-user-id' with actual user ID)
-- SELECT clock_out('test-user-id', 'Ending work day');

-- Test 7: Verify time calculation
-- This should show the calculated hours when both time_in and time_out are set
SELECT 
  id,
  user_id,
  date,
  time_in,
  time_out,
  total_hours,
  status
FROM time_tracking 
WHERE user_id = 'test-user-id' 
ORDER BY date DESC 
LIMIT 5;
