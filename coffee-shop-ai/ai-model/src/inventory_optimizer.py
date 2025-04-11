import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import joblib
import os

class InventoryOptimizer:
    """
    A model to optimize inventory levels for a coffee shop based on sales data and product information.
    Uses a Random Forest Regressor to predict optimal par levels and reorder points.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the inventory optimizer.
        
        Args:
            model_path (str, optional): Path to a saved model file. If provided, the model will be loaded.
        """
        self.model = None
        self.features = ['avg_daily_sales', 'lead_time_days', 'shelf_life_days', 'unit_cost', 'is_perishable']
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
    
    def preprocess_data(self, data):
        """
        Preprocess the inventory and sales data for training or prediction.
        
        Args:
            data (pd.DataFrame): DataFrame containing inventory items with sales data
            
        Returns:
            tuple: X (features) and y (target) if target column exists, otherwise just X
        """
        # Fill missing values
        for feature in self.features:
            if feature in data.columns:
                data[feature] = data[feature].fillna(0)
        
        # Create binary flag for perishable items
        if 'shelf_life_days' in data.columns and 'is_perishable' not in data.columns:
            data['is_perishable'] = data['shelf_life_days'].apply(lambda x: 1 if x > 0 and x < 30 else 0)
        
        # Select features for model
        X_columns = [col for col in self.features if col in data.columns]
        X = data[X_columns]
        
        # Return X and y if target exists, otherwise just X
        if 'optimal_par_level' in data.columns:
            y = data['optimal_par_level']
            return X, y
        else:
            return X
    
    def train(self, data):
        """
        Train the model on historical inventory and sales data.
        
        Args:
            data (pd.DataFrame): DataFrame containing inventory items with sales data and optimal par levels
            
        Returns:
            self: The trained model instance
        """
        X, y = self.preprocess_data(data)
        self.model.fit(X, y)
        return self
    
    def predict_par_levels(self, data):
        """
        Predict optimal par levels for inventory items.
        
        Args:
            data (pd.DataFrame): DataFrame containing inventory items with sales data
            
        Returns:
            np.array: Predicted optimal par levels
        """
        X = self.preprocess_data(data)
        return self.model.predict(X)
    
    def calculate_reorder_point(self, avg_daily_sales, lead_time_days, safety_stock_days=2):
        """
        Calculate the reorder point for an inventory item.
        
        Args:
            avg_daily_sales (float): Average daily sales of the item
            lead_time_days (int): Number of days it takes to receive new stock
            safety_stock_days (int): Number of days of safety stock to maintain
            
        Returns:
            float: Reorder point quantity
        """
        return avg_daily_sales * (lead_time_days + safety_stock_days)
    
    def optimize_inventory(self, inventory_data, sales_data, lead_times=None):
        """
        Optimize inventory levels based on sales data and product information.
        
        Args:
            inventory_data (pd.DataFrame): Current inventory data with item details
            sales_data (pd.DataFrame): Historical sales data
            lead_times (dict, optional): Dictionary mapping item names to lead times in days
            
        Returns:
            pd.DataFrame: Optimized inventory with par levels and reorder points
        """
        # Calculate average daily sales for each item
        sales_by_item = sales_data.groupby('item_name').agg(
            total_quantity=('quantity', 'sum'),
            total_days=('timestamp', lambda x: (max(x) - min(x)).days + 1)
        )
        
        sales_by_item['avg_daily_sales'] = sales_by_item['total_quantity'] / sales_by_item['total_days']
        
        # Merge with inventory data
        inventory = inventory_data.copy()
        inventory = inventory.merge(
            sales_by_item[['avg_daily_sales']], 
            left_on='item_name', 
            right_index=True, 
            how='left'
        )
        
        # Fill missing values
        inventory['avg_daily_sales'] = inventory['avg_daily_sales'].fillna(0)
        
        # Add lead time information
        if lead_times:
            inventory['lead_time_days'] = inventory['item_name'].map(lead_times).fillna(2)
        else:
            inventory['lead_time_days'] = 2  # Default lead time
        
        # Predict optimal par levels
        if self.model:
            inventory['optimal_par_level'] = self.predict_par_levels(inventory)
        else:
            # Simple heuristic if model not trained
            inventory['optimal_par_level'] = inventory['avg_daily_sales'] * 7  # 7-day supply
        
        # Calculate reorder points
        inventory['reorder_point'] = inventory.apply(
            lambda row: self.calculate_reorder_point(
                row['avg_daily_sales'], 
                row['lead_time_days']
            ), 
            axis=1
        )
        
        # Calculate days until reorder
        inventory['days_until_reorder'] = np.where(
            inventory['avg_daily_sales'] > 0,
            (inventory['quantity'] - inventory['reorder_point']) / inventory['avg_daily_sales'],
            float('inf')
        )
        
        # Flag items that need reordering
        inventory['needs_reorder'] = inventory['quantity'] <= inventory['reorder_point']
        
        # Flag items with excess stock
        inventory['excess_stock'] = inventory['quantity'] > (inventory['optimal_par_level'] * 1.5)
        
        return inventory
    
    def generate_recommendations(self, optimized_inventory):
        """
        Generate inventory recommendations based on optimized inventory data.
        
        Args:
            optimized_inventory (pd.DataFrame): Optimized inventory data
            
        Returns:
            dict: Recommendations for inventory management
        """
        recommendations = {
            'items_to_reorder': [],
            'excess_items': [],
            'expiring_soon': [],
            'par_level_adjustments': []
        }
        
        # Items to reorder
        reorder_items = optimized_inventory[optimized_inventory['needs_reorder']]
        for _, item in reorder_items.iterrows():
            recommendations['items_to_reorder'].append({
                'item_name': item['item_name'],
                'current_quantity': item['quantity'],
                'reorder_point': item['reorder_point'],
                'order_quantity': max(item['optimal_par_level'] - item['quantity'], 0),
                'days_until_stockout': max(item['quantity'] / item['avg_daily_sales'], 0) if item['avg_daily_sales'] > 0 else float('inf')
            })
        
        # Items with excess stock
        excess_items = optimized_inventory[optimized_inventory['excess_stock']]
        for _, item in excess_items.iterrows():
            recommendations['excess_items'].append({
                'item_name': item['item_name'],
                'current_quantity': item['quantity'],
                'optimal_quantity': item['optimal_par_level'],
                'excess_amount': item['quantity'] - item['optimal_par_level']
            })
        
        # Items expiring soon
        if 'expiry_date' in optimized_inventory.columns:
            today = datetime.now().date()
            expiring_soon = optimized_inventory[
                (optimized_inventory['expiry_date'].notna()) & 
                (optimized_inventory['expiry_date'] <= today + timedelta(days=3))
            ]
            
            for _, item in expiring_soon.iterrows():
                days_until_expiry = (item['expiry_date'] - today).days
                recommendations['expiring_soon'].append({
                    'item_name': item['item_name'],
                    'current_quantity': item['quantity'],
                    'expiry_date': item['expiry_date'].strftime('%Y-%m-%d'),
                    'days_until_expiry': days_until_expiry
                })
        
        # Par level adjustment recommendations
        for _, item in optimized_inventory.iterrows():
            if abs(item['par_level'] - item['optimal_par_level']) / max(item['par_level'], 1) > 0.2:
                recommendations['par_level_adjustments'].append({
                    'item_name': item['item_name'],
                    'current_par_level': item['par_level'],
                    'recommended_par_level': item['optimal_par_level'],
                    'percent_change': (item['optimal_par_level'] - item['par_level']) / item['par_level'] * 100 if item['par_level'] > 0 else float('inf')
                })
        
        return recommendations
    
    def save_model(self, path):
        """
        Save the trained model to a file.
        
        Args:
            path (str): Path to save the model
        """
        if self.model is not None:
            model_data = {
                'model': self.model,
                'features': self.features
            }
            joblib.dump(model_data, path)
    
    def load_model(self, path):
        """
        Load a trained model from a file.
        
        Args:
            path (str): Path to the saved model
        """
        model_data = joblib.load(path)
        self.model = model_data['model']
        self.features = model_data['features']

# Example usage
if __name__ == "__main__":
    # Create sample data
    np.random.seed(42)
    
    # Sample inventory data
    inventory_data = pd.DataFrame({
        'item_name': ['Coffee Beans', 'Milk', 'Sugar', 'Cups', 'Muffins'],
        'quantity': [50, 20, 30, 100, 15],
        'par_level': [100, 40, 50, 200, 30],
        'unit_cost': [12.00, 4.00, 3.00, 0.15, 2.50],
        'shelf_life_days': [90, 7, 365, None, 3],
        'category': ['beverage', 'dairy', 'dry goods', 'supplies', 'food']
    })
    
    # Sample sales data
    dates = pd.date_range(start='2025-01-01', end='2025-03-31', freq='D')
    sales_data = []
    
    for date in dates:
        for item in inventory_data['item_name']:
            # Different sales patterns for different items
            if item == 'Coffee Beans':
                daily_sales = np.random.poisson(10)
            elif item == 'Milk':
                daily_sales = np.random.poisson(15)
            elif item == 'Sugar':
                daily_sales = np.random.poisson(5)
            elif item == 'Cups':
                daily_sales = np.random.poisson(30)
            else:  # Muffins
                daily_sales = np.random.poisson(20)
            
            sales_data.append({
                'timestamp': date,
                'item_name': item,
                'quantity': daily_sales
            })
    
    sales_df = pd.DataFrame(sales_data)
    
    # Create and use optimizer
    optimizer = InventoryOptimizer()
    
    # Optimize inventory
    optimized_inventory = optimizer.optimize_inventory(
        inventory_data,
        sales_df,
        lead_times={'Coffee Beans': 5, 'Milk': 1, 'Sugar': 3, 'Cups': 7, 'Muffins': 1}
    )
    
    # Generate recommendations
    recommendations = optimizer.generate_recommendations(optimized_inventory)
    
    # Print recommendations
    print("Items to reorder:")
    for item in recommendations['items_to_reorder']:
        print(f"  {item['item_name']}: Order {item['order_quantity']:.0f} units (current: {item['current_quantity']}, reorder point: {item['reorder_point']:.0f})")
    
    print("\nExcess items:")
    for item in recommendations['excess_items']:
        print(f"  {item['item_name']}: {item['excess_amount']:.0f} units excess (current: {item['current_quantity']}, optimal: {item['optimal_quantity']:.0f})")
    
    # Save model
    optimizer.save_model('inventory_optimizer_model.joblib')
