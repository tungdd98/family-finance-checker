-- migration for detailed monthly income
-- Thêm cột lưu trữ chi tiết thu nhập hàng tháng
ALTER TABLE monthly_actuals
  ADD COLUMN actual_income_details JSONB DEFAULT '[]'::jsonb;

-- Comment giải thích
COMMENT ON COLUMN monthly_actuals.actual_income_details IS 'Danh sách chi tiết thu nhập: [{type: string, amount: number, note: string}]';
