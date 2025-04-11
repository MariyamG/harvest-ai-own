# Deployment Guide for Coffee Shop AI Optimization App

This guide provides instructions for deploying the Coffee Shop AI Optimization App to production environments.

## 1. Frontend Deployment to Vercel

### Prerequisites
- Existing Vercel account
- Git repository with the frontend code

### Deployment Steps

1. **Prepare the frontend for production**

```bash
cd /home/ubuntu/coffee-shop-ai/frontend
npm run build
```

2. **Create a Vercel configuration file**

Create a `vercel.json` file in the frontend directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    },
    {
      "src": "/[^.]+",
      "dest": "/dist/index.html"
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_API_URL": "@api_url"
  }
}
```

3. **Install Vercel CLI and deploy**

```bash
npm install -g vercel
vercel login
vercel --prod
```

4. **Set up environment variables in Vercel**

After deployment, go to the Vercel dashboard, select your project, and add the following environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `API_URL`: URL of your deployed backend API

## 2. Backend Deployment to Supabase

### Prerequisites
- Existing Supabase account

### Deployment Steps

1. **Create a new Supabase project**

- Go to [Supabase Dashboard](https://app.supabase.io/)
- Click "New Project"
- Enter project details and create the project

2. **Set up database schema**

- Go to the SQL Editor in your Supabase project
- Run the migration scripts in order:

```sql
-- Run 01_initial_schema.sql
-- Run 02_suggestion_functions.sql
-- Run 03_triggers_and_functions.sql
-- Run 04_sample_data.sql (optional for production)
```

3. **Configure authentication**

- Go to Authentication > Settings
- Enable Email auth provider
- Configure additional providers if needed

4. **Set up storage buckets**

- Go to Storage
- Create a new bucket called "coffee-shop-assets"
- Set bucket permissions to public

5. **Deploy backend API to a hosting service**

```bash
cd /home/ubuntu/coffee-shop-ai/backend
npm install
npm run build
```

6. **Set up environment variables**

Create a `.env` file with the following variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
PORT=3000
CLOVER_API_KEY=your_clover_api_key
CLOVER_CLIENT_ID=your_clover_client_id
CLOVER_CLIENT_SECRET=your_clover_client_secret
CLOVER_REDIRECT_URI=https://your-domain.com/api/clover/callback
AI_MODEL_API_URL=https://your-ai-model-api-url
```

## 3. AI Model Deployment to Google Cloud Run

### Prerequisites
- Google Cloud account
- Google Cloud SDK installed

### Deployment Steps

1. **Prepare the AI model for deployment**

```bash
cd /home/ubuntu/coffee-shop-ai/ai-model
pip install gunicorn
```

2. **Create a Dockerfile**

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
```

3. **Create a requirements.txt file**

```
flask==2.0.1
flask-cors==3.0.10
pandas==1.3.3
numpy==1.21.2
scikit-learn==1.0
joblib==1.1.0
gunicorn==20.1.0
```

4. **Build and deploy to Google Cloud Run**

```bash
# Initialize gcloud
gcloud init

# Build the container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/coffee-shop-ai-model

# Deploy to Cloud Run
gcloud run deploy coffee-shop-ai-model \
  --image gcr.io/YOUR_PROJECT_ID/coffee-shop-ai-model \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

5. **Update the backend with the AI model API URL**

After deployment, update the `AI_MODEL_API_URL` environment variable in your backend deployment with the URL provided by Google Cloud Run.

## 4. Connecting the Components

1. **Update frontend configuration**

Update the `.env` file in the frontend project with the URLs of your deployed services:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-backend-api-url
```

2. **Update backend configuration**

Update the `.env` file in the backend project with the URLs of your deployed services:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
AI_MODEL_API_URL=https://your-ai-model-api-url
```

## 5. Final Verification

1. **Test the deployed application**
   - Navigate to your Vercel-deployed frontend URL
   - Verify that you can log in
   - Check that all features are working correctly

2. **Monitor application performance**
   - Set up monitoring in Vercel, Supabase, and Google Cloud
   - Check for any errors or performance issues

## 6. Maintenance and Updates

1. **Updating the frontend**
   - Make changes to the code
   - Run `npm run build`
   - Deploy using `vercel --prod`

2. **Updating the backend**
   - Make changes to the code
   - Deploy to your hosting service

3. **Updating the AI models**
   - Make changes to the model code
   - Rebuild and redeploy the container to Google Cloud Run

## 7. Troubleshooting

### Common Issues

1. **CORS errors**
   - Ensure CORS is properly configured in your backend and AI model API

2. **Authentication issues**
   - Verify Supabase configuration and keys
   - Check that environment variables are correctly set

3. **API connection issues**
   - Verify that all service URLs are correct
   - Check network connectivity between services
