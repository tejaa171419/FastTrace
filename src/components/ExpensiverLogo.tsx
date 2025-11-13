import React from 'react';

interface ExpensiverLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
}

const ExpensiverLogo = ({ 
  size = 'md',
  onClick,
  className = ''
}: ExpensiverLogoProps) => {
  // Simple size configuration - width x height (rectangular for better logo display)
  const sizeClasses = {
    sm: 'h-8 w-auto',     // Small - 40px height
    md: 'h-10 w-auto',     // Medium - 56px height
    lg: 'h-[50px] w-auto',     // Large - 100px height
    xl: 'h-22 w-auto'      // Extra Large - 112px height
  };

  return (
    <div 
      className={`inline-flex items-center justify-center p-0 m-0 ${onClick ? 'cursor-pointer hover:opacity-80' : ''} transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      <img 
        src="/logo1.png" 
        alt="FastTrans Logo" 
        className={`${sizeClasses[size]} object-contain p-0 m-0`}
      />
    </div>
  );
};

// Compact logo variant (same as main, for backward compatibility)
export const ExpensiverCompactLogo = ({ 
  size = 'md',
  onClick,
  className = ''
}: ExpensiverLogoProps) => {
  return <ExpensiverLogo size={size} onClick={onClick} className={className} />;
};

export default ExpensiverLogo;
