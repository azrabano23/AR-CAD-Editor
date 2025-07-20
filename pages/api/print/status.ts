import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../src/lib/supabaseClient';

interface PrintJobStatus {
  id: string;
  status: string;
  progress: number;
  estimatedTime: number;
  elapsedTime: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method === 'GET') {
    return handleGetStatus(req, res, user.id);
  } else if (req.method === 'POST') {
    return handleUpdateStatus(req, res, user.id);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGetStatus(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { jobId } = req.query;

    if (jobId) {
      // Get specific job status
      const { data, error } = await supabase
        .from('print_jobs')
        .select(`
          id,
          status,
          progress,
          estimated_time,
          elapsed_time,
          started_at,
          completed_at,
          error_message,
          project_name,
          printers (
            name,
            status
          )
        `)
        .eq('id', jobId)
        .eq('user_id', userId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Print job not found' });
      }

      return res.status(200).json({
        success: true,
        job: data
      });
    } else {
      // Get all jobs for user
      const { data, error } = await supabase
        .from('print_jobs')
        .select(`
          id,
          status,
          progress,
          estimated_time,
          elapsed_time,
          started_at,
          completed_at,
          created_at,
          project_name,
          printers (
            name,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch print jobs' });
      }

      return res.status(200).json({
        success: true,
        jobs: data
      });
    }
  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch print job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleUpdateStatus(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { jobId, status, progress, elapsedTime, errorMessage } = req.body;

    if (!jobId || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: jobId, status' 
      });
    }

    // Validate job ownership
    const { data: job, error: jobError } = await supabase
      .from('print_jobs')
      .select('id, status as current_status')
      .eq('id', jobId)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Print job not found' });
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (progress !== undefined) {
      updateData.progress = Math.min(Math.max(progress, 0), 100);
    }

    if (elapsedTime !== undefined) {
      updateData.elapsed_time = elapsedTime;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    // Set timestamps based on status
    if (status === 'printing' && job.current_status !== 'printing') {
      updateData.started_at = new Date().toISOString();
    } else if (['completed', 'failed', 'cancelled'].includes(status)) {
      updateData.completed_at = new Date().toISOString();
      
      // Free up the printer
      const { data: printJob } = await supabase
        .from('print_jobs')
        .select('printer_id')
        .eq('id', jobId)
        .single();

      if (printJob?.printer_id) {
        await supabase
          .from('printers')
          .update({ status: 'online' })
          .eq('id', printJob.printer_id);
      }
    }

    // Update the job
    const { data, error } = await supabase
      .from('print_jobs')
      .update(updateData)
      .eq('id', jobId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ 
        error: 'Failed to update print job status',
        details: error.message 
      });
    }

    // Log the status change
    await supabase
      .from('print_job_logs')
      .insert([{
        job_id: jobId,
        event_type: 'status_change',
        message: `Status changed to ${status}`,
        data: { 
          previous_status: job.current_status,
          new_status: status,
          progress,
          elapsed_time: elapsedTime
        }
      }]);

    res.status(200).json({
      success: true,
      job: data,
      message: 'Print job status updated successfully'
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      error: 'Failed to update print job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
