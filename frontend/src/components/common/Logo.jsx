import React from 'react';
import logoImage from '../../assets/LOGO LIGHT MODE NO BG.png';
import './Logo.css';

const Logo = ({ className = '', size = 'medium', showText = true }) => {
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large',
    xlarge: 'logo-xlarge'
  };

  return (
    <div className={`logo-container ${sizeClasses[size]} ${className}`}>
      <img 
        src={logoImage} 
        alt="EcoTrace Logo" 
        className="logo-image"
      />
      {showText && <span className="logo-text">EcoTrace</span>}
    </div>
  );
};

export default Logo;
