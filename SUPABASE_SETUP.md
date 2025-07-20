# Supabase Setup Guide for HoloDraft

Your app is currently using **mock authentication** because the Supabase project URL is not accessible. Here's how to set up a new Supabase project:

## Current Status
✅ **App is working with mock authentication** - You can sign up, sign in, and test the app
❌ **Real Supabase backend needed** - For production features like file storage and real-time collaboration

## Quick Setup Steps

### 1. Create a Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub, Google, or email

### 2. Create a New Project
1. Click "New Project"
2. Choose your organization
3. Set project name: `holodraft-ar-visualization` 
4. Set database password (save this!)
5. Choose region closest to you
6. Click "Create new project"

### 3. Get Your Project Credentials
Once your project is ready (takes ~2 minutes):

1. Go to **Settings** → **API** 
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Key**: `eyJhbGci...` (long string)

### 4. Update Your Environment Variables
Replace the values in your `.env` file:

```bash
# Update these with your new Supabase project details
REACT_APP_SUPABASE_URL=https://your-new-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-new-anon-key-here
```

### 5. Set Up Database Tables
Run these SQL commands in your Supabase **SQL Editor**:

```sql
-- Users table (extends auth.users)
CREATE TABLE public.holodraft_users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro', 'enterprise'))
);

-- Projects table
CREATE TABLE public.holodraft_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  collaborator_count INTEGER DEFAULT 1,
  file_count INTEGER DEFAULT 0
);

-- Files table
CREATE TABLE public.holodraft_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID REFERENCES holodraft_projects(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  original_format TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploading', 'uploaded', 'converting', 'converted', 'error')),
  converted_url TEXT,
  original_url TEXT,
  error_message TEXT,
  conversion_started_at TIMESTAMP WITH TIME ZONE,
  conversion_completed_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES holodraft_files(id)
);

-- Storage bucket for CAD files
INSERT INTO storage.buckets (id, name, public) VALUES ('cad-files', 'cad-files', true);

-- Row Level Security policies
ALTER TABLE holodraft_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE holodraft_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE holodraft_files ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own data
CREATE POLICY "Users can view own profile" ON holodraft_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON holodraft_users FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON holodraft_projects FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can create projects" ON holodraft_projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own projects" ON holodraft_projects FOR UPDATE USING (auth.uid() = owner_id);

-- Files policies  
CREATE POLICY "Users can view own files" ON holodraft_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload files" ON holodraft_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own files" ON holodraft_files FOR UPDATE USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cad-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT USING (bucket_id = 'cad-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 6. Test Your Setup
1. Restart your development server: `npm start`
2. Look for the console message: "Initializing Supabase with URL..."
3. Click "🧪 Test Connection" - should show "✅ Supabase connection successful!"
4. Try signing up with a real email

## Current Mock Authentication

While setting up Supabase, your app uses **mock authentication**:
- ✅ Sign up and sign in work locally
- ✅ User sessions are stored in localStorage  
- ✅ You can test all UI features
- ❌ No real database or file storage
- ❌ No real-time collaboration

## Need Help?

If you run into issues:
1. Check the browser console for error messages
2. Verify your `.env` file has the correct Supabase URL and key
3. Make sure your Supabase project is not paused
4. Ensure RLS policies are set up correctly

The app will automatically switch from mock auth to real Supabase once you update your environment variables!
