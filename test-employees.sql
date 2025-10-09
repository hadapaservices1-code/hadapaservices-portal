-- Test script to check if employees exist in the database
-- Run this in your Supabase SQL editor

-- 1. Check all users in the profiles table
SELECT 
  id,
  email,
  full_name,
  role,
  department,
  position,
  manager_id,
  created_at
FROM profiles 
ORDER BY created_at DESC;

-- 2. Check specifically for employees
SELECT 
  id,
  email,
  full_name,
  role,
  department,
  position,
  manager_id
FROM profiles 
WHERE role = 'employee'
ORDER BY created_at DESC;

-- 3. Check user roles distribution
SELECT 
  role,
  COUNT(*) as count
FROM profiles 
GROUP BY role
ORDER BY count DESC;

-- 4. Add a test employee if none exist (uncomment to use)
/*
INSERT INTO profiles (id, email, full_name, role, department, position)
VALUES (
  'test-employee-001',
  'employee1@company.com',
  'John Employee',
  'employee',
  'Engineering',
  'Software Developer'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, role, department, position)
VALUES (
  'test-employee-002',
  'employee2@company.com',
  'Jane Employee',
  'employee',
  'Marketing',
  'Marketing Specialist'
) ON CONFLICT (id) DO NOTHING;
*/
