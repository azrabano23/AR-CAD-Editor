-- 3D Printing Database Schema

-- Table for storing printer information
CREATE TABLE printers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('usb', 'network', 'bluetooth')),
  status VARCHAR(50) CHECK (status IN ('online', 'offline', 'printing', 'error')) DEFAULT 'offline',
  connection_string VARCHAR(255),
  model VARCHAR(255),
  capabilities JSONB DEFAULT '{}',
  temperature JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing print jobs
CREATE TABLE print_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  printer_id UUID REFERENCES printers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) CHECK (status IN ('queued', 'preparing', 'printing', 'paused', 'completed', 'failed', 'cancelled')) DEFAULT 'queued',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  settings JSONB NOT NULL DEFAULT '{}',
  file_path VARCHAR(500),
  estimated_time INTEGER, -- in seconds
  elapsed_time INTEGER DEFAULT 0, -- in seconds
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing print job logs/events
CREATE TABLE print_job_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES print_jobs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing 3D file metadata
CREATE TABLE print_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) CHECK (file_type IN ('stl', 'obj', 'gcode', '3mf')),
  file_size BIGINT,
  file_path VARCHAR(500),
  metadata JSONB DEFAULT '{}', -- dimensions, volume, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_printers_user_id ON printers(user_id);
CREATE INDEX idx_printers_status ON printers(status);
CREATE INDEX idx_print_jobs_user_id ON print_jobs(user_id);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_print_jobs_printer_id ON print_jobs(printer_id);
CREATE INDEX idx_print_jobs_created_at ON print_jobs(created_at);
CREATE INDEX idx_print_job_logs_job_id ON print_job_logs(job_id);
CREATE INDEX idx_print_files_user_id ON print_files(user_id);
CREATE INDEX idx_print_files_project_id ON print_files(project_id);

-- Row Level Security (RLS) policies
ALTER TABLE printers ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_files ENABLE ROW LEVEL SECURITY;

-- Policies for printers
CREATE POLICY "Users can view their own printers" ON printers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own printers" ON printers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own printers" ON printers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own printers" ON printers
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for print_jobs
CREATE POLICY "Users can view their own print jobs" ON print_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own print jobs" ON print_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own print jobs" ON print_jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own print jobs" ON print_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for print_job_logs
CREATE POLICY "Users can view logs for their print jobs" ON print_job_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM print_jobs 
    WHERE print_jobs.id = print_job_logs.job_id 
    AND print_jobs.user_id = auth.uid()
  ));

CREATE POLICY "System can insert print job logs" ON print_job_logs
  FOR INSERT WITH CHECK (true); -- Allow system to insert logs

-- Policies for print_files
CREATE POLICY "Users can view their own print files" ON print_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own print files" ON print_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own print files" ON print_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own print files" ON print_files
  FOR DELETE USING (auth.uid() = user_id);

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_printers_updated_at 
  BEFORE UPDATE ON printers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_jobs_updated_at 
  BEFORE UPDATE ON print_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_files_updated_at 
  BEFORE UPDATE ON print_files 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
