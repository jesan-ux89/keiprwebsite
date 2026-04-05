'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    wrapper: {
      width: '100%',
      maxWidth: '420px',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '40px',
    },
    logo: {
      fontSize: '32px',
      fontWeight: '700',
      color: colors.midnight,
      marginBottom: '8px',
      letterSpacing: '-0.5px',
    },
    tagline: {
      fontSize: '14px',
      color: colors.textMuted,
      fontWeight: '400',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: '12px',
      border: `1px solid ${colors.cardBorder}`,
      padding: '40px 32px',
      boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div style={styles.logo}>Keipr</div>
          <p style={styles.tagline}>Pay-cycle budgeting made simple</p>
        </div>
        <div style={styles.card}>{children}</div>
      </div>
    </div>
  );
}
