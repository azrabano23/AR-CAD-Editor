import React, { useState, useRef, useEffect } from 'react';
import { HoloDraftFile } from '../lib/supabaseClient';

interface UnityCADViewerProps {
  file: HoloDraftFile;
  onClose?: () => void;
  onFileUpdated?: (file: HoloDraftFile) => void;
}

interface MaterialSettings {
  name: string;
  color: { r: number; g: number; b: number; a: number };
  metallic: number;
  roughness: number;
}

interface TransformSettings {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export const UnityCADViewer: React.FC<UnityCADViewerProps> = ({
  file,
  onClose,
  onFileUpdated
}) => {
  const unityRef = useRef<any>(null);
  const [isUnityReady, setIsUnityReady] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'view' | 'materials' | 'transform' | 'ar'>('view');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Model settings
  const [materialSettings, setMaterialSettings] = useState<MaterialSettings>({
    name: 'all',
    color: { r: 0.7, g: 0.7, b: 0.7, a: 1.0 },
    metallic: 0.0,
    roughness: 0.5
  });
  
  const [transformSettings, setTransformSettings] = useState<TransformSettings>({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });

  // Event handlers
  const handleUnityReady = () => {
    console.log('Unity CAD Viewer is ready');
    setIsUnityReady(true);
  };

  const handleModelLoaded = (fileId: string) => {
    console.log('Model loaded:', fileId);
    setIsModelLoaded(true);
  };

  const handleModelTransformed = (fileId: string, transform: any) => {
    setTransformSettings({
      position: transform.position,
      rotation: transform.rotation,
      scale: transform.scale
    });
  };

  const handleARSessionStatus = (isActive: boolean, sessionId?: string) => {
    setIsARActive(isActive);
    setCurrentSessionId(sessionId || null);
    
    if (isActive) {
      console.log('AR session started:', sessionId);
    } else {
      console.log('AR session stopped');
    }
  };

  const handleError = (error: string) => {
    console.error('Unity error:', error);
    alert(`Unity Error: ${error}`);
  };

  // Material controls
  const handleMaterialUpdate = () => {
    if (!unityRef.current || !isModelLoaded) return;
    
    unityRef.current.updateMaterial(
      materialSettings.name,
      materialSettings.color,
      materialSettings.metallic,
      materialSettings.roughness
    );
  };

  // Transform controls
  const handleTransformUpdate = () => {
    if (!unityRef.current || !isModelLoaded) return;
    
    unityRef.current.transformModel(
      transformSettings.position,
      transformSettings.rotation,
      transformSettings.scale
    );
  };

  const resetTransform = () => {
    const defaultTransform = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    };
    setTransformSettings(defaultTransform);
    
    if (unityRef.current && isModelLoaded) {
      unityRef.current.transformModel(
        defaultTransform.position,
        defaultTransform.rotation,
        defaultTransform.scale
      );
    }
  };

  // AR controls
  const startARSession = () => {
    if (!unityRef.current || !isModelLoaded) {
      alert('Please wait for the model to load before starting AR session');
      return;
    }
    
    const arConfig = {
      enableHandTracking: true,
      enableCollaboration: false
    };
    
    unityRef.current.startARSession(arConfig);
  };

  const stopARSession = () => {
    if (unityRef.current) {
      unityRef.current.stopARSession();
    }
  };

  // Export functionality
  const exportModel = () => {
    if (!unityRef.current || !isModelLoaded) return;
    
    unityRef.current.exportModel('fbx');
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    // Apply material settings when they change
    if (isModelLoaded) {
      handleMaterialUpdate();
    }
  }, [materialSettings, isModelLoaded]);

  useEffect(() => {
    // Apply transform settings when they change
    if (isModelLoaded) {
      handleTransformUpdate();
    }
  }, [transformSettings, isModelLoaded]);

  if (!file.converted_url) {
    return (
      <div className="unity-cad-viewer error">
        <div className="error-content">
          <h3>Model Not Ready</h3>
          <p>This model hasn't been converted for AR viewing yet.</p>
          <p>Please convert it to FBX format first.</p>
          {onClose && (
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`unity-cad-viewer ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="viewer-header">
        <div className="header-left">
          <h2>{file.original_name}</h2>
          <div className="file-info">
            <span className="file-size">{(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
            <span className="file-format">{file.original_format.toUpperCase()}</span>
            {isARActive && (
              <span className="ar-status">🥽 AR Active</span>
            )}
          </div>
        </div>
        
        <div className="header-right">
          <button 
            onClick={toggleFullscreen}
            className="btn-icon"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '🗗' : '🗖'}
          </button>
          
          {onClose && (
            <button onClick={onClose} className="btn-icon" title="Close">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="viewer-content">
        {/* Unity Viewer */}
        <div className="unity-container">
          <iframe
            ref={unityRef}
            src="/unity-webgl/index.html"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#1a1a1a'
            }}
            onLoad={() => {
              handleUnityReady();
              
              // Send model data to WebGL viewer
              if (unityRef.current && file.converted_url) {
                setTimeout(() => {
                  unityRef.current.contentWindow.postMessage({
                    type: 'LOAD_CAD_MODEL',
                    modelUrl: file.converted_url,
                    fileName: file.original_name,
                    fileId: file.id
                  }, '*');
                  handleModelLoaded(file.id.toString());
                }, 1000);
              }
            }}
          />
        </div>

        {/* Controls Panel */}
        <div className="controls-panel">
          {/* Tab Navigation */}
          <div className="tab-nav">
            <button 
              className={`tab ${activeTab === 'view' ? 'active' : ''}`}
              onClick={() => setActiveTab('view')}
            >
              📷 View
            </button>
            <button 
              className={`tab ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => setActiveTab('materials')}
              disabled={!isModelLoaded}
            >
              🎨 Materials
            </button>
            <button 
              className={`tab ${activeTab === 'transform' ? 'active' : ''}`}
              onClick={() => setActiveTab('transform')}
              disabled={!isModelLoaded}
            >
              📐 Transform
            </button>
            <button 
              className={`tab ${activeTab === 'ar' ? 'active' : ''}`}
              onClick={() => setActiveTab('ar')}
              disabled={!isModelLoaded}
            >
              🥽 AR
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'view' && (
              <div className="view-controls">
                <h3>View Controls</h3>
                <div className="control-group">
                  <p>Use mouse to rotate and zoom the model.</p>
                  <button 
                    onClick={resetTransform}
                    className="btn-secondary"
                    disabled={!isModelLoaded}
                  >
                    Reset View
                  </button>
                </div>
                
                <div className="control-group">
                  <button 
                    onClick={exportModel}
                    className="btn-primary"
                    disabled={!isModelLoaded}
                  >
                    📤 Export Model
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="materials-controls">
                <h3>Material Settings</h3>
                
                <div className="control-group">
                  <label>Color</label>
                  <div className="color-controls">
                    <input
                      type="color"
                      value={`#${Math.round(materialSettings.color.r * 255).toString(16).padStart(2, '0')}${Math.round(materialSettings.color.g * 255).toString(16).padStart(2, '0')}${Math.round(materialSettings.color.b * 255).toString(16).padStart(2, '0')}`}
                      onChange={(e) => {
                        const hex = e.target.value;
                        const r = parseInt(hex.slice(1, 3), 16) / 255;
                        const g = parseInt(hex.slice(3, 5), 16) / 255;
                        const b = parseInt(hex.slice(5, 7), 16) / 255;
                        setMaterialSettings(prev => ({
                          ...prev,
                          color: { ...prev.color, r, g, b }
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="control-group">
                  <label>Metallic: {materialSettings.metallic.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialSettings.metallic}
                    onChange={(e) => setMaterialSettings(prev => ({
                      ...prev,
                      metallic: parseFloat(e.target.value)
                    }))}
                  />
                </div>

                <div className="control-group">
                  <label>Roughness: {materialSettings.roughness.toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={materialSettings.roughness}
                    onChange={(e) => setMaterialSettings(prev => ({
                      ...prev,
                      roughness: parseFloat(e.target.value)
                    }))}
                  />
                </div>
              </div>
            )}

            {activeTab === 'transform' && (
              <div className="transform-controls">
                <h3>Transform</h3>
                
                <div className="control-group">
                  <label>Position</label>
                  <div className="vector-input">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="X"
                      value={transformSettings.position.x}
                      onChange={(e) => setTransformSettings(prev => ({
                        ...prev,
                        position: { ...prev.position, x: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Y"
                      value={transformSettings.position.y}
                      onChange={(e) => setTransformSettings(prev => ({
                        ...prev,
                        position: { ...prev.position, y: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Z"
                      value={transformSettings.position.z}
                      onChange={(e) => setTransformSettings(prev => ({
                        ...prev,
                        position: { ...prev.position, z: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>

                <div className="control-group">
                  <label>Rotation</label>
                  <div className="vector-input">
                    <input
                      type="number"
                      step="1"
                      placeholder="X"
                      value={transformSettings.rotation.x}
                      onChange={(e) => setTransformSettings(prev => ({
                        ...prev,
                        rotation: { ...prev.rotation, x: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                    <input
                      type="number"
                      step="1"
                      placeholder="Y"
                      value={transformSettings.rotation.y}
                      onChange={(e) => setTransformSettings(prev => ({
                        ...prev,
                        rotation: { ...prev.rotation, y: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                    <input
                      type="number"
                      step="1"
                      placeholder="Z"
                      value={transformSettings.rotation.z}
                      onChange={(e) => setTransformSettings(prev => ({
                        ...prev,
                        rotation: { ...prev.rotation, z: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>

                <div className="control-group">
                  <label>Scale</label>
                  <div className="vector-input">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="X"
                      value={transformSettings.scale.x}
                      onChange={(e) => setTransformSettings(prev => ({
                        ...prev,
                        scale: { ...prev.scale, x: parseFloat(e.target.value) || 1 }
                      }))}
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Y"
                      value={transformSettings.scale.y}
                      onChange={(e) => setTransformSettings(prev => ({
                        ...prev,
                        scale: { ...prev.scale, y: parseFloat(e.target.value) || 1 }
                      }))}
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="Z"
                      value={transformSettings.scale.z}
                      onChange={(e) => setTransformSettings(prev => ({
                        ...prev,
                        scale: { ...prev.scale, z: parseFloat(e.target.value) || 1 }
                      }))}
                    />
                  </div>
                </div>

                <button onClick={resetTransform} className="btn-secondary">
                  Reset Transform
                </button>
              </div>
            )}

            {activeTab === 'ar' && (
              <div className="ar-controls">
                <h3>Augmented Reality</h3>
                
                {!isARActive ? (
                  <div className="control-group">
                    <p>Experience this model in AR on your MetaQuest device.</p>
                    <button 
                      onClick={startARSession}
                      className="btn-primary btn-large"
                    >
                      🥽 Start AR Session
                    </button>
                    
                    <div className="ar-requirements">
                      <h4>Requirements:</h4>
                      <ul>
                        <li>MetaQuest 2 or 3</li>
                        <li>HoloDraft AR app installed</li>
                        <li>Same network connection</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="control-group">
                    <div className="ar-session-info">
                      <p>✅ AR session active</p>
                      <p>Session ID: <code>{currentSessionId}</code></p>
                    </div>
                    
                    <button 
                      onClick={stopARSession}
                      className="btn-danger"
                    >
                      Stop AR Session
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .unity-cad-viewer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #1a1a1a;
          color: white;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .unity-cad-viewer.fullscreen {
          z-index: 1001;
        }

        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #333;
          background: #252525;
        }

        .header-left h2 {
          margin: 0 0 0.5rem 0;
          color: #00d4ff;
        }

        .file-info {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          color: #ccc;
        }

        .ar-status {
          color: #00ff88;
          font-weight: bold;
        }

        .header-right {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon {
          background: #333;
          border: none;
          color: white;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.1rem;
        }

        .btn-icon:hover {
          background: #444;
        }

        .viewer-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .unity-container {
          flex: 1;
          background: #1a1a1a;
        }

        .controls-panel {
          width: 300px;
          background: #252525;
          border-left: 1px solid #333;
          display: flex;
          flex-direction: column;
        }

        .tab-nav {
          display: flex;
          border-bottom: 1px solid #333;
        }

        .tab {
          flex: 1;
          background: #333;
          border: none;
          color: white;
          padding: 0.75rem 0.5rem;
          cursor: pointer;
          border-right: 1px solid #444;
          font-size: 0.9rem;
        }

        .tab:hover {
          background: #444;
        }

        .tab.active {
          background: #00d4ff;
          color: #1a1a1a;
        }

        .tab:disabled {
          background: #222;
          color: #666;
          cursor: not-allowed;
        }

        .tab-content {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        .control-group {
          margin-bottom: 1.5rem;
        }

        .control-group h3 {
          margin: 0 0 1rem 0;
          color: #00d4ff;
        }

        .control-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #ccc;
          font-size: 0.9rem;
        }

        .control-group input[type="range"] {
          width: 100%;
          margin-bottom: 0.5rem;
        }

        .control-group input[type="color"] {
          width: 100%;
          height: 40px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .vector-input {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
        }

        .vector-input input {
          background: #333;
          border: 1px solid #555;
          color: white;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .vector-input input:focus {
          outline: none;
          border-color: #00d4ff;
        }

        .btn-primary, .btn-secondary, .btn-danger {
          background: #00d4ff;
          color: #1a1a1a;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          width: 100%;
          margin-bottom: 0.5rem;
        }

        .btn-secondary {
          background: #666;
          color: white;
        }

        .btn-danger {
          background: #ff4444;
          color: white;
        }

        .btn-large {
          padding: 1rem;
          font-size: 1.1rem;
        }

        .btn-primary:hover {
          background: #0099cc;
        }

        .btn-secondary:hover {
          background: #777;
        }

        .btn-danger:hover {
          background: #cc3333;
        }

        .btn-primary:disabled, .btn-secondary:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
        }

        .ar-requirements {
          margin-top: 1rem;
          padding: 1rem;
          background: #333;
          border-radius: 4px;
        }

        .ar-requirements h4 {
          margin: 0 0 0.5rem 0;
          color: #00d4ff;
        }

        .ar-requirements ul {
          margin: 0;
          padding-left: 1rem;
          color: #ccc;
        }

        .ar-session-info {
          background: #2a4a2a;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .ar-session-info code {
          background: #1a1a1a;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.8rem;
        }

        .error {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }

        .error-content {
          text-align: center;
          padding: 2rem;
        }

        .error-content h3 {
          color: #ff4444;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
};

export default UnityCADViewer;
