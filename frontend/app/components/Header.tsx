import React from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  sticky?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  logo,
  actions,
  sticky = false,
}) => (
  <header className={`bg-white border-b border-gray-200 ${sticky ? 'sticky top-0 z-40' : ''}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {logo && <div>{logo}</div>}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  </header>
);
