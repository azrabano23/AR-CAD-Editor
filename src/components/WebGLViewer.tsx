import React, { useEffect, useRef, useState } from 'react';

interface WebGLViewerProps {
  modelUrl?: string;
  fileName?: string;
  onClose: () => void;
}

const WebGLViewer: React.FC<WebGLViewerProps> = ({ modelUrl, fileName, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    // Send model data to WebGL viewer when iframe loads and model URL is available
    if (isLoaded && modelUrl && fileName && iframeRef.current) {
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'LOAD_CAD_MODEL',
          modelUrl: modelUrl,
          fileName: fileName
        }, '*');
      }, 1000);
    }
  }, [isLoaded, modelUrl, fileName]);

  const handleIframeLoad = () => {
    setIsLoaded(true);
  };

  const webglUrl = '/unity-webgl/index.html';

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
            onLoad={handleIframeLoad}
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
