import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_large_inventory_data(num_items):
    """
    Generate a large inventory dataset with the specified number of items.
    
    Args:
        num_items (int): Number of unique inventory items to generate.
    
    Returns:
        pd.DataFrame: Inventory data.
    """
    np.random.seed(42)
    item_names = [f"Item_{i}" for i in range(1, num_items + 1)]
    inventory_data = pd.DataFrame({
        'item_name': item_names,
        'quantity': np.random.randint(10, 500, size=num_items),
        'par_level': np.random.randint(50, 1000, size=num_items),
        'unit_cost': np.random.uniform(1.0, 50.0, size=num_items).round(2),
        'shelf_life_days': np.random.choice([7, 30, 90, 365, None], size=num_items, p=[0.2, 0.3, 0.3, 0.1, 0.1]),
        'category': np.random.choice(['beverage', 'dairy', 'dry goods', 'supplies', 'food'], size=num_items)
    })
    return inventory_data

def generate_sales_data(num_items, start_date, end_date, chunk_size=100000):
    """
    Generate a large sales dataset in chunks using a generator.
    
    Args:
        num_items (int): Number of unique inventory items.
        start_date (str): Start date for sales data (YYYY-MM-DD).
        end_date (str): End date for sales data (YYYY-MM-DD).
        chunk_size (int): Number of records to generate per chunk.
    
    Yields:
        pd.DataFrame: Chunk of sales data.
    """
    np.random.seed(42)
    item_names = [f"Item_{i}" for i in range(1, num_items + 1)]
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    
    while True:
        sales_data = {
            'timestamp': np.random.choice(date_range, size=chunk_size),
            'item_name': np.random.choice(item_names, size=chunk_size),
            'quantity': np.random.poisson(lam=20, size=chunk_size)
        }
        yield pd.DataFrame(sales_data)

if __name__ == "__main__":
    # Generate inventory data for 10,000 items
    inventory_data = generate_large_inventory_data(num_items=10000)
    inventory_data.to_csv('inventory_data.csv', index=False)
    print("Inventory data saved to 'inventory_data.csv'.")

    # Generate sales data for 10,000 items between 2025-01-01 and 2025-12-31
    sales_generator = generate_sales_data(num_items=10000, start_date='2025-01-01', end_date='2025-12-31')

    # Save sales data in chunks
    chunk_count = 0
    for sales_chunk in sales_generator:
        sales_chunk.to_csv(f'sales_data_chunk_{chunk_count}.csv', index=False)
        chunk_count += 1
        print(f"Generated chunk {chunk_count} with {len(sales_chunk)} records.")
        
        # Stop after generating 2 million records
        if chunk_count * len(sales_chunk) >= 2000000:
            break
    print("Sales data generation complete.")