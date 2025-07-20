import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../src/lib/supabaseClient';

interface PrintSettings {
  quality: string;
  infill: number;
  supports: boolean;
  rafts: boolean;
  material: string;
}

interface PrintStartRequest {
  projectId: string;
  printerId: string;
  userId: string;
  settings: PrintSettings;
}

// Mock 3D file processing service
class FileProcessingService {
  static async generateGCode(projectId: string, settings: PrintSettings): Promise<string> {
    // In a real implementation, this would:
    // 1. Fetch the 3D model file (STL, OBJ, etc.)
    // 2. Use a slicer (like PrusaSlicer, Cura) to generate G-code
    // 3. Apply the print settings
    // 4. Save the G-code file to storage
    
    // For now, return a mock file path
    return `/storage/gcode/${projectId}_${Date.now()}.gcode`;
  }

  static calculateEstimatedTime(settings: PrintSettings): number {
    // Mock estimation based on settings
    let baseTime = 3600; // 1 hour base
    
    // Adjust based on quality
    switch (settings.quality) {
      case 'draft': baseTime *= 0.7; break;
      case 'fine': baseTime *= 1.8; break;
      default: baseTime *= 1.0; // medium
    }
    
    // Adjust based on infill
    baseTime *= (1 + settings.infill / 100);
    
    // Adjust for supports
    if (settings.supports) baseTime *= 1.3;
    if (settings.rafts) baseTime *= 1.1;
    
    return Math.round(baseTime);
  }
}

// Print queue management service
class PrintQueueService {
  static async addToPrintQueue(jobData: any): Promise<string> {
    const { data, error } = await supabase
      .from('print_jobs')
      .insert([jobData])
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to add job to queue: ${error.message}`);
    }

    // Log the job creation
    await this.logJobEvent(data.id, 'job_created', 'Print job added to queue');

    return data.id;
  }

  static async logJobEvent(jobId: string, eventType: string, message: string, data: any = {}) {
    const { error } = await supabase
      .from('print_job_logs')
      .insert([{
        job_id: jobId,
        event_type: eventType,
        message,
        data
      }]);

    if (error) {
      console.error('Failed to log job event:', error);
    }
  }

  static async validatePrinter(printerId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('printers')
      .select('status')
      .eq('id', printerId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.status === 'online';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { projectId, printerId, settings }: PrintStartRequest = req.body;

    // Validate required fields
    if (!projectId || !printerId || !settings) {
      return res.status(400).json({ 
        error: 'Missing required fields: projectId, printerId, settings' 
      });
    }

    // Validate printer availability
    const isPrinterAvailable = await PrintQueueService.validatePrinter(printerId, user.id);
    if (!isPrinterAvailable) {
      return res.status(400).json({ 
        error: 'Printer is not available or not found' 
      });
    }

    // Get project details (this would typically come from your projects table)
    const { data: project } = await supabase
      .from('projects') // Assuming you have a projects table
      .select('name')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    const projectName = project?.name || `Project ${projectId}`;

    // Generate G-code file
    const gcodePath = await FileProcessingService.generateGCode(projectId, settings);
    
    // Calculate estimated time
    const estimatedTime = FileProcessingService.calculateEstimatedTime(settings);

    // Create print job
    const jobData = {
      project_id: projectId,
      project_name: projectName,
      printer_id: printerId,
      user_id: user.id,
      status: 'queued',
      settings: settings,
      file_path: gcodePath,
      estimated_time: estimatedTime
    };

    const jobId = await PrintQueueService.addToPrintQueue(jobData);

    // Update printer status to preparing
    await supabase
      .from('printers')
      .update({ status: 'printing' })
      .eq('id', printerId);

    // Store print file metadata
    await supabase
      .from('print_files')
      .insert([{
        project_id: projectId,
        user_id: user.id,
        filename: `${projectName}.gcode`,
        file_type: 'gcode',
        file_path: gcodePath,
        metadata: { settings, estimated_time: estimatedTime }
      }]);

    res.status(200).json({
      success: true,
      jobId,
      estimatedTime,
      message: 'Print job started successfully',
      gcodePath
    });

  } catch (error) {
    console.error('Print start error:', error);
    res.status(500).json({
      error: 'Failed to start print job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
