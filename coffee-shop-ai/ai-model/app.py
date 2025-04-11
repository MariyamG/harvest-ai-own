import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import sys
import json
from datetime import datetime, timedelta

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import the AI models
from peak_hour_predictor import PeakHourPredictor
from inventory_optimizer import InventoryOptimizer
from staff_scheduler import StaffScheduler
from suggestion_generator import SuggestionGenerator

app = Flask(__name__)
CORS(app)

# Initialize models
peak_hour_model = None
inventory_model = None
staff_model = None
suggestion_model = None

# Model paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

PEAK_HOUR_MODEL_PATH = os.path.join(MODEL_DIR, 'peak_hour_model.joblib')
INVENTORY_MODEL_PATH = os.path.join(MODEL_DIR, 'inventory_optimizer_model.joblib')
STAFF_MODEL_PATH = os.path.join(MODEL_DIR, 'staff_scheduler_model.joblib')
SUGGESTION_MODEL_PATH = os.path.join(MODEL_DIR, 'suggestion_generator_model.joblib')

def load_models():
    """Load all AI models if they exist, otherwise initialize new ones."""
    global peak_hour_model, inventory_model, staff_model, suggestion_model
    
    # Load or initialize peak hour predictor
    if os.path.exists(PEAK_HOUR_MODEL_PATH):
        peak_hour_model = PeakHourPredictor(model_path=PEAK_HOUR_MODEL_PATH)
    else:
        peak_hour_model = PeakHourPredictor()
    
    # Load or initialize inventory optimizer
    if os.path.exists(INVENTORY_MODEL_PATH):
        inventory_model = InventoryOptimizer(model_path=INVENTORY_MODEL_PATH)
    else:
        inventory_model = InventoryOptimizer()
    
    # Load or initialize staff scheduler
    if os.path.exists(STAFF_MODEL_PATH):
        staff_model = StaffScheduler(model_path=STAFF_MODEL_PATH)
    else:
        staff_model = StaffScheduler()
    
    # Load or initialize suggestion generator
    if os.path.exists(SUGGESTION_MODEL_PATH):
        suggestion_model = SuggestionGenerator(model_path=SUGGESTION_MODEL_PATH)
    else:
        suggestion_model = SuggestionGenerator()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'models': {
            'peak_hour_predictor': peak_hour_model is not None,
            'inventory_optimizer': inventory_model is not None,
            'staff_scheduler': staff_model is not None,
            'suggestion_generator': suggestion_model is not None
        }
    })

@app.route('/predict/peak_hours', methods=['POST'])
def predict_peak_hours():
    """Generate peak hour predictions."""
    data = request.json
    
    # Extract parameters
    start_date_str = data.get('start_date', datetime.now().strftime('%Y-%m-%d'))
    days = data.get('days', 7)
    shop_hours = data.get('shop_hours', (6, 22))
    weather_data = data.get('weather_data', None)
    
    # Convert start_date to datetime
    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
    
    # Generate forecast
    forecast = peak_hour_model.generate_forecast(
        start_date=start_date,
        days=days,
        shop_hours=shop_hours,
        weather_data=weather_data
    )
    
    # Convert to JSON-serializable format
    result = []
    for _, row in forecast.iterrows():
        result.append({
            'timestamp': row['timestamp'].isoformat(),
            'date': row['timestamp'].date().isoformat(),
            'hour': int(row['hour']),
            'day_of_week': int(row['day_of_week']),
            'is_weekend': bool(row['is_weekend']),
            'predicted_customers': int(row['predicted_customers']),
            'is_peak': bool(row['is_peak'])
        })
    
    return jsonify(result)

@app.route('/optimize/inventory', methods=['POST'])
def optimize_inventory():
    """Optimize inventory levels."""
    data = request.json
    
    # Extract data
    inventory_data = pd.DataFrame(data.get('inventory', []))
    sales_data = pd.DataFrame(data.get('sales', []))
    lead_times = data.get('lead_times', None)
    
    # Convert timestamp strings to datetime objects in sales data
    if 'timestamp' in sales_data.columns:
        sales_data['timestamp'] = pd.to_datetime(sales_data['timestamp'])
    
    # Convert expiry_date strings to datetime objects in inventory data
    if 'expiry_date' in inventory_data.columns:
        inventory_data['expiry_date'] = pd.to_datetime(inventory_data['expiry_date']).dt.date
    
    # Optimize inventory
    optimized_inventory = inventory_model.optimize_inventory(
        inventory_data=inventory_data,
        sales_data=sales_data,
        lead_times=lead_times
    )
    
    # Generate recommendations
    recommendations = inventory_model.generate_recommendations(optimized_inventory)
    
    # Convert to JSON-serializable format
    result = {
        'optimized_inventory': [],
        'recommendations': recommendations
    }
    
    for _, row in optimized_inventory.iterrows():
        item_dict = row.to_dict()
        
        # Convert date objects to strings
        if 'expiry_date' in item_dict and item_dict['expiry_date'] is not None:
            item_dict['expiry_date'] = item_dict['expiry_date'].isoformat()
        
        # Convert numpy types to Python types
        for key, value in item_dict.items():
            if isinstance(value, (np.int64, np.int32, np.int16, np.int8)):
                item_dict[key] = int(value)
            elif isinstance(value, (np.float64, np.float32)):
                item_dict[key] = float(value)
        
        result['optimized_inventory'].append(item_dict)
    
    return jsonify(result)

@app.route('/optimize/staff', methods=['POST'])
def optimize_staff():
    """Optimize staff scheduling."""
    data = request.json
    
    # Extract data
    forecast_data = pd.DataFrame(data.get('forecast', []))
    staff_data = pd.DataFrame(data.get('staff', []))
    current_schedule = pd.DataFrame(data.get('current_schedule', []))
    
    # Convert timestamp strings to datetime objects in forecast data
    if 'timestamp' in forecast_data.columns:
        forecast_data['timestamp'] = pd.to_datetime(forecast_data['timestamp'])
    
    # Convert date strings to date objects in current schedule
    if 'date' in current_schedule.columns and len(current_schedule) > 0:
        current_schedule['date'] = pd.to_datetime(current_schedule['date']).dt.date
    
    # Optimize schedule
    optimized_schedule = staff_model.optimize_schedule(
        forecast_data=forecast_data,
        staff_data=staff_data,
        current_schedule=current_schedule if not current_schedule.empty else None
    )
    
    # Generate recommendations
    if not current_schedule.empty:
        recommendations = staff_model.generate_recommendations(
            current_schedule=current_schedule,
            forecast_data=forecast_data,
            staff_data=staff_data
        )
    else:
        recommendations = {
            'schedule_changes': [],
            'efficiency_improvement': {
                'current_overstaffed_hours': 0,
                'current_understaffed_hours': 0,
                'optimized_overstaffed_hours': 0,
                'optimized_understaffed_hours': 0,
                'hours_improved': 0,
                'cost_savings': 0
            },
            'peak_hour_staffing': []
        }
    
    # Convert to JSON-serializable format
    result = {
        'optimized_schedule': [],
        'recommendations': recommendations
    }
    
    for _, row in optimized_schedule.iterrows():
        shift_dict = row.to_dict()
        
        # Convert date objects to strings
        if 'date' in shift_dict and shift_dict['date'] is not None:
            shift_dict['date'] = shift_dict['date'].isoformat()
        
        # Convert numpy types to Python types
        for key, value in shift_dict.items():
            if isinstance(value, (np.int64, np.int32, np.int16, np.int8)):
                shift_dict[key] = int(value)
            elif isinstance(value, (np.float64, np.float32)):
                shift_dict[key] = float(value)
        
        result['optimized_schedule'].append(shift_dict)
    
    # Convert date objects in recommendations
    for change in recommendations['schedule_changes']:
        if 'date' in change and change['date'] is not None:
            change['date'] = change['date'].isoformat()
    
    for peak in recommendations['peak_hour_staffing']:
        if 'date' in peak and peak['date'] is not None:
            peak['date'] = peak['date'].isoformat()
    
    return jsonify(result)

@app.route('/generate/suggestions', methods=['POST'])
def generate_suggestions():
    """Generate operational suggestions."""
    data = request.json
    
    # Extract data
    sales_data = pd.DataFrame(data.get('sales', []))
    inventory_data = pd.DataFrame(data.get('inventory', []))
    staff_schedule = pd.DataFrame(data.get('staff_schedule', []))
    peak_hour_forecast = pd.DataFrame(data.get('peak_hour_forecast', []))
    
    # Convert timestamp strings to datetime objects
    if 'timestamp' in sales_data.columns:
        sales_data['timestamp'] = pd.to_datetime(sales_data['timestamp'])
    
    # Convert expiry_date strings to datetime objects
    if 'expiry_date' in inventory_data.columns:
        inventory_data['expiry_date'] = pd.to_datetime(inventory_data['expiry_date']).dt.date
    
    # Convert date strings to date objects in staff schedule
    if 'date' in staff_schedule.columns and len(staff_schedule) > 0:
        staff_schedule['date'] = pd.to_datetime(staff_schedule['date']).dt.date
    
    # Convert timestamp strings to datetime objects in forecast
    if 'timestamp' in peak_hour_forecast.columns and len(peak_hour_forecast) > 0:
        peak_hour_forecast['timestamp'] = pd.to_datetime(peak_hour_forecast['timestamp'])
    
    # Generate suggestions
    suggestions = suggestion_model.generate_suggestions(
        sales_data=sales_data,
        inventory_data=inventory_data,
        staff_schedule=staff_schedule if not staff_schedule.empty else None,
        peak_hour_forecast=peak_hour_forecast if not peak_hour_forecast.empty else None
    )
    
    return jsonify(suggestions)

@app.route('/train/peak_hours', methods=['POST'])
def train_peak_hours():
    """Train the peak hour prediction model."""
    data = request.json
    
    # Extract training data
    training_data = pd.DataFrame(data.get('training_data', []))
    
    # Convert timestamp strings to datetime objects
    if 'timestamp' in training_data.columns:
        training_data['timestamp'] = pd.to_datetime(training_data['timestamp'])
    
    # Train model
    peak_hour_model.train(training_data)
    
    # Save model
    peak_hour_model.save_model(PEAK_HOUR_MODEL_PATH)
    
    return jsonify({'status': 'success', 'message': 'Peak hour model trained successfully'})

@app.route('/train/inventory', methods=['POST'])
def train_inventory():
    """Train the inventory optimization model."""
    data = request.json
    
    # Extract training data
    training_data = pd.DataFrame(data.get('training_data', []))
    
    # Train model
    inventory_model.train(training_data)
    
    # Save model
    inventory_model.save_model(INVENTORY_MODEL_PATH)
    
    return jsonify({'status': 'success', 'message': 'Inventory model trained successfully'})

@app.route('/train/staff', methods=['POST'])
def train_staff():
    """Train the staff scheduling model."""
    data = request.json
    
    # Extract training data
    training_data = pd.DataFrame(data.get('training_data', []))
    
    # Train model
    staff_model.train(training_data)
    
    # Save model
    staff_model.save_model(STAFF_MODEL_PATH)
    
    return jsonify({'status': 'success', 'message': 'Staff scheduling model trained successfully'})

@app.route('/train/suggestions', methods=['POST'])
def train_suggestions():
    """Train the suggestion generator model."""
    data = request.json
    
    # Extract training data
    suggestions_data = pd.DataFrame(data.get('suggestions_data', []))
    features_data = pd.DataFrame(data.get('features_data', []))
    
    # Train model
    suggestion_model.train(suggestions_data, features_data)
    
    # Save model
    suggestion_model.save_model(SUGGESTION_MODEL_PATH)
    
    return jsonify({'status': 'success', 'message': 'Suggestion generator model trained successfully'})

if __name__ == '__main__':
    # Load models
    load_models()
    
    # Start server
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
