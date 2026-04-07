'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

/**
 * Shimmer pulse animation via inline keyframes.
 * Renders a pulsing rounded rectangle as a placeholder for loading content.
 */
function Bone({ width = '100%', height = 16, radius = 8, style = {} }: {
  width?: string | number;
  height?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  const { colors, isDark } = useTheme();
  const base = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const shimmer = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';

  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${base} 25%, ${shimmer} 50%, ${base} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

/** Card-shaped skeleton with header + rows */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
      <Bone width="40%" height={14} style={{ marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: 12 }}>
          <Bone width={40} height={40} radius={10} />
          <div style={{ flex: 1 }}>
            <Bone width="70%" height={12} style={{ marginBottom: 6 }} />
            <Bone width="45%" height={10} />
          </div>
          <Bone width={60} height={12} style={{ alignSelf: 'center' }} />
        </div>
      ))}
    </div>
  );
}

/** Dashboard-style skeleton: summary cards + list */
export function DashboardSkeleton() {
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <Bone width="50%" height={24} style={{ marginBottom: 8 }} />
      <Bone width="30%" height={12} style={{ marginBottom: 24 }} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <Bone width={100} height={36} radius={20} />
        <Bone width={100} height={36} radius={20} />
        <Bone width={100} height={36} radius={20} />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ padding: 16 }}>
            <Bone width="60%" height={10} style={{ marginBottom: 8 }} />
            <Bone width="80%" height={20} />
          </div>
        ))}
      </div>

      {/* Bill rows */}
      <CardSkeleton rows={5} />
    </div>
  );
}

/** Bills page skeleton */
export function BillsSkeleton() {
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <Bone width="30%" height={24} />
        <Bone width={120} height={36} radius={8} />
      </div>
      <Bone width="100%" height={40} radius={8} style={{ marginBottom: 20 }} />
      <CardSkeleton rows={4} />
      <CardSkeleton rows={3} />
    </div>
  );
}

/** Tracker page skeleton */
export function TrackerSkeleton() {
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <Bone width="40%" height={24} style={{ marginBottom: 8 }} />
      <Bone width="60%" height={12} style={{ marginBottom: 24 }} />

      {/* Period selector */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
        <Bone width={32} height={32} radius={16} />
        <Bone width={180} height={20} style={{ alignSelf: 'center' }} />
        <Bone width={32} height={32} radius={16} />
      </div>

      {/* Progress bar */}
      <Bone width="100%" height={8} radius={4} style={{ marginBottom: 24 }} />

      {/* Bill checklist */}
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', alignItems: 'center' }}>
          <Bone width={24} height={24} radius={6} />
          <div style={{ flex: 1 }}>
            <Bone width="55%" height={12} style={{ marginBottom: 4 }} />
            <Bone width="30%" height={10} />
          </div>
          <Bone width={70} height={14} />
        </div>
      ))}
    </div>
  );
}

/** Settings page skeleton */
export function SettingsSkeleton() {
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <Bone width="30%" height={24} style={{ marginBottom: 24 }} />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ padding: '16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Bone width={32} height={32} radius={8} />
              <Bone width={140} height={14} />
            </div>
            <Bone width={20} height={20} radius={4} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Global skeleton shimmer keyframes — inject once */
export function SkeletonStyles() {
  return (
    <style>{`
      @keyframes skeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
}
