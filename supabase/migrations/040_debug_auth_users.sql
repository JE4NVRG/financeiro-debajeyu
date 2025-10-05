-- Migration 040: Debug auth.users to see what users exist
-- This is a temporary migration to help us understand the auth.users table

-- Create a function to debug auth.users content
CREATE OR REPLACE FUNCTION public.debug_auth_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  created_at timestamptz,
  confirmed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at,
    au.confirmed_at
  FROM auth.users au
  WHERE au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.debug_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_auth_users() TO anon;

-- Create a view to easily check auth users (read-only)
CREATE OR REPLACE VIEW public.auth_users_debug AS
SELECT 
  id as user_id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- Grant select on the view
GRANT SELECT ON public.auth_users_debug TO authenticated;
GRANT SELECT ON public.auth_users_debug TO anon;

COMMENT ON VIEW public.auth_users_debug IS 'Debug view to check auth.users content';