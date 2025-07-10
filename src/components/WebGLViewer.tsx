import React, { useEffect, useRef } from 'react';

interface WebGLViewerProps {
  modelUrl?: string;
  onClose: () => void;
}

const WebGLViewer: React.FC<WebGLViewerProps> = ({ modelUrl, onClose }) => {
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

  const webglUrl = modelUrl 
    ? `/unity-builds/webgl-fixed/index.html?model=${encodeURIComponent(modelUrl)}`
    : '/unity-builds/webgl-fixed/index.html';

  return (
    <div className="webgl-viewer-overlay">
      <div className="webgl-viewer-container">
        <div className="webgl-viewer-header">
          <h2>🌐 WebGL 3D Viewer</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>
        <div className="webgl-viewer-content">
          <iframe
            ref={iframeRef}
            src={webglUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="WebGL 3D Viewer"
          />
        </div>
        <div className="webgl-viewer-controls">
          <p>🖱️ <strong>Mouse:</strong> Rotate view | 🔍 <strong>Wheel:</strong> Zoom | <strong>ESC:</strong> Close</p>
        </div>
      </div>
    </div>
  );
};

export default WebGLViewer;
