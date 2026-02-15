import React, { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className={className}>
      <label className="flex items-center gap-3 cursor-pointer">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="w-5 h-5 opacity-0 cursor-pointer"
            {...props}
          />
          <div className={`absolute top-0 left-0 w-5 h-5 border-2 rounded ${
            props.checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
          }`}>
            {props.checked && <Check size={16} className="text-white absolute top-0.5 left-0.5" />}
          </div>
        </div>
        {label && <span className="text-gray-700">{label}</span>}
      </label>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
);

Checkbox.displayName = 'Checkbox';
