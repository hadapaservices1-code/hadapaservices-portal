-- Debug login issues
-- Run this in your Supabase SQL editor to check what's happening

-- 1. Check if users were created in auth.users
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check if profiles were created
SELECT id, email, full_name, role, created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if there are any orphaned users (users without profiles)
SELECT u.id, u.email, u.created_at as user_created, p.id as profile_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;
