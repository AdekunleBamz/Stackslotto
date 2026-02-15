import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  className?: string;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

export const Container: React.FC<LayoutProps> = ({
  children,
  maxWidth = 'lg',
  padding = true,
  className = '',
}) => (
  <div className={`mx-auto ${maxWidthMap[maxWidth]} ${
    padding ? 'px-4' : ''
  } ${className}`}>
    {children}
  </div>
);

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  children,
  title,
  subtitle,
  className = '',
}) => (
  <section className={`py-8 sm:py-12 ${className}`}>
    {(title || subtitle) && (
      <div className="mb-8">
        {title && <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>}
        {subtitle && <p className="text-gray-600">{subtitle}</p>}
      </div>
    )}
    {children}
  </section>
);
