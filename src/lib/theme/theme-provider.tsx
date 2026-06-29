'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    'card-foreground': string;
    border: string;
    input: string;
    ring: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resetTheme: () => void;
  isDark: boolean;
  toggleDarkMode: () => void;
}

const defaultTheme: Theme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6366F1',
    accent: '#8B5CF6',
    background: '#FFFFFF',
    foreground: '#111827',
    card: '#FFFFFF',
    'card-foreground': '#111827',
    border: '#E5E7EB',
    input: '#F3F4F6',
    ring: '#3B82F6',
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
};

const darkTheme: Theme = {
  ...defaultTheme,
  colors: {
    primary: '#60A5FA',
    secondary: '#818CF8',
    accent: '#A78BFA',
    background: '#111827',
    foreground: '#F9FAFB',
    card: '#1F2937',
    'card-foreground': '#F9FAFB',
    border: '#374151',
    input: '#374151',
    ring: '#60A5FA',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';

    if (savedTheme) {
      try {
        setThemeState(JSON.parse(savedTheme));
      } catch {
        setThemeState(defaultTheme);
      }
    }

    setIsDark(savedDarkMode);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', JSON.stringify(newTheme));
    applyThemeToDOM(newTheme);
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    setIsDark(false);
    localStorage.removeItem('theme');
    localStorage.removeItem('darkMode');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));

    if (newDarkMode) {
      setTheme(darkTheme);
    } else {
      setTheme(defaultTheme);
    }
  };

  const applyThemeToDOM = (currentTheme: Theme) => {
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    Object.entries(currentTheme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    Object.entries(currentTheme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    Object.entries(currentTheme.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
  };

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme, isDark, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export const themePresets: Record<string, Theme> = {
  default: defaultTheme,
  dark: darkTheme,
  ocean: {
    ...defaultTheme,
    colors: {
      primary: '#0EA5E9',
      secondary: '#06B6D4',
      accent: '#14B8A6',
      background: '#F0F9FF',
      foreground: '#0C4A6E',
      card: '#FFFFFF',
      'card-foreground': '#0C4A6E',
      border: '#BAE6FD',
      input: '#E0F2FE',
      ring: '#0EA5E9',
    },
  },
  forest: {
    ...defaultTheme,
    colors: {
      primary: '#22C55E',
      secondary: '#16A34A',
      accent: '#15803D',
      background: '#F0FDF4',
      foreground: '#14532D',
      card: '#FFFFFF',
      'card-foreground': '#14532D',
      border: '#BBF7D0',
      input: '#DCFCE7',
      ring: '#22C55E',
    },
  },
  sunset: {
    ...defaultTheme,
    colors: {
      primary: '#F97316',
      secondary: '#EA580C',
      accent: '#DC2626',
      background: '#FFF7ED',
      foreground: '#7C2D12',
      card: '#FFFFFF',
      'card-foreground': '#7C2D12',
      border: '#FED7AA',
      input: '#FFEDD5',
      ring: '#F97316',
    },
  },
};
