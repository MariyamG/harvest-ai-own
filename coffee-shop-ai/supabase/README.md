# Supabase Configuration for Coffee Shop AI Optimization App

This directory contains the Supabase configuration files and SQL scripts for the Coffee Shop AI Optimization App.

## Database Schema

The application uses the following tables:

1. **users** - Store user information and authentication
2. **sales** - Track sales transactions from Clover POS
3. **inventory** - Manage inventory items and stock levels
4. **staff** - Store staff information
5. **shifts** - Track staff work schedules
6. **suggestions** - Store AI-generated operational suggestions
7. **forecasts** - Store peak hour and sales forecasts

## Setup Instructions

1. Create a Supabase project at https://supabase.com
2. Run the SQL scripts in the `migrations` directory to set up the database schema
3. Configure the environment variables in the frontend and backend applications

## API Endpoints

The Supabase backend provides the following functionality:

- Authentication and user management
- Real-time data synchronization
- Database access for all application tables
- Storage for any uploaded files or images

## Security

- Row-level security policies are implemented to ensure data isolation between users
- API keys should be kept secure and never exposed in client-side code
