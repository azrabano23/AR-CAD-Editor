import React from 'react';
import { motion } from 'framer-motion';
import { File, CheckCircle, AlertCircle, Clock, Loader, Eye, Smartphone } from 'lucide-react';
import ModernButton from './ModernButton';

interface FileData {
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  originalFormat: string;
  convertedUrl?: string;
  errorMessage?: string;
}

interface ModernFileCardProps {
  file: FileData;
  onViewWebGL: () => void;
  onDeployAR: () => void;
}

const ModernFileCard: React.FC<ModernFileCardProps> = ({
  file,
  onViewWebGL,
  onDeployAR
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusConfig = () => {
    switch (file.status) {
      case 'uploading':
        return {
          icon: <Loader className="w-6 h-6 animate-spin" />,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'Uploading & Converting...'
        };
      case 'processing':
        return {
          icon: <Clock className="w-6 h-6 animate-pulse" />,
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'Processing for AR...'
        };
      case 'ready':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          border: 'border-green-500/30',
          text: 'Ready for AR'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'Error occurred'
        };
      default:
        return {
          icon: <File className="w-6 h-6" />,
          color: 'text-zinc-400',
          bg: 'bg-zinc-500/10',
          border: 'border-zinc-500/30',
          text: 'Unknown status'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <motion.div
      className={`
        relative overflow-hidden bg-zinc-900/80 backdrop-blur-sm
        border rounded-2xl p-6 transition-all duration-300
        ${statusConfig.border} hover:border-green-500/50
        hover:shadow-lg hover:shadow-green-500/10
      `}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 ${statusConfig.bg} opacity-30`} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className={`${statusConfig.color}`}
              animate={{ rotate: file.status === 'processing' ? 360 : 0 }}
              transition={{ duration: 2, repeat: file.status === 'processing' ? Infinity : 0 }}
            >
              {statusConfig.icon}
            </motion.div>
            <div>
              <h3 className="font-bold text-white text-lg truncate max-w-48">
                {file.name}
              </h3>
              <p className="text-zinc-400 text-sm">
                {formatFileSize(file.size)} • {file.originalFormat.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4">
          <motion.div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} ${statusConfig.bg}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {statusConfig.text}
          </motion.div>
          
          {file.errorMessage && (
            <motion.p
              className="text-red-400 text-sm mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {file.errorMessage}
            </motion.p>
          )}
        </div>

        {/* Progress bar for processing */}
        {(file.status === 'processing' || file.status === 'uploading') && (
          <motion.div
            className="mb-4 w-full h-2 bg-zinc-800 rounded-full overflow-hidden"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {file.status === 'ready' && (
            <>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={onViewWebGL}
                icon={<Eye className="w-4 h-4" />}
                className="flex-1 min-w-0"
              >
                WebGL View
              </ModernButton>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={onDeployAR}
                icon={<Smartphone className="w-4 h-4" />}
                className="flex-1 min-w-0"
              >
                Deploy to AR
              </ModernButton>
            </>
          )}
        </div>
      </div>

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default ModernFileCard;
