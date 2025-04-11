-- Triggers for real-time updates and data processing

-- Trigger to update inventory when a sale is made
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Reduce inventory quantity based on the sale
  UPDATE inventory
  SET quantity = quantity - 1
  WHERE user_id = NEW.user_id
    AND item_name = NEW.item_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_sale_insert
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_sale();

-- Trigger to create a forecast entry when a new user is created
CREATE OR REPLACE FUNCTION initialize_forecasts_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  day INT;
  hour INT;
  base_customers INT;
BEGIN
  -- Create initial forecasts for the next 7 days
  FOR day IN 0..6 LOOP
    -- For each hour of operation (6am-10pm)
    FOR hour IN 6..21 LOOP
      -- Set base customer count based on time of day and day of week
      IF hour BETWEEN 7 AND 9 THEN -- Morning rush
        base_customers := 30;
      ELSIF hour BETWEEN 12 AND 13 THEN -- Lunch rush
        base_customers := 25;
      ELSIF hour BETWEEN 17 AND 18 THEN -- Evening rush
        base_customers := 20;
      ELSE
        base_customers := 10;
      END IF;
      
      -- Adjust for weekends
      IF day >= 5 THEN -- Weekend
        base_customers := base_customers * 1.5;
      END IF;
      
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
        NEW.id,
        CURRENT_DATE + (day || ' days')::INTERVAL,
        hour,
        day,
        base_customers,
        base_customers * 7, -- Assuming $7 average sale
        0.7 -- Default confidence score
      );
    END LOOP;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION initialize_forecasts_for_new_user();

-- Trigger to update forecasts based on actual sales
CREATE OR REPLACE FUNCTION update_forecasts_from_sales()
RETURNS TRIGGER AS $$
DECLARE
  sale_hour INT;
  sale_day_of_week INT;
  current_forecast RECORD;
BEGIN
  -- Extract hour and day of week from sale timestamp
  sale_hour := EXTRACT(HOUR FROM NEW.timestamp);
  sale_day_of_week := EXTRACT(DOW FROM NEW.timestamp);
  
  -- Get current forecast for this hour and day of week
  SELECT * INTO current_forecast
  FROM forecasts
  WHERE user_id = NEW.user_id
    AND forecast_hour = sale_hour
    AND day_of_week = sale_day_of_week
    AND forecast_date > CURRENT_DATE
  ORDER BY forecast_date
  LIMIT 1;
  
  -- If forecast exists, update it with a slight adjustment based on actual sales
  IF FOUND THEN
    UPDATE forecasts
    SET 
      predicted_customers = (predicted_customers * 0.9) + 0.1, -- Slight adjustment up
      predicted_sales = (predicted_sales * 0.9) + (NEW.amount * 0.1), -- Adjust sales prediction
      confidence_score = LEAST(confidence_score + 0.01, 0.95) -- Increase confidence slightly
    WHERE id = current_forecast.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_sale_insert_update_forecasts
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION update_forecasts_from_sales();

-- Function to refresh forecasts daily
CREATE OR REPLACE FUNCTION refresh_forecasts()
RETURNS VOID AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- For each user
  FOR user_record IN SELECT id FROM users LOOP
    -- Delete old forecasts
    DELETE FROM forecasts
    WHERE user_id = user_record.id
      AND forecast_date < CURRENT_DATE;
    
    -- Add new forecast for 7 days out
    INSERT INTO forecasts (
      user_id,
      forecast_date,
      forecast_hour,
      day_of_week,
      predicted_customers,
      predicted_sales,
      confidence_score
    )
    SELECT
      user_record.id,
      CURRENT_DATE + INTERVAL '7 days',
      forecast_hour,
      day_of_week,
      predicted_customers,
      predicted_sales,
      confidence_score
    FROM forecasts
    WHERE user_id = user_record.id
      AND forecast_date = CURRENT_DATE + INTERVAL '6 days';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to refresh forecasts daily at midnight
-- Note: This requires the pg_cron extension to be enabled
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 0 * * *', $$
--   SELECT refresh_forecasts();
-- $$);
