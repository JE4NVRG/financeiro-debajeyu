import { useState, useEffect, useCallback } from 'react';

// Breakpoint Configuration
interface BreakpointConfig {
  mobile: {
    min: 320;
    max: 767;
  };
  tablet: {
    min: 768;
    max: 1023;
  };
  desktop: {
    min: 1024;
    max: number;
  };
}

// Responsive State
interface ResponsiveState {
  currentBreakpoint: keyof BreakpointConfig;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
}

export interface ResponsiveHook {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'mobile' | 'tablet' | 'desktop';
  breakpoint: number;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
}

const BREAKPOINTS: BreakpointConfig = {
  mobile: { min: 320, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: Infinity }
};

export function useResponsive(): ResponsiveHook {
  // Get current screen dimensions
  const getScreenDimensions = useCallback(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }, []);

  // Determine current breakpoint
  const getCurrentBreakpoint = useCallback((width: number): keyof BreakpointConfig => {
    if (width >= BREAKPOINTS.desktop.min) return 'desktop';
    if (width >= BREAKPOINTS.tablet.min) return 'tablet';
    return 'mobile';
  }, []);

  // Get orientation
  const getOrientation = useCallback((width: number, height: number): 'portrait' | 'landscape' => {
    return width > height ? 'landscape' : 'portrait';
  }, []);

  // Initialize state
  const [responsiveState, setResponsiveState] = useState<ResponsiveState>(() => {
    const { width, height } = getScreenDimensions();
    return {
      currentBreakpoint: getCurrentBreakpoint(width),
      screenWidth: width,
      screenHeight: height,
      orientation: getOrientation(width, height)
    };
  });

  // Debounced resize handler
  const handleResize = useCallback(() => {
    const { width, height } = getScreenDimensions();
    const newBreakpoint = getCurrentBreakpoint(width);
    const newOrientation = getOrientation(width, height);

    setResponsiveState(prevState => {
      // Only update if something actually changed
      if (
        prevState.screenWidth !== width ||
        prevState.screenHeight !== height ||
        prevState.currentBreakpoint !== newBreakpoint ||
        prevState.orientation !== newOrientation
      ) {
        return {
          currentBreakpoint: newBreakpoint,
          screenWidth: width,
          screenHeight: height,
          orientation: newOrientation
        };
      }
      return prevState;
    });
  }, [getScreenDimensions, getCurrentBreakpoint, getOrientation]);

  // Set up resize listener with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedHandleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150); // 150ms debounce
    };

    window.addEventListener('resize', debouncedHandleResize);
    window.addEventListener('orientationchange', debouncedHandleResize);

    // Initial call to set correct state
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      window.removeEventListener('orientationchange', debouncedHandleResize);
      clearTimeout(timeoutId);
    };
  }, [handleResize]);

  // Derived values
  const isMobile = responsiveState.currentBreakpoint === 'mobile';
  const isTablet = responsiveState.currentBreakpoint === 'tablet';
  const isDesktop = responsiveState.currentBreakpoint === 'desktop';

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenSize: responsiveState.currentBreakpoint,
    breakpoint: responsiveState.screenWidth,
    orientation: responsiveState.orientation,
    screenWidth: responsiveState.screenWidth,
    screenHeight: responsiveState.screenHeight
  };
}

// Utility hook for specific breakpoint checks
export function useBreakpoint(breakpoint: keyof BreakpointConfig): boolean {
  const { screenSize } = useResponsive();
  return screenSize === breakpoint;
}

// Utility hook for minimum width checks
export function useMinWidth(minWidth: number): boolean {
  const { screenWidth } = useResponsive();
  return screenWidth >= minWidth;
}

// Utility hook for maximum width checks
export function useMaxWidth(maxWidth: number): boolean {
  const { screenWidth } = useResponsive();
  return screenWidth <= maxWidth;
}