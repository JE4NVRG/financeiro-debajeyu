import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const { theme } = useTheme();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={`flex h-screen bg-bg-primary transition-colors duration-200 ${theme}`}>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader 
          onMenuClick={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
      )}

      {/* Sidebar Overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        ${isMobile ? 'z-50' : 'z-10'}
        transition-transform duration-300 ease-in-out
      `}>
        <Sidebar 
          isMobile={isMobile}
          isTablet={isTablet}
          onClose={closeSidebar}
        />
      </div>

      {/* Main Content */}
      <main className={`
        flex-1 overflow-auto
        ${isMobile ? 'pt-16' : ''}
        transition-all duration-300 ease-in-out
      `}>
        <div className={`
          ${isMobile ? 'p-4' : isTablet ? 'p-5' : 'p-6'}
          min-h-full
        `}>
          {children}
        </div>
      </main>
    </div>
  )
}