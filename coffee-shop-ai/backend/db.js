const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Database schema setup
const setupDatabase = async () => {
  try {
    // Create tables if they don't exist
    
    // Users table
    const { error: usersError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'users',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        email text unique not null,
        created_at timestamp with time zone default now(),
        shop_name text,
        location text,
        subscription_tier text default 'free'
      `
    });
    
    if (usersError) throw usersError;
    
    // Sales table
    const { error: salesError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'sales',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references users(id),
        timestamp timestamp with time zone default now(),
        amount decimal not null,
        item_name text not null,
        category text,
        clover_order_id text
      `
    });
    
    if (salesError) throw salesError;
    
    // Inventory table
    const { error: inventoryError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'inventory',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references users(id),
        item_name text not null,
        quantity integer not null,
        unit_cost decimal,
        expiry_date date,
        category text,
        clover_item_id text
      `
    });
    
    if (inventoryError) throw inventoryError;
    
    // Staff table
    const { error: staffError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'staff',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references users(id),
        name text not null,
        hourly_rate decimal,
        role text,
        clover_employee_id text
      `
    });
    
    if (staffError) throw staffError;
    
    // Shifts table
    const { error: shiftsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'shifts',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        staff_id uuid references staff(id),
        start_time timestamp with time zone not null,
        end_time timestamp with time zone not null,
        actual_hours decimal
      `
    });
    
    if (shiftsError) throw shiftsError;
    
    // Suggestions table
    const { error: suggestionsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'suggestions',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references users(id),
        created_at timestamp with time zone default now(),
        suggestion_text text not null,
        category text not null,
        priority text,
        implemented boolean default false
      `
    });
    
    if (suggestionsError) throw suggestionsError;
    
    // Forecasts table
    const { error: forecastsError } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'forecasts',
      columns: `
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references users(id),
        forecast_date date not null,
        forecast_hour integer,
        predicted_customers integer,
        predicted_sales decimal,
        confidence_score decimal
      `
    });
    
    if (forecastsError) throw forecastsError;
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
};

module.exports = {
  supabase,
  setupDatabase
};
