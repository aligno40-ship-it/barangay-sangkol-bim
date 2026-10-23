-- ============================================================================
-- FIX & UPGRADE SCRIPT FOR SUPABASE: system_users LOGIN & AUTHENTICATION RLS
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================================

-- 1. Ensure RLS is active on system_users
ALTER TABLE IF EXISTS system_users ENABLE ROW LEVEL SECURITY;

-- 2. Allow public/anon read on system_users and residents so login and user loading succeed
DROP POLICY IF EXISTS public_select_system_users ON system_users;
CREATE POLICY public_select_system_users ON system_users
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS public_select_residents ON residents;
CREATE POLICY public_select_residents ON residents
  FOR SELECT TO public
  USING (true);

-- 3. Allow anonymous resident sign-up and registration
DROP POLICY IF EXISTS anon_insert_resident_signup ON system_users;
CREATE POLICY anon_insert_resident_signup ON system_users
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 4. Allow user profile and password updates
DROP POLICY IF EXISTS public_update_system_users ON system_users;
CREATE POLICY public_update_system_users ON system_users
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);
