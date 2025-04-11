-- Functions for end-of-day suggestions

-- Function to analyze sales data and generate insights
CREATE OR REPLACE FUNCTION analyze_daily_sales(user_id_param UUID, date_param DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH daily_sales AS (
    SELECT 
      EXTRACT(HOUR FROM timestamp) AS hour,
      COUNT(*) AS transaction_count,
      SUM(amount) AS sales_amount
    FROM sales
    WHERE user_id = user_id_param
      AND DATE(timestamp) = date_param
    GROUP BY EXTRACT(HOUR FROM timestamp)
  ),
  item_sales AS (
    SELECT 
      item_name,
      COUNT(*) AS quantity_sold,
      SUM(amount) AS sales_amount
    FROM sales
    WHERE user_id = user_id_param
      AND DATE(timestamp) = date_param
    GROUP BY item_name
    ORDER BY COUNT(*) DESC
  )
  SELECT json_build_object(
    'total_sales', COALESCE((SELECT SUM(sales_amount) FROM daily_sales), 0),
    'transaction_count', COALESCE((SELECT SUM(transaction_count) FROM daily_sales), 0),
    'peak_hour', COALESCE((SELECT hour FROM daily_sales ORDER BY transaction_count DESC LIMIT 1), 0),
    'slow_hours', COALESCE((
      SELECT json_agg(hour) 
      FROM (
        SELECT hour 
        FROM daily_sales 
        WHERE transaction_count < (SELECT MAX(transaction_count) * 0.25 FROM daily_sales)
      ) AS slow
    ), '[]'::json),
    'top_items', COALESCE((
      SELECT json_agg(item_name) 
      FROM (
        SELECT item_name 
        FROM item_sales 
        LIMIT 3
      ) AS top
    ), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze inventory data and generate insights
CREATE OR REPLACE FUNCTION analyze_daily_inventory(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH low_stock AS (
    SELECT 
      item_name
    FROM inventory
    WHERE user_id = user_id_param
      AND quantity < (par_level * 0.2)
  ),
  expiring_soon AS (
    SELECT 
      item_name
    FROM inventory
    WHERE user_id = user_id_param
      AND expiry_date IS NOT NULL
      AND expiry_date <= (CURRENT_DATE + INTERVAL '2 days')
  ),
  no_sales AS (
    SELECT 
      i.item_name
    FROM inventory i
    LEFT JOIN sales s ON i.item_name = s.item_name 
      AND s.user_id = user_id_param 
      AND DATE(s.timestamp) = CURRENT_DATE
    WHERE i.user_id = user_id_param
      AND s.id IS NULL
  )
  SELECT json_build_object(
    'low_stock', COALESCE((
      SELECT json_agg(item_name) 
      FROM low_stock
    ), '[]'::json),
    'potential_waste', COALESCE((
      SELECT json_agg(item_name) 
      FROM expiring_soon
    ), '[]'::json),
    'no_sales_today', COALESCE((
      SELECT json_agg(item_name) 
      FROM no_sales
    ), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze staffing data and generate insights
CREATE OR REPLACE FUNCTION analyze_daily_staffing(user_id_param UUID, date_param DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH hourly_sales AS (
    SELECT 
      EXTRACT(HOUR FROM timestamp) AS hour,
      COUNT(*) AS transaction_count
    FROM sales
    WHERE user_id = user_id_param
      AND DATE(timestamp) = date_param
    GROUP BY EXTRACT(HOUR FROM timestamp)
  ),
  hourly_staff AS (
    SELECT 
      EXTRACT(HOUR FROM generate_series) AS hour,
      COUNT(DISTINCT s.id) AS staff_count
    FROM 
      generate_series(
        date_param + TIME '06:00:00',
        date_param + TIME '22:00:00',
        INTERVAL '1 hour'
      ),
      staff st
      JOIN shifts s ON st.id = s.staff_id
    WHERE st.user_id = user_id_param
      AND s.start_time <= generate_series
      AND s.end_time > generate_series
    GROUP BY EXTRACT(HOUR FROM generate_series)
  ),
  staff_efficiency AS (
    SELECT 
      hs.hour,
      hs.transaction_count,
      COALESCE(hst.staff_count, 0) AS staff_count,
      CASE 
        WHEN COALESCE(hst.staff_count, 0) = 0 THEN 0
        ELSE hs.transaction_count / COALESCE(hst.staff_count, 1)
      END AS transactions_per_staff
    FROM hourly_sales hs
    LEFT JOIN hourly_staff hst ON hs.hour = hst.hour
  )
  SELECT json_build_object(
    'total_staff_hours', COALESCE((
      SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
      FROM shifts s
      JOIN staff st ON s.staff_id = st.id
      WHERE st.user_id = user_id_param
        AND DATE(s.start_time) = date_param
    ), 0),
    'overstaffed_hours', COALESCE((
      SELECT json_agg(hour) 
      FROM (
        SELECT hour 
        FROM staff_efficiency 
        WHERE transactions_per_staff < 5
          AND staff_count > 1
      ) AS overstaffed
    ), '[]'::json),
    'understaffed_hours', COALESCE((
      SELECT json_agg(hour) 
      FROM (
        SELECT hour 
        FROM staff_efficiency 
        WHERE transactions_per_staff > 15
      ) AS understaffed
    ), '[]'::json),
    'avg_transactions_per_staff_hour', COALESCE((
      SELECT AVG(transactions_per_staff)
      FROM staff_efficiency
    ), 0)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate end-of-day suggestions
CREATE OR REPLACE FUNCTION generate_daily_suggestions(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  sales_insights JSON;
  inventory_insights JSON;
  staffing_insights JSON;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get insights
  SELECT analyze_daily_sales(user_id_param, today) INTO sales_insights;
  SELECT analyze_daily_inventory(user_id_param) INTO inventory_insights;
  SELECT analyze_daily_staffing(user_id_param, today) INTO staffing_insights;
  
  -- Generate sales suggestions
  IF jsonb_array_length(sales_insights->'slow_hours') > 0 THEN
    INSERT INTO suggestions (user_id, suggestion_text, category, priority, details)
    VALUES (
      user_id_param,
      'Consider running a promotion during slow hours to increase foot traffic',
      'sales',
      'medium',
      'Slow hours detected: ' || (sales_insights->>'slow_hours')
    );
  END IF;
  
  IF jsonb_array_length(sales_insights->'top_items') > 0 THEN
    INSERT INTO suggestions (user_id, suggestion_text, category, priority, details)
    VALUES (
      user_id_param,
      'Feature your top selling items more prominently tomorrow',
      'sales',
      'low',
      'Top items today: ' || (sales_insights->>'top_items')
    );
  END IF;
  
  -- Generate inventory suggestions
  IF jsonb_array_length(inventory_insights->'low_stock') > 0 THEN
    INSERT INTO suggestions (user_id, suggestion_text, category, priority, details)
    VALUES (
      user_id_param,
      'Restock these items soon',
      'inventory',
      'high',
      'Low stock items: ' || (inventory_insights->>'low_stock')
    );
  END IF;
  
  IF jsonb_array_length(inventory_insights->'potential_waste') > 0 THEN
    INSERT INTO suggestions (user_id, suggestion_text, category, priority, details)
    VALUES (
      user_id_param,
      'These items are expiring soon and should be promoted',
      'inventory',
      'high',
      'Expiring items: ' || (inventory_insights->>'potential_waste')
    );
  END IF;
  
  -- Generate staffing suggestions
  IF jsonb_array_length(staffing_insights->'overstaffed_hours') > 0 THEN
    INSERT INTO suggestions (user_id, suggestion_text, category, priority, details)
    VALUES (
      user_id_param,
      'Consider reducing staff during these hours tomorrow',
      'staffing',
      'medium',
      'Overstaffed hours: ' || (staffing_insights->>'overstaffed_hours')
    );
  END IF;
  
  IF jsonb_array_length(staffing_insights->'understaffed_hours') > 0 THEN
    INSERT INTO suggestions (user_id, suggestion_text, category, priority, details)
    VALUES (
      user_id_param,
      'Consider adding staff during these busy hours tomorrow',
      'staffing',
      'high',
      'Understaffed hours: ' || (staffing_insights->>'understaffed_hours')
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to generate suggestions daily at 8 PM
-- Note: This requires the pg_cron extension to be enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 20 * * *', $$
--   SELECT generate_daily_suggestions(id) FROM users;
-- $$);
