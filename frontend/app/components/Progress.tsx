import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const variantColors = {
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'primary',
  showLabel = true,
  animated = true,
  className = '',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        {showLabel && <span className="text-sm font-medium text-gray-700">{percentage.toFixed(0)}%</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${variantColors[variant]} ${animated ? 'transition-all duration-500' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
