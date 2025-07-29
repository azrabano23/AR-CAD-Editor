export const theme = {
  colors: {
    primary: '#00ff88',
    secondary: '#004d2a',
    accent: '#00cc70',
    background: {
      primary: '#0a0f0a',
      secondary: '#1a2e1a',
      card: 'rgba(0, 255, 136, 0.05)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.8)',
      muted: 'rgba(255, 255, 255, 0.6)',
    },
    border: 'rgba(0, 255, 136, 0.2)',
    success: '#00ff88',
    warning: '#fbbf24',
    error: '#ef4444',
  },
  gradients: {
    primary: 'linear-gradient(45deg, #00ff88, #004d2a)',
    background: 'linear-gradient(135deg, #0a0f0a 0%, #1a2e1a 100%)',
    card: 'linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(0, 255, 136, 0.02) 100%)',
  },
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    xl: '24px',
  },
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
    large: '0 8px 32px rgba(0, 0, 0, 0.2)',
    glow: '0 0 20px rgba(0, 212, 255, 0.3)',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    large: '1200px',
  },
};
