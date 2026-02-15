import React from 'react';

interface FooterProps {
  companyName?: string;
  links?: Array<{ label: string; href: string }>;
  socials?: Array<{ icon: React.ReactNode; href: string }>;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  companyName = 'StacksLotto',
  links = [],
  socials = [],
  className = '',
}) => (
  <footer className={`bg-gray-900 text-white py-8 mt-12 ${className}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <h3 className="font-bold text-lg mb-4">{companyName}</h3>
          <p className="text-gray-400 text-sm">Decentralized lottery on Stacks</p>
        </div>
        {links.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">Links</h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-gray-400 hover:text-white text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {socials.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">Follow</h4>
            <div className="flex gap-4">
              {socials.map((social, i) => (
                <a key={i} href={social.href} className="text-gray-400 hover:text-white">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-gray-800 pt-8 flex justify-between items-center">
        <p className="text-gray-400 text-sm">&copy; 2026 {companyName}. All rights reserved.</p>
      </div>
    </div>
  </footer>
);
