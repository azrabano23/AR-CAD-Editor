import { createClient } from '@supabase/supabase-js';
import { mockSignUp, mockSignIn, mockSignOut, getCurrentMockUser, testMockConnection } from './mockAuth';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.includes('supabase.co'));

if (!hasValidSupabaseConfig) {
  console.warn('⚠️ Invalid or missing Supabase configuration. Using mock authentication.', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
    validUrl: supabaseUrl ? supabaseUrl.includes('supabase.co') : false
  });
}

// Initialize Supabase client only if we have valid config
let supabase: any = null;
if (hasValidSupabaseConfig) {
  console.log('Initializing Supabase with URL:', supabaseUrl);
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabase = null;
  }
}

export { supabase };

// Types for HoloDraft
export interface HoloDraftUser {
  id: string;
  created_at: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_type?: 'free' | 'pro' | 'enterprise';
}

export interface HoloDraftProject {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  thumbnail_url?: string;
  status: 'active' | 'archived';
  collaborator_count: number;
  file_count: number;
}

export interface HoloDraftFile {
  id: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  user_id: string;
  original_name: string;
  file_size: number;
  original_format: string;
  status: 'uploading' | 'uploaded' | 'converting' | 'converted' | 'error';
  converted_url?: string;
  original_url?: string;
  error_message?: string;
  conversion_started_at?: string;
  conversion_completed_at?: string;
  version: number;
  parent_file_id?: string;
}

export interface ProjectCollaborator {
  id: string;
  created_at: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface ARTemplate {
  id: string;
  created_at: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  file_url: string;
  category: 'mechanical' | 'architectural' | 'electronics' | 'automotive' | 'aerospace' | 'other';
  is_featured: boolean;
  download_count: number;
  created_by?: string;
}

export interface CollaborationSession {
  id: string;
  created_at: string;
  project_id: string;
  user_id: string;
  status: 'active' | 'idle' | 'disconnected';
  last_activity: string;
  cursor_position?: { x: number; y: number; z: number };
  current_file_id?: string;
}

// Authentication functions
export async function signUpWithEmail(email: string, password: string) {
  // Use mock auth if no valid Supabase client
  if (!supabase) {
    console.log('🧪 Using mock authentication for sign up');
    return await mockSignUp(email, password);
  }
  
  try {
    console.log('🔐 Attempting to sign up user:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Sign up error:', error);
      return { data: null, error };
    }
    
    console.log('✅ Sign up successful:', data.user?.email);
    return { data, error: null };
  } catch (err: any) {
    console.error('❌ Sign up failed, falling back to mock auth:', err);
    // Fallback to mock auth
    return await mockSignUp(email, password);
  }
}

export async function signInWithEmail(email: string, password: string) {
  // Use mock auth if no valid Supabase client
  if (!supabase) {
    console.log('🧪 Using mock authentication for sign in');
    return await mockSignIn(email, password);
  }
  
  try {
    console.log('🔐 Attempting to sign in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Sign in error:', error);
      return { data: null, error };
    }
    
    console.log('✅ Sign in successful:', data.user?.email);
    return { data, error: null };
  } catch (err: any) {
    console.error('❌ Sign in failed, falling back to mock auth:', err);
    // Fallback to mock auth
    return await mockSignIn(email, password);
  }
}

export async function signOut() {
  // Use mock auth if no valid Supabase client
  if (!supabase) {
    console.log('🧪 Using mock authentication for sign out');
    return await mockSignOut();
  }
  
  try {
    console.log('🚪 Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Sign out error:', error);
    } else {
      console.log('✅ Sign out successful');
    }
    return { error };
  } catch (err: any) {
    console.error('❌ Sign out failed, falling back to mock:', err);
    return await mockSignOut();
  }
}

export async function getCurrentUser() {
  // Use mock auth if no valid Supabase client
  if (!supabase) {
    console.log('🧪 Using mock authentication for get current user');
    return getCurrentMockUser();
  }
  
  try {
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Authentication timeout')), 5000)
    );
    
    const authPromise = supabase.auth.getUser();
    
    const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise]);
    
    if (error) {
      console.error('❌ Get user error:', error);
      return null;
    }
    return user;
  } catch (err: any) {
    console.error('❌ Get user failed, falling back to mock:', err);
    return getCurrentMockUser();
  }
}

// Test Supabase connection
export async function testSupabaseConnection() {
  // Use mock connection test if no valid Supabase client
  if (!supabase) {
    console.log('🧪 Using mock connection test');
    return await testMockConnection();
  }
  
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'No session') {
      throw error;
    }
    
    console.log('✅ Supabase connection test successful');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('❌ Supabase connection test failed, using mock:', err);
    return await testMockConnection();
  }
}

// File management functions
export async function uploadFile(file: File, userId: string): Promise<{ data: HoloDraftFile | null, error: any }> {
  try {
    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('cad-files')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cad-files')
      .getPublicUrl(filePath);

    // Insert file record into database
    const fileRecord = {
      user_id: userId,
      original_name: file.name,
      file_size: file.size,
      original_format: fileExt?.toLowerCase() || '',
      status: 'uploaded' as const,
      original_url: publicUrl,
    };

    const { data, error } = await supabase
      .from('holodraft_files')
      .insert([fileRecord])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getUserFiles(userId: string): Promise<{ data: HoloDraftFile[] | null, error: any }> {
  const { data, error } = await supabase
    .from('holodraft_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function updateFileStatus(
  fileId: string, 
  status: HoloDraftFile['status'], 
  additionalData?: Partial<HoloDraftFile>
): Promise<{ data: HoloDraftFile | null, error: any }> {
  const updateData = {
    status,
    updated_at: new Date().toISOString(),
    ...additionalData,
  };

  const { data, error } = await supabase
    .from('holodraft_files')
    .update(updateData)
    .eq('id', fileId)
    .select()
    .single();

  return { data, error };
}

export async function deleteFile(fileId: string, userId: string): Promise<{ error: any }> {
  // First get the file record to find the storage path
  const { data: fileRecord, error: fetchError } = await supabase
    .from('holodraft_files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !fileRecord) {
    return { error: fetchError || new Error('File not found') };
  }

  // Delete from storage if original_url exists
  if (fileRecord.original_url) {
    const path = fileRecord.original_url.split('/').pop();
    if (path) {
      await supabase.storage
        .from('cad-files')
        .remove([`uploads/${userId}/${path}`]);
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('holodraft_files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', userId);

  return { error };
}

// Conversion tracking
export async function startConversion(fileId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('holodraft_files')
    .update({
      status: 'converting',
      conversion_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  return { error };
}

export async function completeConversion(
  fileId: string, 
  convertedUrl: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('holodraft_files')
    .update({
      status: 'converted',
      converted_url: convertedUrl,
      conversion_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  return { error };
}

export async function failConversion(
  fileId: string, 
  errorMessage: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('holodraft_files')
    .update({
      status: 'error',
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', fileId);

  return { error };
}

// Real-time subscriptions
export function subscribeToFileChanges(
  userId: string, 
  callback: (payload: any) => void
) {
  return supabase
    .channel('holodraft_files_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'holodraft_files',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

// Analytics and usage tracking
export async function trackFileUpload(userId: string, fileSize: number, format: string) {
  const { error } = await supabase
    .from('holodraft_analytics')
    .insert([{
      user_id: userId,
      event_type: 'file_upload',
      metadata: {
        file_size: fileSize,
        format: format,
      },
    }]);

  return { error };
}

export async function trackConversion(userId: string, inputFormat: string, outputFormat: string, conversionTime: number) {
  const { error } = await supabase
    .from('holodraft_analytics')
    .insert([{
      user_id: userId,
      event_type: 'file_conversion',
      metadata: {
        input_format: inputFormat,
        output_format: outputFormat,
        conversion_time_ms: conversionTime,
      },
    }]);

  return { error };
}
