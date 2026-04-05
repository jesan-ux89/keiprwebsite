'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({ children, onClick, className, style, ...props }: CardProps) {
  const { colors } = useTheme();

  return (
    <div
      {...props}
      className={className}
      onClick={onClick}
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '0.75rem',
        padding: '1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'all 0.2s ease' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
