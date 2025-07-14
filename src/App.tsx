import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, Eye, Smartphone, Cpu, Database, Zap, ArrowRight, X, PlayCircle, Github, ExternalLink } from 'lucide-react';
import './App.css';
import SupabaseTest from './components/SupabaseTest';
import UnityCADViewer from './components/UnityCADViewer';
import WebGLViewer from './components/WebGLViewer';
import ARViewer from './components/ARViewer';
import ARDeployment from './components/ARDeployment';
import ModernUploadZone from './components/ModernUploadZone';
import ModernFileCard from './components/ModernFileCard';
import ModernButton from './components/ModernButton';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'converting' | 'converted' | 'error';
  originalFormat: string;
  convertedUrl?: string;
  errorMessage?: string;
  id?: string;
  uploadPath?: string;
  file_size?: number;
  original_name?: string;
  original_format?: string;
  converted_url?: string;
}

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showWebGLViewer, setShowWebGLViewer] = useState(false);
  const [showARViewer, setShowARViewer] = useState(false);
  const [showARDeployment, setShowARDeployment] = useState(false);
  const [currentModelUrl, setCurrentModelUrl] = useState<string | undefined>(undefined);
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['stl', 'step', 'obj', 'ply', 'dae'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    Array.from(fileList).forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (!extension || !supportedFormats.includes(extension)) {
        alert(`Unsupported file format: ${extension}. Supported formats: ${supportedFormats.join(', ')}`);
        return;
      }
      
      if (file.size > maxFileSize) {
        alert(`File too large: ${file.name}. Maximum size is 50MB.`);
        return;
      }
      
      const uploadedFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        originalFormat: extension
      };
      
      newFiles.push(uploadedFile);
      
      // Real upload process
      uploadFile(file, uploadedFile);
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const uploadFile = async (file: File, uploadedFile: UploadedFile) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      setFiles(prev => prev.map(f => 
        f.name === uploadedFile.name ? { 
          ...f, 
          status: 'uploaded',
          id: result.file.id
        } : f
      ));
      
      console.log('✅ Upload successful:', result);
    } catch (error) {
      console.error('❌ Upload failed:', error);
      setFiles(prev => prev.map(f => 
        f.name === uploadedFile.name ? { 
          ...f, 
          status: 'error',
          errorMessage: 'Upload failed. Please try again.'
        } : f
      ));
    }
  };

  const convertToFBX = async (file: UploadedFile) => {
    if (!file.id) {
      console.error('File ID is missing');
      return;
    }

    setFiles(prev => prev.map(f => 
      f.name === file.name ? { ...f, status: 'converting' } : f
    ));

    try {
      const response = await fetch(`http://localhost:5000/api/convert/${file.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      const result = await response.json();
      
      setFiles(prev => prev.map(f => 
        f.name === file.name ? { 
          ...f, 
          status: 'converted',
          convertedUrl: result.convertedUrl
        } : f
      ));

      console.log('✅ Conversion successful:', result);
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      setFiles(prev => prev.map(f => 
        f.name === file.name ? { 
          ...f, 
          status: 'error',
          errorMessage: 'Conversion failed. Please try again.'
        } : f
      ));
    }
  };

  const openARViewer = (file: UploadedFile) => {
    if (file.status === 'converted' && file.convertedUrl) {
      setCurrentModelUrl(file.convertedUrl);
      setCurrentFileName(file.name);
      setShowARDeployment(true);
    }
  };

  const openWebGLViewer = (file: UploadedFile) => {
    if (file.status === 'converted' && file.convertedUrl) {
      setCurrentModelUrl(file.convertedUrl);
      setCurrentFileName(file.name);
      setShowWebGLViewer(true);
    }
  };

  const closeViewers = () => {
    setShowWebGLViewer(false);
    setShowARViewer(false);
    setShowARDeployment(false);
    setCurrentModelUrl(undefined);
    setCurrentFileName(undefined);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return '⏳';
      case 'uploaded': return '✅';
      case 'converting': return '🔄';
      case 'converted': return '🎯';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'uploaded': return 'Ready for conversion';
      case 'converting': return 'Converting to FBX...';
      case 'converted': return 'Ready for AR';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="logo-icon">🥽</div>
            <span className="logo-text">HoloDraft</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">HoloDraft</h1>
            <p className="hero-subtitle">Enterprise CAD-to-AR Platform</p>
            <p className="hero-description">
              Upload CAD files (STL, STEP, OBJ, PLY, DAE), convert them to FBX format, 
              and view your 3D models in WebGL or deploy to AR headsets like MetaQuest.
            </p>
            <motion.div 
              className="hero-actions"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <a href="#upload" style={{ textDecoration: 'none' }}>
                <ModernButton 
                  variant="primary" 
                  size="lg"
                  icon={<Upload className="w-5 h-5" />}
                >
                  Upload CAD Files
                </ModernButton>
              </a>
            </motion.div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">5+</span>
                <span className="stat-label">File Formats</span>
              </div>
              <div className="stat">
                <span className="stat-number">Real-time</span>
                <span className="stat-label">Conversion</span>
              </div>
              <div className="stat">
                <span className="stat-number">AR-Ready</span>
                <span className="stat-label">Output</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-graphic">
              <div className="floating-card card-1"></div>
              <div className="floating-card card-2"></div>
              <div className="floating-card card-3"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Project Overview */}
        <section className="project-overview">
          <div className="container">
            <h2>What is HoloDraft?</h2>
            <div className="overview-grid">
              <div className="overview-card">
                <div className="card-icon">⚡</div>
                <h3>Revolutionary CAD Experience</h3>
                <p>
                  HoloDraft bridges the gap between traditional CAD software and immersive AR technology. 
                  Our platform enables engineers, designers, and creators to view their 3D models 
                  in WebGL and AR environments.
                </p>
              </div>
              <div className="overview-card">
                <div className="card-icon">🔄</div>
                <h3>Seamless File Conversion</h3>
                <p>
                  Upload your existing CAD files in multiple formats (STL, STEP, OBJ, PLY, DAE) and 
                  watch as our advanced pipeline converts them to AR-ready FBX files optimized for 
                  MetaQuest visualization.
                </p>
              </div>
              <div className="overview-card">
                <div className="card-icon">👓</div>
                <h3>MetaQuest Integration</h3>
                <p>
                  Experience your designs like never before. Walk around, scale, and manipulate 
                  your 3D models in real space using MetaQuest's cutting-edge AR capabilities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section id="upload" className="upload-section">
          <div className="container">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 text-4xl font-bold text-green-500"
            >
              Upload Your CAD Files
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <ModernUploadZone
                onDrop={handleFiles}
                accept={supportedFormats.map(f => `.${f}`).join(',')}
                supportedFormats={supportedFormats}
                maxSize={maxFileSize}
              />
            </motion.div>
          </div>
        </section>

        {files.length > 0 && (
          <section className="files-section">
            <div className="container">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 text-3xl font-bold text-green-500"
              >
                📋 Uploaded Files
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                <AnimatePresence>
                  {files.map((file, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <ModernFileCard
                        file={file}
                        onConvert={() => convertToFBX(file)}
                        onViewWebGL={() => openWebGLViewer(file)}
                        onViewAR={() => openARViewer(file)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>
        )}

        <div className="info-section">
          <div className="info-grid">
            <div className="info-card">
              <h3>📤 Upload</h3>
              <p>Upload your CAD files in STL, STEP, OBJ, PLY, or DAE format</p>
            </div>
            <div className="info-card">
              <h3>🔄 Convert</h3>
              <p>Files are automatically converted to FBX format for AR compatibility</p>
            </div>
            <div className="info-card">
              <h3>🥽 View in AR</h3>
              <p>Experience your 3D models in augmented reality using MetaQuest</p>
            </div>
            <div className="info-card">
              <h3>🌐 WebGL</h3>
              <p>Preview your 3D models in the browser before AR deployment</p>
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <section className="workflow-section">
          <div className="container">
            <h2>How HoloDraft Works</h2>
            <div className="workflow-steps">
              <div className="workflow-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Upload CAD Files</h3>
                  <p>Start by uploading your existing CAD files in supported formats</p>
                </div>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Automatic Conversion</h3>
                  <p>Our Blender-powered pipeline converts files to FBX format</p>
                </div>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>AR Experience</h3>
                  <p>View your models in WebGL or deploy to MetaQuest for AR viewing</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Requirements */}
        <section className="tech-requirements">
          <div className="container">
            <h2>💻 Development Requirements</h2>
            <div className="requirements-grid">
              <div className="requirement-card">
                <div className="req-icon">🔧</div>
                <h3>Development Tools</h3>
                <ul>
                  <li><strong>IDE:</strong> VS Code (recommended)</li>
                  <li><strong>Unity:</strong> 2022.3.0f1 or higher</li>
                  <li><strong>Node.js:</strong> v18+ for backend</li>
                  <li><strong>Python:</strong> 3.8+ for Blender integration</li>
                  <li><strong>Blender:</strong> 3.0+ for file conversion</li>
                </ul>
              </div>
              <div className="requirement-card">
                <div className="req-icon">📦</div>
                <h3>File Processing Pipeline</h3>
                <ol>
                  <li><strong>Upload:</strong> Files stored in Supabase storage</li>
                  <li><strong>Processing:</strong> Blender API converts to FBX</li>
                  <li><strong>WebGL:</strong> Unity builds for web preview</li>
                  <li><strong>AR Deploy:</strong> MetaQuest APK generation</li>
                </ol>
              </div>
              <div className="requirement-card">
                <div className="req-icon">🌐</div>
                <h3>What is WebGL?</h3>
                <p>
                  <strong>WebGL (Web Graphics Library)</strong> enables 3D graphics in web browsers without plugins. 
                  Our Unity WebGL build allows users to view and interact with CAD models directly in their browser 
                  before deploying to AR devices.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Specs */}
        <section className="tech-specs">
          <div className="container">
            <h2>🔧 Technical Architecture</h2>
            <div className="specs-grid">
              <div className="spec-item">
                <div className="spec-icon">⚛️</div>
                <strong>Frontend</strong>
                <p>React + TypeScript</p>
              </div>
              <div className="spec-item">
                <div className="spec-icon">🖥️</div>
                <strong>Backend</strong>
                <p>Node.js + Express</p>
              </div>
              <div className="spec-item">
                <div className="spec-icon">⚙️</div>
                <strong>Conversion</strong>
                <p>Python + Blender API</p>
              </div>
              <div className="spec-item">
                <div className="spec-icon">🗄️</div>
                <strong>Database</strong>
                <p>Supabase</p>
              </div>
              <div className="spec-item">
                <div className="spec-icon">🥽</div>
                <strong>AR Platform</strong>
                <p>MetaQuest Compatible</p>
              </div>
              <div className="spec-item">
                <div className="spec-icon">📁</div>
                <strong>File Formats</strong>
                <p>STL → STEP → OBJ → FBX</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Supabase Connection Test */}
      <SupabaseTest />
      
      {/* WebGL Viewer Modal */}
      {showWebGLViewer && (
        <WebGLViewer
          modelUrl={currentModelUrl}
          fileName={currentFileName}
          onClose={closeViewers}
        />
      )}
      
      {/* AR Viewer Modal */}
      {showARViewer && (
        <ARViewer
          modelUrl={currentModelUrl}
          onClose={closeViewers}
        />
      )}
      
      {/* AR Deployment Modal */}
      {showARDeployment && (
        <ARDeployment
          isOpen={showARDeployment}
          onClose={closeViewers}
          modelUrl={currentModelUrl}
          fileName={currentFileName}
        />
      )}
    </div>
  );
}

export default App;
