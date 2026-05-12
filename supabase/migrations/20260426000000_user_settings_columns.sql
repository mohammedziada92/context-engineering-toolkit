-- Add missing columns to user_settings for profile/preferences
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'MMM D, YYYY';
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS identities JSONB NOT NULL DEFAULT '[]'::jsonb;
