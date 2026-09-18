import React from 'react';

interface AuthoredBandProps {
  compact?: boolean;
  className?: string;
}

export const AuthoredBand: React.FC<AuthoredBandProps> = ({ compact = false, className = '' }) => {
  // Canonical sequence: brick, deep ink, ochre gold, brick, deep ink
  const height = compact ? 'h-[7px]' : 'h-[12px]';
  const gap = compact ? 'gap-[4px]' : 'gap-[5px]';

  return (
    <div 
      aria-hidden="true" 
      className={`w-full flex items-center justify-center ${gap} ${className}`}
    >
      <div className={`${height} flex-1 max-w-[90px] rounded-xs bg-sadu-brick`}></div>
      <div className={`${height} w-[14px] rounded-xs bg-sadu-ink`}></div>
      <div className={`${height} flex-2 max-w-[160px] rounded-xs bg-sadu-gold`}></div>
      <div className={`${height} w-[14px] rounded-xs bg-sadu-brick`}></div>
      <div className={`${height} flex-1 max-w-[90px] rounded-xs bg-sadu-ink`}></div>
    </div>
  );
};
