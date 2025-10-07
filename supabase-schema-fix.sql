-- Fix for profiles table INSERT policy
-- Run this in your Supabase SQL editor

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Also add a policy to allow the trigger function to insert profiles
CREATE POLICY "Allow profile creation during signup" ON profiles
  FOR INSERT WITH CHECK (true);
