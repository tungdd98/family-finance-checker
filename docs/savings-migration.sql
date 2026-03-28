-- ============================================================
-- savings_accounts table
-- ============================================================
-- Lưu trữ thông tin các khoản tiết kiệm của người dùng
-- ============================================================

CREATE TABLE IF NOT EXISTS public.savings_accounts (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info
  bank_name         text NOT NULL,                -- Tên ngân hàng VD: "Vietcombank"
  account_name      text,                         -- Tên sổ / Tên gợi nhớ VD: "Sổ học phí"
  note              text,                         -- Ghi chú

  -- Financial
  principal         bigint NOT NULL,              -- Số tiền gốc (VND)
  interest_rate     numeric(5,2) NOT NULL,        -- Lãi suất (%/năm)

  -- Term
  term_months       integer,                      -- Kỳ hạn (tháng). NULL = không kỳ hạn
  start_date        date NOT NULL,                -- Ngày gửi
  maturity_date     date,                         -- Ngày đáo hạn (NULL nếu không kỳ hạn)

  -- Rollover
  rollover_type     text NOT NULL DEFAULT 'none'  -- 'none' | 'principal' | 'principal_interest'
    CHECK (rollover_type IN ('none', 'principal', 'principal_interest')),

  -- Status
  status            text NOT NULL DEFAULT 'active'  -- 'active' | 'matured' | 'closed'
    CHECK (status IN ('active', 'matured', 'closed')),

  closed_at         timestamptz,                  -- Ngày tất toán (nếu đã đóng)

  created_at        timestamptz DEFAULT now() NOT NULL,
  updated_at        timestamptz DEFAULT now() NOT NULL
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_savings_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_savings_updated_at
  BEFORE UPDATE ON public.savings_accounts
  FOR EACH ROW EXECUTE FUNCTION update_savings_updated_at();

-- ── RLS ──────────────────────────────────────────────
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own savings"
  ON public.savings_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings"
  ON public.savings_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings"
  ON public.savings_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings"
  ON public.savings_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ── Index ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_savings_user_status
  ON public.savings_accounts (user_id, status);
