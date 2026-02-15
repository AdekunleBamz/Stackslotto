import React from 'react';
import { Badge } from './Badge';

interface BadgeGroupProps {
  items: Array<{ label: string; variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' }>;
  onRemove?: (index: number) => void;
  className?: string;
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({
  items,
  onRemove,
  className = '',
}) => (
  <div className={`flex flex-wrap gap-2 ${className}`}>
    {items.map((item, index) => (
      <div key={index} className="relative group">
        <Badge label={item.label} variant={item.variant} />
        {onRemove && (
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
          >
            ✕
          </button>
        )}
      </div>
    ))}
  </div>
);
