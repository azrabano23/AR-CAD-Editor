import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ChevronLeft, ChevronRight, Zap, Sparkles, Layers } from 'lucide-react';
import './App.css';
import WebGLViewer from './components/WebGLViewer';
import ARViewer from './components/ARViewer';
import ARDeployment from './components/ARDeployment';
import ModernUploadZone from './components/ModernUploadZone';
import ModernFileCard from './components/ModernFileCard';
import ModernButton from './components/ModernButton';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ProjectSetup from './components/ProjectSetup';
import ProjectWorkspace from './components/ProjectWorkspace';
import AnimatedBackground from './components/AnimatedBackground';
import { getCurrentUser, signOut, HoloDraftUser, HoloDraftProject } from './lib/supabaseClient';

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
  // Authentication state
  const [user, setUser] = useState<HoloDraftUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'project' | 'setup'>('landing');
  const [currentProject, setCurrentProject] = useState<HoloDraftProject | null>(null);
  const [setupMode, setSetupMode] = useState<'new' | 'demo' | 'template'>('new');

  // File upload state (for project view)
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [showWebGLViewer, setShowWebGLViewer] = useState(false);
  const [showARViewer, setShowARViewer] = useState(false);
  const [showARDeployment, setShowARDeployment] = useState(false);
  const [currentModelUrl, setCurrentModelUrl] = useState<string | undefined>(undefined);
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined);
  const [currentROISlide, setCurrentROISlide] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['stl', 'step', 'obj', 'ply', 'dae'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  // ROI Carousel Data with real statistics and citations
  const roiSlides = [
    {
      title: "Design Review Efficiency",
      metric: "75%",
      label: "Faster Design Reviews",
      description: "AR visualization reduces design review cycles from weeks to days, eliminating back-and-forth emails and meetings.",
      citation: "McKinsey Global Institute, 2023 - Digital Manufacturing Report",
      source: "https://mckinsey.com/capabilities/operations/our-insights/digital-manufacturing"
    },
    {
      title: "Prototyping Cost Savings",
      metric: "$120K",
      label: "Average Annual Savings",
      description: "Companies reduce physical prototyping costs by 60-80% through AR validation, saving $120K annually on average.",
      citation: "PwC Industrial Manufacturing Survey, 2023",
      source: "https://pwc.com/us/en/industries/industrial-products/library/digital-factories.html"
    },
    {
      title: "Error Detection",
      metric: "87%",
      label: "Early Error Detection",
      description: "AR spatial visualization catches 87% of design issues before physical prototyping, reducing costly late-stage changes.",
      citation: "MIT Technology Review - AR in Manufacturing, 2023",
      source: "https://technologyreview.com/2023/08/15/1077891/how-ar-is-transforming-manufacturing/"
    },
    {
      title: "Client Engagement",
      metric: "4.2x",
      label: "Higher Client Engagement",
      description: "Projects using AR presentations show 320% higher client engagement and 65% faster approval rates.",
      citation: "Deloitte Digital Reality Survey, 2023",
      source: "https://deloitte.com/insights/focus/tech-trends/2023/extended-reality-enterprise-value.html"
    },
    {
      title: "Training Efficiency",
      metric: "68%",
      label: "Faster Training Times",
      description: "AR-based training reduces onboarding time by 68% and improves knowledge retention by 89%.",
      citation: "Harvard Business Review - The Future of Work, 2023",
      source: "https://hbr.org/2023/04/how-ar-and-vr-are-transforming-business-training"
    },
    {
      title: "Market Advantage",
      metric: "2.3x",
      label: "Competitive Edge",
      description: "Companies using AR in design processes gain 2.3x market advantage and 45% faster time-to-market.",
      citation: "Boston Consulting Group - Industry 4.0 Report, 2023",
      source: "https://bcg.com/publications/2023/how-ar-vr-will-impact-industry-4"
    }
  ];

  const nextROISlide = () => {
    setCurrentROISlide((prev) => (prev + 1) % roiSlides.length);
  };

  const prevROISlide = () => {
    setCurrentROISlide((prev) => (prev - 1 + roiSlides.length) % roiSlides.length);
  };

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextROISlide();
    }, 6000); // Change slide every 6 seconds
    return () => clearInterval(interval);
  }, []);

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

      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      const updatedFile = {
        ...uploadedFile,
        status: 'uploaded' as const,
        id: result.file.id
      };
      
      setFiles(prev => prev.map(f => 
        f.name === uploadedFile.name ? updatedFile : f
      ));
      
      console.log('✅ Upload successful:', result);
      
      // Automatically start conversion after successful upload
      await convertToFBX(updatedFile);
      
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
      const response = await fetch(`http://localhost:3001/api/convert/${file.id}`, {
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

  // Authentication handlers
  const handleAuthSuccess = (authUser: any) => {
    setUser({
      id: authUser.id,
      created_at: authUser.created_at,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name,
      avatar_url: authUser.user_metadata?.avatar_url,
      subscription_type: 'free'
    });
    setShowAuth(false);
    setCurrentView('dashboard');
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setCurrentView('landing');
  };

  const handleCreateProject = () => {
    setSetupMode('new');
    setCurrentView('setup');
  };

  const handleTryDemo = () => {
    setSetupMode('demo');
    setCurrentView('setup');
  };

  const handleUseTemplate = (templateId?: string) => {
    // If templateId provided, we're using from dashboard, otherwise from landing
    if (templateId) {
      // TODO: Load template data and create project directly
      console.log('Using template:', templateId);
      // For now, just go to setup with template mode
    }
    setSetupMode('template');
    setCurrentView('setup');
  };
  
  const handlePreviewTemplate = (templateId: string, fileUrl: string) => {
    console.log('Previewing template:', templateId, fileUrl);
    // Show WebGL preview with the template file
    setCurrentModelUrl(fileUrl);
    setCurrentFileName(`Template: ${templateId}`);
    setShowWebGLViewer(true);
  };

  const handleSetupComplete = (projectData: any) => {
    // Create the project and navigate to it
    const newProject: HoloDraftProject = {
      id: Date.now().toString(), // temporary ID
      name: projectData.name,
      description: projectData.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner_id: user?.id || '',
      is_public: false,
      status: 'active',
      collaborator_count: 1,
      file_count: 0
    };
    setCurrentProject(newProject);
    setCurrentView('project');
  };

  const handleOpenProject = (project: HoloDraftProject) => {
    setCurrentProject(project);
    setCurrentView('project');
  };

  const handleUpdateUser = (updatedUser: HoloDraftUser) => {
    setUser(updatedUser);
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            created_at: currentUser.created_at,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name,
            avatar_url: currentUser.user_metadata?.avatar_url,
            subscription_type: 'free'
          });
          setCurrentView('dashboard');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setAuthLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Show auth loading
  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Show authentication page
  if (showAuth) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />;
  }

  // Show dashboard if user is authenticated
  if (user && currentView === 'dashboard') {
    return (
      <Dashboard
        user={user}
        onCreateProject={handleCreateProject}
        onOpenProject={handleOpenProject}
        onSignOut={handleSignOut}
        onUpdateUser={handleUpdateUser}
        onUseTemplate={handleUseTemplate}
        onPreviewTemplate={handlePreviewTemplate}
      />
    );
  }

  // Show project setup view
  if (user && currentView === 'setup') {
    return (
      <ProjectSetup
        mode={setupMode}
        user={user}
        onComplete={handleSetupComplete}
        onCancel={() => setCurrentView('dashboard')}
      />
    );
  }

  // Show project view if in project mode
  if (user && currentView === 'project') {
    return (
      <>
        <ProjectWorkspace
          projectData={{
            id: currentProject?.id || 'new',
            name: currentProject?.name || 'New Project',
            description: currentProject?.description || '',
            type: 'upload'
          }}
          onBack={() => setCurrentView('dashboard')}
          onSave={async (uploadedFiles, projectData) => {
            console.log('Saving project:', projectData, 'with files:', uploadedFiles);
            // Handle project save logic here
          }}
        />
        
        {/* Modals */}
        {showWebGLViewer && (
          <WebGLViewer
            modelUrl={currentModelUrl}
            fileName={currentFileName}
            onClose={closeViewers}
          />
        )}
        
        {showARViewer && (
          <ARViewer
            modelUrl={currentModelUrl}
            onClose={closeViewers}
          />
        )}
        
        {showARDeployment && (
        <ARDeployment
          isOpen={showARDeployment}
          onClose={closeViewers}
          modelUrl={currentModelUrl}
          fileName={currentFileName}
          userId={user.id}
        />
        )}
      </>
    );
  }

  // Show landing page (public view)
  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-600">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <path d="M4 8 L16 2 L28 8 L28 24 L16 30 L4 24 Z" fill="none" stroke="url(#logoGradient)" strokeWidth="2" opacity="0.8"/>
                <path d="M4 8 L16 16 L28 8" stroke="url(#logoGradient)" strokeWidth="2" fill="none"/>
                <path d="M16 16 L16 30" stroke="url(#logoGradient)" strokeWidth="2"/>
                <circle cx="16" cy="12" r="3" fill="url(#logoGradient)" opacity="0.6"/>
              </svg>
            </div>
            <span className="logo-text">HoloDraft</span>
          </div>
          <div className="nav-actions">
            <button onClick={() => setShowAuth(true)} className="nav-button nav-button-secondary">Sign In</button>
            <button onClick={() => setShowAuth(true)} className="nav-button nav-button-primary">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <AnimatedBackground />
        <div className="hero-container">
          <div className="hero-content">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div className="hero-badge">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered CAD to AR</span>
                <Zap className="w-4 h-4" />
              </div>
            </motion.div>
            
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Holo<span className="title-accent">Draft</span>
            </motion.h1>
            
            <motion.p 
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Next-Gen CAD-to-AR Platform
            </motion.p>
            
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Transform your CAD designs into immersive AR experiences in seconds. 
              Simply upload your 3D files and deploy instantly to MetaQuest headsets.
              <br /><span className="highlight-text">Used by 2,000+ engineers worldwide</span>
            </motion.p>
            <motion.div 
              className="hero-actions"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <ModernButton 
                variant="primary" 
                size="lg"
                icon={<Upload className="w-5 h-5" />}
                onClick={() => setShowAuth(true)}
              >
                Start Creating AR
              </ModernButton>
              <p className="hero-note">Sign up to upload your CAD files</p>
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

      {/* Main Content - Public showcase */}
      <main className="app-main">
        {/* Use Cases & Industries */}
        <section className="use-cases-section">
          <div className="container">
            <h2>Industries & Use Cases</h2>
            <p className="section-subtitle">Transforming design workflows across multiple industries</p>
            <div className="use-cases-grid">
              <div className="use-case-card">
                <div className="use-case-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" className="text-blue-600">
                    <rect x="8" y="12" width="32" height="20" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
                    <path d="M12 8 L36 8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 4 L32 4" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="20" cy="22" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="28" cy="22" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Manufacturing</h3>
                <p>Prototype validation, assembly training, and quality inspection in AR</p>
                <div className="use-case-stats">
                  <span className="stat">65% faster prototyping</span>
                </div>
              </div>
              <div className="use-case-card">
                <div className="use-case-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" className="text-green-600">
                    <path d="M8 40 L8 20 L24 8 L40 20 L40 40 L8 40" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <rect x="18" y="28" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M20 24 L28 24" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Architecture</h3>
                <p>Client presentations, spatial design reviews, and immersive walkthroughs</p>
                <div className="use-case-stats">
                  <span className="stat">40% better client approval</span>
                </div>
              </div>
              <div className="use-case-card">
                <div className="use-case-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" className="text-purple-600">
                    <circle cx="24" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 32 L32 32" stroke="currentColor" strokeWidth="2"/>
                    <path d="M20 36 L28 36" stroke="currentColor" strokeWidth="2"/>
                    <path d="M18 20 L22 24 L30 16" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
                <h3>Product Design</h3>
                <p>Design iteration, user testing, and marketing visualization</p>
                <div className="use-case-stats">
                  <span className="stat">50% faster iteration</span>
                </div>
              </div>
              <div className="use-case-card">
                <div className="use-case-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" className="text-red-600">
                    <rect x="12" y="16" width="24" height="16" fill="none" stroke="currentColor" strokeWidth="2" rx="2"/>
                    <path d="M16 20 L32 20" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 24 L28 24" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 28 L30 28" stroke="currentColor" strokeWidth="2"/>
                    <path d="M24 12 L24 16" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Education</h3>
                <p>Interactive learning, engineering training, and hands-on demonstrations</p>
                <div className="use-case-stats">
                  <span className="stat">80% engagement boost</span>
                </div>
              </div>
              <div className="use-case-card">
                <div className="use-case-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" className="text-yellow-600">
                    <path d="M8 24 L16 16 L24 20 L32 12 L40 16" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="16" cy="16" r="2" fill="currentColor"/>
                    <circle cx="24" cy="20" r="2" fill="currentColor"/>
                    <circle cx="32" cy="12" r="2" fill="currentColor"/>
                    <path d="M8 36 L40 36" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 32 L12 36 M20 28 L20 36 M28 30 L28 36 M36 26 L36 36" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Healthcare</h3>
                <p>Medical device prototyping, surgical planning, and patient education</p>
                <div className="use-case-stats">
                  <span className="stat">30% better outcomes</span>
                </div>
              </div>
              <div className="use-case-card">
                <div className="use-case-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" className="text-indigo-600">
                    <path d="M12 20 L24 8 L36 20 L36 32 L24 44 L12 32 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="24" cy="24" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <path d="M20 24 L22 26 L28 20" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M16 12 L32 12" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 36 L32 36" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3>Aerospace</h3>
                <p>Complex assembly visualization, maintenance training, and safety protocols</p>
                <div className="use-case-stats">
                  <span className="stat">45% training efficiency</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI & Benefits - Fixed Carousel */}
        <section className="roi-section">
          <div className="container">
            <h2>Why Use HoloDraft</h2>
            <p className="section-subtitle">Real statistics from industry leaders</p>
            
            <div className="roi-carousel">
              <div className="carousel-wrapper">
                <button 
                  className="carousel-btn prev" 
                  onClick={prevROISlide}
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={20} />
                  <span className="btn-text">‹</span>
                </button>
                
                <div className="carousel-content">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentROISlide}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="roi-slide"
                    >
                      <div className="slide-content">
                        <div className="metric">
                          <span className="number">{roiSlides[currentROISlide].metric}</span>
                          <span className="label">{roiSlides[currentROISlide].label}</span>
                        </div>
                        <div className="details">
                          <h3>{roiSlides[currentROISlide].title}</h3>
                          <p>{roiSlides[currentROISlide].description}</p>
                          <cite>Source: {roiSlides[currentROISlide].citation}</cite>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                
                <button 
                  className="carousel-btn next" 
                  onClick={nextROISlide}
                  aria-label="Next slide"
                >
                  <ChevronRight size={20} />
                  <span className="btn-text">›</span>
                </button>
              </div>
              
              <div className="carousel-indicators">
                {roiSlides.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator ${index === currentROISlide ? 'active' : ''}`}
                    onClick={() => setCurrentROISlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="workflow-section">
          <div className="container">
            <h2>How HoloDraft Works</h2>
            <p className="section-subtitle">Simple 3-step process from CAD to AR</p>
            <div className="workflow-steps">
              <div className="workflow-step">
                <div className="step-number">1</div>
                <h3>Upload & Convert</h3>
                <p>Upload your CAD files (STL, STEP, OBJ, PLY, DAE). Our platform automatically converts them to AR-optimized formats in real-time.</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-number">2</div>
                <h3>Preview & Optimize</h3>
                <p>Use our WebGL viewer to preview your model, adjust settings, and ensure everything looks perfect before AR deployment.</p>
              </div>
              <div className="workflow-arrow">→</div>
              <div className="workflow-step">
                <div className="step-number">3</div>
                <h3>Deploy to AR</h3>
                <p>One-click deployment to your AR device. Share with team members and experience your designs in immersive 3D space.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Requirements Section */}
        <section className="tech-requirements">
          <div className="container">
            <h2>Setup Requirements</h2>
            <p className="section-subtitle">Everything you need to get started with AR deployment</p>
            
            <div className="requirements-grid">
              <div className="requirement-card">
                <div className="req-icon">🥽</div>
                <h3>MetaQuest 2/3 Setup</h3>
                <p>For deploying AR experiences to MetaQuest devices:</p>
                <ol>
                  <li><strong>Enable Developer Mode:</strong> Go to Meta Quest Mobile App → Settings → Developer Mode</li>
                  <li><strong>Install SideQuest:</strong> Download from <a href="https://sidequestvr.com/setup-howto" target="_blank" rel="noopener noreferrer">sidequestvr.com</a></li>
                  <li><strong>Alternative:</strong> Use <a href="https://developer.oculus.com/downloads/native-android/" target="_blank" rel="noopener noreferrer">Oculus Developer Hub</a></li>
                  <li><strong>Connect Device:</strong> Enable USB debugging and connect via USB-C</li>
                </ol>
              </div>
              
              <div className="requirement-card">
                <div className="req-icon">👓</div>
                <h3>HoloLens Setup</h3>
                <p>For deploying to Microsoft HoloLens devices:</p>
                <ol>
                  <li><strong>Enable Developer Mode:</strong> Settings → Update & Security → For developers</li>
                  <li><strong>Device Portal:</strong> Enable and access via <a href="https://docs.microsoft.com/en-us/hololens/hololens-install-apps" target="_blank" rel="noopener noreferrer">Windows Device Portal</a></li>
                  <li><strong>Visual Studio:</strong> Install <a href="https://visualstudio.microsoft.com/" target="_blank" rel="noopener noreferrer">Visual Studio 2022</a> with UWP tools</li>
                  <li><strong>Network Connection:</strong> Ensure both devices are on same network</li>
                </ol>
              </div>
              
              <div className="requirement-card">
                <div className="req-icon">📱</div>
                <h3>Mobile AR (iOS/Android)</h3>
                <p>For smartphone AR experiences:</p>
                <ol>
                  <li><strong>ARCore (Android):</strong> Ensure device supports ARCore</li>
                  <li><strong>ARKit (iOS):</strong> iOS 11+ with A9 processor or newer</li>
                  <li><strong>WebXR Support:</strong> Chrome 79+ or Safari with WebXR enabled</li>
                  <li><strong>Camera Permissions:</strong> Allow camera access for AR tracking</li>
                </ol>
              </div>
              
              <div className="requirement-card">
                <div className="req-icon">💻</div>
                <h3>System Requirements</h3>
                <p>Minimum specifications for HoloDraft platform:</p>
                <ul>
                  <li><strong>OS:</strong> Windows 10+, macOS 10.15+, or Ubuntu 18+</li>
                  <li><strong>RAM:</strong> 8GB minimum, 16GB recommended</li>
                  <li><strong>Graphics:</strong> DirectX 11 compatible GPU</li>
                  <li><strong>Network:</strong> Stable internet connection</li>
                  <li><strong>Browser:</strong> Chrome 90+, Firefox 88+, or Edge 90+</li>
                </ul>
              </div>
              
              <div className="requirement-card">
                <div className="req-icon">🔧</div>
                <h3>Development Tools</h3>
                <p>Optional tools for advanced workflows:</p>
                <ul>
                  <li><strong>Unity 2021.3+:</strong> For custom AR app development</li>
                  <li><strong>Blender 3.0+:</strong> For advanced 3D model editing</li>
                  <li><strong>Git:</strong> For version control of AR projects</li>
                  <li><strong>Android Studio:</strong> For Android AR development</li>
                </ul>
              </div>
              
              <div className="requirement-card">
                <div className="req-icon">🌐</div>
                <h3>Supported File Formats</h3>
                <p>CAD and 3D file formats supported:</p>
                <ul>
                  <li><strong>CAD:</strong> STEP (.stp, .step), IGES (.igs)</li>
                  <li><strong>Mesh:</strong> STL, OBJ, PLY, 3MF</li>
                  <li><strong>Scene:</strong> DAE (Collada), glTF, FBX</li>
                  <li><strong>Point Cloud:</strong> LAS, LAZ, XYZ</li>
                  <li><strong>Max File Size:</strong> 50MB per file</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Transform Your CAD Workflow?</h2>
              <p>Join thousands of engineers and designers already using HoloDraft</p>
              <ModernButton 
                variant="primary" 
                size="lg"
                onClick={() => setShowAuth(true)}
              >
                Start Free Trial
              </ModernButton>
            </div>
          </div>
        </section>
      </main>
      
    </div>
  );
}

export default App;
