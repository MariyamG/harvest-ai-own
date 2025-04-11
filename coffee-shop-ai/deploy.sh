#!/bin/bash

# This script prepares the Coffee Shop AI Optimization App for deployment

# Set up environment variables
echo "Setting up environment variables..."
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOL
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Clover API Configuration
CLOVER_API_KEY=your_clover_api_key
CLOVER_CLIENT_ID=your_clover_client_id
CLOVER_CLIENT_SECRET=your_clover_client_secret
CLOVER_REDIRECT_URI=your_redirect_uri

# AI Model API Configuration
AI_MODEL_API_URL=your_ai_model_api_url

# Server Configuration
PORT=3000
EOL
  echo ".env file created. Please update with your actual values."
else
  echo ".env file already exists."
fi

# Prepare frontend for deployment
echo "Preparing frontend for deployment..."
cd frontend
npm install
npm run build
cd ..

# Prepare backend for deployment
echo "Preparing backend for deployment..."
cd backend
npm install
cd ..

# Prepare AI model for deployment
echo "Preparing AI model for deployment..."
cd ai-model
pip install -r requirements.txt
cd ..

# Create deployment directories
echo "Creating deployment directories..."
mkdir -p deploy/frontend
mkdir -p deploy/backend
mkdir -p deploy/ai-model

# Copy frontend build to deployment directory
echo "Copying frontend build..."
cp -r frontend/dist/* deploy/frontend/

# Copy backend files to deployment directory
echo "Copying backend files..."
cp -r backend/* deploy/backend/
cp .env deploy/backend/

# Copy AI model files to deployment directory
echo "Copying AI model files..."
cp -r ai-model/* deploy/ai-model/

# Create Dockerfile for AI model
echo "Creating Dockerfile for AI model..."
cat > deploy/ai-model/Dockerfile << EOL
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8080
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
EOL

# Create vercel.json for frontend
echo "Creating vercel.json for frontend..."
cat > deploy/frontend/vercel.json << EOL
{
  "version": 2,
  "builds": [
    {
      "src": "**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    },
    {
      "src": "/[^.]+",
      "dest": "/index.html"
    }
  ]
}
EOL

echo "Deployment preparation complete!"
echo "Please follow the deployment guide in docs/deployment-guide.md for next steps."
