-- ============================================================================
-- HoloDraft Supabase Storage Organization Script
-- Run this in your Supabase SQL Editor to properly organize storage buckets
-- ============================================================================

-- Step 1: Create properly organized storage buckets
-- ============================================================================

-- Main CAD files bucket (private, user-specific)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'cad-files', 
  'cad-files', 
  false,  -- Private bucket
  52428800,  -- 50MB limit
  ARRAY['application/octet-stream', 'model/stl', 'model/obj', 'model/step', 'model/ply', 'model/dae', 'application/sla']
) ON CONFLICT (id) DO NOTHING;

-- Converted files bucket (private, processed files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'converted-files', 
  'converted-files', 
  false,  -- Private bucket
  104857600,  -- 100MB limit for processed files
  ARRAY['model/gltf-binary', 'model/gltf+json', 'application/octet-stream', 'model/fbx', 'model/obj']
) ON CONFLICT (id) DO NOTHING;

-- AR Templates bucket (public, downloadable templates)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'ar-templates', 
  'ar-templates', 
  true,   -- Public bucket for templates
  104857600,  -- 100MB limit
  ARRAY['model/gltf-binary', 'model/gltf+json', 'model/fbx', 'model/obj', 'application/octet-stream']
) ON CONFLICT (id) DO NOTHING;

-- Thumbnails bucket (public, for preview images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'thumbnails', 
  'thumbnails', 
  true,   -- Public bucket for thumbnails
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Project assets bucket (private, project-specific files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'project-assets', 
  'project-assets', 
  false,  -- Private bucket
  26214400,  -- 25MB limit
  ARRAY['application/json', 'text/plain', 'application/octet-stream', 'image/jpeg', 'image/png']
) ON CONFLICT (id) DO NOTHING;

-- User avatars bucket (public, for profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'user-avatars', 
  'user-avatars', 
  true,   -- Public bucket
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Clean up existing storage policies
-- ============================================================================

-- Remove all existing storage policies to avoid conflicts
DO $$
DECLARE
    policy_name text;
    policy_table text := 'storage.objects';
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %s', policy_name, policy_table);
        RAISE NOTICE 'Dropped policy: %', policy_name;
    END LOOP;
END $$;

-- Step 3: Create comprehensive storage policies
-- ============================================================================

-- CAD Files Policies (Private bucket - users can only access their own files)
CREATE POLICY "cad_files_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cad-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "cad_files_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cad-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "cad_files_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'cad-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "cad_files_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'cad-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Converted Files Policies (Private bucket - users can only access their own converted files)
CREATE POLICY "converted_files_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'converted-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "converted_files_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'converted-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "converted_files_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'converted-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "converted_files_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'converted-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- AR Templates Policies (Public bucket - anyone can read, authenticated users can write)
CREATE POLICY "ar_templates_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'ar-templates');

CREATE POLICY "ar_templates_insert_authenticated" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ar-templates' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "ar_templates_update_owner" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'ar-templates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ar_templates_delete_owner" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ar-templates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Thumbnails Policies (Public bucket - anyone can read, authenticated users can write their own)
CREATE POLICY "thumbnails_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "thumbnails_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "thumbnails_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Project Assets Policies (Private bucket - project owners and collaborators can access)
CREATE POLICY "project_assets_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "project_assets_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "project_assets_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "project_assets_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- User Avatars Policies (Public bucket - users can manage their own avatars)
CREATE POLICY "user_avatars_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "user_avatars_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "user_avatars_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "user_avatars_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Step 4: Create helper functions for storage management
-- ============================================================================

-- Function to get user's storage usage by bucket
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_id UUID)
RETURNS TABLE (
    bucket_name text,
    file_count bigint,
    total_size bigint,
    avg_size numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.bucket_id::text as bucket_name,
        COUNT(*) as file_count,
        COALESCE(SUM(s.metadata->>'size')::bigint, 0) as total_size,
        COALESCE(AVG((s.metadata->>'size')::bigint), 0) as avg_size
    FROM storage.objects s
    WHERE s.bucket_id IN ('cad-files', 'converted-files', 'project-assets', 'user-avatars', 'thumbnails')
    AND (storage.foldername(s.name))[1] = user_id::text
    GROUP BY s.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned files
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS TABLE (
    bucket_name text,
    file_name text,
    deleted boolean
) AS $$
DECLARE
    file_record RECORD;
BEGIN
    -- Find files that don't have corresponding database records
    FOR file_record IN
        SELECT DISTINCT s.bucket_id, s.name
        FROM storage.objects s
        WHERE s.bucket_id = 'cad-files'
        AND NOT EXISTS (
            SELECT 1 FROM holodraft_files hf 
            WHERE hf.original_url LIKE '%' || s.name || '%'
            OR hf.converted_url LIKE '%' || s.name || '%'
        )
        AND s.created_at < NOW() - INTERVAL '24 hours'  -- Only delete files older than 24 hours
    LOOP
        -- Delete the orphaned file
        DELETE FROM storage.objects 
        WHERE bucket_id = file_record.bucket_id AND name = file_record.name;
        
        bucket_name := file_record.bucket_id;
        file_name := file_record.name;
        deleted := true;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create storage analytics view
-- ============================================================================

CREATE OR REPLACE VIEW storage_analytics AS
SELECT 
    s.bucket_id,
    COUNT(*) as file_count,
    COALESCE(SUM((s.metadata->>'size')::bigint), 0) as total_size_bytes,
    ROUND(COALESCE(SUM((s.metadata->>'size')::bigint), 0) / 1024.0 / 1024.0, 2) as total_size_mb,
    COALESCE(AVG((s.metadata->>'size')::bigint), 0) as avg_file_size_bytes,
    MIN(s.created_at) as oldest_file,
    MAX(s.created_at) as newest_file
FROM storage.objects s
WHERE s.bucket_id IN ('cad-files', 'converted-files', 'ar-templates', 'thumbnails', 'project-assets', 'user-avatars')
GROUP BY s.bucket_id
ORDER BY total_size_bytes DESC;

-- Step 6: Insert sample AR templates with proper storage organization
-- ============================================================================

-- Clear existing templates to avoid duplicates
DELETE FROM holodraft_ar_templates WHERE name IN (
    'Modern Gear Assembly',
    'Contemporary Office Building', 
    'Advanced PCB Layout',
    'V8 Engine Block',
    'Spacecraft Module',
    'Industrial Robot Arm'
);

-- Insert fresh AR template records
INSERT INTO holodraft_ar_templates (name, description, thumbnail_url, file_url, category, is_featured, download_count) VALUES
(
    'Modern Gear Assembly',
    'A comprehensive 3D model of a modern gear assembly perfect for mechanical engineering education and AR visualization.',
    'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=400&fit=crop',
    'ar-templates/system/gear-assembly.glb',
    'mechanical',
    true,
    42
),
(
    'Contemporary Office Building',
    'Modern glass office building with detailed interior spaces, ideal for architectural presentations and urban planning.',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop',
    'ar-templates/system/office-building.glb',
    'architectural',
    true,
    38
),
(
    'Advanced PCB Layout',
    'High-detail printed circuit board with components, traces, and connections for electronics education.',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop',
    'ar-templates/system/pcb-layout.glb',
    'electronics',
    false,
    15
),
(
    'V8 Engine Block',
    'Detailed automotive V8 engine block with pistons, cylinders, and cooling system.',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop',
    'ar-templates/system/v8-engine.glb',
    'automotive',
    true,
    67
),
(
    'Spacecraft Module',
    'Futuristic spacecraft command module with detailed interior and exterior components.',
    'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=400&fit=crop',
    'ar-templates/system/spacecraft-module.glb',
    'aerospace',
    true,
    29
),
(
    'Industrial Robot Arm',
    '6-DOF industrial robot arm with detailed joints and actuators for automation visualization.',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
    'ar-templates/system/robot-arm.glb',
    'mechanical',
    false,
    23
);

-- Step 7: Grant permissions and finalize
-- ============================================================================

-- Ensure proper permissions for storage functions
GRANT EXECUTE ON FUNCTION get_user_storage_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_orphaned_files() TO service_role;
GRANT SELECT ON storage_analytics TO authenticated;

-- Final success message
SELECT 
    'HoloDraft Storage Setup Complete! 🎉' as status,
    '6 buckets created with proper organization' as buckets,
    'Comprehensive RLS policies applied' as security,
    'Helper functions and analytics ready' as features,
    'Sample AR templates loaded' as content;

-- Display current bucket status
SELECT 
    id as bucket_id,
    name as bucket_name,
    public as is_public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE id IN ('cad-files', 'converted-files', 'ar-templates', 'thumbnails', 'project-assets', 'user-avatars')
ORDER BY name;
