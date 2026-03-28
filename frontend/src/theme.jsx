import React, { createContext, useContext, useState, useEffect } from 'react';

// Central theme definition file
export const themes = {
  antigravity: {
    name: 'Antigravity (Dark)',
    variables: {
      '--theme-bg-app': '#030014',
      '--theme-bg-nav': '#090324',
      '--theme-bg-panel': '#110934',
      '--theme-border': '#2d1b6e',
      '--theme-text-main': '#ffffff',
      '--theme-text-muted': '#a78bfa',
      '--theme-primary': '#8b5cf6',
      '--theme-primary-hover': '#7c3aed',
    }
  },
  standard: {
    name: 'Standard Dark',
    variables: {
      '--theme-bg-app': '#020617',
      '--theme-bg-nav': '#0f172a',
      '--theme-bg-panel': '#1e293b',
      '--theme-border': '#334155',
      '--theme-text-main': '#f8fafc',
      '--theme-text-muted': '#94a3b8',
      '--theme-primary': '#2563eb',
      '--theme-primary-hover': '#1d4ed8',
    }
  },
  light: {
    name: 'Light Mode',
    variables: {
      '--theme-bg-app': '#f1f5f9',
      '--theme-bg-nav': '#ffffff',
      '--theme-bg-panel': '#ffffff',
      '--theme-border': '#e2e8f0',
      '--theme-text-main': '#0f172a',
      '--theme-text-muted': '#64748b',
      '--theme-primary': '#3b82f6',
      '--theme-primary-hover': '#2563eb',
    }
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'antigravity';
  });

  useEffect(() => {
    const themeParams = themes[currentTheme]?.variables || themes.antigravity.variables;
    
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
