import React, { InputHTMLAttributes } from 'react';

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className, ...props }, ref) => (
    <label className={`flex items-center gap-3 cursor-pointer ${className || ''}`}>
      <div className="relative">
        <input
          ref={ref}
          type="radio"
          className="w-5 h-5 opacity-0 cursor-pointer"
          {...props}
        />
        <div className={`absolute top-0 left-0 w-5 h-5 border-2 rounded-full ${
          props.checked ? 'border-blue-600' : 'border-gray-300'
        }`}>
          {props.checked && (
            <div className="absolute top-1 left-1 w-3 h-3 bg-blue-600 rounded-full" />
          )}
        </div>
      </div>
      {label && <span className="text-gray-700">{label}</span>}
    </label>
  )
);

Radio.displayName = 'Radio';
