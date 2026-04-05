'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  const { colors } = useTheme();

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: colors.text,
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '0.75rem',
          backgroundColor: colors.inputBg,
          border: `1px solid ${error ? colors.red : colors.inputBorder}`,
          borderRadius: '0.5rem',
          color: colors.text,
          fontSize: '1rem',
          transition: 'border-color 0.2s ease',
          boxSizing: 'border-box',
          ...props.style,
        }}
      />
      {error && (
        <p
          style={{
            marginTop: '0.25rem',
            fontSize: '0.875rem',
            color: colors.red,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
