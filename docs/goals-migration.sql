-- goals: one row per user (UNIQUE user_id enforces single goal)
CREATE TABLE goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  emoji           text NOT NULL DEFAULT '🎯',
  target_amount   bigint NOT NULL,
  deadline        date,
  note            text,
  is_completed    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON goals
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- household_cash_flow: one row per user
CREATE TABLE household_cash_flow (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avg_monthly_income   bigint NOT NULL DEFAULT 0,
  avg_monthly_expense  bigint NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE household_cash_flow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON household_cash_flow
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- monthly_actuals: one row per user per (year, month)
CREATE TABLE monthly_actuals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year            integer NOT NULL,
  month           integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  actual_income   bigint NOT NULL DEFAULT 0,
  actual_expense  bigint NOT NULL DEFAULT 0,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

ALTER TABLE monthly_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON monthly_actuals
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
