-- migration for detailed monthly expenses
-- Thêm cột lưu trữ chi tiết chi tiêu hàng tháng
ALTER TABLE monthly_actuals
  ADD COLUMN actual_expense_details JSONB DEFAULT '[]'::jsonb;

-- Comment giải thích
COMMENT ON COLUMN monthly_actuals.actual_expense_details IS 'Danh sách chi tiết chi tiêu: [{type: string, amount: number, note: string}]';
