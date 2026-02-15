import React from 'react';
import { Input } from './Input';

interface FormGroupProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  hint,
  error,
  required = false,
  children,
  className = '',
}) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);
