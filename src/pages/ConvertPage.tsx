import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Upload, Download, FileIcon, CheckCircle, XCircle, Loader } from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import ModelViewer from '../components/ModelViewer';

interface ConvertedFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  status: 'uploading' | 'converting' | 'ready' | 'error';
  url?: string;
  blob?: Blob;
  errorMessage?: string;
}

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 80px 20px 40px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #00d4ff, #090979);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 600px;
  margin: 0 auto;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FileCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
`;

const FileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FileName = styled.h3`
  font-size: 1.1rem;
  color: #fff;
  margin: 0;
`;

const FileSize = styled.span`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
`;

const StatusBadge = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'ready':
        return `
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        `;
      case 'converting':
        return `
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        `;
      case 'error':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
      default:
        return `
          background: rgba(156, 163, 175, 0.2);
          color: #9ca3af;
          border: 1px solid rgba(156, 163, 175, 0.3);
        `;
    }
  }}
`;

const DownloadButton = styled(motion.button)`
  background: linear-gradient(45deg, #00d4ff, #090979);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ConvertPage = () => {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (uploadedFiles: File[]) => {
    const newFiles: ConvertedFile[] = uploadedFiles.map(file => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      originalName: file.name,
      size: file.size,
      status: 'uploading'
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Process each file
    for (const fileData of newFiles) {
      const originalFile = uploadedFiles.find(f => f.name === fileData.originalName);
      if (!originalFile) continue;

      try {
        // Update status to converting
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'converting' as const }
            : f
        ));

        const formData = new FormData();
        formData.append('file', originalFile);

        const response = await fetch('/convert', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { 
                ...f, 
                status: 'ready' as const,
                blob,
                url,
                name: fileData.originalName.replace(/\.[^/.]+$/, '.glb')
              }
            : f
        ));

        // Set as selected model if it's the first successful conversion
        if (!selectedModel) {
          setSelectedModel(url);
        }

      } catch (error) {
        console.error('Conversion failed:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { 
                ...f, 
                status: 'error' as const,
                errorMessage: error instanceof Error ? error.message : 'Conversion failed'
              }
            : f
        ));
      }
    }
  }, [selectedModel]);

  const handleDownload = (file: ConvertedFile) => {
    if (file.blob) {
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle size={16} />;
      case 'converting':
        return <Loader size={16} className="animate-spin" />;
      case 'error':
        return <XCircle size={16} />;
      default:
        return <FileIcon size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'converting':
        return 'Converting...';
      case 'error':
        return 'Error';
      default:
        return 'Uploading...';
    }
  };

  return (
    <PageContainer>
      <Header>
        <Title>STL to GLB Converter</Title>
        <Subtitle>
          Upload your STL files and convert them to GLB format for web and AR applications
        </Subtitle>
      </Header>

      <MainContent>
        <LeftPanel>
          <FileUploadZone onFilesUpload={handleFileUpload} />
          
          <FileList>
            {files.map((file) => (
              <FileCard
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <FileHeader>
                  <FileInfo>
                    <FileIcon size={20} />
                    <div>
                      <FileName>{file.name}</FileName>
                      <FileSize>{(file.size / 1024 / 1024).toFixed(2)} MB</FileSize>
                    </div>
                  </FileInfo>
                  
                  <StatusBadge status={file.status}>
                    {getStatusIcon(file.status)}
                    {getStatusText(file.status)}
                  </StatusBadge>
                </FileHeader>

                {file.status === 'ready' && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <DownloadButton
                      onClick={() => handleDownload(file)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Download size={16} />
                      Download GLB
                    </DownloadButton>
                    
                    <DownloadButton
                      onClick={() => setSelectedModel(file.url || null)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                    >
                      View 3D Model
                    </DownloadButton>
                  </div>
                )}

                {file.status === 'error' && file.errorMessage && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '0.9rem'
                  }}>
                    {file.errorMessage}
                  </div>
                )}
              </FileCard>
            ))}
          </FileList>
        </LeftPanel>

        <RightPanel>
          <ModelViewer modelUrl={selectedModel} />
        </RightPanel>
      </MainContent>
    </PageContainer>
  );
};

export default ConvertPage;
