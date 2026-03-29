-- migration for surplus allocations
-- Thêm cột allocations JSONB vào bảng monthly_actuals
ALTER TABLE monthly_actuals
ADD COLUMN allocations jsonb NOT NULL DEFAULT '[]'::jsonb;
