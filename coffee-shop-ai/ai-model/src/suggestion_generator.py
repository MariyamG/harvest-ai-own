import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

class SuggestionGenerator:
    """
    A model to generate end-of-day operational suggestions for coffee shop owners
    based on sales, inventory, and staffing data.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the suggestion generator.
        
        Args:
            model_path (str, optional): Path to a saved model file. If provided, the model will be loaded.
        """
        self.model = None
        self.suggestion_templates = self._load_suggestion_templates()
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    def _load_suggestion_templates(self):
        """
        Load suggestion templates for different categories.
        
        Returns:
            dict: Dictionary of suggestion templates by category
        """
        return {
            'inventory': {
                'low_stock': "Restock {item_name} soon, current stock is below {percent:.0f}% of par level",
                'expiring_soon': "Promote {item_name} tomorrow, {quantity} will expire in {days} days",
                'excess_stock': "Consider reducing par level for {item_name}, consistently overstocked by {percent:.0f}%",
                'adjust_par': "Adjust par level for {item_name} from {current_par} to {recommended_par} based on sales trends"
            },
            'staffing': {
                'understaffed': "Consider adding staff during {start_hour}-{end_hour} {day_description}, customer wait times increased by {percent:.0f}%",
                'overstaffed': "Reduce staff by {count} during {start_hour}-{end_hour} {day_description}, consistently overstaffed",
                'shift_adjustment': "Adjust {staff_name}'s shift to start at {start_hour} instead of {current_start} to better cover peak hours",
                'role_distribution': "Ensure at least {count} {role} during {start_hour}-{end_hour} to handle {reason}"
            },
            'sales': {
                'slow_period': "Consider running a promotion during {start_hour}-{end_hour}, sales are consistently low during this period",
                'popular_item': "Feature {item_name} more prominently, sales increased by {percent:.0f}% in the past week",
                'bundle_opportunity': "Create a bundle with {item1} and {item2}, customers frequently purchase these together",
                'price_adjustment': "Consider {direction} price for {item_name} by {amount:.0f}%, {reason}"
            },
            'operations': {
                'layout_change': "Rearrange {area} to improve flow, customers currently spend {time} minutes waiting",
                'equipment_maintenance': "Schedule maintenance for {equipment}, efficiency has decreased by {percent:.0f}%",
                'training_opportunity': "Provide additional training on {topic} for staff, {reason}",
                'opening_hours': "Consider {change} opening hours on {day}, {reason}"
            }
        }
    
    def analyze_sales_data(self, sales_data):
        """
        Analyze sales data to identify patterns and trends.
        
        Args:
            sales_data (pd.DataFrame): Historical sales data
            
        Returns:
            dict: Sales analysis results
        """
        results = {
            'total_sales': sales_data['amount'].sum(),
            'transaction_count': len(sales_data),
            'average_transaction': sales_data['amount'].mean(),
            'hourly_sales': {},
            'daily_sales': {},
            'top_items': [],
            'slow_periods': [],
            'peak_periods': []
        }
        
        # Hourly sales analysis
        hourly_sales = sales_data.groupby(sales_data['timestamp'].dt.hour).agg({
            'amount': 'sum',
            'timestamp': 'count'
        }).rename(columns={'timestamp': 'transaction_count'})
        
        for hour, data in hourly_sales.iterrows():
            results['hourly_sales'][int(hour)] = {
                'sales': float(data['amount']),
                'transactions': int(data['transaction_count'])
            }
        
        # Identify slow and peak periods
        avg_transactions = hourly_sales['transaction_count'].mean()
        for hour, data in hourly_sales.iterrows():
            if data['transaction_count'] < avg_transactions * 0.5:
                results['slow_periods'].append({
                    'hour': int(hour),
                    'transactions': int(data['transaction_count']),
                    'percent_below_average': float((avg_transactions - data['transaction_count']) / avg_transactions * 100)
                })
            elif data['transaction_count'] > avg_transactions * 1.5:
                results['peak_periods'].append({
                    'hour': int(hour),
                    'transactions': int(data['transaction_count']),
                    'percent_above_average': float((data['transaction_count'] - avg_transactions) / avg_transactions * 100)
                })
        
        # Daily sales analysis
        daily_sales = sales_data.groupby(sales_data['timestamp'].dt.dayofweek).agg({
            'amount': 'sum',
            'timestamp': 'count'
        }).rename(columns={'timestamp': 'transaction_count'})
        
        for day, data in daily_sales.iterrows():
            results['daily_sales'][int(day)] = {
                'sales': float(data['amount']),
                'transactions': int(data['transaction_count'])
            }
        
        # Top selling items
        item_sales = sales_data.groupby('item_name').agg({
            'amount': 'sum',
            'item_name': 'count'
        }).rename(columns={'item_name': 'quantity'}).sort_values('quantity', ascending=False)
        
        for item, data in item_sales.head(5).iterrows():
            results['top_items'].append({
                'item_name': item,
                'quantity': int(data['quantity']),
                'sales': float(data['amount']),
                'percent_of_total': float(data['quantity'] / len(sales_data) * 100)
            })
        
        return results
    
    def analyze_inventory_data(self, inventory_data, sales_data):
        """
        Analyze inventory data to identify issues and opportunities.
        
        Args:
            inventory_data (pd.DataFrame): Current inventory data
            sales_data (pd.DataFrame): Recent sales data
            
        Returns:
            dict: Inventory analysis results
        """
        results = {
            'low_stock_items': [],
            'expiring_items': [],
            'excess_stock_items': [],
            'par_level_adjustments': []
        }
        
        # Calculate daily sales rate for each item
        today = datetime.now().date()
        recent_sales = sales_data[sales_data['timestamp'] >= (datetime.now() - timedelta(days=14))]
        
        item_daily_sales = recent_sales.groupby('item_name').agg({
            'item_name': 'count'
        }).rename(columns={'item_name': 'daily_sales'})
        
        item_daily_sales['daily_sales'] = item_daily_sales['daily_sales'] / 14  # Average over 14 days
        
        # Merge with inventory
        inventory = inventory_data.copy()
        inventory = inventory.merge(
            item_daily_sales, 
            left_on='item_name', 
            right_index=True, 
            how='left'
        )
        
        inventory['daily_sales'] = inventory['daily_sales'].fillna(0)
        
        # Identify low stock items
        for _, item in inventory.iterrows():
            # Low stock check
            if item['quantity'] < item['par_level'] * 0.2:
                results['low_stock_items'].append({
                    'item_name': item['item_name'],
                    'current_quantity': int(item['quantity']),
                    'par_level': int(item['par_level']),
                    'percent_of_par': float(item['quantity'] / item['par_level'] * 100),
                    'days_until_stockout': float(item['quantity'] / max(item['daily_sales'], 0.1))
                })
            
            # Expiring items check
            if pd.notna(item['expiry_date']):
                days_until_expiry = (item['expiry_date'] - today).days
                if days_until_expiry <= 3 and days_until_expiry >= 0:
                    results['expiring_items'].append({
                        'item_name': item['item_name'],
                        'quantity': int(item['quantity']),
                        'days_until_expiry': int(days_until_expiry),
                        'daily_sales': float(item['daily_sales'])
                    })
            
            # Excess stock check
            if item['quantity'] > item['par_level'] * 1.5 and item['daily_sales'] > 0:
                days_of_stock = item['quantity'] / item['daily_sales']
                if days_of_stock > 30:  # More than a month of stock
                    results['excess_stock_items'].append({
                        'item_name': item['item_name'],
                        'current_quantity': int(item['quantity']),
                        'par_level': int(item['par_level']),
                        'percent_over_par': float((item['quantity'] - item['par_level']) / item['par_level'] * 100),
                        'days_of_stock': float(days_of_stock)
                    })
            
            # Par level adjustment check
            if item['daily_sales'] > 0:
                recommended_par = item['daily_sales'] * 7  # 7-day supply
                par_difference = abs(recommended_par - item['par_level'])
                if par_difference / item['par_level'] > 0.3:  # 30% difference
                    results['par_level_adjustments'].append({
                        'item_name': item['item_name'],
                        'current_par': int(item['par_level']),
                        'recommended_par': int(recommended_par),
                        'percent_change': float((recommended_par - item['par_level']) / item['par_level'] * 100)
                    })
        
        return results
    
    def analyze_staffing_data(self, staff_schedule, sales_data, peak_hour_forecast):
        """
        Analyze staffing data to identify optimization opportunities.
        
        Args:
            staff_schedule (pd.DataFrame): Current staff schedule
            sales_data (pd.DataFrame): Recent sales data
            peak_hour_forecast (pd.DataFrame): Peak hour forecast
            
        Returns:
            dict: Staffing analysis results
        """
        results = {
            'understaffed_periods': [],
            'overstaffed_periods': [],
            'shift_adjustments': [],
            'role_distribution_issues': []
        }
        
        # Group sales by hour and day of week
        hourly_sales = sales_data.groupby([
            sales_data['timestamp'].dt.dayofweek,
            sales_data['timestamp'].dt.hour
        ]).agg({
            'timestamp': 'count'
        }).rename(columns={'timestamp': 'transaction_count'}).reset_index()
        
        # Calculate average transactions per staff
        for _, hour_data in hourly_sales.iterrows():
            day = hour_data['timestamp'].dayofweek
            hour = hour_data['timestamp'].hour
            transactions = hour_data['transaction_count']
            
            # Count staff for this day and hour
            staff_count = len(staff_schedule[
                (staff_schedule['day_of_week'] == day) & 
                (staff_schedule['start_hour'] <= hour) & 
                (staff_schedule['end_hour'] > hour)
            ])
            
            if staff_count == 0:
                continue  # Skip if no staff scheduled
            
            transactions_per_staff = transactions / staff_count
            
            # Check for understaffing
            if transactions_per_staff > 15:  # More than 15 transactions per staff hour
                results['understaffed_periods'].append({
                    'day_of_week': int(day),
                    'hour': int(hour),
                    'transactions': int(transactions),
                    'staff_count': int(staff_count),
                    'transactions_per_staff': float(transactions_per_staff),
                    'percent_over_target': float((transactions_per_staff - 15) / 15 * 100)
                })
            
            # Check for overstaffing
            elif transactions_per_staff < 5 and staff_count > 1:  # Less than 5 transactions per staff hour
                results['overstaffed_periods'].append({
                    'day_of_week': int(day),
                    'hour': int(hour),
                    'transactions': int(transactions),
                    'staff_count': int(staff_count),
                    'transactions_per_staff': float(transactions_per_staff),
                    'recommended_staff': max(1, int(transactions / 10))  # Aim for 10 transactions per staff
                })
        
        # Check shift adjustments based on peak hours
        if peak_hour_forecast is not None:
            for day_of_week, day_forecast in peak_hour_forecast.groupby('day_of_week'):
                peak_hours = day_forecast[day_forecast['is_peak']]['hour'].tolist()
                
                if not peak_hours:
                    continue
                
                # Get staff for this day
                day_staff = staff_schedule[staff_schedule['day_of_week'] == day_of_week]
                
                for _, staff in day_staff.iterrows():
                    # Check if shift covers peak hours
                    staff_hours = list(range(staff['start_hour'], staff['end_hour']))
                    covered_peaks = [h for h in peak_hours if h in staff_hours]
                    missed_peaks = [h for h in peak_hours if h not in staff_hours]
                    
                    # If staff misses some peak hours but could cover them with a shift adjustment
                    if missed_peaks and len(covered_peaks) > 0:
                        # Find earliest peak hour
                        earliest_peak = min(peak_hours)
                        
                        # If staff starts after earliest peak, suggest earlier start
                        if staff['start_hour'] > earliest_peak:
                            results['shift_adjustments'].append({
                                'staff_id': staff['staff_id'],
                                'staff_name': staff.get('staff_name', f"Staff #{staff['staff_id']}"),
                                'current_start': int(staff['start_hour']),
                                'recommended_start': int(earliest_peak),
                                'day_of_week': int(day_of_week),
                                'missed_peak_hours': missed_peaks
                            })
        
        # Check role distribution
        if 'role' in staff_schedule.columns:
            for day_of_week, day_staff in staff_schedule.groupby('day_of_week'):
                for hour in range(6, 22):  # Assuming 6 AM to 10 PM operation
                    hour_staff = day_staff[
                        (day_staff['start_hour'] <= hour) & 
                        (day_staff['end_hour'] > hour)
                    ]
                    
                    if len(hour_staff) == 0:
                        continue
                    
                    # Count roles
                    role_counts = hour_staff['role'].value_counts().to_dict()
                    
                    # Check if we have at least one manager during busy hours
                    is_busy_hour = hour in [8, 9, 12, 13, 17, 18]  # Morning, lunch, evening rush
                    if is_busy_hour and role_counts.get('Manager', 0) == 0:
                        results['role_distribution_issues'].append({
                            'day_of_week': int(day_of_week),
                            'hour': int(hour),
                            'issue': 'No manager during busy hour',
                            'role': 'Manager',
                            'recommended_count': 1,
                            'current_count': 0
                        })
                    
                    # Check if we have enough baristas during peak hours
                    is_peak = False
                    if peak_hour_forecast is not None:
                        peak_hours = peak_hour_forecast[
                            (peak_hour_forecast['day_of_week'] == day_of_week) & 
                            (peak_hour_forecast['is_peak'])
                        ]['hour'].tolist()
                        is_peak = hour in peak_hours
                    
                    if is_peak and role_counts.get('Barista', 0) < 2:
                        results['role_distribution_issues'].append({
                            'day_of_week': int(day_of_week),
                            'hour': int(hour),
                            'issue': 'Not enough baristas during peak hour',
                            'role': 'Barista',
                            'recommended_count': 2,
                            'current_count': role_counts.get('Barista', 0)
                        })
        
        return results
    
    def generate_suggestions(self, sales_data, inventory_data, staff_schedule=None, peak_hour_forecast=None):
        """
        Generate operational suggestions based on data analysis.
        
        Args:
            sales_data (pd.DataFrame): Recent sales data
            inventory_data (pd.DataFrame): Current inventory data
            staff_schedule (pd.DataFrame, optional): Current staff schedule
            peak_hour_forecast (pd.DataFrame, optional): Peak hour forecast
            
        Returns:
            list: Generated suggestions with priority and category
        """
        suggestions = []
        
        # Analyze data
        sales_analysis = self.analyze_sales_data(sales_data)
        inventory_analysis = self.analyze_inventory_data(inventory_data, sales_data)
        
        staffing_analysis = None
        if staff_schedule is not None:
            staffing_analysis = self.analyze_staffing_data(staff_schedule, sales_data, peak_hour_forecast)
        
        # Generate inventory suggestions
        for item in inventory_analysis['low_stock_items']:
            if item['days_until_stockout'] < 3:
                priority = 'high'
            else:
                priority = 'medium'
            
            suggestion_text = self.suggestion_templates['inventory']['low_stock'].format(
                item_name=item['item_name'],
                percent=item['percent_of_par']
            )
            
            suggestions.append({
                'category': 'inventory',
                'suggestion': suggestion_text,
                'priority': priority,
                'details': json.dumps(item)
            })
        
        for item in inventory_analysis['expiring_items']:
            suggestion_text = self.suggestion_templates['inventory']['expiring_soon'].format(
                item_name=item['item_name'],
                quantity=item['quantity'],
                days=item['days_until_expiry']
            )
            
            suggestions.append({
                'category': 'inventory',
                'suggestion': suggestion_text,
                'priority': 'high' if item['days_until_expiry'] <= 1 else 'medium',
                'details': json.dumps(item)
            })
        
        for item in inventory_analysis['excess_stock_items']:
            suggestion_text = self.suggestion_templates['inventory']['excess_stock'].format(
                item_name=item['item_name'],
                percent=item['percent_over_par']
            )
            
            suggestions.append({
                'category': 'inventory',
                'suggestion': suggestion_text,
                'priority': 'low',
                'details': json.dumps(item)
            })
        
        for item in inventory_analysis['par_level_adjustments']:
            suggestion_text = self.suggestion_templates['inventory']['adjust_par'].format(
                item_name=item['item_name'],
                current_par=item['current_par'],
                recommended_par=item['recommended_par']
            )
            
            suggestions.append({
                'category': 'inventory',
                'suggestion': suggestion_text,
                'priority': 'medium',
                'details': json.dumps(item)
            })
        
        # Generate sales suggestions
        for period in sales_analysis['slow_periods']:
            suggestion_text = self.suggestion_templates['sales']['slow_period'].format(
                start_hour=period['hour'],
                end_hour=period['hour'] + 1
            )
            
            suggestions.append({
                'category': 'sales',
                'suggestion': suggestion_text,
                'priority': 'medium',
                'details': json.dumps(period)
            })
        
        for item in sales_analysis['top_items']:
            if item['percent_of_total'] > 15:  # Significant portion of sales
                suggestion_text = self.suggestion_templates['sales']['popular_item'].format(
                    item_name=item['item_name'],
                    percent=20  # Placeholder value
                )
                
                suggestions.append({
                    'category': 'sales',
                    'suggestion': suggestion_text,
                    'priority': 'low',
                    'details': json.dumps(item)
                })
        
        # Generate staffing suggestions if data available
        if staffing_analysis:
            for period in staffing_analysis['understaffed_periods']:
                day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][period['day_of_week']]
                
                suggestion_text = self.suggestion_templates['staffing']['understaffed'].format(
                    start_hour=period['hour'],
                    end_hour=period['hour'] + 1,
                    day_description=f"on {day_name}",
                    percent=period['percent_over_target']
                )
                
                suggestions.append({
                    'category': 'staffing',
                    'suggestion': suggestion_text,
                    'priority': 'high' if period['percent_over_target'] > 50 else 'medium',
                    'details': json.dumps(period)
                })
            
            for period in staffing_analysis['overstaffed_periods']:
                day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][period['day_of_week']]
                staff_reduction = period['staff_count'] - period['recommended_staff']
                
                if staff_reduction > 0:
                    suggestion_text = self.suggestion_templates['staffing']['overstaffed'].format(
                        count=staff_reduction,
                        start_hour=period['hour'],
                        end_hour=period['hour'] + 1,
                        day_description=f"on {day_name}"
                    )
                    
                    suggestions.append({
                        'category': 'staffing',
                        'suggestion': suggestion_text,
                        'priority': 'low',
                        'details': json.dumps(period)
                    })
            
            for adjustment in staffing_analysis['shift_adjustments']:
                day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][adjustment['day_of_week']]
                
                suggestion_text = self.suggestion_templates['staffing']['shift_adjustment'].format(
                    staff_name=adjustment['staff_name'],
                    start_hour=adjustment['recommended_start'],
                    current_start=adjustment['current_start']
                )
                
                suggestions.append({
                    'category': 'staffing',
                    'suggestion': suggestion_text,
                    'priority': 'medium',
                    'details': json.dumps(adjustment)
                })
            
            for issue in staffing_analysis['role_distribution_issues']:
                day_name = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][issue['day_of_week']]
                
                reason = "peak hour traffic"
                if issue['role'] == 'Manager':
                    reason = "busy period supervision"
                
                suggestion_text = self.suggestion_templates['staffing']['role_distribution'].format(
                    count=issue['recommended_count'],
                    role=issue['role'],
                    start_hour=issue['hour'],
                    end_hour=issue['hour'] + 1,
                    reason=reason
                )
                
                suggestions.append({
                    'category': 'staffing',
                    'suggestion': suggestion_text,
                    'priority': 'medium',
                    'details': json.dumps(issue)
                })
        
        return suggestions
    
    def train(self, suggestions_data, features_data):
        """
        Train a model to predict suggestion priority based on features.
        
        Args:
            suggestions_data (pd.DataFrame): Historical suggestions with priorities
            features_data (pd.DataFrame): Features corresponding to suggestions
            
        Returns:
            self: The trained model instance
        """
        # Extract features and target
        X = features_data
        y = suggestions_data['priority']
        
        # Train model
        self.model.fit(X, y)
        return self
    
    def predict_priority(self, suggestion_features):
        """
        Predict priority for a suggestion based on its features.
        
        Args:
            suggestion_features (pd.DataFrame): Features of the suggestion
            
        Returns:
            str: Predicted priority (high, medium, low)
        """
        if self.model is None:
            # Default to medium if no model
            return 'medium'
        
        return self.model.predict(suggestion_features)[0]
    
    def save_model(self, path):
        """
        Save the trained model to a file.
        
        Args:
            path (str): Path to save the model
        """
        if self.model is not None:
            model_data = {
                'model': self.model,
                'templates': self.suggestion_templates
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
        self.suggestion_templates = model_data['templates']

# Example usage
if __name__ == "__main__":
    # Create sample data
    np.random.seed(42)
    
    # Sample sales data
    dates = pd.date_range(start='2025-03-01', end='2025-03-31', freq='H')
    sales_data = []
    
    items = ['Coffee', 'Latte', 'Cappuccino', 'Espresso', 'Muffin', 'Croissant', 'Sandwich']
    prices = [3.50, 4.50, 4.75, 3.00, 3.25, 3.50, 6.50]
    
    for date in dates:
        # Skip non-business hours
        if date.hour < 6 or date.hour >= 22:
            continue
        
        # Generate more sales during peak hours
        if date.hour in [8, 9, 12, 13, 17, 18]:
            num_sales = np.random.poisson(10)
        else:
            num_sales = np.random.poisson(5)
        
        for _ in range(num_sales):
            item_idx = np.random.randint(0, len(items))
            price_variation = np.random.normal(0, 0.1)  # 10% price variation
            
            sales_data.append({
                'timestamp': date,
                'item_name': items[item_idx],
                'amount': prices[item_idx] * (1 + price_variation),
                'category': 'beverage' if item_idx < 4 else 'food'
            })
    
    sales_df = pd.DataFrame(sales_data)
    
    # Sample inventory data
    inventory_data = pd.DataFrame({
        'item_name': ['Coffee Beans', 'Milk', 'Sugar', 'Cups', 'Muffins', 'Croissants', 'Bread'],
        'quantity': [10, 5, 30, 100, 5, 3, 8],
        'par_level': [100, 40, 50, 200, 30, 25, 20],
        'unit_cost': [12.00, 4.00, 3.00, 0.15, 2.50, 3.00, 4.50],
        'expiry_date': [
            datetime.now().date() + timedelta(days=90),
            datetime.now().date() + timedelta(days=3),
            datetime.now().date() + timedelta(days=365),
            None,
            datetime.now().date() + timedelta(days=1),
            datetime.now().date() + timedelta(days=1),
            datetime.now().date() + timedelta(days=5)
        ],
        'category': ['beverage', 'dairy', 'dry goods', 'supplies', 'food', 'food', 'food']
    })
    
    # Sample staff schedule
    staff_schedule = pd.DataFrame({
        'staff_id': [1, 2, 3, 4, 5] * 7,
        'staff_name': ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams', 'David Brown'] * 7,
        'day_of_week': [d for d in range(7) for _ in range(5)],
        'start_hour': [6, 8, 10, 14, 14] * 7,
        'end_hour': [14, 16, 18, 22, 22] * 7,
        'role': ['Barista', 'Manager', 'Barista', 'Cashier', 'Barista'] * 7
    })
    
    # Create and use suggestion generator
    generator = SuggestionGenerator()
    
    # Generate suggestions
    suggestions = generator.generate_suggestions(
        sales_df,
        inventory_data,
        staff_schedule
    )
    
    # Print suggestions
    print(f"Generated {len(suggestions)} suggestions:")
    for i, suggestion in enumerate(suggestions[:10]):  # Show first 10
        print(f"{i+1}. [{suggestion['priority'].upper()}] {suggestion['category'].capitalize()}: {suggestion['suggestion']}")
    
    # Save model
    generator.save_model('suggestion_generator_model.joblib')
