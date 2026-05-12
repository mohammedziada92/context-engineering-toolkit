-- Billing interest signups (Pro plan waitlist)
CREATE TABLE billing_notify_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'pro',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan)
);

ALTER TABLE billing_notify_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interest" ON billing_notify_interest
  FOR ALL USING (auth.uid() = user_id);
