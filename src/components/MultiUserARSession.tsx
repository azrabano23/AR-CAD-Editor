import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Video, VideoOff, Mic, MicOff, Share2, Copy, UserPlus, Settings, Zap, Eye } from 'lucide-react';

interface ARUser {
  id: string;
  name: string;
  avatar?: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  isActive: boolean;
  isSpeaking: boolean;
  deviceType: 'hololens' | 'metaquest' | 'mobile' | 'desktop';
}

interface ARAnnotation {
  id: string;
  userId: string;
  userName: string;
  position: { x: number; y: number; z: number };
  text: string;
  timestamp: Date;
  type: 'comment' | 'measurement' | 'highlight';
}

interface MultiUserARSessionProps {
  modelUrl?: string;
  sessionId?: string;
  repositoryId?: string;
  branchName?: string;
  onClose: () => void;
}

const MultiUserARSession: React.FC<MultiUserARSessionProps> = ({ 
  modelUrl, 
  sessionId = 'ar-session',
  repositoryId,
  branchName = 'main',
  onClose 
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<ARUser[]>([]);
  const [annotations, setAnnotations] = useState<ARAnnotation[]>([]);
  const [currentUser, setCurrentUser] = useState<ARUser | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeAnnotationTool, setActiveAnnotationTool] = useState<'comment' | 'measurement' | 'highlight' | null>(null);
  
  // Collaboration state
  const [collaborationState, setCollaborationState] = useState({
    repositoryId: repositoryId || '',
    branchName: branchName,
    isCommitting: false,
    lastCommit: null,
    hasChanges: false,
    conflictResolution: null
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

// Initialize WebRTC and WebSocket connection
useEffect(() => {
  initializeSession();
  initializeCollaboration();
  return () => {
    cleanup();
  };
}, []);

// Initialize collaboration features
const initializeCollaboration = () => {
  if (!sessionId) return;

  // Connect to WebSocket server
  wsRef.current = new WebSocket(`wss://your-backend-server.com/session/${sessionId}`);

  wsRef.current.onopen = () => {
    console.log('Connected to collaboration server');
    setIsConnected(true);
  };

  wsRef.current.onmessage = (event) => {
    const message = JSON.parse(event.data);
    // Handle incoming messages
    if (message.type === 'user-joined') {
      setUsers(prev => [...prev, message.user]);
    }
    if (message.type === 'user-left') {
      setUsers(prev => prev.filter(u => u.id !== message.userId));
    }
    if (message.type === 'annotation') {
      setAnnotations(prev => [...prev, message.annotation]);
    }
  };

  wsRef.current.onclose = () => {
    console.log('Disconnected from collaboration server');
    setIsConnected(false);
  };
};

  const initializeSession = async () => {
    try {
      // Get user media for video/audio
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
      }

      // Initialize WebSocket for signaling
      initializeWebSocket();
      
      // Initialize current user
      initializeCurrentUser();
      
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  };

  const initializeWebSocket = () => {
    // In production, this would connect to your signaling server
    setTimeout(() => {
      setIsConnected(true);
    }, 2000);
  };

  const initializeCurrentUser = () => {
    // Create current user
    const currentUserData: ARUser = {
      id: 'current-user',
      name: 'You (Host)',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      isActive: true,
      isSpeaking: false,
      deviceType: 'desktop'
    };

    setCurrentUser(currentUserData);
    setUsers([]); // Start with no other users
  };


  const addAnnotation = (userId: string, userName: string, text: string, type: 'comment' | 'measurement' | 'highlight') => {
    const newAnnotation: ARAnnotation = {
      id: `annotation-${Date.now()}`,
      userId,
      userName,
      position: { x: Math.random() * 2 - 1, y: Math.random() * 2, z: Math.random() * 2 - 1 },
      text,
      timestamp: new Date(),
      type
    };
    
    setAnnotations(prev => [...prev, newAnnotation]);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const shareSession = () => {
    const shareUrl = `${window.location.origin}/ar-session/${sessionId}`;
    navigator.clipboard.writeText(shareUrl);
    setShowShareModal(true);
    setTimeout(() => setShowShareModal(false), 3000);
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Collaboration API functions
  const commitChanges = async (message: string) => {
    if (!collaborationState.repositoryId || !collaborationState.hasChanges) return;
    
    setCollaborationState(prev => ({ ...prev, isCommitting: true }));
    
    try {
      const commitData = {
        repositoryId: collaborationState.repositoryId,
        branchName: collaborationState.branchName,
        message,
        changes: {
          annotations,
          arObjects: [], // Could include AR object transformations
          timestamp: new Date().toISOString()
        }
      };
      
      // Send commit to backend
      const response = await fetch(`/api/repositories/${collaborationState.repositoryId}/commits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commitData)
      });
      
      if (response.ok) {
        const commit = await response.json();
        setCollaborationState(prev => ({ 
          ...prev, 
          lastCommit: commit, 
          hasChanges: false, 
          isCommitting: false 
        }));
        
        // Broadcast commit to other users
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'commit',
            commit,
            sessionId
          }));
        }
      }
    } catch (error) {
      console.error('Failed to commit changes:', error);
      setCollaborationState(prev => ({ ...prev, isCommitting: false }));
    }
  };
  
  const createBranch = async (branchName: string) => {
    if (!collaborationState.repositoryId) return;
    
    try {
      const response = await fetch(`/api/repositories/${collaborationState.repositoryId}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: branchName, fromBranch: collaborationState.branchName })
      });
      
      if (response.ok) {
        const newBranch = await response.json();
        setCollaborationState(prev => ({ ...prev, branchName: newBranch.name }));
        
        // Broadcast branch creation
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'branch-created',
            branch: newBranch,
            sessionId
          }));
        }
      }
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };
  
  const switchBranch = async (branchName: string) => {
    if (!collaborationState.repositoryId) return;
    
    try {
      // Fetch branch data
      const response = await fetch(`/api/repositories/${collaborationState.repositoryId}/branches/${branchName}`);
      
      if (response.ok) {
        const branchData = await response.json();
        
        // Update state with branch data
        setCollaborationState(prev => ({ ...prev, branchName }));
        setAnnotations(branchData.annotations || []);
        
        // Broadcast branch switch
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'branch-switched',
            branchName,
            sessionId
          }));
        }
      }
    } catch (error) {
      console.error('Failed to switch branch:', error);
    }
  };
  
  const sendCollaborationMessage = (type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        data,
        sessionId,
        userId: currentUser?.id,
        timestamp: Date.now()
      }));
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'hololens': return '👓';
      case 'metaquest': return '🥽';
      case 'mobile': return '📱';
      case 'desktop': return '💻';
      default: return '🖥️';
    }
  };

  const getAnnotationColor = (type: string) => {
    switch (type) {
      case 'comment': return '#22c55e';
      case 'measurement': return '#3b82f6';
      case 'highlight': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  return (
    <div className="multi-user-ar-overlay">
      <div className="multi-user-ar-container">
        {/* Header */}
        <div className="ar-session-header">
          <div className="session-info">
            <div className="session-title">
              <Users className="session-icon" />
              <span>Multi-User AR Session</span>
              <div className="connection-status">
                <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
            <div className="session-stats">
              <span>{users.length + 1} users</span>
              <span>•</span>
              <span>Ready for collaboration</span>
            </div>
          </div>
          <div className="header-controls">
            <button className="share-button" onClick={shareSession}>
              <Share2 size={18} />
              Share Session
            </button>
            <button className="close-button" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="ar-session-content">
          {/* 3D AR Space */}
          <div className="ar-space">
            <div className="ar-viewport">
              {/* 3D Environment */}
              <div className="ar-environment">
                <div className="ar-model-placeholder">
                  <Zap size={48} className="model-icon" />
                  <p>3D CAD Model</p>
                  <small>Interactive AR space</small>
                </div>
                
                {/* User Avatars */}
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="ar-user-avatar"
                    style={{
                      left: `${50 + user.position.x * 20}%`,
                      top: `${50 + user.position.z * 20}%`,
                      transform: `rotate(${user.rotation.y}deg)`
                    }}
                  >
                    <div className="user-marker">
                      <div className="device-icon">{getDeviceIcon(user.deviceType)}</div>
                      <div className="user-name">{user.name}</div>
                      {user.isSpeaking && <div className="speaking-indicator" />}
                    </div>
                  </div>
                ))}

                {/* Annotations */}
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="ar-annotation"
                    style={{
                      left: `${50 + annotation.position.x * 25}%`,
                      top: `${50 + annotation.position.z * 25}%`,
                      borderColor: getAnnotationColor(annotation.type)
                    }}
                  >
                    <div className="annotation-content">
                      <div className="annotation-header">
                        <span className="annotation-user">{annotation.userName}</span>
                        <span className="annotation-time">
                          {annotation.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="annotation-text">{annotation.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="ar-side-panel">
            {/* Video Feed */}
            <div className="video-section">
              <div className="video-grid">
                <div className="video-feed local">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="user-video"
                  />
                  <div className="video-overlay">
                    <span>You (Host)</span>
                    <div className="video-controls">
                      <button 
                        className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
                        onClick={toggleVideo}
                      >
                        {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                      </button>
                      <button 
                        className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
                        onClick={toggleAudio}
                      >
                        {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {users.slice(0, 3).map((user) => (
                  <div key={user.id} className="video-feed remote">
                    <div className="remote-feed">
                      <div className="avatar-placeholder">
                        {getDeviceIcon(user.deviceType)}
                      </div>
                      {user.isSpeaking && <div className="speaking-animation" />}
                    </div>
                    <div className="video-overlay">
                      <span>{user.name}</span>
                      <Eye size={14} />
                    </div>
                  </div>
                ))}
                
                {/* Show placeholder if no other users */}
                {users.length === 0 && (
                  <div className="video-feed empty">
                    <div className="empty-placeholder">
                      <UserPlus size={32} />
                      <p>Waiting for users to join...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Collaboration Tools */}
            <div className="tools-section">
              <h4>AR Collaboration Tools</h4>
              <div className="tool-grid">
                <button 
                  className={`tool-btn ${activeAnnotationTool === 'comment' ? 'active' : ''}`}
                  onClick={() => setActiveAnnotationTool(activeAnnotationTool === 'comment' ? null : 'comment')}
                >
                  💬 Comment
                </button>
                <button 
                  className={`tool-btn ${activeAnnotationTool === 'measurement' ? 'active' : ''}`}
                  onClick={() => setActiveAnnotationTool(activeAnnotationTool === 'measurement' ? null : 'measurement')}
                >
                  📏 Measure
                </button>
                <button 
                  className={`tool-btn ${activeAnnotationTool === 'highlight' ? 'active' : ''}`}
                  onClick={() => setActiveAnnotationTool(activeAnnotationTool === 'highlight' ? null : 'highlight')}
                >
                  ✨ Highlight
                </button>
                <button className="tool-btn">
                  🖼️ Snapshot
                </button>
              </div>
            </div>

            {/* Session Stats */}
            <div className="stats-section">
              <h4>Session Analytics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-value">{users.length + 1}</span>
                  <span className="stat-label">Active Users</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{annotations.length}</span>
                  <span className="stat-label">Annotations</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{isConnected ? '100%' : '0%'}</span>
                  <span className="stat-label">Connected</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">Ready</span>
                  <span className="stat-label">Status</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="share-modal"
          >
            <div className="share-content">
              <Copy className="share-icon" />
              <p>Session link copied to clipboard!</p>
              <small>Share with team members to join AR session</small>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiUserARSession;
