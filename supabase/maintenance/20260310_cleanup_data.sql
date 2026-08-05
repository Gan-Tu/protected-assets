-- Migration: Cleanup existing data and start fresh
-- This will truncate all data in the application tables while preserving the schema.

BEGIN;

-- Truncate all tables in the public schema that hold user-generated data.
-- restart identity: resets any serial sequences.
-- cascade: handles foreign key dependencies.
TRUNCATE TABLE 
  public.access_requests,
  public.asset_files,
  public.assets,
  public.asset_groups,
  public.profiles 
RESTART IDENTITY CASCADE;

-- If profiles are truncated, but auth.users are not, existing users will be missing their profiles.
-- The following re-syncs profiles for any existing auth.users to avoid orphans.
INSERT INTO public.profiles (id, email)
SELECT id, email 
FROM auth.users
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

COMMIT;
