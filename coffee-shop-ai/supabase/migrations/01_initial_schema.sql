-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shop_name TEXT,
  location TEXT,
  subscription_tier TEXT DEFAULT 'free',
  opening_time TIME DEFAULT '06:00:00',
  closing_time TIME DEFAULT '22:00:00'
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount DECIMAL NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  clover_order_id TEXT
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  par_level INTEGER NOT NULL,
  unit_cost DECIMAL,
  expiry_date DATE,
  category TEXT,
  clover_item_id TEXT
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  hourly_rate DECIMAL,
  role TEXT,
  clover_employee_id TEXT
);

-- Shifts Table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES staff(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_hours DECIMAL,
  notes TEXT
);

-- Suggestions Table
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  suggestion_text TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT,
  implemented BOOLEAN DEFAULT FALSE,
  details TEXT
);

-- Forecasts Table
CREATE TABLE IF NOT EXISTS forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  forecast_date DATE NOT NULL,
  forecast_hour INTEGER,
  day_of_week INTEGER,
  predicted_customers INTEGER,
  predicted_sales DECIMAL,
  confidence_score DECIMAL
);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_policy ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for sales table
CREATE POLICY sales_select_policy ON sales
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY sales_insert_policy ON sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY sales_update_policy ON sales
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY sales_delete_policy ON sales
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for inventory table
CREATE POLICY inventory_select_policy ON inventory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY inventory_insert_policy ON inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY inventory_update_policy ON inventory
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY inventory_delete_policy ON inventory
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for staff table
CREATE POLICY staff_select_policy ON staff
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY staff_insert_policy ON staff
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY staff_update_policy ON staff
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY staff_delete_policy ON staff
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for shifts table
CREATE POLICY shifts_select_policy ON shifts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = shifts.staff_id
      AND staff.user_id = auth.uid()
    )
  );

CREATE POLICY shifts_insert_policy ON shifts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = shifts.staff_id
      AND staff.user_id = auth.uid()
    )
  );

CREATE POLICY shifts_update_policy ON shifts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = shifts.staff_id
      AND staff.user_id = auth.uid()
    )
  );

CREATE POLICY shifts_delete_policy ON shifts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = shifts.staff_id
      AND staff.user_id = auth.uid()
    )
  );

-- Create policies for suggestions table
CREATE POLICY suggestions_select_policy ON suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY suggestions_insert_policy ON suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY suggestions_update_policy ON suggestions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY suggestions_delete_policy ON suggestions
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for forecasts table
CREATE POLICY forecasts_select_policy ON forecasts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY forecasts_insert_policy ON forecasts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY forecasts_update_policy ON forecasts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY forecasts_delete_policy ON forecasts
  FOR DELETE USING (auth.uid() = user_id);
