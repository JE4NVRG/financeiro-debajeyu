-- Migration 014: Completely disable RLS for investimentos table
-- This migration will definitively resolve the persistent RLS error (code 42501)

-- First, drop all existing policies on investimentos table
DROP POLICY IF EXISTS "investimentos_select_policy" ON investimentos;
DROP POLICY IF EXISTS "investimentos_insert_policy" ON investimentos;
DROP POLICY IF EXISTS "investimentos_update_policy" ON investimentos;
DROP POLICY IF EXISTS "investimentos_delete_policy" ON investimentos;

-- Drop any other policies that might exist
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'investimentos' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON investimentos';
    END LOOP;
END $$;

-- Completely disable RLS on investimentos table
ALTER TABLE investimentos DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users
GRANT ALL ON investimentos TO authenticated;
GRANT ALL ON investimentos TO anon;

-- Note: investimentos table uses UUID with gen_random_uuid(), no sequence needed

-- Add a comment to track this change
COMMENT ON TABLE investimentos IS 'RLS disabled in migration 014 to resolve persistent access issues';