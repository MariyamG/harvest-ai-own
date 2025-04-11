import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import sys

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Import the AI models
from peak_hour_predictor import PeakHourPredictor
from inventory_optimizer import InventoryOptimizer
from staff_scheduler import StaffScheduler
from suggestion_generator import SuggestionGenerator

class TestPeakHourPredictor:
    def setup_method(self):
        """Set up test data for each test method"""
        # Create sample data
        np.random.seed(42)
        dates = pd.date_range(start='2025-01-01', end='2025-03-31', freq='H')
        
        self.data = pd.DataFrame({
            'timestamp': dates,
            'customer_count': np.random.poisson(
                lam=20 + 
                    10 * np.sin(np.pi * dates.hour / 12) +  # Time of day effect
                    5 * (dates.dayofweek >= 5)  # Weekend effect
            )
        })
        
        # Split data
        self.train_data = self.data[self.data['timestamp'] < '2025-03-01']
        self.test_data = self.data[self.data['timestamp'] >= '2025-03-01']
        
        # Initialize model
        self.predictor = PeakHourPredictor()
    
    def test_initialization(self):
        """Test model initialization"""
        assert self.predictor is not None
        assert self.predictor.model is not None
        assert self.predictor.encoder is not None
        assert len(self.predictor.features) > 0
    
    def test_preprocess_data(self):
        """Test data preprocessing"""
        X, y = self.predictor.preprocess_data(self.train_data)
        
        # Check that features are extracted correctly
        assert 'hour' in X.columns
        assert 'day_of_week' in X.columns
        assert 'is_weekend' in X.columns
        
        # Check shapes
        assert len(X) == len(self.train_data)
        assert len(y) == len(self.train_data)
    
    def test_train(self):
        """Test model training"""
        self.predictor.train(self.train_data)
        
        # Check that model is trained
        assert hasattr(self.predictor.model, 'feature_importances_')
    
    def test_predict(self):
        """Test prediction"""
        self.predictor.train(self.train_data)
        predictions = self.predictor.predict(self.test_data)
        
        # Check predictions shape
        assert len(predictions) == len(self.test_data)
        
        # Check predictions are reasonable
        assert np.all(predictions >= 0)  # Customer counts should be non-negative
    
    def test_generate_forecast(self):
        """Test forecast generation"""
        self.predictor.train(self.train_data)
        
        forecast = self.predictor.generate_forecast(
            start_date=datetime(2025, 4, 1),
            days=7,
            shop_hours=(6, 22)
        )
        
        # Check forecast shape
        expected_hours = 16  # 6 AM to 10 PM
        assert len(forecast) == 7 * expected_hours
        
        # Check forecast columns
        assert 'timestamp' in forecast.columns
        assert 'predicted_customers' in forecast.columns
        assert 'is_peak' in forecast.columns
        
        # Check peak hours are identified
        assert forecast['is_peak'].sum() > 0
        assert forecast['is_peak'].sum() <= len(forecast) * 0.2  # At most 20% should be peak

class TestInventoryOptimizer:
    def setup_method(self):
        """Set up test data for each test method"""
        # Create sample inventory data
        self.inventory_data = pd.DataFrame({
            'item_name': ['Coffee Beans', 'Milk', 'Sugar', 'Cups', 'Muffins'],
            'quantity': [50, 20, 30, 100, 15],
            'par_level': [100, 40, 50, 200, 30],
            'unit_cost': [12.00, 4.00, 3.00, 0.15, 2.50],
            'shelf_life_days': [90, 7, 365, None, 3],
            'category': ['beverage', 'dairy', 'dry goods', 'supplies', 'food']
        })
        
        # Create sample sales data
        np.random.seed(42)
        dates = pd.date_range(start='2025-01-01', end='2025-03-31', freq='D')
        sales_data = []
        
        for date in dates:
            for item in self.inventory_data['item_name']:
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
        
        self.sales_data = pd.DataFrame(sales_data)
        
        # Initialize model
        self.optimizer = InventoryOptimizer()
    
    def test_initialization(self):
        """Test model initialization"""
        assert self.optimizer is not None
        assert len(self.optimizer.features) > 0
    
    def test_preprocess_data(self):
        """Test data preprocessing"""
        # Create training data with optimal par levels
        training_data = self.inventory_data.copy()
        training_data['avg_daily_sales'] = 10
        training_data['lead_time_days'] = 3
        training_data['is_perishable'] = training_data['shelf_life_days'].apply(lambda x: 1 if x and x < 30 else 0)
        training_data['optimal_par_level'] = training_data['avg_daily_sales'] * 7  # 7-day supply
        
        X, y = self.optimizer.preprocess_data(training_data)
        
        # Check that features are extracted correctly
        for feature in self.optimizer.features:
            if feature in training_data.columns:
                assert feature in X.columns
        
        # Check shapes
        assert len(X) == len(training_data)
        assert len(y) == len(training_data)
    
    def test_optimize_inventory(self):
        """Test inventory optimization"""
        optimized_inventory = self.optimizer.optimize_inventory(
            self.inventory_data,
            self.sales_data,
            lead_times={'Coffee Beans': 5, 'Milk': 1, 'Sugar': 3, 'Cups': 7, 'Muffins': 1}
        )
        
        # Check that optimization adds expected columns
        assert 'avg_daily_sales' in optimized_inventory.columns
        assert 'optimal_par_level' in optimized_inventory.columns
        assert 'reorder_point' in optimized_inventory.columns
        assert 'needs_reorder' in optimized_inventory.columns
        
        # Check that all original items are preserved
        assert len(optimized_inventory) == len(self.inventory_data)
        
        # Check that reorder points are reasonable
        assert np.all(optimized_inventory['reorder_point'] >= 0)
    
    def test_generate_recommendations(self):
        """Test recommendation generation"""
        optimized_inventory = self.optimizer.optimize_inventory(
            self.inventory_data,
            self.sales_data
        )
        
        recommendations = self.optimizer.generate_recommendations(optimized_inventory)
        
        # Check recommendation structure
        assert 'items_to_reorder' in recommendations
        assert 'excess_items' in recommendations
        
        # Check that recommendations are lists
        assert isinstance(recommendations['items_to_reorder'], list)
        assert isinstance(recommendations['excess_items'], list)

class TestStaffScheduler:
    def setup_method(self):
        """Set up test data for each test method"""
        # Create sample staff data
        self.staff_data = pd.DataFrame({
            'id': [1, 2, 3, 4, 5],
            'name': ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams', 'David Brown'],
            'hourly_rate': [18.00, 25.00, 17.50, 17.00, 18.00],
            'role': ['Barista', 'Manager', 'Barista', 'Cashier', 'Barista']
        })
        
        # Create sample forecast data
        np.random.seed(42)
        dates = pd.date_range(start='2025-04-01', end='2025-04-07', freq='D')
        forecast_data = []
        
        for date in dates:
            for hour in range(6, 22):  # 6 AM to 10 PM
                # Different customer patterns based on time of day and weekday/weekend
                is_weekend = date.dayofweek >= 5
                
                if hour >= 7 and hour <= 9:  # Morning rush
                    base_customers = 30
                elif hour >= 12 and hour <= 13:  # Lunch rush
                    base_customers = 25
                elif hour >= 17 and hour <= 18:  # Evening rush
                    base_customers = 20
                else:
                    base_customers = 10
                
                # Weekend adjustment
                if is_weekend:
                    base_customers *= 1.5
                
                # Add some randomness
                predicted_customers = int(np.random.normal(base_customers, base_customers * 0.1))
                
                forecast_data.append({
                    'timestamp': date.replace(hour=hour),
                    'hour': hour,
                    'day_of_week': date.dayofweek,
                    'is_weekend': int(is_weekend),
                    'predicted_customers': predicted_customers
                })
        
        self.forecast_data = pd.DataFrame(forecast_data)
        
        # Mark peak hours (top 20% by predicted customer count)
        threshold = np.percentile(self.forecast_data['predicted_customers'], 80)
        self.forecast_data['is_peak'] = self.forecast_data['predicted_customers'] >= threshold
        
        # Create a simple current schedule
        current_schedule = []
        
        for date in dates:
            # Morning shift (2 staff)
            for staff_id in [1, 3]:  # John and Mike
                current_schedule.append({
                    'date': date.date(),
                    'staff_id': staff_id,
                    'start_hour': 6,
                    'end_hour': 14
                })
            
            # Mid-day manager
            current_schedule.append({
                'date': date.date(),
                'staff_id': 2,  # Jane (Manager)
                'start_hour': 8,
                'end_hour': 16
            })
            
            # Afternoon/evening shift (2 staff)
            for staff_id in [4, 5]:  # Sarah and David
                current_schedule.append({
                    'date': date.date(),
                    'staff_id': staff_id,
                    'start_hour': 14,
                    'end_hour': 22
                })
        
        self.current_schedule = pd.DataFrame(current_schedule)
        
        # Initialize model
        self.scheduler = StaffScheduler()
    
    def test_initialization(self):
        """Test model initialization"""
        assert self.scheduler is not None
        assert len(self.scheduler.features) > 0
    
    def test_preprocess_data(self):
        """Test data preprocessing"""
        # Create training data with optimal staff counts
        training_data = self.forecast_data.copy()
        training_data['optimal_staff_count'] = np.ceil(training_data['predicted_customers'] / 15)
        
        X, y = self.scheduler.preprocess_data(training_data)
        
        # Check that features are extracted correctly
        for feature in self.scheduler.features:
            if feature in training_data.columns:
                assert feature in X.columns
        
        # Check shapes
        assert len(X) == len(training_data)
        assert len(y) == len(training_data)
    
    def test_optimize_schedule(self):
        """Test schedule optimization"""
        # Train with historical data
        training_data = self.forecast_data.copy()
        training_data['optimal_staff_count'] = np.ceil(training_data['predicted_customers'] / 15)
        self.scheduler.train(training_data)
        
        optimized_schedule = self.scheduler.optimize_schedule(
            self.forecast_data,
            self.staff_data,
            self.current_schedule
        )
        
        # Check that schedule has expected columns
        assert 'date' in optimized_schedule.columns
        assert 'staff_id' in optimized_schedule.columns
        assert 'start_hour' in optimized_schedule.columns
        assert 'end_hour' in optimized_schedule.columns
        
        # Check that schedule has reasonable number of shifts
        assert len(optimized_schedule) > 0
    
    def test_generate_recommendations(self):
        """Test recommendation generation"""
        # Train with historical data
        training_data = self.forecast_data.copy()
        training_data['optimal_staff_count'] = np.ceil(training_data['predicted_customers'] / 15)
        self.scheduler.train(training_data)
        
        recommendations = self.scheduler.generate_recommendations(
            self.current_schedule,
            self.forecast_data,
            self.staff_data
        )
        
        # Check recommendation structure
        assert 'schedule_changes' in recommendations
        assert 'efficiency_improvement' in recommendations
        assert 'peak_hour_staffing' in recommendations
        
        # Check that recommendations are lists
        assert isinstance(recommendations['schedule_changes'], list)
        assert isinstance(recommendations['peak_hour_staffing'], list)

class TestSuggestionGenerator:
    def setup_method(self):
        """Set up test data for each test method"""
        # Create sample sales data
        np.random.seed(42)
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
        
        self.sales_data = pd.DataFrame(sales_data)
        
        # Create sample inventory data
        self.inventory_data = pd.DataFrame({
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
        
        # Initialize model
        self.generator = SuggestionGenerator()
    
    def test_initialization(self):
        """Test model initialization"""
        assert self.generator is not None
        assert self.generator.suggestion_templates is not None
    
    def test_analyze_sales_data(self):
        """Test sales data analysis"""
        results = self.generator.analyze_sales_data(self.sales_data)
        
        # Check that analysis has expected sections
        assert 'total_sales' in results
        assert 'transaction_count' in results
        assert 'average_transaction' in results
        assert 'hourly_sales' in results
        assert 'daily_sales' in results
        assert 'top_items' in results
        
        # Check that values are reasonable
        assert results['total_sales'] > 0
        assert results['transaction_count'] > 0
        assert results['average_transaction'] > 0
        assert len(results['top_items']) > 0
    
    def test_analyze_inventory_data(self):
        """Test inventory data analysis"""
        results = self.generator.analyze_inventory_data(self.inventory_data, self.sales_data)
        
        # Check that analysis has expected sections
        assert 'low_stock_items' in results
        assert 'expiring_items' in results
        assert 'excess_stock_items' in results
        assert 'par_level_adjustments' in results
        
        # Check that expiring items are identified
        assert len(results['expiring_items']) > 0
    
    def test_generate_suggestions(self):
        """Test suggestion generation"""
        suggestions = self.generator.generate_suggestions(
            self.sales_data,
            self.inventory_data
        )
        
        # Check that suggestions are generated
        assert len(suggestions) > 0
        
        # Check suggestion structure
        for suggestion in suggestions:
            assert 'category' in suggestion
            assert 'suggestion' in suggestion
            assert 'priority' in suggestion
            assert 'details' in suggestion
            
            # Check that category is valid
            assert suggestion['category'] in ['inventory', 'staffing', 'sales', 'operations']
            
            # Check that priority is valid
            assert suggestion['priority'] in ['high', 'medium', 'low']
