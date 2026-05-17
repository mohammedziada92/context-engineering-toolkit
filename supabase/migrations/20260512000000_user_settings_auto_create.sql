-- Auto-create user_settings row when a new user signs up.
-- Prevents silent failures when code queries user_settings before
-- the user has visited the Settings page.

CREATE OR REPLACE FUNCTION public.auto_create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_settings ON public.users;
CREATE TRIGGER on_user_created_settings
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_user_settings();
