import React, { type ReactNode } from 'react';

export interface PanelProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  as?: 'div' | 'section' | 'article';
}

export const Panel: React.FC<PanelProps> = ({
  children,
  className = '',
  padded = true,
  as: Component = 'div',
}) => {
  return (
    <Component
      className={[
        'sadu-ui rounded-xl border border-sadu-gold bg-sadu-paper text-sadu-charcoal shadow-sm text-start',
        padded ? 'p-4 sm:p-5' : '',
        className,
      ].join(' ')}
    >
      {children}
    </Component>
  );
};
