'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({ children, onClick, className, style, ...props }: CardProps) {
  const { colors, isDark } = useTheme();

  return (
    <div
      {...props}
      className={className}
      onClick={onClick}
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '1rem',
        padding: '1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'all 0.2s ease' : 'none',
        boxShadow: isDark ? '0 16px 44px rgba(0,0,0,0.18)' : '0 12px 34px rgba(14,35,48,0.08)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
