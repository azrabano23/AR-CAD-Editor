import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Upload, 
  File,
  X,
  Save,
  CheckCircle,
  Cloud,
  HardDrive,
  Eye,
  Download,
  Trash2,
  Settings,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Palette,
  Smartphone,
  Headphones,
  Box,
  Send
} from 'lucide-react';
import ModernButton from './ModernButton';
import WebGLViewer from './WebGLViewer';
import ARViewer from './ARViewer';
import './ProjectWorkspace.css';

interface ProjectWorkspaceProps {
  projectData: {
    id: string;
    name: string;
    description: string;
    type: 'upload' | 'demo' | 'template';
    templateId?: string;
  };
  onBack: () => void;
  onSave: (files: File[], projectData: any) => Promise<void>;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  status: 'uploading' | 'complete' | 'error';
  progress: number;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ projectData, onBack, onSave }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'list'>('preview');
  const [showWebGLViewer, setShowWebGLViewer] = useState(false);
  const [showARViewer, setShowARViewer] = useState(false);
  const [currentModelUrl, setCurrentModelUrl] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['stl', 'step', 'stp', 'obj', 'ply', 'dae', '3ds', 'fbx'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
      return `Unsupported file format. Supported: ${supportedFormats.join(', ').toUpperCase()}`;
    }
    if (file.size > maxFileSize) {
      return 'File size exceeds 50MB limit';
    }
    return null;
  };

  const processFiles = async (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert('Some files were rejected:\n' + errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);

    // Process each valid file
    for (const file of validFiles) {
      const fileId = Math.random().toString(36).substr(2, 9);
      const uploadFile: UploadedFile = {
        file,
        id: fileId,
        status: 'uploading',
        progress: 0
      };

      setUploadedFiles(prev => [...prev, uploadFile]);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 100) } : f
        ));
      }, 200);

      // Simulate upload completion
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'complete', progress: 100 } : f
        ));
      }, 1000 + Math.random() * 2000);
    }

    setTimeout(() => setIsUploading(false), 3000);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      const completedFiles = uploadedFiles
        .filter(f => f.status === 'complete')
        .map(f => f.file);
      
      await onSave(completedFiles, {
        ...projectData,
        fileCount: completedFiles.length,
        lastModified: new Date().toISOString()
      });
      
      // Show success feedback
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project. Please try again.');
      setIsSaving(false);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreviewFile = (uploadFile: UploadedFile) => {
    // Create a temporary URL for the file to simulate a model URL
    const modelUrl = URL.createObjectURL(uploadFile.file);
    setCurrentModelUrl(modelUrl);
    setCurrentFileName(uploadFile.file.name);
    setShowWebGLViewer(true);
  };

  const handleDeployToAR = (uploadFile: UploadedFile) => {
    // Create a temporary URL for the file to simulate a model URL
    const modelUrl = URL.createObjectURL(uploadFile.file);
    setCurrentModelUrl(modelUrl);
    setCurrentFileName(uploadFile.file.name);
    setShowARViewer(true);
  };

  const closeViewers = () => {
    setShowWebGLViewer(false);
    setShowARViewer(false);
    if (currentModelUrl) {
      URL.revokeObjectURL(currentModelUrl);
    }
    setCurrentModelUrl(null);
    setCurrentFileName(null);
  };

  return (
    <div className="project-workspace">
      <div className="workspace-container">
        {/* Header */}
        <div className="workspace-header">
          <div className="header-left">
            <ModernButton
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={onBack}
            >
              Back to Dashboard
            </ModernButton>
            <div className="project-info">
              <h1>{projectData.name}</h1>
              <p>{projectData.description || 'No description'}</p>
            </div>
          </div>
          
          <div className="header-actions">
            <ModernButton
              variant="secondary"
              size="sm"
              icon={viewMode === 'preview' ? <Grid className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              onClick={() => setViewMode(viewMode === 'preview' ? 'list' : 'preview')}
            >
              {viewMode === 'preview' ? 'List View' : 'Preview'}
            </ModernButton>
            
            <ModernButton
              variant="primary"
              size="sm"
              icon={isSaving ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              onClick={handleSaveProject}
              disabled={isSaving || uploadedFiles.length === 0}
            >
              {isSaving ? 'Saving...' : 'Save Project'}
            </ModernButton>
          </div>
        </div>

        {/* Main Content */}
        <div className="workspace-content">
          <div className="upload-section">
            {/* Upload Zone */}
            <motion.div
              className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".stl,.step,.stp,.obj,.ply,.dae,.3ds,.fbx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              
              <div className="upload-content">
                <div className="upload-icon">
                  <Upload className="w-12 h-12" />
                </div>
                <h3>Upload 3D Files</h3>
                <p>Drag and drop files here, or click to browse</p>
                <div className="upload-specs">
                  <span>Supported: {supportedFormats.join(', ').toUpperCase()}</span>
                  <span>Max size: 50MB per file</span>
                </div>
                <ModernButton
                  variant="primary"
                  size="lg"
                  icon={<HardDrive className="w-5 h-5" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Files
                </ModernButton>
              </div>
            </motion.div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="file-list">
                <div className="file-list-header">
                  <h3>Uploaded Files ({uploadedFiles.length})</h3>
                  <div className="file-stats">
                    <span>{uploadedFiles.filter(f => f.status === 'complete').length} completed</span>
                    <span>{uploadedFiles.filter(f => f.status === 'uploading').length} uploading</span>
                  </div>
                </div>

                <div className={`files-grid ${viewMode}`}>
                  <AnimatePresence>
                    {uploadedFiles.map((uploadFile) => (
                      <motion.div
                        key={uploadFile.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`file-card ${selectedFile === uploadFile.id ? 'selected' : ''}`}
                        onClick={() => setSelectedFile(uploadFile.id)}
                      >
                        <div className="file-icon">
                          <File className="w-8 h-8" />
                          {uploadFile.status === 'uploading' && (
                            <div className="upload-progress">
                              <div 
                                className="progress-bar"
                                style={{ width: `${uploadFile.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="file-info">
                          <h4>{uploadFile.file.name}</h4>
                          <div className="file-meta">
                            <span>{formatFileSize(uploadFile.file.size)}</span>
                            <span className={`status ${uploadFile.status}`}>
                              {uploadFile.status === 'complete' && <CheckCircle className="w-3 h-3" />}
                              {uploadFile.status}
                            </span>
                          </div>
                        </div>

                        <div className="file-actions">
                          {uploadFile.status === 'complete' && (
                            <>
                              <button
                                className="action-btn preview-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewFile(uploadFile);
                                }}
                                title="3D Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="action-btn ar-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeployToAR(uploadFile);
                                }}
                                title="Deploy to AR"
                              >
                                <Smartphone className="w-4 h-4" />
                              </button>
                              <button
                                className="action-btn download-btn"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            className="action-btn remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(uploadFile.id);
                            }}
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* 3D Preview Panel (if file selected) */}
          {selectedFile && (() => {
            const selectedUploadFile = uploadedFiles.find(f => f.id === selectedFile);
            return selectedUploadFile && selectedUploadFile.status === 'complete' ? (
              <div className="preview-panel">
                <div className="preview-header">
                  <h3>3D Model Actions</h3>
                  <div className="preview-controls">
                    <ModernButton
                      variant="secondary"
                      size="sm"
                      icon={<Box className="w-4 h-4" />}
                      onClick={() => handlePreviewFile(selectedUploadFile)}
                    >
                      3D Preview
                    </ModernButton>
                    <ModernButton
                      variant="primary"
                      size="sm"
                      icon={<Headphones className="w-4 h-4" />}
                      onClick={() => handleDeployToAR(selectedUploadFile)}
                    >
                      Deploy to AR
                    </ModernButton>
                  </div>
                </div>
                
                <div className="preview-viewport">
                  <div className="preview-placeholder">
                    <div className="preview-icon">
                      <Box className="w-16 h-16" />
                    </div>
                    <h4>{selectedUploadFile.file.name}</h4>
                    <p>Click "3D Preview" to view in WebGL or "Deploy to AR" for AR experience</p>
                    <div className="model-info">
                      <span>Size: {formatFileSize(selectedUploadFile.file.size)}</span>
                      <span>Type: {selectedUploadFile.file.name.split('.').pop()?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* WebGL Viewer Modal */}
      {showWebGLViewer && (
        <WebGLViewer
          modelUrl={currentModelUrl || undefined}
          fileName={currentFileName || undefined}
          onClose={closeViewers}
        />
      )}

      {/* AR Viewer Modal */}
      {showARViewer && (
        <ARViewer
          modelUrl={currentModelUrl || undefined}
          onClose={closeViewers}
        />
      )}
    </div>
  );
};

export default ProjectWorkspace;
