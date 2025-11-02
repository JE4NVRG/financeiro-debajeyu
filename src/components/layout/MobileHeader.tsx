import React from 'react';
import { Menu, X, Building2 } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface MobileHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export function MobileHeader({ onMenuClick, isSidebarOpen }: MobileHeaderProps) {
  const { user, userProfile } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-bg-primary border-b border-border-color shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left Section - Menu Button & Logo */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-bg-secondary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isSidebarOpen ? (
              <X size={20} className="text-text-primary" />
            ) : (
              <Menu size={20} className="text-text-primary" />
            )}
          </button>

          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary-600" />
            <div>
              <h1 className="text-lg font-bold text-text-primary">Financeiro</h1>
            </div>
          </div>
        </div>

        {/* Right Section - Theme Toggle & User Avatar */}
        <div className="flex items-center space-x-3">
          <ThemeToggle variant="button" size="sm" />
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="bg-primary-100 text-primary-700 text-sm">
              {userProfile?.full_name ? getInitials(userProfile.full_name) : 
               user?.login ? getInitials(user.login) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}