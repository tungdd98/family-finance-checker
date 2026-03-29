-- migration to fix schema conflicts correctly

-- 1. Drop the legacy columns using CASCADE. 
-- This will automatically remove the default expression on actual_income that depends on them.
ALTER TABLE monthly_actuals 
  DROP COLUMN IF EXISTS actual_income_husband CASCADE,
  DROP COLUMN IF EXISTS actual_income_wife CASCADE,
  DROP COLUMN IF EXISTS actual_income_extra CASCADE;

-- 2. Ensure actual_income exists and is a simple bigint (not calculated)
-- The CASCADE might have dropped the column if it was considered a dependent object.
-- We recreate it just in case, ensuring it's a standard field.
ALTER TABLE monthly_actuals 
  ADD COLUMN IF NOT EXISTS actual_income bigint NOT NULL DEFAULT 0;

-- 3. Final cleanup: make sure it doesn't have any leftover default expressions
ALTER TABLE monthly_actuals 
  ALTER COLUMN actual_income DROP DEFAULT,
  ALTER COLUMN actual_income SET DEFAULT 0;
