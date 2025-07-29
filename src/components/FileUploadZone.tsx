import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Upload, FileIcon } from 'lucide-react';

interface FileUploadZoneProps {
  onFilesUpload: (files: File[]) => void;
}

const UploadZone = styled(motion.div)<{ isDragActive: boolean }>`
  border: 2px dashed ${props => props.isDragActive ? '#00d4ff' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  background: ${props => props.isDragActive ? 
    'rgba(0, 212, 255, 0.1)' : 
    'rgba(255, 255, 255, 0.05)'};
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #00d4ff;
    background: rgba(0, 212, 255, 0.05);
  }
`;

const UploadIcon = styled(Upload)`
  margin: 0 auto 16px;
  color: ${props => props.color || '#00d4ff'};
  filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.3));
`;

const UploadText = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
`;

const UploadSubtext = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
`;

const SupportedFormats = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

const FormatTag = styled.span`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
`;

const HiddenInput = styled.input`
  display: none;
`;

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFilesUpload }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const supportedFormats = ['STL', 'OBJ', 'PLY'];

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesUpload(files);
    }
  }, [onFilesUpload]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesUpload(files);
    }
  }, [onFilesUpload]);

  return (
    <UploadZone
      isDragActive={isDragActive}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <UploadIcon size={48} />
      <UploadText>
        {isDragActive ? 'Drop files here' : 'Upload 3D Models'}
      </UploadText>
      <UploadSubtext>
        Drag and drop your files here, or click to browse
      </UploadSubtext>
      
      <SupportedFormats>
        {supportedFormats.map((format) => (
          <FormatTag key={format}>{format}</FormatTag>
        ))}
      </SupportedFormats>

      <HiddenInput
        ref={inputRef}
        type="file"
        multiple
        accept=".stl,.obj,.ply"
        onChange={handleFileInput}
      />
    </UploadZone>
  );
};

export default FileUploadZone;
