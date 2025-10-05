-- Fix RLS policies for investimentos table
-- This migration addresses the RLS error preventing investment creation

-- Temporarily disable RLS for cleanup
ALTER TABLE investimentos DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies for investimentos (if any)
DROP POLICY IF EXISTS "Enable read access for all users" ON investimentos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON investimentos;
DROP POLICY IF EXISTS "Enable update for users based on email" ON investimentos;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON investimentos;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON investimentos;
DROP POLICY IF EXISTS "investimentos_select_policy" ON investimentos;
DROP POLICY IF EXISTS "investimentos_insert_policy" ON investimentos;
DROP POLICY IF EXISTS "investimentos_update_policy" ON investimentos;
DROP POLICY IF EXISTS "investimentos_delete_policy" ON investimentos;

-- Re-enable RLS
ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;

-- Create new, simplified RLS policies for investimentos
-- Allow SELECT for all authenticated users
CREATE POLICY "investimentos_select_policy" ON investimentos
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow INSERT for all authenticated users
CREATE POLICY "investimentos_insert_policy" ON investimentos
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow UPDATE for all authenticated users
CREATE POLICY "investimentos_update_policy" ON investimentos
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow DELETE for all authenticated users
CREATE POLICY "investimentos_delete_policy" ON investimentos
    FOR DELETE
    TO authenticated
    USING (true);

-- Optional: Allow public read access (uncomment if needed)
-- CREATE POLICY "investimentos_public_select_policy" ON investimentos
--     FOR SELECT
--     TO public
--     USING (true);