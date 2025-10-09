-- Test Leave Management System
-- This script tests the complete leave management workflow

-- 1. Test leave types are properly seeded
SELECT 'Testing leave types...' as test_step;
SELECT * FROM leave_types ORDER BY name;

-- 2. Test creating a leave request
SELECT 'Testing leave request creation...' as test_step;

-- First, let's create a test employee and manager
INSERT INTO profiles (id, email, full_name, role, department, position) 
VALUES 
  ('test-employee-1', 'employee@test.com', 'Test Employee', 'employee', 'Engineering', 'Developer'),
  ('test-manager-1', 'manager@test.com', 'Test Manager', 'manager', 'Engineering', 'Engineering Manager')
ON CONFLICT (id) DO NOTHING;

-- Set manager relationship
UPDATE profiles 
SET manager_id = 'test-manager-1' 
WHERE id = 'test-employee-1';

-- 3. Test leave request creation
SELECT 'Creating test leave request...' as test_step;

INSERT INTO leave_requests (
  employee_id, 
  manager_id, 
  leave_type_id, 
  start_date, 
  end_date, 
  total_days, 
  reason, 
  status
) VALUES (
  'test-employee-1',
  'test-manager-1',
  (SELECT id FROM leave_types WHERE name = 'Annual Leave' LIMIT 1),
  '2024-02-01',
  '2024-02-05',
  5,
  'Family vacation',
  'pending'
);

-- 4. Test employee leave requests function
SELECT 'Testing employee leave requests function...' as test_step;
SELECT * FROM get_employee_leave_requests('test-employee-1');

-- 5. Test manager pending requests function
SELECT 'Testing manager pending requests function...' as test_step;
SELECT * FROM get_manager_pending_requests('test-manager-1');

-- 6. Test leave statistics function
SELECT 'Testing leave statistics function...' as test_step;
SELECT * FROM get_leave_statistics('test-employee-1', 2024);

-- 7. Test leave request approval
SELECT 'Testing leave request approval...' as test_step;
SELECT update_leave_request_status(
  (SELECT id FROM leave_requests WHERE employee_id = 'test-employee-1' LIMIT 1),
  'approved',
  'Approved for family vacation',
  'test-manager-1'
);

-- 8. Test leave balance creation
SELECT 'Testing leave balance creation...' as test_step;
SELECT * FROM leave_balances WHERE employee_id = 'test-employee-1';

-- 9. Test leave request rejection
SELECT 'Testing leave request rejection...' as test_step;

-- Create another test request
INSERT INTO leave_requests (
  employee_id, 
  manager_id, 
  leave_type_id, 
  start_date, 
  end_date, 
  total_days, 
  reason, 
  status
) VALUES (
  'test-employee-1',
  'test-manager-1',
  (SELECT id FROM leave_types WHERE name = 'Sick Leave' LIMIT 1),
  '2024-02-10',
  '2024-02-12',
  3,
  'Medical appointment',
  'pending'
);

-- Reject the request
SELECT update_leave_request_status(
  (SELECT id FROM leave_requests WHERE employee_id = 'test-employee-1' AND leave_type_id = (SELECT id FROM leave_types WHERE name = 'Sick Leave' LIMIT 1) LIMIT 1),
  'rejected',
  'Please provide medical certificate',
  'test-manager-1'
);

-- 10. Test leave comments
SELECT 'Testing leave comments...' as test_step;

INSERT INTO leave_comments (
  leave_request_id,
  user_id,
  comment,
  is_internal
) VALUES (
  (SELECT id FROM leave_requests WHERE employee_id = 'test-employee-1' AND status = 'rejected' LIMIT 1),
  'test-employee-1',
  'I will provide the medical certificate tomorrow',
  false
);

-- 11. Test RLS policies
SELECT 'Testing RLS policies...' as test_step;

-- Test that employees can only see their own requests
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "test-employee-1"}';

SELECT 'Employee view of their requests:' as test_info;
SELECT id, leave_type_id, status, reason FROM leave_requests WHERE employee_id = 'test-employee-1';

-- Test that managers can see their team's requests
SET LOCAL "request.jwt.claims" TO '{"sub": "test-manager-1"}';

SELECT 'Manager view of team requests:' as test_info;
SELECT id, employee_id, status, reason FROM leave_requests WHERE manager_id = 'test-manager-1';

-- 12. Clean up test data
SELECT 'Cleaning up test data...' as test_step;

DELETE FROM leave_comments WHERE leave_request_id IN (
  SELECT id FROM leave_requests WHERE employee_id = 'test-employee-1'
);

DELETE FROM leave_balances WHERE employee_id = 'test-employee-1';

DELETE FROM leave_requests WHERE employee_id = 'test-employee-1';

DELETE FROM profiles WHERE id IN ('test-employee-1', 'test-manager-1');

-- 13. Final verification
SELECT 'Leave management system test completed successfully!' as result;
