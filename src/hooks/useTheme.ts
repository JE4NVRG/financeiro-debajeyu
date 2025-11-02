import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeConfig {
  theme: Theme;
  systemPreference: Theme;
  lastUpdated: string;
  autoSync: boolean;
}

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  systemPreference: Theme;
  systemTheme: 'light' | 'dark';
  autoSync: boolean;
  setAutoSync: (autoSync: boolean) => void;
}

export function useTheme(): ThemeContextType {
  // Detect system preference
  const getSystemPreference = useCallback((): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(getSystemPreference);
  
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedConfig = localStorage.getItem('theme-config');
      if (savedConfig) {
        const config: ThemeConfig = JSON.parse(savedConfig);
        return config.theme;
      }
    } catch (error) {
      console.warn('Failed to parse theme config from localStorage:', error);
    }
    return 'system';
  });

  const [autoSync, setAutoSync] = useState<boolean>(() => {
    try {
      const savedConfig = localStorage.getItem('theme-config');
      if (savedConfig) {
        const config: ThemeConfig = JSON.parse(savedConfig);
        return config.autoSync;
      }
    } catch (error) {
      console.warn('Failed to parse theme config from localStorage:', error);
    }
    return true;
  });

  // Get the actual theme to apply (resolve 'system' to light/dark)
  const getResolvedTheme = useCallback((themeValue: Theme): 'light' | 'dark' => {
    if (themeValue === 'system') {
      return getSystemPreference();
    }
    return themeValue;
  }, [getSystemPreference]);

  // Save theme configuration to localStorage
  const saveThemeConfig = useCallback((newTheme: Theme, autoSyncValue: boolean = false) => {
    const config: ThemeConfig = {
      theme: newTheme,
      systemPreference: getSystemPreference(),
      lastUpdated: new Date().toISOString(),
      autoSync: autoSyncValue
    };
    
    try {
      localStorage.setItem('theme-config', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save theme config to localStorage:', error);
    }
  }, [getSystemPreference]);

  // Apply theme to document
  const applyTheme = useCallback((resolvedTheme: 'light' | 'dark') => {
    // Remove existing theme classes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
    
    // Update CSS custom properties
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--bg-primary', '#111827');
      root.style.setProperty('--bg-secondary', '#1F2937');
      root.style.setProperty('--text-primary', '#F9FAFB');
      root.style.setProperty('--text-secondary', '#D1D5DB');
      root.style.setProperty('--border-color', '#374151');
    } else {
      root.style.setProperty('--bg-primary', '#FFFFFF');
      root.style.setProperty('--bg-secondary', '#F8FAFC');
      root.style.setProperty('--text-primary', '#1F2937');
      root.style.setProperty('--text-secondary', '#6B7280');
      root.style.setProperty('--border-color', '#E5E7EB');
    }
  }, []);

  // Set theme manually
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    const isAutoSync = newTheme === 'system';
    setAutoSync(isAutoSync);
    const resolvedTheme = getResolvedTheme(newTheme);
    applyTheme(resolvedTheme);
    saveThemeConfig(newTheme, isAutoSync);
  }, [applyTheme, saveThemeConfig, getResolvedTheme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const resolvedTheme = getResolvedTheme(theme);
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme, getResolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const newSystemPreference = e.matches ? 'dark' : 'light';
      setSystemPreference(newSystemPreference);
      
      // Auto-sync with system if theme is set to 'system'
      if (theme === 'system') {
        applyTheme(newSystemPreference);
        saveThemeConfig('system', true);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, applyTheme, saveThemeConfig]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const resolvedTheme = getResolvedTheme(theme);
    applyTheme(resolvedTheme);
  }, [theme, applyTheme, getResolvedTheme]);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.documentElement.style.setProperty('--transition-duration', '0ms');
    } else {
      document.documentElement.style.setProperty('--transition-duration', '300ms');
    }
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme,
    systemPreference,
    systemTheme: getSystemPreference(),
    autoSync,
    setAutoSync
  };
}