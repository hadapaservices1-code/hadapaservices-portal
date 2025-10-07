-- Debug script to check what's happening with user signup
-- Run these queries in your Supabase SQL editor to diagnose the issue

-- 1. Check if the profiles table exists and has the right structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled and what policies exist
SELECT schemaname, tablename, rowsecurity, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Check if the trigger function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Check if the trigger exists
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_name = 'on_auth_user_created';

-- 5. Check recent auth.users entries
SELECT id, email, created_at, raw_user_meta_data 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Check if any profiles were created
SELECT id, email, full_name, role, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
