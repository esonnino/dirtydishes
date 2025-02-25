import React from 'react';

interface SparkleIconProps {
  className?: string;
}

export const SparkleIcon: React.FC<SparkleIconProps> = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="#2563eb" // Brighter blue color
      className={className}
      width="16"
      height="16"
    >
      <path d="M12 1L9.5 8.5L2 11L9.5 13.5L12 21L14.5 13.5L22 11L14.5 8.5L12 1Z" />
      <path d="M5 14.5L4 19L7 17L10 19L8.5 14.5" opacity="0.6" />
      <path d="M19 14.5L20 19L17 17L14 19L15.5 14.5" opacity="0.6" />
    </svg>
  );
}; 