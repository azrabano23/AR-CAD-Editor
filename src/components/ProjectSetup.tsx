import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Upload, 
  Box,
  Play, 
  FileText,
  Folder,
  Users,
  Zap,
  Save,
  CheckCircle,
  File,
  X,
  Cloud,
  HardDrive
} from 'lucide-react';
import ModernButton from './ModernButton';
import './ProjectSetup.css';

interface ProjectSetupProps {
  mode: 'new' | 'demo' | 'template';
  user: any;
  onComplete: (projectData: ProjectData) => void;
  onCancel: () => void;
}

interface ProjectData {
  name: string;
  description: string;
  type: 'upload' | 'demo' | 'template';
  templateId?: string;
}

const ProjectSetup: React.FC<ProjectSetupProps> = ({ mode, user, onComplete, onCancel }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Demo objects for quick start
  const demoObjects = [
    {
      id: 'test-cube',
      name: 'Test Cube',
      description: 'Simple geometric cube perfect for testing AR functionality',
      thumbnail: 'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=300&h=200&fit=crop',
      complexity: 'Simple',
      industry: 'General'
    },
    {
      id: 'gear-assembly',
      name: 'Mechanical Gear',
      description: 'Precision gear mechanism for mechanical demonstrations',
      thumbnail: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300&h=200&fit=crop',
      complexity: 'Medium',
      industry: 'Mechanical'
    },
    {
      id: 'circuit-board',
      name: 'Electronic Circuit',
      description: 'Detailed PCB layout for electronics visualization',
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop',
      complexity: 'Medium',
      industry: 'Electronics'
    },
    {
      id: 'engine-block',
      name: 'V6 Engine Block',
      description: 'High-detail automotive engine for training purposes',
      thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=300&h=200&fit=crop',
      complexity: 'Complex',
      industry: 'Automotive'
    },
    {
      id: 'house-frame',
      name: 'Building Frame',
      description: 'Residential construction frame for architecture review',
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=200&fit=crop',
      complexity: 'Complex',
      industry: 'Architecture'
    }
  ];

  // Professional templates
  const templates = [
    {
      id: 'manufacturing-line',
      name: 'Manufacturing Assembly Line',
      description: 'Complete production line setup with interactive components',
      thumbnail: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=300&h=200&fit=crop',
      category: 'Manufacturing',
      features: ['Interactive Components', 'Process Simulation', 'Quality Checkpoints']
    },
    {
      id: 'medical-device',
      name: 'Medical Device Training',
      description: 'Interactive medical equipment for training scenarios',
      thumbnail: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop',
      category: 'Healthcare',
      features: ['Step-by-step Guide', 'Safety Protocols', 'Certification Ready']
    },
    {
      id: 'building-bim',
      name: 'Building Information Model',
      description: 'Complete BIM visualization with structural details',
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=200&fit=crop',
      category: 'Architecture',
      features: ['BIM Integration', 'Layer Control', 'Measurement Tools']
    }
  ];

  const handleNext = () => {
    if (currentStep === 1) {
      if (!projectName.trim()) {
        alert('Please enter a project name');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Create the project
      const projectData: ProjectData = {
        name: projectName,
        description: projectDescription,
        type: mode === 'new' ? 'upload' : mode === 'demo' ? 'demo' : 'template',
        templateId: selectedTemplate || undefined
      };
      onComplete(projectData);
    }
  };

  const getStepContent = () => {
    if (currentStep === 1) {
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="setup-step"
        >
          <div className="step-header">
            <h2>Project Details</h2>
            <p>Give your AR project a name and description</p>
          </div>

          <div className="form-fields">
            <div className="form-field">
              <label htmlFor="projectName">Project Name *</label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Engine Assembly Review"
                maxLength={50}
              />
              <small>{projectName.length}/50 characters</small>
            </div>

            <div className="form-field">
              <label htmlFor="projectDescription">Description</label>
              <textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Brief description of your AR project..."
                rows={4}
                maxLength={200}
              />
              <small>{projectDescription.length}/200 characters</small>
            </div>
          </div>
        </motion.div>
      );
    }

    if (currentStep === 2 && mode === 'demo') {
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="setup-step"
        >
          <div className="step-header">
            <h2>Choose Demo Object</h2>
            <p>Select a pre-made 3D object to explore AR functionality</p>
          </div>

          <div className="demo-grid">
            {demoObjects.map((demo) => (
              <motion.div
                key={demo.id}
                className={`demo-card ${selectedTemplate === demo.id ? 'selected' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTemplate(demo.id)}
              >
                <div className="demo-thumbnail">
                  <img src={demo.thumbnail} alt={demo.name} />
                  <div className="demo-overlay">
                    <span className="complexity">{demo.complexity}</span>
                    <span className="industry">{demo.industry}</span>
                  </div>
                </div>
                <div className="demo-info">
                  <h3>{demo.name}</h3>
                  <p>{demo.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    }

    if (currentStep === 2 && mode === 'template') {
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="setup-step"
        >
          <div className="step-header">
            <h2>Choose Template</h2>
            <p>Start from a professional template with pre-built interactions</p>
          </div>

          <div className="template-grid">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="template-thumbnail">
                  <img src={template.thumbnail} alt={template.name} />
                  <div className="template-category">{template.category}</div>
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="template-features">
                    {template.features.map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    }

    // Step 2 for new project (upload flow)
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="setup-step"
      >
        <div className="step-header">
          <h2>Project Created!</h2>
          <p>Your project "{projectName}" is ready. You can now upload CAD files.</p>
        </div>

        <div className="creation-success">
          <div className="success-icon">
            <Zap className="w-12 h-12" />
          </div>
          <h3>Ready to Upload</h3>
          <p>Supported formats: STL, STEP, OBJ, PLY, DAE</p>
          <p>Maximum file size: 50MB</p>
        </div>
      </motion.div>
    );
  };

  const getActionButtons = () => {
    const canProceed = currentStep === 1 ? 
      projectName.trim().length > 0 : 
      (mode === 'new' || selectedTemplate);

    return (
      <div className="setup-actions">
        <ModernButton
          variant="secondary"
          onClick={currentStep === 1 ? onCancel : () => setCurrentStep(1)}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          {currentStep === 1 ? 'Back to Dashboard' : 'Previous'}
        </ModernButton>

        <ModernButton
          variant="primary"
          onClick={handleNext}
          disabled={!canProceed}
          icon={currentStep === 2 ? <Play className="w-4 h-4" /> : undefined}
        >
          {currentStep === 2 ? 'Create Project' : 'Next'}
        </ModernButton>
      </div>
    );
  };

  const getModeInfo = () => {
    switch (mode) {
      case 'demo':
        return {
          icon: <Play className="w-6 h-6" />,
          title: 'Try Demo',
          description: 'Explore AR with pre-made objects'
        };
      case 'template':
        return {
          icon: <Box className="w-6 h-6" />,
          title: 'Use Template',
          description: 'Start from professional templates'
        };
      default:
        return {
          icon: <Upload className="w-6 h-6" />,
          title: 'New Project',
          description: 'Upload your CAD files'
        };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className="project-setup">
      <div className="setup-container">
        {/* Header */}
        <div className="setup-header">
          <div className="mode-info">
            <div className="mode-icon">{modeInfo.icon}</div>
            <div className="mode-text">
              <h1>{modeInfo.title}</h1>
              <p>{modeInfo.description}</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="progress-indicator">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span>Details</span>
            </div>
            <div className="progress-line"></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>{mode === 'new' ? 'Setup' : 'Choose'}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="setup-content">
          <AnimatePresence mode="wait">
            {getStepContent()}
          </AnimatePresence>
        </div>

        {/* Actions */}
        {getActionButtons()}
      </div>
    </div>
  );
};

export default ProjectSetup;
