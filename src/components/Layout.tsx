import React from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Header onLogout={onLogout} />
        <main className="pt-16 p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
