import React, { createContext, useContext, useState, useEffect } from 'react';

// Central theme definition file
export const themes = {
  enterprise_dark: {
    name: 'Enterprise Dark',
    variables: {
      '--theme-bg-app': '#0B0F19', // Very deep blue/black
      '--theme-bg-nav': '#111827', // Slate 900
      '--theme-bg-panel': '#1F2937', // Slate 800
      '--theme-border': '#374151', // Slate 700
      '--theme-text-main': '#F9FAFB', // Gray 50
      '--theme-text-muted': '#9CA3AF', // Gray 400
      '--theme-primary': '#4F46E5', // Indigo 600
      '--theme-primary-hover': '#4338CA', // Indigo 700
      '--theme-accent': '#06B6D4', // Cyan 500
    }
  },
  corporate_light: {
    name: 'Corporate Light',
    variables: {
      '--theme-bg-app': '#F3F4F6', // Gray 100
      '--theme-bg-nav': '#FFFFFF', // White
      '--theme-bg-panel': '#FFFFFF', // White
      '--theme-border': '#E5E7EB', // Gray 200
      '--theme-text-main': '#111827', // Gray 900
      '--theme-text-muted': '#6B7280', // Gray 500
      '--theme-primary': '#2563EB', // Blue 600
      '--theme-primary-hover': '#1D4ED8', // Blue 700
      '--theme-accent': '#0284C7', // Light Blue 600
    }
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'enterprise_dark';
  });

  useEffect(() => {
    const themeParams = themes[currentTheme]?.variables || themes.enterprise_dark.variables;
    
    // Apply variables to root style
    const root = document.documentElement;
    Object.keys(themeParams).forEach((key) => {
      root.style.setProperty(key, themeParams[key]);
    });
    
    localStorage.setItem('app-theme', currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
