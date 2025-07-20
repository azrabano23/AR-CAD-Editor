-- HoloDraft Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.holodraft_users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'pro', 'enterprise'))
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.holodraft_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  collaborator_count INTEGER DEFAULT 1,
  file_count INTEGER DEFAULT 0
);

-- Project collaborators table
CREATE TABLE IF NOT EXISTS public.holodraft_project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID REFERENCES holodraft_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  UNIQUE(project_id, user_id)
);

-- Files table
CREATE TABLE IF NOT EXISTS public.holodraft_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID REFERENCES holodraft_projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  parent_file_id UUID REFERENCES holodraft_files(id) ON DELETE SET NULL
);

-- AR Templates table
CREATE TABLE IF NOT EXISTS public.holodraft_ar_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  file_url TEXT NOT NULL,
  category TEXT DEFAULT 'other' CHECK (category IN ('mechanical', 'architectural', 'electronics', 'automotive', 'aerospace', 'other')),
  is_featured BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS public.holodraft_collaboration_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  project_id UUID REFERENCES holodraft_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'disconnected')),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cursor_position JSONB,
  current_file_id UUID REFERENCES holodraft_files(id) ON DELETE SET NULL
);

-- Analytics table
CREATE TABLE IF NOT EXISTS public.holodraft_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  session_id TEXT,
  ip_address INET
);

-- Create storage bucket for CAD files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cad-files', 'cad-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for AR templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ar-templates', 'ar-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE holodraft_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE holodraft_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE holodraft_project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE holodraft_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE holodraft_ar_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE holodraft_collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE holodraft_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON holodraft_users;
DROP POLICY IF EXISTS "Users can update own profile" ON holodraft_users;
DROP POLICY IF EXISTS "Users can insert own profile" ON holodraft_users;

DROP POLICY IF EXISTS "Users can view own projects" ON holodraft_projects;
DROP POLICY IF EXISTS "Users can create projects" ON holodraft_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON holodraft_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON holodraft_projects;

DROP POLICY IF EXISTS "Users can view own files" ON holodraft_files;
DROP POLICY IF EXISTS "Users can upload files" ON holodraft_files;
DROP POLICY IF EXISTS "Users can update own files" ON holodraft_files;
DROP POLICY IF EXISTS "Users can delete own files" ON holodraft_files;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON holodraft_users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON holodraft_users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON holodraft_users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can view own projects" ON holodraft_projects 
  FOR SELECT USING (auth.uid() = owner_id OR is_public = true);

CREATE POLICY "Users can create projects" ON holodraft_projects 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects" ON holodraft_projects 
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects" ON holodraft_projects 
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for project collaborators
CREATE POLICY "Users can view project collaborators" ON holodraft_project_collaborators 
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT owner_id FROM holodraft_projects WHERE id = project_id)
  );

CREATE POLICY "Project owners can manage collaborators" ON holodraft_project_collaborators 
  FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM holodraft_projects WHERE id = project_id)
  );

-- RLS Policies for files table
CREATE POLICY "Users can view own files" ON holodraft_files 
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (project_id IS NOT NULL AND auth.uid() IN (
      SELECT owner_id FROM holodraft_projects WHERE id = project_id
    ))
  );

CREATE POLICY "Users can upload files" ON holodraft_files 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON holodraft_files 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON holodraft_files 
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for AR templates (public read, authenticated write)
CREATE POLICY "Anyone can view AR templates" ON holodraft_ar_templates 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create templates" ON holodraft_ar_templates 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own templates" ON holodraft_ar_templates 
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for collaboration sessions
CREATE POLICY "Users can view project collaboration sessions" ON holodraft_collaboration_sessions 
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT owner_id FROM holodraft_projects WHERE id = project_id)
  );

CREATE POLICY "Users can create collaboration sessions" ON holodraft_collaboration_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON holodraft_collaboration_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for analytics
CREATE POLICY "Users can view own analytics" ON holodraft_analytics 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON holodraft_analytics 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage Policies
CREATE POLICY "Users can upload their own files" ON storage.objects 
  FOR INSERT WITH CHECK (
    bucket_id = 'cad-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files" ON storage.objects 
  FOR SELECT USING (
    bucket_id = 'cad-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own files" ON storage.objects 
  FOR UPDATE USING (
    bucket_id = 'cad-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files" ON storage.objects 
  FOR DELETE USING (
    bucket_id = 'cad-files' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- AR Templates storage policies (public read)
CREATE POLICY "Anyone can view AR template files" ON storage.objects 
  FOR SELECT USING (bucket_id = 'ar-templates');

CREATE POLICY "Authenticated users can upload AR templates" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'ar-templates' AND auth.uid() IS NOT NULL);

-- Thumbnails storage policies (public read)
CREATE POLICY "Anyone can view thumbnails" ON storage.objects 
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid() IS NOT NULL);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.holodraft_users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create holodraft_users record when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables
DROP TRIGGER IF EXISTS set_updated_at ON holodraft_users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON holodraft_users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON holodraft_projects;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON holodraft_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON holodraft_files;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON holodraft_files
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON holodraft_collaboration_sessions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON holodraft_collaboration_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some sample AR templates
INSERT INTO holodraft_ar_templates (name, description, thumbnail_url, file_url, category, is_featured) VALUES
('Mechanical Gear System', 'A detailed 3D model of interlocking gears perfect for mechanical engineering demonstrations', 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400', 'https://example.com/gear-system.fbx', 'mechanical', true),
('Modern Office Building', 'Contemporary office building design with glass facades and modern architecture', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400', 'https://example.com/office-building.fbx', 'architectural', true),
('Circuit Board Layout', 'Detailed PCB layout showing electronic components and connections', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400', 'https://example.com/circuit-board.fbx', 'electronics', false),
('Car Engine Block', 'High-detail automotive engine block with pistons and cylinders', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400', 'https://example.com/engine-block.fbx', 'automotive', true)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_holodraft_projects_owner_id ON holodraft_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_holodraft_files_user_id ON holodraft_files(user_id);
CREATE INDEX IF NOT EXISTS idx_holodraft_files_project_id ON holodraft_files(project_id);
CREATE INDEX IF NOT EXISTS idx_holodraft_files_status ON holodraft_files(status);
CREATE INDEX IF NOT EXISTS idx_holodraft_collaboration_sessions_project_id ON holodraft_collaboration_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_holodraft_analytics_user_id ON holodraft_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_holodraft_analytics_event_type ON holodraft_analytics(event_type);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Complete setup message
SELECT 'HoloDraft database setup completed successfully! 🎉' as setup_status;
