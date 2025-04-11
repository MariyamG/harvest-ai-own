# Deployment Steps for Coffee Shop AI Optimization App

This document provides step-by-step instructions for deploying all three components of the Coffee Shop AI Optimization App.

## Prerequisites

Before starting the deployment process, ensure you have:

1. Vercel account credentials
2. Supabase account credentials
3. Google Cloud account credentials
4. Clover Developer account (for API keys)
5. Node.js and npm installed locally
6. Google Cloud SDK installed locally
7. Git installed locally

## Step 1: Prepare the Project for Deployment

Run the deployment preparation script:

```bash
cd /home/ubuntu/coffee-shop-ai
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Set up environment variables
- Build the frontend
- Prepare the backend
- Prepare the AI model
- Create deployment directories and configuration files

## Step 2: Deploy the Frontend to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Log in to Vercel:
```bash
vercel login
```

3. Deploy the frontend:
```bash
cd /home/ubuntu/coffee-shop-ai/deploy/frontend
vercel --prod
```

4. Follow the prompts to complete the deployment.
5. Note the URL provided by Vercel (e.g., https://coffee-shop-ai.vercel.app)

## Step 3: Deploy the Backend to Supabase

1. Create a new Supabase project:
   - Go to https://app.supabase.io/
   - Click "New Project"
   - Enter project details and create the project
   - Note the project URL and API keys

2. Set up the database schema:
   - Go to the SQL Editor in your Supabase project
   - Run the migration scripts from `/home/ubuntu/coffee-shop-ai/supabase/migrations/` in order

3. Configure authentication:
   - Go to Authentication > Settings
   - Enable Email auth provider

4. Update the backend environment variables:
```bash
cd /home/ubuntu/coffee-shop-ai/deploy/backend
```

Edit the `.env` file with your Supabase credentials:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
CLOVER_API_KEY=your_clover_api_key
CLOVER_CLIENT_ID=your_clover_client_id
CLOVER_CLIENT_SECRET=your_clover_client_secret
CLOVER_REDIRECT_URI=https://your-frontend-url.vercel.app/api/clover/callback
AI_MODEL_API_URL=https://your-ai-model-url.run.app
PORT=3000
```

5. Deploy the backend to a hosting service (e.g., Vercel, Heroku, or Railway):
```bash
cd /home/ubuntu/coffee-shop-ai/deploy/backend
vercel --prod
```

6. Note the URL provided by the hosting service (e.g., https://coffee-shop-ai-backend.vercel.app)

## Step 4: Deploy the AI Model to Google Cloud Run

1. Authenticate with Google Cloud:
```bash
gcloud auth login
```

2. Set your Google Cloud project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

3. Build and deploy the AI model:
```bash
cd /home/ubuntu/coffee-shop-ai/deploy/ai-model
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/coffee-shop-ai-model
gcloud run deploy coffee-shop-ai-model \
  --image gcr.io/YOUR_PROJECT_ID/coffee-shop-ai-model \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

4. Note the URL provided by Google Cloud Run (e.g., https://coffee-shop-ai-model-abcdef123-uc.a.run.app)

## Step 5: Connect the Components

1. Update the frontend environment variables in Vercel:
   - Go to your frontend project in the Vercel dashboard
   - Go to Settings > Environment Variables
   - Add the following variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
     - `VITE_API_URL`: Your backend API URL

2. Update the backend environment variables in your hosting service:
   - Go to your backend project in your hosting service dashboard
   - Update the environment variables with:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_KEY`: Your Supabase service role key
     - `AI_MODEL_API_URL`: Your AI model URL from Google Cloud Run

3. Redeploy the frontend and backend if necessary to apply the environment variable changes.

## Step 6: Verify the Deployment

1. Access the frontend URL in your browser
2. Sign up for a new account
3. Navigate through the application to verify all features are working
4. Test the Clover integration by connecting to your Clover account
5. Check that the AI models are generating predictions and suggestions

## Troubleshooting

If you encounter issues during deployment:

1. **Frontend deployment issues:**
   - Check the Vercel deployment logs
   - Verify environment variables are set correctly
   - Ensure the build process completed successfully

2. **Backend deployment issues:**
   - Check the hosting service logs
   - Verify Supabase connection credentials
   - Ensure all required environment variables are set

3. **AI model deployment issues:**
   - Check Google Cloud Run logs
   - Verify the Docker build process completed successfully
   - Ensure the model is accessible via the provided URL

4. **Integration issues:**
   - Check CORS settings in the backend
   - Verify all URLs in environment variables are correct
   - Test API endpoints individually to isolate problems

## Access URLs

After successful deployment, you will have the following URLs:

1. Frontend URL: https://coffee-shop-ai.vercel.app
2. Backend API URL: https://coffee-shop-ai-backend.vercel.app
3. AI Model API URL: https://coffee-shop-ai-model-abcdef123-uc.a.run.app

The Frontend URL is the main access point for users of the application.
