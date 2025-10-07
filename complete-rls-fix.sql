-- Complete RLS fix for profiles table
-- Run this in your Supabase SQL editor

-- First, let's drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Managers can view their team members" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- Now create comprehensive policies

-- 1. Allow users to insert their own profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Allow users to view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Allow managers to view their team members
CREATE POLICY "profiles_select_team" ON profiles
  FOR SELECT USING (
    auth.uid() = manager_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- 5. Allow admins to do everything
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Allow service role to insert profiles (for the trigger function)
CREATE POLICY "profiles_service_insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- Verify the policies were created
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
