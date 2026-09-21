import React, { type ReactNode } from 'react';

export interface StatGridProps {
  children: ReactNode;
  className?: string;
}

export const StatGrid: React.FC<StatGridProps> = ({ children, className = '' }) => {
  return <div className={`grid grid-cols-2 gap-4 md:grid-cols-4 ${className}`}>{children}</div>;
};
