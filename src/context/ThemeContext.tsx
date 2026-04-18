'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'system' | 'dark' | 'light';

const darkColors = {
  background: '#1A1814',
  card: '#2A2724',
  cardBg: '#22201D',
  cardHover: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(232,229,220,0.06)',
  text: '#E8E5DC',
  textSub: 'rgba(232,229,220,0.85)',
  textMuted: 'rgba(232,229,220,0.6)',
  textFaint: 'rgba(232,229,220,0.4)',
  electric: '#38BDF8',
  aiAccent: '#9C5EFA',
  midnight: '#0C4A6E',
  green: '#34D399',
  amber: '#F59E0B',
  red: '#F87171',
  inputBg: '#2A2724',
  inputBorder: 'rgba(232,229,220,0.15)',
  divider: 'rgba(255,255,255,0.06)',
  navBg: '#1A1814',
  navIcon: 'rgba(255,255,255,0.6)',
  navActive: '#38BDF8',
  placeholder: 'rgba(232,229,220,0.3)',
  progressTrack: 'rgba(255,255,255,0.08)',
};

const lightColors = {
  background: '#F5F3EF',
  card: '#FFFFFF',
  cardBg: '#F0EDE7',
  cardHover: 'rgba(0,0,0,0.03)',
  cardBorder: 'rgba(0,0,0,0.08)',
  text: '#1A1814',
  textSub: 'rgba(26,24,20,0.75)',
  textMuted: 'rgba(26,24,20,0.55)',
  textFaint: 'rgba(26,24,20,0.35)',
  electric: '#0C4A6E',
  aiAccent: '#9C5EFA',
  midnight: '#0C4A6E',
  green: '#0A7B6C',
  amber: '#854F0B',
  red: '#A32D2D',
  inputBg: '#EEEAE4',
  inputBorder: 'rgba(26,24,20,0.15)',
  divider: 'rgba(0,0,0,0.06)',
  navBg: '#FFFFFF',
  navIcon: 'rgba(26,24,20,0.5)',
  navActive: '#0C4A6E',
  placeholder: 'rgba(26,24,20,0.3)',
  progressTrack: 'rgba(0,0,0,0.08)',
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
