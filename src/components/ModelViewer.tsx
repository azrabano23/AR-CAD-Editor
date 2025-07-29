import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Box, Eye } from 'lucide-react';

interface ModelViewerProps {
  modelUrl: string | null;
}

const ViewerContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
`;

const PlaceholderIcon = styled(Box)`
  color: rgba(255, 255, 255, 0.3);
  margin-bottom: 16px;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.1));
`;

const PlaceholderTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
`;

const PlaceholderText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  max-width: 300px;
`;

const ModelFrame = styled.iframe`
  width: 100%;
  height: 400px;
  border: none;
  border-radius: 12px;
  background: #000;
`;

const ViewerHeader = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: between;
  z-index: 10;
`;

const ViewerTitle = styled.h4`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  border-radius: 8px;
`;

const ModelViewer: React.FC<ModelViewerProps> = ({ modelUrl }) => {
  if (!modelUrl) {
    return (
      <ViewerContainer
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <PlaceholderContainer>
          <PlaceholderIcon size={64} />
          <PlaceholderTitle>No Model Selected</PlaceholderTitle>
          <PlaceholderText>
            Upload and convert a 3D model to preview it here. Supported formats: STL, OBJ, PLY
          </PlaceholderText>
        </PlaceholderContainer>
      </ViewerContainer>
    );
  }

  return (
    <ViewerContainer
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ViewerHeader>
        <ViewerTitle>
          <Eye size={16} />
          3D Model Preview
        </ViewerTitle>
      </ViewerHeader>
      
      {/* Simple 3D model display - in a real implementation, you'd use Three.js or similar */}
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(45deg, #1a1a2e, #16213e)',
        borderRadius: '12px',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div>
          <Box size={48} style={{ marginBottom: '16px', color: '#00d4ff' }} />
          <h3>3D Model Loaded</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
            GLB format ready for web and AR deployment
          </p>
        </div>
      </div>
    </ViewerContainer>
  );
};

export default ModelViewer;
