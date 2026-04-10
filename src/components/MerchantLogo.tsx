'use client';
/**
 * MerchantLogo — shows a real company logo if available, falls back to CategoryIcon.
 * Website mirror of mobile _KeiprApp/src/components/MerchantLogo.tsx
 *
 * Uses Clearbit Logo API for high-quality logos.
 * Graceful fallback: no internet, no domain mapping, or image fails → CategoryIcon.
 */
import { useState } from 'react';
import CategoryIcon from './CategoryIcon';
import { getMerchantLogoUrl } from '@/lib/merchantLogos';

interface Props {
  billName: string;
  category: string;
  size?: number;
  iconScale?: number;
  isDark: boolean;
}

export default function MerchantLogo({ billName, category, size = 30, iconScale, isDark }: Props) {
  const logoUrl = getMerchantLogoUrl(billName);
  const [logoFailed, setLogoFailed] = useState(false);

  // No known domain or logo failed to load → silent fallback to category icon
  if (!logoUrl || logoFailed) {
    return <CategoryIcon category={category} size={size} iconScale={iconScale} isDark={isDark} />;
  }

  const borderRadius = Math.round(size * 0.23);
  const imgSize = Math.round(size * 0.7);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      borderRadius,
      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={`${billName} logo`}
        width={imgSize}
        height={imgSize}
        style={{ borderRadius: Math.round(size * 0.12), objectFit: 'contain' }}
        onError={() => setLogoFailed(true)}
      />
    </span>
  );
}
