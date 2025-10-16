-- Expense Management System Database Schema
-- Add this to your Supabase SQL editor

-- 1. Expense Categories Table
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_amount DECIMAL(10,2), -- Maximum amount allowed for this category (NULL = unlimited)
  requires_receipt BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'USD',
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  manager_comment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Expense Comments Table (for communication between employee and manager)
CREATE TABLE IF NOT EXISTS expense_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create triggers for auto-updating updated_at timestamp
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable Row Level Security
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_comments ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for expense_categories
CREATE POLICY "Everyone can view active expense categories" ON expense_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Managers and admins can manage expense categories" ON expense_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
    )
  );

-- 8. Create RLS policies for expenses
CREATE POLICY "Employees can view their own expenses" ON expenses
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Managers can view their team's expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
      AND (
        employee_id = auth.uid() OR 
        employee_id IN (
          SELECT id FROM profiles WHERE manager_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Employees can create their own expenses" ON expenses
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can update expenses they can view" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('manager', 'admin')
      AND (
        employee_id = auth.uid() OR 
        employee_id IN (
          SELECT id FROM profiles WHERE manager_id = auth.uid()
        )
      )
    )
  );

-- 9. Create RLS policies for expense_comments
CREATE POLICY "Users can view comments on expenses they can access" ON expense_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_id AND (
        employee_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('manager', 'admin')
          AND (
            employee_id = auth.uid() OR 
            employee_id IN (
              SELECT id FROM profiles WHERE manager_id = auth.uid()
            )
          )
        )
      )
    )
  );

CREATE POLICY "Users can create comments on expenses they can access" ON expense_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses 
      WHERE id = expense_id AND (
        employee_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('manager', 'admin')
          AND (
            employee_id = auth.uid() OR 
            employee_id IN (
              SELECT id FROM profiles WHERE manager_id = auth.uid()
            )
          )
        )
      )
    )
  );

-- 10. Insert default expense categories
INSERT INTO expense_categories (name, description, max_amount, requires_receipt) VALUES
('Travel', 'Business travel expenses including flights, hotels, meals', 5000.00, true),
('Meals', 'Business meals and entertainment', 200.00, true),
('Transportation', 'Local transportation, parking, tolls', 100.00, true),
('Office Supplies', 'Office supplies and equipment', 500.00, true),
('Training', 'Professional development and training', 2000.00, true),
('Software', 'Software licenses and subscriptions', 1000.00, true),
('Communication', 'Phone, internet, and communication expenses', 200.00, true),
('Other', 'Other business-related expenses', 1000.00, true)
ON CONFLICT (name) DO NOTHING;

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_employee_id ON expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_manager_id ON expenses(manager_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_comments_expense_id ON expense_comments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_comments_user_id ON expense_comments(user_id);
