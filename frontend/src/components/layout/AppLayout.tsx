import React from 'react';
import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { FrapButton } from './FrapButton';

export const AppLayout: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-bg-page text-text-primary-light">
    <Navbar />
    <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    <FrapButton />
  </div>
);
