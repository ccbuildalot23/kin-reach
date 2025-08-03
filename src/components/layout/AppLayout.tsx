import React, { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from '@/components/navigation/BottomNavigation';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Don't show bottom navigation on auth page
  const showBottomNav = location.pathname !== '/auth';
  
  return (
    <div className="min-h-screen bg-background">
      <main className={showBottomNav ? 'pb-16' : ''}>
        {children}
      </main>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;