import React from 'react';

interface DividerProps {
  text?: string;
  variant?: 'solid' | 'dashed' | 'dotted';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  text,
  variant = 'solid',
  className = '',
}) => {
  const variantClass = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  }[variant];

  if (text) {
    return (
      <div className={`flex items-center gap-4 my-6 ${className}`}>
        <div className={`flex-1 border-t border-gray-300 ${variantClass}`} />
        <span className="text-gray-500 text-sm">{text}</span>
        <div className={`flex-1 border-t border-gray-300 ${variantClass}`} />
      </div>
    );
  }

  return (
    <div className={`border-t border-gray-300 my-6 ${variantClass} ${className}`} />
  );
};
