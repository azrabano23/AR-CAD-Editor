import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, FileText, Smartphone, Wifi, Share2, Eye, Zap, CheckCircle } from 'lucide-react';

interface MobileUploadARProps {
  onClose: () => void;
}

interface MobileFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'ready' | 'deployed';
  progress: number;
  thumbnail?: string;
  arUrl?: string;
}

const MobileUploadAR: React.FC<MobileUploadARProps> = ({ onClose }) => {
  const [files, setFiles] = useState<MobileFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'drag' | 'camera' | 'files'>('files');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Simulate mobile device detection
  const detectedDevices = [
    { name: 'iPhone 15 Pro', type: 'ios', connected: false },
    { name: 'Samsung Galaxy S24', type: 'android', connected: false },
    { name: 'iPad Pro', type: 'ios', connected: true }
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      const newFile: MobileFile = {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
        thumbnail: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
      
      setFiles(prev => [...prev, newFile]);
      simulateUpload(newFile);
    });
  };

  const simulateUpload = (file: MobileFile) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing', progress: 100 } : f
        ));
        
        setTimeout(() => {
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: 'ready', 
              arUrl: `/ar-viewer/${file.id}` 
            } : f
          ));
        }, 2000);
      } else {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ));
      }
    }, 100);
  };

  const connectToDevice = (deviceName: string) => {
    setIsConnecting(true);
    setTimeout(() => {
      setConnectedDevice(deviceName);
      setIsConnecting(false);
    }, 2000);
  };

  const deployToAR = (file: MobileFile) => {
    if (!connectedDevice) {
      alert('Please connect a device first');
      return;
    }
    
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, status: 'deployed' } : f
    ));
    
    // Simulate deployment progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      setDeploymentProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setDeploymentProgress(100);
        setTimeout(() => setDeploymentProgress(0), 2000);
      }
    }, 200);
  };

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <Upload className="animate-bounce" />;
      case 'processing': return <Zap className="animate-pulse" />;
      case 'ready': return <Eye />;
      case 'deployed': return <CheckCircle />;
      default: return <FileText />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'ready': return '#22c55e';
      case 'deployed': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="mobile-upload-overlay">
      <div className="mobile-upload-container">
        {/* Header */}
        <div className="mobile-upload-header">
          <div className="header-info">
            <Smartphone className="header-icon" />
            <div>
              <h2>Mobile CAD to AR</h2>
              <p>Upload from any device, deploy to AR instantly</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="mobile-upload-content">
          {/* Device Connection Panel */}
          <div className="device-panel">
            <h3>📱 Connected Devices</h3>
            <div className="device-list">
              {detectedDevices.map((device, index) => (
                <div key={index} className="device-item">
                  <div className="device-info">
                    <span className="device-emoji">
                      {device.type === 'ios' ? '📱' : '🤖'}
                    </span>
                    <div>
                      <div className="device-name">{device.name}</div>
                      <div className="device-status">
                        {device.connected ? 'Connected' : 'Available'}
                      </div>
                    </div>
                  </div>
                  <div className="device-actions">
                    {connectedDevice === device.name ? (
                      <span className="connected-badge">Connected</span>
                    ) : (
                      <button 
                        className="connect-btn"
                        onClick={() => connectToDevice(device.name)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Methods */}
          <div className="upload-methods">
            <h3>📤 Upload Methods</h3>
            <div className="method-tabs">
              <button 
                className={`method-tab ${uploadMethod === 'files' ? 'active' : ''}`}
                onClick={() => setUploadMethod('files')}
              >
                <FileText size={20} />
                Files
              </button>
              <button 
                className={`method-tab ${uploadMethod === 'camera' ? 'active' : ''}`}
                onClick={() => setUploadMethod('camera')}
              >
                <Camera size={20} />
                Camera
              </button>
              <button 
                className={`method-tab ${uploadMethod === 'drag' ? 'active' : ''}`}
                onClick={() => setUploadMethod('drag')}
              >
                <Upload size={20} />
                Drag & Drop
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div 
            className={`mobile-upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {uploadMethod === 'drag' && (
              <div className="upload-content">
                <Upload size={48} className="upload-icon" />
                <h4>Drag & Drop Files</h4>
                <p>Support: STL, STEP, OBJ, PLY, DAE</p>
                <button 
                  className="browse-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Or Browse Files
                </button>
              </div>
            )}

            {uploadMethod === 'files' && (
              <div className="upload-content">
                <FileText size={48} className="upload-icon" />
                <h4>Select CAD Files</h4>
                <p>Choose from your device storage</p>
                <button 
                  className="browse-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </button>
              </div>
            )}

            {uploadMethod === 'camera' && (
              <div className="upload-content">
                <Camera size={48} className="upload-icon" />
                <h4>Capture with Camera</h4>
                <p>Take photos of physical models</p>
                <button 
                  className="browse-btn"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Open Camera
                </button>
              </div>
            )}
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="files-section">
              <h3>📁 Uploaded Files ({files.length})</h3>
              <div className="files-list">
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mobile-file-item"
                  >
                    <div className="file-thumbnail">
                      {file.thumbnail ? (
                        <img src={file.thumbnail} alt={file.name} />
                      ) : (
                        <FileText size={32} />
                      )}
                    </div>
                    
                    <div className="file-details">
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        {formatFileSize(file.size)} • {file.type}
                      </div>
                      
                      {file.status === 'uploading' && (
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${file.progress}%`,
                              backgroundColor: getStatusColor(file.status)
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="file-actions">
                      <div 
                        className="status-indicator"
                        style={{ color: getStatusColor(file.status) }}
                      >
                        {getStatusIcon(file.status)}
                      </div>
                      
                      {file.status === 'ready' && (
                        <button 
                          className="deploy-btn"
                          onClick={() => deployToAR(file)}
                          disabled={!connectedDevice}
                        >
                          <Share2 size={16} />
                          Deploy to AR
                        </button>
                      )}
                      
                      {file.status === 'deployed' && (
                        <span className="deployed-badge">
                          ✅ Deployed
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Deployment Progress */}
          <AnimatePresence>
            {deploymentProgress > 0 && deploymentProgress < 100 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="deployment-progress"
              >
                <div className="progress-header">
                  <Wifi className="progress-icon" />
                  <span>Deploying to {connectedDevice}...</span>
                </div>
                <div className="progress-bar large">
                  <div 
                    className="progress-fill"
                    style={{ width: `${deploymentProgress}%` }}
                  />
                </div>
                <div className="progress-text">
                  {Math.round(deploymentProgress)}% Complete
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          <div className="mobile-instructions">
            <h4>🚀 How it works:</h4>
            <ol>
              <li>Connect your mobile device or tablet</li>
              <li>Upload CAD files or capture with camera</li>
              <li>Files are automatically converted to AR format</li>
              <li>Deploy instantly to your connected AR device</li>
            </ol>
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".stl,.step,.obj,.ply,.dae"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
};

export default MobileUploadAR;
