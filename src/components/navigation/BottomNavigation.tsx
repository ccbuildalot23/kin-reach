import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, AlertCircle, Heart, Users, Settings, Sparkles } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Home',
      activeColor: 'text-purple-600',
      bgGradient: 'from-purple-400 to-pink-500'
    },
    {
      path: '/crisis-alert',
      icon: AlertCircle,
      label: 'Help Now',
      activeColor: 'text-red-600',
      bgGradient: 'from-red-400 to-pink-500'
    },
    {
      path: '/peace-library',
      icon: Heart,
      label: 'Peace',
      activeColor: 'text-purple-600',
      bgGradient: 'from-purple-400 to-purple-600'
    },
    {
      path: '/support-team',
      icon: Users,
      label: 'Support',
      activeColor: 'text-blue-600',
      bgGradient: 'from-blue-400 to-purple-500'
    },
    {
      path: '/settings',
      icon: Sparkles,
      label: 'Recovery',
      activeColor: 'text-purple-600',
      bgGradient: 'from-purple-400 to-pink-500'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path === '/settings' && location.pathname.startsWith('/settings')) ||
                          (item.path === '/peace-library' && location.pathname === '/sounds') ||
                          (item.path === '/support-team' && location.pathname === '/contacts');
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 relative
                ${isActive ? 'text-current' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {isActive && (
                <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r ${item.bgGradient} rounded-b-full`} />
              )}
              <Icon 
                className={`w-5 h-5 ${isActive ? item.activeColor : ''}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs font-medium ${isActive ? item.activeColor : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;