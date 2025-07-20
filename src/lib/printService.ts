import { supabase } from './supabaseClient';

export interface Printer {
  id: string;
  name: string;
  type: 'usb' | 'network' | 'bluetooth';
  status: 'online' | 'offline' | 'printing' | 'error';
  connection_string: string;
  model?: string;
  capabilities?: any;
  temperature?: any;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PrintJob {
  id: string;
  project_id: string;
  project_name: string;
  printer_id: string;
  user_id: string;
  status: 'queued' | 'preparing' | 'printing' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  settings: any;
  file_path?: string;
  estimated_time?: number;
  elapsed_time: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  printers?: Printer;
}

export interface PrintFile {
  id: string;
  project_id: string;
  user_id: string;
  filename: string;
  file_type: 'stl' | 'obj' | 'gcode' | '3mf';
  file_size?: number;
  file_path?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface PrintJobLog {
  id: string;
  job_id: string;
  event_type: string;
  message: string;
  data?: any;
  created_at: string;
}

class PrintService {
  // Printer Management
  async getUserPrinters(userId: string): Promise<Printer[]> {
    if (!supabase) {
      console.warn('Supabase not available, returning mock printers');
      return [
        {
          id: 'mock-printer-1',
          name: 'Mock Printer',
          type: 'usb',
          status: 'online',
          connection_string: '/dev/ttyUSB0',
          model: 'Mock 3D Printer',
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }

    const { data, error } = await supabase
      .from('printers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch printers: ${error.message}`);
    }

    return data || [];
  }

  async addPrinter(printer: Omit<Printer, 'id' | 'created_at' | 'updated_at'>): Promise<Printer> {
    const { data, error } = await supabase
      .from('printers')
      .insert([printer])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add printer: ${error.message}`);
    }

    return data;
  }

  async updatePrinter(id: string, updates: Partial<Printer>): Promise<Printer> {
    const { data, error } = await supabase
      .from('printers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update printer: ${error.message}`);
    }

    return data;
  }

  async deletePrinter(id: string): Promise<void> {
    const { error } = await supabase
      .from('printers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete printer: ${error.message}`);
    }
  }

  // Print Job Management
  async getUserPrintJobs(userId: string, limit: number = 50): Promise<PrintJob[]> {
    const { data, error } = await supabase
      .from('print_jobs')
      .select(`
        *,
        printers (
          name,
          status,
          model
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch print jobs: ${error.message}`);
    }

    return data || [];
  }

  async getPrintJob(jobId: string, userId: string): Promise<PrintJob> {
    const { data, error } = await supabase
      .from('print_jobs')
      .select(`
        *,
        printers (
          name,
          status,
          model
        )
      `)
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch print job: ${error.message}`);
    }

    return data;
  }

  async createPrintJob(job: Omit<PrintJob, 'id' | 'created_at' | 'updated_at' | 'printers'>): Promise<PrintJob> {
    const { data, error } = await supabase
      .from('print_jobs')
      .insert([job])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create print job: ${error.message}`);
    }

    return data;
  }

  async updatePrintJob(jobId: string, updates: Partial<PrintJob>): Promise<PrintJob> {
    const { data, error } = await supabase
      .from('print_jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update print job: ${error.message}`);
    }

    return data;
  }

  async cancelPrintJob(jobId: string, userId: string): Promise<PrintJob> {
    const { data, error } = await supabase
      .from('print_jobs')
      .update({ 
        status: 'cancelled',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel print job: ${error.message}`);
    }

    // Log the cancellation
    await this.logJobEvent(jobId, 'job_cancelled', 'Print job cancelled by user');

    return data;
  }

  // Print Job Logs
  async getJobLogs(jobId: string): Promise<PrintJobLog[]> {
    const { data, error } = await supabase
      .from('print_job_logs')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch job logs: ${error.message}`);
    }

    return data || [];
  }

  async logJobEvent(jobId: string, eventType: string, message: string, data?: any): Promise<PrintJobLog> {
    const { data: logData, error } = await supabase
      .from('print_job_logs')
      .insert([{
        job_id: jobId,
        event_type: eventType,
        message,
        data: data || {}
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log job event: ${error.message}`);
    }

    return logData;
  }

  // Print Files Management
  async getProjectPrintFiles(projectId: string, userId: string): Promise<PrintFile[]> {
    const { data, error } = await supabase
      .from('print_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch print files: ${error.message}`);
    }

    return data || [];
  }

  async addPrintFile(file: Omit<PrintFile, 'id' | 'created_at' | 'updated_at'>): Promise<PrintFile> {
    const { data, error } = await supabase
      .from('print_files')
      .insert([file])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add print file: ${error.message}`);
    }

    return data;
  }

  async deletePrintFile(fileId: string): Promise<void> {
    const { error } = await supabase
      .from('print_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      throw new Error(`Failed to delete print file: ${error.message}`);
    }
  }

  // Queue Management
  async getQueuedJobs(userId: string): Promise<PrintJob[]> {
    const { data, error } = await supabase
      .from('print_jobs')
      .select(`
        *,
        printers (
          name,
          status,
          model
        )
      `)
      .eq('user_id', userId)
      .in('status', ['queued', 'preparing', 'printing'])
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch queued jobs: ${error.message}`);
    }

    return data || [];
  }

  async getNextQueuedJob(printerId: string): Promise<PrintJob | null> {
    const { data, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('printer_id', printerId)
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch next queued job: ${error.message}`);
    }

    return data;
  }

  // Statistics and Analytics
  async getPrintStatistics(userId: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalPrintTime: number;
    successRate: number;
  }> {
    const { data, error } = await supabase
      .from('print_jobs')
      .select('status, elapsed_time')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to fetch print statistics: ${error.message}`);
    }

    const jobs = data || [];
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter((j: any) => j.status === 'completed').length;
    const failedJobs = jobs.filter((j: any) => j.status === 'failed').length;
    const totalPrintTime = jobs.reduce((sum: number, job: any) => sum + (job.elapsed_time || 0), 0);
    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      totalPrintTime,
      successRate
    };
  }

  // Real-time subscriptions
  subscribeToPrintJobs(userId: string, callback: (payload: any) => void) {
    if (!supabase) {
      console.warn('Supabase not available, real-time subscriptions disabled');
      return { unsubscribe: () => {} };
    }

    return supabase
      .channel(`print_jobs_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'print_jobs',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToPrinters(userId: string, callback: (payload: any) => void) {
    if (!supabase) {
      console.warn('Supabase not available, real-time subscriptions disabled');
      return { unsubscribe: () => {} };
    }

    return supabase
      .channel(`printers_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'printers',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

// Export singleton instance
export const printService = new PrintService();
export default printService;
