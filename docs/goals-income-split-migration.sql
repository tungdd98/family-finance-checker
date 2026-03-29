-- migration for splitting income
-- Tách cấu hình dòng tiền
ALTER TABLE household_cash_flow 
  ADD COLUMN avg_monthly_income_husband bigint NOT NULL DEFAULT 0,
  ADD COLUMN avg_monthly_income_wife bigint NOT NULL DEFAULT 0;

ALTER TABLE household_cash_flow DROP COLUMN avg_monthly_income;
ALTER TABLE household_cash_flow ADD COLUMN avg_monthly_income bigint GENERATED ALWAYS AS (avg_monthly_income_husband + avg_monthly_income_wife) STORED;

-- Tách thu nhập thực tế
ALTER TABLE monthly_actuals
  ADD COLUMN actual_income_husband bigint NOT NULL DEFAULT 0,
  ADD COLUMN actual_income_wife bigint NOT NULL DEFAULT 0,
  ADD COLUMN actual_income_extra bigint NOT NULL DEFAULT 0;

ALTER TABLE monthly_actuals DROP COLUMN actual_income;
ALTER TABLE monthly_actuals ADD COLUMN actual_income bigint GENERATED ALWAYS AS (actual_income_husband + actual_income_wife + actual_income_extra) STORED;
