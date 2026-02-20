import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

/**
 * Skeleton loader for displaying loading states
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  circle = false,
  className = '',
}) => {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`animate-pulse bg-gray-200 ${
        circle ? 'rounded-full' : 'rounded-md'
      } ${className}`}
      style={style}
    />
  );
};

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/**
 * Skeleton text placeholder
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
};

interface SkeletonCardProps {
  className?: string;
}

/**
 * Card skeleton for content previews
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow p-4 space-y-4 ${className}`}>
      <Skeleton height="24px" width="60%" />
      <SkeletonText lines={2} />
      <div className="flex gap-2 pt-2">
        <Skeleton height="32px" width="80px" />
        <Skeleton height="32px" width="80px" />
      </div>
    </div>
  );
};

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Avatar skeleton
 */
export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: '32px',
    md: '48px',
    lg: '64px',
  };

  return (
    <Skeleton
      circle
      width={sizeMap[size]}
      height={sizeMap[size]}
      className={className}
    />
  );
};

interface SkeletonGridProps {
  columns?: 1 | 2 | 3 | 4;
  count?: number;
  className?: string;
}

/**
 * Grid skeleton for multiple items
 */
export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
  columns = 3,
  count = 6,
  className = '',
}) => {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${colClass} gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
