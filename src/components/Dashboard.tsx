import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Grid, List, FolderPlus, Box, Users, Clock, Download, Trash2, User, Printer } from 'lucide-react';
import { HoloDraftProject, HoloDraftUser, ARTemplate } from '../lib/supabaseClient';
import ModernButton from './ModernButton';
import UserProfile from './UserProfile';
import PrintDialog from './PrintDialog';
import './Dashboard.css';

interface DashboardProps {
  user: HoloDraftUser;
  onCreateProject: () => void;
  onOpenProject: (project: HoloDraftProject) => void;
  onDeleteProject?: (projectId: string) => void;
  onSignOut: () => void;
  onUpdateUser?: (updatedUser: HoloDraftUser) => void;
  onUseTemplate?: (templateId: string) => void;
  onPreviewTemplate?: (templateId: string, fileUrl: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onCreateProject, onOpenProject, onDeleteProject, onSignOut, onUpdateUser, onUseTemplate, onPreviewTemplate }) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'templates' | 'print'>('projects');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<HoloDraftProject[]>([]);
  const [templates, setTemplates] = useState<ARTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedProjectForPrint, setSelectedProjectForPrint] = useState<HoloDraftProject | null>(null);

  // Projects start empty - users need to create their own

  // Template objects for users to try out
  const templateObjects: ARTemplate[] = [
    {
      id: 'demo-cube',
      created_at: new Date().toISOString(),
      name: 'Test Cube',
      description: 'Simple geometric cube perfect for testing AR functionality and WebGL rendering',
      thumbnail_url: undefined,
      file_url: '/demo/test-cube.obj',
      category: 'mechanical',
      is_featured: true,
      download_count: 0,
      created_by: 'HoloDraft Team'
    },
    {
      id: 'demo-sphere',
      created_at: new Date().toISOString(),
      name: 'Demo Sphere',
      description: 'Smooth sphere object ideal for material testing and lighting demos',
      thumbnail_url: undefined,
      file_url: '/demo/demo-sphere.obj',
      category: 'mechanical',
      is_featured: true,
      download_count: 0,
      created_by: 'HoloDraft Team'
    }
  ];

  useEffect(() => {
    // Load user projects (starts empty) and demo templates
    setProjects([]); // Users start with 0 projects
    setTemplates(templateObjects);
  }, [user.id]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      mechanical: 'bg-blue-100 text-blue-700',
      architectural: 'bg-green-100 text-green-700',
      electronics: 'bg-purple-100 text-purple-700',
      automotive: 'bg-red-100 text-red-700',
      aerospace: 'bg-indigo-100 text-indigo-700',
      other: 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors.other;
  };

  const handleDeleteProject = async (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the project
    
    const confirmDelete = window.confirm('Are you sure you want to delete this project? This action cannot be undone.');
    if (!confirmDelete) return;
    
    try {
      if (onDeleteProject) {
        await onDeleteProject(projectId);
      }
      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handlePrintProject = (project: HoloDraftProject) => {
    setSelectedProjectForPrint(project);
    setShowPrintDialog(true);
  };

  const handleClosePrintDialog = () => {
    setShowPrintDialog(false);
    setSelectedProjectForPrint(null);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-section">
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" className="text-blue-600">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <path d="M4 8 L16 2 L28 8 L28 24 L16 30 L4 24 Z" fill="none" stroke="url(#logoGradient)" strokeWidth="2" opacity="0.8"/>
                  <path d="M4 8 L16 16 L28 8" stroke="url(#logoGradient)" strokeWidth="2" fill="none"/>
                  <path d="M16 16 L16 30" stroke="url(#logoGradient)" strokeWidth="2"/>
                  <circle cx="16" cy="12" r="3" fill="url(#logoGradient)" opacity="0.6"/>
                </svg>
              </div>
              <h1>HoloDraft</h1>
            </div>
            <div className="user-info">
              <span className="welcome-text">Welcome back, {user.full_name || user.email}</span>
              <span className="user-role">{user.subscription_type || 'Free'} Plan</span>
            </div>
          </div>
          <div className="header-right">
            <ModernButton 
              variant="primary" 
              size="md" 
              icon={<Plus className="w-4 h-4" />}
              onClick={onCreateProject}
            >
              New Project
            </ModernButton>
            <button 
              onClick={() => setShowProfile(true)} 
              className="profile-btn"
              title="Profile & Settings"
            >
              <User className="w-4 h-4" />
            </button>
            <button onClick={onSignOut} className="sign-out-btn">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <div className="dashboard-container">
          {/* Tabs and Controls */}
          <div className="dashboard-controls">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveTab('projects')}
              >
                <FolderPlus className="w-4 h-4" />
                My Projects ({projects.length})
              </button>
              <button 
                className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
                onClick={() => setActiveTab('templates')}
              >
                <Box className="w-4 h-4" />
                Try Our Templates ({templates.length})
              </button>
              <button 
                className={`tab ${activeTab === 'print' ? 'active' : ''}`}
                onClick={() => setActiveTab('print')}
              >
                <Printer className="w-4 h-4" />
                3D Print
              </button>
            </div>

            <div className="controls-right">
              <div className="search-box">
                <Search className="w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="view-controls">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="dashboard-content">
            <AnimatePresence mode="wait">
              {activeTab === 'projects' ? (
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredProjects.length === 0 ? (
                    <div className="empty-state">
                      <FolderPlus className="w-16 h-16 text-gray-300" />
                      <h3>No projects found</h3>
                      <p>Create your first AR project to get started</p>
                      <ModernButton 
                        variant="primary" 
                        size="lg"
                        icon={<Plus className="w-5 h-5" />}
                        onClick={onCreateProject}
                      >
                        Create Project
                      </ModernButton>
                    </div>
                  ) : (
                    <div className={`content-grid ${viewMode}`}>
                      {filteredProjects.map((project) => (
                        <motion.div
                          key={project.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="project-card"
                          onClick={() => onOpenProject(project)}
                        >
                          <div className="card-thumbnail">
                            {project.thumbnail_url ? (
                              <img src={project.thumbnail_url} alt={project.name} />
                            ) : (
                              <div className="thumbnail-placeholder">
                                <FolderPlus className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="card-overlay">
                              <div className="project-stats">
                                <span><Users className="w-3 h-3" /> {project.collaborator_count}</span>
                                <span>📁 {project.file_count}</span>
                              </div>
                              <button 
                                className="delete-project-btn"
                                onClick={(e) => handleDeleteProject(project.id, e)}
                                title="Delete Project"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="card-content">
                            <div className="card-header">
                              <h3>{project.name}</h3>
                              {project.is_public && <span className="public-badge">Public</span>}
                            </div>
                            <p className="card-description">{project.description}</p>
                            <div className="card-meta">
                              <span><Clock className="w-3 h-3" /> {formatDate(project.updated_at)}</span>
                              <span className={`status-badge ${project.status}`}>{project.status}</span>
                            </div>
                          </div>
                          <div className="card-actions">
                            <ModernButton
                              variant="secondary"
                              size="sm"
                              icon={<Printer className="w-4 h-4" />}
                              onClick={() => handlePrintProject(project)}
                            >
                              3D Print
                            </ModernButton>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'templates' ? (
              <motion.div
                key="templates"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                  <div className={`content-grid ${viewMode}`}>
                    {filteredTemplates.map((template) => (
                      <motion.div
                        key={template.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="template-card"
                      >
                        <div className="card-thumbnail">
                          {template.thumbnail_url ? (
                            <img src={template.thumbnail_url} alt={template.name} />
                          ) : (
                            <div className="thumbnail-placeholder">
                              <Box className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          {template.is_featured && (
                            <div className="featured-badge">Featured</div>
                          )}
                        </div>
                        <div className="card-content">
                          <div className="card-header">
                            <h3>{template.name}</h3>
                            <span className={`category-badge ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                          </div>
                          <p className="card-description">{template.description}</p>
                          <div className="card-meta">
                            <span><Download className="w-3 h-3" /> {template.download_count.toLocaleString()}</span>
                            <span>By {template.created_by}</span>
                          </div>
                          <div className="card-actions">
                            <ModernButton 
                              variant="secondary" 
                              size="sm"
                              onClick={() => onPreviewTemplate && onPreviewTemplate(template.id, template.file_url)}
                            >
                              Preview
                            </ModernButton>
                            <ModernButton 
                              variant="primary" 
                              size="sm"
                              onClick={() => onUseTemplate && onUseTemplate(template.id)}
                            >
                              Use Template
                            </ModernButton>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
            ) : (
              <motion.div
                key="print"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="print-section">
                  <div className="print-header">
                    <div className="print-title">
                      <Printer className="w-6 h-6 text-blue-600" />
                      <h2>3D Print Your Projects</h2>
                    </div>
                    <p className="print-subtitle">Select a project to send to your 3D printer</p>
                  </div>

                  {projects.length === 0 ? (
                    <div className="empty-state">
                      <Printer className="w-16 h-16 text-gray-300" />
                      <h3>No projects to print</h3>
                      <p>Create a project first to start 3D printing</p>
                      <ModernButton 
                        variant="primary" 
                        size="lg"
                        icon={<Plus className="w-5 h-5" />}
                        onClick={onCreateProject}
                      >
                        Create Project
                      </ModernButton>
                    </div>
                  ) : (
                    <div className="print-projects">
                      <div className="print-info-panel">
                        <div className="info-card">
                          <h3>🖨️ Ready to Print</h3>
                          <p>Select any of your projects below to configure print settings and start printing.</p>
                          <ul>
                            <li>✓ Automatic printer discovery</li>
                            <li>✓ Customizable print settings</li>
                            <li>✓ Real-time print monitoring</li>
                            <li>✓ Print history tracking</li>
                          </ul>
                        </div>
                      </div>

                      <div className="selectable-projects">
                        <h3>Choose a Project to Print</h3>
                        <div className="print-project-grid">
                          {projects.map((project) => (
                            <motion.div
                              key={project.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="print-project-card"
                            >
                              <div className="card-thumbnail">
                                {project.thumbnail_url ? (
                                  <img src={project.thumbnail_url} alt={project.name} />
                                ) : (
                                  <div className="thumbnail-placeholder">
                                    <FolderPlus className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="card-content">
                                <div className="card-header">
                                  <h4>{project.name}</h4>
                                  <span className={`status-badge ${project.status}`}>{project.status}</span>
                                </div>
                                <p className="card-description">{project.description || 'No description available'}</p>
                                <div className="card-meta">
                                  <span><Clock className="w-3 h-3" /> Updated {formatDate(project.updated_at)}</span>
                                  <span>📁 {project.file_count} files</span>
                                </div>
                              </div>
                              <div className="card-actions">
                                <ModernButton
                                  variant="primary"
                                  size="md"
                                  icon={<Printer className="w-4 h-4" />}
                                  onClick={() => handlePrintProject(project)}
                                  className="print-btn"
                                >
                                  Print This Project
                                </ModernButton>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdateUser={(updatedUser) => {
            if (onUpdateUser) {
              onUpdateUser(updatedUser);
            }
          }}
        />
      )}

      {/* 3D Print Dialog */}
      {showPrintDialog && selectedProjectForPrint && (
        <PrintDialog
          isOpen={showPrintDialog}
          onClose={handleClosePrintDialog}
          projectId={selectedProjectForPrint.id}
          projectName={selectedProjectForPrint.name}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default Dashboard;
