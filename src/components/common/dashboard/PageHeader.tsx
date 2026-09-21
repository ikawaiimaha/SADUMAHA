import React, { type ReactNode } from 'react';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow,
  actions,
  className = '',
}) => {
  return (
    <header className={`sadu-ui rounded-xl border border-sadu-gold bg-sadu-linen p-5 sm:p-6 text-start ${className}`}>
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sadu-brick leading-[1.7] text-start">
          {eyebrow}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 text-start">
          <h1 className="text-2xl font-bold tracking-tight text-sadu-charcoal leading-[1.35] text-start">
            {title}
          </h1>
          {description && <p className="text-sm text-sadu-muted leading-[1.8] text-start">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 text-start">{actions}</div>}
      </div>
    </header>
  );
};
