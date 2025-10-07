-- Fix the trigger issue causing 500 error
-- Run this in your Supabase SQL editor

-- 1. First, drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the trigger function
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Make sure we have proper RLS policies for manual profile creation
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_service_insert" ON profiles;

-- 4. Create a simple INSERT policy
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (true);

-- 5. Verify the policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
