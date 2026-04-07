'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface EmptyStateProps {
  icon: 'bills' | 'tracker' | 'plan' | 'banking' | 'income' | 'general';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Inline SVG illustrations for each empty state type.
 * Uses theme-aware colors for consistency.
 */
function EmptyIcon({ type, colors, isDark }: { type: string; colors: any; isDark: boolean }) {
  const muted = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const accent = colors.electric;
  const stroke = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';

  const svgProps = { width: 64, height: 64, viewBox: '0 0 24 24', fill: 'none', strokeWidth: 1.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (type) {
    case 'bills':
      return (
        <div style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg {...svgProps} stroke={stroke}>
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="9" y1="7" x2="15" y2="7" />
            <line x1="9" y1="11" x2="15" y2="11" />
            <line x1="9" y1="15" x2="12" y2="15" />
            <circle cx="16" cy="18" r="4" fill={accent} stroke={accent} opacity="0.25" />
            <path d="M14.5 18h3M16 16.5v3" stroke={accent} strokeWidth="1.5" />
          </svg>
        </div>
      );
    case 'tracker':
      return (
        <div style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg {...svgProps} stroke={stroke}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" stroke={accent} strokeWidth="1.8" />
          </svg>
        </div>
      );
    case 'plan':
      return (
        <div style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg {...svgProps} stroke={stroke}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke={accent} strokeWidth="2" />
          </svg>
        </div>
      );
    case 'banking':
      return (
        <div style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg {...svgProps} stroke={stroke}>
            <line x1="3" y1="22" x2="21" y2="22" />
            <path d="m2 10 10-7 10 7" />
            <rect x="6" y="12" width="3" height="8" rx="0.5" fill={accent} opacity="0.2" />
            <rect x="10.5" y="12" width="3" height="8" rx="0.5" fill={accent} opacity="0.15" />
            <rect x="15" y="12" width="3" height="8" rx="0.5" fill={accent} opacity="0.1" />
          </svg>
        </div>
      );
    case 'income':
      return (
        <div style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg {...svgProps} stroke={stroke}>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke={accent} strokeWidth="1.5" />
          </svg>
        </div>
      );
    default:
      return (
        <div style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg {...svgProps} stroke={stroke}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
      );
  }
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors, isDark } = useTheme();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
    }}>
      <EmptyIcon type={icon} colors={colors} isDark={isDark} />
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: colors.text,
        marginTop: '20px',
        marginBottom: '8px',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '13px',
        color: colors.textMuted,
        maxWidth: '320px',
        lineHeight: '1.5',
        marginBottom: actionLabel ? '20px' : '0',
      }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: colors.midnight,
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
