# Coffee Shop AI Optimization App

An AI-powered application for optimizing coffee shop operations through sales forecasting, inventory management, staff scheduling, and intelligent suggestions.

## Features

- **Dashboard**: Real-time overview of sales, inventory, and staffing with AI-powered insights
- **Peak Hour Prediction**: Machine learning model to forecast customer traffic patterns
- **Inventory Optimization**: Smart inventory management with reorder suggestions
- **Staff Scheduling**: Optimize staff schedules based on predicted customer traffic
- **End-of-Day Suggestions**: AI-generated operational recommendations
- **Clover POS Integration**: Seamless connection with Clover Mini point-of-sale system

## Project Structure

The project is organized into three main components:

### 1. Frontend (React.js)
- Located in `/frontend`
- Built with React, Vite, and Tailwind CSS
- Responsive design for both desktop and mobile devices

### 2. Backend (Node.js + Supabase)
- Located in `/backend`
- Express.js API server
- Supabase for database, authentication, and real-time features

### 3. AI Models (Python + Flask)
- Located in `/ai-model`
- Machine learning models for prediction and optimization
- Flask API for model access

## Getting Started

### Prerequisites

- Node.js 16+
- Python 3.9+
- Supabase account
- Clover Developer account

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/coffee-shop-ai.git
cd coffee-shop-ai
```

2. **Set up the frontend**

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Set up the backend**

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

4. **Set up the AI models**

```bash
cd ai-model
pip install -r requirements.txt
python app.py
```

## Configuration

### Frontend Configuration

Create a `.env` file in the frontend directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
```

### Backend Configuration

Create a `.env` file in the backend directory with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=3000
CLOVER_API_KEY=your_clover_api_key
CLOVER_CLIENT_ID=your_clover_client_id
CLOVER_CLIENT_SECRET=your_clover_client_secret
CLOVER_REDIRECT_URI=http://localhost:3000/api/clover/callback
AI_MODEL_API_URL=http://localhost:5000
```

## Development

### Running Tests

**Frontend Tests**
```bash
cd frontend
npm test
```

**Backend Tests**
```bash
cd backend
npm test
```

**AI Model Tests**
```bash
cd ai-model
pytest
```

### Building for Production

**Frontend**
```bash
cd frontend
npm run build
```

**Backend**
```bash
cd backend
npm run build
```

## Deployment

See the [Deployment Guide](./docs/deployment-guide.md) for detailed instructions on deploying the application to production environments.

## Architecture

### Database Schema

The application uses the following main tables in Supabase:

- **users**: User accounts and profiles
- **sales**: Sales transaction data
- **inventory**: Inventory items and stock levels
- **staff**: Staff member information
- **shifts**: Staff work schedules
- **suggestions**: AI-generated operational suggestions
- **forecasts**: Customer traffic forecasts

### AI Models

The application includes the following AI models:

- **Peak Hour Predictor**: Forecasts customer traffic patterns
- **Inventory Optimizer**: Recommends optimal inventory levels
- **Staff Scheduler**: Optimizes staff scheduling
- **Suggestion Generator**: Generates operational recommendations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Clover API for point-of-sale integration
- Supabase for backend infrastructure
- React and Vite for frontend development
- scikit-learn for machine learning models
