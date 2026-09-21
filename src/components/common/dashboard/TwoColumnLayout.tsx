import React, { type ReactNode } from 'react';

export interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftClassName?: string;
  rightClassName?: string;
  leftSpan?: string;
  rightSpan?: string;
  gap?: string;
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  left,
  right,
  leftClassName = '',
  rightClassName = '',
  leftSpan = 'lg:col-span-2',
  rightSpan = '',
  gap = 'gap-6',
}) => {
  return (
    <div className={`sadu-ui grid ${gap} lg:grid-cols-3 text-start`}>
      <div className={`min-w-0 ${leftSpan} ${leftClassName} text-start`}>{left}</div>
      <div className={`min-w-0 ${rightSpan} ${rightClassName} text-start`}>{right}</div>
    </div>
  );
};
