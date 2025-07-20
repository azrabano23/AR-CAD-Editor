import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="animated-background">
      {/* Static background elements */}
      <div className="floating-shapes">
        <div 
          className="floating-shape"
          style={{
            position: 'absolute',
            left: '10%',
            top: '20%',
            width: '300px',
            height: '300px',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(16,185,129,0.04))',
            borderRadius: '50%',
            border: '1px solid rgba(34, 197, 94, 0.1)',
          }}
        />
        <div 
          className="floating-shape"
          style={{
            position: 'absolute',
            right: '15%',
            top: '40%',
            width: '200px',
            height: '200px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.03))',
            borderRadius: '50%',
            border: '1px solid rgba(16, 185, 129, 0.08)',
          }}
        />
        <div 
          className="floating-shape"
          style={{
            position: 'absolute',
            left: '60%',
            bottom: '30%',
            width: '150px',
            height: '150px',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(22,163,74,0.02))',
            borderRadius: '12px',
            border: '1px solid rgba(34, 197, 94, 0.06)',
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedBackground;
