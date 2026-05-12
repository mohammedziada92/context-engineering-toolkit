-- CET Database Init: Set passwords for service roles and create required schemas
-- The supabase/postgres image creates roles but doesn't set passwords for non-superusers.

-- Create postgres role alias (many Supabase services expect this role)
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'postgres') THEN
        CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' SUPERUSER;
    END IF;
END $$;

-- Create auth schema for GoTrue
CREATE SCHEMA IF NOT EXISTS auth;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin, supabase_admin, postgres;

-- Create storage schema
CREATE SCHEMA IF NOT EXISTS storage;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin, supabase_admin, postgres;

-- Create realtime schema
CREATE SCHEMA IF NOT EXISTS realtime;
GRANT ALL ON SCHEMA realtime TO supabase_admin, postgres;

-- Set login passwords for roles that services connect as
ALTER ROLE authenticator WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_auth_admin WITH LOGIN PASSWORD 'postgres';
ALTER ROLE supabase_storage_admin WITH LOGIN PASSWORD 'postgres';
ALTER ROLE anon WITH LOGIN PASSWORD 'postgres';
ALTER ROLE authenticated WITH LOGIN PASSWORD 'postgres';
ALTER ROLE service_role WITH LOGIN PASSWORD 'postgres';

-- Grant supabase_admin role to auth/storage admins for full access
GRANT supabase_admin TO supabase_auth_admin;
GRANT supabase_admin TO supabase_storage_admin;
GRANT supabase_admin TO postgres;

-- Fix: GoTrue queries "users" and must resolve to "auth.users" (has aud column),
-- not "public.users" (our app table). Set search_path so auth schema is checked first.
ALTER ROLE supabase_auth_admin SET search_path TO auth, public;

-- Fix: GoTrue v2.189 migration "add_oauth_clients_table" expects a "client_id" column
-- that the base supabase/postgres image doesn't include. Pre-create it so the
-- migration's CREATE INDEX on client_id doesn't fail after GoTrue applies its schema.
-- (GoTrue migrations run AFTER init scripts, so we add the column via IF NOT EXISTS.)
-- NOTE: This is a no-op on first boot (table doesn't exist yet). GoTrue creates the
-- table, then we rely on the migration tracking inserts in 003-gotrue-migrations.sql.
