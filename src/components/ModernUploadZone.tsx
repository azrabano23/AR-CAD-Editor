import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';

interface ModernUploadZoneProps {
  onDrop: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  supportedFormats?: string[];
  disabled?: boolean;
}

const ModernUploadZone: React.FC<ModernUploadZoneProps> = ({
  onDrop,
  accept = "",
  multiple = true,
  maxSize = 50 * 1024 * 1024, // 50MB
  supportedFormats = ['stl', 'step', 'obj', 'ply', 'dae'],
  disabled = false
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = e.dataTransfer.files;
      validateAndUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndUpload(e.target.files);
    }
  };

  const validateAndUpload = (files: FileList) => {
    let hasErrors = false;
    
    Array.from(files).forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (!extension || !supportedFormats.includes(extension)) {
        setUploadStatus('error');
        hasErrors = true;
        return;
      }
      
      if (file.size > maxSize) {
        setUploadStatus('error');
        hasErrors = true;
        return;
      }
    });

    if (!hasErrors) {
      setUploadStatus('success');
      onDrop(files);
      setTimeout(() => setUploadStatus('idle'), 2000);
    } else {
      setTimeout(() => setUploadStatus('idle'), 3000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Upload className="w-8 h-8 text-green-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'success':
        return 'Files uploaded successfully!';
      case 'error':
        return 'Upload failed. Check file format and size.';
      default:
        return 'Drop CAD files here or click to browse';
    }
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-300 ease-out
        ${isDragActive ? 'border-green-400 bg-green-500/10' : 'border-green-500 bg-zinc-900/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-400 hover:bg-green-500/5'}
        ${uploadStatus === 'success' ? 'border-green-400 bg-green-500/10' : ''}
        ${uploadStatus === 'error' ? 'border-red-500 bg-red-500/10' : ''}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"
        animate={{
          opacity: isDragActive ? 1 : 0,
          scale: isDragActive ? 1 : 0.8,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Floating particles */}
      <AnimatePresence>
        {isDragActive && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-green-500 rounded-full"
                initial={{
                  opacity: 0,
                  x: Math.random() * 400,
                  y: Math.random() * 200,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [0, -30, -60],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Icon */}
        <motion.div
          className="flex justify-center mb-6"
          animate={{ 
            y: isDragActive ? -10 : 0,
            rotate: isDragActive ? 10 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {getStatusIcon()}
        </motion.div>

        {/* Title */}
        <motion.h3
          className="text-xl font-bold mb-2 text-white"
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
        >
          {getStatusMessage()}
        </motion.h3>

        {/* Supported formats */}
        <p className="text-zinc-400 mb-2">
          Supported formats: {supportedFormats.join(', ').toUpperCase()}
        </p>

        {/* Max file size */}
        <p className="text-zinc-500 text-sm">
          Maximum file size: {formatFileSize(maxSize)}
        </p>

        {/* Progress indicator */}
        <AnimatePresence>
          {uploadStatus === 'success' && (
            <motion.div
              className="mt-4 w-full h-1 bg-zinc-800 rounded-full overflow-hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-green-400"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </motion.div>
  );
};

export default ModernUploadZone;
