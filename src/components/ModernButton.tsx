import React from 'react';
import { motion } from 'framer-motion';

interface ModernButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = ''
}) => {
  const baseClasses = "relative overflow-hidden font-bold border-none cursor-pointer transition-all duration-300 ease-out transform-gpu";
  
  const variants = {
    primary: "bg-gradient-to-r from-green-500 to-green-600 text-black hover:from-green-400 hover:to-green-500 shadow-lg hover:shadow-green-500/25",
    secondary: "bg-zinc-900 text-green-500 border-2 border-green-500 hover:bg-green-500 hover:text-black shadow-lg hover:shadow-green-500/25",
    ghost: "bg-transparent text-green-500 hover:bg-green-500/10 border border-green-500/30 hover:border-green-500"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl"
  };

  return (
    <motion.button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative flex items-center justify-center gap-2">
        {loading ? (
          <motion.div
            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : icon ? (
          <motion.span
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 10 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.span>
        ) : null}
        <span>{children}</span>
      </div>
    </motion.button>
  );
};

export default ModernButton;
