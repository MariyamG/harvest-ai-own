import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import joblib
import os

class StaffScheduler:
    """
    A model to optimize staff scheduling for a coffee shop based on predicted customer traffic.
    Uses a Random Forest Regressor to predict optimal staffing levels.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the staff scheduler.
        
        Args:
            model_path (str, optional): Path to a saved model file. If provided, the model will be loaded.
        """
        self.model = None
        self.features = ['hour', 'day_of_week', 'is_weekend', 'predicted_customers', 'is_peak']
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
    
    def preprocess_data(self, data):
        """
        Preprocess the data for training or prediction.
        
        Args:
            data (pd.DataFrame): DataFrame containing historical staffing and customer data
            
        Returns:
            tuple: X (features) and y (target) if target column exists, otherwise just X
        """
        # Fill missing values
        for feature in self.features:
            if feature in data.columns:
                data[feature] = data[feature].fillna(0)
        
        # Create binary flags if not present
        if 'is_weekend' not in data.columns and 'day_of_week' in data.columns:
            data['is_weekend'] = data['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        
        if 'is_peak' not in data.columns and 'predicted_customers' in data.columns:
            threshold = np.percentile(data['predicted_customers'], 80)
            data['is_peak'] = data['predicted_customers'] >= threshold
        
        # Select features for model
        X_columns = [col for col in self.features if col in data.columns]
        X = data[X_columns]
        
        # Return X and y if target exists, otherwise just X
        if 'optimal_staff_count' in data.columns:
            y = data['optimal_staff_count']
            return X, y
        else:
            return X
    
    def train(self, data):
        """
        Train the model on historical staffing and customer data.
        
        Args:
            data (pd.DataFrame): DataFrame containing historical staffing and customer data
            
        Returns:
            self: The trained model instance
        """
        X, y = self.preprocess_data(data)
        self.model.fit(X, y)
        return self
    
    def predict_staff_count(self, data):
        """
        Predict optimal staff count based on customer traffic.
        
        Args:
            data (pd.DataFrame): DataFrame containing time periods and predicted customer counts
            
        Returns:
            np.array: Predicted optimal staff counts
        """
        X = self.preprocess_data(data)
        predictions = self.model.predict(X)
        # Round to nearest integer and ensure at least 1 staff member
        return np.maximum(np.round(predictions), 1)
    
    def calculate_staff_efficiency(self, customers, staff_count):
        """
        Calculate staff efficiency metrics.
        
        Args:
            customers (int): Number of customers
            staff_count (int): Number of staff members
            
        Returns:
            dict: Efficiency metrics
        """
        if staff_count <= 0:
            return {
                'customers_per_staff': float('inf'),
                'efficiency_rating': 'undefined'
            }
        
        customers_per_staff = customers / staff_count
        
        # Define efficiency ratings
        if customers_per_staff < 5:
            efficiency = 'overstaffed'
        elif customers_per_staff <= 15:
            efficiency = 'optimal'
        else:
            efficiency = 'understaffed'
        
        return {
            'customers_per_staff': customers_per_staff,
            'efficiency_rating': efficiency
        }
    
    def optimize_schedule(self, forecast_data, staff_data, current_schedule=None):
        """
        Generate an optimized staff schedule based on customer forecast.
        
        Args:
            forecast_data (pd.DataFrame): Customer forecast data
            staff_data (pd.DataFrame): Available staff data
            current_schedule (pd.DataFrame, optional): Current staff schedule
            
        Returns:
            pd.DataFrame: Optimized staff schedule
        """
        # Predict optimal staff count for each hour
        forecast_data['optimal_staff_count'] = self.predict_staff_count(forecast_data)
        
        # Initialize schedule dataframe
        schedule = []
        
        # Group forecast by date
        for date, day_forecast in forecast_data.groupby(forecast_data['timestamp'].dt.date):
            # Get available staff for this day
            available_staff = staff_data.copy()
            
            # If we have current schedule, check who's already scheduled
            if current_schedule is not None:
                scheduled_staff_ids = current_schedule[
                    current_schedule['date'] == date
                ]['staff_id'].unique()
                
                # Mark staff as already scheduled
                available_staff['already_scheduled'] = available_staff['id'].isin(scheduled_staff_ids)
            else:
                available_staff['already_scheduled'] = False
            
            # Sort staff by role priority and hourly rate
            role_priority = {'Manager': 1, 'Barista': 2, 'Cashier': 3}
            available_staff['role_priority'] = available_staff['role'].map(
                lambda r: role_priority.get(r, 99)
            )
            available_staff = available_staff.sort_values(['role_priority', 'hourly_rate'])
            
            # For each hour, assign staff
            for _, hour_data in day_forecast.iterrows():
                hour = hour_data['hour']
                needed_staff = int(hour_data['optimal_staff_count'])
                
                # Get staff already scheduled for this hour
                scheduled_count = 0
                scheduled_staff = []
                
                if current_schedule is not None:
                    scheduled_staff = current_schedule[
                        (current_schedule['date'] == date) & 
                        (current_schedule['start_hour'] <= hour) & 
                        (current_schedule['end_hour'] > hour)
                    ]['staff_id'].tolist()
                    
                    scheduled_count = len(scheduled_staff)
                
                # If we need more staff, assign them
                if needed_staff > scheduled_count:
                    # How many more staff do we need
                    additional_needed = needed_staff - scheduled_count
                    
                    # Get available staff not already scheduled for this hour
                    for _, staff in available_staff.iterrows():
                        # Skip if already scheduled for this hour
                        if staff['id'] in scheduled_staff:
                            continue
                        
                        # Add to schedule
                        schedule.append({
                            'date': date,
                            'staff_id': staff['id'],
                            'staff_name': staff['name'],
                            'staff_role': staff['role'],
                            'start_hour': hour,
                            'end_hour': hour + 8,  # Assuming 8-hour shifts
                            'is_peak': hour_data['is_peak']
                        })
                        
                        # Add to scheduled staff
                        scheduled_staff.append(staff['id'])
                        
                        # Decrement needed count
                        additional_needed -= 1
                        
                        # Break if we have enough staff
                        if additional_needed <= 0:
                            break
        
        # Convert to DataFrame
        schedule_df = pd.DataFrame(schedule)
        
        # Consolidate shifts (merge adjacent hours for the same staff)
        if not schedule_df.empty:
            consolidated = []
            
            for staff_id, staff_schedule in schedule_df.groupby('staff_id'):
                # Sort by date and start hour
                staff_schedule = staff_schedule.sort_values(['date', 'start_hour'])
                
                current_shift = None
                
                for _, shift in staff_schedule.iterrows():
                    if current_shift is None:
                        current_shift = shift.to_dict()
                    elif (shift['date'] == current_shift['date'] and 
                          shift['start_hour'] == current_shift['end_hour']):
                        # Extend current shift
                        current_shift['end_hour'] = shift['end_hour']
                    else:
                        # Add completed shift and start a new one
                        consolidated.append(current_shift)
                        current_shift = shift.to_dict()
                
                # Add the last shift
                if current_shift is not None:
                    consolidated.append(current_shift)
            
            schedule_df = pd.DataFrame(consolidated)
        
        return schedule_df
    
    def evaluate_schedule(self, schedule, forecast_data):
        """
        Evaluate a staff schedule against customer forecast.
        
        Args:
            schedule (pd.DataFrame): Staff schedule
            forecast_data (pd.DataFrame): Customer forecast data
            
        Returns:
            dict: Schedule evaluation metrics
        """
        # Initialize metrics
        metrics = {
            'total_staff_hours': 0,
            'overstaffed_hours': 0,
            'understaffed_hours': 0,
            'optimal_hours': 0,
            'staff_cost': 0,
            'efficiency_by_hour': []
        }
        
        # For each hour in the forecast
        for _, hour_data in forecast_data.iterrows():
            date = hour_data['timestamp'].dt.date
            hour = hour_data['hour']
            predicted_customers = hour_data['predicted_customers']
            
            # Count staff scheduled for this hour
            staff_count = len(schedule[
                (schedule['date'] == date) & 
                (schedule['start_hour'] <= hour) & 
                (schedule['end_hour'] > hour)
            ])
            
            # Calculate efficiency
            efficiency = self.calculate_staff_efficiency(predicted_customers, staff_count)
            
            # Update metrics
            metrics['total_staff_hours'] += staff_count
            
            if efficiency['efficiency_rating'] == 'overstaffed':
                metrics['overstaffed_hours'] += 1
            elif efficiency['efficiency_rating'] == 'understaffed':
                metrics['understaffed_hours'] += 1
            else:
                metrics['optimal_hours'] += 1
            
            # Add hourly efficiency data
            metrics['efficiency_by_hour'].append({
                'date': date,
                'hour': hour,
                'predicted_customers': predicted_customers,
                'staff_count': staff_count,
                'customers_per_staff': efficiency['customers_per_staff'],
                'efficiency_rating': efficiency['efficiency_rating']
            })
        
        # Calculate staff cost if hourly_rate is in the schedule
        if 'hourly_rate' in schedule.columns:
            for _, shift in schedule.iterrows():
                shift_hours = shift['end_hour'] - shift['start_hour']
                metrics['staff_cost'] += shift_hours * shift['hourly_rate']
        
        return metrics
    
    def generate_recommendations(self, current_schedule, forecast_data, staff_data):
        """
        Generate staffing recommendations based on forecast and current schedule.
        
        Args:
            current_schedule (pd.DataFrame): Current staff schedule
            forecast_data (pd.DataFrame): Customer forecast data
            staff_data (pd.DataFrame): Available staff data
            
        Returns:
            dict: Staffing recommendations
        """
        # Optimize schedule
        optimized_schedule = self.optimize_schedule(forecast_data, staff_data, current_schedule)
        
        # Evaluate current and optimized schedules
        current_metrics = self.evaluate_schedule(current_schedule, forecast_data)
        optimized_metrics = self.evaluate_schedule(optimized_schedule, forecast_data)
        
        # Generate recommendations
        recommendations = {
            'schedule_changes': [],
            'efficiency_improvement': {
                'current_overstaffed_hours': current_metrics['overstaffed_hours'],
                'current_understaffed_hours': current_metrics['understaffed_hours'],
                'optimized_overstaffed_hours': optimized_metrics['overstaffed_hours'],
                'optimized_understaffed_hours': optimized_metrics['understaffed_hours'],
                'hours_improved': (current_metrics['overstaffed_hours'] + current_metrics['understaffed_hours']) - 
                                 (optimized_metrics['overstaffed_hours'] + optimized_metrics['understaffed_hours']),
                'cost_savings': current_metrics.get('staff_cost', 0) - optimized_metrics.get('staff_cost', 0)
            },
            'peak_hour_staffing': []
        }
        
        # Identify schedule changes
        for date, day_forecast in forecast_data.groupby(forecast_data['timestamp'].dt.date):
            # Get current and optimized staff for each hour
            for hour in day_forecast['hour'].unique():
                current_staff = current_schedule[
                    (current_schedule['date'] == date) & 
                    (current_schedule['start_hour'] <= hour) & 
                    (current_schedule['end_hour'] > hour)
                ]['staff_id'].tolist()
                
                optimized_staff = optimized_schedule[
                    (optimized_schedule['date'] == date) & 
                    (optimized_schedule['start_hour'] <= hour) & 
                    (optimized_schedule['end_hour'] > hour)
                ]['staff_id'].tolist()
                
                # If different, add to recommendations
                if set(current_staff) != set(optimized_staff):
                    # Get customer forecast for this hour
                    hour_forecast = day_forecast[day_forecast['hour'] == hour].iloc[0]
                    
                    recommendations['schedule_changes'].append({
                        'date': date,
                        'hour': hour,
                        'predicted_customers': hour_forecast['predicted_customers'],
                        'current_staff_count': len(current_staff),
                        'recommended_staff_count': len(optimized_staff),
                        'staff_to_add': [s for s in optimized_staff if s not in current_staff],
                        'staff_to_remove': [s for s in current_staff if s not in optimized_staff]
                    })
        
        # Add peak hour staffing recommendations
        peak_hours = forecast_data[forecast_data['is_peak']]
        for _, hour_data in peak_hours.iterrows():
            date = hour_data['timestamp'].dt.date
            hour = hour_data['hour']
            
            current_staff_count = len(current_schedule[
                (current_schedule['date'] == date) & 
                (current_schedule['start_hour'] <= hour) & 
                (current_schedule['end_hour'] > hour)
            ])
            
            optimal_staff_count = int(hour_data['optimal_staff_count'])
            
            if current_staff_count < optimal_staff_count:
                recommendations['peak_hour_staffing'].append({
                    'date': date,
                    'hour': hour,
                    'predicted_customers': hour_data['predicted_customers'],
                    'current_staff_count': current_staff_count,
                    'recommended_staff_count': optimal_staff_count,
                    'additional_staff_needed': optimal_staff_count - current_staff_count
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
    
    # Sample staff data
    staff_data = pd.DataFrame({
        'id': [1, 2, 3, 4, 5],
        'name': ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams', 'David Brown'],
        'hourly_rate': [18.00, 25.00, 17.50, 17.00, 18.00],
        'role': ['Barista', 'Manager', 'Barista', 'Cashier', 'Barista']
    })
    
    # Sample forecast data
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
    
    forecast_df = pd.DataFrame(forecast_data)
    
    # Mark peak hours (top 20% by predicted customer count)
    threshold = np.percentile(forecast_df['predicted_customers'], 80)
    forecast_df['is_peak'] = forecast_df['predicted_customers'] >= threshold
    
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
    
    current_schedule_df = pd.DataFrame(current_schedule)
    
    # Create and use scheduler
    scheduler = StaffScheduler()
    
    # Train with historical data (using forecast as a proxy for simplicity)
    training_data = forecast_df.copy()
    
    # Create a simple heuristic for optimal staff count for training
    training_data['optimal_staff_count'] = np.ceil(training_data['predicted_customers'] / 15)
    
    scheduler.train(training_data)
    
    # Generate optimized schedule
    optimized_schedule = scheduler.optimize_schedule(
        forecast_df,
        staff_data,
        current_schedule_df
    )
    
    # Generate recommendations
    recommendations = scheduler.generate_recommendations(
        current_schedule_df,
        forecast_df,
        staff_data
    )
    
    # Print recommendations
    print("Staffing Recommendations:")
    print(f"Efficiency improvement: {recommendations['efficiency_improvement']['hours_improved']} hours")
    
    if recommendations['schedule_changes']:
        print("\nRecommended schedule changes:")
        for change in recommendations['schedule_changes'][:3]:  # Show first 3 changes
            print(f"  {change['date']}, {change['hour']}:00 - Change staff from {change['current_staff_count']} to {change['recommended_staff_count']}")
    
    if recommendations['peak_hour_staffing']:
        print("\nPeak hour staffing needs:")
        for peak in recommendations['peak_hour_staffing'][:3]:  # Show first 3 peak hours
            print(f"  {peak['date']}, {peak['hour']}:00 - Need {peak['additional_staff_needed']} more staff (expecting {peak['predicted_customers']} customers)")
    
    # Save model
    scheduler.save_model('staff_scheduler_model.joblib')
