import React, { useEffect, useRef, useState } from 'react';

interface UnityViewerProps {
  modelFile?: {
    name: string;
    convertedUrl: string;
    id: string;
  };
}

interface UnityInstance {
  SendMessage: (objectName: string, methodName: string, value?: string) => void;
}

declare global {
  interface Window {
    UnityLoader?: {
      instantiate: (canvasId: string, buildUrl: string) => Promise<UnityInstance>;
    };
    unityBridge?: {
      initialize: (canvasId: string) => Promise<UnityInstance>;
      loadModel: (fileData: any) => void;
      transformModel: (transformData: any) => void;
      updateMaterial: (materialData: any) => void;
    };
  }
}

const UnityViewer: React.FC<UnityViewerProps> = ({ modelFile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [unityInstance, setUnityInstance] = useState<UnityInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeUnity();
  }, []);

  useEffect(() => {
    if (unityInstance && modelFile) {
      loadModelIntoUnity();
    }
  }, [unityInstance, modelFile]);

  const initializeUnity = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Unity build files exist
      const response = await fetch('/unity-builds/webgl/Build/UnityLoader.js');
      if (!response.ok) {
        throw new Error('Unity build files not found. Please build the WebGL project first.');
      }

      // Load Unity loader script
      const script = document.createElement('script');
      script.src = '/unity-builds/webgl/Build/UnityLoader.js';
      script.onload = () => {
        if (window.UnityLoader) {
          // Initialize Unity
          window.UnityLoader.instantiate('unity-canvas', '/unity-builds/webgl/Build/Build.json')
            .then((instance) => {
              setUnityInstance(instance);
              setIsLoading(false);
              console.log('✅ Unity WebGL initialized');
            })
            .catch((err) => {
              setError(`Failed to initialize Unity: ${err.message}`);
              setIsLoading(false);
            });
        }
      };
      script.onerror = () => {
        setError('Failed to load Unity WebGL loader');
        setIsLoading(false);
      };
      document.head.appendChild(script);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  const loadModelIntoUnity = () => {
    if (!unityInstance || !modelFile) return;

    try {
      const modelData = {
        fileName: modelFile.name,
        url: modelFile.convertedUrl,
        id: modelFile.id
      };

      // Send message to Unity CAD Model Manager
      unityInstance.SendMessage('CADModelManager', 'LoadCADModel', JSON.stringify(modelData));
      console.log('📦 Model loaded into Unity:', modelData);
    } catch (err) {
      console.error('❌ Failed to load model into Unity:', err);
    }
  };

  const handleWireframeToggle = () => {
    if (unityInstance) {
      unityInstance.SendMessage('CADModelManager', 'ToggleWireframe', '');
    }
  };

  const handleExplodedView = () => {
    if (unityInstance) {
      unityInstance.SendMessage('CADModelManager', 'ToggleExplodedView', '');
    }
  };

  const handleMeasurementMode = () => {
    if (unityInstance) {
      unityInstance.SendMessage('CADMeasurementTools', 'StartDistanceMeasurement', '');
    }
  };

  const handleResetView = () => {
    if (unityInstance) {
      unityInstance.SendMessage('CADModelManager', 'ClearMeasurementsAndAnnotations', '');
    }
  };

  if (error) {
    return (
      <div className="unity-viewer error">
        <div className="error-message">
          <h3>⚠️ Unity WebGL Error</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={initializeUnity} className="btn-secondary">
              Retry
            </button>
            <p className="error-help">
              Make sure Unity WebGL build is complete in: 
              <code>/public/unity-builds/webgl/</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="unity-viewer">
      <div className="unity-container">
        <canvas
          ref={canvasRef}
          id="unity-canvas"
          style={{
            width: '100%',
            height: '500px',
            display: isLoading ? 'none' : 'block',
            background: '#1a1a1a'
          }}
        />
        
        {isLoading && (
          <div className="unity-loading">
            <div className="loading-spinner"></div>
            <p>Loading Unity WebGL...</p>
            <p className="loading-tip">This may take a few moments on first load</p>
          </div>
        )}
      </div>

      {unityInstance && (
        <div className="unity-controls">
          <h3>CAD Controls</h3>
          <div className="control-buttons">
            <button onClick={handleWireframeToggle} className="btn-control">
              ⚡ Wireframe
            </button>
            <button onClick={handleExplodedView} className="btn-control">
              💥 Exploded View
            </button>
            <button onClick={handleMeasurementMode} className="btn-control">
              📏 Measure
            </button>
            <button onClick={handleResetView} className="btn-control">
              🔄 Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnityViewer;
