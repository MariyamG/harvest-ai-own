-- Sample data for testing and development

-- Insert sample users
INSERT INTO users (id, email, shop_name, location, subscription_tier)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'demo@coffeeshopai.com', 'Demo Coffee Shop', 'Vancouver', 'free'),
  ('00000000-0000-0000-0000-000000000002', 'test@coffeeshopai.com', 'Test Cafe', 'Vancouver', 'premium');

-- Insert sample inventory items
INSERT INTO inventory (user_id, item_name, quantity, par_level, unit_cost, expiry_date, category)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Coffee Beans', 50, 100, 12.00, CURRENT_DATE + INTERVAL '90 days', 'beverage'),
  ('00000000-0000-0000-0000-000000000001', 'Milk', 20, 40, 4.00, CURRENT_DATE + INTERVAL '7 days', 'dairy'),
  ('00000000-0000-0000-0000-000000000001', 'Sugar', 30, 50, 3.00, CURRENT_DATE + INTERVAL '365 days', 'dry goods'),
  ('00000000-0000-0000-0000-000000000001', 'Cups', 100, 200, 0.15, NULL, 'supplies'),
  ('00000000-0000-0000-0000-000000000001', 'Muffins', 15, 30, 2.50, CURRENT_DATE + INTERVAL '3 days', 'food'),
  ('00000000-0000-0000-0000-000000000001', 'Croissants', 10, 25, 3.00, CURRENT_DATE + INTERVAL '2 days', 'food'),
  ('00000000-0000-0000-0000-000000000001', 'Sandwich Bread', 8, 20, 4.50, CURRENT_DATE + INTERVAL '5 days', 'food');

-- Insert sample staff
INSERT INTO staff (user_id, name, hourly_rate, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'John Smith', 18.00, 'Barista'),
  ('00000000-0000-0000-0000-000000000001', 'Jane Doe', 25.00, 'Manager'),
  ('00000000-0000-0000-0000-000000000001', 'Mike Johnson', 17.50, 'Barista'),
  ('00000000-0000-0000-0000-000000000001', 'Sarah Williams', 17.00, 'Cashier'),
  ('00000000-0000-0000-0000-000000000001', 'David Brown', 18.00, 'Barista');

-- Get staff IDs for shift creation
DO $$
DECLARE
  john_id UUID;
  jane_id UUID;
  mike_id UUID;
  sarah_id UUID;
  david_id UUID;
BEGIN
  SELECT id INTO john_id FROM staff WHERE name = 'John Smith';
  SELECT id INTO jane_id FROM staff WHERE name = 'Jane Doe';
  SELECT id INTO mike_id FROM staff WHERE name = 'Mike Johnson';
  SELECT id INTO sarah_id FROM staff WHERE name = 'Sarah Williams';
  SELECT id INTO david_id FROM staff WHERE name = 'David Brown';

  -- Insert sample shifts for today
  INSERT INTO shifts (staff_id, start_time, end_time, notes)
  VALUES
    (john_id, CURRENT_DATE + TIME '06:00:00', CURRENT_DATE + TIME '14:00:00', 'Morning shift'),
    (jane_id, CURRENT_DATE + TIME '08:00:00', CURRENT_DATE + TIME '16:00:00', 'Opening duties'),
    (mike_id, CURRENT_DATE + TIME '10:00:00', CURRENT_DATE + TIME '18:00:00', ''),
    (sarah_id, CURRENT_DATE + TIME '14:00:00', CURRENT_DATE + TIME '22:00:00', 'Closing duties'),
    (david_id, CURRENT_DATE + TIME '14:00:00', CURRENT_DATE + TIME '22:00:00', '');
    
  -- Insert sample shifts for tomorrow
  INSERT INTO shifts (staff_id, start_time, end_time, notes)
  VALUES
    (john_id, CURRENT_DATE + INTERVAL '1 day' + TIME '06:00:00', CURRENT_DATE + INTERVAL '1 day' + TIME '14:00:00', 'Morning shift'),
    (jane_id, CURRENT_DATE + INTERVAL '1 day' + TIME '08:00:00', CURRENT_DATE + INTERVAL '1 day' + TIME '16:00:00', 'Opening duties'),
    (mike_id, CURRENT_DATE + INTERVAL '1 day' + TIME '10:00:00', CURRENT_DATE + INTERVAL '1 day' + TIME '18:00:00', ''),
    (sarah_id, CURRENT_DATE + INTERVAL '1 day' + TIME '14:00:00', CURRENT_DATE + INTERVAL '1 day' + TIME '22:00:00', 'Closing duties'),
    (david_id, CURRENT_DATE + INTERVAL '1 day' + TIME '14:00:00', CURRENT_DATE + INTERVAL '1 day' + TIME '22:00:00', '');
END $$;

-- Insert sample sales data
DO $$
DECLARE
  user_id UUID := '00000000-0000-0000-0000-000000000001';
  items TEXT[] := ARRAY['Coffee', 'Latte', 'Cappuccino', 'Espresso', 'Muffin', 'Croissant', 'Sandwich'];
  item_prices DECIMAL[] := ARRAY[3.50, 4.50, 4.75, 3.00, 3.25, 3.50, 6.50];
  item_index INT;
  sale_time TIMESTAMP;
  amount DECIMAL;
  i INT;
BEGIN
  -- Generate 200 random sales for the past 7 days
  FOR i IN 1..200 LOOP
    -- Random item
    item_index := floor(random() * array_length(items, 1)) + 1;
    
    -- Random time in the past 7 days
    sale_time := CURRENT_TIMESTAMP - (random() * INTERVAL '7 days');
    
    -- Price with some variation
    amount := item_prices[item_index] * (0.9 + random() * 0.2);
    
    -- Insert sale
    INSERT INTO sales (user_id, timestamp, amount, item_name, category)
    VALUES (
      user_id,
      sale_time,
      amount,
      items[item_index],
      CASE 
        WHEN item_index <= 4 THEN 'beverage'
        ELSE 'food'
      END
    );
  END LOOP;
END $$;

-- Insert sample suggestions
INSERT INTO suggestions (user_id, suggestion_text, category, priority, implemented, details)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Restock coffee beans soon, current stock is below 20% of par level', 'inventory', 'high', false, 'Current stock: 15 units'),
  ('00000000-0000-0000-0000-000000000001', 'Consider adding staff during 8-10 AM, customer wait times increased by 30%', 'staffing', 'high', false, 'Average wait time: 5.2 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'Promote muffins tomorrow, 10 will expire in 2 days', 'inventory', 'medium', true, 'Expiring on: ' || (CURRENT_DATE + INTERVAL '2 days')),
  ('00000000-0000-0000-0000-000000000001', 'Consider running a promotion during 2-4 PM, sales are consistently low during this period', 'sales', 'medium', false, 'Average transactions: 5 per hour'),
  ('00000000-0000-0000-0000-000000000001', 'Reduce staff by 1 during 3-5 PM tomorrow, consistently overstaffed', 'staffing', 'low', false, 'Average customers per staff: 3.5');

-- Insert sample forecasts
DO $$
DECLARE
  user_id UUID := '00000000-0000-0000-0000-000000000001';
  day INT;
  hour INT;
  day_of_week INT;
  base_customers INT;
  weekend_multiplier DECIMAL;
BEGIN
  -- Create forecasts for the next 7 days
  FOR day IN 0..6 LOOP
    -- Calculate day of week (0-6, Sunday-Saturday)
    day_of_week := MOD(EXTRACT(DOW FROM CURRENT_DATE) + day, 7);
    
    -- Weekend multiplier
    IF day_of_week IN (0, 6) THEN -- Weekend (Sunday or Saturday)
      weekend_multiplier := 1.5;
    ELSE
      weekend_multiplier := 1.0;
    END IF;
    
    -- For each hour of operation (6am-10pm)
    FOR hour IN 6..21 LOOP
      -- Set base customer count based on time of day
      IF hour BETWEEN 7 AND 9 THEN -- Morning rush
        base_customers := 30;
      ELSIF hour BETWEEN 12 AND 13 THEN -- Lunch rush
        base_customers := 25;
      ELSIF hour BETWEEN 17 AND 18 THEN -- Evening rush
        base_customers := 20;
      ELSE
        base_customers := 10;
      END IF;
      
      -- Apply weekend multiplier
      base_customers := ROUND(base_customers * weekend_multiplier);
      
      -- Insert forecast
      INSERT INTO forecasts (
        user_id,
        forecast_date,
        forecast_hour,
        day_of_week,
        predicted_customers,
        predicted_sales,
        confidence_score
      ) VALUES (
        user_id,
        CURRENT_DATE + (day || ' days')::INTERVAL,
        hour,
        day_of_week,
        base_customers,
        base_customers * 7, -- Assuming $7 average sale
        0.7 + (random() * 0.2) -- Confidence score between 0.7 and 0.9
      );
    END LOOP;
  END LOOP;
END $$;
