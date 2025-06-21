import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {currentUser && <Sidebar />}
        <main className={`flex-1 ${currentUser ? 'ml-64' : ''} mt-16 p-6`}>
          {children}
        </main>
      </div>
    </div>
  );
}