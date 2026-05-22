import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page p-4">
      <div className="w-full max-w-[440px]">
        {children}
      </div>
    </div>
  );
};
