'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'system' | 'dark' | 'light';

const darkColors = {
  background: '#15130F',
  card: '#221F1A',
  cardBg: '#2A2620',
  cardHover: 'rgba(255,255,255,0.045)',
  cardBorder: 'rgba(236,231,219,0.08)',
  text: '#EEE9DE',
  textSub: 'rgba(238,233,222,0.85)',
  textMuted: 'rgba(238,233,222,0.62)',
  textFaint: 'rgba(238,233,222,0.38)',
  electric: '#38BDF8',
  aiAccent: '#9C5EFA',
  midnight: '#0C4A6E',
  green: '#34D399',
  amber: '#F59E0B',
  red: '#F87171',
  inputBg: '#2A2724',
  inputBorder: 'rgba(232,229,220,0.15)',
  divider: 'rgba(236,231,219,0.08)',
  navBg: '#171510',
  navIcon: 'rgba(255,255,255,0.62)',
  navActive: '#38BDF8',
  placeholder: 'rgba(232,229,220,0.3)',
  progressTrack: 'rgba(255,255,255,0.08)',
};

const lightColors = {
  background: '#EEF3F5',
  card: '#FFFFFF',
  cardBg: '#F4F0E7',
  cardHover: 'rgba(14,35,48,0.045)',
  cardBorder: 'rgba(14,35,48,0.12)',
  text: '#10202B',
  textSub: 'rgba(16,32,43,0.78)',
  textMuted: 'rgba(16,32,43,0.68)',
  textFaint: 'rgba(16,32,43,0.42)',
  electric: '#006B99',
  aiAccent: '#9C5EFA',
  midnight: '#0C4A6E',
  green: '#0A7B6C',
  amber: '#9B5F00',
  red: '#A32D2D',
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(14,35,48,0.16)',
  divider: 'rgba(14,35,48,0.10)',
  navBg: '#10202B',
  navIcon: 'rgba(255,255,255,0.68)',
  navActive: '#7DD3FC',
  placeholder: 'rgba(16,32,43,0.32)',
  progressTrack: 'rgba(14,35,48,0.10)',
};

export type Colors = typeof darkColors;

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: Colors;
}

const THEME_STORAGE_KEY = 'keipr_theme_mode';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: true,
  colors: darkColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemDark, setSystemDark] = useState(true);

  // Load saved theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        setThemeModeState(saved);
      }
    } catch {}
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Persist theme when changed
  function setThemeMode(mode: ThemeMode) {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {}
  }

  const isDark = themeMode === 'system' ? systemDark : themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export { darkColors, lightColors };
