# Setup Instructions for Coffee Shop AI Optimization App

This document provides detailed setup instructions for getting the Coffee Shop AI Optimization App running locally for development.

## Prerequisites

Before starting, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v7 or higher)
- Python 3.9+
- pip
- Git

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/coffee-shop-ai.git
cd coffee-shop-ai
```

## Step 2: Set Up the Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit the `.env` file with your configuration:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## Step 3: Set Up the Backend

1. Install dependencies:
```bash
cd ../backend
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit the `.env` file with your configuration:
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

4. Start the development server:
```bash
npm run dev
```

The backend API will be available at http://localhost:3000

## Step 4: Set Up the AI Model

1. Create a Python virtual environment:
```bash
cd ../ai-model
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask server:
```bash
python app.py
```

The AI model API will be available at http://localhost:5000

## Step 5: Set Up Supabase

1. Create a Supabase account at https://supabase.io if you don't have one
2. Create a new project
3. Go to the SQL Editor in your Supabase project
4. Run the migration scripts from the `supabase/migrations` directory in order:
   - `01_initial_schema.sql`
   - `02_suggestion_functions.sql`
   - `03_triggers_and_functions.sql`
   - `04_sample_data.sql` (optional for development)

## Step 6: Set Up Clover Developer Account

1. Create a Clover Developer account at https://sandbox.dev.clover.com/developers
2. Create a new app
3. Configure the app with the following:
   - App name: Coffee Shop AI
   - App type: Web
   - Permission: Read/Write access to all data
   - Redirect URI: http://localhost:3000/api/clover/callback
4. Note your App ID and Secret

## Step 7: Running the Complete Application

1. Ensure all three components are running:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - AI Model: http://localhost:5000

2. Open your browser and navigate to http://localhost:5173

3. Sign up for a new account

4. Configure your coffee shop settings

5. Connect to your Clover sandbox account

## Development Workflow

### Frontend Development

- Edit React components in the `frontend/src` directory
- The development server will automatically reload when you make changes

### Backend Development

- Edit Express routes and controllers in the `backend` directory
- The development server will automatically reload when you make changes

### AI Model Development

- Edit Python models in the `ai-model/src` directory
- Restart the Flask server to apply changes

## Running Tests

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

### AI Model Tests

```bash
cd ai-model
pytest
```

## Building for Production

### Frontend

```bash
cd frontend
npm run build
```

The build output will be in the `frontend/dist` directory.

### Backend

```bash
cd backend
npm run build
```

### AI Model

The AI model can be deployed as a Flask application or containerized using Docker.

## Troubleshooting

### Common Issues

1. **CORS errors**
   - Ensure all URLs in environment variables are correct
   - Check that the backend CORS configuration includes your frontend URL

2. **Supabase connection issues**
   - Verify your Supabase URL and API keys
   - Check that your IP address is allowed in Supabase

3. **Clover API errors**
   - Ensure your Clover API keys are correct
   - Verify that your redirect URI matches the one in your Clover app settings

4. **AI model not responding**
   - Check that the Flask server is running
   - Verify the AI model API URL in your backend environment variables

For more detailed troubleshooting, refer to the documentation for each component.
