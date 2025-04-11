import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from datetime import datetime, timedelta
import joblib
import os

class PeakHourPredictor:
    """
    A simple model to predict peak hours for a coffee shop based on historical sales data.
    Uses a Random Forest Regressor to predict customer counts for each hour.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the peak hour predictor.
        
        Args:
            model_path (str, optional): Path to a saved model file. If provided, the model will be loaded.
        """
        self.model = None
        self.encoder = None
        self.features = ['hour', 'day_of_week', 'is_weekend', 'is_holiday', 'weather_condition']
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
            self.encoder = OneHotEncoder(sparse=False, handle_unknown='ignore')
    
    def preprocess_data(self, data):
        """
        Preprocess the data for training or prediction.
        
        Args:
            data (pd.DataFrame): DataFrame containing sales data with timestamps
            
        Returns:
            tuple: X (features) and y (target) if target column exists, otherwise just X
        """
        # Extract features from timestamp
        if 'timestamp' in data.columns:
            data['hour'] = data['timestamp'].dt.hour
            data['day_of_week'] = data['timestamp'].dt.dayofweek
            data['is_weekend'] = data['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        
        # Fill missing values
        for feature in self.features:
            if feature in data.columns and data[feature].dtype != 'object':
                data[feature] = data[feature].fillna(0)
        
        # One-hot encode categorical features
        categorical_features = [f for f in self.features if f in data.columns and data[f].dtype == 'object']
        if categorical_features:
            if not hasattr(self.encoder, 'feature_names_in_') or self.encoder.feature_names_in_ is None:
                self.encoder.fit(data[categorical_features])
            
            encoded_features = self.encoder.transform(data[categorical_features])
            encoded_df = pd.DataFrame(
                encoded_features, 
                columns=self.encoder.get_feature_names_out(categorical_features),
                index=data.index
            )
            
            # Drop original categorical columns and join encoded ones
            data = data.drop(categorical_features, axis=1)
            data = pd.concat([data, encoded_df], axis=1)
        
        # Select features for model
        X_columns = [col for col in data.columns if col != 'customer_count' and col != 'timestamp']
        X = data[X_columns]
        
        # Return X and y if target exists, otherwise just X
        if 'customer_count' in data.columns:
            y = data['customer_count']
            return X, y
        else:
            return X
    
    def train(self, data):
        """
        Train the model on historical sales data.
        
        Args:
            data (pd.DataFrame): DataFrame containing sales data with timestamps and customer counts
            
        Returns:
            self: The trained model instance
        """
        X, y = self.preprocess_data(data)
        self.model.fit(X, y)
        return self
    
    def predict(self, data):
        """
        Predict customer counts for given time periods.
        
        Args:
            data (pd.DataFrame): DataFrame containing time periods to predict for
            
        Returns:
            np.array: Predicted customer counts
        """
        X = self.preprocess_data(data)
        return self.model.predict(X)
    
    def generate_forecast(self, start_date, days=7, shop_hours=(6, 22), weather_data=None):
        """
        Generate a forecast for the specified number of days starting from start_date.
        
        Args:
            start_date (datetime): The start date for the forecast
            days (int): Number of days to forecast
            shop_hours (tuple): Opening and closing hours (24-hour format)
            weather_data (dict, optional): Weather forecast data if available
            
        Returns:
            pd.DataFrame: Forecast with predicted customer counts
        """
        # Generate time periods to predict
        periods = []
        for day in range(days):
            date = start_date + timedelta(days=day)
            for hour in range(shop_hours[0], shop_hours[1]):
                periods.append({
                    'timestamp': date.replace(hour=hour, minute=0, second=0),
                    'hour': hour,
                    'day_of_week': date.weekday(),
                    'is_weekend': 1 if date.weekday() >= 5 else 0,
                    'is_holiday': 0  # Default, would need holiday data to set properly
                })
        
        # Create DataFrame
        forecast_df = pd.DataFrame(periods)
        
        # Add weather data if available
        if weather_data:
            # This is a simplified example - in a real app, you'd match weather data to timestamps
            forecast_df['weather_condition'] = 'sunny'  # Default
            for date_str, condition in weather_data.items():
                date = datetime.strptime(date_str, '%Y-%m-%d')
                forecast_df.loc[forecast_df['timestamp'].dt.date == date.date(), 'weather_condition'] = condition
        
        # Make predictions
        forecast_df['predicted_customers'] = self.predict(forecast_df)
        
        # Identify peak hours (top 20% of hours by predicted customer count)
        threshold = np.percentile(forecast_df['predicted_customers'], 80)
        forecast_df['is_peak'] = forecast_df['predicted_customers'] >= threshold
        
        return forecast_df
    
    def save_model(self, path):
        """
        Save the trained model to a file.
        
        Args:
            path (str): Path to save the model
        """
        if self.model is not None:
            model_data = {
                'model': self.model,
                'encoder': self.encoder,
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
        self.encoder = model_data['encoder']
        self.features = model_data['features']

# Example usage
if __name__ == "__main__":
    # Create sample data
    np.random.seed(42)
    dates = pd.date_range(start='2025-01-01', end='2025-03-31', freq='H')
    
    data = pd.DataFrame({
        'timestamp': dates,
        'customer_count': np.random.poisson(
            lam=20 + 
                10 * np.sin(np.pi * dates.hour / 12) +  # Time of day effect
                5 * (dates.dayofweek >= 5)  # Weekend effect
        )
    })
    
    # Split data
    train_data = data[data['timestamp'] < '2025-03-01']
    test_data = data[data['timestamp'] >= '2025-03-01']
    
    # Train model
    predictor = PeakHourPredictor()
    predictor.train(train_data)
    
    # Generate forecast
    forecast = predictor.generate_forecast(
        start_date=datetime(2025, 4, 1),
        days=7,
        shop_hours=(6, 22)
    )
    
    # Print peak hours
    peak_hours = forecast[forecast['is_peak']]
    print("Predicted peak hours:")
    for _, row in peak_hours.iterrows():
        print(f"{row['timestamp']}: {row['predicted_customers']:.0f} customers")
    
    # Save model
    predictor.save_model('peak_hour_model.joblib')
