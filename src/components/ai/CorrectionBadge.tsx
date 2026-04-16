'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface CorrectionBadgeProps {
  correctionCount: number;
  onClick: (e: React.MouseEvent) => void;
}

export default function CorrectionBadge({ correctionCount, onClick }: CorrectionBadgeProps) {
  const { colors } = useTheme();

  if (correctionCount === 0) return null;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.5rem',
        backgroundColor: '#9C5EFA20',
        color: '#9C5EFA',
        border: 'none',
        borderRadius: '0.25rem',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        marginLeft: '0.5rem',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '#9C5EFA30';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '#9C5EFA20';
      }}
      title={`${correctionCount} AI correction${correctionCount !== 1 ? 's' : ''}`}
    >
      <span>✨</span>
      <span>{correctionCount}</span>
    </button>
  );
}
