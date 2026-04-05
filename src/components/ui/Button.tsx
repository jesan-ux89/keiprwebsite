'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  style: externalStyle,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.electric,
          color: '#FFFFFF',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: colors.card,
          color: colors.text,
          border: `1px solid ${colors.cardBorder}`,
        };
      case 'danger':
        return {
          backgroundColor: colors.red,
          color: '#FFF',
          border: 'none',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: colors.text,
          border: 'none',
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          borderRadius: '0.375rem',
        };
      case 'md':
        return {
          padding: '0.75rem 1rem',
          fontSize: '1rem',
          borderRadius: '0.5rem',
        };
      case 'lg':
        return {
          padding: '1rem 1.5rem',
          fontSize: '1.125rem',
          borderRadius: '0.75rem',
        };
      default:
        return {};
    }
  };

  const baseStyles: React.CSSProperties = {
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.2s ease',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...externalStyle,
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={baseStyles}
    >
      {loading && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            animation: 'spin 1s linear infinite',
          }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )}
      {children}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
