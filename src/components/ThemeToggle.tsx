import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ 
  variant = 'button', 
  size = 'md', 
  showLabel = false,
  className = '' 
}: ThemeToggleProps) {
  const { theme, setTheme, systemTheme } = useTheme();

  // Size configurations
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  // Theme options
  const themeOptions = [
    { 
      value: 'light' as const, 
      label: 'Claro', 
      icon: Sun,
      description: 'Tema claro'
    },
    { 
      value: 'dark' as const, 
      label: 'Escuro', 
      icon: Moon,
      description: 'Tema escuro'
    },
    { 
      value: 'system' as const, 
      label: 'Sistema', 
      icon: Monitor,
      description: 'Seguir configuração do sistema'
    }
  ];

  // Get current theme info
  const currentTheme = themeOptions.find(option => option.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  // Button variant
  if (variant === 'button') {
    const handleToggle = () => {
      const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
      setTheme(nextTheme);
    };

    return (
      <button
        onClick={handleToggle}
        className={`
          ${sizeClasses[size]}
          relative inline-flex items-center justify-center
          rounded-lg border border-border-color
          bg-bg-secondary hover:bg-bg-primary
          text-text-primary hover:text-text-secondary
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          active:scale-95
          ${className}
        `}
        title={`Tema atual: ${currentTheme?.label} (${systemTheme === 'dark' ? 'Sistema: Escuro' : 'Sistema: Claro'})`}
        aria-label={`Alternar tema. Tema atual: ${currentTheme?.label}`}
      >
        <CurrentIcon 
          size={iconSizes[size]} 
          className="transition-transform duration-200 ease-in-out hover:rotate-12"
        />
        {showLabel && (
          <span className="ml-2 text-sm font-medium">
            {currentTheme?.label}
          </span>
        )}
      </button>
    );
  }

  // Switch variant
  if (variant === 'switch') {
    const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
    
    const handleToggle = () => {
      setTheme(isDark ? 'light' : 'dark');
    };

    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-text-primary">
            Tema escuro
          </span>
        )}
        <button
          onClick={handleToggle}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            ${isDark ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}
          `}
          role="switch"
          aria-checked={isDark}
          aria-label="Alternar tema escuro"
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white
              transition-transform duration-200 ease-in-out
              flex items-center justify-center
              ${isDark ? 'translate-x-6' : 'translate-x-1'}
            `}
          >
            {isDark ? (
              <Moon size={10} className="text-primary-600" />
            ) : (
              <Sun size={10} className="text-yellow-500" />
            )}
          </span>
        </button>
      </div>
    );
  }

  // Dropdown variant
  if (variant === 'dropdown') {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ${sizeClasses[size]}
            relative inline-flex items-center justify-center
            rounded-lg border border-border-color
            bg-bg-secondary hover:bg-bg-primary
            text-text-primary hover:text-text-secondary
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          `}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Selecionar tema"
        >
          <CurrentIcon size={iconSizes[size]} />
          {showLabel && (
            <span className="ml-2 text-sm font-medium">
              {currentTheme?.label}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown menu */}
            <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-lg border border-border-color bg-bg-primary shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;
                  
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center px-4 py-2 text-sm
                        transition-colors duration-150 ease-in-out
                        ${isSelected 
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                          : 'text-text-primary hover:bg-bg-secondary'
                        }
                      `}
                    >
                      <Icon size={16} className="mr-3" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-text-secondary">
                          {option.description}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-primary-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}