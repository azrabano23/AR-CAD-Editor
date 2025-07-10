import React, { useEffect, useRef, useState } from 'react';

interface ARViewerProps {
  modelUrl?: string;
  onClose: () => void;
}

const ARViewer: React.FC<ARViewerProps> = ({ modelUrl, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Check if device supports AR
  const checkARSupport = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
    const isOculus = /oculus|quest|meta/.test(userAgent);
    
    return isMobile || isOculus;
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    if (!checkARSupport()) {
      setError('AR functionality is best experienced on mobile devices or VR headsets like MetaQuest.');
    }
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load AR viewer. Please check your connection and try again.');
  };

  const downloadForQuest = () => {
    // This would trigger download/deployment to MetaQuest
    alert('Quest deployment feature coming soon! For now, you can sideload the APK file.');
  };

  const arUrl = modelUrl 
    ? `/unity-builds/webgl-fixed/index.html?model=${encodeURIComponent(modelUrl)}&ar=true`
    : '/unity-builds/webgl-fixed/index.html?ar=true';

  return (
    <div className="ar-viewer-overlay">
      <div className="ar-viewer-container">
        <div className="ar-viewer-header">
          <h2>🥽 AR Viewer</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        
        {isLoading && (
          <div className="ar-loading">
            <div className="loading-spinner"></div>
            <p>Loading AR experience...</p>
          </div>
        )}
        
        {error && (
          <div className="ar-error">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button className="quest-download-btn" onClick={downloadForQuest}>
              📱 Deploy to MetaQuest
            </button>
          </div>
        )}
        
        <div className="ar-viewer-content" style={{ display: isLoading ? 'none' : 'block' }}>
          <iframe
            ref={iframeRef}
            src={arUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="AR Viewer"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
        
        <div className="ar-viewer-controls">
          <div className="ar-instructions">
            <h3>🎯 AR Instructions:</h3>
            <ul>
              <li>📱 <strong>Mobile:</strong> Point camera at flat surface</li>
              <li>🥽 <strong>VR Headset:</strong> Use hand tracking to interact</li>
              <li>👆 <strong>Gestures:</strong> Pinch to scale, drag to move</li>
              <li>🔄 <strong>Rotate:</strong> Two-finger rotation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARViewer;
