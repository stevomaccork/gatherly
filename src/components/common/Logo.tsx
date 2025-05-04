import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.svg';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  return (
    <Link to="/" className={`inline-flex items-center ${className}`}>
      <img 
        src={logo} 
        alt="Gatherly" 
        className={`${sizeClasses[size]} w-auto`}
      />
    </Link>
  );
};

export default Logo; 